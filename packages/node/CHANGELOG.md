# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.3] - 2025-07-01
### Changed
- Update `@subql/common` and `@subql/node-core` (#154)

## [4.0.2] - 2025-05-01
### Changed
- Re release of previously failed release

## [4.0.1] - 2025-05-01
### Changed
- Update `@subql/node-core` with workers performance fix

## [4.0.0] - 2025-04-28
### Changed
- Implement blockchain service (#151)

### Added
- Support for rewinds and unfinalized blocks with multichain projects

## [3.17.0] - 2025-01-28
### Changed
- Update `@subql/node-core` with minor bug fixes and improvements

## [3.16.0] - 2024-12-17
### Changed
- Update `@subql/node-core` and `@subql/common` dependencies

## [3.15.1] - 2024-12-06
### Fixed
- Missing API dependency when using reindex

## [3.15.0] - 2024-11-26
### Added
- Support for historical indexing by timestamp as well as block height
- Add an `--enable-cache` flag, allowing you to choose between DB or cache for IO operations.

### Changed
- Modify the injection logic of apiService

## [3.14.4] - 2024-10-23
### Changed
- Bump `@subql/common` dependency (#139)

## [3.14.3] - 2024-10-22
### Changed
- Bump `@subql/common` and `@subql/node-core` dependency (#135)

## [3.14.1] - 2024-09-10
### Changed
- Bump version with `node-core` and `@subql/common`

## [3.13.0] - 2024-08-07
### Changed
- Update dependencies and apply dependent changes (#130)

### Added
- Support for specifying headers for network endpoints (#130)

### Fixed
- Transaction filters not working correctly (#130)

## [3.12.0] - 2024-07-03
### Changed
- Bump version with `@subql/common-algorand`, sync with `@subql/node-core`, add admin module

## [3.11.3] - 2024-05-14
### Fixed
- POI throwing an error due to incorrect block hash (#120)

## [3.11.2] - 2024-05-02
### Fixed
- Sandbox Uint8Array and missing pg dep issue

## [3.11.0] - 2024-05-02
### Changed
- Update dependencies and apply changes to match (#115)

### Removed
- Unused deps and deprecated type (#116)

### Fixed
- Timestamp filter not working (#117)

## [3.10.0] - 2024-04-10
### Changed
- Updated with node-core.Now dictionary support multiple dictionary endpoints, indexer will fetch and switch dictionaries base on available blocks

### Fixed
- Updated with node-core ,also fixed:
  - Fix modulo block didn't apply correctly with multiple dataSources
  - Now when `workers` set to 0, it will use block dispatcher instead of throw and exit

## [3.9.1] - 2024-03-14
### Changed
- Update `@subql/node-core` to 4.7.2 with graphql comments escaping fix

## [3.9.0] - 2024-03-06
### Changed
- Update `@subql/node-core` to 7.4.0

## [3.8.1] - 2024-03-01
### Fixed
- Update `@subql/node-core` to fix Poi generation issue with negative integer, also drop subscription triggers and notifiy_functions

## [3.8.0] - 2024-02-23
### Changed
- Updates to match changes in `@subql/node-core` to 7.3.0

## [3.5.1] - 2024-02-07
### Fixed
- Critical bug introduced in 3.5.0 which broke historical indexing

## [3.5.0] - 2024-01-25
### Changed
- Update @subql/node-core with
  - a performance fix when using modulo filters with other datasources
  - support for CSV exports
  - support for schema migrations

## [3.4.4] - 2023-11-30
### Fixed
- Sync with `node-core` 7.0.2

## [3.4.3] - 2023-11-28
### Fixed
- Fix ipfs deployment templates path failed to resolved, issue was introduced node-core 7.0.0
- Update with node-core to fix network dictionary timeout but not fallback to config dictionary issue

## [3.4.2] - 2023-11-27
### Changed
- Update `@subql/node-core` with minor fixes

## [3.4.1] - 2023-11-16
### Fixed
- Sync with `node-core` 6.4.2, Fix incorrect enqueuedBlocks, dictionaries timing out by updating `@subql/apollo-links` (#93)

## [3.4.0] - 2023-11-13
### Changed
- Updates to match changes in '@subql/node-core' (#91)
  - Dictionary service to use dictionary registry
  - Use yargs from node core

## [3.3.0] - 2023-11-06
### Added
- With `dictionary-query-size` now dictionary can config the query block range

### Fixed
- Sync with node-core 6.3.0 with various fixes

## [3.2.0] - 2023-11-01
### Changed
- Update `@subql/node-core` with fixes and support for endBlock feature (#83)

## [3.1.1] - 2023-10-27
### Fixed
- Not injecting cache into workers (#81)

## [3.1.0] - 2023-10-26
### Fixed
- 429 rate limit error handling

### Changed
- Update node-core with new cache feature and bug fixes

## [3.0.1] - 2023-10-12
### Changed
- debug has changed from a boolean to a string to allow scoping debug log level (#2077)

### Fixed
- Sync with node-core.
  - Fixed Poi migration performance issue.
  - Fixed AutoQueue timeout issue.
  - Fixed Poi sync could block DB IO and drop connection issue.

## [3.0.0] - 2023-10-04
### Changed
- Update `@subql/node-core` and sync with main SDK.

## [2.10.0] - 2023-07-31
### Added
- Add `block` to `AlgorandTransaction` (#67)
- Add `getTransactionsByGroup` to `AlgorandBlock` (#67)
- Add `applicationArgs` to `AlgorandTransactionFilter`. Note: dictionary doesn't yet support this. (#67)

### Changed
- add `store-cache-upper-limit` flag
- Reduce block time interval (#67)
- Update license to GPL-3.0
- Sync with `node-core` 4.0.1

### Fixed
- Sync with @node/core, various improvements for POI feature

## [2.8.0] - 2023-06-27
### Changed
- Sync with main sdk and update deps (#62)

### Added
- Multiple endpoint improvements (#56)

## [2.5.2] - 2023-06-09
### Fixed
- POI block hash encoding

## [2.5.1] - 2023-06-08
### Fixed
- Sync with node-core 2.4.4, fixed various issue for mmr

## [2.5.0] - 2023-06-02
### Fixed
- Updated dependencies with fixes and ported over relevant fixes from main sdk (#49)

## [2.3.1] - 2023-05-26
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
[Unreleased]: https://github.com/subquery/subql-algorand/compare/node-algorand/4.0.3...HEAD
[4.0.3]: https://github.com/subquery/subql-algorand/compare/node-algorand/4.0.2...node-algorand/4.0.3
[4.0.2]: https://github.com/subquery/subql-algorand/compare/node-algorand/4.0.1...node-algorand/4.0.2
[4.0.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/4.0.0...node-algorand/4.0.1
[4.0.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.17.0...node-algorand/4.0.0
[3.17.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.16.0...node-algorand/3.17.0
[3.16.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.15.1...node-algorand/3.16.0
[3.15.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.15.0...node-algorand/3.15.1
[3.15.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.14.4...node-algorand/3.15.0
[3.14.4]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.14.3...node-algorand/3.14.4
[3.14.3]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.14.1...node-algorand/3.14.3
[3.14.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.13.0...node-algorand/3.14.1
[3.13.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.12.0...node-algorand/3.13.0
[3.12.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.11.3...node-algorand/3.12.0
[3.11.3]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.11.2...node-algorand/3.11.3
[3.11.2]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.11.0...node-algorand/3.11.2
[3.11.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.10.0...node-algorand/3.11.0
[3.10.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.9.1...node-algorand/3.10.0
[3.9.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.9.0...node-algorand/3.9.1
[3.9.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.8.1...node-algorand/3.9.0
[3.8.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.8.0...node-algorand/3.8.1
[3.8.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.5.1...node-algorand/3.8.0
[3.5.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.5.0...node-algorand/3.5.1
[3.5.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.4.4...node-algorand/3.5.0
[3.4.4]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.4.3...node-algorand/3.4.4
[3.4.3]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.4.2...node-algorand/3.4.3
[3.4.2]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.4.1...node-algorand/3.4.2
[3.4.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.4.0...node-algorand/3.4.1
[3.4.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.3.0...node-algorand/3.4.0
[3.3.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.2.0...node-algorand/3.3.0
[3.2.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.1.1...node-algorand/3.2.0
[3.1.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.1.0...node-algorand/3.1.1
[3.1.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.0.1...node-algorand/3.1.0
[3.0.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/3.0.0...node-algorand/3.0.1
[3.0.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/2.10.0...node-algorand/3.0.0
[2.10.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/2.8.0...node-algorand/2.10.0
[2.8.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/2.5.2...node-algorand/2.8.0
[2.5.2]: https://github.com/subquery/subql-algorand/compare/node-algorand/2.5.1...node-algorand/2.5.2
[2.5.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/2.5.0...node-algorand/2.5.1
[2.5.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/2.3.1...node-algorand/2.5.0
[2.3.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/2.3.0...node-algorand/2.3.1
[2.3.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/2.1.0...node-algorand/2.3.0
[2.1.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/2.0.0...node-algorand/2.1.0
[2.0.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/.1.19.0..node-algorand/2.0.0
[1.19.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/1.18.3...node-algorand/1.19.0
[1.18.3]: https://github.com/subquery/subql-algorand/compare/node-algorand/1.18.2...node-algorand/1.18.3
[1.18.2]: https://github.com/subquery/subql-algorand/compare/node-algorand/1.18.1...node-algorand/1.18.2
[1.18.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/1.18.0...node-algorand/1.18.1
[1.18.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/1.11.0...node-algorand/1.18.0
[1.11.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/1.10.0...node-algorand/1.11.0
[1.10.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/1.9.0...node-algorand/1.10.0
[1.9.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/1.6.1...node-algorand/1.9.0
[1.6.1]: https://github.com/subquery/subql-algorand/compare/node-algorand/1.6.0...node-algorand/1.6.1
[1.6.0]: https://github.com/subquery/subql-algorand/compare/node-algorand/1.6.0
