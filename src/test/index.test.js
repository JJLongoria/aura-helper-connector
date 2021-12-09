const Connection = require('../index');
const { FileWriter, FileReader, FileChecker } = require('@aurahelper/core').FileSystem;
const { MetadataType, MetadataObject, MetadataItem } = require('@aurahelper/core').Types;
const { MetadataTypes } = require('@aurahelper/core').Values;

describe('Testing index.js', () => {
    test('Testing query()', async (done) => {
        const connection = new Connection('MyOrg', '50.0');
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
        
        connection.setUsernameOrAlias('MyOrg');
        connection.setSingleThread();
        connection.setApiVersion('50.0');
        connection.setProjectFolder('./');
        connection.query('Select Id from Account Limit 1').then((receord) => {
            expect(receord.length).toBeGreaterThan(0);
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing query() with Error', async (done) => {
        const connection = new Connection('MyOrg', '50');
        
        connection.setUsernameOrAlias('MyOrg');
        connection.setSingleThread();
        connection.query('Select Id from Acc', false).then((receord) => {
            expect(receord.length).toEqual(0);
            done();
        }).catch((error) => {
            expect(error.message).toMatch('sObject type \'Acc\' is not supported');
            done();
        });
    }, 300000);
    test('Testing listMetadataTypes()', async (done) => {
        const connection = new Connection('MyOrg', '50.0');
        connection.setUsernameOrAlias('MyOrg');
        connection.setSingleThread();
        connection.setApiVersion('50.0');
        connection.setProjectFolder('./');
        connection.setNamespacePrefix('acn')
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.listMetadataTypes().then((metadataTypes) => {
            expect(metadataTypes.length).toBeGreaterThan(0);
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing listMetadataTypes() with Error', async (done) => {
        const connection = new Connection('MyOrg', '50');
        
        connection.setUsernameOrAlias('MyOrg');
        connection.setSingleThread();
        connection.listMetadataTypes().then((metadataTypes) => {
            expect(metadataTypes.length).toBeGreaterThan(0);
            done();
        }).catch((error) => {
            expect(error.message).toMatch('The API version \'50\' is not valid.  Must be in the format, \'i.0\'');
            done();
        });
    }, 300000);
    test('Testing describeMetadataTypes() Download All', async (done) => {
        const connection = new Connection('MyOrg', '50.0');
        
        
        connection.setMultiThread();
        connection.describeMetadataTypes(['Report', 'Dashboard', 'EmailTemplate', 'Document', 'CustomObject', 'CustomField', 'Flow', 'Layout', 'StandardValueSet'], true, function (status) {
        }).then((metadata) => {
            expect(metadata['CustomObject'].name).toMatch('CustomObject');
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing describeMetadataTypes() Download Only Org Namespace', async (done) => {
        const connection = new Connection('MyOrg', '50.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.describeMetadataTypes(['Report', 'Dashboard', 'EmailTemplate', 'Document', 'CustomObject', 'CustomField', 'Flow', 'Layout'], false, function (status) {
        }).then((metadata) => {
            expect(metadata['CustomField'].name).toMatch('CustomField');
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing abortConnection()', async (done) => {
        const objects = ['Report', 'Dashboard', 'EmailTemplate', 'Document', 'CustomObject', 'CustomField', 'Flow', 'Layout', 'QuickAction', 'CompactLayout', 'RecordType', 'WebLink', 'CustomTab', 'ApexClass', 'ApexTrigger', 'ApexPage'];
        const connection = new Connection('MyOrg', '50.0', undefined, 'acn');
        connection.onAbort(() => {
            console.log("aborted");
        });
        connection.onAfterDownloadType(() => {
            connection.abortConnection();
        });
        connection.setSingleThread();
        connection.describeMetadataTypes(objects, true).then((metadata) => {
            expect(Object.keys(metadata).length).toBeLessThan(objects.length);
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing describeMetadataTypes() Entire Metadata', async (done) => {
        const connection = new Connection('MyOrg', '50.0');
        
        
        connection.setUsernameOrAlias('MyOrg');
        connection.setSingleThread();
        connection.setApiVersion('50.0');
        connection.setProjectFolder('./');
        const metadataTypes = await connection.listMetadataTypes();
        connection.setMultiThread();
        connection.describeMetadataTypes(metadataTypes, true, function (status) {
        }).then((metadata) => {
            expect(metadata['CustomObject'].name).toMatch('CustomObject');
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing listAuthOrgs()', async (done) => {
        const connection = new Connection('MyOrg', '50.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.listAuthOrgs().then((authOrgs) => {
            expect(authOrgs.length).toBeGreaterThan(0);
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing listSObjects()', async (done) => {
        const connection = new Connection('MyOrg', '50.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.listSObjects().then((sObjects) => {
            expect(sObjects.length).toBeGreaterThan(0);
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing listSObjects() With Error', async (done) => {
        const connection = new Connection('MyOrg', '50', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.listSObjects().then((sObjects) => {
            expect(sObjects.length).toBeGreaterThan(0);
            done();
        }).catch((error) => {
            expect(error.message).toEqual('The API version \'50\' is not valid.  Must be in the format, \'i.0\'');
            done();
        });
    }, 300000);
    test('Testing describeSObjects()', async (done) => {
        const connection = new Connection('MyOrg', '50.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.describeSObjects(['Account']).then((sObjects) => {
            expect(sObjects['Account'].name).toEqual('Account');
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing retrieve()', async (done) => {
        const connection = new Connection('MyOrg', '50.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.retrieve(false).then((status) => {
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing retrieve() With Error', async (done) => {
        const connection = new Connection('MyOrg', '50.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xl');
        connection.retrieve(false).then((status) => {
            expect(status).toBeUndefined();
            done();
        }).catch((error) => {
            expect(error.message).toMatch('does not exists or not have access to it');
            done();
        });
    }, 300000);
    test('Testing validateDeploy()', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.validateDeploy().then((status) => {
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing validateDeploy() with Error', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xl');
        connection.validateDeploy().then((status) => {
            expect(status).toBeUndefined();
            done();
        }).catch((error) => {
            expect(error.message).toMatch('does not exists or not have access to it');
            done();
        });
    }, 300000);
    test('Testing deploy()', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.deployPackage().then((status) => {
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing deploy() with Error', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xl');
        connection.deployPackage().then((status) => {
            expect(status).toBeUndefined();
            done();
        }).catch((error) => {
            expect(error.message).toMatch('does not exists or not have access to it');
            done();
        });
    }, 300000);
    test('Testing quickDeploy()', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.validateDeploy('RunSpecifiedTests', ['SiteRegisterControllerTest', 'MyProfilePageControllerTest'], false, 33).then((status) => {
            connection.quickDeploy(status.id).then((status) => {
                done();
            }).catch((error) => {
                expect(error.message).toMatch('Unexpected element {http://soap.sforce.com/2006/04/metadata}id during simple type deserialization')
                done();
            });
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing quickDeploy() with Error', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.quickDeploy('45698745a').then((status) => {
            expect(status).toBeUndefined();
            done();
        }).catch((error) => {
            expect(error.message).toMatch('The flag value "45698745a" is not in the correct format for "id." Must be a 15- or 18-char string in the format "00Dxxxxxxxxxxxx", where "00D" is a valid sObject prefix')
            done();
        });
    }, 300000);
    test('Testing deployReport()', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.validateDeploy().then((status) => {
            connection.deployReport(status.id).then((reportStatus) => {
                expect(reportStatus.status).toMatch('Succeeded');
                done();
            }).catch((error) => {
                console.log(error);
                expect(error).toBeUndefined();
                done();
            });
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing deployReport() with Error', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.deployReport('45698745a').then((status) => {
            expect(status).toBeUndefined();
            done();
        }).catch((error) => {
            expect(error.message).toMatch('The flag value "45698745a" is not in the correct format for "id." Must be a 15- or 18-char string in the format "00Dxxxxxxxxxxxx", where "00D" is a valid sObject prefix')
            done();
        });
    }, 300000);
    test('Testing cancelDeploy() with Error', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.cancelDeploy('45698745a').then((status) => {
            expect(status).toBeUndefined();
            done();
        }).catch((error) => {
            expect(error.message).toMatch('The flag value "45698745a" is not in the correct format for "id." Must be a 15- or 18-char string in the format "00Dxxxxxxxxxxxx", where "00D" is a valid sObject prefix')
            done();
        });
    }, 300000);
    test('Testing createSFDXProject()', async (done) => {
        if (FileChecker.isExists('./test/assets/SFDXProject/newProject'))
            FileWriter.delete('./test/assets/SFDXProject/newProject');
        FileWriter.createFolderSync('./test/assets/SFDXProject/newProject');
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.createSFDXProject('MyOrg', './test/assets/SFDXProject/newProject', 'standard', true).then((sfdxProject) => {
            expect(sfdxProject.outputDir).toMatch('\\test\\assets\\SFDXProject\\newProject');
            expect(connection.projectFolder).toMatch('/test/assets/SFDXProject/newProject/MyOrg');
            expect(connection.packageFolder).toMatch('/test/assets/SFDXProject/newProject/MyOrg/manifest');
            expect(connection.packageFile).toMatch('/test/assets/SFDXProject/newProject/MyOrg/manifest/package.xml');
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing createSFDXProject() with error', async (done) => {
        if (FileChecker.isExists('./test/assets/SFDXProject/newProject'))
            FileWriter.delete('./test/assets/SFDXProject/newProject');
        FileWriter.createFolderSync('./test/assets/SFDXProject/newProject');
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.createSFDXProject('MyOrg', './test/assets/SFDXProject/newProject', 'standard', true).then((sfdxProject) => {
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing setAuthOrg()', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/newProject/MyOrg');
        connection.setPackageFolder('./test/assets/SFDXProject/newProject/MyOrg/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/newProject/MyOrg/manifest/package.xml');
        connection.setAuthOrg('MyOrg').then(() => {
            expect(connection.usernameOrAlias).toMatch('MyOrg');
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing setAuthOrg() with Error', async (done) => {
        const connection = new Connection(undefined, '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./test/assets/SFDXProject/newProject');
        connection.setPackageFolder('./test/assets/SFDXProject/newProject/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/newProject/manifest/package.xml');
        connection.setAuthOrg('MyOrg').then(() => {
            expect(connection.usernameOrAlias).toBeUndefined();
            done();
        }).catch((error) => {
            expect(error.message).toMatch('This directory does not contain a valid Salesforce DX project')
            done();
        });
    }, 300000);
    test('Testing exportTreeData()', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./');
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.exportTreeData('Select Id, Name from Account', './test/assets/exported', 'accounts').then(() => {
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing exportTreeData() with error', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./');
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.exportTreeData('Select Id, Name from acc', './test/assets/exported', 'accounts').then(() => {
            done();
        }).catch((error) => {
            console.log(error);
            expect(error).toMatch('sObject type \'acc\' is not supported');
            done();
        });
    }, 300000);
    test('Testing importTreeData() and deleteBulk()', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./');
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.importTreeData('./test/assets/exported/accounts-Accounts.json').then((results) => {
            if(results.results){
                let ids = [];
                for(const result of results.results){
                    ids.push(result.id);
                }
                let csvContent = 'Id\n' + ids.join('\n');
                let csvFile = './test/assets/exported/deleteFile.csv';
                FileWriter.createFileSync(csvFile, csvContent);
                connection.bulkDelete(csvFile, 'Account').then((status) => {
                    expect(status[0].state).toMatch('Queued');
                    done();
                }).catch((error) => {
                    expect(error).toBeUndefined();
                    done();
                });
            } else {
                done();
            }
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing deleteBulk() with Error', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setProjectFolder('./');
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.bulkDelete('./test/csvFile.csv', 'Account').then((status) => {
            expect(status).toBeUndefined();
            done();
        }).catch((error) => {
            expect(error.message).toMatch('does not exist');
            done();
        });
    }, 300000);
    test('Testing executeApexAnonymous()', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.executeApexAnonymous('./test/assets/apexScript.apex').then((log) => {
            expect(log).toMatch('Compiled successfully.');
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing getAuthUsername()', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.getAuthUsername().then((username) => {
            expect(username).toMatch('juan.longoria.lopez@accenture.com');
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing getAuthUsername() from project', async (done) => {
        const connection = new Connection(undefined, '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.getAuthUsername().then((username) => {
            expect(username).toMatch('juan.longoria.lopez@accenture.com');
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing getServerInstance()', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.getServerInstance().then((instance) => {
            expect(instance).toMatch('jjlongoria');
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing getServerInstance With Other username()', async (done) => {
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.getServerInstance('MyOrg').then((instance) => {
            expect(instance).toMatch('jjlongoria');
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing loadUserPermissions()', async (done) => {
        FileWriter.createFolderSync('./test/assets/tmpFolder');
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.loadUserPermissions('./test/assets/tmpFolder').then((permissions) => {
            expect(permissions.length).toBeGreaterThan(0);
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing retrieveLocalSpecialTypes()', async (done) => {
        FileWriter.createFolderSync('./test/assets/tmpFolder');
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const types = {};
        types[MetadataTypes.PROFILE] = new MetadataType(MetadataTypes.PROFILE, false);
        types[MetadataTypes.PROFILE].addChild(new MetadataObject('Admin', true));
        types[MetadataTypes.CUSTOM_OBJECT] = new MetadataType(MetadataTypes.CUSTOM_OBJECT, false);
        types[MetadataTypes.CUSTOM_OBJECT].addChild(new MetadataObject('ALMA_Record__c', true));
        types[MetadataTypes.RECORD_TYPE] = new MetadataType(MetadataTypes.RECORD_TYPE, false);
        types[MetadataTypes.RECORD_TYPE].addChild(new MetadataObject('Transform_Node__c', false));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c').addChild(new MetadataItem('Else_If', true));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c').addChild(new MetadataItem('Else', true));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c').addChild(new MetadataItem('Expresion', true));
        connection.retrieveLocalSpecialTypes('./test/assets/tmpFolder', types, true, () => {

        }).then(() => {
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing retrieveLocalSpecialTypes() all', async (done) => {
        FileWriter.createFolderSync('./test/assets/tmpFolder');
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.retrieveLocalSpecialTypes('./test/assets/tmpFolder', undefined, true).then(() => {
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing retrieveMixedSpecialTypes()', async (done) => {
        FileWriter.createFolderSync('./test/assets/tmpFolder');
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const types = {};
        types[MetadataTypes.PROFILE] = new MetadataType(MetadataTypes.PROFILE, false);
        types[MetadataTypes.PROFILE].addChild(new MetadataObject('Admin', true));
        types[MetadataTypes.CUSTOM_OBJECT] = new MetadataType(MetadataTypes.CUSTOM_OBJECT, false);
        types[MetadataTypes.CUSTOM_OBJECT].addChild(new MetadataObject('ALMA_Record__c', true));
        types[MetadataTypes.RECORD_TYPE] = new MetadataType(MetadataTypes.RECORD_TYPE, false);
        types[MetadataTypes.RECORD_TYPE].addChild(new MetadataObject('Transform_Node__c', false));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c').addChild(new MetadataItem('Else_If', true));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c').addChild(new MetadataItem('Else', true));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c').addChild(new MetadataItem('Expresion', true));
        connection.retrieveMixedSpecialTypes('./test/assets/tmpFolder', types, false, true).then(() => {
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing retrieveMixedSpecialTypes() all', async (done) => {
        FileWriter.createFolderSync('./test/assets/tmpFolder');
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.retrieveMixedSpecialTypes('./test/assets/tmpFolder', undefined, false, true).then(() => {
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing retrieveOrgSpecialTypes()', async (done) => {
        FileWriter.createFolderSync('./test/assets/tmpFolder');
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        const types = {};
        types[MetadataTypes.PROFILE] = new MetadataType(MetadataTypes.PROFILE, false);
        types[MetadataTypes.PROFILE].addChild(new MetadataObject('Admin', true));
        types[MetadataTypes.CUSTOM_OBJECT] = new MetadataType(MetadataTypes.CUSTOM_OBJECT, false);
        types[MetadataTypes.CUSTOM_OBJECT].addChild(new MetadataObject('ALMA_Record__c', true));
        types[MetadataTypes.RECORD_TYPE] = new MetadataType(MetadataTypes.RECORD_TYPE, false);
        types[MetadataTypes.RECORD_TYPE].addChild(new MetadataObject('Transform_Node__c', false));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c').addChild(new MetadataItem('Else_If', true));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c').addChild(new MetadataItem('Else', true));
        types[MetadataTypes.RECORD_TYPE].getChild('Transform_Node__c').addChild(new MetadataItem('Expresion', true));
        connection.retrieveOrgSpecialTypes('./test/assets/tmpFolder', types, false, true).then(() => {
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
    test('Testing retrieveOrgSpecialTypes() All', async (done) => {
        FileWriter.createFolderSync('./test/assets/tmpFolder');
        const connection = new Connection('MyOrg', '51.0', undefined, 'acn');
        
        
        connection.setMultiThread();
        connection.setNamespacePrefix('acn')
        connection.setProjectFolder('./test/assets/SFDXProject/MyOrg/PROD');
        connection.setPackageFolder('./test/assets/SFDXProject/MyOrg/PROD/manifest');
        connection.setPackageFile('./test/assets/SFDXProject/MyOrg/PROD/manifest/package.xml');
        connection.retrieveOrgSpecialTypes('./test/assets/tmpFolder', undefined, false, true).then(() => {
            done();
        }).catch((error) => {
            expect(error).toBeUndefined();
            done();
        });
    }, 300000);
});