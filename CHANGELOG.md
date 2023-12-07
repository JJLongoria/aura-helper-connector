# Change Log
All notable changes to this project will be documented in this file.

## [2.3.0 - 2023-12-07]
### Changed
- Optimized all methods, specially, methods like describe metadata or sobjects to make it at least 50% faster

## [2.1.1 - 2022-06-21]
### Fixed
- Fixed the Email template group problem when download it from org
- Fixed vulnerabilities

## [2.0.0 - 2021-12-13]
### Added
- Chage **query()** to able to return a typed recods. (query<T>)
- Improve **executeApexAnonymous()** method performance to make it about 70% faster
- Improve **setAuthOrg()** method performance to make it about 90% faster
- Improve all **retrieveSpecial** methods performance to make it about 50% faster

### Fixed
- Fixed little problem with load permissions when tempFolder not exists



## [2.0.0 - 2021-12-13]
### Added
- Changed to Typescript
- Added support to API 53.0
- Added Salesforce Core libraries to support connections and make it faster
- Rename class from Connection to SFConnector to avoid conflicts with Salesforce Core Objects
- Added new method **getAuthOrg(username?: string)** to get AuthOrg data from any org authorized on the system
- Improve **listMetadataTypes()** method performance to make it about 90% faster
- Improve **describeMetadataTypes()** method performance make it about 95% faster
- Improve **query()** method performance to make faster it about 90% faster
- Improve **listSObjects()** method performance to make it about 70% faster
- Improve **describeSObjects()** method performance to make it about 85% faster
- Improve General Performance about 60-80%

### Fixed
- Fix all minor errors

## [1.1.0 - 2021-09-18]
### Added
- Added new event to handle errors on when donwload any metadata type or sobject
## [1.0.0 - 2021-09-18]
### Added
- Created Connection class to connect with Salesforce to list or describe metadata, validate, deploy or retrieve changes, create projects... and much more