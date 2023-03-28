# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.19.0] - 2023-03-28
### Update
- Sync with main SDK

## [1.18.3] - 2023-03-01
### Fixed
- Fixed Nest dependencies issue with IndexManger (#34)

## [1.18.2] - 2023-02-28
### Updated
- improve error handling for endpoint errors (#31)

### Fixed
- Index large blocks (#30)


## [1.18.1] - 2023-02-21
### Updated
- Sync with main sdk (#28)
  - Fixes relating to dynamic datasources and workers

### Fixed
- Dependency injection issue with workers (#27)

## [1.18.0] - 2023-01-24
### Fixed
- Sender filter not working with certain tx types. (#25)
- Make `txType` filter optional. (#23)

### Updated
- Sinc with latest changes on Substrate SDK: (#22)
  - Ability to bypass blocks
  - Sync block-dispatcher with same structure as main SDK
  - DictionaryService updates for useDistinct and dictionary startHeight check
  - hotSchemaReload updates
  - fix force-clean and reindex subcommands
  - Update SubqueryProject to @Injectable just to match the main SDK

## [1.11.0] - 2022-11-11
### Updated
- Sync with latest changes on Substrate SDK: (#19)
  - Add timestamp filter to block handler.
  - Update reindex subcommand.

## [1.10.0] - 2022-10-12
### Updated
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

Initial Algorand support.

[Unreleased]: https://github.com/subquery/subql/compare/node/v1.9.0...HEAD
[1.9.0]: https://github.com/subquery/subql/compare/node/v1.6.1.../node/v1.9.0
[1.6.1]: https://github.com/subquery/subql/compare/node/v1.6.0.../node/v1.6.1
[1.6.0]: https://github.com/subquery/subql/compare/node/v1.6.0
