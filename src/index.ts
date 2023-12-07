import EventEmitter from "events";
import { AuthInfo, Connection, Org, Config, OrgAuthorization } from '@salesforce/core';
import { MetadataFactory } from '@aurahelper/metadata-factory';
import { PackageGenerator } from '@aurahelper/package-generator';
import { XMLCompressor } from '@aurahelper/xml-compressor';
import { XML } from '@aurahelper/languages';
import { AuthOrg, BulkStatus, ConnectionException, CoreUtils, DataRequiredException, DeployStatus, ExportTreeDataResult, ImportTreeDataResult, FileChecker, FileReader, FileWriter, MetadataDetail, MetadataType, MetadataTypes, NotIncludedMetadata, OperationNotAllowedException, PathUtils, Process, ProcessFactory, ProcessHandler, ProgressStatus, RetrieveResult, RetrieveStatus, SFDXProjectResult, SObject, SpecialMetadata, ImportTreeDataResponse, MetadataObject, SpecialMetadataDef, NotIncludedMetadataDef } from "@aurahelper/core";
import { HttpRequest } from "jsforce";
import { ListMetadataQuery } from "jsforce/lib/api/metadata";
const XMLParser = XML.XMLParser;
const XMLUtils = XML.XMLUtils;
const Validator = CoreUtils.Validator;
const StrUtils = CoreUtils.StrUtils;
const OSUtils = CoreUtils.OSUtils;
const Utils = CoreUtils.Utils;
const MathUtils = CoreUtils.MathUtils;
const MetadataUtils = CoreUtils.MetadataUtils;
const ProjectUtils = CoreUtils.ProjectUtils;


const xmlChars: any = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;'
}

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
export class SFConnector {

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
    _useAuraHelperSFDX: boolean;

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
        this._useAuraHelperSFDX = false;
    }

    useAuraHelperSFDX(useAuraHelperSFDX: boolean) {
        this._useAuraHelperSFDX = useAuraHelperSFDX === undefined ? true : useAuraHelperSFDX;
    }

    /**
     * Method to set the Username or Alias to connect with org
     * @param {string} usernameOrAlias Org Username or Alias to connect. (Must be authorized in the system)
     * 
     * @returns {SFConnector} Returns the connection object
     */
    setUsernameOrAlias(usernameOrAlias: string): SFConnector {
        this.usernameOrAlias = usernameOrAlias;
        return this;
    }

    /**
     * Method to set the API Version to connect
     * @param {string | number} apiVersion API Version number to connect with salesforce
     * 
     * @returns {SFConnector} Returns the connection object
     */
    setApiVersion(apiVersion: string | number): SFConnector {
        this.apiVersion = apiVersion;
        return this;
    }

    /**
     * Method to set the project root folder path. When set the project root, automatically set the packageFolder and packageFile to their respective paths
     * @param {string} projectFolder Path to the project root folder
     * 
     * @returns {SFConnector} Returns the connection object
     */
    setProjectFolder(projectFolder: string): SFConnector {
        this.projectFolder = (projectFolder !== undefined) ? PathUtils.getAbsolutePath(projectFolder) : projectFolder;
        this.packageFolder = this.projectFolder + '/manifest';
        this.packageFile = this.projectFolder + '/manifest/package.xml';
        return this;
    }

    /**
     * Method to set the package folder path. When set the package folder, automatically set packageFile to the respective path
     * @param {string} packageFile Path to the package folder
     * 
     * @returns {SFConnector} Returns the connection object
     */
    setPackageFolder(packageFolder: string): SFConnector {
        this.packageFolder = (packageFolder !== undefined) ? PathUtils.getAbsolutePath(packageFolder) : packageFolder;
        this.packageFile = this.projectFolder + '/manifest/package.xml';
        return this;
    }

    /**
     * Method to set the package xml file path
     * @param {string} packageFile Path to the package file
     * 
     * @returns {SFConnector} Returns the connection object
     */
    setPackageFile(packageFile: string): SFConnector {
        this.packageFile = (packageFile !== undefined) ? PathUtils.getAbsolutePath(packageFile) : packageFile;
        return this;
    }

    /**
     * Method to set the Org namespace prefix
     * @param {string} namespacePrefix Namespace prefix from the Org to connect
     * 
     * @returns {SFConnector} Returns the connection object
     */
    setNamespacePrefix(namespacePrefix: string): SFConnector {
        this.namespacePrefix = (namespacePrefix !== undefined) ? namespacePrefix : '';
        return this;
    }

    /**
     * Method to able to the connection object to use several threads and processor cores to run some processes and run faster
     * 
     * @returns {SFConnector} Returns the connection object
     */
    setMultiThread(): SFConnector {
        this.multiThread = true;
        return this;
    }

    /**
     * Method to set the connection object to use only one thread and processo core to all processes
     * 
     * @returns {SFConnector} Returns the connection object
     */
    setSingleThread(): SFConnector {
        this.multiThread = false;
        return this;
    }

    /**
     * Method to handle the event when preparing execution of some processes
     * @param {Function} callback Callback function to call when connection is on prepare
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onPrepare(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.PREPARE, callback);
        return this;
    }

    /**
     * Method to handle the event before the create a project on some processes 
     * @param {Function} callback Callback function to handle progress when connection will create a project
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onCreateProject(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.CREATE_PROJECT, callback);
        return this;
    }

    /**
     * Method to handle the event before start retrieve data on some processes
     * @param {Function} callback Callback function to handle progress when connection retrieve data
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onRetrieve(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.RETRIEVE, callback);
        return this;
    }

    /**
     * Method to handle the event before start processing results on some processes
     * @param {Function} callback Callback function to handle progress when connection is processing results
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onProcess(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.PROCESS, callback);
        return this;
    }

    /**
     * Method to handle the event before start loading local metadata types on some processes
     * @param {Function} callback Callback function to handle progress when connection load metadata types from local project
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onLoadingLocal(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.LOADING_LOCAL, callback);
        return this;
    }

    /**
     * Method to handle the event before start loading metadata types from org on some processes
     * @param {Function} callback Callback function to handle progress when connection load metadata types from connected org
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onLoadingOrg(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.LOADING_ORG, callback);
        return this;
    }

    /**
     * Method to handle the event before start copying files on some processes
     * @param {Function} callback Callback function to handle progress when connection start to copying files
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onCopyData(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.COPY_DATA, callback);
        return this;
    }

    /**
     * Method to handle the event before start copying file content on some processes
     * @param {Function} callback Callback function to handle progress when connection star to copy a single file
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onCopyFile(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.COPY_FILE, callback);
        return this;
    }

    /**
     * Method to handle the event before start compress XML File on some processes
     * @param {Function} callback Callback function to handle progress when start compress
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onCompressFile(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.COMPRESS_FILE, callback);
        return this;
    }

    /**
     * Method to handle the event before download a Metadata Type from Org on some processes
     * @param {Function} callback Callback function to handle progress when start download metadata type
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onBeforeDownloadType(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.BEFORE_DOWNLOAD_TYPE, callback);
        return this;
    }

    /**
     * Method to handle the event after download a Metadata Type from Org on some processes
     * @param {Function} callback Callback function to handle progress when metadata type is downloaded
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onAfterDownloadType(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.AFTER_DOWNLOAD_TYPE, callback);
        return this;
    }

    /**
     * Method to handle the event before download a SObject when describe SObejcts
     * @param {Function} callback Callback function to handle progress when start download sobject
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onBeforeDownloadSObject(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.BEFORE_DOWNLOAD_OBJECT, callback);
        return this;
    }

    /**
     * Method to handle the event after download a SObject when describe SObejcts
     * @param {Function} callback Callback function to handle progress when sobject is downloaded
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onAfterDownloadSObject(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.AFTER_DOWNLOAD_OBJECT, callback);
        return this;
    }

    /**
     * Method to handle the event when error ocurred when download metadata
     * @param {Function} callback Callback function to handle error
     * 
     * @returns {SFConnector} Returns the connection object
     */
    onErrorDownload(callback: (status: ProgressStatus) => void) {
        this._event.on(EVENT.DOWNLOAD_ERROR, callback);
        return this;
    }

    /**
     * Method to handle the event when connection is aborted
     * @param {Function} callback Callback function to call when connection is aborted
     * 
     * @returns {SFConnector} Returns the connection object
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
     * Method to get the username from an authorized org using a username or alias, or using connection username or alias, or using project auth org username or alias 
     * @param {string} [usernameOrAlias] Username or alias to get auth username
     * 
     * @returns {Promise<string | undefined>} Return a String promise with the Username or Alias data
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     */
    async getAuthUsername(usernameOrAlias?: string): Promise<string | undefined> {
        usernameOrAlias = usernameOrAlias ?? this.usernameOrAlias;
        const authOrg = await this.getAuthOrg(usernameOrAlias);
        return authOrg ? authOrg.username : undefined;
    }

    /**
     * Method to get the server instance using a username or alias, or using connection username or alias, or using project auth org username or alias 
     * @param {string} [usernameOrAlias] Username or alias to get the server instance
     * 
     * @returns {Promise<string | undefined>} Return a String promise with the instance URL
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     */
    async getServerInstance(usernameOrAlias?: string): Promise<string | undefined> {
        usernameOrAlias = usernameOrAlias ?? this.usernameOrAlias;
        const authOrg = await this.getAuthOrg(usernameOrAlias);
        return authOrg ? authOrg.instanceUrl : undefined;
    }

    /**
     * Method to get the auth org data using a username or alias, or using connection username or alias, or using project auth org username or alias 
     * @param {string} [usernameOrAlias] Username or alias to get the auth org data
     * 
     * @returns {Promise<AuthOrg | undefined>} Return a promise with Auth Org data or undefined if not exists
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     */
    async getAuthOrg(usernameOrAlias?: string): Promise<AuthOrg | undefined> {
        usernameOrAlias = usernameOrAlias ?? this.usernameOrAlias;
        const authOrgs = await AuthInfo.listAllAuthorizations();
        let resultOrg: AuthOrg | undefined;
        if (authOrgs && authOrgs.length > 0) {
            const defaultUsername = usernameOrAlias || this.usernameOrAlias || ProjectUtils.getOrgAlias(Validator.validateFolderPath(this.projectFolder));
            if (defaultUsername) {
                for (const authOrg of authOrgs) {
                    if (defaultUsername.indexOf('@') !== -1) {
                        if (authOrg.username && authOrg.username.toLowerCase().trim() === defaultUsername.toLowerCase().trim()) {
                            resultOrg = new AuthOrg(authOrg);
                        }
                    } else {
                        const orgAlias = authOrg.aliases?.find((alias) => alias?.toLowerCase().trim() === defaultUsername.toLowerCase().trim());
                        if (orgAlias) {
                            resultOrg = new AuthOrg(authOrg);
                        }
                    }
                    const orgAlias = authOrg.aliases?.find((alias) => alias?.toLowerCase().trim() === defaultUsername.toLowerCase().trim());
                    if (!resultOrg && ((authOrg.username && authOrg.username.toLowerCase().trim() === defaultUsername.toLowerCase().trim()) || orgAlias)) {
                        resultOrg = new AuthOrg(authOrg);
                    }
                }
            }
            return resultOrg;
        } else {
            return undefined;
        }
    }

    /**
     * Method to list all auth org on the system
     * 
     * @returns {Promise<AuthOrg[]>} Return a promise with all authorized org in the system 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     */
    async listAuthOrgs(): Promise<AuthOrg[]> {
        const orgs = await AuthInfo.listAllAuthorizations();
        const authOrgs: AuthOrg[] = [];
        if (orgs) {
            for (const org of orgs) {
                authOrgs.push(new AuthOrg(org));
            }
        }
        return authOrgs;
    }

    /**
     * Method to execute a query to the connected org. Can return a Typed data (or use any to return any json)
     * @param {string} query Query to execute (Required)
     * @param {boolean} [useToolingApi] true to use Tooling API to execute the query
     * 
     * @returns {Promise<any[]>} Return a promise with the record list 
     * 
     * @throws {ConnectionException} If run other connection process when has one process running or Connection Return an error 
     * @throws {DataRequiredException} If required data is not provided
     * @throws {OSNotSupportedException} When run this processes with not supported operative system
     */
    async query<T>(query: string, useToolingApi?: boolean): Promise<T[]> {
        if (!this.usernameOrAlias) {
            throw new DataRequiredException('usernameOrAlias');
        }
        const username = await this.getAuthUsername();
        if (username) {
            const connection = await Connection.create({
                authInfo: await AuthInfo.create({ username: username })
            });
            const result = (useToolingApi) ? await connection.tooling.query(query) : await connection.query(query);
            if (!result.records || result.records.length <= 0) {
                return [];
            } else {
                return result.records as T[];
            }
        } else {
            throw new ConnectionException('Not authorized org found with Username or Alias ' + this.usernameOrAlias);
        }
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
    async listMetadataTypes(): Promise<MetadataDetail[]> {
        if (!this.usernameOrAlias) {
            throw new DataRequiredException('usernameOrAlias');
        }
        const username = await this.getAuthUsername();
        if (username) {
            const connection = await Connection.create({
                authInfo: await AuthInfo.create({ username: username })
            });
            const apiVersion = this.apiVersion ? ProjectUtils.getApiAsString(this.apiVersion) : undefined;
            const describeMetadata = await connection.metadata.describe(apiVersion);
            const metadataDetails = MetadataFactory.createMetadataDetails(describeMetadata.metadataObjects);
            return metadataDetails;
        } else {
            throw new ConnectionException('Not authorized org found with Username or Alias ' + this.usernameOrAlias);
        }
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
    async describeMetadataTypes(typesOrDetails?: string[] | MetadataDetail[], downloadAll?: boolean, groupGlobalActions?: boolean): Promise<{ [key: string]: MetadataType }> {
        resetProgress(this);
        if (!this.usernameOrAlias) {
            throw new DataRequiredException('usernameOrAlias');
        }
        const username = await this.getAuthUsername();
        if (username) {
            const connection = await Connection.create({
                authInfo: await AuthInfo.create({ username: username })
            });
            const metadataToProcess = getMetadataTypeNames(typesOrDetails);
            this._increment = calculateIncrement(metadataToProcess);
            callEvent(this, EVENT.PREPARE);
            let foldersByType;
            if (metadataToProcess.includes(MetadataTypes.REPORT) || metadataToProcess.includes(MetadataTypes.DASHBOARD) || metadataToProcess.includes(MetadataTypes.EMAIL_TEMPLATE) || metadataToProcess.includes(MetadataTypes.DOCUMENT)) {
                foldersByType = await getFoldersByType(this);
            }
            const metadata: { [key: string]: MetadataType } = {};
            const promises = [];
            for (const metadataType of metadataToProcess) {
                promises.push(downloadMetadataType(this, connection, metadataType, downloadAll, foldersByType, groupGlobalActions));
            }
            const result = await Promise.all(promises);
            for (const metadataType of result) {
                if (metadataType) {
                    metadata[metadataType.name] = metadataType;
                }
            }
            return metadata;
        } else {
            throw new ConnectionException('Not authorized org found with Username or Alias ' + this.usernameOrAlias);
        }
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
    async listSObjects(category?: string): Promise<string[]> {
        if (!this.usernameOrAlias) {
            throw new DataRequiredException('usernameOrAlias');
        }
        const username = await this.getAuthUsername();
        if (username) {
            const sObjects: string[] = [];
            const connection = await Connection.create({
                authInfo: await AuthInfo.create({ username: username })
            });
            const result = await connection.describeGlobal();
            if (result.sobjects) {
                for (const obj of result.sobjects) {
                    if (obj.queryable) {
                        if (!category || category.toLowerCase() === 'all') {
                            sObjects.push(obj.name);
                        } else if (!obj.custom && category.toLowerCase() === 'standard') {
                            sObjects.push(obj.name);
                        } else if (obj.custom && category.toLowerCase() === 'custom') {
                            sObjects.push(obj.name);
                        }
                    }
                }
            }
            return sObjects;
        } else {
            throw new ConnectionException('Not authorized org found with Username or Alias ' + this.usernameOrAlias);
        }
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
    async describeSObjects(sObjects: string | string[]): Promise<{ [key: string]: SObject }> {
        resetProgress(this);
        if (!this.usernameOrAlias) {
            throw new DataRequiredException('usernameOrAlias');
        }
        const username = await this.getAuthUsername();
        const connection = await Connection.create({
            authInfo: await AuthInfo.create({ username: username })
        });
        if (username) {
            sObjects = Utils.forceArray(sObjects);
            this._increment = calculateIncrement(sObjects);
            callEvent(this, EVENT.PREPARE);
            let resultObjects: { [key: string]: SObject } = {};
            const promises = [];
            for (const sObject of sObjects) {
                promises.push(downloadSObject(this, connection, sObject));
            }
            const result = await Promise.all(promises);
            for (const sObject of result) {
                if (sObject) {
                    resultObjects[sObject.name] = sObject;
                }
            }
            return resultObjects;
        } else {
            throw new ConnectionException('Not authorized org found with Username or Alias ' + this.usernameOrAlias);
        }
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
    async retrieve(useMetadataAPI: boolean, targetDir?: string, waitMinutes?: string | number): Promise<RetrieveResult> {
        startOperation(this);
        resetProgress(this);
        try {
            if (!this.usernameOrAlias) {
                throw new DataRequiredException('usernameOrAlias');
            }
            let process;
            const projectFolder = Validator.validateFolderPath(this.projectFolder);
            if (useMetadataAPI) {
                targetDir = Validator.validateFolderPath(targetDir);
                const packageFolder = Validator.validateFolderPath(this.packageFolder);
                if (this._useAuraHelperSFDX) {
                    process = ProcessFactory.mdapiRetrievePackageSFDX(this.usernameOrAlias, packageFolder, projectFolder, targetDir, this.apiVersion, waitMinutes);
                } else {
                    process = ProcessFactory.mdapiRetrievePackageSF(this.usernameOrAlias, packageFolder, projectFolder, targetDir, this.apiVersion, waitMinutes);
                }
            } else {
                const packageFile = Validator.validateFilePath(this.packageFile);
                if (this._useAuraHelperSFDX) {
                    process = ProcessFactory.sourceRetrievePackageSFDX(this.usernameOrAlias, packageFile, projectFolder, this.apiVersion, waitMinutes);
                } else {
                    process = ProcessFactory.sourceRetrievePackageSF(this.usernameOrAlias, packageFile, projectFolder, this.apiVersion, waitMinutes);
                }
            }
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            const status = new RetrieveResult(response.result);
            endOperation(this);
            return status;
        } catch (error) {
            endOperation(this);
            throw error;
        }
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
    async retrieveReport(retrieveId: string, targetDir: string): Promise<RetrieveStatus> {
        startOperation(this);
        resetProgress(this);
        try {
            if (!this.usernameOrAlias) {
                throw new DataRequiredException('usernameOrAlias');
            }
            this._allowConcurrence = true;
            targetDir = Validator.validateFolderPath(targetDir);
            let process = this._useAuraHelperSFDX ? ProcessFactory.mdapiRetrieveReportSFDX(this.usernameOrAlias, retrieveId, targetDir) : ProcessFactory.mdapiRetrieveReportSF(this.usernameOrAlias, retrieveId, targetDir);
            addProcess(this, process);
            try {
                const response = this.handleResponse(await ProcessHandler.runProcess(process));
                const status = new RetrieveStatus(response.result);
                this._allowConcurrence = false;
                endOperation(this);
                return status;
            } catch (error) {
                const err = error as Error;
                this._allowConcurrence = false;
                if (err?.message?.indexOf('Retrieve result has been deleted') !== -1) {
                    return new RetrieveStatus(retrieveId, 'Succeeded', true, true);
                }
                endOperation(this);
                throw error;
            }
        } catch (error) {
            this._allowConcurrence = false;
            endOperation(this);
            throw error;
        }
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
    async validateDeploy(testLevel?: string, runTests?: string | string[], useMetadataAPI?: boolean, waitMinutes?: string | number): Promise<DeployStatus> {
        startOperation(this);
        resetProgress(this);
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
                if (this._useAuraHelperSFDX) {
                    process = ProcessFactory.mdapiValidatePackageSFDX(this.usernameOrAlias, packageFolder, projectFolder, testLevel, runTests, this.apiVersion, waitMinutes);
                } else {
                    process = ProcessFactory.mdapiValidatePackageSF(this.usernameOrAlias, packageFolder, projectFolder, testLevel, runTests, this.apiVersion, waitMinutes);
                }
            } else {
                const packageFile = Validator.validateFilePath(this.packageFile);
                if (this._useAuraHelperSFDX) {
                    process = ProcessFactory.sourceValidatePackageSFDX(this.usernameOrAlias, packageFile, projectFolder, testLevel, runTests, this.apiVersion, waitMinutes);
                } else {
                    process = ProcessFactory.sourceValidatePackageSF(this.usernameOrAlias, packageFile, projectFolder, testLevel, runTests, this.apiVersion, waitMinutes);
                }
            }
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            const status = new DeployStatus(response.result);
            endOperation(this);
            return status;
        } catch (error) {
            endOperation(this);
            throw error;
        }
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
    async deployPackage(testLevel?: string, runTests?: string | string[], useMetadataAPI?: boolean, waitMinutes?: string | number): Promise<DeployStatus> {
        startOperation(this);
        resetProgress(this);
        try {
            if (!this.usernameOrAlias) {
                throw new DataRequiredException('usernameOrAlias');
            }
            const testsToRun = Utils.forceArray(runTests);
            let process;
            const projectFolder = Validator.validateFolderPath(this.projectFolder);
            if (useMetadataAPI) {
                const packageFolder = Validator.validateFolderPath(this.packageFolder);
                if (this._useAuraHelperSFDX) {
                    process = ProcessFactory.mdapiDeployPackageSFDX(this.usernameOrAlias, packageFolder, projectFolder, testLevel, (testsToRun) ? testsToRun.join(',') : undefined, this.apiVersion, waitMinutes);
                } else {
                    process = ProcessFactory.mdapiDeployPackageSF(this.usernameOrAlias, packageFolder, projectFolder, testLevel, (testsToRun) ? testsToRun.join(',') : undefined, this.apiVersion, waitMinutes);
                }
            } else {
                const packageFile = Validator.validateFilePath(this.packageFile);
                if (this._useAuraHelperSFDX) {
                    process = ProcessFactory.sourceDeployPackageSFDX(this.usernameOrAlias, packageFile, projectFolder, testLevel, (testsToRun) ? testsToRun.join(',') : undefined, this.apiVersion, waitMinutes);
                } else {
                    process = ProcessFactory.sourceDeployPackageSF(this.usernameOrAlias, packageFile, projectFolder, testLevel, (testsToRun) ? testsToRun.join(',') : undefined, this.apiVersion, waitMinutes);
                }
            }
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            const status = new DeployStatus(response.result);
            endOperation(this);
            return status;
        } catch (error) {
            endOperation(this);
            throw error;
        }
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
    async deploy(types: string | string[] | { [key: string]: MetadataType }, testLevel?: string, runTests?: string | string[], waitMinutes?: string | number): Promise<DeployStatus> {
        startOperation(this);
        resetProgress(this);
        try {
            if (!this.usernameOrAlias) {
                throw new DataRequiredException('usernameOrAlias');
            }
            const testsToRun = Utils.forceArray(runTests);
            let process;
            const projectFolder = Validator.validateFolderPath(this.projectFolder);
            if (this._useAuraHelperSFDX) {
                process = ProcessFactory.sourceDeploySFDX(this.usernameOrAlias, projectFolder, transformMetadataTypesIntoCSV(types), testLevel, (testsToRun) ? testsToRun.join(',') : undefined, this.apiVersion, waitMinutes);
            } else {
                process = ProcessFactory.sourceDeploySF(this.usernameOrAlias, projectFolder, transformMetadataTypesIntoCSV(types), testLevel, (testsToRun) ? testsToRun.join(',') : undefined, this.apiVersion, waitMinutes);
            }
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            const status = new DeployStatus(response.result);
            endOperation(this);
            return status;
        } catch (error) {
            endOperation(this);
            throw error;
        }
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
    async quickDeploy(deployId: string, useMetadataAPI?: boolean): Promise<DeployStatus> {
        startOperation(this);
        resetProgress(this);
        try {
            if (!this.usernameOrAlias) {
                throw new DataRequiredException('usernameOrAlias');
            }
            let process;
            const projectFolder = Validator.validateFolderPath(this.projectFolder);
            if (useMetadataAPI) {
                if (this._useAuraHelperSFDX) {
                    process = ProcessFactory.sourceQuickDeploySFDX(this.usernameOrAlias, deployId, projectFolder, this.apiVersion);
                } else {
                    process = ProcessFactory.mdapiQuickDeploySF(this.usernameOrAlias, deployId, projectFolder, this.apiVersion);
                }
            } else {
                if (this._useAuraHelperSFDX) {
                    process = ProcessFactory.sourceQuickDeploySFDX(this.usernameOrAlias, deployId, projectFolder, this.apiVersion);
                } else {
                    process = ProcessFactory.sourceQuickDeploySF(this.usernameOrAlias, deployId, projectFolder, this.apiVersion);
                }
            }
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            const status = new DeployStatus(response.result);
            endOperation(this);
            return status;
        } catch (error) {
            endOperation(this);
            throw error;
        }
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
    async deployReport(deployId: string, useMetadataAPI?: boolean, waitMinutes?: string | number): Promise<DeployStatus> {
        startOperation(this);
        resetProgress(this);
        try {
            if (!this.usernameOrAlias) {
                throw new DataRequiredException('usernameOrAlias');
            }
            this._allowConcurrence = true;
            let process;
            if (useMetadataAPI) {
                if (this._useAuraHelperSFDX) {
                    process = ProcessFactory.mdapiDeployReportSFDX(this.usernameOrAlias, deployId, waitMinutes);
                } else {
                    process = ProcessFactory.sourceDeployReportSF(this.usernameOrAlias, deployId, waitMinutes);
                }
            } else {
                if (this._useAuraHelperSFDX) {
                    process = ProcessFactory.sourceDeployReportSFDX(this.usernameOrAlias, deployId, waitMinutes);
                } else {
                    process = ProcessFactory.sourceDeployReportSF(this.usernameOrAlias, deployId, waitMinutes);
                }
            }
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            const status = new DeployStatus(response.result);
            this._allowConcurrence = false;
            endOperation(this);
            return status;
        } catch (error) {
            this._allowConcurrence = false;
            endOperation(this);
            throw error;
        }
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
    async cancelDeploy(deployId: string, useMetadataAPI?: boolean, waitMinutes?: string | number): Promise<DeployStatus> {
        startOperation(this);
        resetProgress(this);
        try {
            if (!this.usernameOrAlias) {
                throw new DataRequiredException('usernameOrAlias');
            }
            let process;
            if (useMetadataAPI) {
                if (this._useAuraHelperSFDX) {
                    process = ProcessFactory.mdapiCancelDeploySFDX(this.usernameOrAlias, deployId, waitMinutes);
                } else {
                    process = ProcessFactory.sourceCancelDeploySF(this.usernameOrAlias, deployId, waitMinutes);
                }
            } else {
                if (this._useAuraHelperSFDX) {
                    process = ProcessFactory.sourceCancelDeploySFDX(this.usernameOrAlias, deployId, waitMinutes);
                } else {
                    process = ProcessFactory.sourceCancelDeploySF(this.usernameOrAlias, deployId, waitMinutes);
                }
            }
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            const status = new DeployStatus(response.result);
            endOperation(this);
            return status;
        } catch (error) {
            endOperation(this);
            throw error;
        }
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
    async convertProjectToSFDX(targetDir: string): Promise<void> {
        startOperation(this);
        resetProgress(this);
        try {
            const packageFile = Validator.validateFilePath(this.packageFile);
            const packageFolder = Validator.validateFolderPath(this.packageFolder);
            targetDir = Validator.validateFolderPath(targetDir);
            let process = this._useAuraHelperSFDX ? ProcessFactory.convertMdApiToSFDX(packageFolder, packageFile, targetDir, this.apiVersion) : ProcessFactory.convertMdApiToSF(packageFolder, packageFile, targetDir, this.apiVersion);
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            endOperation(this);
            return;
        } catch (error) {
            endOperation(this);
            throw error;
        }
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
    async convertProjectToMetadataAPI(targetDir: string): Promise<void> {
        startOperation(this);
        resetProgress(this);
        try {
            const packageFile = Validator.validateFilePath(this.packageFile);
            const projectFolder = Validator.validateFolderPath(this.projectFolder);
            let process = this._useAuraHelperSFDX ? ProcessFactory.convertSFDXToMetadataAPI(packageFile, projectFolder, targetDir, this.apiVersion) : ProcessFactory.convertSFToMetadataAPI(packageFile, projectFolder, targetDir, this.apiVersion);
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            endOperation(this);
            return;
        } catch (error) {
            endOperation(this);
            throw error;
        }
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
    async createSFDXProject(projectName: string, projectFolder?: string, template?: string, withManifest?: boolean): Promise<SFDXProjectResult> {
        startOperation(this);
        resetProgress(this);
        try {
            let projectFolderRes = Validator.validateFolderPath(projectFolder || this.projectFolder);
            let process = this._useAuraHelperSFDX ? ProcessFactory.createSFDXProject(projectName, projectFolderRes, template, this.namespacePrefix, withManifest) : ProcessFactory.createSFProject(projectName, projectFolderRes, template, this.namespacePrefix, withManifest);
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            const result = new SFDXProjectResult(response.result);
            projectFolderRes = StrUtils.replace(projectFolderRes, '\\', '/');
            this.setProjectFolder(projectFolderRes + '/' + projectName);
            if (withManifest) {
                this.setPackageFolder(projectFolderRes + '/' + projectName + '/manifest');
                this.setPackageFile(projectFolderRes + '/' + projectName + '/manifest/package.xml');
            }
            endOperation(this);
            return result;
        } catch (error) {
            endOperation(this);
            throw error;
        }
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
    async setAuthOrg(usernameOrAlias?: string): Promise<void> {
        startOperation(this);
        resetProgress(this);
        try {
            const userNameRes = usernameOrAlias || this.usernameOrAlias;
            if (!userNameRes) {
                throw new DataRequiredException('usernameOrAlias');
            }
            const username = await this.getAuthUsername(userNameRes);
            if (username) {
                const projectFolder = Validator.validateFolderPath(this.projectFolder);
                const config = await Config.create({
                    rootFolder: projectFolder,
                    filename: 'sfdx-config.json',
                    isGlobal: false,
                });
                config.read();
                await Org.create({ aliasOrUsername: userNameRes });
                await config.set("defaultusername", userNameRes);
                this.usernameOrAlias = usernameOrAlias || this.usernameOrAlias;
                await config.write();
            } else {
                throw new ConnectionException('Not authorized org found with Username or Alias ' + this.usernameOrAlias);
            }
        } catch (error) {
            endOperation(this);
            const err = error as Error;
            throw new ConnectionException(err.message);
        }
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
    async exportTreeData(query: string, outputPath: string, prefix?: string): Promise<ExportTreeDataResult[]> {
        startOperation(this);
        resetProgress(this);
        try {
            if (!this.usernameOrAlias) {
                throw new DataRequiredException('usernameOrAlias');
            }
            outputPath = Validator.validateFolderPath(outputPath);
            let process = this._useAuraHelperSFDX ? ProcessFactory.exportTreeDataSFDX(this.usernameOrAlias, query, outputPath, prefix, this.apiVersion) : ProcessFactory.exportTreeDataSF(this.usernameOrAlias, query, outputPath, prefix, this.apiVersion);
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            endOperation(this);
            return processExportTreeDataOut(response);
        } catch (error) {
            endOperation(this);
            throw error;
        }
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
    async importTreeData(file: string): Promise<ImportTreeDataResponse> {
        startOperation(this);
        resetProgress(this);
        try {
            if (!this.usernameOrAlias) {
                throw new DataRequiredException('usernameOrAlias');
            }
            file = Validator.validateFilePath(file);
            let process = this._useAuraHelperSFDX ? ProcessFactory.importTreeDataSFDX(this.usernameOrAlias, file, this.apiVersion) : ProcessFactory.importTreeDataSF(this.usernameOrAlias, file, this.apiVersion);
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            endOperation(this);
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
                return { results: results, errors: undefined };
            } else {
                if (response.name === 'ERROR_HTTP_400') {
                    let errorResults = JSON.parse(response.message);
                    endOperation(this);
                    return { results: undefined, errors: errorResults.results };
                } else {
                    endOperation(this);
                    throw new Error(response.message);
                }
            }
        } catch (error) {
            endOperation(this);
            throw error;
        }
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
    async bulkDelete(csvfile: string, sObject: string): Promise<BulkStatus[]> {
        startOperation(this);
        resetProgress(this);
        try {
            if (!this.usernameOrAlias) {
                throw new DataRequiredException('usernameOrAlias');
            }
            csvfile = Validator.validateFilePath(csvfile);
            const projectFolder = Validator.validateFolderPath(this.projectFolder);
            let process = this._useAuraHelperSFDX ? ProcessFactory.bulkDeleteSFDX(this.usernameOrAlias, csvfile, sObject, projectFolder, this.apiVersion) : ProcessFactory.bulkDeleteSF(this.usernameOrAlias, csvfile, sObject, projectFolder, this.apiVersion);
            addProcess(this, process);
            const response = this.handleResponse(await ProcessHandler.runProcess(process));
            const bulkStatus = response.result?.map((result: any) => new BulkStatus(result));
            endOperation(this);
            return bulkStatus;
        } catch (error) {
            endOperation(this);
            throw error;
        }
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
    async executeApexAnonymous(scriptfile: string): Promise<string> {
        resetProgress(this);
        try {
            if (!this.usernameOrAlias) {
                throw new DataRequiredException('usernameOrAlias');
            }
            scriptfile = Validator.validateFilePath(scriptfile);
            const username = await this.getAuthUsername();
            if (username) {
                const connection = await Connection.create({
                    authInfo: await AuthInfo.create({ username: username })
                });
                if (!connection || !connection.accessToken) {
                    throw new ConnectionException('Connection not found');
                }
                const endpoint = connection.instanceUrl + '/services/Soap/s/' + this.apiVersion + '/' + connection.accessToken.split('!')[0];
                const request: HttpRequest = {
                    method: 'POST',
                    url: endpoint,
                    body: getApexExecutionSoapBody(connection.accessToken, FileReader.readFileSync(scriptfile)),
                    headers: { 'content-type': 'text/xml', 'soapaction': 'executeAnonymous' }
                };
                const response: any = await connection.request(request);
                const log = response['soapenv:Envelope']['soapenv:Header'].DebuggingInfo.debugLog;
                const result = response['soapenv:Envelope']['soapenv:Body'].executeAnonymousResponse.result;
                if (!result.success) {
                    if (typeof result.compileProblem === 'string') {
                        throw new ConnectionException(result.compileProblem + ' Line: ' + result.line + '; Column: ' + result.column);
                    } else if (typeof result.exceptionMessage === 'string') {
                        throw new ConnectionException(result.exceptionMessage + '. ' + ((typeof result.exceptionStackTrace === 'string') ? result.exceptionStackTrace : ''));
                    }
                }
                return log;
            } else {
                throw new ConnectionException('Not authorized org found with Username or Alias ' + this.usernameOrAlias);
            }
        } catch (error) {
            throw error;
        }
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
    async loadUserPermissions(tmpFolder: string): Promise<string[]> {
        startOperation(this);
        resetProgress(this);
        try {
            if (!this.packageFolder) {
                throw new DataRequiredException('packageFolder');
            }
            if (!this.usernameOrAlias) {
                throw new DataRequiredException('usernameOrAlias');
            }
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
            await this.createSFDXProject(PROJECT_NAME, tmpFolder, undefined, true);
            new PackageGenerator(this.apiVersion).setExplicit().createPackage(metadata, this.packageFolder);
            FileWriter.delete(this.projectFolder + '/.forceignore');
            await this.setAuthOrg(this.usernameOrAlias);
            callEvent(this, EVENT.RETRIEVE);
            await this.retrieve(false);
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
            return result;
        } catch (error) {
            this._allowConcurrence = false;
            endOperation(this);
            throw error;
        }
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
    async retrieveLocalSpecialTypes(tmpFolder: string, types?: string | { [key: string]: MetadataType }, compress?: boolean, sortOrder?: string): Promise<RetrieveResult> {
        startOperation(this);
        resetProgress(this);
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
            Object.keys(SpecialMetadata).forEach(function (key: string) {
                if (!typesToRetrieve || typesToRetrieve[key]) {
                    if (!dataToRetrieve.includes(key)) {
                        dataToRetrieve.push(key);
                    }
                    for (let child of SpecialMetadata[key as keyof SpecialMetadataDef]) {
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
            try {
                if (FileChecker.isExists(tmpFolder)) {
                    FileWriter.delete(tmpFolder);
                }
            } catch (error) {

            }
            FileWriter.createFolderSync(tmpFolder);
            callEvent(this, EVENT.CREATE_PROJECT);
            await this.createSFDXProject(PROJECT_NAME, tmpFolder, undefined, true);
            if (this.packageFolder) {
                new PackageGenerator(this.apiVersion).setExplicit().createPackage(metadata, this.packageFolder);
            }
            FileWriter.delete(this.projectFolder + '/.forceignore');
            await this.setAuthOrg(this.usernameOrAlias);
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
            return retrieveOut;
        } catch (error) {
            this._allowConcurrence = false;
            endOperation(this);
            throw error;
        }
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
    async retrieveMixedSpecialTypes(tmpFolder: string, types?: string | { [key: string]: MetadataType }, downloadAll?: boolean, compress?: boolean, sortOrder?: string): Promise<RetrieveResult> {
        startOperation(this);
        resetProgress(this);
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
                    for (let child of SpecialMetadata[key as keyof SpecialMetadataDef]) {
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
            try {
                if (FileChecker.isExists(tmpFolder)) {
                    FileWriter.delete(tmpFolder);
                }
            } catch (error) {

            }
            FileWriter.createFolderSync(tmpFolder);
            callEvent(this, EVENT.CREATE_PROJECT);
            await this.createSFDXProject(PROJECT_NAME, tmpFolder, undefined, true);
            if (this.packageFolder) {
                new PackageGenerator(this.apiVersion).setExplicit().createPackage(metadata, this.packageFolder);
            }
            FileWriter.delete(this.projectFolder + '/.forceignore');
            await this.setAuthOrg(this.usernameOrAlias);
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
            return retrieveOut;
        } catch (error) {
            this._allowConcurrence = false;
            endOperation(this);
            throw error;
        }
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
    async retrieveOrgSpecialTypes(tmpFolder: string, types?: string | { [key: string]: MetadataType }, downloadAll?: boolean, compress?: boolean, sortOrder?: string): Promise<RetrieveResult> {
        startOperation(this);
        resetProgress(this);
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
                    for (let child of SpecialMetadata[key as keyof SpecialMetadataDef]) {
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
            try {
                if (FileChecker.isExists(tmpFolder)) {
                    FileWriter.delete(tmpFolder);
                }
            } catch (error) {

            }
            FileWriter.createFolderSync(tmpFolder);
            callEvent(this, EVENT.CREATE_PROJECT);
            const createProjectOut = await this.createSFDXProject(PROJECT_NAME, tmpFolder, undefined, true);
            if (this.packageFolder) {
                const packageResult = new PackageGenerator(this.apiVersion).setExplicit().createPackage(metadataFromOrg, this.packageFolder);
            }
            FileWriter.delete(this.projectFolder + '/.forceignore');
            const setDefaultOrgOut = await this.setAuthOrg(this.usernameOrAlias);
            callEvent(this, EVENT.RETRIEVE);
            const retrieveOut = await this.retrieve(false);
            waitForFiles(this.projectFolder);
            callEvent(this, EVENT.COPY_DATA);
            if (typesToRetrieve) {
                copyMetadataFiles(this, originalProjectFolder, folderMetadataMap, typesToRetrieve, metadataFromOrg, compress, sortOrder);
            }
            //callProgressCalback(this, EVENT.CLEANING);
            //FileWriter.delete(tmpFolder);
            restoreOriginalProjectData(this, originalProjectFolder);
            this._allowConcurrence = false;
            endOperation(this);
            return retrieveOut;
        } catch (error) {
            this._allowConcurrence = false;
            endOperation(this);
            throw error;
        }
    }

    private handleResponse(response: any) {
        if (response !== undefined) {
            if (typeof response === 'object') {
                if (response.status !== 0) {
                    throw new ConnectionException(response.message);
                }
            }
        } else {
            response = {
                result: {}
            };
        }
        return response;
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

function restoreOriginalProjectData(connection: SFConnector, originalProjectFolder: string) {
    connection.setProjectFolder(originalProjectFolder);
    connection.setPackageFolder(originalProjectFolder + '/manifest');
    connection.setPackageFile(originalProjectFolder + '/manifest/package.xml');
}

function copyMetadataFiles(connection: SFConnector, targetProject: string, folderMetadataMap: { [key: string]: MetadataDetail }, types: { [key: string]: MetadataType }, metadataTypes: { [key: string]: MetadataType }, compress?: boolean, compressOrder?: string) {
    const path = connection.projectFolder;
    for (const folder of (Object.keys(folderMetadataMap))) {
        const metadataDetail = folderMetadataMap[folder];
        const metadataTypeName = metadataDetail.xmlName;
        if (!SpecialMetadata[metadataTypeName as keyof SpecialMetadataDef] || !metadataTypes[metadataTypeName]) {
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

function callEvent(connection: SFConnector, stage: string, entityName?: string, entityType?: string, entityItem?: string, data?: any) {
    connection._event.emit(stage, new ProgressStatus(connection._increment, connection._percentage, entityName, entityType, entityItem, data));
}

async function downloadMetadata(sfConnection: SFConnector, connection: Connection, metadataToDownload: string[], downloadAll?: boolean, foldersByType?: { [key: string]: any[] }, groupGlobalActions?: boolean): Promise<{ [key: string]: MetadataType }> {
    const metadata: { [key: string]: MetadataType } = {};
    for (const metadataTypeName of metadataToDownload) {
        try {
            if (sfConnection._abort) {
                return metadata;
            }
            callEvent(sfConnection, EVENT.BEFORE_DOWNLOAD_TYPE, metadataTypeName);
            if (metadataTypeName === MetadataTypes.REPORT || metadataTypeName === MetadataTypes.DASHBOARD || metadataTypeName === MetadataTypes.EMAIL_TEMPLATE || metadataTypeName === MetadataTypes.DOCUMENT) {
                const result = await connection.query(METADATA_QUERIES[metadataTypeName]);
                if (!result.records || result.records.length <= 0) {
                    continue;
                }
                const metadataType = MetadataFactory.createMetadataTypeFromRecords(metadataTypeName, result.records, foldersByType, sfConnection.namespacePrefix, downloadAll);
                sfConnection._percentage += sfConnection._increment;
                if (metadataType !== undefined && metadataType.hasChilds()) {
                    metadata[metadataTypeName] = metadataType;
                }
                callEvent(sfConnection, EVENT.AFTER_DOWNLOAD_TYPE, metadataTypeName, undefined, undefined, metadataType);
            } else if (NotIncludedMetadata[metadataTypeName as keyof NotIncludedMetadataDef]) {
                const metadataType = MetadataFactory.createNotIncludedMetadataType(metadataTypeName);
                sfConnection._percentage += sfConnection._increment;
                if (metadataType !== undefined && metadataType.hasChilds()) {
                    metadata[metadataTypeName] = metadataType;
                }
                callEvent(sfConnection, EVENT.AFTER_DOWNLOAD_TYPE, metadataTypeName, undefined, undefined, metadataType);
            } else if (sfConnection.usernameOrAlias) {
                const query: ListMetadataQuery = {
                    type: metadataTypeName,
                };
                const apiVersion = sfConnection.apiVersion !== undefined ? ProjectUtils.getApiAsString(sfConnection.apiVersion) : undefined;
                const result = await connection.metadata.list(query, apiVersion);
                const metadataType = MetadataFactory.createMetedataTypeFromResponse(metadataTypeName, result, sfConnection.namespacePrefix, downloadAll, groupGlobalActions);
                sfConnection._percentage += sfConnection._increment;
                if (metadataType !== undefined && metadataType.hasChilds()) {
                    metadata[metadataTypeName] = metadataType;
                }
                callEvent(sfConnection, EVENT.AFTER_DOWNLOAD_TYPE, metadataTypeName, undefined, undefined, metadataType);
            }
        } catch (error) {
            const err = error as Error;
            callEvent(sfConnection, EVENT.DOWNLOAD_ERROR, metadataTypeName, undefined, undefined, err.message);
        }
    }
    return metadata;
}

async function downloadMetadataType(sfConnection: SFConnector, connection: Connection, metadataTypeName: string, downloadAll?: boolean, foldersByType?: { [key: string]: any[] }, groupGlobalActions?: boolean) {
    let metadataTypeResult: MetadataType | undefined;
    if (sfConnection._abort) {
        return undefined;
    }
    callEvent(sfConnection, EVENT.BEFORE_DOWNLOAD_TYPE, metadataTypeName);
    if (metadataTypeName === MetadataTypes.REPORT || metadataTypeName === MetadataTypes.DASHBOARD || metadataTypeName === MetadataTypes.EMAIL_TEMPLATE || metadataTypeName === MetadataTypes.DOCUMENT) {
        const result = await connection.query(METADATA_QUERIES[metadataTypeName]);
        if (!result.records || result.records.length <= 0) {
            return undefined;
        }
        const metadataType = MetadataFactory.createMetadataTypeFromRecords(metadataTypeName, result.records, foldersByType, sfConnection.namespacePrefix, downloadAll);
        sfConnection._percentage += sfConnection._increment;
        if (metadataType !== undefined && metadataType.hasChilds()) {
            metadataTypeResult = metadataType;
        }
        callEvent(sfConnection, EVENT.AFTER_DOWNLOAD_TYPE, metadataTypeName, undefined, undefined, metadataType);
    } else if (NotIncludedMetadata[metadataTypeName as keyof NotIncludedMetadataDef]) {
        const metadataType = MetadataFactory.createNotIncludedMetadataType(metadataTypeName);
        sfConnection._percentage += sfConnection._increment;
        if (metadataType !== undefined && metadataType.hasChilds()) {
            metadataTypeResult = metadataType;
        }
        callEvent(sfConnection, EVENT.AFTER_DOWNLOAD_TYPE, metadataTypeName, undefined, undefined, metadataType);
    } else if (sfConnection.usernameOrAlias) {
        const query: ListMetadataQuery = {
            type: metadataTypeName,
        };
        const apiVersion = sfConnection.apiVersion !== undefined ? ProjectUtils.getApiAsString(sfConnection.apiVersion) : undefined;
        const result = await connection.metadata.list(query, apiVersion);
        const metadataType = MetadataFactory.createMetedataTypeFromResponse(metadataTypeName, result, sfConnection.namespacePrefix, downloadAll, groupGlobalActions);
        sfConnection._percentage += sfConnection._increment;
        if (metadataType !== undefined && metadataType.hasChilds()) {
            metadataTypeResult = metadataType;
        }
        callEvent(sfConnection, EVENT.AFTER_DOWNLOAD_TYPE, metadataTypeName, undefined, undefined, metadataType);
    }
    return metadataTypeResult;
}

function downloadSObjectsData(sfConnection: SFConnector, connection: Connection, sObjects: string[]): Promise<{ [key: string]: SObject }> {
    return new Promise<{ [key: string]: SObject }>(async (resolve, reject) => {
        try {

            const sObjectsResult: { [key: string]: SObject } = {};
            for (const sObject of sObjects) {
                try {
                    if (sfConnection._abort) {
                        resolve(sObjectsResult);
                        return;
                    }
                    callEvent(sfConnection, EVENT.BEFORE_DOWNLOAD_OBJECT, MetadataTypes.CUSTOM_OBJECT, sObject);
                    const result = await connection.describe(sObject);
                    sfConnection._percentage += sfConnection._increment;
                    if (result) {
                        sObjectsResult[sObject] = new SObject(result);
                    }
                    callEvent(sfConnection, EVENT.AFTER_DOWNLOAD_OBJECT, MetadataTypes.CUSTOM_OBJECT, sObject, undefined, sObjectsResult[sObject]);
                } catch (error) {
                    const err = error as Error;
                    callEvent(sfConnection, EVENT.DOWNLOAD_ERROR, sObject, undefined, undefined, err.message);
                }
            }
            resolve(sObjectsResult);
        } catch (error) {
            reject(error);
        }
    });
}

async function downloadSObject(sfConnection: SFConnector, connection: Connection, sObject: string) {
    try {
        if (sfConnection._abort) {
            return undefined;
        }
        callEvent(sfConnection, EVENT.BEFORE_DOWNLOAD_OBJECT, MetadataTypes.CUSTOM_OBJECT, sObject);
        const result = await connection.describe(sObject);
        sfConnection._percentage += sfConnection._increment;
        const object = new SObject(result);
        callEvent(sfConnection, EVENT.AFTER_DOWNLOAD_OBJECT, MetadataTypes.CUSTOM_OBJECT, sObject, undefined, object);
        return object;
    } catch (error) {
        const err = error as Error;
        callEvent(sfConnection, EVENT.DOWNLOAD_ERROR, sObject, undefined, undefined, err.message);
        return undefined;
    }
}

function getBatches(connection: SFConnector, objects: string[]) {
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
    if (batch) {
        batches.push(batch);
    }
    return batches;
}

function calculateIncrement(objects: string[]) {
    return MathUtils.round(100 / objects.length, 2);
}

function getMetadataTypeNames(typesOrDetails?: string[] | MetadataDetail[]) {
    const result = [];
    if (typesOrDetails !== undefined) {
        const objectsToProcess = Utils.forceArray<any>(typesOrDetails);
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

function getFoldersByType(connection: SFConnector): Promise<{ [key: string]: any[] }> {
    return new Promise((resolve, reject) => {
        const query = 'Select Id, Name, DeveloperName, NamespacePrefix, Type FROM Folder';
        try {
            if (connection._abort) {
                connection._allowConcurrence = false;
                endOperation(connection);
                resolve({});
                return;
            }
            connection.query<any>(query).then((records) => {
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

function resetProgress(connection: SFConnector): void {
    connection._percentage = 0;
    connection._increment = 0;
}

function killProcesses(connection: SFConnector): void {
    if (connection._processes && Object.keys(connection._processes).length > 0) {
        for (let process of Object.keys(connection._processes)) {
            killProcess(connection, connection._processes[process]);
        }
    }
}

function killProcess(connection: SFConnector, process: Process): void {
    process.kill();
    delete connection._processes[process.name];
}

function startOperation(connection: SFConnector): void {
    if (!connection._allowConcurrence) {
        if (connection._inProgress) {
            throw new OperationNotAllowedException('Connection in use. Abort the current operation to execute other.');
        }
        connection._abort = false;
        connection._inProgress = true;
        connection._processes = {};
    }
}

function endOperation(connection: SFConnector): void {
    if (!connection._allowConcurrence) {
        connection._inProgress = false;
        connection._processes = {};
    }
}

function addProcess(connection: SFConnector, process: Process): void {
    if (connection._processes === undefined) {
        connection._processes = {};
    }
    connection._processes[process.name] = process;
}

function getApexExecutionSoapBody(sessionId: string, body: string) {
    return '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:apex="http://soap.sforce.com/2006/08/apex">' +
        '<soapenv:Header>' +
        '<apex:DebuggingHeader><apex:debugLevel>DEBUGONLY</apex:debugLevel></apex:DebuggingHeader>' +
        '<apex:SessionHeader>' +
        '<apex:sessionId>' + sessionId + '</apex:sessionId>' +
        '</apex:SessionHeader>' +
        '</soapenv:Header>' +
        '<soapenv:Body>' +
        '<apex:executeAnonymous>' +
        '<apex:String>' + escapeXML(body) + '</apex:String>' +
        '</apex:executeAnonymous>' +
        '</soapenv:Body>' +
        '</soapenv:Envelope>';
}

function escapeXML(body: string): string {
    return body.replace(/[<>&'"]/g, character => {
        return xmlChars[character];
    });
}

interface BatchData {
    batchId: string;
    records: string[];
    completed: boolean;
}