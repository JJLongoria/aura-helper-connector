# **Aura Helper Connector Module**
Module to connect with Salesforce to list or describe metadata types, list or describe all SObjects, make queries, create SFDX Project, validate, deploy or retrieve in SFDX and Metadata API Formats, export and import data and much more. Is used to Aura Helper and Aura Helper CLI to support salesfore conections.

## **Usage**

### **Instance and Util methods**

Instance and util methods to handle conection

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project/folder/root', 'namespacePrefix');
    connection.setMultiThread();        // Allow to use several CPUs and threads to process data. 
                                        // Only take effect on Metadata Describe and SObjects Describe methods

    connection.setSingleThread();       // Avoid to use several CPUs and threads to process data. 
                                        // Only take effect on Metadata Describe and SObjects Describe methods

    connection.setUsernameOrAlias('usernameOrAlias');       // To change the username or alias setted in constructor
    
    connection.setApiVersion('50.0');       // To change the api version setted in constructor

    connection.setProjectFolder('new/path/to/project/folder/root');     // To change the project folder setted in constructor

    connection.setNamespacePrefix('newNamespacePrefix');    // To change the namespace prefix setted in constructor

    connection.setPackageFolder('path/to/package/folder');      // To set the project package folder path

    connection.setPackageFile('path/to/package/folder/package.xml');    // To set the project package XML file path

    connection.abortConnection();       // To abort any operation in progress. 
                                        // In some operations, return the data processed.

### **Create SFDX Project**

Method to create new SFDX Project. If the project is created, the projectFolder is setted to connection object. If with manifest is true, alse set packageFolder and packageFile. 

SFDXProjectResult Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('MyOrg', '51.0', undefined, 'namespacePrefix');
    connection.createSFDXProject(projectName, outputDir, template, withManifest).then((result) => {
        console.log(result.outputDir);
        console.log(result.created);
        console.log(result.rawOutput);
    }).cath((error) => {
        // Handle errors
    });

    try {
        const result = await createSFDXProject(projectName, outputDir, template, withManifest);
        console.log(result.outputDir);
        console.log(result.created);
        console.log(result.rawOutput);
    } catch(error) {
        // Handle errors
    }

### **Set Auth Org**

Method to set the Auth Org on a SFDX Project. If the Org is authorized, the usernameOrAlias is setted to connection object.

SFDXProjectResult Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection(undefined, '51.0', 'path/to/Project', 'namespacePrefix');
    connection.setAuthOrg(usuernameOrAlias).then(() => {
        // Org Authorized
    }).cath((error) => {
        // Handle errors
    });

    try {
        await setAuthOrg(usuernameOrAlias);
        // Org Authorized
    } catch(error) {
        // Handle errors
    }

### **Query Data**

Method to query data

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.query('Select Id, Name from Accounts', useToolingApi).then((records) => {
        for(const record of records){
            console.log(record.Id);
            console.log(record.Name);
        }
    }).cath((error) => {
        // Handle errors
    });

    try {
        const records = await connection.query('Select Id, Name from Accounts', useToolingApi);
        for(const record of records){
            console.log(record.Id);
            console.log(record.Name);
        }
    } catch(error) {
        // Handle errors
    }

### **Export Tree Data**

Method to export data in tree format

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.exportTreeData('Select Id, Name from Accounts', filePrefix, outputPath).then((results) => {
        for(result of results){
            console.log(result.file);
            console.log(result.records);
            console.log(result.isPlanFile);
        }
    }).cath((error) => {
        // Handle errors
    });

    try {
        const result = await connection.exportTreeData('Select Id, Name from Accounts', filePrefix, outputPath);
        for(result of results){
            console.log(result.file);
            console.log(result.records);
            console.log(result.isPlanFile);
        }
    } catch(error) {
        // Handle errors
    }

### **Import Tree Data**

Method to import data in tree format

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.importTreeData(filePath).then((results) => {
        for(result of results){
            console.log(result.refId);
            console.log(result.id);
            console.log(result.sobject);
        }
    }).cath((error) => {
        // Handle errors
    });

    try {
        const results = await connection.importTreeData(filePath);
        for(result of results){
            console.log(result.refId);
            console.log(result.id);
            console.log(result.sobject);
        }
    } catch(error) {
        // Handle errors
    }

### **Bulk Delete**

Method to delete data with BulkAPI

BulkStatus Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.bulkDelete(csvFile, sObject).then((statuses) => {
        for(status of statuses){
            console.log(status.id);
            console.log(status.jobId);
            console.log(status.state);
            console.log(status.createdDate);
            console.log(status.numberRecordsProcessed);
            console.log(status.numberRecordsFailed);
            console.log(status.totalProcessingTime);
            console.log(status.apiActiveProcessingTime);
            console.log(status.apexProcessingTime);
        }
    }).cath((error) => {
        // Handle errors
    });

    try {
        const statuses = await connection.bulkDelete(csvFile, sObject);
        for(status of statuses){
            console.log(status.id);
            console.log(status.jobId);
            console.log(status.state);
            console.log(status.createdDate);
            console.log(status.numberRecordsProcessed);
            console.log(status.numberRecordsFailed);
            console.log(status.totalProcessingTime);
            console.log(status.apiActiveProcessingTime);
            console.log(status.apexProcessingTime);
        }
    } catch(error) {
        // Handle errors
    }

### **Execute Anonymous Apex**

Method to execute an Script file on Anonymous apex execution

BulkStatus Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.executeApexAnonymous(scriptFile).then((log) => {
        console.log(log);
    }).cath((error) => {
        // Handle errors
    });

    try {
        const statuses = await connection.executeApexAnonymous(csvFile, sObject);
        console.log(log);
    } catch(error) {
        // Handle errors
    }

### **List Auth Orgs**

Method to list the auth orgs on your system

AuthOrg Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.listAuthOrgs().then((authOrgs) => {
        for(const authOrg of authOrgs){
            console.log(authOrg.alias);
            console.log(authOrg.username);
            console.log(authOrg.orgId);
            console.log(authOrg.instanceUrl);
            console.log(authOrg.accessToken);
            console.log(authOrg.oauthMethod);
        }
    }).cath((error) => {
        // Handle errors
    });

    try {
        const authOrgs = await connection.listAuthOrgs();
        for(const authOrg of authOrgs){
            console.log(authOrg.alias);
            console.log(authOrg.username);
            console.log(authOrg.orgId);
            console.log(authOrg.instanceUrl);
            console.log(authOrg.accessToken);
            console.log(authOrg.oauthMethod);
        }
    } catch(error) {
        // Handle errors
    }

### **List Metadata Types**

Method to List All Metadata Types available in your Org

MetadataDetail Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.listMetadataTypes().then((metadataDetails) => {
        for(const typeDetail of metadataDetails){
            console.log(typeDetail.xmlName);
            console.log(typeDetail.suffix);
            console.log(typeDetail.metaFile);
            console.log(typeDetail.inFolder);
            console.log(typeDetail.directoryName);
        }
    }).cath((error) => {
        // Handle errors
    });

    try {
        const metadataDetails = await connection.listMetadataTypes();
        for(const typeDetail of metadataDetails){
            console.log(typeDetail.xmlName);
            console.log(typeDetail.suffix);
            console.log(typeDetail.metaFile);
            console.log(typeDetail.inFolder);
            console.log(typeDetail.directoryName);
        }
    } catch(error) {
        // Handle errors
    }

### **Describe Metadata Types**

Method to describe the specified metadata types from your Org

MetadataType Class, MetadataObject Class and MetadataItem Class to process response are in @ah/core Types Module.
    
    const Connection = require('@ah/connector');
    const { MetadataTypes } = require('@ah/core').Values;

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.setMultiThread();

    let downloadAll = false;    // flag to indicate if download all metadata types (included manage packages) or only the org namespace metadata types (user created data)
    
    connection.describeMetadataTypes(['CustomObject', 'CustomField'], downloadAll, (status) => {
        // Progress callback to handle the downlaod progress
        if(status.stage === 'prapare'){
            // Handle progress on prepare stage
            console.log(status.stage);      // Stage type ('prepare', 'beforeDownload', 'afterDownload')
            console.log(status.increment);  // Value of the increment percentage when download each metadat type
            console.log(status.percentage); // Value of the progress percentage
        } else if(status.stage === 'beforeDownload') {
            // Handle progress before download one metadata type stage
            console.log(status.stage);  
            console.log(status.increment);
            console.log(status.percentage); 
            console.log(status.typeOrObject);   // Metadata Type or SObject prepared to download
        } else if(status.stage === 'afterDownload') {
            // Handle progress after download one metadata type stage
            console.log(status.stage);
            console.log(status.increment);
            console.log(status.percentage);
            console.log(status.typeOrObject);   // Downloaded Metadata Type or SObject 
            console.log(status.data);           // Downloaded data
        }
    }).then((metadataTypes) => {
        const metadataType = metadataTypes[MetadataTypes.CUSTOM_FIELD];
        console.log(metadataType.name);
        console.log(metadataType.checked);
        console.log(metadataType.path);
        console.log(metadattaType.suffix);
        console.log(metadataType.childs);

        const metadataObject = metadataType.getChild('Account');
        console.log(metadataObject.name);
        console.log(metadataObject.checked);
        console.log(metadataObject.path);
        console.log(metadataObject.childs);

        const metadataItem = metadataObject.getChild('Name');
        console.log(metadataItem.name);
        console.log(metadataItem.checked);
        console.log(metadataItem.path);
    }).cath((error) => {
        // Handle errors
    });

    try {
        const metadataDetails = await connection.listMetadataTypes();   // Also accept a list of metadata details to download
        const metadataTypes = await connection.describeMetadataTypes(metadataDetails, downloadAll, (status) => {
            // Progress callback to handle the downlaod progress
            if(status.stage === 'prapare'){
                // Handle progress on prepare stage
                console.log(status.stage);      // Stage type ('prepare', 'beforeDownload', 'afterDownload')
                console.log(status.increment);  // Value of the increment percentage when download each metadat type
                console.log(status.percentage); // Value of the progress percentage
            } else if(status.stage === 'beforeDownload') {
                // Handle progress before download one metadata type stage
                console.log(status.stage);  
                console.log(status.increment);
                console.log(status.percentage); 
                console.log(status.typeOrObject);   // Metadata Type or SObject prepared to download
            } else if(status.stage === 'afterDownload') {
                // Handle progress after download one metadata type stage
                console.log(status.stage);
                console.log(status.increment);
                console.log(status.percentage);
                console.log(status.typeOrObject);   // Downloaded Metadata Type or SObject 
                console.log(status.data);           // Downloaded data
            }
        });
        const metadataType = metadataTypes[MetadataTypes.CUSTOM_FIELD];
        console.log(metadataType.name);
        console.log(metadataType.checked);
        console.log(metadataType.path);
        console.log(metadattaType.suffix);
        console.log(metadataType.childs);

        const metadataObject = metadataType.getChild('Account');
        console.log(metadataObject.name);
        console.log(metadataObject.checked);
        console.log(metadataObject.path);
        console.log(metadataObject.childs);

        const metadataItem = metadataObject.getChild('Name');
        console.log(metadataItem.name);
        console.log(metadataItem.checked);
        console.log(metadataItem.path);
    } catch(error) {
        // Handle errors
    }

### **List SObjects**

Method to list all available Salesforce SObejcts in your org.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.listSObjects(category).then((sObjectNames) => {
        for(const sObjectName of sObjectNames){
            console.log(sObjectName);
        }
    }).cath((error) => {
        // Handle errors
    });

    try {
        const sObjectNames = await connection.listSObjects();
        for(const sObjectName of sObjectNames){
            console.log(sObjectName);
        }
    } catch(error) {
        // Handle errors
    }

### **Describe SObjects**

Method to describe the sepecified SObjects on your Org.

SObject Class, SObjectField Class, PicklistValue Class and RecordType Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.setMultiThread();

    connection.describeSObjects(['Account', 'Case'], (status) => {
        // Progress callback to handle the downlaod progress
        if(status.stage === 'prapare'){
            // Handle progress on prepare stage
            console.log(status.stage);      // Stage type ('prepare', 'beforeDownload', 'afterDownload')
            console.log(status.increment);  // Value of the increment percentage when download each metadat type
            console.log(status.percentage); // Value of the progress percentage
        } else if(status.stage === 'beforeDownload') {
            // Handle progress before download one metadata type stage
            console.log(status.stage);  
            console.log(status.increment);
            console.log(status.percentage); 
            console.log(status.typeOrObject);   // Metadata Type or SObject prepared to download
        } else if(status.stage === 'afterDownload') {
            // Handle progress after download one metadata type stage
            console.log(status.stage);
            console.log(status.increment);
            console.log(status.percentage);
            console.log(status.typeOrObject);   // Downloaded Metadata Type or SObject 
            console.log(status.data);           // Downloaded data
        }
    }).then((sObjects) => {
        for(const sObject of sObjects){
            console.log(sObject.name);
            console.log(sObject.label);
            console.log(sObject.labelPlural);
            console.log(sObject.keyPrefix);
            console.log(sObject.custom);
            console.log(sObject.queryable);
            console.log(sObject.customSetting);
            console.log(sObject.namespace);
            console.log(sObject.getRecordType('devName').developerName);
            console.log(sObject.getRecordType('devName').name);
            console.log(sObject.getField('Name').name);
            console.log(sObject.getField('Name').label);
        }
    }).cath((error) => {
        // Handle errors
    });

    try {
        const sObjectNames = await connection.describeSObjects(['Account', 'Case'], (status) => {
            // Progress callback to handle the downlaod progress
            if(status.stage === 'prapare'){
                // Handle progress on prepare stage
                console.log(status.stage);      // Stage type ('prepare', 'beforeDownload', 'afterDownload')
                console.log(status.increment);  // Value of the increment percentage when download each metadat type
                console.log(status.percentage); // Value of the progress percentage
            } else if(status.stage === 'beforeDownload') {
                // Handle progress before download one metadata type stage
                console.log(status.stage);  
                console.log(status.increment);
                console.log(status.percentage); 
                console.log(status.typeOrObject);   // Metadata Type or SObject prepared to download
            } else if(status.stage === 'afterDownload') {
                // Handle progress after download one metadata type stage
                console.log(status.stage);
                console.log(status.increment);
                console.log(status.percentage);
                console.log(status.typeOrObject);   // Downloaded Metadata Type or SObject 
                console.log(status.data);           // Downloaded data
            }
        })
        for(const sObject of sObjects){
            console.log(sObject.name);
            console.log(sObject.label);
            console.log(sObject.labelPlural);
            console.log(sObject.keyPrefix);
            console.log(sObject.custom);
            console.log(sObject.queryable);
            console.log(sObject.customSetting);
            console.log(sObject.namespace);
            console.log(sObject.getRecordType('devName').developerName);
            console.log(sObject.getRecordType('devName').name);
            console.log(sObject.getField('Name').name);
            console.log(sObject.getField('Name').label);
        }
    } catch(error) {
        // Handle errors
    }

### **Retrieve**

Method to retrieve data from your Org. You can retrieve data on Source or Metadata API format. RetrieveResult Class, RetrieveInboundFile Class, RetrievePackage Class and RetrieveWarning Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.setPackageFolder('path/to/package/folder');
    connection.setPackageFile('path/to/package/file');

    connection.retrieve(useMetadataAPI, waitMinutes, targetDir).then((result) => {
        // targetDir is only required if use MetadataAPI
        console.log(result.inboundFiles);
        console.log(result.packages);
        console.log(result.warnings);
    }).cath((error) => {
        // Handle errors
    });

    try {
        const result = await connection.retrieve(useMetadataAPI, waitMinutes, targetDir);
        console.log(result.inboundFiles);
        console.log(result.packages);
        console.log(result.warnings);
    } catch(error) {
        // Handle errors
    }

### **Retrieve Report**

Method to run a Retrive Report to check the retrieve status

RetrieveStatus Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.setPackageFolder('path/to/package/folder');
    connection.setPackageFile('path/to/package/file');

    connection.retrieveReport(retrieveId, targetDir).then((status) => {
        console.log(status.id);
        console.log(status.status);
        console.log(status.done);
        console.log(status.success);
        console.log(status.zipFilePath);
    }).cath((error) => {
        // Handle errors
    });

    try {
        const status = await connection.retrieveReport(retrieveId, targetDir);
        console.log(status.id);
        console.log(status.status);
        console.log(status.done);
        console.log(status.success);
        console.log(status.zipFilePath);
    } catch(error) {
        // Handle errors
    }

### **Validate Deploy**

Method to Validate a package.xml for deploy.

DeployStatus Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.setPackageFolder('path/to/package/folder');
    connection.setPackageFile('path/to/package/file');

    connection.validateDeploy(testLevel, runTests, useMetadataAPI, waitMinutes).then((status) => {
        // runTests can be a comma separatd values or Array with class names
        console.log(status.id);
        console.log(status.status);
        console.log(status.done);
        console.log(status.success);
        console.log(status.zipFilePath);
        console.log(status.checkOnly);
        console.log(status.numberComponentErrors);
        console.log(status.numberComponentsDeployed);
        console.log(status.numberComponentsTotal);
        console.log(status.numberTestErrors);
        console.log(status.numberTestsCompleted);
        console.log(status.numberTestsTotal);
        console.log(status.runTestsEnabled);
    }).cath((error) => {
        // Handle errors
    });

    try {
        const status = await connection.validateDeploy(retrieveId, targetDir);
        console.log(status.id);
        console.log(status.status);
        console.log(status.done);
        console.log(status.success);
        console.log(status.zipFilePath);
        console.log(status.checkOnly);
        console.log(status.numberComponentErrors);
        console.log(status.numberComponentsDeployed);
        console.log(status.numberComponentsTotal);
        console.log(status.numberTestErrors);
        console.log(status.numberTestsCompleted);
        console.log(status.numberTestsTotal);
        console.log(status.runTestsEnabled);
    } catch(error) {
        // Handle errors
    }

### **Deploy**

Method to deploy a package.xml in your Org

DeployStatus Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');
    connection.setPackageFolder('path/to/package/folder');
    connection.setPackageFile('path/to/package/file');

    connection.deploy(testLevel, runTests, useMetadataAPI, waitMinutes).then((status) => {
        // runTests can be a comma separatd values or Array with class names
        console.log(status.id);
        console.log(status.status);
        console.log(status.done);
        console.log(status.success);
        console.log(status.zipFilePath);
        console.log(status.checkOnly);
        console.log(status.numberComponentErrors);
        console.log(status.numberComponentsDeployed);
        console.log(status.numberComponentsTotal);
        console.log(status.numberTestErrors);
        console.log(status.numberTestsCompleted);
        console.log(status.numberTestsTotal);
        console.log(status.runTestsEnabled);
    }).cath((error) => {
        // Handle errors
    });

    try {
        const status = await connection.deploy(retrieveId, targetDir);
        console.log(status.id);
        console.log(status.status);
        console.log(status.done);
        console.log(status.success);
        console.log(status.zipFilePath);
        console.log(status.checkOnly);
        console.log(status.numberComponentErrors);
        console.log(status.numberComponentsDeployed);
        console.log(status.numberComponentsTotal);
        console.log(status.numberTestErrors);
        console.log(status.numberTestsCompleted);
        console.log(status.numberTestsTotal);
        console.log(status.runTestsEnabled);
    } catch(error) {
        // Handle errors
    }

### **Quick Deploy**

Method to quick deploy a validated package

DeployStatus Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');

    connection.quickDeploy(deployId, useMetadataAPI).then((status) => {
        // runTests can be a comma separatd values or Array with class names
        console.log(status.id);
        console.log(status.status);
        console.log(status.done);
        console.log(status.success);
        console.log(status.zipFilePath);
        console.log(status.checkOnly);
        console.log(status.numberComponentErrors);
        console.log(status.numberComponentsDeployed);
        console.log(status.numberComponentsTotal);
        console.log(status.numberTestErrors);
        console.log(status.numberTestsCompleted);
        console.log(status.numberTestsTotal);
        console.log(status.runTestsEnabled);
    }).cath((error) => {
        // Handle errors
    });

    try {
        const status = await connection.quickDeploy(deployId, useMetadataAPI);
        console.log(status.id);
        console.log(status.status);
        console.log(status.done);
        console.log(status.success);
        console.log(status.zipFilePath);
        console.log(status.checkOnly);
        console.log(status.numberComponentErrors);
        console.log(status.numberComponentsDeployed);
        console.log(status.numberComponentsTotal);
        console.log(status.numberTestErrors);
        console.log(status.numberTestsCompleted);
        console.log(status.numberTestsTotal);
        console.log(status.runTestsEnabled);
    } catch(error) {
        // Handle errors
    }

### **Deploy Report**

Method to get the status of a deploy

DeployStatus Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');

    connection.deployReport(deployId, useMetadataAPI, waitMinutes).then((status) => {
        // runTests can be a comma separatd values or Array with class names
        console.log(status.id);
        console.log(status.status);
        console.log(status.done);
        console.log(status.success);
        console.log(status.zipFilePath);
        console.log(status.checkOnly);
        console.log(status.numberComponentErrors);
        console.log(status.numberComponentsDeployed);
        console.log(status.numberComponentsTotal);
        console.log(status.numberTestErrors);
        console.log(status.numberTestsCompleted);
        console.log(status.numberTestsTotal);
        console.log(status.runTestsEnabled);
    }).cath((error) => {
        // Handle errors
    });

    try {
        const status = await connection.deployReport(deployId, useMetadataAPI, waitMinutes);
        console.log(status.id);
        console.log(status.status);
        console.log(status.done);
        console.log(status.success);
        console.log(status.zipFilePath);
        console.log(status.checkOnly);
        console.log(status.numberComponentErrors);
        console.log(status.numberComponentsDeployed);
        console.log(status.numberComponentsTotal);
        console.log(status.numberTestErrors);
        console.log(status.numberTestsCompleted);
        console.log(status.numberTestsTotal);
        console.log(status.runTestsEnabled);
    } catch(error) {
        // Handle errors
    }

### **Cancel Deploy**

Method to cancel a Deploy

DeployStatus Class to process response are in @ah/core Types Module.

    const Connection = require('@ah/connector');

    const connection = new Connection('aliasOrUsername', '51.0', 'path/to/Project', 'namespacePrefix');

    connection.cancelDeploy(deployId, useMetadataAPI, waitMinutes).then((status) => {
        // runTests can be a comma separatd values or Array with class names
        console.log(status.id);
        console.log(status.status);
        console.log(status.done);
        console.log(status.success);
        console.log(status.zipFilePath);
        console.log(status.checkOnly);
        console.log(status.numberComponentErrors);
        console.log(status.numberComponentsDeployed);
        console.log(status.numberComponentsTotal);
        console.log(status.numberTestErrors);
        console.log(status.numberTestsCompleted);
        console.log(status.numberTestsTotal);
        console.log(status.runTestsEnabled);
    }).cath((error) => {
        // Handle errors
    });

    try {
        const status = await connection.cancelDeploy(deployId, useMetadataAPI, waitMinutes);
        console.log(status.id);
        console.log(status.status);
        console.log(status.done);
        console.log(status.success);
        console.log(status.zipFilePath);
        console.log(status.checkOnly);
        console.log(status.numberComponentErrors);
        console.log(status.numberComponentsDeployed);
        console.log(status.numberComponentsTotal);
        console.log(status.numberTestErrors);
        console.log(status.numberTestsCompleted);
        console.log(status.numberTestsTotal);
        console.log(status.runTestsEnabled);
    } catch(error) {
        // Handle errors
    }
