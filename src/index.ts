import EventEmitter from "events";
import { MetadataFactory } from '@aurahelper/metadata-factory';
import { PackageGenerator } from '@aurahelper/package-generator';
import { XMLCompressor } from '@aurahelper/xml-compressor';
import { XML } from '@aurahelper/languages';
import { AuthOrg, BulkStatus, ConnectionException, CoreUtils, DataRequiredException, DeployStatus, ExportTreeDataResult, ImportTreeDataResult, FileChecker, FileReader, FileWriter, MetadataDetail, MetadataType, MetadataTypes, NotIncludedMetadata, OperationNotAllowedException, PathUtils, Process, ProcessFactory, ProcessHandler, ProgressStatus, RetrieveResult, RetrieveStatus, SFDXProjectResult, SObject, SpecialMetadata, ImportTreeDataResponse, MetadataObject } from "@aurahelper/core";
const XMLParser = XML.XMLParser;
const XMLUtils = XML.XMLUtils;
const Validator = CoreUtils.Validator;
const StrUtils = CoreUtils.StrUtils;
const OSUtils = CoreUtils.OSUtils;
const Utils = CoreUtils.Utils;
const MathUtils = CoreUtils.MathUtils;
const MetadataUtils = CoreUtils.MetadataUtils;
const ProjectUtils = CoreUtils.ProjectUtils;

const PROJECT_NAME: string = 'TempProject';

const METADATA_QUERIES: { [key: string]: string } = {
    Report: 'Select Id, DeveloperName, NamespacePrefix, FolderName from Report',
    Dashboard: 'Select Id, DeveloperName, NamespacePrefix, FolderId from Dashboard',
    Document: 'Select Id, DeveloperName, NamespacePrefix, FolderId from Document',
    EmailTemplate: 'Select Id, DeveloperName, NamespacePrefix, FolderId FROM EmailTemplate'
};
const SUBFOLDER_BY_METADATA_TYPE: { [key: string]: string } = {
    RecordType: 'recordTypes'
};

const EVENT: { [key: string]: string } = {
    PREPARE: 'preapre',
    CREATE_PROJECT: 'createProject',
    RETRIEVE: 'retrieve',
    PROCESS: 'process',
    LOADING_LOCAL: 'loadingLocal',
    LOADING_ORG: 'loadingOrg',
    COPY_DATA: 'copyData',
    COPY_FILE: 'copyFile',
    COMPRESS_FILE: 'compressFile',
    BEFORE_DOWNLOAD_TYPE: 'beforeDownloadType',
    AFTER_DOWNLOAD_TYPE: 'afterDownloadType',
    BEFORE_DOWNLOAD_OBJECT: 'beforeDownloadSObj',
    AFTER_DOWNLOAD_OBJECT: 'afterDownloadSObj',
    DOWNLOAD_ERROR: 'onDownloadError',
    ABORT: 'abort',
};

/**
 * Class to connect with Salesforce to list or describe metadata types, list or describe all SObjects, make queries, create SFDX Project, validate, 
 * deploy or retrieve in SFDX and Metadata API Formats, export and import data and much more. 
 * Is used to Aura Helper and Aura Helper CLI to support salesfore conections.
 * 
 * The setters methods are defined like a builder pattern to make it more usefull
 * 
 * All connection methods return a Promise with the associated data to the processes. 
 */
export class Connection {

    usernameOrAlias?: string;
    apiVersion?: string | number;
    projectFolder?: string;
    namespacePrefix?: string;
    multiThread: boolean;
    packageFolder?: string;
    packageFile?: string;
    _processes: { [key: string]: Process };
    _inProgress: boolean;
    _percentage: number;
    _increment: number;
    _abort: boolean;
    _allowConcurrence: boolean;
    _event: EventEmitter;

    /**
     * Constructor to create a new connection object
     * @param {string} [usernameOrAlias] Org Username or Alias to connect. (Must be authorized in the system)
     * @param {string | number} [apiVersion] API Version number to connect with salesforce
     * @param {string} [projectFolder] Path to the project root folder
     * @param {string} [namespacePrefix] Namespace prefix from the Org to connect
     */
    constructor(usernameOrAlias?: string, apiVersion?: string | number, projectFolder?: string, namespacePrefix?: string) {
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
        this._event = new EventEmitter();
    }

    /**
     * Method to set the Username or Alias to connect with org
     * @param {string} usernameOrAlias Org Username or Alias to connect. (Must be authorized in the system)
     * 
     * @returns {Connection} Returns the connection object
     */
    setUsernameOrAlias(usernameOrAlias: string): Connection {
        this.usernameOrAlias = usernameOrAlias;
        return this;
    }

    /**
     * Method to set the API Version to connect
     * @param {string | number} apiVersion API Version number to connect with salesforce
     * 
     * @returns {Connection} Returns the connection object
     */
    setApiVersion(apiVersion: string | number): Connection {
        this.apiVersion = apiVersion;
        return this;
    }

    /**
     * Method to set the project root folder path. When set the project root, automatically set the packageFolder and packageFile to their respective paths
     * @param {string} projectFolder Path to the project root folder
     * 
     * @returns {Connection} Returns the connection object
     */
    setProjectFolder(projectFolder: string): Connection {
        this.projectFolder = (projectFolder !== undefined) ? PathUtils.getAbsolutePath(projectFolder) : projectFolder;
        this.packageFolder = this.projectFolder + '/manifest';
        this.packageFile = this.projectFolder + '/manifest/package.xml';
        return this;
    }

    /**
     * Method to set the package folder path. When set the package folder, automatically set packageFile to the respective path
     * @param {string} packageFile Path to the package folder
     * 
     * @returns {Connection} Returns the connection object
     */
    setPackageFolder(packageFolder: string): Connection {
        this.packageFolder = (packageFolder !== undefined) ? PathUtils.getAbsolutePath(packageFolder) : packageFolder;
        this.packageFile = this.projectFolder + '/manifest/package.xml';
        return this;
    }

    /**
     * Method to set the package xml file path
     * @param {string} packageFile Path to the package file
     * 
     * @returns {Connection} Returns the connection object
     */
    setPackageFile(packageFile: string): Connection {
        this.packageFile = (packageFile !== undefined) ? PathUtils.getAbsolutePath(packageFile) : packageFile;
        return this;
    }

    /**
     * Method to set the Org namespace prefix
     * @param {string} namespacePrefix Namespace prefix from the Org to connect
     * 
     * @returns {Connection} Returns the connection object
     */
    setNamespacePrefix(namespacePrefix: string): Connection {
        this.namespacePrefix = (namespacePrefix !== undefined) ? namespacePrefix : '';
        return this;
    }

    /**
     * Method to able to the connection object to use several threads and processor cores to run some processes and run faster
     * 
     * @returns {Connection} Returns the connection object
     */
    setMultiThread(): Connection {
        this.multiThread = true;
        return this;
    }

    /**
     * Method to set the connection object to use only one thread and processo core to all processes
     * 
     * @returns {Connection} Returns the connection object
     */
    setSingleThread(): Connection {
        this.multiThread = false;
        return this;
    }

    /**
     * Method to handle the event when preparing execution of some processes
     * @param {Function} callback Callback function to call when connection is on prepare
     * 
     * @returns {Connection} Returns the connection object
     */
    onPrepare(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.PREPARE, callback);
        return this;
    }

    /**
     * Method to handle the event before the create a project on some processes 
     * @param {Function} callback Callback function to handle progress when connection will create a project
     * 
     * @returns {Connection} Returns the connection object
     */
    onCreateProject(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.CREATE_PROJECT, callback);
        return this;
    }

    /**
     * Method to handle the event before start retrieve data on some processes
     * @param {Function} callback Callback function to handle progress when connection retrieve data
     * 
     * @returns {Connection} Returns the connection object
     */
    onRetrieve(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.RETRIEVE, callback);
        return this;
    }

    /**
     * Method to handle the event before start processing results on some processes
     * @param {Function} callback Callback function to handle progress when connection is processing results
     * 
     * @returns {Connection} Returns the connection object
     */
    onProcess(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.PROCESS, callback);
        return this;
    }

    /**
     * Method to handle the event before start loading local metadata types on some processes
     * @param {Function} callback Callback function to handle progress when connection load metadata types from local project
     * 
     * @returns {Connection} Returns the connection object
     */
    onLoadingLocal(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.LOADING_LOCAL, callback);
        return this;
    }

    /**
     * Method to handle the event before start loading metadata types from org on some processes
     * @param {Function} callback Callback function to handle progress when connection load metadata types from connected org
     * 
     * @returns {Connection} Returns the connection object
     */
    onLoadingOrg(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.LOADING_ORG, callback);
        return this;
    }

    /**
     * Method to handle the event before start copying files on some processes
     * @param {Function} callback Callback function to handle progress when connection start to copying files
     * 
     * @returns {Connection} Returns the connection object
     */
    onCopyData(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.COPY_DATA, callback);
        return this;
    }

    /**
     * Method to handle the event before start copying file content on some processes
     * @param {Function} callback Callback function to handle progress when connection star to copy a single file
     * 
     * @returns {Connection} Returns the connection object
     */
    onCopyFile(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.COPY_FILE, callback);
        return this;
    }

    /**
     * Method to handle the event before start compress XML File on some processes
     * @param {Function} callback Callback function to handle progress when start compress
     * 
     * @returns {Connection} Returns the connection object
     */
    onCompressFile(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.COMPRESS_FILE, callback);
        return this;
    }

    /**
     * Method to handle the event before download a Metadata Type from Org on some processes
     * @param {Function} callback Callback function to handle progress when start download metadata type
     * 
     * @returns {Connection} Returns the connection object
     */
    onBeforeDownloadType(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.BEFORE_DOWNLOAD_TYPE, callback);
        return this;
    }

    /**
     * Method to handle the event after download a Metadata Type from Org on some processes
     * @param {Function} callback Callback function to handle progress when metadata type is downloaded
     * 
     * @returns {Connection} Returns the connection object
     */
    onAfterDownloadType(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.AFTER_DOWNLOAD_TYPE, callback);
        return this;
    }

    /**
     * Method to handle the event before download a SObject when describe SObejcts
     * @param {Function} callback Callback function to handle progress when start download sobject
     * 
     * @returns {Connection} Returns the connection object
     */
    onBeforeDownloadSObject(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.BEFORE_DOWNLOAD_OBJECT, callback);
        return this;
    }

    /**
     * Method to handle the event after download a SObject when describe SObejcts
     * @param {Function} callback Callback function to handle progress when sobject is downloaded
     * 
     * @returns {Connection} Returns the connection object
     */
    onAfterDownloadSObject(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.AFTER_DOWNLOAD_OBJECT, callback);
        return this;
    }

    /**
     * Method to handle the event when error ocurred when download metadata
     * @param {Function} callback Callback function to handle error
     * 
     * @returns {Connection} Returns the connection object
     */
    onErrorDownload(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.DOWNLOAD_ERROR, callback);
        return this;
    }

    /**
     * Method to handle the event when connection is aborted
     * @param {Function} callback Callback function to call when connection is aborted
     * 
     * @returns {Connection} Returns the connection object
     */
    onAbort(callback: () => void) {
        this._event.on(EVENT.ABORT, callback);
        return this;
    }

    /**
     * Method to abort all connection running processes. When finishes call onAbort() callback
     */
    abortConnection(): void {
        this._abort = true;
        killProcesses(this);
        this._event.emit(EVENT.ABORT);
    }

    /**
     * Method to get the Auth Username from the org (If not found username, return the Alias)
     * 
     * @returns {Promise<string | undefined>} Return a String promise with the Username or Alias data
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     */
    getAuthUsername(): Promise<string | undefined> {
        startOperation(this);
        return new Promise<string | undefined>(async (resolve, reject) => {
            try {
                this._allowConcurrence = true;
                const authOrgs = await this.listAuthOrgs();
                let username;
                if (authOrgs && authOrgs.length > 0) {
                    const defaultUsername = this.usernameOrAlias || ProjectUtils.getOrgAlias(Validator.validateFolderPath(this.projectFolder));
                    if (defaultUsername) {
                        for (const authOrg of authOrgs) {
                            if (defaultUsername.indexOf('@') !== -1) {
                                if (authOrg.username && authOrg.username.toLowerCase().trim() === defaultUsername.toLowerCase().trim()) {
                                    username = authOrg.username;
                                }
                            } else {
                                if (authOrg.alias && authOrg.alias.toLowerCase().trim() === defaultUsername.toLowerCase().trim()) {
                                    username = authOrg.username;
                                }
                            }
                            if (!username && ((authOrg.username && authOrg.username.toLowerCase().trim() === defaultUsername.toLowerCase().trim()) || (authOrg.alias && authOrg.alias.toLowerCase().trim() === defaultUsername.toLowerCase().trim()))) {
                                username = authOrg.username;
                            }
                        }
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
     * @param {string} [usernameOrAlias] Username or alias to check. (If not provided, use usernameOrAlias from connection object)
     * 
     * @returns {Promise<string | undefined>} Return a String promise with the instance URL
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     */
    getServerInstance(usernameOrAlias?: string): Promise<string | undefined> {
        usernameOrAlias = usernameOrAlias || this.usernameOrAlias;
        startOperation(this);
        return new Promise<string | undefined>(async (resolve, reject) => {
            try {
                this._allowConcurrence = true;
                const authOrgs = await this.listAuthOrgs();
                let inbstanceUrl;
                if (usernameOrAlias && authOrgs && authOrgs.length > 0) {
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
     * @returns {Promise<AuthOrg[]>} Return a promise with all authorized org in the system 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     */
    listAuthOrgs(): Promise<AuthOrg[]> {
        startOperation(this);
        return new Promise<AuthOrg[]>((resolve, reject) => {
            try {
                const process = ProcessFactory.listAuthOurgs();
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
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
     * @param {string} query Query to execute (Required)
     * @param {boolean} [useToolingApi] true to use Tooling API to execute the query
     * 
     * @returns {Promise<any[]>} Return a promise with the record list 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     */
    query(query: string, useToolingApi?: boolean): Promise<any[]> {
        startOperation(this);
        return new Promise((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                const process = ProcessFactory.query(this.usernameOrAlias, query, useToolingApi);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
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
     * @returns {Promise<MetadataDetail[]>} Return a promise with the MetadataDetail objects from all available Metadata Types
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    listMetadataTypes(): Promise<MetadataDetail[]> {
        startOperation(this);
        return new Promise<MetadataDetail[]>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                const process = ProcessFactory.listMetadataTypes(this.usernameOrAlias, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
                        const objects = (response !== undefined) ? response.result.metadataObjects : undefined;
                        const metadataDetails = MetadataFactory.createMetadataDetails(objects);
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
     * @param {string[] | MetadataDetail[]} [typesOrDetails] List of Metadata Type API Names or Metadata Details to describe (undefined to describe all metadata types)
     * @param {boolean} [downloadAll] true to download all Metadata Types from the connected org, false to download only the org namespace Metadata Types
     * @param {boolean} [groupGlobalActions] True to group global quick actions on "GlobalActions" group, false to include as object and item.
     * 
     * @returns {Promise<{ [key: string]: MetadataType }>} Return a promise with Metadata JSON Object with the selected Metadata Types to describe
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     */
    describeMetadataTypes(typesOrDetails: string[] | MetadataDetail[], downloadAll?: boolean, groupGlobalActions?: boolean): Promise<{ [key: string]: MetadataType }> {
        startOperation(this);
        resetProgress(this);
        return new Promise<{ [key: string]: MetadataType }>(async (resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                this._allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(typesOrDetails);
                this._increment = calculateIncrement(metadataToProcess);
                callEvent(this, EVENT.PREPARE);
                let foldersByType;
                if (metadataToProcess.includes(MetadataTypes.REPORT) || metadataToProcess.includes(MetadataTypes.DASHBOARD) || metadataToProcess.includes(MetadataTypes.EMAIL_TEMPLATE) || metadataToProcess.includes(MetadataTypes.DOCUMENT)) {
                    foldersByType = await getFoldersByType(this);
                }
                let metadata: { [key: string]: MetadataType } = {};
                const batchesToProcess = getBatches(this, metadataToProcess);
                for (const batch of batchesToProcess) {
                    downloadMetadata(this, batch.records, downloadAll, foldersByType, groupGlobalActions).then((downloadedMetadata) => {
                        Object.keys(downloadedMetadata).forEach(function (key) {
                            metadata[key] = downloadedMetadata[key];
                        });
                        batch.completed = true;
                        let nCompleted = 0;
                        for (const resultBatch of batchesToProcess) {
                            if (resultBatch.completed) {
                                nCompleted++;
                            }
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
                        return;
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
     * @param {string} [category] Object Category. Values are: Standard, Custom, All. (All by default) 
     * 
     * @returns {Promise<string[]>} Return a promise with a list with the sObject names 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    listSObjects(category?: string): Promise<string[]> {
        startOperation(this);
        return new Promise<string[]>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                const process = ProcessFactory.listSObjects(this.usernameOrAlias, category, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
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
     * @param {string | string[]} sObjects List with the object API Names to describe
     * 
     * @returns {Promise<{ [key: string]: SObject }>} Return a promise with a SObjects data
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     */
    describeSObjects(sObjects: string | string[]): Promise<{ [key: string]: SObject }> {
        startOperation(this);
        resetProgress(this);
        return new Promise<{ [key: string]: SObject }>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                sObjects = Utils.forceArray(sObjects);
                this._increment = calculateIncrement(sObjects);
                callEvent(this, EVENT.PREPARE);
                let resultObjects: { [key: string]: SObject } = {};
                const batchesToProcess = getBatches(this, sObjects);
                for (const batch of batchesToProcess) {
                    downloadSObjectsData(this, batch.records).then((downloadedSObjects) => {
                        Object.keys(downloadedSObjects).forEach(function (key) {
                            resultObjects[key] = downloadedSObjects[key];
                        });
                        batch.completed = true;
                        let nCompleted = 0;
                        for (const resultBatch of batchesToProcess) {
                            if (resultBatch.completed) {
                                nCompleted++;
                            }
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
     * @param {boolean} useMetadataAPI True to use Metadata API format, false to use source format
     * @param {string} [targetDir] Path to the target dir when retrieve with Metadata API Format
     * @param {string | number} [waitMinutes] Number of minutes to wait for the command to complete and display results
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
    retrieve(useMetadataAPI: boolean, targetDir?: string, waitMinutes?: string | number): Promise<RetrieveResult> {
        startOperation(this);
        resetProgress(this);
        return new Promise<RetrieveResult>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
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
                    this.handleResponse(response, async () => {
                        const status = new RetrieveResult(response.result);
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
     * @param {string} retrieveId Retrieve Id to get the report (Required)
     * @param {string} targetDir Path to the target dir (Required)
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
    retrieveReport(retrieveId: string, targetDir: string): Promise<RetrieveStatus> {
        startOperation(this);
        resetProgress(this);
        return new Promise<RetrieveStatus>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                this._allowConcurrence = true;
                targetDir = Validator.validateFolderPath(targetDir);
                let process = ProcessFactory.mdapiRetrieveReport(this.usernameOrAlias, retrieveId, targetDir);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
                        const status = new RetrieveStatus(response.result);
                        this._allowConcurrence = false;
                        endOperation(this);
                        resolve(status);
                    });
                }).catch((error) => {
                    this._allowConcurrence = false;
                    if (error.message && error.message.indexOf('Retrieve result has been deleted') !== -1) {
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
     * @param {string} [testLevel] Level of deployment tests to run. Values are 'NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'
     * @param {string | string[]} [runTests] String with comma separated test names to execute or list with the test names to execute
     * @param {boolean} [useMetadataAPI] True to validate deploy using Metadata API Format, false to use Source Format
     * @param {string | number} [waitMinutes] Number of minutes to wait for the command to complete and display results
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
    validateDeploy(testLevel?: string, runTests?: string | string[], useMetadataAPI?: boolean, waitMinutes?: string | number): Promise<DeployStatus> {
        startOperation(this);
        resetProgress(this);
        return new Promise<DeployStatus>((resolve, reject) => {
            if (runTests && Array.isArray(runTests)) {
                runTests = runTests.join(',');
            }
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
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
                    this.handleResponse(response, () => {
                        const validationId = new DeployStatus(response.result);
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
     * @param {string} [testLevel] Level of deployment tests to run. Values are 'NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'
     * @param {string | string[]} [runTests] String with comma separated test names to execute or list with the test names to execute
     * @param {boolean} [useMetadataAPI] True to Deploy data using Metadata API Format, false to use Source Format
     * @param {string | number} [waitMinutes] Number of minutes to wait for the command to complete and display results
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
    deployPackage(testLevel?: string, runTests?: string | string[], useMetadataAPI?: boolean, waitMinutes?: string | number): Promise<DeployStatus> {
        startOperation(this);
        resetProgress(this);
        return new Promise<DeployStatus>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                const testsToRun = Utils.forceArray(runTests);
                let process;
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                if (useMetadataAPI) {
                    const packageFolder = Validator.validateFolderPath(this.packageFolder);
                    process = ProcessFactory.mdapiDeployPackage(this.usernameOrAlias, packageFolder, projectFolder, testLevel, (testsToRun) ? testsToRun.join(',') : undefined, this.apiVersion, waitMinutes);
                } else {
                    const packageFile = Validator.validateFilePath(this.packageFile);
                    process = ProcessFactory.sourceDeployPackage(this.usernameOrAlias, packageFile, projectFolder, testLevel, (testsToRun) ? testsToRun.join(',') : undefined, this.apiVersion, waitMinutes);
                }
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
                        const status = new DeployStatus(response.result);
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
     * Method to deploy the selected Metadata Types to the org using Source API
     * @param {string | string[] | { [key: string]: MetadataType }} types Metadata JSON Object with the selected elements to deploy or comma separated values String with the metadata types to deploy to array with Metadata names to deploy
     * @param {string} [testLevel] Level of deployment tests to run. Values are 'NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'
     * @param {String | Array<String>} [runTests] String with comma separated test names to execute or list with the test names to execute
     * @param {string | number} [waitMinutes] Number of minutes to wait for the command to complete and display results
     * 
     * @returns {Promise<DeployStatus>} Return a promise with the DeployStatus object with the deploy status result 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the project folder or package folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the project folder or package folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the project folder or package folder is not a directory
     * @throws {WrongFormatException} If JSON Metadata Object has incorrect format
     * @throws {InvalidFilePathException} If the package file is not a file
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    deploy(types: string | string[] | { [key: string]: MetadataType }, testLevel?: string, runTests?: string | string[], waitMinutes?: string | number): Promise<DeployStatus> {
        startOperation(this);
        resetProgress(this);
        return new Promise<DeployStatus>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                const testsToRun = Utils.forceArray(runTests);
                let process;
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                process = ProcessFactory.sourceDeploy(this.usernameOrAlias, projectFolder, transformMetadataTypesIntoCSV(types), testLevel, (testsToRun) ? testsToRun.join(',') : undefined, this.apiVersion, waitMinutes);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
                        const status = new DeployStatus(response.result);
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
     * @param {string} deployId Id to deploy the validated deployment (Required)
     * @param {boolean} [useMetadataAPI] True to execute quick deploy using Metadata API Format, false to use Source Format
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
    quickDeploy(deployId: string, useMetadataAPI?: boolean): Promise<DeployStatus> {
        startOperation(this);
        resetProgress(this);
        return new Promise<DeployStatus>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                let process;
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                if (useMetadataAPI) {
                    process = ProcessFactory.mdapiQuickDeploy(this.usernameOrAlias, deployId, projectFolder, this.apiVersion);
                } else {
                    process = ProcessFactory.sourceQuickDeploy(this.usernameOrAlias, deployId, projectFolder, this.apiVersion);
                }
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
                        const status = new DeployStatus(response.result);
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
     * @param {string} deployId Id to the deployment to get the report (Required)
     * @param {boolean} [useMetadataAPI] True to execute deploy report using Metadata API Format, false to use Source Format
     * @param {string | number} [waitMinutes] Number of minutes to wait for the command to complete and display results
     * 
     * @returns {Promise<DeployStatus>} Return a promise with the DeployStatus object with the deploy status result 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     */
    deployReport(deployId: string, useMetadataAPI?: boolean, waitMinutes?: string | number): Promise<DeployStatus> {
        startOperation(this);
        resetProgress(this);
        return new Promise<DeployStatus>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                this._allowConcurrence = true;
                let process;
                if (useMetadataAPI) {
                    process = ProcessFactory.mdapiDeployReport(this.usernameOrAlias, deployId, waitMinutes);
                } else {
                    process = ProcessFactory.sourceDeployReport(this.usernameOrAlias, deployId, waitMinutes);
                }
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
                        this._allowConcurrence = false;
                        const status = new DeployStatus(response.result);
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
     * @param {string} deployId Id to the deployment to cancel (Required)
     * @param {boolean} [useMetadataAPI] True to execute cancel deploy using Metadata API Format, false to use Source Format
     * @param {string | number} [waitMinutes] Number of minutes to wait for the command to complete and display results
     * 
     * @returns {Promise<DeployStatus>} Return a promise with the DeployStatus object with the deploy status result 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     */
    cancelDeploy(deployId: string, useMetadataAPI?: boolean, waitMinutes?: string | number): Promise<DeployStatus> {
        startOperation(this);
        resetProgress(this);
        return new Promise<DeployStatus>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                let process;
                if (useMetadataAPI) {
                    process = ProcessFactory.mdapiCancelDeploy(this.usernameOrAlias, deployId, waitMinutes);
                } else {
                    process = ProcessFactory.sourceCancelDeploy(this.usernameOrAlias, deployId, waitMinutes);
                }
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
                        const status = new DeployStatus(response.result);
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
     * @param {string} targetDir Path to the target dir to save the converted project (Required)
     * 
     * @returns {Promise<void>} Return an empty promise when conversion finish 
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
    convertProjectToSFDX(targetDir: string): Promise<void> {
        startOperation(this);
        resetProgress(this);
        return new Promise<void>((resolve, reject) => {
            try {
                const packageFile = Validator.validateFilePath(this.packageFile);
                const packageFolder = Validator.validateFolderPath(this.packageFolder);
                targetDir = Validator.validateFolderPath(targetDir);
                let process = ProcessFactory.convertToSFDX(packageFolder, packageFile, targetDir, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
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
     * @param {string} targetDir Path to the target dir to save the converted project (Required)
     * 
     * @returns {Promise<void>} Return an empty promise when conversion finish 
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
    convertProjectToMetadataAPI(targetDir: string): Promise<void> {
        startOperation(this);
        resetProgress(this);
        return new Promise<void>((resolve, reject) => {
            try {
                const packageFile = Validator.validateFilePath(this.packageFile);
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                let process = ProcessFactory.convertToMetadataAPI(packageFile, projectFolder, targetDir, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
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
     * @param {string} projectName Project Name to create (Required)
     * @param {string} [projectFolder] Path to save the project. If undefined use the connection project folder
     * @param {string} [template] Template to use to create the project. Empty by default
     * @param {boolean} [withManifest] True to create the project with manifest, false in otherwise
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
    createSFDXProject(projectName: string, projectFolder?: string, template?: string, withManifest?: boolean): Promise<SFDXProjectResult> {
        startOperation(this);
        resetProgress(this);
        return new Promise<SFDXProjectResult>((resolve, reject) => {
            try {
                let projectFolderRes = Validator.validateFolderPath(projectFolder || this.projectFolder);
                let process = ProcessFactory.createSFDXProject(projectName, projectFolderRes, template, this.namespacePrefix, withManifest);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
                        const result = new SFDXProjectResult(response.result);
                        projectFolderRes = StrUtils.replace(projectFolderRes, '\\', '/');
                        this.setProjectFolder(projectFolderRes + '/' + projectName);
                        if (withManifest) {
                            this.setPackageFolder(projectFolderRes + '/' + projectName + '/manifest');
                            this.setPackageFile(projectFolderRes + '/' + projectName + '/manifest/package.xml');
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
     * @param {string} [usernameOrAlias] Username or alias to auth. (Must be authorized in the system). If undefined use the connection username or alias
     * 
     * @returns {Promise<void>} Return an empty promise when operation finish
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the project folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the project folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the project folder is not a directory
     */
    setAuthOrg(usernameOrAlias?: string): Promise<void> {
        startOperation(this);
        resetProgress(this);
        return new Promise<void>((resolve, reject) => {
            try {
                const userNameRes = usernameOrAlias || this.usernameOrAlias;
                if (!userNameRes) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                let process = ProcessFactory.setAuthOrg(userNameRes, projectFolder);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
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
     * @param {string} query Query to extract the data (Required)
     * @param {string} outputPath Path to the folder to (Required)
     * @param {string} [prefix] Prefix to add to the created files
     * 
     * @returns {Promise<ExportTreeDataResult[]>} Return an array with the extrated data information
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongDirectoryPathException} If the output folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the output folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the output folder is not a directory
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    exportTreeData(query: string, outputPath: string, prefix?: string): Promise<ExportTreeDataResult[]> {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                outputPath = Validator.validateFolderPath(outputPath);
                let process = ProcessFactory.exportTreeData(this.usernameOrAlias, query, outputPath, prefix, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
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
     * @param {string} file Path to the file to import (Required)
     * 
     * @returns {Promise<ImportTreeDataResponse>} Return a promise with an object with the ok result and errors on insert
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error  
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     * @throws {WrongFilePathException} If the file is not a String or can't convert to absolute path
     * @throws {FileNotFoundException} If the file not exists or not have access to it
     * @throws {InvalidFilePathException} If the file is not a file
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    importTreeData(file: string): Promise<ImportTreeDataResponse> {
        startOperation(this);
        resetProgress(this);
        return new Promise<ImportTreeDataResponse>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                file = Validator.validateFilePath(file);
                let process = ProcessFactory.importTreeData(this.usernameOrAlias, file, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    if (response.status === 0) {
                        let results: ImportTreeDataResult[] = [];
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
     * @param {string} csvfile Path to the CSV file with the ids to delete (Required)
     * @param {string} sObject Records SObject API Name (Required)
     *  
     * @returns {Promise<BulkStatus[]>} Return a promise with an array with BulkStatus objects with the delete result
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
    bulkDelete(csvfile: string, sObject: string): Promise<BulkStatus[]> {
        startOperation(this);
        resetProgress(this);
        return new Promise<BulkStatus[]>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                csvfile = Validator.validateFilePath(csvfile);
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                let process = ProcessFactory.bulkDelete(this.usernameOrAlias, csvfile, sObject, projectFolder, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
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
     * @param {string} scriptfile Path to the script file (Required)
     *
     * @returns {Promise<string>} Return a promise with the execution log as String
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
    executeApexAnonymous(scriptfile: string): Promise<string> {
        startOperation(this);
        resetProgress(this);
        return new Promise<string>((resolve, reject) => {
            try {
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                scriptfile = Validator.validateFilePath(scriptfile);
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                let process = ProcessFactory.executeApexAnonymous(this.usernameOrAlias, scriptfile, projectFolder, this.apiVersion);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    this.handleResponse(response, () => {
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
     * @param {string} tmpFolder Temporal folder to save support files (Required)
     * 
     * @returns {Promise<string[]>} Return a promise with the list of user permissions
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system 
     * @throws {WrongDirectoryPathException} If the temp folder is not a String or can't convert to absolute path
     * @throws {DirectoryNotFoundException} If the temp folder not exists or not have access to it
     * @throws {InvalidDirectoryPathException} If the temp folder is not a directory
     * @throws {WrongDatatypeException} If the api version is not a Number or String. Can be undefined
     */
    loadUserPermissions(tmpFolder: string): Promise<string[]> {
        startOperation(this);
        resetProgress(this);
        return new Promise(async (resolve, reject) => {
            try {
                if (!this.packageFolder) {
                    throw new DataRequiredException('packageFolder');
                }
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                tmpFolder = Validator.validateFolderPath(tmpFolder);
                const originalProjectFolder = Validator.validateFolderPath(this.projectFolder);
                callEvent(this, EVENT.PREPARE);
                this._allowConcurrence = true;
                const metadata: { [key: string]: MetadataType } = {};
                const metadataType = new MetadataType(MetadataTypes.PROFILE, true);
                metadataType.childs["Admin"] = new MetadataObject("Admin", true);
                metadata[MetadataTypes.PROFILE] = metadataType;
                if (FileChecker.isExists(tmpFolder)) {
                    FileWriter.delete(tmpFolder);
                }
                FileWriter.createFolderSync(tmpFolder);
                callEvent(this, EVENT.CREATE_PROJECT);
                const createProjectOut = await this.createSFDXProject(PROJECT_NAME, tmpFolder, undefined, true);
                const packageResult = new PackageGenerator(this.apiVersion).setExplicit().createPackage(metadata, this.packageFolder);
                FileWriter.delete(this.projectFolder + '/.forceignore');
                const setDefaultOrgOut = await this.setAuthOrg(this.usernameOrAlias);
                callEvent(this, EVENT.RETRIEVE);
                const retrieveOut = await this.retrieve(false);
                callEvent(this, EVENT.PROCESS);
                const result = [];
                const xmlRoot = XMLParser.parseXML(FileReader.readFileSync(this.projectFolder + '/force-app/main/default/profiles/Admin.profile-meta.xml'), true);
                if (xmlRoot[MetadataTypes.PROFILE] && xmlRoot[MetadataTypes.PROFILE].userPermissions) {
                    let permissions = XMLUtils.forceArray(xmlRoot[MetadataTypes.PROFILE].userPermissions);
                    for (let permission of permissions) {
                        result.push(permission.name);
                    }
                }
                //callProgressCalback(this, EVENT.CLEANING);
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
     * @param {string} tmpFolder Temporal folder to save support files (Required)
     * @param {string | { [key: string]: MetadataType }} [types] Metadata JSON Object or Metadata JSON File with the specific types to retrieve. Undefined to retrieve all special types
     * @param {boolean} [compress] true to compress affected files, false in otherwise
     * @param {string} [sortOrder] Compress sort order when compress files
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
    retrieveLocalSpecialTypes(tmpFolder: string, types?: string | { [key: string]: MetadataType }, compress?: boolean, sortOrder?: string): Promise<RetrieveResult> {
        startOperation(this);
        resetProgress(this);
        return new Promise<RetrieveResult>(async (resolve, reject) => {
            try {
                if (!this.projectFolder) {
                    throw new DataRequiredException('projectFolder');
                }
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                let typesToRetrieve: { [key: string]: MetadataType } | undefined;
                tmpFolder = Validator.validateFolderPath(tmpFolder);
                if (types) {
                    typesToRetrieve = MetadataFactory.deserializeMetadataTypes(Validator.validateMetadataJSON(types));
                }
                const originalProjectFolder = this.projectFolder;
                callEvent(this, EVENT.PREPARE);
                const dataToRetrieve: string[] = [];
                Object.keys(SpecialMetadata).forEach(function (key) {
                    if (!typesToRetrieve || typesToRetrieve[key]) {
                        if (!dataToRetrieve.includes(key)) {
                            dataToRetrieve.push(key);
                        }
                        for (let child of SpecialMetadata[key]) {
                            if (!dataToRetrieve.includes(child)) {
                                dataToRetrieve.push(child);
                            }
                        }
                    }
                });
                this._allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(dataToRetrieve);
                this._increment = calculateIncrement(metadataToProcess);
                callEvent(this, EVENT.LOADING_LOCAL);
                const metadataDetails = await this.listMetadataTypes();
                const folderMetadataMap = MetadataFactory.createFolderMetadataMap(metadataDetails);
                const metadataFromFileSystem = MetadataFactory.createMetadataTypesFromFileSystem(folderMetadataMap, this.projectFolder);
                const metadata: { [key: string]: MetadataType } = {};
                for (const type of dataToRetrieve) {
                    if (metadataFromFileSystem[type]) {
                        metadata[type] = metadataFromFileSystem[type];
                    }
                }
                MetadataUtils.checkAll(metadata);
                if (FileChecker.isExists(tmpFolder)) {
                    FileWriter.delete(tmpFolder);
                }
                FileWriter.createFolderSync(tmpFolder);
                callEvent(this, EVENT.CREATE_PROJECT);
                const createProjectOut = await this.createSFDXProject(PROJECT_NAME, tmpFolder, undefined, true);
                if (this.packageFolder) {
                    const packageResult = new PackageGenerator(this.apiVersion).setExplicit().createPackage(metadata, this.packageFolder);
                }
                FileWriter.delete(this.projectFolder + '/.forceignore');
                const setDefaultOrgOut = await this.setAuthOrg(this.usernameOrAlias);
                callEvent(this, EVENT.RETRIEVE);
                const retrieveOut = await this.retrieve(false);
                waitForFiles(this.projectFolder);
                callEvent(this, EVENT.COPY_DATA);
                if (typesToRetrieve) {
                    copyMetadataFiles(this, originalProjectFolder, folderMetadataMap, typesToRetrieve, metadataFromFileSystem, compress, sortOrder);
                }
                //callProgressCalback(this, EVENT.CLEANING);
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
     * @param {string} tmpFolder Temporal folder to save support files (Required)
     * @param {Object} [types] Metadata JSON Object or Metadata JSON File with the specific types to retrieve. Undefined to retrieve all special types
     * @param {boolean} [downloadAll] true to download all related data from any namespace, false to downlaod only the org namespace data
     * @param {boolean} [compress] true to compress affected files, false in otherwise
     * @param {string} [sortOrder] Compress sort order when compress files
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
    retrieveMixedSpecialTypes(tmpFolder: string, types?: string | { [key: string]: MetadataType }, downloadAll?: boolean, compress?: boolean, sortOrder?: string): Promise<RetrieveResult> {
        startOperation(this);
        resetProgress(this);
        return new Promise<RetrieveResult>(async (resolve, reject) => {
            try {
                if (!this.projectFolder) {
                    throw new DataRequiredException('projectFolder');
                }
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                let typesToRetrieve: { [key: string]: MetadataType } | undefined;
                tmpFolder = Validator.validateFolderPath(tmpFolder);
                if (types) {
                    typesToRetrieve = MetadataFactory.deserializeMetadataTypes(Validator.validateMetadataJSON(types));
                }
                const originalProjectFolder = this.projectFolder;
                callEvent(this, EVENT.PREPARE);
                const dataToRetrieve: string[] = [];
                Object.keys(SpecialMetadata).forEach(function (key) {
                    if (!typesToRetrieve || typesToRetrieve[key]) {
                        if (!dataToRetrieve.includes(key)) {
                            dataToRetrieve.push(key);
                        }
                        for (let child of SpecialMetadata[key]) {
                            if (!dataToRetrieve.includes(child)) {
                                dataToRetrieve.push(child);
                            }
                        }
                    }
                });
                this._allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(dataToRetrieve);
                this._increment = calculateIncrement(metadataToProcess);
                callEvent(this, EVENT.LOADING_LOCAL);
                const metadataDetails = await this.listMetadataTypes();
                const folderMetadataMap = MetadataFactory.createFolderMetadataMap(metadataDetails);
                const metadataFromFileSystem = MetadataFactory.createMetadataTypesFromFileSystem(folderMetadataMap, this.projectFolder);
                let metadata: { [key: string]: MetadataType } = {};
                for (const type of dataToRetrieve) {
                    if (metadataFromFileSystem[type]) {
                        metadata[type] = metadataFromFileSystem[type];
                    }
                }
                callEvent(this, EVENT.LOADING_ORG);
                const metadataFromOrg = await this.describeMetadataTypes(dataToRetrieve, downloadAll);
                this._allowConcurrence = true;
                metadata = MetadataUtils.combineMetadata(metadata, metadataFromOrg);
                MetadataUtils.checkAll(metadata);
                if (FileChecker.isExists(tmpFolder)) {
                    FileWriter.delete(tmpFolder);
                }
                FileWriter.createFolderSync(tmpFolder);
                callEvent(this, EVENT.CREATE_PROJECT);
                const createProjectOut = await this.createSFDXProject(PROJECT_NAME, tmpFolder, undefined, true);
                if (this.packageFolder) {
                    const packageResult = new PackageGenerator(this.apiVersion).setExplicit().createPackage(metadata, this.packageFolder);
                }
                FileWriter.delete(this.projectFolder + '/.forceignore');
                const setDefaultOrgOut = await this.setAuthOrg(this.usernameOrAlias);
                callEvent(this, EVENT.RETRIEVE);
                const retrieveOut = await this.retrieve(false);
                waitForFiles(this.projectFolder);
                callEvent(this, EVENT.COPY_DATA);
                if (typesToRetrieve) {
                    copyMetadataFiles(this, originalProjectFolder, folderMetadataMap, typesToRetrieve, metadata, compress, sortOrder);
                }
                //callProgressCalback(this, EVENT.CLEANING);
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
     * @param {string} tmpFolder Temporal folder to save support files (Required)
     * @param {Object} [types] Metadata JSON Object or Metadata JSON File with the specific types to retrieve. Undefined to retrieve all special types
     * @param {boolean} [downloadAll] true to download all related data from any namespace, false to downlaod only the org namespace data
     * @param {boolean} [compress] true to compress affected files, false in otherwise
     * @param {string} [sortOrder] Compress sort order when compress files
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
    retrieveOrgSpecialTypes(tmpFolder: string, types?: string | { [key: string]: MetadataType }, downloadAll?: boolean, compress?: boolean, sortOrder?: string): Promise<RetrieveResult> {
        startOperation(this);
        resetProgress(this);
        return new Promise<RetrieveResult>(async (resolve, reject) => {
            try {
                if (!this.projectFolder) {
                    throw new DataRequiredException('projectFolder');
                }
                if (!this.usernameOrAlias) {
                    throw new DataRequiredException('usernameOrAlias');
                }
                let typesToRetrieve: { [key: string]: MetadataType } | undefined;
                tmpFolder = Validator.validateFolderPath(tmpFolder);
                if (types) {
                    typesToRetrieve = MetadataFactory.deserializeMetadataTypes(Validator.validateMetadataJSON(types));
                }
                const originalProjectFolder = this.projectFolder;
                callEvent(this, EVENT.PREPARE);
                const dataToRetrieve: string[] = [];
                Object.keys(SpecialMetadata).forEach(function (key) {
                    if (!typesToRetrieve || typesToRetrieve[key]) {
                        if (!dataToRetrieve.includes(key)) {
                            dataToRetrieve.push(key);
                        }
                        for (let child of SpecialMetadata[key]) {
                            if (!dataToRetrieve.includes(child)) {
                                dataToRetrieve.push(child);
                            }
                        }
                    }
                });
                this._allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(dataToRetrieve);
                this._increment = calculateIncrement(metadataToProcess);
                callEvent(this, EVENT.LOADING_ORG);
                const metadataDetails = await this.listMetadataTypes();
                const folderMetadataMap = MetadataFactory.createFolderMetadataMap(metadataDetails);
                const metadataFromOrg = await this.describeMetadataTypes(dataToRetrieve, downloadAll);
                this._allowConcurrence = true;
                MetadataUtils.checkAll(metadataFromOrg);
                if (FileChecker.isExists(tmpFolder)){
                    FileWriter.delete(tmpFolder);
                }
                FileWriter.createFolderSync(tmpFolder);
                callEvent(this, EVENT.CREATE_PROJECT);
                const createProjectOut = await this.createSFDXProject(PROJECT_NAME, tmpFolder, undefined, true);
                if(this.packageFolder){
                    const packageResult = new PackageGenerator(this.apiVersion).setExplicit().createPackage(metadataFromOrg, this.packageFolder);
                }
                FileWriter.delete(this.projectFolder + '/.forceignore');
                const setDefaultOrgOut = await this.setAuthOrg(this.usernameOrAlias);
                callEvent(this, EVENT.RETRIEVE);
                const retrieveOut = await this.retrieve(false);
                waitForFiles(this.projectFolder);
                callEvent(this, EVENT.COPY_DATA);
                if(typesToRetrieve){
                    copyMetadataFiles(this, originalProjectFolder, folderMetadataMap, typesToRetrieve, metadataFromOrg, compress, sortOrder);
                }
                //callProgressCalback(this, EVENT.CLEANING);
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

    handleResponse(response: any, onSuccess: () => void) {
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
            };
            onSuccess.call(this);
        }
    }
}

function transformMetadataTypesIntoCSV(types: string | string[] | { [key: string]: MetadataType }): string {
    if (!Array.isArray(types) && typeof types === 'object') {
        const result = [];
        for (const metadataTypeKey of Object.keys(types)) {
            const metadataType = types[metadataTypeKey];
            if (MetadataUtils.haveChilds(metadataType)) {
                for (const metadataObjectKey of Object.keys(metadataType.childs)) {
                    const metadataObject = metadataType.childs[metadataObjectKey];
                    if (MetadataUtils.haveChilds(metadataObject)) {
                        for (const metadataItemKey of Object.keys(metadataObject.childs)) {
                            const metadataItem = metadataObject.childs[metadataItemKey];
                            if (metadataItem.checked) {
                                result.push(metadataTypeKey + ':' + metadataObjectKey + '.' + metadataItemKey);
                            }
                        }
                    } else if (metadataObject.checked) {
                        result.push(metadataTypeKey + ':' + metadataObjectKey);
                    }
                }
            } else if (metadataType.checked) {
                result.push(metadataTypeKey);
            }
        }
        return result.join(',');
    } else if (typeof types !== 'string') {
        return types.join(',');
    }
    return types;
}

function waitForFiles(folder: string): Promise<void> {
    return new Promise<void>(async (resolve) => {
        let files = await FileReader.getAllFiles(folder);
        while (files.length === 0) {
            files = await FileReader.getAllFiles(folder);
        }
        resolve();
    });
}

function restoreOriginalProjectData(connection: Connection, originalProjectFolder: string) {
    connection.setProjectFolder(originalProjectFolder);
    connection.setPackageFolder(originalProjectFolder + '/manifest');
    connection.setPackageFile(originalProjectFolder + '/manifest/package.xml');
}

function copyMetadataFiles(connection: Connection, targetProject: string, folderMetadataMap: { [key: string]: MetadataDetail }, types: { [key: string]: MetadataType }, metadataTypes: { [key: string]: MetadataType }, compress?: boolean, compressOrder?: string) {
    const path = connection.projectFolder;
    for (const folder of (Object.keys(folderMetadataMap))) {
        const metadataDetail = folderMetadataMap[folder];
        const metadataTypeName = metadataDetail.xmlName;
        if (!SpecialMetadata[metadataTypeName] || !metadataTypes[metadataTypeName]) {
            continue;
        }
        const haveTypesToCopy = types !== undefined;
        const typeToCopy = haveTypesToCopy ? types[metadataTypeName] : undefined;
        if (haveTypesToCopy && !typeToCopy) {
            continue;
        }
        const metadataType = metadataTypes[metadataTypeName];
        if (!metadataType.hasChilds()) {
            continue;
        }
        for (const metadataObjectName of Object.keys(metadataType.getChilds())) {
            const objectToCopy = (!typeToCopy || !typeToCopy.hasChilds()) ? undefined : typeToCopy.childs[metadataObjectName];
            const metadataObject = metadataType.getChild(metadataObjectName);
            if (metadataObject?.hasChilds()) {
                for (const metadataItemName of Object.keys(metadataObject.getChilds())) {
                    const itemToCopy = (!objectToCopy || !objectToCopy.hasChilds()) ? undefined : objectToCopy.childs[metadataItemName];
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
                            callEvent(connection, EVENT.COPY_FILE, metadataTypeName, metadataObjectName, metadataItemName, targetFile);
                            if (!FileChecker.isExists(targetFolder)) {
                                FileWriter.createFolderSync(targetFolder);
                            }
                            FileWriter.createFileSync(targetFile, FileReader.readFileSync(sourceFile));
                            if (compress) {
                                callEvent(connection, EVENT.COMPRESS_FILE, metadataTypeName, metadataObjectName, metadataItemName, targetFile);
                                new XMLCompressor(targetFile, compressOrder).compressSync();
                            }
                        }
                    }
                }
            } else {
                if (!haveTypesToCopy || (typeToCopy && typeToCopy.checked) || (objectToCopy && objectToCopy.checked)) {
                    let subPath;
                    let fileName = metadataObjectName + '.' + metadataDetail.suffix + '-meta.xml';
                    if (metadataTypeName === MetadataTypes.CUSTOM_OBJECT) {
                        subPath = '/force-app/main/default/' + metadataDetail.directoryName + '/' + metadataObjectName + '/' + fileName;
                    } else {
                        subPath = '/force-app/main/default/' + metadataDetail.directoryName + '/' + fileName;
                    }
                    let sourceFile = path + '/' + subPath;
                    let targetFile = targetProject + subPath;
                    let targetFolder = PathUtils.getDirname(targetFile);
                    if (FileChecker.isExists(sourceFile)) {
                        callEvent(connection, EVENT.COPY_FILE, metadataTypeName, metadataObjectName, undefined, targetFile);
                        if (!FileChecker.isExists(targetFolder)) {
                            FileWriter.createFolderSync(targetFolder);
                        }
                        FileWriter.createFileSync(targetFile, FileReader.readFileSync(sourceFile));
                        if (compress) {
                            callEvent(connection, EVENT.COMPRESS_FILE, metadataTypeName, metadataObjectName, undefined, targetFile);
                            new XMLCompressor(targetFile, compressOrder).compressSync();
                        }
                    }
                }
            }
        }
    }
}

function processExportTreeDataOut(response: string): ExportTreeDataResult[] {
    let outData = StrUtils.replace(response, '\n', '').split(',');
    let dataToReturn: ExportTreeDataResult[] = [];
    for (let data of outData) {
        let splits = data.split(" ");
        let nRecords = Number(splits[1]);
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

function callEvent(connection: Connection, stage: string, entityName?: string, entityType?: string, entityItem?: string, data?: any) {
    connection._event.emit(stage, new ProgressStatus(connection._increment, connection._percentage, entityName, entityType, entityItem, data));
}

function downloadMetadata(connection: Connection, metadataToDownload: string[], downloadAll?: boolean, foldersByType?: { [key: string]: any[] }, groupGlobalActions?: boolean): Promise<{ [key: string]: MetadataType }> {
    return new Promise<{ [key: string]: MetadataType }>(async (resolve, reject) => {
        try {
            const metadata: { [key: string]: MetadataType } = {};
            for (const metadataTypeName of metadataToDownload) {
                try {
                    if (connection._abort) {
                        connection._allowConcurrence = false;
                        endOperation(connection);
                        resolve(metadata);
                        return;
                    }
                    callEvent(connection, EVENT.BEFORE_DOWNLOAD_TYPE, metadataTypeName);
                    if (metadataTypeName === MetadataTypes.REPORT || metadataTypeName === MetadataTypes.DASHBOARD || metadataTypeName === MetadataTypes.EMAIL_TEMPLATE || metadataTypeName === MetadataTypes.DOCUMENT) {
                        const records = await connection.query(METADATA_QUERIES[metadataTypeName]);
                        if (!records || records.length === 0) {
                            continue;
                        }
                        const metadataType = MetadataFactory.createMetadataTypeFromRecords(metadataTypeName, records, foldersByType, connection.namespacePrefix, downloadAll);
                        connection._percentage += connection._increment;
                        if (metadataType !== undefined && metadataType.hasChilds()) {
                            metadata[metadataTypeName] = metadataType;
                        }
                        callEvent(connection, EVENT.AFTER_DOWNLOAD_TYPE, metadataTypeName, undefined, undefined, metadataType);
                    } else if (NotIncludedMetadata[metadataTypeName]) {
                        const metadataType = MetadataFactory.createNotIncludedMetadataType(metadataTypeName);
                        connection._percentage += connection._increment;
                        if (metadataType !== undefined && metadataType.hasChilds()) {
                            metadata[metadataTypeName] = metadataType;
                        }
                        callEvent(connection, EVENT.AFTER_DOWNLOAD_TYPE, metadataTypeName, undefined, undefined, metadataType);
                    } else if (connection.usernameOrAlias) {
                        const process = ProcessFactory.describeMetadataType(connection.usernameOrAlias, metadataTypeName, undefined, connection.apiVersion);
                        addProcess(connection, process);
                        const response = await ProcessHandler.runProcess(process);
                        connection.handleResponse(response, () => {
                            const metadataType = MetadataFactory.createMetedataTypeFromResponse(metadataTypeName, response, connection.namespacePrefix, downloadAll, groupGlobalActions);
                            connection._percentage += connection._increment;
                            if (metadataType !== undefined && metadataType.hasChilds()) {
                                metadata[metadataTypeName] = metadataType;
                            }
                            callEvent(connection, EVENT.AFTER_DOWNLOAD_TYPE, metadataTypeName, undefined, undefined, metadataType);
                        });
                    }
                } catch (error) {
                    const err = error as Error;
                    callEvent(connection, EVENT.DOWNLOAD_ERROR, metadataTypeName, undefined, undefined, err.message);
                    /*if (error.message.indexOf('INVALID_TYPE') === -1)
                        throw error;*/
                }
            }
            resolve(metadata);
        } catch (error) {
            reject(error);
        }
    });
}

function downloadSObjectsData(connection: Connection, sObjects: string[]): Promise<{ [key: string]: SObject }> {
    return new Promise<{ [key: string]: SObject }>(async (resolve, reject) => {
        try {
            const sObjectsResult: { [key: string]: SObject } = {};
            if (connection.usernameOrAlias) {
                for (const sObject of sObjects) {
                    try {
                        if (connection._abort) {
                            endOperation(connection);
                            resolve(sObjectsResult);
                            return;
                        }
                        callEvent(connection, EVENT.BEFORE_DOWNLOAD_OBJECT, MetadataTypes.CUSTOM_OBJECT, sObject);
                        const process = ProcessFactory.getSObjectSchema(connection.usernameOrAlias, sObject, connection.apiVersion);
                        addProcess(connection, process);
                        const response = await ProcessHandler.runProcess(process);
                        connection.handleResponse(response, () => {
                            const sObjectResult = MetadataFactory.createSObjectFromJSONSchema(response);
                            connection._percentage += connection._increment;
                            if (sObjectResult !== undefined) {
                                sObjectsResult[sObject] = sObjectResult;
                            }
                            callEvent(connection, EVENT.AFTER_DOWNLOAD_OBJECT, MetadataTypes.CUSTOM_OBJECT, sObject, undefined, sObjectResult);
                        });
                    } catch (error) {
                        const err = error as Error;
                        callEvent(connection, EVENT.DOWNLOAD_ERROR, sObject, undefined, undefined, err.message);
                    }
                }
            }
            resolve(sObjectsResult);
        } catch (error) {
            reject(error);
        }
    });
}

function getBatches(connection: Connection, objects: string[]) {
    const nBatches = (connection.multiThread) ? OSUtils.getAvailableCPUs() : 1;
    const recordsPerBatch = Math.ceil(objects.length / nBatches);
    const batches: BatchData[] = [];
    let counter = 0;
    let batch: BatchData | undefined;
    for (const object of objects) {
        if (!batch) {
            batch = {
                batchId: 'Bacth_' + counter,
                records: [],
                completed: false
            };
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
    if (batch){
        batches.push(batch);
    }
    return batches;
}

function calculateIncrement(objects: string[]) {
    return MathUtils.round(100 / objects.length, 2);
}

function getMetadataTypeNames(typesOrDetails: string[] | MetadataDetail[]) {
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

function getFoldersByType(connection: Connection): Promise<{ [key: string]: any[] }> {
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
                let result: { [key: string]: any[] } = {};
                for (const folder of records) {
                    if (!result[folder.Type]) {
                        result[folder.Type] = [];
                    }
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

function resetProgress(connection: Connection): void {
    connection._percentage = 0;
    connection._increment = 0;
}

function killProcesses(connection: Connection): void {
    if (connection._processes && Object.keys(connection._processes).length > 0) {
        for (let process of Object.keys(connection._processes)) {
            killProcess(connection, connection._processes[process]);
        }
    }
}

function killProcess(connection: Connection, process: Process): void {
    process.kill();
    delete connection._processes[process.name];
}

function startOperation(connection: Connection): void {
    if (!connection._allowConcurrence) {
        if (connection._inProgress) {
            throw new OperationNotAllowedException('Connection in use. Abort the current operation to execute other.');
        }
        connection._abort = false;
        connection._inProgress = true;
        connection._processes = {};
    }
}

function endOperation(connection: Connection): void {
    if (!connection._allowConcurrence) {
        connection._inProgress = false;
        connection._processes = {};
    }
}

function addProcess(connection: Connection, process: Process): void {
    if (connection._processes === undefined) {
        connection._processes = {};
    }
    connection._processes[process.name] = process;
}

function createAuthOrgs(orgs: any | any[]): AuthOrg[] {
    const authOrgs = [];
    if (orgs !== undefined) {
        orgs = Utils.forceArray(orgs);
        for (const org of orgs) {
            authOrgs.push(new AuthOrg(org));
        }
    }
    return authOrgs;
}

interface BatchData {
    batchId: string;
    records: string[];
    completed: boolean;
}