# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed
- Workers crashing because of bad dependency injection

## [2.3.0] - 2023-05-26
### Changed
- Update to Node 18
- Update to latest node-core

## [2.1.0] - 2023-05-17
### Added
- Support for unfinalized blocks with workers

### Changed
- Sync with main SDK

## [2.0.0] - 2023-05-01
### Added
- Added Database cache feature, this significantly improve indexing performance
  - Data flush to database when number of records reaches `--store-cache-threshold` value (default is 1000), this reduces number of transactions to database in order to save time.
  - Direct get data from the cache rather than wait to retrieve it from database, with flag `--store-get-cache-size` user could decide how many records for **each** entity they want to keep in the cache (default is 500)
  - If enabled `--store-cache-async` writing data to the store is asynchronous with regard to block processing (default is enabled)
- Testing Framework, allow users to test their projects filters and handler functions without having to index the project
  - Create test files with the naming convention `*.test.ts` and place them in the `src/tests` or `src/test` folder. Each test file should contain test cases for specific mapping handlers.
  - Run the testing service using the command: `subql-node-algorand test`.

## [1.19.0] - 2023-03-28
### Changed
- Sync with main SDK

## [1.18.3] - 2023-03-01
### Fixed
- Fixed Nest dependencies issue with IndexManger (#34)

## [1.18.2] - 2023-02-28
### Changed
- improve error handling for endpoint errors (#31)

### Fixed
- Index large blocks (#30)

## [1.18.1] - 2023-02-21
### Changed
- Sync with main sdk (#28)
  - Fixes relating to dynamic datasources and workers

### Fixed
- Dependency injection issue with workers (#27)

## [1.18.0] - 2023-01-24
### Fixed
- Sender filter not working with certain tx types. (#25)
- Make `txType` filter optional. (#23)

### Changed
- Sinc with latest changes on Substrate SDK: (#22)
  - Ability to bypass blocks
  - Sync block-dispatcher with same structure as main SDK
  - DictionaryService updates for useDistinct and dictionary startHeight check
  - hotSchemaReload updates
  - fix force-clean and reindex subcommands
  - Update SubqueryProject to @Injectable just to match the main SDK

## [1.11.0] - 2022-11-11
### Changed
- Sync with latest changes on Substrate SDK: (#19)
  - Add timestamp filter to block handler.
  - Update reindex subcommand.

## [1.10.0] - 2022-10-12
### Changed
- Sync with latest changes on Substrate SDK:
  - Remove deprecated subqueries table
  - New reindex and force-clean subcommands.
  - Enable historical feature by default.

## [1.9.0] - 2022-09-02
### Changed
- Update to same version numbering as Substrate SDK.
- Sync with latest changes on Substrate SDK:
  - Use `@subql/node-core` package.
  - Updated `store.getByField` to have limit and offset options: `getByField(entity: string, field: string, value: any, options?: {offset?: number; limit?: number}): Promise<Entity[]>`;.
  - Improved performance logging.
  - Added `bulkUpdate` and `bulkGet` to the injected store. This can be used to optimise handlers and speed up indexing.
  - Fixed indexing stop processing blocks.

## [1.6.1] - 2022-08-09
### Fixed
- Filtering issues with transaction handlers. (#9)

### Changed
- Synced latest changes from main repo. (#10)

## [1.6.0] - 2022-08-04
[Unreleased]: https://github.com/subquery/subql-algorand/compare/v2.3.0...HEAD
[2.3.0]: https://github.com/subquery/subql-algorand/compare/v2.1.0...v2.3.0
[2.1.0]: https://github.com/subquery/subql-algorand/node/v2.0.0.../node/v2.1.0
[2.0.0]: https://github.com/subquery/subql-algorand/node/v.1.19.0../node/v2.0.0
[1.19.0]: https://github.com/subquery/subql-algorand/node/v1.18.3.../node/v1.19.0
[1.18.3]: https://github.com/subquery/subql-algorand/node/v1.18.2.../node/v1.18.3
[1.18.2]: https://github.com/subquery/subql-algorand/node/v1.18.1.../node/v1.18.2
[1.18.1]: https://github.com/subquery/subql-algorand/node/v1.18.0.../node/v1.18.1
[1.18.0]: https://github.com/subquery/subql-algorand/node/v1.11.0.../node/v1.18.0
[1.11.0]: https://github.com/subquery/subql-algorand/node/v1.10.0.../node/v1.11.0
[1.10.0]: https://github.com/subquery/subql-algorand/node/v1.9.0.../node/v1.10.0
[1.9.0]: https://github.com/subquery/subql-algorand/compare/node/v1.6.1.../node/v1.9.0
[1.6.1]: https://github.com/subquery/subql-algorand/compare/node/v1.6.0.../node/v1.6.1
[1.6.0]: https://github.com/subquery/subql-algorand/compare/node/v1.6.0
