# Change Log
All notable changes to this project will be documented in this file.

## [2.0.0 - 2021-12-13]
### Added

### Fixed
- Fixed little problem with load permissions when tempFolder not exists



## [2.0.0 - 2021-12-13]
### Added
- Changed to Typescript
- Added support to API 53.0
- Added Salesforce Core libraries to support connections and make it faster
- Rename class from Connection to SFConnector to avoid conflicts with Salesforce Core Objects
- Added new method **getAuthOrg(username?: string)** to get AuthOrg data from any org authorized on the system
- Improve **listMetadataTypes()** method performance to make faster about 90% 
- Improve **describeMetadataTypes()** method performance make faster about 95%
- Improve **query()** method performance to make faster about 90% 
- Improve **listSObjects()** method performance to make faster about 70% 
- Improve **describeSObjects()** method performance to make faster about 85%
- Improve General Performance about 60-80%

### Fixed
- Fix all minor errors

## [1.1.0 - 2021-09-18]
### Added
- Added new event to handle errors on when donwload any metadata type or sobject
## [1.0.0 - 2021-09-18]
### Added
- Created Connection class to connect with Salesforce to list or describe metadata, validate, deploy or retrieve changes, create projects... and much more