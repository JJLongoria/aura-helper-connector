# **Aura Helper Connector Module**

[![Version](https://img.shields.io/npm/v/@aurahelper/connector?logo=npm)](https://www.npmjs.com/package/@aurahelper/connector)
[![Total Downloads](https://img.shields.io/npm/dt/@aurahelper/connector?logo=npm)](https://www.npmjs.com/package/@aurahelper/connector)
[![Downloads/Month](https://img.shields.io/npm/dm/@aurahelper/connector?logo=npm)](https://www.npmjs.com/package/@aurahelper/connector)
[![Issues](https://img.shields.io/github/issues/jjlongoria/aura-helper-connector)](https://github.com/JJLongoria/aura-helper-connector/issues)
[![Known Vulnerabilities](https://snyk.io/test/github/JJLongoria/aura-helper-connector/badge.svg)](https://snyk.io/test/github/JJLongoria/aura-helper-connector)
[![Code Size](https://img.shields.io/github/languages/code-size/jjlongoria/aura-helper-connector)](https://github.com/JJLongoria/aura-helper-connector)
[![License](https://img.shields.io/github/license/jjlongoria/aura-helper-connector?logo=github)](https://github.com/JJLongoria/aura-helper-connector/blob/master/LICENSE)

Module to connect with Salesforce to list or describe metadata types, list or describe all SObjects, make queries, create SFDX Project, validate, deploy or retrieve in SFDX and Metadata API Formats, export and import data and much more. Is used to Aura Helper and Aura Helper CLI to support salesfore conections.

---

## *Table of Contents*

- [**Connection Class**](#connection-class)

- [**Metadata JSON Format**](#metadata-json-format)

---

# [**Connection Class**](#connection-class)
Class to connect with Salesforce to list or describe metadata types, list or describe all SObjects, make queries, create SFDX Project, validate, deploy or retrieve in SFDX and Metadata API Formats, export and import data and much more. Is used to Aura Helper and Aura Helper CLI to support salesfore conections.

The setters methods are defined like a builder pattern to make it more usefull

All connection methods return a Promise with the associated data to the processes.

#### **Class Members**
- [**Fields**](#connection-class-fields)

- [**Constructors**](#connection-class-constructor)

- [**Methods**](#connection-class-methods)

</br>

# [**Fields**](#connection-class-fields)
The fields that start with _ are for internal use only (Does not modify this fields to a correct connection work). To the rest of fields, setter methods are recommended instead modify fields.

### [**usernameOrAlias**](#connection-class-fields-usernameoralias)
Username or Alias to connect with the org. The org bust be authorized in the system. 
- `string`

### [**apiVersion**](#connection-class-fields-apiversion)
Number API Version to connect with the org.
- `string` | `number`

### [**projectFolder**](#connection-class-fields-projectfolder)
Path to the local project folder
- `string`

### [**namespacePrefix**](#connection-class-fields-namespaceprefix)
Namespace prefix from the Org to connect
- `string`

### [**multiThread**](#connection-class-fields-multithread)
True to able to the connection object to use several threads and processor cores to run some processes and run faster, false to use only one thread and core.
- `boolean`

### [**packageFolder**](#connection-class-fields-packageFolder)
Project package folder path (manifest folder). Must be a child of Project folder
- `string`

### [**packageFile**](#connection-class-fields-packageFile)
Project package file path (package.xml file). Must be a child of Package folder
- `string`
  
</br>

# [**Constructors**](#connection-class-constructors)
The Connection class has only one constructor to create a connection

## [**constructor(usernameOrAlias, apiVersion, projectFolder, namespacePrefix)**](#connection-class-constructors-construct)
Constructor to create a new connection object. All parameters are optional and you can use the setters methods to set the values when you want.

### **Parameters:**
  - **usernameOrAlias**: Org Username or Alias to connect. (Must be authorized in the system)
    - `string`
  - **apiVersion**: API Version number to connect with salesforce
    - `string` | `number`
  - **projectFolder**: Path to the project root folder
    - `string`
  - **namespacePrefix**: Namespace prefix from the Org to connect
    - `string`

</br>

# [**Methods**](#connection-class-methods)

  - [**setUsernameOrAlias(usernameOrAlias)**](#setusernameoraliasusernameoralias)
    
    Method to set the Username or Alias to connect with org

  - [**setApiVersion(apiVersion)**](#setapiversionapiversion)
    
    Method to set the API Version to connect

  - [**setProjectFolder(projectFolder)**](#setprojectfolderprojectfolder)
   
    Method to set the project root folder path. When set the project root, automatically set the packageFolder and packageFile to their respective paths

  - [**setPackageFolder(packageFolder)**](#setpackagefolderpackagefolder)
   
    Method to set the package folder path. When set the package folder, automatically set packageFile to the respective path

  - [**setPackageFile(packageFile)**](#setpackagefilepackagefile)
  
    Method to set the package xml file path

  - [**setNamespacePrefix(namespacePrefix)**](#setnamespaceprefixnamespaceprefix)
   
    Method to set the Org namespace prefix

  - [**setMultiThread()**](#setmultithread)
    
    Method to able to the connection object to use several threads and processor cores to run some processes and run faster

  - [**setSingleThread()**](#setsinglethread)
    
    Method to set the connection object to use only one thread and processo core to all processes

  - [**onPrepare(callback)**](#onpreparecallback)

    Method to handle the event when preparing execution of some processes

  - [**onCreateProject(callback)**](#oncreateprojectcallback)

    Method to handle the event before the create a project on some processes 

  - [**onRetrieve(callback)**](#onretrievecallback)
 
    Method to handle the event before start retrieve data on some processes

  - [**onProcess(callback)**](#onprocesscallback)

    Method to handle the event before start processing results on some processes

  - [**onLoadingLocal(callback)**](#onloadinglocalcallback)

    Method to handle the event before start loading local metadata types on some processes

  - [**onLoadingOrg(callback)**](#onloadingorgcallback)

    Method to handle the event before start loading metadata types from org on some processes

  - [**onCopyData(callback)**](#oncopydatacallback)

    Method to handle the event before start copying files on some processes

  - [**onCopyFile(callback)**](#oncopyfilecallback)

    Method to handle the event before start copying file content on some processes

  - [**onCompressFile(callback)**](#oncompressfilecallback)

    Method to handle the event before start compress XML File on some processes

  - [**onBeforeDownloadType(callback)**](#onbeforedownloadtypecallback)

    Method to handle the event before download a Metadata Type from Org on some processes

  - [**onAfterDownloadType(callback)**](#onafterdownloadtypecallback)

    Method to handle the event after download a Metadata Type from Org on some processes

  - [**onBeforeDownloadSObject(callback)**](#onbeforedownloadsobjectcallback)

    Method to handle the event before download a SObject when describe SObejcts

  - [**onAfterDownloadSObject(callback)**](#onafterdownloadsobjectcallback)

    Method to handle the event after download a SObject when describe SObejcts

  - [**onAfterDownloadSObject(callback)**](#onafterdownloadsobjectcallback)
  
    Method to handle the event after download a SObject when describe SObejcts

  - [**onAbort(callback)**](#onabortcallback)
    
    Method to handle the event when connection is aborted

  - [**abortConnection()**](#abortconnection)

    Method to abort all connection running processes. When finishes call onAbort() callback

  - [**getAuthUsername(usernameOrAlias)**](#getauthusernameusernameOrAlias)
   
    Method to get the username from an authorized org using a username or alias, or using connection username or alias, or using project auth org username or alias 

  - [**getServerInstance(usernameOrAlias)**](#getserverinstanceusernameoralias)
   
    Method to get the server instance using a username or alias, or using connection username or alias, or using project auth org username or alias 

  - [**getAuthOrg(usernameOrAlias)**](#getauthorgusernameoralias)
   
    Method to get the auth org data using a username or alias, or using connection username or alias, or using project auth org username or alias

  - [**listAuthOrgs()**](#listauthorgs)
   
    Method to list all auth org on the system

  - [**query(query, userToolingApi)**](#queryquery-usertoolingapi)
   
    Method to execute a query to the connected org

  - [**listMetadataTypes()**](#listmetadatatypes)
    
    Method to list all Metadata Types available in the connected org (according selected API Version)

  - [**describeMetadataTypes(typesOrDetails, downloadAll)**](#describemetadatatypestypesordetails-downloadall-groupglobalactions)
   
    Method to describe all or selected Metadata Types from the connected org

  - [**listSObjects(category)**](#listsobjectscategory)
    
    Method to list all SObjects API Name by category

  - [**describeSObjects(sObjects)**](#describesobjectssobjects)
  
    Method to describe SObject data to the specified objects

  - [**retrieve(useMetadataAPI, waitMinutes, targetDir)**](#retrieveusemetadataapi-waitminutes-targetdir)
   
    Method to retrieve data using the connection package file. You can choose to retrieve as Metadata API format or Source Format

  - [**retrieveReport(retrieveId, targetDir)**](#retrievereportretrieveid-targetdir)

    Retrieve report when use Metadata API to retrieve data

  - [**validateDeploy(testLevel, runTests, useMetadataAPI, waitMinutes)**](#validatedeploytestlevel-runtests-usemetadataapi-waitminutes)

    Method to validate a deploy against the org using the connection package file

  - [**deployPackage(testLevel, runTests, useMetadataAPI, waitMinutes)**](#deploypackagetestlevel-runtests-usemetadataapi-waitminutes)

    Method to deploy data to the org using the connection package file

  - [**deploy(types, testLevel, runTests, waitMinutes)**](#deploytypes-testlevel-runtests-waitminutes)

    Method to deploy the selected Metadata Types to the org using Source API

  - [**quickDeploy(deployId, useMetadataAPI)**](#quickdeploydeployid-usemetadataapi)

    Method to execute a quick deploy when validation result is success

  - [**deployReport(deployId, useMetadataAPI, waitMinutes)**](#deployreportdeployid-usemetadataapi-waitminutes)

    Method to get the report of a running deployment

  - [**cancelDeploy(deployId, useMetadataAPI, waitMinutes)**](#canceldeploydeployid-usemetadataapi-waitminutes)

    Method to get the cancel a running deployment

  - [**convertProjectToSFDX(targetDir)**](#convertprojecttosfdxtargetdir)

    Method to convert a Metadata API format Project to a Source format

  - [**convertProjectToMetadataAPI(targetDir)**](#convertprojecttometadataapitargetdir)

    Method to convert a Source format Project to a Metadata API format

  - [**createSFDXProject(projectName, projectFolder, template, withManifest)**](#createsfdxprojectprojectname-projectfolder-template-withmanifest)

    Method to create a SFDX Project. This method change the connection object project folder, package folder and package file values when project is created

  - [**setAuthOrg(usernameOrAlias)**](#setauthorgusernameoralias)

    Method to set an auth org in a Salesforce local project. This command set the selected username or Alias to the connection object when authorize an org.

  - [**exportTreeData(query, outputPath, prefix)**](#exporttreedataquery-outputpath-prefix)

    Method to export data in a tree format from the connected org

  - [**importTreeData(file)**](#importtreedatafile)

    Method to import data in a tree format into the connected org

  - [**bulkDelete(csvfile, sObject)**](#bulkDeletecsvfile-sObject)

    Method to delete data on bulk mode

  - [**executeApexAnonymous(scriptfile)**](#executeapexanonymousscriptfile)

    Method to execute an Apex script file on Anonymous context

  - [**loadUserPermissions(tmpFolder)**](#loaduserpermissionstmpfolder)

    Method to get all available user permissions from the connected org

  - [**retrieveLocalSpecialTypes(tmpFolder, types, compress, sortOrder)**](#retrievelocalspecialtypestmpfolder-types-compress-sortorder)

    Method to Retrieve local special types from the connected org

  - [**retrieveMixedSpecialTypes(tmpFolder, types, downloadAll, compress, sortOrder)**](#retrievemixedspecialtypestmpfolder-types-downloadall-compress-sortorder)

    Method to Retrieve mixed special types from the connected org. Mixed means that only affect the Metadata Types on your project folder, but download all related data from this types from your org (and not only the local data)

  - [**retrieveOrgSpecialTypes(tmpFolder, types, downloadAll, compress, sortOrder**)](#retrieveorgspecialtypestmpfolder-types-downloadall-compress-sortorder)

    Method to Retrieve org special types from the connected org. Org means that affect all Metadata types stored in your org not on your local project.

---
## [**setUsernameOrAlias(usernameOrAlias)**](#setusernameoraliasusernameoralias)
Method to set the Username or Alias to connect with org

### **Parameters:**
  - **usernameOrAlias**: Org Username or Alias to connect. (Must be authorized in the system)
    - `string`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Set Connection username or alias**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.setUsernameOrAlias('MyOrg'); 
```
---

## [**setApiVersion(apiVersion)**](#setapiversionapiversion)
Method to set the API Version to connect

### **Parameters:**
  - **apiVersion**: API Version number to connect with salesforce
    - `string` | `number`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Set Connection api version**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.setApiVersion(50);

    // Or can concatenate method calls because setters return a connection object
    connection.setUsernameOrAlias('MyOrg').setApiVersion(50); 
```
---

## [**setProjectFolder(projectFolder)**](#setprojectfolderprojectfolder)
Method to set the project root folder path. When set the project root, automatically set the packageFolder and packageFile to their respective paths

### **Parameters:**
  - **projectFolder**: Path to the project root folder
    - `string`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Set Connection project folder**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.setProjectFolder('project/root/path');

    // Or can concatenate method calls because setters return a connection object
    connection.setUsernameOrAlias('MyOrg').setProjectFolder('project/root/path'); 
```
---

## [**setPackageFolder(packageFolder)**](#setpackagefolderpackagefolder)
Method to set the package folder path. When set the package folder, automatically set packageFile to the respective path

### **Parameters:**
  - **packageFolder**: Path to the package folder
    - `string`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Set Connection package folder (manifest folder)**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.setPackageFolder('project/root/path/manifest');

    // Or can concatenate method calls because setters return a connection object
    connection.setUsernameOrAlias('MyOrg').setPackageFolder('project/root/path/manifest'); 
```
---

## [**setPackageFile(packageFile)**](#setpackagefilepackagefile)
Method to set the package xml file path

### **Parameters:**
  - **packageFile**: Path to the package folder
    - `string`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Set Connection package file (package.xml)**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.setPackageFile('project/root/path/manifest/package.xml');

    // Or can concatenate method calls because setters return a connection object
    connection.setUsernameOrAlias('MyOrg').setPackageFile('project/root/path/manifest/package.xml'); 
```
---

## [**setNamespacePrefix(namespacePrefix)**](#setnamespaceprefixnamespaceprefix)
Method to set the package xml file path

### **Parameters:**
  - **namespacePrefix**: Namespace prefix from the Org to connect
    - `string`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Set Connection namespace prefix**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.setNamespacePrefix('orgPrefix');

    // Or can concatenate method calls because setters return a connection object
    connection.setUsernameOrAlias('MyOrg').setNamespacePrefix('orgPrefix'); 
```
---

## [**setMultiThread()**](#setmultithread)
Method to able to the connection object to use several threads and processor cores to run some processes and run faster

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Set Connection to user multiple threads and cores**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.setMultiThread();

    // Or can concatenate method calls because setters return a connection object
    connection.setUsernameOrAlias('MyOrg').setMultiThread(); 
```
---

## [**setSingleThread()**](#setsinglethread)
Method to set the connection object to use only one thread and processo core to all processes

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Set Connection to user single thread and core**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.setSingleThread();

    // Or can concatenate method calls because setters return a connection object
    connection.setUsernameOrAlias('MyOrg').setSingleThread(); 
```
---

## [**onPrepare(callback)**](#onpreparecallback)
Method to handle the event when preparing execution of some processes

### **Parameters:**
  - **callback**: Callback function to call when connection is on prepare
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on prepare stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onPrepare(() => {
      console.log('Handling progress on prepare');
    }));
```
---

## [**onCreateProject(callback)**](#oncreateprojectcallback)
Method to handle the event before the create a project on some processes 

### **Parameters:**
  - **callback**: Callback function to handle progress when connection will create a project
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on create project stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onCreateProject(() => {
      console.log('Handling progress on create project');
    }));
```
---

## [**onRetrieve(callback)**](#onretrievecallback)
Method to handle the event before start retrieve data on some processes

### **Parameters:**
  - **callback**: Callback function to handle progress when connection retrieve data
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on retrieve stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onRetrieve(() => {
      console.log('Handling progress on create project');
    }));
```
---

## [**onProcess(callback)**](#onprocesscallback)
Method to handle the event before start processing results on some processes

### **Parameters:**
  - **callback**: Callback function to handle progress when connection is processing results
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on process stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onProcess(() => {
      console.log('Handling progress when process');
    }));
```
---

## [**onLoadingLocal(callback)**](#onloadinglocalcallback)
Method to handle the event before start loading local metadata types on some processes

### **Parameters:**
  - **callback**: Callback function to handle progress when connection load metadata types from local project
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on loading local stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onLoadingLocal(() => {
      console.log('Handling progress on loading local data');
    }));
```
---

## [**onLoadingOrg(callback)**](#onloadingorgcallback)
Method to handle the event before start loading metadata types from org on some processes

### **Parameters:**
  - **callback**: Callback function to handle progress when connection load metadata types from connected org
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on loading org stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onLoadingOrg(() => {
      console.log('Handling progress on create project');
    }));
```
---

## [**onCopyData(callback)**](#oncopydatacallback)
Method to handle the event before start copying files on some processes

### **Parameters:**
  - **callback**: Callback function to handle progress when connection start to copying files
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on copy data stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onCopyData(() => {
      console.log('Handling progress when copy data');
    }));
```
---

## [**onCopyFile(callback)**](#oncopyfilecallback)
Method to handle the event before start copying file content on some processes

### **Parameters:**
  - **callback**: Callback function to handle progress when connection star to copy a single file
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on copy file stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onCopyFile((status) => {
      console.log('Handling progress when copy file');
      console.log('MetadataType => ' + status.entityType);
      console.log('MetadataObject => ' + status.entityObject);
      console.log('MetadataItem => ' + status.entityItem);
      console.log('file => ' + status.data);
    }));
```
---

## [**onCompressFile(callback)**](#oncompressfilecallback)
Method to handle the event before start compress XML File on some processes

### **Parameters:**
  - **callback**: Callback function to handle progress when start compress
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on compress file stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onCompressFile((status) => {
      console.log('Handling progress when compress file');
      console.log('MetadataType => ' + status.entityType);
      console.log('MetadataObject => ' + status.entityObject);
      console.log('MetadataItem => ' + status.entityItem);
      console.log('file => ' + status.data);
    }));
```
---

## [**onBeforeDownloadType(callback)**](#onbeforedownloadtypecallback)
Method to handle the event before download a Metadata Type from Org on some processes

### **Parameters:**
  - **callback**: Callback function to handle progress when start download metadata type
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on before download type stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onBeforeDownloadType((status) => {
      console.log('Handling progress when describe metadata types');
      console.log('MetadataType => ' + status.entityType);
    }));
```
---

## [**onAfterDownloadType(callback)**](#onafterdownloadtypecallback)
Method to handle the event after download a Metadata Type from Org on some processes

### **Parameters:**
  - **callback**: Callback function to handle progress when metadata type is downloaded
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on after download type stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onAfterDownloadType((status) => {
      console.log('Handling progress when describe metadata types');
      console.log('MetadataType => ' + status.entityType);
      console.log('Downloaded Data => ' + status.data);
    }));
```
---

## [**onBeforeDownloadSObject(callback)**](#onbeforedownloadsobjectcallback)
Method to handle the event before download a SObject when describe SObejcts

### **Parameters:**
  - **callback**: Callback function to handle progress when start download sobject
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on before download sobject stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onBeforeDownloadSObject((status) => {
      console.log('Handling progress describe sobjects');
      console.log('SObject => ' + status.entityObject);
    }));
```
---

## [**onAfterDownloadSObject(callback)**](#onafterdownloadsobjectcallback)
Method to handle the event after download a SObject when describe SObejcts

### **Parameters:**
  - **callback**: Callback function to handle progress when sobject is downloaded
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on after download sobject stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onAfterDownloadSObject((status) => {
      console.log('Handling progress describe sobjects');
      console.log('SObject => ' + status.entityObject);
      console.log('Downloaded Data => ' + status.data);
    }));
```
---

## [**onErrorDownload(callback)**](#onerrordownloadcallback)
Method to handle the event when error ocurred when download metadata

### **Parameters:**
  - **callback**: Callback function to handle error
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Handling progress on error download stage**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onErrorDownload((status) => {
      console.log('Handling progress describe sobjects');
      console.log('Metadata or SObject => ' + status.entityObject);
      console.log('message' + status.data);
    }));
```
---

## [**onAbort(callback)**](#onabortabortcallback)
Method to handle the event when connection is aborted

### **Parameters:**
  - **callback**: Callback function to call when connectin is aborted
    - `Function`

### **Return:**
Returns the connection object
- `Connection`

### **Examples:**
**Set connection abort callback**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onAbort(() => {

    }));

    // Or can concatenate method calls because setters return a connection object
    connection.setUsernameOrAlias('MyOrg').onAbort(() => {

    })); 
```
---

## [**abortConnection()**](#abortconnection)
Method to abort all connection running processes. When finishes call onAbort() callback

### **Examples:**
**Abort connection and handle on abort callback**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.onAbort(() => {
        // Execute when abortConnection() finish and kill all running processes
    }));

    connection.abortConnection(); 
```
---

## [**getAuthUsername(usernameOrAlias)**](#getauthusernameusernameOrAlias)
Method to get the username from an authorized org using a username or alias, or using connection username or alias, or using project auth org username or alias 

### **Parameters:**
  - **usernameOrAlias**: Username or alias to get auth username
    - `string`

### **Return:**
Return a String promise with the Username or Alias data
- `Promise<string>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 

### **Examples:**
**Get auth username from the connection project**
If connection has not username or alias defined and not provide it to the method, get the auth username from the project
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector(undefined, 50, 'path/to/project/root');

    connection.getAuthUsername().then((username) => {
        console.log(username);
    }).catch((error) => {
        // Handle errors
    }); 
```

**Get auth username from connection alias**
If connection has username and not alias provided to the method, get username from connection username or alias
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('OrgAlias', 50, 'path/to/project/root');

    connection.getAuthUsername().then((username) => {
        console.log(username);
    }).catch((error) => {
        // Handle errors
    }); 
```

**Get auth username for any alias**
To get the username for any authorized alias, provide it to the method
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('OrgAlias', 50, 'path/to/project/root');

    connection.getAuthUsername('OtherOrgAlias').then((username) => {
        console.log(username);
    }).catch((error) => {
        // Handle errors
    }); 
```
---

## [**getServerInstance(usernameOrAlias)**](#getserverinstanceusernameoralias)
Method to get the server instance using a username or alias, or using connection username or alias, or using project auth org username or alias 

### **Parameters:**
  - **usernameOrAlias**: Username or alias to get the server instance
    - `string`

### **Return:**
Return a String promise with the instance URL
- `Promise<string>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 

### **Examples:**
**Get server instance to the connected org**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();
    
    connection.setUsernameOrAlias('MyOrg');

    connection.getServerInstance().then((inbstanceUrl) => {
        console.log(inbstanceUrl);
    }).catch((error) => {
        // Handle errors
    }); 
```
**Get server instance to another**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector();

    connection.getServerInstance('MyOrg2').then((inbstanceUrl) => {
        console.log(inbstanceUrl);
    }).catch((error) => {
        // Handle errors
    }); 
```
---

## [**getAuthOrg(usernameOrAlias)**](#getauthorgusernameoralias)
Method to get the server instance using a username or alias, or using connection username or alias, or using project auth org username or alias 

### **Parameters:**
  - **usernameOrAlias**: Username or alias to get the auth org data
    - `string`

### **Return:**
Return a promise with Auth Org data or undefined if not exists
- `Promise<AuthOrg | undefined>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 

### **Examples:**
**Get auth org from the connection project**
If connection has not username or alias defined and not provide it to the method, get the auth org data from the project
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector(undefined, 50, 'path/to/project/root');

    connection.getAuthOrg().then((authOrg) => {
        console.log(authOrg);
    }).catch((error) => {
        // Handle errors
    }); 
```

**Get auth org from connection alias**
If connection has username and not alias provided to the method, get auth org data from connection username or alias
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('OrgAlias', 50, 'path/to/project/root');

    connection.getAuthOrg().then((authOrg) => {
        console.log(authOrg);
    }).catch((error) => {
        // Handle errors
    }); 
```

**Get auth org for any alias**
To get the auth org data for any authorized alias, provide it to the method
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('OrgAlias', 50, 'path/to/project/root');

    connection.getAuthOrg('OtherOrgAlias').then((authOrg) => {
        console.log(authOrg);
    }).catch((error) => {
        // Handle errors
    }); 
```
---

## [**listAuthOrgs()**](#listauthorgs)
Method to list all auth org on the system

### **Return:**
Return a promise with all authorized org in the system 
- `Promise<AuthOrg[]>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 

### **Examples:**
**Get all auth org on the system**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 50);

    connection.listAuthOrgs().then((authOrgs) => {
        for(const org of authOrgs){
            console.log('Alias: ' + org.alias);
            console.log('Username: ' + org.username);
            console.log('ORG Id: ' + org.orgId);
            console.log('Instance URL: ' + org.instanceUrl);
            console.log('Access Token: ' + org.accessToken);
            console.log('OAuth Method: ' + org.oauthMethod);
        }
    }).catch((error) => {
        // Handle errors
    }); 

```
---

## [**query<T>(query, userToolingApi)**](#queryquery-usertoolingapi)
Method to execute a query to the connected org. Can return a Typed data (or use any to return any json)

### **Parameters:**
  - **query**: Query to execute (Required)
    - `string`
  - **useToolingApi**: true to use Tooling API to execute the query
    - `boolean`

### **Return:**
Return a promise with the record list 
- `Promise<T[]>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system

### **Examples:**
**Query data and handle results**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 50);

    const query = 'Select Id, Name, Phone, CustomField__c from Account where Name != null';

    interface AccountRecord {
      Id: string;
      Name: string;
      Phone: string;
      CustomField__c: string;
    }

    connection.query<AccountRecord>(query).then((records) => {
      // records will be an instance of AccountRecord[];
        for(const record of records){
            console.log('Account Id: ' + record.Id);
            console.log('Account Name: ' + record.Name);
            console.log('Account Phone: ' + record.Phone);
            console.log('Account Custom Field: ' + record.CustomField__c);
        }
    }).catch((error) => {
        // Handle errors
    });
``` 
---

## [**listMetadataTypes()**](#listmetadatatypes)
Method to list all Metadata Types available in the connected org (according selected API Version)

### **Return:**
Return a promise with the MetadataDetail objects from all available Metadata Types
- `Promise<MetadataDetail[]>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined

### **Examples:**
**Get all available Metadata types to API 45**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 45);

    connection.listMetadataTypes().then((metadataDetails) => {
        for(const detail of metadataDetails){
            console.log('Directory Name: ' + detail.directoryName);
            console.log('In folder: ' + detail.inFolder);
            console.log('Has Meta file: ' + detail.metaFile);
            console.log('Files suffix: ' + detail.suffix);
            console.log('API Name: ' + detail.xmlName);
        }
    }).catch((error) => {
        // Handle errors
    }); 
```
**Get all available Metadata types to API 51**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg');
    connection.setApiVersion(51);

    connection.listMetadataTypes().then((metadataDetails) => {
        for(const detail of metadataDetails){
            console.log('Directory Name: ' + detail.directoryName);
            console.log('In folder: ' + detail.inFolder);
            console.log('Has Meta file: ' + detail.metaFile);
            console.log('Files suffix: ' + detail.suffix);
            console.log('API Name: ' + detail.xmlName);
        }
    }).catch((error) => {
        // Handle errors
    });  
```
--- 

## [**describeMetadataTypes(typesOrDetails, downloadAll, groupGlobalActions)**](#describemetadatatypestypesordetails-downloadall-groupglobalactions)
Method to describe all or selected Metadata Types from the connected org. See [Metadata JSON Format](#metadata-file) section to understand the JSON Metadata Format

### **Parameters:**
  - **typesOrDetails**: List of Metadata Type API Names or Metadata Details to describe (undefined to describe all metadata types)
    - `string[]` | `MetadataDetail[]`
  - **downloadAll**: true to download all Metadata Types from the connected org, false to download only the org namespace Metadata Types
    - `boolean`
  - **groupGlobalActions**: True to group global quick actions on "GlobalActions" group, false to include as object and item
    - `boolean`

### **Return:**
Return a promise with Metadata JSON Object with the selected Metadata Types to describe 
- `Promise<{ [key: string]: MetadataType }>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined

### **Examples:**
**Describe all Metadata types from the connected org and org namespace**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg');
    connection.setApiVersion(51);

    connection.describeMetadataTypes().then((metadataTypes) => {
        for(const metadataTypeName of Object.keys(metadataTypes)){
            const metadataType = metadataTypes[metadataTypeName];
            console.log('metadataType: ' + metadataType);
        }
    }).catch((error) => {
        // Handle errors
    }); 
```
**Describe all Metadata types from the connected org and all namespaces**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg');
    connection.setApiVersion(51);

    connection.describeMetadataTypes(undefined, true).then((metadataTypes) => {
        for(const metadataTypeName of Object.keys(metadataTypes)){
            const metadataType = metadataTypes[metadataTypeName];
            console.log('metadataType: ' + metadataType);
        }
    }).catch((error) => {
        // Handle errors
    }); 
```
**Describe some Metadata types from the connected**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg');
    connection.setApiVersion(51);

    const types = [
        'CustomObject',
        'CustomField',
        'ApexClass'
    ];

    connection.describeMetadataTypes(types).then((metadataTypes) => {
        for(const metadataTypeName of Object.keys(metadataTypes)){
            const metadataType = metadataTypes[metadataTypeName];
            console.log('metadataType: ' + metadataType);
        }
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**listSObjects(category)**](#listsobjectscategory)
Method to list all SObjects API Name by category

### **Parameters:**
  - **category**: Object Category. Values are: Standard, Custom, All. (All by default) 
    - `string`

### **Return:**
Return a promise with a list with the sObject names 
- `Promise<string[]>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system

### **Examples:**
**List all SObjects**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg');
    connection.setApiVersion(51);

    connection.listSObjects().then((objectNames) => {
        for(const objName of objectNames){
            console.log('Name: ' + objName);
        }
    }).catch((error) => {
        // Handle errors
    });
```
**List custom SObjects**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg');
    connection.setApiVersion(51);

    connection.listSObjects('custom').then((objectNames) => {
        for(const objName of objectNames){
            console.log('Name: ' + objName);
        }
    }).catch((error) => {
        // Handle errors
    });
```
**List standard SObjects**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg');
    connection.setApiVersion(51);

    connection.listSObjects('standard').then((objectNames) => {
        for(const objName of objectNames){
            console.log('Name: ' + objName);
        }
    }).catch((error) => {
        // Handle errors
    });
```
---
## [**describeSObjects(sObjects)**](#describesobjectssobjects)
Method to describe SObject data to the specified objects

### **Parameters:**
  - **sObjects**: List with the object API Names to describe 
    - `string[]`

### **Return:**
Return a promise with a SObjects data
- `Promise<SObject[]>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system

### **Examples:**
**Describe some SObjects**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg');
    connection.setApiVersion(51);

    const objects = [
        'Account',
        'Case',
        'Opportunity',
        'Task'
    ];

    connection.describeSObjects(objects).then((objectNames) => {
        for(const objName of objectNames){
            console.log('Name: ' + objName);
        }
    }).catch((error) => {
        // Handle errors
    });
```
**Describe all SObjects**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg');
    connection.setApiVersion(51);

    const allSObjects = await connection.listSObjects();

    connection.describeSObjects(allSObjects).then((objectNames) => {
        for(const objName of objectNames){
            console.log('Name: ' + objName);
        }
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**retrieve(useMetadataAPI, waitMinutes, targetDir)**](#retrieveusemetadataapi-waitminutes-targetdir)
Method to retrieve data using the connection package file. You can choose to retrieve as Metadata API format or Source Format

### **Parameters:**
  - **useMetadataAPI**: True to use Metadata API format, false to use source format 
    - `boolean`
  - **waitMinutes**: Number of minutes to wait for the command to complete and display results 
    - `string` | `number`
  - **targetDir**: Path to the target dir when retrieve with Metadata API Format
    - `string`

### **Return:**
Return a promise with the RetrieveResult object with the retrieve result 
- `Promise<RetrieveResult>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the project folder or target dir is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the project folder or target dir not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the project folder or target dir is not a directory
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined

### **Examples:**
**Retrieve data using Metadata API Format (With package.xml file on project)**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    
    connection.retrieve(true, 'path/to/target/dir').then((retrieveResult) => {
        console.log(retrieveResult);
    }).catch((error) => {
        // Handle errors
    });
```

**Retrieve data using Source Format (With package.xml file on project)**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    
    connection.retrieve().then((retrieveResult) => {
        console.log(retrieveResult);
    }).catch((error) => {
        // Handle errors
    });
```
---
## [**retrieveReport(retrieveId, targetDir)**](#retrievereportretrieveid-targetdir)
Retrieve report when use Metadata API to retrieve data

### **Parameters:**
  - **retrieveId**: Retrieve Id to get the report (Required) 
    - `string`
  - **targetDir**: Path to the target dir (Required) 
    - `string`

### **Return:**
Return a promise with the RetrieveStatus object with the retrieve status result
- `Promise<RetrieveStatus>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the target dir is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the target dir not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the target dir is not a directory

### **Examples:**
**Get a retrieve report status**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    
    const retrieveId = '';
    const targetDir = 'path/to/target/retrieve/dir';

    connection.retrieveReport(retrieveId, targetDir).then((retrieveStatus) => {
        console.log(retrieveStatus);
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**validateDeploy(testLevel, runTests, useMetadataAPI, waitMinutes)**](#validatedeploytestlevel-runtests-usemetadataapi-waitminutes)
Method to validate a deploy against the org using the connection package file

### **Parameters:**
  - **testLevel**: Level of deployment tests to run. Values are 'NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'
    - `string`
  - **runTests**: String with comma separated test names to execute or list with the test names to execute
    - `string` | `string[]`
  - **useMetadataAPI**: True to validate deploy using Metadata API Format, false to use Source Format
    - `boolean`
  - **waitMinutes**: Number of minutes to wait for the command to complete and display results
    - `string` | `number`

### **Return:**
Return a promise with the DeployStatus object with the deploy status result
- `Promise<DeployStatus>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the project folder or package folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the project folder or package folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the project folder or package folder is not a directory
- **`WrongFilePathException`**: If the package file is not a String or can't convert to absolute path
- **`FileNotFoundException`**: If the package file not exists or not have access to it
- **`InvalidFilePathException`**: If the package file is not a file
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined

### **Examples:**

**Validate deployment with Metadata API format (With package.xml file on project)**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    
    const testLevel = 'RunSpecifiedTests';
    const runTest = [
        'ApexTest1',
        'ApexTest2',
        'ApexText3',
        ...,
        ...,
        'ApexTextN',
    ];

    connection.validateDeploy(testLevel, runTest, true).then((deployStatus) => {
        console.log(deployStatus);
    }).catch((error) => {
        // Handle errors
    });
```
**Validate deployment with Source format (With package.xml file on project)**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    
    const testLevel = 'RunSpecifiedTests';
    const runTest = [
        'ApexTest1',
        'ApexTest2',
        'ApexText3',
        ...,
        ...,
        'ApexTextN',
    ];

    connection.validateDeploy(testLevel, runTest).then((deployStatus) => {
        console.log(deployStatus);
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**deployPackage(testLevel, runTests, useMetadataAPI, waitMinutes)**](#deploypackagetestlevel-runtests-usemetadataapi-waitminutes)
Method to deploy data to the org using the connection package file

### **Parameters:**
  - **testLevel**: Level of deployment tests to run. Values are 'NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'
    - `string`
  - **runTests**: String with comma separated test names to execute or list with the test names to execute
    - `string` | `string[]`
  - **useMetadataAPI**: True to validate deploy using Metadata API Format, false to use Source Format
    - `boolean`
  - **waitMinutes**: Number of minutes to wait for the command to complete and display results
    - `string` | `number`

### **Return:**
Return a promise with the DeployStatus object with the deploy status result
- `Promise<DeployStatus>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the project folder or package folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the project folder or package folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the project folder or package folder is not a directory
- **`WrongFilePathException`**: If the package file is not a String or can't convert to absolute path
- **`FileNotFoundException`**: If the package file not exists or not have access to it
- **`InvalidFilePathException`**: If the package file is not a file
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**

**Deploy data with Metadata API format (With package.xml file on project)**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    
    const testLevel = 'RunSpecifiedTests';
    const runTest = [
        'ApexTest1',
        'ApexTest2',
        'ApexText3',
        ...,
        ...,
        'ApexTextN',
    ];

    connection.deployPackage(testLevel, runTest, true).then((deployStatus) => {
        console.log(deployStatus);
    }).catch((error) => {
        // Handle errors
    });
```
**Deploy data with Source format (With package.xml file on project)**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    
    const testLevel = 'RunSpecifiedTests';
    const runTest = [
        'ApexTest1',
        'ApexTest2',
        'ApexText3',
        ...,
        ...,
        'ApexTextN',
    ];

    connection.deployPackage(testLevel, runTest).then((deployStatus) => {
        console.log(deployStatus);
    }).catch((error) => {
        // Handle errors
    });
```
---


## [**deployPackage(testLevel, runTests, useMetadataAPI, waitMinutes)**](#deploypackagetestlevel-runtests-usemetadataapi-waitminutes)
Method to deploy data to the org using the connection package file

### **Parameters:**
  - **types**: Metadata JSON Object with the selected elements to deploy or comma separated values String with the metadata types to deploy
    - `string` | `{ [key: string]: MetadataType }`
  - **testLevel**: Level of deployment tests to run. Values are 'NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg'
    - `string`
  - **runTests**: String with comma separated test names to execute or list with the test names to execute
    - `string` | `string[]`
  - **waitMinutes**: Number of minutes to wait for the command to complete and display results
    - `string` | `number`

### **Return:**
Return a promise with the DeployStatus object with the deploy status result
- `Promise<DeployStatus>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the project folder or package folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the project folder or package folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the project folder or package folder is not a directory
- **`WrongFormatException`**: If JSON Metadata Object has incorrect format
- **`InvalidFilePathException`**: If the package file is not a file
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**

**Deploy data with Source format**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    
    const types = 'CustomLabel:LabelName1, Profile:ProfileName1';
    const testLevel = 'RunSpecifiedTests';
    const runTest = [
        'ApexTest1',
        'ApexTest2',
        'ApexText3',
        ...,
        ...,
        'ApexTextN',
    ];

    connection.deploy(types, testLevel, runTest).then((deployStatus) => {
        console.log(deployStatus);
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**quickDeploy(deployId, useMetadataAPI)**](#quickdeploydeployid-usemetadataapi)
Method to execute a quick deploy when validation result is success

### **Parameters:**
  - **deployId**: Id to deploy the validated deployment (Required)
    - `string`
  - **useMetadataAPI**: True to execute quick deploy using Metadata API Format, false to use Source Format
    - `boolean`

### **Return:**
Return a promise with the DeployStatus object with the deploy status result
- `Promise<DeployStatus>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the project folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the project folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the project folder is not a directory
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**
**Execute quick deploy to Validated deploy with Metadata API format**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    
    const deployId = '00X213as2984';

    connection.quickDeploy(deployId, true).then((deployStatus) => {
        console.log(deployStatus);
    }).catch((error) => {
        // Handle errors
    });
```
**Execute quick deploy to Validated deploy with Source format**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    const deployId = '00X213as2984';

    connection.quickDeploy(deployId).then((deployStatus) => {
        console.log(deployStatus);
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**deployReport(deployId, useMetadataAPI, waitMinutes)**](#deployreportdeployid-usemetadataapi-waitminutes)
Method to get the report of a running deployment

### **Parameters:**
  - **deployId**: Id to the deployment to get the report (Required)
    - `string`
  - **useMetadataAPI**: True to execute deploy report using Metadata API Format, false to use Source Format
    - `boolean`
  - **waitMinutes**: Number of minutes to wait for the command to complete and display results
    - `string` | `number`

### **Return:**
Return a promise with the DeployStatus object with the deploy status result
- `Promise<DeployStatus>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system

### **Examples:**
**Execute deploy report to active deploy with Metadata API format**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    
    const deployId = '00X213as2984';

    connection.deployReport(deployId, true).then((deployStatus) => {
        console.log(deployStatus);
    }).catch((error) => {
        // Handle errors
    });
```
**Execute deploy report to active deploy with Source format**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    const deployId = '00X213as2984';

    connection.deployReport(deployId).then((deployStatus) => {
        console.log(deployStatus);
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**cancelDeploy(deployId, useMetadataAPI, waitMinutes)**](#canceldeploydeployid-usemetadataapi-waitminutes)
Method to get the cancel a running deployment

### **Parameters:**
  - **deployId**: Id to the deployment to cancel (Required)
    - `string`
  - **useMetadataAPI**: True to execute cancel deploy using Metadata API Format, false to use Source FormatSource Format
    - `boolean`
  - **waitMinutes**: Number of minutes to wait for the command to complete and display results
    - `string` | `number`

### **Return:**
Return a promise with the DeployStatus object with the deploy status result
- `Promise<DeployStatus>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system

### **Examples:**
**Cancel deploy to active deploy with Metadata API format**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    
    const deployId = '00X213as2984';

    connection.cancelDeploy(deployId, true).then((deployStatus) => {
        console.log(deployStatus);
    }).catch((error) => {
        // Handle errors
    });
```
**Cancel deploy to active deploy with Source format**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    const deployId = '00X213as2984';

    connection.cancelDeploy(deployId).then((deployStatus) => {
        console.log(deployStatus);
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**convertProjectToSFDX(targetDir)**](#convertprojecttosfdxtargetdir)
Method to convert a Metadata API format Project to a Source format

### **Parameters:**
  - **targetDir**: Path to the target dir to save the converted project (Required)
    - `string`

### **Return:**
Return an empty promise when conversion finish
- `Promise<void>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the package folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the package folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the package folder is not a directory
- **`WrongFilePathException`**: If the package file is not a String or can't convert to absolute path
- **`FileNotFoundException`**: If the package file not exists or not have access to it
- **`InvalidFilePathException`**: If the package file is not a file
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**
**Convert Metadata API Format project to Source Format**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    connection.convertProjectToSFDX('path/to/folder/to/save/project').then(() => {
        // Conversion finished
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**convertProjectToMetadataAPI(targetDir)**](#convertprojecttometadataapitargetdir)
Method to convert a Metadata API format Project to a Source format

### **Parameters:**
  - **targetDir**: Path to the target dir to save the converted project (Required)
    - `string`

### **Return:**
Return an empty promise when conversion finish
- `Promise<void>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the package folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the package folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the package folder is not a directory
- **`WrongFilePathException`**: If the package file is not a String or can't convert to absolute path
- **`FileNotFoundException`**: If the package file not exists or not have access to it
- **`InvalidFilePathException`**: If the package file is not a file
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**
**Convert Source Format project to Metadata API Format**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    connection.convertProjectToMetadataAPI('path/to/folder/to/save/project').then(() => {
        // Conversion finished
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**createSFDXProject(projectName, projectFolder, template, withManifest)**](#createsfdxprojectprojectname-projectfolder-template-withmanifest)
Method to create a SFDX Project. This method change the connection object project folder, package folder and package file values when project is created

### **Parameters:**
  - **projectName**: Project Name to create (Required)
    - `string`
- **projectFolder**: Path to save the project. If undefined use the connection project folder
    - `string`
- **template**: Template to use to create the project. Empty by default
    - `string`
- **withManifest**: True to create the project with manifest, false in otherwise
    - `boolean`


### **Return:**
Return a promise with SFDXProjectResult Object with the creation result
- `Promise<SFDXProjectResult>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the project folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the project folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the project folder is not a directory

### **Examples:**
**Create new SFDX Project with connection project folder**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    const projectName = 'NEW SFDX Project';

    connection.createSFDXProject(projectName).then((createResult) => {
        console.log(createResult);
    }).catch((error) => {
        // Handle errors
    });
```
**Create new SFDX Project on a different connection project folder**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    const projectName = 'NEW SFDX Project';
    const projectFolder = 'path/to/project/folder';

    connection.createSFDXProject(projectName, projectFolder).then((createResult) => {
        console.log(createResult);
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**setAuthOrg(usernameOrAlias)**](#setauthorgusernameoralias)
Method to set an auth org in a Salesforce local project. This command set the selected username or Alias to the connection object when authorize an org.

### **Parameters:**
  - **usernameOrAlias**: Username or alias to auth. (Must be authorized in the system). If undefined use the connection username or alias
    - `string`

### **Return:**
Return an empty promise when operation finish
- `Promise<void>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the project folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the project folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the project folder is not a directory

### **Examples:**
**Auth new org with connection username or alias**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    connection.setAuthOrg().then(() => {
        // Org set
    }).catch((error) => {
        // Handle errors
    });
```
**Auth new org with different connection username or alias**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    const usernameOrAlias = 'MyOrg2';

    connection.setAuthOrg(usernameOrAlias).then(() => {
        // Org set
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**exportTreeData(query, outputPath, prefix)**](#exporttreedataquery-outputpath-prefix)
Method to export data in a tree format from the connected org

### **Parameters:**
  - **query**: Query to extract the data (Required)
    - `string`
  - **outputPath**: Path to the folder to (Required)
    - `string`
  - **prefix**: Prefix to add to the created files
    - `string`

### **Return:**
Return an array with the extrated data information
- `Promise<ExportTreeDataResult[]>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the output folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the output folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the output folder is not a directory
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**
**Export Accounts data with related contacts**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    const query = 'Select Id, Name, Phone, (Select Id, Name, Phone from Contacts) from Account where Name != null';
    const outputPath = 'path/to/save/the/result';

    connection.exportTreeData(query, outputPath).then((results) => {
        for(const result of results){
            console.log(result.file);
            console.log(result.nRecords);
            console.log(result.isPlanFile);
        }
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**importTreeData(file)**](#importtreedatafile)
Method to import data in a tree format into the connected org

### **Parameters:**
  - **file**: Path to the file to import (Required)
    - `string`

### **Return:**
Return a promise with an object with the ok result and errors on insert
- `Promise<ImportTreeDataResponse>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongFilePathException`**: If the file is not a String or can't convert to absolute path
- **`FileNotFoundException`**: If the file not exists or not have access to it
- **`InvalidFilePathException`**: If the file is not a directory
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**
**Import file with exported records**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    const fileToImport = 'path/to/file/to/import.json';

    connection.importTreeData(fileToImport).then((result) => {
        if(result.results){
            for(const result of result.results){
                console.log(result.refId);
                console.log(result.id);
                console.log(result.sobject);
            }
        } else {
            for(const error of result.errors){
                console.log(error);
            }
        }
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**bulkDelete(csvfile, sObject)**](#bulkDeletecsvfile-sObject)
Method to delete data on bulk mode

### **Parameters:**
  - **csvfile**: Path to the CSV file with the ids to delete (Required)
    - `string`
  - **sObject**: Records SObject API Name (Required)
    - `string`


### **Return:**
Return a promise with an array with BulkStatus objects with the delete result
- `Promise<BulkStatus[]>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the project folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the project folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the project folder is not a directory
- **`WrongFilePathException`**: If the csv file is not a String or can't convert to absolute path
- **`FileNotFoundException`**: If the csv file not exists or not have access to it
- **`InvalidFilePathException`**: If the csv file is not a directory
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**
**Delete data at bulk mode**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    const csvFile = 'path/to/csv/file/to/delete.csv';

    connection.bulkDelete(csvFile, 'Account').then((deleteResults) => {
        for(const result of deleteResults){
            console.log(result);
        }
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**executeApexAnonymous(scriptfile)**](#executeapexanonymousscriptfile)
Method to execute an Apex script file on Anonymous context

### **Parameters:**
  - **scriptfile**: Path to the script file (Required)
    - `string`

### **Return:**
Return a promise with the execution log as String
- `Promise<string>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the project folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the project folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the project folder is not a directory
- **`WrongFilePathException`**: If the script file is not a String or can't convert to absolute path
- **`FileNotFoundException`**: If the script file not exists or not have access to it
- **`InvalidFilePathException`**: If the script file is not a directory
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**
**Execute an Apex Anonymous script**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    const scriptFile = 'path/to/csv/file/to/delete.csv';

    connection.executeApexAnonymous(scriptFile).then((executionLog) => {
        console.log(executionLog);
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**loadUserPermissions(tmpFolder)**](#loaduserpermissionstmpfolder)
Method to get all available user permissions from the connected org

### **Parameters:**
  - **tmpFolder**: Temporal folder to save support files (Required)
    - `string`

### **Return:**
Return a promise with the list of user permissions
- `Promise<string[]>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the temp folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the temp folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the temp folder is not a directory
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**
**Load User permissions from connected org**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    connection.loadUserPermissions('path/to/temporal/folder').then((permissions) => {
        console.log(permissions);
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**retrieveLocalSpecialTypes(tmpFolder, types, compress, sortOrder)**](#retrievelocalspecialtypestmpfolder-types-compress-sortorder)
Method to get all available user permissions from the connected org

### **Parameters:**
  - **tmpFolder**: Temporal folder to save support files (Required)
    - `string`
  - **types**: Metadata JSON Object or Metadata JSON File with the specific types to retrieve. Undefined to retrieve all special types
    - `string` | `{ [key: string]: MetadataType }`
  - **compress**: true to compress affected files, false in otherwise
    - `boolean`
  - **sortOrder**: Compress sort order when compress files
    - `string`

### **Return:**
Return a promise with a RetrieveResult with the retrieve result
- `Promise<RetrieveResult>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the temp folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the temp folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the temp folder is not a directory
- **`WrongFilePathException`**: If the types file is not a String or can't convert to absolute path
- **`FileNotFoundException`**: If the types file not exists or not have access to it
- **`InvalidFilePathException`**: If the types file is not a file
- **`WrongFormatException`**: If types object or file is not a JSON file or not have the correct Metadata JSON format
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**
**Retrieve all local special Metadata Types from Org**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    connection.retrieveLocalSpecialTypes('path/to/temporal/folder').then((result) => {
        console.log(result);
    }).catch((error) => {
        // Handle errors
    });
```
**Retrieve some local special Metadata Types from Org**
```javascript
    import { SFConnector } from '@aurahelper/connector';
    const { Types, Values } = require('@aurahelper/core');
    const MetadataTypes = Values.MetadataTypes;
    const MetadataType = Types.MetadataType;
    const MetadataObject = Types.MetadataObject;
    const MetadataItem = Types.MetadataItem;


    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    const types: {};
    types[MetadataTypes.CUSTOM_APPLICATION] = new MetadataType(MetadataTypes.CUSTOM_APPLICATION, true); // set to true Metadata Type to ignore all custom application
    types[MetadataTypes.PERMISSION_SET] = new MetadataType(MetadataTypes.PERMISSION_SET, false);    // set to false Metadata Type to ignore some permission sets 
    types[MetadataTypes.PERMISSION_SET].addChild(new MetadataObject('PermissionSet1', true));   // Set to true to repair PermissionSet1
    types[MetadataTypes.PERMISSION_SET].addChild(new MetadataObject('PermissionSet2', true));  // Set to true to repair PermissionSet2
    types[MetadataTypes.PERMISSION_SET].addChild(new MetadataObject('PermissionSet3', false));  // Set to false to not repair PermissionSet3


    connection.retrieveLocalSpecialTypes('path/to/temporal/folder', types).then((result) => {
        console.log(result);
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**retrieveMixedSpecialTypes(tmpFolder, types, downloadAll, compress, sortOrder)**](#retrievemixedspecialtypestmpfolder-types-downloadall-compress-sortorder)
Method to Retrieve mixed special types from the connected org. Mixed means that only affect the Metadata Types on your project folder, but download all related data from this types from your org (and not only the local data)

### **Parameters:**
  - **tmpFolder**: Temporal folder to save support files (Required)
    - `string`
  - **types**: Metadata JSON Object or Metadata JSON File with the specific types to retrieve. Undefined to retrieve all special types
    - `string` | `{ [key: string]: MetadataType }`
  - **downloadAll**: true to compress affected files, false in otherwise
    - `boolean`
  - **compress**: true to download all related data from any namespace, false to downlaod only the org namespace data
    - `boolean`
  - **sortOrder**: Compress sort order when compress files
    - `string`

### **Return:**
Return a promise with a RetrieveResult with the retrieve result
- `Promise<RetrieveResult>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the temp folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the temp folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the temp folder is not a directory
- **`WrongFilePathException`**: If the types file is not a String or can't convert to absolute path
- **`FileNotFoundException`**: If the types file not exists or not have access to it
- **`InvalidFilePathException`**: If the types file is not a file
- **`WrongFormatException`**: If types object or file is not a JSON file or not have the correct Metadata JSON format
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**
**Retrieve all mixed special Metadata Types from Org**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    connection.retrieveMixedSpecialTypes('path/to/temporal/folder').then((result) => {
        console.log(result);
    }).catch((error) => {
        // Handle errors
    });
```
**Retrieve some mixed special Metadata Types from Org**
```javascript
    import { SFConnector } from '@aurahelper/connector';
    const { Types, Values } = require('@aurahelper/core');
    const MetadataTypes = Values.MetadataTypes;
    const MetadataType = Types.MetadataType;
    const MetadataObject = Types.MetadataObject;
    const MetadataItem = Types.MetadataItem;


    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    const types: {};
    types[MetadataTypes.CUSTOM_APPLICATION] = new MetadataType(MetadataTypes.CUSTOM_APPLICATION, true); // set to true Metadata Type to ignore all custom application
    types[MetadataTypes.PERMISSION_SET] = new MetadataType(MetadataTypes.PERMISSION_SET, false);    // set to false Metadata Type to ignore some permission sets 
    types[MetadataTypes.PERMISSION_SET].addChild(new MetadataObject('PermissionSet1', true));   // Set to true to repair PermissionSet1
    types[MetadataTypes.PERMISSION_SET].addChild(new MetadataObject('PermissionSet2', true));  // Set to true to repair PermissionSet2
    types[MetadataTypes.PERMISSION_SET].addChild(new MetadataObject('PermissionSet3', false));  // Set to false to not repair PermissionSet3


    connection.retrieveMixedSpecialTypes('path/to/temporal/folder', types).then((result) => {
        console.log(result);
    }).catch((error) => {
        // Handle errors
    });
```
---

## [**retrieveOrgSpecialTypes(tmpFolder, types, downloadAll, compress, sortOrder)**](#retrieveorgspecialtypestmpfolder-types-downloadall-compress-sortorder)
Method to Retrieve org special types from the connected org. Org means that affect all Metadata types stored in your org not on your local project.

### **Parameters:**
  - **tmpFolder**: Temporal folder to save support files (Required)
    - `string`
  - **types**: Metadata JSON Object or Metadata JSON File with the specific types to retrieve. Undefined to retrieve all special types
    - `string` | `{ [key: string]: MetadataType }`
  - **downloadAll**: true to compress affected files, false in otherwise
    - `boolean`
  - **compress**: true to download all related data from any namespace, false to downlaod only the org namespace data
    - `boolean`
  - **sortOrder**: Compress sort order when compress files
    - `string`

### **Return:**
Return a promise with a RetrieveResult with the retrieve result
- `Promise<RetrieveResult>`

### **Throws:**
This method can throw the next exceptions:

- **`ConnectionException`**: If run other connection process when has one process running or Connection Return an error 
- **`DataRequiredException`**: If required data is not provided
- **`OSNotSupportedException`**: When run this processes with not supported operative system
- **`WrongDirectoryPathException`**: If the temp folder is not a String or can't convert to absolute path
- **`DirectoryNotFoundException`**: If the temp folder not exists or not have access to it
- **`InvalidDirectoryPathException`**: If the temp folder is not a directory
- **`WrongFilePathException`**: If the types file is not a String or can't convert to absolute path
- **`FileNotFoundException`**: If the types file not exists or not have access to it
- **`InvalidFilePathException`**: If the types file is not a file
- **`WrongFormatException`**: If types object or file is not a JSON file or not have the correct Metadata JSON format
- **`WrongDatatypeException`**: If the api version is not a Number or String. Can be undefined


### **Examples:**
**Retrieve all org special Metadata Types from Org**
```javascript
    import { SFConnector } from '@aurahelper/connector';

    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');

    connection.retrieveOrgSpecialTypes('path/to/temporal/folder').then((result) => {
        console.log(result);
    }).catch((error) => {
        // Handle errors
    });
```
**Retrieve some org special Metadata Types from Org**
```javascript
    import { SFConnector } from '@aurahelper/connector';
    const { Types, Values } = require('@aurahelper/core');
    const MetadataTypes = Values.MetadataTypes;
    const MetadataType = Types.MetadataType;
    const MetadataObject = Types.MetadataObject;
    const MetadataItem = Types.MetadataItem;


    const connection = new SFConnector('MyOrg', 51, 'path/to/project/folder');
    const types: {};
    types[MetadataTypes.CUSTOM_APPLICATION] = new MetadataType(MetadataTypes.CUSTOM_APPLICATION, true); // set to true Metadata Type to ignore all custom application
    types[MetadataTypes.PERMISSION_SET] = new MetadataType(MetadataTypes.PERMISSION_SET, false);    // set to false Metadata Type to ignore some permission sets 
    types[MetadataTypes.PERMISSION_SET].addChild(new MetadataObject('PermissionSet1', true));   // Set to true to repair PermissionSet1
    types[MetadataTypes.PERMISSION_SET].addChild(new MetadataObject('PermissionSet2', true));  // Set to true to repair PermissionSet2
    types[MetadataTypes.PERMISSION_SET].addChild(new MetadataObject('PermissionSet3', false));  // Set to false to not repair PermissionSet3


    connection.retrieveOrgSpecialTypes('path/to/temporal/folder', types).then((result) => {
        console.log(result);
    }).catch((error) => {
        // Handle errors
    });
```
# [**Metadata JSON Format**](#metadata-file)

The Metadata JSON Format used by Aura Helper Framework and modules have the next structure. Some fields are required and the datatypes checked to ensure the correct file structure. 
```json
    {
        "MetadataAPIName": {
            "name": "MetadataAPIName",                                  // Required (String). Contains the Metadata Type API Name (like object Key)
            "checked": false,                                           // Required (Boolean). Field for include this type on package or not
            "path": "path/to/the/metadata/folder",                      // Optional (String). Path to the Metadata Type folder in local project
            "suffix": "fileSuffix",                                     // Optional (String). Metadata File suffix
            "childs": {                                                 // Object with a collection of childs (Field required (JSON Object) but can be an empty object)
                "MetadataObjectName":{
                    "name": "MetadataObjectName",                       // Required (String). Contains the Metadata Object API Name (like object Key)
                    "checked": false,                                   // Required (Boolean). Field for include this object on package or not
                    "path": "path/to/the/metadata/file/or/folder",      // Optional (String). Path to the object file or folder path
                    "childs": {                                         // Object with a collection of childs (Field required (JSON Object) but can be an empty object)
                        "MetadataItemName": {
                            "name": "MetadataItemName",                 // Required (String). Contains the Metadata Item API Name (like object Key)
                            "checked": false,                           // Required (Boolean). Field for include this object on package or not
                            "path": "path/to/the/metadata/file"
                        },
                        "MetadataItemName2": {
                            ...
                        },
                        ...,
                        ...,
                        ...
                    }
                }
                "MetadataObjectName2":{
                   ...
                },
                ...,
                ...,
                ...
            }
        }
    }
```
### **Example**:
```json
    {
        "CustomObject": {
            "name": "CustomObject",
            "checked": false,
            "path":  "path/to/root/project/force-app/main/default/objects",
            "suffix": "object",
            "childs": {
                "Account": {
                    "name": "Account",
                    "checked": true,            // Add Account Object to the package
                    "path": "path/to/root/project/force-app/main/default/objects/Account/Account.object-meta.xml",
                    "childs": {}
                },
                "Case": {
                    "name": "Case",
                    "checked": true,            // Add Case Object to the package
                    "path": "path/to/root/project/force-app/main/default/objects/Case/Case.object-meta.xml",
                    "childs": {}
                },
                ...,
                ...,
                ...
            }
        },
        "CustomField": {
            "name": "CustomField",
            "checked": false,
            "path":  "path/to/root/project/force-app/main/default/objects",
            "suffix": "field",
            "childs": {
                "Account": {
                    "name": "Account",
                    "checked": false,            
                    "path": "path/to/root/project/force-app/main/default/objects/Account/fields",
                    "childs": {
                        "customField__c": {
                            "name": "customField__c",
                            "checked": true,    // Add customField__c to the package
                            "path": "path/to/root/project/force-app/main/default/objects/Account/fields/customField__c.field-meta.xml",
                        },
                        ...,
                        ...,
                        ...
                    }
                },
                "Case": {
                    "name": "Case",
                    "checked": false,           
                    "path": "path/to/root/project/force-app/main/default/objects/Case/fields",
                    "childs": {
                        "CaseNumber": {
                            "name": "CaseNumber",
                            "checked": true,    // Add CaseNumber to the package
                            "path": "path/to/root/project/force-app/main/default/objects/Account/fields/CaseNumber.field-meta.xml",
                        },
                        ...,
                        ...,
                        ...
                    }
                },
                ...,
                ...,
                ...
            }
        }
    }
```