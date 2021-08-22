const { ProcessHandler, ProcessFactory } = require('@ah/core').ProcessManager;
const { RetrieveStatus, DeployStatus, RetrieveResult, SFDXProjectResult, BulkStatus, AuthOrg, MetadataType, MetadataObject, ProgressStatus } = require('@ah/core').Types;
const { OSUtils, Utils, MathUtils, StrUtils, Validator, MetadataUtils, ProjectUtils } = require('@ah/core').CoreUtils;
const { MetadataTypes, NotIncludedMetadata, SpecialMetadata, ProgressStages } = require('@ah/core').Values;
const { FileChecker, FileReader, FileWriter, PathUtils } = require('@ah/core').FileSystem;
const { OperationNotAllowedException, ConnectionException } = require('@ah/core').Exceptions;
const TypesFactory = require('@ah/metadata-factory');
const PackageGenerator = require('@ah/package-generator');
const XMLCompressor = require('@ah/xml-compressor');
const { XMLParser, XMLUtils } = require('@ah/languages').XML;

const PROJECT_NAME = 'TempProject';

const METADATA_QUERIES = {
    Report: 'Select Id, DeveloperName, NamespacePrefix, FolderName from Report',
    Dashboard: 'Select Id, DeveloperName, NamespacePrefix, FolderId from Dashboard',
    Document: 'Select Id, DeveloperName, NamespacePrefix, FolderId from Document',
    EmailTemplate: 'Select Id, DeveloperName, NamespacePrefix, FolderId FROM EmailTemplate'
}
const SUBFOLDER_BY_METADATA_TYPE = {
    RecordType: 'recordTypes'
}

/**
 * Class to connect with Salesforce to list or describe metadata types, list or describe all SObjects, make queries, create SFDX Project, validate, 
 * deploy or retrieve in SFDX and Metadata API Formats, export and import data and much more. 
 * Is used to Aura Helper and Aura Helper CLI to support salesfore conections.
 * 
 * The setters methods are defined like a builder pattern to make it more usefull
 * 
 * All connection methods return a Promise with the associated data to the processes. 
 */
class Connection {

    /**
     * Constructor to create a new connection object
     * @param {String} usernameOrAlias Org Username or Alias to connect. (Must be authorized in the system)
     * @param {String | Number} apiVersion API Version number to connect with salesforce
     * @param {String} projectFolder Path to the project root folder
     * @param {String} namespacePrefix Namespace prefix from the Org to connect
     */
    constructor(usernameOrAlias, apiVersion, projectFolder, namespacePrefix) {
        this.usernameOrAlias = usernameOrAlias;
        this.apiVersion = apiVersion;
        this.projectFolder = (projectFolder !== undefined) ? PathUtils.getAbsolutePath(projectFolder) : projectFolder;
        this.namespacePrefix = (namespacePrefix !== undefined) ? namespacePrefix : '';
        this.multiThread = false;
        if (!Utils.isNull(this.projectFolder)) {
            this.packageFolder = this.projectFolder + '/manifest';
            this.packageFile = this.projectFolder + '/manifest/package.xml';
        }
        this._processes = {};
        this._inProgress = false;
        this._percentage = 0;
        this._increment = 0;
        this._abort = false;
        this._allowConcurrence = false;
        this._abortCallback = undefined;
        this._progressCallback = undefined;
    }

    /**
     * Method to set the Username or Alias to connect with org
     * @param {String} usernameOrAlias Org Username or Alias to connect. (Must be authorized in the system)
     * 
     * @returns {Connection} Returns the connection object
     */
    setUsernameOrAlias(usernameOrAlias) {
        this.usernameOrAlias = usernameOrAlias;
        return this;
    }

    /**
     * Method to set the API Version to connect
     * @param {String | Number} apiVersion API Version number to connect with salesforce
     * 
     * @returns {Connection} Returns the connection object
     */
    setApiVersion(apiVersion) {
        this.apiVersion = apiVersion;
        return this;
    }

    /**
     * Method to set the project root folder path. When set the project root, automatically set the packageFolder and packageFile to their respective paths
     * @param {String} projectFolder Path to the project root folder
     * 
     * @returns {Connection} Returns the connection object
     */
    setProjectFolder(projectFolder) {
        this.projectFolder = (projectFolder !== undefined) ? PathUtils.getAbsolutePath(projectFolder) : projectFolder;
        this.packageFolder = this.projectFolder + '/manifest';
        this.packageFile = this.projectFolder + '/manifest/package.xml';
        return this;
    }

    /**
     * Method to set the package folder path. When set the package folder, automatically set packageFile to the respective path
     * @param {String} packageFile Path to the package folder
     * 
     * @returns {Connection} Returns the connection object
     */
    setPackageFolder(packageFolder) {
        this.packageFolder = (packageFolder !== undefined) ? PathUtils.getAbsolutePath(packageFolder) : packageFolder;
        this.packageFile = this.projectFolder + '/manifest/package.xml';
        return this;
    }

    /**
     * Method to set the package xml file path
     * @param {String} packageFile Path to the package file
     * 
     * @returns {Connection} Returns the connection object
     */
    setPackageFile(packageFile) {
        this.packageFile = (packageFile !== undefined) ? PathUtils.getAbsolutePath(packageFile) : packageFile;
        return this;
    }

    /**
     * Method to set the Org namespace prefix
     * @param {String} namespacePrefix Namespace prefix from the Org to connect
     * 
     * @returns {Connection} Returns the connection object
     */
    setNamespacePrefix(namespacePrefix) {
        this.namespacePrefix = (namespacePrefix !== undefined) ? namespacePrefix : '';
        return this;
    }

    /**
     * Method to able to the connection object to use several threads and processor cores to run some processes and run faster
     * 
     * @returns {Connection} Returns the connection object
     */
    setMultiThread() {
        this.multiThread = true;
        return this;
    }

    /**
     * Method to set the connection object to use only one thread and processo core to all processes
     * 
     * @returns {Connection} Returns the connection object
     */
    setSingleThread() {
        this.multiThread = false;
        return this;
    }

    /**
     * Method to handle the general connection progress (is called from all methods to handle the progress)
     * @param {Function} progressCallback Callback function to handle the progress
     */
    onProgress(progressCallback) {
        this._progressCallback = progressCallback;
        return this;
    }

    /**
     * Method to handle when connection is aborted
     * @param {Function} abortCallback Callback function to call when connectin is aborted
     */
    onAbort(abortCallback) {
        this._abortCallback = abortCallback;
        return this;
    }

    /**
     * Method to abort all connection running processes. When finishes call onAbort() callback
     */
    abortConnection() {
        this._abort = true;
        killProcesses(this);
        if (this._abortCallback)
            this._abortCallback.call(this);
    }

    /**
     * Method to get the Auth Username from the org (If not found username, return the Alias)
     * 
     * @returns {Promise<String>} Return a String promise with the Username or Alias data
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     */
    getAuthUsername() {
        startOperation(this);
        return new Promise(async (resolve, reject) => {
            try {
                this._allowConcurrence = true;
                const authOrgs = await this.listAuthOrgs();
                let username;
                if (authOrgs && authOrgs.length > 0) {
                    const defaultUsername = this.usernameOrAlias || ProjectUtils.getOrgAlias(this.projectFolder);
                    for (const authOrg of authOrgs) {
                        if (defaultUsername.indexOf('@') !== -1) {
                            if (authOrg.username && authOrg.username.toLowerCase().trim() === defaultUsername.toLowerCase().trim())
                                username = authOrg.username;
                        } else {
                            if (authOrg.alias && authOrg.alias.toLowerCase().trim() === defaultUsername.toLowerCase().trim())
                                username = authOrg.username;
                        }
                        if (!username && ((authOrg.username && authOrg.username.toLowerCase().trim() === defaultUsername.toLowerCase().trim()) || (authOrg.alias && authOrg.alias.toLowerCase().trim() === defaultUsername.toLowerCase().trim())))
                            username = authOrg.username;
                    }
                    this._allowConcurrence = false;
                    endOperation(this);
                    resolve(username);
                } else {
                    this._allowConcurrence = false;
                    endOperation(this);
                    resolve(undefined);
                }
            } catch (error) {
                this._allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to get the server instance for an username or alias (or the connection username or alias)
     * @param {String} usernameOrAlias Username or alias to check. (If not provided, use usernameOrAlias from connection object)
     * 
     * @returns {Promise<String>} Return a String promise with the instance URL
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     */
    getServerInstance(usernameOrAlias) {
        usernameOrAlias = usernameOrAlias || this.usernameOrAlias;
        startOperation(this);
        return new Promise(async (resolve, reject) => {
            try {
                this._allowConcurrence = true;
                const authOrgs = await this.listAuthOrgs();
                let inbstanceUrl;
                if (authOrgs && authOrgs.length > 0) {
                    for (const authOrg of authOrgs) {
                        if ((usernameOrAlias.indexOf('@') !== -1 && authOrg.username === usernameOrAlias) || (usernameOrAlias.indexOf('@') === -1 && authOrg.alias === usernameOrAlias)) {
                            inbstanceUrl = authOrg.instanceUrl;
                            break;
                        }
                    }
                    this._allowConcurrence = false;
                    endOperation(this);
                    resolve(inbstanceUrl);
                } else {
                    this._allowConcurrence = false;
                    endOperation(this);
                    resolve(undefined);
                }
            } catch (error) {
                this._allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to list all auth org on the system
     * 
     * @returns {Promise<Array<AuthOrg>>} Return a promise with all authorized org in the system 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     */
    listAuthOrgs() {
        startOperation(this);
        return new Promise((resolve, reject) => {
            try {
                const process = ProcessFactory.listAuthOurgs();
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const orgs = (response !== undefined) ? response.result : undefined;
                        const authOrgs = createAuthOrgs(orgs);
                        endOperation(this);
                        resolve(authOrgs);
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to execute a query to the connected org
     * @param {String} query Query to execute (Required)
     * @param {Boolean} useToolingApi true to use Tooling API to execute the query
     * 
     * @returns {Promise<Array<Object>>} Return a promise with the record list 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     */
    query(query, useToolingApi) {
        startOperation(this);
        return new Promise((resolve, reject) => {
            try {
                const process = ProcessFactory.query(this.usernameOrAlias, query, useToolingApi);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const records = (response !== undefined) ? Utils.forceArray(response.result.records) : [];
                        endOperation(this);
                        resolve(records);
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to list all Metadata Types available in the connected org (according selected API Version)
     * 
     * @returns {Promise<Array<MetadataDetail>>} Return a promise with the MetadataDetail objects from all available Metadata Types
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    listMetadataTypes() {
        startOperation(this);
        return new Promise((resolve, reject) => {
            try {
                const process = ProcessFactory.listMetadataTypes(this.usernameOrAlias, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const objects = (response !== undefined) ? response.result.metadataObjects : undefined;
                        const metadataDetails = TypesFactory.createMetadataDetails(objects);
                        endOperation(this);
                        resolve(metadataDetails);
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to describe all or selected Metadata Types from the connected org
     * @param {Arra<String> | Array<MetadataDetail>} typesOrDetails List of Metadata Type API Names or Metadata Details to describe (undefined to describe all metadata types)
     * @param {Boolean} downloadAll true to download all Metadata Types from the connected org, false to download only the org namespace Metadata Types
     * @param {Function} callback Optional callback function parameter to handle download progress. If provide function progress callback, it will be execute instead connection progress callback
     * 
     * @returns {Promise<Array<Object>>} Return a promise with Metadata JSON Object with the selected Metadata Types to describe
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     */
    describeMetadataTypes(typesOrDetails, downloadAll) {
        const progressCallback = getCallback(arguments, this);
        startOperation(this);
        resetProgress(this);
        return new Promise(async (resolve, reject) => {
            try {
                this._allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(typesOrDetails);
                this._increment = calculateIncrement(metadataToProcess);
                callProgressCalback(progressCallback, this, ProgressStages.PREPARE);
                let foldersByType;
                if (metadataToProcess.includes(MetadataTypes.REPORT) || metadataToProcess.includes(MetadataTypes.DASHBOARD) || metadataToProcess.includes(MetadataTypes.EMAIL_TEMPLATE) || metadataToProcess.includes(MetadataTypes.DOCUMENT)) {
                    foldersByType = await getFoldersByType(this);
                }
                let metadata = {};
                const batchesToProcess = getBatches(this, metadataToProcess);
                for (const batch of batchesToProcess) {
                    downloadMetadata(this, batch.records, downloadAll, foldersByType, progressCallback).then((downloadedMetadata) => {
                        Object.keys(downloadedMetadata).forEach(function (key) {
                            metadata[key] = downloadedMetadata[key];
                        });
                        batch.completed = true;
                        let nCompleted = 0;
                        for (const resultBatch of batchesToProcess) {
                            if (resultBatch.completed)
                                nCompleted++;
                        }
                        if (nCompleted === batchesToProcess.length) {
                            metadata = MetadataUtils.orderMetadata(metadata);
                            this._allowConcurrence = false;
                            endOperation(this);
                            resolve(metadata);
                            return;
                        }
                    }).catch((error) => {
                        this._allowConcurrence = false;
                        endOperation(this);
                        reject(error);
                    });
                }
            } catch (error) {
                this._allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to list all SObjects API Name by category
     * @param {String} category Object Category. Values are: Standard, Custom, All. (All by default) 
     * 
     * @returns {Promise<Array<String>>} Return a promise with a list with the sObject names 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    listSObjects(category) {
        startOperation(this);
        return new Promise((resolve, reject) => {
            try {
                const process = ProcessFactory.listSObjects(this.usernameOrAlias, category, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const objects = (response !== undefined) ? response.result : [];
                        endOperation(this);
                        resolve(objects);
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to describe SObject data to the specified objects
     * @param {Array<String>} sObjects List with the object API Names to describe
     * @param {Function} callback Optional callback function parameter to handle download progress. If provide function progress callback, it will be execute instead connection progress callback
     * 
     * @returns {Promise<Array<SObject>>} Return a promise with a SObjects data
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     */
    describeSObjects(sObjects) {
        const progressCallback = getCallback(arguments, this);
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                this._increment = calculateIncrement(sObjects);
                callProgressCalback(progressCallback, this, ProgressStages.PREPARE);
                let resultObjects = {};
                sObjects = Utils.forceArray(sObjects);
                const batchesToProcess = getBatches(this, sObjects);
                for (const batch of batchesToProcess) {
                    downloadSObjectsData(this, batch.records).then((downloadedSObjects) => {
                        Object.keys(downloadedSObjects).forEach(function (key) {
                            resultObjects[key] = downloadedSObjects[key];
                        });
                        batch.completed = true;
                        let nCompleted = 0;
                        for (const resultBatch of batchesToProcess) {
                            if (resultBatch.completed)
                                nCompleted++;
                        }
                        if (nCompleted === batchesToProcess.length) {
                            resultObjects = MetadataUtils.orderSObjects(resultObjects);
                            endOperation(this);
                            resolve(resultObjects);
                            return;
                        }
                    }).catch((error) => {
                        endOperation(this);
                        reject(error);
                    });
                }
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to retrieve data using the connection package file. You can choose to retrieve as Metadata API format or Source Format
     * @param {Boolean} useMetadataAPI True to use Metadata API format, false to use source format
     * @param {String} targetDir Path to the target dir when retrieve with Metadata API Format
     * @param {String | Number} waitMinutes Number of minutes to wait for the command to complete and display results
     *  
     * @returns {Promise<RetrieveResult>} Return a promise with the RetrieveResult object with the retrieve result 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the project folder or target dir is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the project folder or target dir not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the project folder or target dir is not a directory
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    retrieve(useMetadataAPI, targetDir, waitMinutes) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                let process;
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                if (useMetadataAPI) {
                    targetDir = Validator.validateFolderPath(targetDir);
                    const packageFolder = Validator.validateFolderPath(this.packageFolder);
                    process = ProcessFactory.mdapiRetrievePackage(this.usernameOrAlias, packageFolder, projectFolder, targetDir, this.apiVersion, waitMinutes);
                } else {
                    const packageFile = Validator.validateFilePath(this.packageFile);
                    process = ProcessFactory.sourceRetrievePackage(this.usernameOrAlias, packageFile, projectFolder, this.apiVersion, waitMinutes);
                }
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, async () => {
                        const status = (response !== undefined) ? new RetrieveResult(response.result) : undefined;
                        endOperation(this);
                        resolve(status);
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Retrieve report when use Metadata API to retrieve data
     * @param {String} retrieveId Retrieve Id to get the report (Required)
     * @param {String} targetDir Path to the target dir (Required)
     * 
     * @returns {Promise<RetrieveStatus>} Return a promise with the RetrieveStatus object with the retrieve status result
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the target dir is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the target dir not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the target dir is not a directory
     */
    retrieveReport(retrieveId, targetDir) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                this._allowConcurrence = true;
                targetDir = Validator.validateFolderPath(targetDir);
                let process = ProcessFactory.mdapiRetrieveReport(this.usernameOrAlias, retrieveId, targetDir);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const status = (response !== undefined) ? new RetrieveStatus(response.result) : undefined;
                        this._allowConcurrence = false;
                        endOperation(this);
                        resolve(status);
                    });
                }).catch((error) => {
                    this._allowConcurrence = false;
                    if (error.message && error.message.indexOf('Retrieve result has been deleted') != -1) {
                        resolve(new RetrieveStatus(retrieveId, 'Succeeded', true, true));
                    }
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                this._allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to validate a deploy against the org using the connection package file
     * @param {String} testLevel Level of deployment tests to run. Values are 'NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'
     * @param {String | Array<String>} runTests String with comma separated test names to execute or list with the test names to execute
     * @param {Boolean} useMetadataAPI True to validate deploy using Metadata API Format, false to use Source Format
     * @param {String | Number} waitMinutes Number of minutes to wait for the command to complete and display results
     * 
     * @returns {Promise<DeployStatus>} Return a promise with the DeployStatus object with the deploy status result 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the project folder or package folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the project folder or package folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the project folder or package folder is not a directory
     * @throws {WrongFilePathException} If the package file is not a String or can't convert to absolute path
     * @throws {FileNotFoundException} If the package file not exists or not have access to it
     * @throws {InvalidFilePathException} If the package file is not a file
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    validateDeploy(testLevel, runTests, useMetadataAPI, waitMinutes) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            if (runTests && Array.isArray(runTests))
                runTests = runTests.join(',');
            try {
                let process;
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                if (useMetadataAPI) {
                    const packageFolder = Validator.validateFolderPath(this.packageFolder);
                    process = ProcessFactory.mdapiValidatePackage(this.usernameOrAlias, packageFolder, projectFolder, testLevel, runTests, this.apiVersion, waitMinutes);
                } else {
                    const packageFile = Validator.validateFilePath(this.packageFile);
                    process = ProcessFactory.sourceValidatePackage(this.usernameOrAlias, packageFile, projectFolder, testLevel, runTests, this.apiVersion, waitMinutes);
                }
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const validationId = (response !== undefined) ? new DeployStatus(response.result) : undefined;
                        endOperation(this);
                        resolve(validationId);
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to deploy data to the org using the connection package file
     * @param {String} testLevel Level of deployment tests to run. Values are 'NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'
     * @param {String | Array<String>} runTests String with comma separated test names to execute or list with the test names to execute
     * @param {Boolean} useMetadataAPI True to Deploy data using Metadata API Format, false to use Source Format
     * @param {String | Number} waitMinutes Number of minutes to wait for the command to complete and display results
     * 
     * @returns {Promise<DeployStatus>} Return a promise with the DeployStatus object with the deploy status result 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the project folder or package folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the project folder or package folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the project folder or package folder is not a directory
     * @throws {WrongFilePathException} If the package file is not a String or can't convert to absolute path
     * @throws {FileNotFoundException} If the package file not exists or not have access to it
     * @throws {InvalidFilePathException} If the package file is not a file
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    deploy(testLevel, runTests, useMetadataAPI, waitMinutes) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                let process;
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                if (useMetadataAPI) {
                    const packageFolder = Validator.validateFolderPath(this.packageFolder);
                    process = ProcessFactory.mdapiDeployPackage(this.usernameOrAlias, packageFolder, projectFolder, testLevel, runTests, this.apiVersion, waitMinutes);
                } else {
                    const packageFile = Validator.validateFilePath(this.packageFile);
                    process = ProcessFactory.sourceDeployPackage(this.usernameOrAlias, packageFile, projectFolder, testLevel, runTests, this.apiVersion, waitMinutes);
                }
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const status = (response !== undefined) ? new DeployStatus(response.result) : undefined;
                        endOperation(this);
                        resolve(status);
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to execute a quick deploy when validation result is success
     * @param {String} deployId Id to deploy the validated deployment (Required)
     * @param {Boolean} useMetadataAPI True to execute quick deploy using Metadata API Format, false to use Source Format
     * 
     * @returns {Promise<DeployStatus>} Return a promise with the DeployStatus object with the deploy status result 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the project folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the project folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the project folder is not a directory
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    quickDeploy(deployId, useMetadataAPI) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                let process;
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                if (useMetadataAPI) {
                    process = ProcessFactory.mdapiQuickDeploy(this.usernameOrAlias, deployId, projectFolder, this.apiVersion);
                } else {
                    process = ProcessFactory.sourceQuickDeploy(this.usernameOrAlias, deployId, projectFolder, this.apiVersion);
                }
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const status = (response !== undefined) ? new DeployStatus(response.result) : undefined;
                        endOperation(this);
                        resolve(status);
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to get the report of a running deployment
     * @param {String} deployId Id to the deployment to get the report (Required)
     * @param {Boolean} useMetadataAPI True to execute deploy report using Metadata API Format, false to use Source Format
     * @param {String | Number} waitMinutes Number of minutes to wait for the command to complete and display results
     * 
     * @returns {Promise<DeployStatus>} Return a promise with the DeployStatus object with the deploy status result 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     */
    deployReport(deployId, useMetadataAPI, waitMinutes) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                this._allowConcurrence = true;
                let process;
                if (useMetadataAPI) {
                    process = ProcessFactory.mdapiDeployReport(this.usernameOrAlias, deployId, waitMinutes);
                } else {
                    process = ProcessFactory.sourceDeployReport(this.usernameOrAlias, deployId, waitMinutes);
                }
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        this._allowConcurrence = false;
                        const status = (response !== undefined) ? new DeployStatus(response.result) : undefined;
                        endOperation(this);
                        resolve(status);
                    });
                }).catch((error) => {
                    this._allowConcurrence = false;
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                this._allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to get the cancel a running deployment
     * @param {String} deployId Id to the deployment to cancel (Required)
     * @param {Boolean} useMetadataAPI True to execute cancel deploy using Metadata API Format, false to use Source Format
     * @param {String | Number} waitMinutes Number of minutes to wait for the command to complete and display results
     * 
     * @returns {Promise<DeployStatus>} Return a promise with the DeployStatus object with the deploy status result 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     */
    cancelDeploy(deployId, useMetadataAPI, waitMinutes) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                let process;
                if (useMetadataAPI) {
                    process = ProcessFactory.mdapiCancelDeploy(this.usernameOrAlias, deployId, waitMinutes);
                } else {
                    process = ProcessFactory.sourceCancelDeploy(this.usernameOrAlias, deployId, waitMinutes);
                }
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const status = (response !== undefined) ? new DeployStatus(response.result) : undefined;
                        endOperation(this);
                        resolve(status);
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to convert a Metadata API format Project to a Source format
     * @param {String} targetDir Path to the target dir to save the converted project (Required)
     * 
     * @returns {Promise<Any>} Return an empty promise when conversion finish 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the package folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the package folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the package folder is not a directory
     * @throws {WrongFilePathException} If the package file is not a String or can't convert to absolute path
     * @throws {FileNotFoundException} If the package file not exists or not have access to it
     * @throws {InvalidFilePathException} If the package file is not a file
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    convertProjectToSFDX(targetDir) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                const packageFile = Validator.validateFilePath(this.packageFile);
                const packageFolder = Validator.validateFolderPath(this.packageFolder);
                targetDir = Validator.validateFolderPath(targetDir);
                let process = ProcessFactory.convertToSFDX(packageFolder, packageFile, targetDir, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        endOperation(this);
                        resolve();
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to convert a Source format Project to a Metadata API format
     * @param {String} targetDir Path to the target dir to save the converted project (Required)
     * 
     * @returns {Promise<Any>} Return an empty promise when conversion finish 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the project folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the project folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the project folder is not a directory
     * @throws {WrongFilePathException} If the package file is not a String or can't convert to absolute path
     * @throws {FileNotFoundException} If the package file not exists or not have access to it
     * @throws {InvalidFilePathException} If the package file is not a file
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    convertProjectToMetadataAPI(targetDir) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                const packageFile = Validator.validateFilePath(this.packageFile);
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                let process = ProcessFactory.convertToMetadataAPI(packageFile, projectFolder, targetDir, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        endOperation(this);
                        resolve();
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to create a SFDX Project. This method change the connection object project folder, package folder and package file values when project is created
     * @param {String} projectName Project Name to create (Required)
     * @param {String} projectFolder Path to save the project. If undefined use the connection project folder
     * @param {String} template Template to use to create the project. Empty by default
     * @param {Boolean} withManifest True to create the project with manifest, false in otherwise
     * 
     * @returns {Promise<SFDXProjectResult>} Return a promise with SFDXProjectResult Object with the creation result
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the project folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the project folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the project folder is not a directory
     */
    createSFDXProject(projectName, projectFolder, template, withManifest) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                projectFolder = Validator.validateFolderPath(projectFolder || this.projectFolder);
                let process = ProcessFactory.createSFDXProject(projectName, projectFolder, template, this.namespacePrefix, withManifest);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const result = (response !== undefined) ? new SFDXProjectResult(response.result) : undefined;
                        projectFolder = StrUtils.replace(projectFolder, '\\', '/');
                        this.setProjectFolder(projectFolder + '/' + projectName);
                        if (withManifest) {
                            this.setPackageFolder(projectFolder + '/' + projectName + '/manifest');
                            this.setPackageFile(projectFolder + '/' + projectName + '/manifest/package.xml');
                        }
                        endOperation(this);
                        resolve(result);
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to set an auth org in a Salesforce local project. This command set the selected username or Alias to the connection object when authorize an org.
     * @param {String} usernameOrAlias Username or alias to auth. (Must be authorized in the system). If undefined use the connection username or alias
     * 
     * @returns {Promise<Any>} Return an empty promise when operation finish
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the project folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the project folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the project folder is not a directory
     */
    setAuthOrg(usernameOrAlias) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                let process = ProcessFactory.setAuthOrg(usernameOrAlias || this.usernameOrAlias, projectFolder);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        this.usernameOrAlias = usernameOrAlias || this.usernameOrAlias;
                        endOperation(this);
                        resolve();
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to export data in a tree format from the connected org
     * @param {String} query Query to extract the data (Required)
     * @param {String} outputPath Path to the folder to (Required)
     * @param {String} prefix Prefix to add to the created files
     * 
     * @returns {Promise<Array<Object>>} Return an array with the extrated data information
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the output folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the output folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the output folder is not a directory
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    exportTreeData(query, outputPath, prefix) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                outputPath = Validator.validateFolderPath(outputPath);
                let process = ProcessFactory.exportTreeData(this.usernameOrAlias, query, outputPath, prefix, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        endOperation(this);
                        resolve(processExportTreeDataOut(response));
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to import data in a tree format into the connected org
     * @param {String} file Path to the file to import (Required)
     * 
     * @returns {Promise<Object>} Return a promise with an object with the ok result and errors on insert
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongFilePathException} If the file is not a String or can't convert to absolute path
     * @throws {FileNotFoundException} If the file not exists or not have access to it
     * @throws {InvalidFilePathException} If the file is not a file
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    importTreeData(file) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                file = Validator.validateFilePath(file);
                let process = ProcessFactory.importTreeData(this.usernameOrAlias, file, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    if (response.status === 0) {
                        let results = [];
                        for (let insertResult of response.result) {
                            results.push({
                                refId: '@' + insertResult.refId,
                                id: insertResult.id,
                                sobject: insertResult.type,
                            });
                        }
                        endOperation(this);
                        resolve({ results: results, errors: undefined });
                    } else {
                        if (response.name === 'ERROR_HTTP_400') {
                            let errorResults = JSON.parse(response.message);
                            endOperation(this);
                            resolve({ results: undefined, errors: errorResults.results });
                        } else {
                            endOperation(this);
                            reject(response.message);
                        }
                    }
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to delete data on bulk mode
     * @param {String} csvfile Path to the CSV file with the ids to delete (Required)
     * @param {String} sObject Records SObject API Name (Required)
     *  
     * @returns {Promise<Array<BulkStatus>>} Return a promise with an array with BulkStatus objects with the delete result
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the project folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the project folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the project folder is not a directory
     * @throws {WrongFilePathException} If the csv file is not a String or can't convert to absolute path
     * @throws {FileNotFoundException} If the csv file not exists or not have access to it
     * @throws {InvalidFilePathException} If the csv file is not a file
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    bulkDelete(csvfile, sObject) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                csvfile = Validator.validateFilePath(csvfile);
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                let process = ProcessFactory.bulkDelete(this.usernameOrAlias, csvfile, sObject, projectFolder, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const bulkStatus = [];
                        for (const result of response.result) {
                            bulkStatus.push(new BulkStatus(result));
                        }
                        endOperation(this);
                        resolve(bulkStatus);
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to execute an Apex script file on Anonymous context
     * @param {String} scriptfile Path to the script file (Required)
     *
     * @returns {Promise<String>} Return a promise with the execution log as String
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the project folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the project folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the project folder is not a directory
     * @throws {WrongFilePathException} If the script file is not a String or can't convert to absolute path
     * @throws {FileNotFoundException} If the script file not exists or not have access to it
     * @throws {InvalidFilePathException} If the script file is not a file
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    executeApexAnonymous(scriptfile) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                scriptfile = Validator.validateFilePath(scriptfile);
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                let process = ProcessFactory.executeApexAnonymous(this.usernameOrAlias, scriptfile, projectFolder, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        endOperation(this);
                        resolve(response);
                    });
                }).catch((error) => {
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to get all available user permissions from the connected org
     * @param {String} tmpFolder Temporal folder to save support files (Required)
     * @param {Function} callback Optional callback function parameter to handle download progress. If provide function progress callback, it will be execute instead connection progress callback
     * 
     * @returns {Promise<Array<String>>} Return a promise with the list of user permissions
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system 
     * @throws {WrongDirectoryPathException} If the temp folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the temp folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the temp folder is not a directory
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    loadUserPermissions(tmpFolder) {
        const progressCallback = getCallback(arguments, this);
        startOperation(this);
        resetProgress(this);
        return new Promise(async (resolve, reject) => {
            try {
                tmpFolder = Validator.validateFolderPath(tmpFolder);
                const originalProjectFolder = this.projectFolder;
                callProgressCalback(progressCallback, this, ProgressStages.PREPARE);
                this._allowConcurrence = true;
                const metadata = {};
                const metadataType = new MetadataType(MetadataTypes.PROFILE, true);
                metadataType.childs["Admin"] = new MetadataObject("Admin", true);
                metadata[MetadataTypes.PROFILE] = metadataType;
                if (FileChecker.isExists(tmpFolder))
                    FileWriter.delete(tmpFolder);
                FileWriter.createFolderSync(tmpFolder);
                callProgressCalback(progressCallback, this, ProgressStages.CREATE_PROJECT);
                const createProjectOut = await this.createSFDXProject(PROJECT_NAME, tmpFolder, undefined, true);
                const packageResult = PackageGenerator.createPackage(metadata, this.packageFolder, {
                    apiVersion: this.apiVersion,
                    explicit: true,
                });
                FileWriter.delete(this.projectFolder + '/.forceignore');
                const setDefaultOrgOut = await this.setAuthOrg(this.usernameOrAlias);
                callProgressCalback(progressCallback, this, ProgressStages.RETRIEVE);
                const retrieveOut = await this.retrieve(false);
                callProgressCalback(progressCallback, this, ProgressStages.PROCESS);
                const result = [];
                const xmlRoot = XMLParser.parseXML(FileReader.readFileSync(this.projectFolder + '/force-app/main/default/profiles/Admin.profile-meta.xml'), true);
                if (xmlRoot[MetadataTypes.PROFILE] && xmlRoot[MetadataTypes.PROFILE].userPermissions) {
                    let permissions = XMLUtils.forceArray(xmlRoot[MetadataTypes.PROFILE].userPermissions);
                    for (let permission of permissions) {
                        result.push(permission.name);
                    }
                }
                //callProgressCalback(progressCallback, this, ProgressStages.CLEANING);
                //FileWriter.delete(tmpFolder);
                restoreOriginalProjectData(this, originalProjectFolder);
                this._allowConcurrence = false;
                endOperation(this);
                resolve(result);
            } catch (error) {
                this._allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to Retrieve local special types from the connected org
     * @param {String} tmpFolder Temporal folder to save support files (Required)
     * @param {Object} types Metadata JSON Object or Metadata JSON File with the specific types to retrieve. Undefined to retrieve all special types
     * @param {Boolean} compress true to compress affected files, false in otherwise
     * @param {String} sortOrder Compress sort order when compress files
     * @param {Function} callback Optional callback function parameter to handle download progress. If provide function progress callback, it will be execute instead connection progress callback
     * 
     * @returns {Promise<RetrieveResult>} Return a promise with a RetrieveResult with the retrieve result
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the temp folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the temp folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the temp folder is not a directory
     * @throws {WrongFilePathException} If the types file is not a String or can't convert to absolute path
     * @throws {FileNotFoundException} If the types file not exists or not have access to it
     * @throws {InvalidFilePathException} If the types file is not a file
     * @throws {WrongFormatException} If types object or file is not a JSON file or not have the correct Metadata JSON format
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    retrieveLocalSpecialTypes(tmpFolder, types, compress, sortOrder) {
        const progressCallback = getCallback(arguments, this);
        startOperation(this);
        resetProgress(this);
        return new Promise(async (resolve, reject) => {
            try {
                tmpFolder = Validator.validateFolderPath(tmpFolder);
                if (types)
                    types = Validator.validateMetadataJSON(types);
                const originalProjectFolder = this.projectFolder;
                callProgressCalback(progressCallback, this, ProgressStages.PREPARE);
                const dataToRetrieve = [];
                Object.keys(SpecialMetadata).forEach(function (key) {
                    if (!types || types[key]) {
                        if (!dataToRetrieve.includes(key))
                            dataToRetrieve.push(key);
                        for (let child of SpecialMetadata[key]) {
                            if (!dataToRetrieve.includes(child))
                                dataToRetrieve.push(child);
                        }
                    }
                });
                this._allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(dataToRetrieve);
                this._increment = calculateIncrement(metadataToProcess);
                callProgressCalback(progressCallback, this, ProgressStages.LOADING_LOCAL);
                const metadataDetails = await this.listMetadataTypes();
                const folderMetadataMap = TypesFactory.createFolderMetadataMap(metadataDetails);
                const metadataFromFileSystem = TypesFactory.createMetadataTypesFromFileSystem(folderMetadataMap, this.projectFolder);
                const metadata = {};
                for (const type of dataToRetrieve) {
                    if (metadataFromFileSystem[type])
                        metadata[type] = metadataFromFileSystem[type];
                }
                MetadataUtils.checkAll(metadata);
                if (FileChecker.isExists(tmpFolder))
                    FileWriter.delete(tmpFolder);
                FileWriter.createFolderSync(tmpFolder);
                callProgressCalback(progressCallback, this, ProgressStages.CREATE_PROJECT);
                const createProjectOut = await this.createSFDXProject(PROJECT_NAME, tmpFolder, undefined, true);
                const packageResult = PackageGenerator.createPackage(metadata, this.packageFolder, {
                    apiVersion: this.apiVersion,
                    explicit: true,
                });
                FileWriter.delete(this.projectFolder + '/.forceignore');
                const setDefaultOrgOut = await this.setAuthOrg(this.usernameOrAlias);
                callProgressCalback(progressCallback, this, ProgressStages.RETRIEVE);
                const retrieveOut = await this.retrieve(false);
                waitForFiles(this.projectFolder);
                callProgressCalback(progressCallback, this, ProgressStages.COPY_DATA);
                copyMetadataFiles(this, originalProjectFolder, folderMetadataMap, types, metadataFromFileSystem, compress, sortOrder, progressCallback);
                //callProgressCalback(progressCallback, this, ProgressStages.CLEANING);
                //FileWriter.delete(tmpFolder);
                restoreOriginalProjectData(this, originalProjectFolder);
                this._allowConcurrence = false;
                endOperation(this);
                resolve(retrieveOut);
            } catch (error) {
                this._allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to Retrieve mixed special types from the connected org. Mixed means that only affect the Metadata Types on your project folder, but download all related data from this types from your org (and not only the local data)
     * @param {String} tmpFolder Temporal folder to save support files (Required)
     * @param {Object} types Metadata JSON Object or Metadata JSON File with the specific types to retrieve. Undefined to retrieve all special types
     * @param {Boolean} downloadAll true to download all related data from any namespace, false to downlaod only the org namespace data
     * @param {Boolean} compress true to compress affected files, false in otherwise
     * @param {String} sortOrder Compress sort order when compress files
     * @param {Function} callback Optional callback function parameter to handle download progress. If provide function progress callback, it will be execute instead connection progress callback
     * 
     * @returns {Promise<RetrieveResult>} Return a promise with a RetrieveResult with the retrieve result
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the temp folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the temp folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the temp folder is not a directory
     * @throws {WrongFilePathException} If the types file is not a String or can't convert to absolute path
     * @throws {FileNotFoundException} If the file not exists or not have access to it
     * @throws {InvalidFilePathException} If the types file is not a file
     * @throws {WrongFormatException} If types object or file is not a JSON file or not have the correct Metadata JSON format
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    retrieveMixedSpecialTypes(tmpFolder, types, downloadAll, compress, sortOrder) {
        const progressCallback = getCallback(arguments, this);
        startOperation(this);
        resetProgress(this);
        return new Promise(async (resolve, reject) => {
            try {
                tmpFolder = Validator.validateFolderPath(tmpFolder);
                if (types)
                    types = Validator.validateMetadataJSON(types);
                const originalProjectFolder = this.projectFolder;
                callProgressCalback(progressCallback, this, ProgressStages.PREPARE);
                const dataToRetrieve = [];
                Object.keys(SpecialMetadata).forEach(function (key) {
                    if (!types || types[key]) {
                        if (!dataToRetrieve.includes(key))
                            dataToRetrieve.push(key);
                        for (let child of SpecialMetadata[key]) {
                            if (!dataToRetrieve.includes(child))
                                dataToRetrieve.push(child);
                        }
                    }
                });
                this._allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(dataToRetrieve);
                this._increment = calculateIncrement(metadataToProcess);
                callProgressCalback(progressCallback, this, ProgressStages.LOADING_LOCAL);
                const metadataDetails = await this.listMetadataTypes();
                const folderMetadataMap = TypesFactory.createFolderMetadataMap(metadataDetails);
                const metadataFromFileSystem = TypesFactory.createMetadataTypesFromFileSystem(folderMetadataMap, this.projectFolder);
                let metadata = {};
                for (const type of dataToRetrieve) {
                    if (metadataFromFileSystem[type])
                        metadata[type] = metadataFromFileSystem[type];
                }
                callProgressCalback(progressCallback, this, ProgressStages.LOADING_ORG);
                const metadataFromOrg = await this.describeMetadataTypes(dataToRetrieve, downloadAll, progressCallback);
                this._allowConcurrence = true;
                metadata = MetadataUtils.combineMetadata(metadata, metadataFromOrg);
                MetadataUtils.checkAll(metadata);
                if (FileChecker.isExists(tmpFolder))
                    FileWriter.delete(tmpFolder);
                FileWriter.createFolderSync(tmpFolder);
                callProgressCalback(progressCallback, this, ProgressStages.CREATE_PROJECT);
                const createProjectOut = await this.createSFDXProject(PROJECT_NAME, tmpFolder, undefined, true);
                const packageResult = PackageGenerator.createPackage(metadata, this.packageFolder, {
                    apiVersion: this.apiVersion,
                    explicit: true,
                });
                FileWriter.delete(this.projectFolder + '/.forceignore');
                const setDefaultOrgOut = await this.setAuthOrg(this.usernameOrAlias);
                callProgressCalback(progressCallback, this, ProgressStages.RETRIEVE);
                const retrieveOut = await this.retrieve(false);
                waitForFiles(this.projectFolder);
                callProgressCalback(progressCallback, this, ProgressStages.COPY_DATA);
                copyMetadataFiles(this, originalProjectFolder, folderMetadataMap, types, metadata, compress, sortOrder, progressCallback);
                //callProgressCalback(progressCallback, this, ProgressStages.CLEANING);
                //FileWriter.delete(tmpFolder);
                restoreOriginalProjectData(this, originalProjectFolder);
                this._allowConcurrence = false;
                endOperation(this);
                resolve(retrieveOut);
            } catch (error) {
                this._allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    /**
     * Method to Retrieve org special types from the connected org. Org means that affect all Metadata types stored in your org not on your local project.
     * @param {String} tmpFolder Temporal folder to save support files (Required)
     * @param {Object} types Metadata JSON Object or Metadata JSON File with the specific types to retrieve. Undefined to retrieve all special types
     * @param {Boolean} downloadAll true to download all related data from any namespace, false to downlaod only the org namespace data
     * @param {Boolean} compress true to compress affected files, false in otherwise
     * @param {String} sortOrder Compress sort order when compress files
     * @param {Function} callback Optional callback function parameter to handle download progress. If provide function progress callback, it will be execute instead connection progress callback
     * 
     * @returns {Promise<RetrieveResult>} Return a promise with a RetrieveResult with the retrieve result
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the temp folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the temp folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the temp folder is not a directory
     * @throws {WrongFilePathException} If the types file is not a String or can't convert to absolute path
     * @throws {FileNotFoundException} If the file not exists or not have access to it
     * @throws {InvalidFilePathException} If the types file is not a file
     * @throws {WrongFormatException} If types object or file is not a JSON file or not have the correct Metadata JSON format
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    retrieveOrgSpecialTypes(tmpFolder, types, downloadAll, compress, sortOrder) {
        const progressCallback = getCallback(arguments, this);
        startOperation(this);
        resetProgress(this);
        return new Promise(async (resolve, reject) => {
            try {
                tmpFolder = Validator.validateFolderPath(tmpFolder);
                if (types)
                    types = Validator.validateMetadataJSON(types);
                const originalProjectFolder = this.projectFolder;
                callProgressCalback(progressCallback, this, ProgressStages.PREPARE);
                const dataToRetrieve = [];
                Object.keys(SpecialMetadata).forEach(function (key) {
                    if (!types || types[key]) {
                        if (!dataToRetrieve.includes(key))
                            dataToRetrieve.push(key);
                        for (let child of SpecialMetadata[key]) {
                            if (!dataToRetrieve.includes(child))
                                dataToRetrieve.push(child);
                        }
                    }
                });
                this._allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(dataToRetrieve);
                this._increment = calculateIncrement(metadataToProcess);
                callProgressCalback(progressCallback, this, ProgressStages.LOADING_ORG);
                const metadataDetails = await this.listMetadataTypes();
                const folderMetadataMap = TypesFactory.createFolderMetadataMap(metadataDetails);
                const metadataFromOrg = await this.describeMetadataTypes(dataToRetrieve, downloadAll, progressCallback);
                this._allowConcurrence = true;
                MetadataUtils.checkAll(metadataFromOrg);
                if (FileChecker.isExists(tmpFolder))
                    FileWriter.delete(tmpFolder);
                FileWriter.createFolderSync(tmpFolder);
                callProgressCalback(progressCallback, this, ProgressStages.CREATE_PROJECT);
                const createProjectOut = await this.createSFDXProject(PROJECT_NAME, tmpFolder, undefined, true);
                const packageResult = PackageGenerator.createPackage(metadataFromOrg, this.packageFolder, {
                    apiVersion: this.apiVersion,
                    explicit: true,
                });
                FileWriter.delete(this.projectFolder + '/.forceignore');
                const setDefaultOrgOut = await this.setAuthOrg(this.usernameOrAlias);
                callProgressCalback(progressCallback, this, ProgressStages.RETRIEVE);
                const retrieveOut = await this.retrieve(false);
                waitForFiles(this.projectFolder);
                callProgressCalback(progressCallback, this, ProgressStages.COPY_DATA);
                copyMetadataFiles(this, originalProjectFolder, folderMetadataMap, types, metadataFromOrg, compress, sortOrder, progressCallback);
                //callProgressCalback(progressCallback, this, ProgressStages.CLEANING);
                //FileWriter.delete(tmpFolder);
                restoreOriginalProjectData(this, originalProjectFolder);
                this._allowConcurrence = false;
                endOperation(this);
                resolve(retrieveOut);
            } catch (error) {
                this._allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }
}
module.exports = Connection;

function getCallback(args, connection) {
    return Utils.getCallbackFunction(args) || connection._progressCallback;;
}

function waitForFiles(folder) {
    return new Promise(async (resolve) => {
        let files = await FileReader.getAllFiles(folder);
        while (files.length == 0) {
            files = await FileReader.getAllFiles(folder);
        }
        resolve();
    });
}

function restoreOriginalProjectData(connection, originalProjectFolder) {
    connection.setProjectFolder(originalProjectFolder);
    connection.setPackageFolder(originalProjectFolder + '/manifest');
    connection.setPackageFile(originalProjectFolder + '/manifest/package.xml');
}

function copyMetadataFiles(connection, targetProject, folderMetadataMap, types, metadataTypes, compress, compressOrder, progressCallback) {
    const path = connection.projectFolder;
    for (const folder of (Object.keys(folderMetadataMap))) {
        const metadataDetail = folderMetadataMap[folder];
        const metadataTypeName = metadataDetail.xmlName;
        if (!SpecialMetadata[metadataTypeName] || !metadataTypes[metadataTypeName])
            continue;
        const haveTypesToCopy = !Utils.isNull(types);
        const typeToCopy = haveTypesToCopy ? types[metadataTypeName] : undefined;
        if (haveTypesToCopy && !typeToCopy)
            continue;
        const metadataType = metadataTypes[metadataTypeName];
        if (!metadataType.haveChilds())
            continue;
        for (const metadataObjectName of Object.keys(metadataType.getChilds())) {
            const objectToCopy = (Utils.isNull(typeToCopy) || !MetadataUtils.haveChilds(typeToCopy)) ? undefined : typeToCopy.childs[metadataObjectName];
            const metadataObject = metadataType.getChild(metadataObjectName);
            if (metadataObject.haveChilds()) {
                for (const metadataItemName of Object.keys(metadataObject.getChilds())) {
                    const itemToCopy = (Utils.isNull(objectToCopy) || !MetadataUtils.haveChilds(objectToCopy)) ? undefined : objectToCopy.childs[metadataItemName];
                    if (!haveTypesToCopy || (typeToCopy && typeToCopy.checked) || (objectToCopy && objectToCopy.checked) || (itemToCopy && itemToCopy.checked)) {
                        let subPath;
                        let fileName = metadataItemName + '.' + metadataDetail.suffix + '-meta.xml';
                        if (SUBFOLDER_BY_METADATA_TYPE[metadataTypeName]) {
                            subPath = '/force-app/main/default/' + metadataDetail.directoryName + '/' + metadataObjectName + '/' + SUBFOLDER_BY_METADATA_TYPE[metadataTypeName] + '/' + fileName;
                        } else {
                            subPath = '/force-app/main/default/' + metadataDetail.directoryName + '/' + metadataObjectName + '/' + fileName;
                        }
                        let sourceFile = path + '/' + subPath;
                        let targetFile = targetProject + subPath;
                        let targetFolder = PathUtils.getDirname(targetFile);
                        if (FileChecker.isExists(sourceFile)) {
                            callProgressCalback(progressCallback, connection, ProgressStages.COPY_FILE, metadataDetail, metadataObjectName, metadataItemName, targetFile);
                            if (!FileChecker.isExists(targetFolder))
                                FileWriter.createFolderSync(targetFolder);
                            FileWriter.createFileSync(targetFile, FileReader.readFileSync(sourceFile));
                            if (compress) {
                                callProgressCalback(progressCallback, connection, ProgressStages.COMPRESS_FILE, metadataDetail, metadataObjectName, metadataItemName, targetFile);
                                XMLCompressor.compressSync(targetFile, compressOrder);
                            }
                        }
                    }
                }
            } else {
                if (!haveTypesToCopy || (typeToCopy && typeToCopy.checked) || (objectToCopy && objectToCopy.checked)) {
                    let subPath;
                    let fileName = metadataObjectName + '.' + metadataDetail.suffix + '-meta.xml';
                    if (metadataTypeName === MetadataTypes.CUSTOM_OBJECT) {
                        subPath = '/force-app/main/default/' + metadataDetail.directoryName + '/' + metadataObjectName + '/' + fileName
                    } else {
                        subPath = '/force-app/main/default/' + metadataDetail.directoryName + '/' + fileName
                    }
                    let sourceFile = path + '/' + subPath;
                    let targetFile = targetProject + subPath;
                    let targetFolder = PathUtils.getDirname(targetFile);
                    if (FileChecker.isExists(sourceFile)) {
                        callProgressCalback(progressCallback, connection, ProgressStages.COPY_FILE, metadataDetail, metadataObjectName, undefined, targetFile);
                        if (!FileChecker.isExists(targetFolder))
                            FileWriter.createFolderSync(targetFolder);
                        FileWriter.createFileSync(targetFile, FileReader.readFileSync(sourceFile));
                        if (compress) {
                            callProgressCalback(progressCallback, connection, ProgressStages.COMPRESS_FILE, metadataDetail, metadataObjectName, undefined, targetFile);
                            XMLCompressor.compressSync(targetFile, compressOrder);
                        }
                    }
                }
            }
        }
    }
}

function processExportTreeDataOut(response) {
    let outData = StrUtils.replace(response, '\n', '').split(',');
    let dataToReturn = [];
    for (let data of outData) {
        let splits = data.split(" ");
        let nRecords = splits[1];
        let file = PathUtils.getBasename(splits[splits.length - 1]);
        dataToReturn.push(
            {
                file: file,
                records: nRecords,
                isPlanFile: file.endsWith("-plan.json")
            }
        );
    }
    return dataToReturn;
}

function handleResponse(response, onSuccess) {
    if (response !== undefined) {
        if (typeof response === 'object') {
            if (response.status === 0) {
                onSuccess.call(this);
            } else {
                throw new ConnectionException(response.message);
            }
        } else {
            onSuccess.call(this);
        }
    } else {
        response = {
            result: {}
        }
        onSuccess.call(this);
    }
}

function callProgressCalback(progressCallback, connection, stage, type, object, data) {
    if (progressCallback)
        progressCallback.call(this, new ProgressStatus(stage, connection._increment, connection._percentage, type, object, undefined, data));
}

function downloadMetadata(connection, metadataToDownload, downloadAll, foldersByType, progressCallback) {
    return new Promise(async (resolve, reject) => {
        try {
            const metadata = {};
            for (const metadataTypeName of metadataToDownload) {
                try {
                    if (connection._abort) {
                        connection._allowConcurrence = false;
                        endOperation(connection);
                        resolve(metadata);
                        return;
                    }
                    callProgressCalback(progressCallback, connection, ProgressStages.BEFORE_DOWNLOAD, metadataTypeName);
                    if (metadataTypeName === MetadataTypes.REPORT || metadataTypeName === MetadataTypes.DASHBOARD || metadataTypeName === MetadataTypes.EMAIL_TEMPLATE || metadataTypeName === MetadataTypes.DOCUMENT) {
                        const records = await connection.query(METADATA_QUERIES[metadataTypeName]);
                        if (!records || records.length === 0)
                            continue;
                        const metadataType = TypesFactory.createMetadataTypeFromRecords(metadataTypeName, records, foldersByType, connection.namespacePrefix, downloadAll);
                        connection._percentage += connection._increment;
                        if (metadataType !== undefined && metadataType.haveChilds())
                            metadata[metadataTypeName] = metadataType;
                        callProgressCalback(progressCallback, connection, ProgressStages.AFTER_DOWNLOAD, metadataTypeName, metadataType);
                    } else if (NotIncludedMetadata[metadataTypeName]) {
                        const metadataType = TypesFactory.createNotIncludedMetadataType(metadataTypeName);
                        connection._percentage += connection._increment;
                        if (metadataType !== undefined && metadataType.haveChilds())
                            metadata[metadataTypeName] = metadataType;
                        callProgressCalback(progressCallback, connection, ProgressStages.AFTER_DOWNLOAD, metadataTypeName, metadataType);
                    } else {
                        const process = ProcessFactory.describeMetadataType(connection.usernameOrAlias, metadataTypeName, undefined, connection.apiVersion);
                        addProcess(connection, process);
                        const response = await ProcessHandler.runProcess(process);
                        handleResponse(response, () => {
                            const metadataType = TypesFactory.createMetedataTypeFromResponse(metadataTypeName, response, connection.namespacePrefix, downloadAll);
                            connection._percentage += connection._increment;
                            if (metadataType !== undefined && metadataType.haveChilds())
                                metadata[metadataTypeName] = metadataType;
                            callProgressCalback(progressCallback, connection, ProgressStages.AFTER_DOWNLOAD, metadataTypeName, metadataType);
                        });
                    }
                } catch (error) {
                    if (error.message.indexOf('INVALID_TYPE') === -1)
                        throw error;
                }
            }
            resolve(metadata);
        } catch (error) {
            reject(error);
        }
    });
}

function downloadSObjectsData(connection, sObjects, progressCallback) {
    return new Promise(async (resolve, reject) => {
        try {
            const sObjectsResult = {};
            for (const sObject of sObjects) {
                if (connection._abort) {
                    endOperation(connection);
                    resolve(sObjectsResult);
                    return;
                }
                callProgressCalback(progressCallback, connection, ProgressStages.BEFORE_DOWNLOAD, MetadataTypes.CUSTOM_OBJECT, sObject);
                const process = ProcessFactory.getSObjectSchema(connection.usernameOrAlias, sObject, connection.apiVersion);
                addProcess(connection, process);
                const response = await ProcessHandler.runProcess(process);
                handleResponse(response, () => {
                    const sObjectResult = TypesFactory.createSObjectFromJSONSchema(response);
                    connection._percentage += connection._increment;
                    if (sObjectResult !== undefined)
                        sObjectsResult[sObject] = sObjectResult;
                    callProgressCalback(progressCallback, connection, ProgressStages.AFTER_DOWNLOAD, MetadataTypes.CUSTOM_OBJECT, sObject, undefined, sObjectResult);
                });
            }
            resolve(sObjectsResult);
        } catch (error) {
            reject(error);
        }
    });
}

function getBatches(connection, objects) {
    const nBatches = (connection.multiThread) ? OSUtils.getAvailableCPUs() : 1;
    const recordsPerBatch = Math.ceil(objects.length / nBatches);
    const batches = [];
    let counter = 0;
    let batch;
    for (const object of objects) {
        if (!batch) {
            batch = {
                batchId: 'Bacth_' + counter,
                records: [],
                completed: false
            }
            counter++;
        }
        if (batch) {
            batch.records.push(object);
            if (batch.records.length === recordsPerBatch) {
                batches.push(batch);
                batch = undefined;
            }
        }
    }
    if (batch)
        batches.push(batch);
    return batches;
}

function calculateIncrement(objects) {
    return MathUtils.round(100 / objects.length, 2);
}

function getMetadataTypeNames(typesOrDetails) {
    const result = [];
    if (typesOrDetails !== undefined) {
        const objectsToProcess = Utils.forceArray(typesOrDetails);
        for (const obj of objectsToProcess) {
            if (obj.xmlName !== undefined) {
                result.push(obj.xmlName);
            } else if (typeof obj === 'string') {
                result.push(obj);
            }
        }
    }
    result.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    return result;
}

function getFoldersByType(connection) {
    return new Promise((resolve, reject) => {
        const query = 'Select Id, Name, DeveloperName, NamespacePrefix, Type FROM Folder';
        try {
            if (connection._abort) {
                connection._allowConcurrence = false;
                endOperation(connection);
                resolve({});
                return;
            }
            connection.query(query).then((records) => {
                let result = {};
                for (const folder of records) {
                    if (!result[folder.Type])
                        result[folder.Type] = [];
                    result[folder.Type].push(folder);
                }
                resolve(result);
            }).catch((error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
}

function resetProgress(connection) {
    connection._percentage = 0;
    connection._increment = 0;
}

function killProcesses(connection) {
    if (connection._processes && Object.keys(connection._processes).length > 0) {
        for (let process of Object.keys(connection._processes)) {
            killProcess(connection, connection._processes[process]);
        }
    }
}

function killProcess(connection, process) {
    process.kill();
    delete connection._processes[process.name];
}

function startOperation(connection) {
    if (!connection._allowConcurrence) {
        if (connection._inProgress)
            throw new OperationNotAllowedException('Connection in use. Abort the current operation to execute other.');
        connection._abort = false;
        connection._inProgress = true;
        connection._processes = {};
    }
}

function endOperation(connection) {
    if (!connection._allowConcurrence) {
        connection._inProgress = false;
        connection._processes = {};
    }
}

function addProcess(connection, process) {
    if (connection._processes === undefined)
        connection._processes = {};
    connection._processes[process.name] = process;
}

function createAuthOrgs(orgs) {
    const authOrgs = [];
    if (orgs !== undefined) {
        orgs = Utils.forceArray(orgs);
        for (const org of orgs) {
            authOrgs.push(new AuthOrg(org));
        }
    }
    return authOrgs;
}