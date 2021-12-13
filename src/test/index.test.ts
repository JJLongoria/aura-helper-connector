import { FileChecker, FileWriter, MetadataItem, MetadataObject, MetadataType, MetadataTypes } from "@aurahelper/core";
import { SFConnector } from '../index';

describe('Testing index.js', () => {
    test('Testing query()', async () => {
        const connection = new SFConnector('MyOrg', '50.0');
        connection.onAfterDownloadType(() => {

        });
        connection.onBeforeDownloadType(() => {

        });
        connection.onAfterDownloadSObject(() => {

        });
        connection.onBeforeDownloadSObject(() => {

        });
        connection.onCompressFile(() => {

        });
        connection.onCopyData(() => {

        });
        connection.onCopyFile(() => {

        });
        connection.onCreateProject(() => {

        });
        connection.onLoadingLocal(() => {

        });
        connection.onLoadingOrg(() => {

        });
        connection.onPrepare(() => {

        });
        connection.onProcess(() => {

        });
        connection.onRetrieve(() => {

        });
        connection.onErrorDownload(() => {

        });
        connection.setUsernameOrAlias('MyOrg');
        connection.setSingleThread();
        connection.setApiVersion('50.0');
        connection.setProjectFolder('./');
        const records = await connection.query('Select Id from Account Limit 1');
        expect(records.length).toBeGreaterThan(0);
    }, 300000);
    test('Testing query() with Error', async () => {
        const connection = new SFConnector('MyOrg', '50');

        connection.setUsernameOrAlias('MyOrg');
        connection.setSingleThread();
        try {
            const records = await connection.query('Select Id from Acc', false);
        } catch (error) {
            const err = error as Error;
            expect(err.message).toMatch('sObject type \'Acc\' is not supported');
        }
    }, 300000);
    test('Testing listMetadataTypes()', async () => {
        console.time('listMetadataTypes');
        const connection = new SFConnector('MyOrg', '50.0');
        connection.setUsernameOrAlias('MyOrg');
        connection.setSingleThread();
        connection.setApiVersion('50.0');
        connection.setProjectFolder('./');
        connection.setNamespacePrefix('acn');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const metadataTypes = await connection.listMetadataTypes();
        expect(metadataTypes.length).toBeGreaterThan(0);
        console.timeEnd('listMetadataTypes');
    }, 300000);
    test('Testing listMetadataTypes() with Error', async () => {
        const connection = new SFConnector('MyOrg', '50');

        connection.setUsernameOrAlias('MyOrg');
        connection.setSingleThread();
        try {
            const metadataTypes = await connection.listMetadataTypes();
        } catch (error) {
            const err = error as Error;
            expect(err.message).toMatch('The API version \'50\' is not valid.  Must be in the format, \'i.0\'');
        }
    }, 300000);
    test('Testing describeMetadataTypes() Download All', async () => {
        const connection = new SFConnector('MyOrg', '50.0');
        connection.setMultiThread();
        const metadata = await connection.describeMetadataTypes(['Report', 'Dashboard', 'EmailTemplate', 'Document', 'CustomObject', 'CustomField', 'Flow', 'Layout', 'StandardValueSet'], true);
        expect(metadata['CustomObject'].name).toMatch('CustomObject');
    }, 300000);
    test('Testing describeMetadataTypes() Download All single thread', async () => {
        console.time('describeMetadataTypesSingle');
        const connection = new SFConnector('MyOrg', '50.0');
        connection.setSingleThread();
        const metadata = await connection.describeMetadataTypes(['Report', 'Dashboard', 'EmailTemplate', 'Document', 'CustomObject', 'CustomField', 'Flow', 'Layout', 'StandardValueSet'], true);
        expect(metadata['CustomObject'].name).toMatch('CustomObject');
        console.timeEnd('describeMetadataTypesSingle');
    }, 300000);
    test('Testing describeMetadataTypes() with all types Download All', async () => {
        console.time('describeMetadataTypesAll');
        const connection = new SFConnector('MyOrg', '50.0');
        connection.setMultiThread();
        const metadataTypes = await connection.listMetadataTypes();
        const metadata = await connection.describeMetadataTypes(metadataTypes, true);
        expect(metadata['CustomObject'].name).toMatch('CustomObject');
        console.timeEnd('describeMetadataTypesAll');
    }, 300000);
    test('Testing describeMetadataTypes() with all types Download All single thread', async () => {
        console.time('describeMetadataTypesAllSingle');
        const connection = new SFConnector('MyOrg', '50.0');
        connection.setSingleThread();
        const metadataTypes = await connection.listMetadataTypes();
        const metadata = await connection.describeMetadataTypes(metadataTypes, true);
        expect(metadata['CustomObject'].name).toMatch('CustomObject');
        console.timeEnd('describeMetadataTypesAllSingle');
    }, 3000000);
    test('Testing describeMetadataTypes() Download Only Org Namespace', async () => {
        const connection = new SFConnector('MyOrg', '50.0', undefined, 'acn');
        connection.setMultiThread();
        const metadata = await connection.describeMetadataTypes(['Report', 'Dashboard', 'EmailTemplate', 'Document', 'CustomObject', 'CustomField', 'Flow', 'Layout'], false);
        expect(metadata['CustomField'].name).toMatch('CustomField');
    }, 300000);
    test('Testing abortConnection()', async () => {
        const objects = ['Report', 'Dashboard', 'EmailTemplate', 'Document', 'CustomObject', 'CustomField', 'Flow', 'Layout', 'QuickAction', 'CompactLayout', 'RecordType', 'WebLink', 'CustomTab', 'ApexClass', 'ApexTrigger', 'ApexPage'];
        const connection = new SFConnector('MyOrg', '50.0', undefined, 'acn');
        connection.onAbort(() => {
            console.log("aborted");
        });
        connection.onAfterDownloadType(() => {
            connection.abortConnection();
        });
        connection.setSingleThread();
        const metadata = await connection.describeMetadataTypes(objects, true);
        expect(Object.keys(metadata).length).toBeLessThan(objects.length);
    }, 300000);
    test('Testing describeMetadataTypes() Entire Metadata', async () => {
        const connection = new SFConnector('MyOrg', '50.0');


        connection.setUsernameOrAlias('MyOrg');
        connection.setSingleThread();
        connection.setApiVersion('50.0');
        connection.setProjectFolder('./');
        const metadataTypes = await connection.listMetadataTypes();
        connection.setMultiThread();
        const metadata = await connection.describeMetadataTypes(metadataTypes, true);
        expect(metadata['CustomObject'].name).toMatch('CustomObject');
    }, 300000);
    test('Testing listAuthOrgs()', async () => {
        const connection = new SFConnector('MyOrg', '50.0', undefined, 'acn');


        connection.setMultiThread();
        const authOrgs = await connection.listAuthOrgs();
        expect(authOrgs.length).toBeGreaterThan(0);
    }, 300000);
    test('Testing listSObjects()', async () => {
        console.time('listSObjects');
        const connection = new SFConnector('MyOrg', '50.0', undefined, 'acn');

        connection.setMultiThread();
        const sObjects = await connection.listSObjects();
        expect(sObjects.length).toBeGreaterThan(0);
        console.timeEnd('listSObjects');
    }, 300000);
    test('Testing listSObjects() custom', async () => {
        console.time('listSObjectsCustom');
        const connection = new SFConnector('MyOrg', '50.0', undefined, 'acn');

        connection.setMultiThread();
        const sObjects = await connection.listSObjects('custom');
        expect(sObjects.length).toBeGreaterThan(0);
        console.timeEnd('listSObjectsCustom');
    }, 300000);
    test('Testing listSObjects() standard', async () => {
        console.time('listSObjectsStandard');
        const connection = new SFConnector('MyOrg', '50.0', undefined, 'acn');

        connection.setMultiThread();
        const sObjects = await connection.listSObjects('standard');
        expect(sObjects.length).toBeGreaterThan(0);
        console.timeEnd('listSObjectsStandard');
    }, 300000);
    test('Testing listSObjects() With Error', async () => {
        const connection = new SFConnector('MyOrg', '50', undefined, 'acn');


        connection.setMultiThread();
        try {
            await connection.listSObjects();
        } catch (error) {
            const err = error as Error;
            expect(err.message).toEqual('The API version \'50\' is not valid.  Must be in the format, \'i.0\'');
        }
    }, 300000);
    test('Testing describeSObjects()', async () => {
        console.time('describeSObjects');
        const connection = new SFConnector('MyOrg', '50.0', undefined, 'acn');
        connection.setMultiThread();
        const sObjects = await connection.describeSObjects(['Account', 'Case', 'Opportunity', 'Lead', 'UserRole', 'ApexClass']);
        expect(sObjects['Account'].name).toEqual('Account');
        console.timeEnd('describeSObjects');
    }, 300000);
    test('Testing describeSObjects custom()', async () => {
        console.time('describeSObjects');
        const connection = new SFConnector('MyOrg', '50.0', undefined, 'acn');
        connection.setMultiThread();
        const sObjectList = await connection.listSObjects('custom');
        const sObjects = await connection.describeSObjects(sObjectList);
        expect(sObjects['acn__ALMA_Record__c'].name).toEqual('acn__ALMA_Record__c');
        console.timeEnd('describeSObjects');
    }, 300000);
    test('Testing describeSObjects standard()', async () => {
        console.time('describeSObjects');
        const connection = new SFConnector('MyOrg', '50.0', undefined, 'acn');
        connection.setMultiThread();
        const sObjectList = await connection.listSObjects('standard');
        const sObjects = await connection.describeSObjects(sObjectList);
        expect(sObjects['Account'].name).toEqual('Account');
        console.timeEnd('describeSObjects');
    }, 300000);
    test('Testing describeSObjects all()', async () => {
        console.time('describeSObjects');
        const connection = new SFConnector('MyOrg', '50.0', undefined, 'acn');
        connection.setMultiThread();
        const sObjectList = await connection.listSObjects('all');
        const sObjects = await connection.describeSObjects(sObjectList);
        expect(sObjects['Account'].name).toEqual('Account');
        expect(sObjects['acn__ALMA_Record__c'].name).toEqual('acn__ALMA_Record__c');
        console.timeEnd('describeSObjects');
    }, 300000);
    test('Testing retrieve()', async () => {
        const connection = new SFConnector('MyOrg', '50.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const status = await connection.retrieve(false);
    }, 300000);
    test('Testing retrieve() With Error', async () => {
        const connection = new SFConnector('MyOrg', '50.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xl');
        try {
            await connection.retrieve(false);
        } catch (error) {
            const err = error as Error;
            expect(err.message).toMatch('does not exists or not have access to it');
        }

    }, 300000);
    test('Testing validateDeploy()', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        await connection.validateDeploy();
    }, 300000);
    test('Testing validateDeploy() with Error', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xl');
        try {
            await connection.validateDeploy();
        } catch (error) {
            const err = error as Error;
            expect(err.message).toMatch('does not exists or not have access to it');
        }
    }, 300000);
    test('Testing deploy()', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        await connection.deployPackage();
    }, 300000);
    test('Testing deploy() with Error', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xl');
        try {
            await connection.deployPackage();
        } catch (error) {
            const err = error as Error;
            expect(err.message).toMatch('does not exists or not have access to it');
        }
    }, 300000);
    test('Testing quickDeploy()', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const status = await connection.validateDeploy('RunSpecifiedTests', ['SiteRegisterControllerTest', 'MyProfilePageControllerTest'], false, 33);
        try {
            await connection.quickDeploy(status.id);
        } catch (error) {
            const err = error as Error;
            expect(err.message).toMatch('Unexpected element {http://soap.sforce.com/2006/04/metadata}id during simple type deserialization');
        }
    }, 300000);
    test('Testing quickDeploy() with Error', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        try {
            await connection.quickDeploy('45698745a');
        } catch (error) {
            const err = error as Error;
            expect(err.message).toMatch('The flag value "45698745a" is not in the correct format for "id." Must be a 15- or 18-char string in the format "00Dxxxxxxxxxxxx", where "00D" is a valid sObject prefix');
        }
    }, 300000);
    test('Testing deployReport()', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const status = await connection.validateDeploy();
        const reportStatus = await connection.deployReport(status.id);
        expect(reportStatus.status).toMatch('Succeeded');
    }, 300000);
    test('Testing deployReport() with Error', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        try {
            await connection.deployReport('45698745a');
        } catch (error) {
            const err = error as Error;
            expect(err.message).toMatch('The provided ID is invalid, deploy IDs must start with \'0Af\'');
        }
    }, 300000);
    test('Testing cancelDeploy() with Error', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        try {
            await connection.cancelDeploy('45698745a');
        } catch (error) {
            const err = error as Error;
            expect(err.message).toMatch('The provided ID is invalid, deploy IDs must start with \'0Af\'');
        }
    }, 300000);
    test('Testing createSFDXProject()', async () => {
        if (FileChecker.isExists('./src/test/assets/SFDXProject/newProject')) {
            FileWriter.delete('./src/test/assets/SFDXProject/newProject');
        }
        FileWriter.createFolderSync('./src/test/assets/SFDXProject/newProject');
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        const sfdxProject = await connection.createSFDXProject('MyOrg', './src/test/assets/SFDXProject/newProject', 'standard', true);
        expect(sfdxProject.outputDir).toMatch('\\test\\assets\\SFDXProject\\newProject');
        expect(connection.projectFolder).toMatch('/test/assets/SFDXProject/newProject/MyOrg');
        expect(connection.packageFolder).toMatch('/test/assets/SFDXProject/newProject/MyOrg/manifest');
        expect(connection.packageFile).toMatch('/test/assets/SFDXProject/newProject/MyOrg/manifest/package.xml');
    }, 300000);
    test('Testing createSFDXProject() with error', async () => {
        if (FileChecker.isExists('./src/test/assets/SFDXProject/newProject')) {
            FileWriter.delete('./src/test/assets/SFDXProject/newProject');
        }
        FileWriter.createFolderSync('./src/test/assets/SFDXProject/newProject');
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        await connection.createSFDXProject('MyOrg', './src/test/assets/SFDXProject/newProject', 'standard', true);
    }, 300000);
    test('Testing setAuthOrg()', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/newProject/MyOrg');
        connection.setPackageFolder('./src/test/assets/SFDXProject/newProject/MyOrg/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/newProject/MyOrg/manifest/package.xml');
        await connection.setAuthOrg('MyOrg');
        expect(connection.usernameOrAlias).toMatch('MyOrg');
    }, 300000);
    test('Testing setAuthOrg() with Error', async () => {
        const connection = new SFConnector(undefined, '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./src/test/assets/SFDXProject/newProject');
        connection.setPackageFolder('./src/test/assets/SFDXProject/newProject/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/newProject/manifest/package.xml');
        try {
            await connection.setAuthOrg('MyOrg');
        } catch (error) {
            expect(error.message).toMatch('This directory does not contain a valid Salesforce DX project');
        }
    }, 300000);
    test('Testing exportTreeData()', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./');
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        await connection.exportTreeData('Select Id, Name from Account', './src/test/assets/exported', 'accounts');
    }, 300000);
    test('Testing exportTreeData() with error', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./');
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        try {
            await connection.exportTreeData('Select Id, Name from acc', './src/test/assets/exported', 'accounts');
        } catch (error) {
            expect(error).toMatch('sObject type \'acc\' is not supported');
        }
    }, 300000);
    test('Testing importTreeData() and deleteBulk()', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./');
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const results = await connection.importTreeData('./src/test/assets/exported/accounts-Accounts.json');
        if (results.results) {
            let ids = [];
            for (const result of results.results) {
                ids.push(result.id);
            }
            let csvContent = 'Id\n' + ids.join('\n');
            let csvFile = './src/test/assets/exported/deleteFile.csv';
            FileWriter.createFileSync(csvFile, csvContent);
            const status = await connection.bulkDelete(csvFile, 'Account');
            expect(status[0].state).toMatch('Queued');
        }
    }, 300000);
    test('Testing deleteBulk() with Error', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setProjectFolder('./');
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        try {
            await connection.bulkDelete('./src/test/csvFile.csv', 'Account');
        } catch (error) {
            const err = error as Error;
            expect(err.message).toMatch('does not exist');
        }
    }, 300000);
    test('Testing executeApexAnonymous()', async () => {
        const connection = new SFConnector('MyOrg', '51.0', './src/test/assets/SFDXProject/MyOrg/PROD', 'acn');


        connection.setMultiThread();
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const log = await connection.executeApexAnonymous('./src/test/assets/apexScript.apex');
        expect(log).toMatch('Compiled successfully.');
    }, 300000);
    test('Testing getAuthUsername()', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const username = await connection.getAuthUsername();
        expect(username).toMatch('juan.longoria.lopez@accenture.com');
    }, 300000);
    test('Testing getAuthUsername() from project', async () => {
        const connection = new SFConnector(undefined, '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const username = await connection.getAuthUsername();
        expect(username).toMatch('juan.longoria.lopez@accenture.com');
    }, 300000);
    test('Testing getServerInstance()', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const instance = await connection.getServerInstance();
        expect(instance).toMatch('jjlongoria');
    }, 300000);
    test('Testing getServerInstance With Other username()', async () => {
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const instance = await connection.getServerInstance('MyOrg');
        expect(instance).toMatch('jjlongoria');
    }, 300000);
    test('Testing loadUserPermissions()', async () => {
        FileWriter.createFolderSync('./src/test/assets/tmpFolder');
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const permissions = await connection.loadUserPermissions('./src/test/assets/tmpFolder');
        expect(permissions.length).toBeGreaterThan(0);
    }, 300000);
    test('Testing retrieveLocalSpecialTypes()', async () => {
        FileWriter.createFolderSync('./src/test/assets/tmpFolder');
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const types: { [key: string]: MetadataType } = {};
        types[MetadataTypes.PROFILE] = new MetadataType(MetadataTypes.PROFILE, false);
        types[MetadataTypes.PROFILE].addChild(new MetadataObject('Admin', true));
        types[MetadataTypes.CUSTOM_OBJECT] = new MetadataType(MetadataTypes.CUSTOM_OBJECT, false);
        types[MetadataTypes.CUSTOM_OBJECT].addChild(new MetadataObject('ALMA_Record__c', true));
        types[MetadataTypes.RECORD_TYPE] = new MetadataType(MetadataTypes.RECORD_TYPE, false);
        types[MetadataTypes.RECORD_TYPE].addChild(new MetadataObject('Transform_Node__c', false));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c')!.addChild(new MetadataItem('Else_If', true));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c')!.addChild(new MetadataItem('Else', true));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c')!.addChild(new MetadataItem('Expresion', true));
        await connection.retrieveLocalSpecialTypes('./src/test/assets/tmpFolder', types, true);
    }, 300000);
    test('Testing retrieveLocalSpecialTypes() all', async () => {
        FileWriter.createFolderSync('./src/test/assets/tmpFolder');
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        await connection.retrieveLocalSpecialTypes('./src/test/assets/tmpFolder', undefined, true);
    }, 300000);
    test('Testing retrieveMixedSpecialTypes()', async () => {
        FileWriter.createFolderSync('./src/test/assets/tmpFolder');
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const types: { [key: string]: MetadataType } = {};
        types[MetadataTypes.PROFILE] = new MetadataType(MetadataTypes.PROFILE, false);
        types[MetadataTypes.PROFILE].addChild(new MetadataObject('Admin', true));
        types[MetadataTypes.CUSTOM_OBJECT] = new MetadataType(MetadataTypes.CUSTOM_OBJECT, false);
        types[MetadataTypes.CUSTOM_OBJECT].addChild(new MetadataObject('ALMA_Record__c', true));
        types[MetadataTypes.RECORD_TYPE] = new MetadataType(MetadataTypes.RECORD_TYPE, false);
        types[MetadataTypes.RECORD_TYPE].addChild(new MetadataObject('Transform_Node__c', false));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c')!.addChild(new MetadataItem('Else_If', true));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c')!.addChild(new MetadataItem('Else', true));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c')!.addChild(new MetadataItem('Expresion', true));
        await connection.retrieveMixedSpecialTypes('./src/test/assets/tmpFolder', types, false, true);
    }, 300000);
    test('Testing retrieveMixedSpecialTypes() all', async () => {
        FileWriter.createFolderSync('./src/test/assets/tmpFolder');
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        await connection.retrieveMixedSpecialTypes('./src/test/assets/tmpFolder', undefined, false, true);
    }, 300000);
    test('Testing retrieveOrgSpecialTypes()', async () => {
        FileWriter.createFolderSync('./src/test/assets/tmpFolder');
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const types: { [key: string]: MetadataType } = {};
        types[MetadataTypes.PROFILE] = new MetadataType(MetadataTypes.PROFILE, false);
        types[MetadataTypes.PROFILE].addChild(new MetadataObject('Admin', true));
        types[MetadataTypes.CUSTOM_OBJECT] = new MetadataType(MetadataTypes.CUSTOM_OBJECT, false);
        types[MetadataTypes.CUSTOM_OBJECT].addChild(new MetadataObject('ALMA_Record__c', true));
        types[MetadataTypes.RECORD_TYPE] = new MetadataType(MetadataTypes.RECORD_TYPE, false);
        types[MetadataTypes.RECORD_TYPE].addChild(new MetadataObject('Transform_Node__c', false));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c')!.addChild(new MetadataItem('Else_If', true));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c')!.addChild(new MetadataItem('Else', true));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c')!.addChild(new MetadataItem('Expresion', true));
        await connection.retrieveOrgSpecialTypes('./src/test/assets/tmpFolder', types, false, true);
    }, 300000);
    test('Testing retrieveOrgSpecialTypes() All', async () => {
        FileWriter.createFolderSync('./src/test/assets/tmpFolder2');
        const connection = new SFConnector('MyOrg', '51.0', undefined, 'acn');


        connection.setMultiThread();
        connection.setNamespacePrefix('acn');
        connection.setProjectFolder('./src/test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./src/test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./src/test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        await connection.retrieveOrgSpecialTypes('./src/test/assets/tmpFolder', undefined, false, true);
    }, 300000);
});