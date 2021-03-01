const { ProcessHandler, ProcessFactory } = require('@ah/core').ProcessManager;
const { TypesFactory, RetrieveStatus, DeployStatus, RetrieveResult, SFDXProjectResult, BulkStatus } = require('@ah/core').Types;
const { OSUtils, Utils, MathUtils, StrUtils } = require('@ah/core').Utils;
const { MetadataTypes, NotIncludedMetadata } = require('@ah/core').Values;
const path = require('path');

const METADATA_QUERIES = {
    Report: 'Select Id, DeveloperName, NamespacePrefix, FolderName from Report',
    Dashboard: 'Select Id, DeveloperName, NamespacePrefix, FolderId from Dashboard',
    Document: 'Select Id, DeveloperName, NamespacePrefix, FolderId from Document',
    EmailTemplate: 'Select Id, DeveloperName, NamespacePrefix, FolderId FROM EmailTemplate'
}
class Connection {

    constructor(usernameOrAlias, apiVersion, projectFolder, namespacePrefix) {
        this.usernameOrAlias = usernameOrAlias;
        this.apiVersion = apiVersion;
        this.projectFolder = (projectFolder !== undefined) ? StrUtils.replace(path.resolve(projectFolder), '\\', '/') : projectFolder;
        this.processes = {};
        this.abort = false;
        this.percentage = 0;
        this.increment = 0;
        this.inProgress;
        this.namespacePrefix = (namespacePrefix !== undefined) ? namespacePrefix : '';
        this.multiThread = false;
        this.abortCallback;
        this.allowConcurrence = false;
    }

    abortConnection() {
        this.abort = true;
        killProcesses(this);
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
        this.projectFolder = (projectFolder !== undefined) ? StrUtils.replace(path.resolve(projectFolder), '\\', '/') : projectFolder;
        return this;
    }

    setPackageFile(packageFile) {
        this.packageFile = (packageFile !== undefined) ? StrUtils.replace(path.resolve(packageFile), '\\', '/') : packageFile;
    }

    setPackageFolder(packageFolder) {
        this.packageFolder = (packageFolder !== undefined) ? StrUtils.replace(path.resolve(packageFolder), '\\', '/') : packageFolder;
    }

    setNamespacePrefix(namespacePrefix) {
        this.namespacePrefix = (namespacePrefix !== undefined) ? namespacePrefix : '';
        return this;
    }

    setMultiThread() {
        this.multiThread = true;
    }

    setSingleThread() {
        this.multiThread = false;
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
                        const authOrgs = TypesFactory.createAuthOrgs(orgs);
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

    describeMetadataTypes(typesOrDetails, downloadAll, progressCallback) {
        startOperation(this);
        resetProgress(this);
        return new Promise(async (resolve, reject) => {
            try {
                this.allowConcurrence = true;
                const metadataToProcess = getMetadataTypeNames(typesOrDetails);
                this.increment = calculateIncrement(metadataToProcess);
                callProgressCalback(progressCallback, this, 'prepare');
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
                            metadata = Utils.orderMetadata(metadata);
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

    describeSObjects(sObjects, progressCallback) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                this.increment = calculateIncrement(sObjects);
                callProgressCalback(progressCallback, this, 'prepare');
                let resultObjects = {};
                sObjects = Utils.forceArray(sObjects);
                const batchesToProcess = getBatches(this, sObjects);
                for (const batch of batchesToProcess) {
                    downloadSObjectsData(this, batch.records, progressCallback).then((downloadedSObjects) => {
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
                            resultObjects = Utils.orderSObjects(resultObjects);
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
                if (useMetadataAPI) {
                    process = ProcessFactory.mdapiRetrievePackage(this.usernameOrAlias, this.packageFolder, this.apiVersion, targetDir, this.projectFolder, waitMinutes);
                } else {
                    process = ProcessFactory.sourceRetrievePackage(this.usernameOrAlias, this.packageFile, this.apiVersion, this.projectFolder, waitMinutes);
                }
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
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
                if (useMetadataAPI) {
                    process = ProcessFactory.mdapiValidatePackage(this.usernameOrAlias, this.packageFolder, testLevel, runTests, this.apiVersion, this.projectFolder, waitMinutes);
                } else {
                    process = ProcessFactory.sourceValidatePackage(this.usernameOrAlias, this.packageFile, testLevel, runTests, this.apiVersion, this.projectFolder, waitMinutes);
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
                if (useMetadataAPI) {
                    process = ProcessFactory.mdapiDeployPackage(this.usernameOrAlias, this.packageFolder, testLevel, runTests, this.apiVersion, this.projectFolder, waitMinutes);
                } else {
                    process = ProcessFactory.sourceDeployPackage(this.usernameOrAlias, this.packageFile, testLevel, runTests, this.apiVersion, this.projectFolder, waitMinutes);
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
                if (useMetadataAPI) {
                    process = ProcessFactory.mdapiQuickDeploy(this.usernameOrAlias, deployId, this.apiVersion, this.projectFolder);
                } else {
                    process = ProcessFactory.sourceQuickDeploy(this.usernameOrAlias, deployId, this.apiVersion, this.projectFolder);
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
    /*
        convertProjectToSFDX(targetDir){
            startOperation(this);
            resetProgress(this);
            return new Promise((resolve, reject) => {
                try {
                    let process = ProcessFactory.convertToSFDX(this.packageFolder, this.packageFile, targetDir, this.apiVersion);
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
    
        convertProjectToMetadataAPI(targetDir){
            startOperation(this);
            resetProgress(this);
            return new Promise((resolve, reject) => {
                try {
                    let process = ProcessFactory.convertToMetadataAPI(this.packageFile, targetDir, this.projectFolder);
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
    */
   
    createSFDXProject(projectName, outputDir, template, withManifest) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                let process = ProcessFactory.createSFDXProject(projectName, outputDir, template, this.namespacePrefix, withManifest);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const result = (response !== undefined) ? new SFDXProjectResult(response.result) : undefined;
                        outputDir = StrUtils.replace(outputDir, '\\', '/');
                        this.setProjectFolder(outputDir + '/' + projectName);
                        if(withManifest){
                            this.setPackageFolder(outputDir + '/' + projectName + '/manifest');
                            this.setPackageFile(outputDir + '/' + projectName + '/manifest/package.xml');
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
                let process = ProcessFactory.setAuthOrg(usernameOrAlias || this.usernameOrAlias, this.projectFolder);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        this.usernameOrAlias = this.usernameOrAlias || usernameOrAlias;
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

    exportTreeData(query, prefix, outputPath) {
        startOperation(this);
        resetProgress(this);
        return new Promise((resolve, reject) => {
            try {
                let process = ProcessFactory.exportTreeData(this.usernameOrAlias, query, prefix, outputPath);
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
                let process = ProcessFactory.importTreeData(this.usernameOrAlias, file);
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
                        resolve(results);
                    } else {
                        if (response.name === 'ERROR_HTTP_400') {
                            let errorResults = JSON.parse(response.message);
                            endOperation(this);
                            resolve(errorResults.results);
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
                csvfile = StrUtils.replace(path.resolve(csvfile), '\\', '/');
                let process = ProcessFactory.bulkDelete(this.usernameOrAlias, csvfile, sObject);
                addProcess(this, process);
                ProcessHandler.runProcess(process).then((response) => {
                    handleResponse(response, () => {
                        const bulkStatus = [];
                        for(const result of response.result){
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
                scriptfile = path.resolve(scriptfile);
                let process = ProcessFactory.executeApexAnonymous(this.usernameOrAlias, scriptfile, this.projectFolder);
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
}
module.exports = Connection;

function processExportTreeDataOut(response) {
    let outData = StrUtils.replace(response, '\n', '').split(',');
    let dataToReturn = [];
    for (let data of outData) {
        let splits = data.split(" ");
        let nRecords = splits[1];
        let file = path.basename(splits[splits.length - 1]);
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

function callProgressCalback(progressCallback, connection, stage, typeOrObject, data) {
    if (progressCallback)
        progressCallback.call(this, {
            stage: stage,
            increment: connection.increment,
            percentage: connection.percentage,
            typeOrObject: typeOrObject,
            data: data
        });
}

function downloadMetadata(connection, metadataToDownload, downloadAll, foldersByType, progressCallback) {
    return new Promise(async (resolve, reject) => {
        try {
            const metadata = {};
            for (const metadataTypeName of metadataToDownload) {
                if (connection.abort) {
                    connection.allowConcurrence = false;
                    endOperation(connection);
                    resolve(metadata);
                    return;
                }
                callProgressCalback(progressCallback, connection, 'beforeDownload', metadataTypeName);
                if (metadataTypeName === MetadataTypes.REPORT || metadataTypeName === MetadataTypes.DASHBOARD || metadataTypeName === MetadataTypes.EMAIL_TEMPLATE || metadataTypeName === MetadataTypes.DOCUMENT) {
                    const records = await connection.query(METADATA_QUERIES[metadataTypeName]);
                    if (!records || records.length === 0)
                        continue;
                    const metadataType = TypesFactory.createMetadataTypeFromRecords(metadataTypeName, records, foldersByType, connection.namespacePrefix, downloadAll);
                    connection.percentage += connection.increment;
                    if (metadataType !== undefined && metadataType.haveChilds())
                        metadata[metadataTypeName] = metadataType;
                    callProgressCalback(progressCallback, connection, 'afterDownload', metadataTypeName, metadataType);
                } else if (NotIncludedMetadata[metadataTypeName]) {
                    const metadataType = TypesFactory.createNotIncludedMetadataType(metadataTypeName);
                    connection.percentage += connection.increment;
                    if (metadataType !== undefined && metadataType.haveChilds())
                        metadata[metadataTypeName] = metadataType;
                    callProgressCalback(progressCallback, connection, 'afterDownload', metadataTypeName, metadataType);
                } else {
                    const process = ProcessFactory.describeMetadataType(connection.usernameOrAlias, metadataTypeName, undefined, connection.apiVersion);
                    addProcess(connection, process);
                    const response = await ProcessHandler.runProcess(process);
                    handleResponse(response, () => {
                        const metadataType = TypesFactory.createMetedataTypeFromResponse(response, metadataTypeName, downloadAll, connection.namespacePrefix);
                        connection.percentage += connection.increment;
                        if (metadataType !== undefined && metadataType.haveChilds())
                            metadata[metadataTypeName] = metadataType;
                        callProgressCalback(progressCallback, connection, 'afterDownload', metadataTypeName, metadataType);
                    });
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
                callProgressCalback(progressCallback, connection, 'beforeDownload', sObject);
                const process = ProcessFactory.getSObjectSchema(connection.usernameOrAlias, sObject, connection.apiVersion);
                addProcess(connection, process);
                const response = await ProcessHandler.runProcess(process);
                handleResponse(response, () => {
                    const sObjectResult = TypesFactory.createMetadataFromJSONSchema(response);
                    connection.percentage += connection.increment;
                    if (sObjectResult !== undefined)
                        sObjectsResult[sObject] = sObjectResult;
                    callProgressCalback(progressCallback, connection, 'afterDownload', sObject, sObjectResult);
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