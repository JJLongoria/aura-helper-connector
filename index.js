const { ProcessHandler, ProcessFactory } = require('@ah/core').ProcessManager;
const { RetrieveStatus, DeployStatus, RetrieveResult, SFDXProjectResult, BulkStatus, AuthOrg, MetadataType, MetadataObject, ProgressStatus } = require('@ah/core').Types;
const { OSUtils, Utils, MathUtils, StrUtils, Validator, MetadataUtils, ProjectUtils } = require('@ah/core').CoreUtils;
const { MetadataTypes, NotIncludedMetadata, SpecialMetadata, ProgressStages } = require('@ah/core').Values;
const { FileChecker, FileReader, FileWriter, PathUtils } = require('@ah/core').FileSystem;
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
class Connection {

    constructor(usernameOrAlias, apiVersion, projectFolder, namespacePrefix) {
        this.usernameOrAlias = usernameOrAlias;
        this.apiVersion = apiVersion;
        this.projectFolder = (projectFolder !== undefined) ? PathUtils.getAbsolutePath(projectFolder) : projectFolder;
        this.processes = {};
        this.abort = false;
        this.percentage = 0;
        this.increment = 0;
        this.inProgress;
        this.namespacePrefix = (namespacePrefix !== undefined) ? namespacePrefix : '';
        this.multiThread = false;
        this.abortCallback;
        this.progressCallback;
        this.allowConcurrence = false;
        this.packageFolder = this.projectFolder + '/manifest';
        this.packageFile = this.projectFolder + '/manifest/package.xml';
    }

    onProgress(progressCallback) {
        this.progressCallback = progressCallback;
    }

    onAbort(abortCallback) {
        this.abortCallback = abortCallback;
    }

    abortConnection() {
        this.abort = true;
        killProcesses(this);
        if (this.abortCallback)
            this.abortCallback.call(this);
    }

    setUsernameOrAlias(usernameOrAlias) {
        this.usernameOrAlias = usernameOrAlias;
        return this;
    }

    setApiVersion(apiVersion) {
        this.apiVersion = apiVersion;
        return this;
    }

    setProjectFolder(projectFolder) {
        this.projectFolder = (projectFolder !== undefined) ? PathUtils.getAbsolutePath(projectFolder) : projectFolder;
        this.packageFolder = this.projectFolder + '/manifest';
        this.packageFile = this.projectFolder + '/manifest/package.xml';
        return this;
    }

    setPackageFile(packageFile) {
        this.packageFile = (packageFile !== undefined) ? PathUtils.getAbsolutePath(packageFile) : packageFile;
        return this;
    }

    setPackageFolder(packageFolder) {
        this.packageFolder = (packageFolder !== undefined) ? PathUtils.getAbsolutePath(packageFolder) : packageFolder;
        this.packageFile = this.projectFolder + '/manifest/package.xml';
        return this;
    }

    setNamespacePrefix(namespacePrefix) {
        this.namespacePrefix = (namespacePrefix !== undefined) ? namespacePrefix : '';
        return this;
    }

    setMultiThread() {
        this.multiThread = true;
        return this;
    }

    setSingleThread() {
        this.multiThread = false;
        return this;
    }

    getAuthUsername() {
        startOperation(this);
        return new Promise(async (resolve, reject) => {
            try {
                this.allowConcurrence = true;
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
                    this.allowConcurrence = false;
                    endOperation(this);
                    resolve(username);
                } else {
                    this.allowConcurrence = false;
                    endOperation(this);
                    resolve(undefined);
                }
            } catch (error) {
                this.allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    getServerInstance(usernameOrAlias) {
        usernameOrAlias = usernameOrAlias || this.usernameOrAlias;
        startOperation(this);
        return new Promise(async (resolve, reject) => {
            try {
                this.allowConcurrence = true;
                const authOrgs = await this.listAuthOrgs();
                let inbstanceUrl;
                if (authOrgs && authOrgs.length > 0) {
                    for (const authOrg of authOrgs) {
                        if ((usernameOrAlias.indexOf('@') !== -1 && authOrg.username === usernameOrAlias) || (usernameOrAlias.indexOf('@') === -1 && authOrg.alias === usernameOrAlias)) {
                            inbstanceUrl = authOrg.instanceUrl;
                            break;
                        }
                    }
                    this.allowConcurrence = false;
                    endOperation(this);
                    resolve(inbstanceUrl);
                } else {
                    this.allowConcurrence = false;
                    endOperation(this);
                    resolve(undefined);
                }
            } catch (error) {
                this.allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    query(query, userToolingApi) {
        startOperation(this);
        return new Promise((resolve, reject) => {
            try {
                const process = ProcessFactory.query(this.usernameOrAlias, query, userToolingApi);
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

    describeMetadataTypes(typesOrDetails, downloadAll) {
        const progressCallback = getCallback(arguments, this);
        startOperation(this);
        resetProgress(this);
        return new Promise(async (resolve, reject) => {
            try {
                this.allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(typesOrDetails);
                this.increment = calculateIncrement(metadataToProcess);
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
                            this.allowConcurrence = false;
                            endOperation(this);
                            resolve(metadata);
                            return;
                        }
                    }).catch((error) => {
                        this.allowConcurrence = false;
                        endOperation(this);
                        reject(error);
                    });
                }
            } catch (error) {
                this.allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

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

    describeSObjects(sObjects) {
        const progressCallback = getCallback(arguments, this);
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                this.increment = calculateIncrement(sObjects);
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

    retrieve(useMetadataAPI, waitMinutes, targetDir) {
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

    retrieveReport(retrieveId, targetDir) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                targetDir = Validator.validateFolderPath(targetDir);
                let process = ProcessFactory.mdapiRetrieveReport(this.usernameOrAlias, retrieveId, targetDir);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const status = (response !== undefined) ? new RetrieveStatus(response.result) : undefined;
                        endOperation(this);
                        resolve(status);
                    });
                }).catch((error) => {
                    if (error.message && error.message.indexOf('Retrieve result has been deleted') != -1) {
                        resolve(new RetrieveStatus(retrieveId, 'Succeeded', true, true));
                    }
                    endOperation(this);
                    reject(error);
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

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

    deployReport(deployId, useMetadataAPI, waitMinutes) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                let process;
                if (useMetadataAPI) {
                    process = ProcessFactory.mdapiDeployReport(this.usernameOrAlias, deployId, waitMinutes);
                } else {
                    process = ProcessFactory.sourceDeployReport(this.usernameOrAlias, deployId, waitMinutes);
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

    convertProjectToMetadataAPI(targetDir) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                const packageFile = Validator.validateFilePath(this.packageFile);
                const projectFolder = Validator.validateFolderPath(this.packageFile);
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
                    reject(new Error(error));
                });
            } catch (error) {
                endOperation(this);
                reject(error);
            }
        });
    }

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

    loadUserPermissions(tmpFolder) {
        const progressCallback = getCallback(arguments, this);
        startOperation(this);
        resetProgress(this);
        return new Promise(async (resolve, reject) => {
            try {
                tmpFolder = Validator.validateFolderPath(tmpFolder);
                const originalProjectFolder = this.projectFolder;
                callProgressCalback(progressCallback, this, ProgressStages.PREPARE);
                this.allowConcurrence = true;
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
                this.allowConcurrence = false;
                endOperation(this);
                resolve(result);
            } catch (error) {
                this.allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    retrieveLocalSpecialTypes(tmpFolder, types, compress, sortOrder) {
        const progressCallback = getCallback(arguments, this);
        startOperation(this);
        resetProgress(this);
        return new Promise(async (resolve, reject) => {
            try {
                tmpFolder = Validator.validateFolderPath(tmpFolder);
                if(types)
                    Validator.validateMetadataJSON(types);
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
                this.allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(dataToRetrieve);
                this.increment = calculateIncrement(metadataToProcess);
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
                this.allowConcurrence = false;
                endOperation(this);
                resolve(retrieveOut);
            } catch (error) {
                this.allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    retrieveMixedSpecialTypes(tmpFolder, types, downloadAll, compress, sortOrder) {
        const progressCallback = getCallback(arguments, this);
        startOperation(this);
        resetProgress(this);
        return new Promise(async (resolve, reject) => {
            try {
                tmpFolder = Validator.validateFolderPath(tmpFolder);
                if(types)
                    Validator.validateMetadataJSON(types);
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
                this.allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(dataToRetrieve);
                this.increment = calculateIncrement(metadataToProcess);
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
                this.allowConcurrence = true;
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
                this.allowConcurrence = false;
                endOperation(this);
                resolve(retrieveOut);
            } catch (error) {
                this.allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }

    retrieveOrgSpecialTypes(tmpFolder, types, downloadAll, compress, sortOrder) {
        const progressCallback = getCallback(arguments, this);
        startOperation(this);
        resetProgress(this);
        return new Promise(async (resolve, reject) => {
            try {
                tmpFolder = Validator.validateFolderPath(tmpFolder);
                if(types)
                    Validator.validateMetadataJSON(types);
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
                this.allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(dataToRetrieve);
                this.increment = calculateIncrement(metadataToProcess);
                callProgressCalback(progressCallback, this, ProgressStages.LOADING_ORG);
                const metadataDetails = await this.listMetadataTypes();
                const folderMetadataMap = TypesFactory.createFolderMetadataMap(metadataDetails);
                const metadataFromOrg = await this.describeMetadataTypes(dataToRetrieve, downloadAll, progressCallback);
                this.allowConcurrence = true;
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
                this.allowConcurrence = false;
                endOperation(this);
                resolve(retrieveOut);
            } catch (error) {
                this.allowConcurrence = false;
                endOperation(this);
                reject(error);
            }
        });
    }
}
module.exports = Connection;

function getCallback(args, connection){
    return Utils.getCallbackFunction(args) || connection.progressCallback;;
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
                throw new Error(response.message);
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
        progressCallback.call(this, new ProgressStatus(stage, connection.increment, connection.percentage, type, object, undefined, data));
}

function downloadMetadata(connection, metadataToDownload, downloadAll, foldersByType, progressCallback) {
    return new Promise(async (resolve, reject) => {
        try {
            const metadata = {};
            for (const metadataTypeName of metadataToDownload) {
                try{
                    if (connection.abort) {
                        connection.allowConcurrence = false;
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
                        connection.percentage += connection.increment;
                        if (metadataType !== undefined && metadataType.haveChilds())
                            metadata[metadataTypeName] = metadataType;
                        callProgressCalback(progressCallback, connection, ProgressStages.AFTER_DOWNLOAD, metadataTypeName, metadataType);
                    } else if (NotIncludedMetadata[metadataTypeName]) {
                        const metadataType = TypesFactory.createNotIncludedMetadataType(metadataTypeName);
                        connection.percentage += connection.increment;
                        if (metadataType !== undefined && metadataType.haveChilds())
                            metadata[metadataTypeName] = metadataType;
                        callProgressCalback(progressCallback, connection, ProgressStages.AFTER_DOWNLOAD, metadataTypeName, metadataType);
                    } else {
                        const process = ProcessFactory.describeMetadataType(connection.usernameOrAlias, metadataTypeName, undefined, connection.apiVersion);
                        addProcess(connection, process);
                        const response = await ProcessHandler.runProcess(process);
                        handleResponse(response, () => {
                            const metadataType = TypesFactory.createMetedataTypeFromResponse(response, metadataTypeName, downloadAll, connection.namespacePrefix);
                            connection.percentage += connection.increment;
                            if (metadataType !== undefined && metadataType.haveChilds())
                                metadata[metadataTypeName] = metadataType;
                            callProgressCalback(progressCallback, connection, ProgressStages.AFTER_DOWNLOAD, metadataTypeName, metadataType);
                        });
                    }
                } catch(error){
                    if(error.message.indexOf('INVALID_TYPE') === -1)
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
                if (connection.abort) {
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
                    connection.percentage += connection.increment;
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
            if (connection.abort) {
                connection.allowConcurrence = false;
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
    connection.percentage = 0;
    connection.increment = 0;
}

function killProcesses(connection) {
    if (connection.processes && Object.keys(connection.processes).length > 0) {
        for (let process of Object.keys(connection.processes)) {
            killProcess(connection, connection.processes[process]);
        }
    }
}

function killProcess(connection, process) {
    process.kill();
    delete connection.processes[process.name];
}

function startOperation(connection) {
    if (!connection.allowConcurrence) {
        if (connection.inProgress)
            throw new Error('Connection in use. Abort the current operation to execute other.');
        connection.abort = false;
        connection.inProgress = true;
        connection.processes = {};
    }
}

function endOperation(connection) {
    if (!connection.allowConcurrence) {
        connection.inProgress = false;
        connection.processes = {};
    }
}

function addProcess(connection, process) {
    if (connection.processes === undefined)
        connection.processes = {};
    connection.processes[process.name] = process;
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