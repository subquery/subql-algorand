# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.2.0] - 2023-07-31
### Added
- Add `block` to `AlgorandTransaction` (#67)
- Add `getTransactionsByGroup` to `AlgorandBlock` (#67)
- Add `applicationArgs` to `AlgorandTransactionFilter` (#67)
### Changed
- Update license to GPL-3.0 (#70)

## [2.1.0] - 2023-05-17
### Changed
- Sync with main SDK

## [2.0.0] - 2023-05-01
### Changed
- Sync with main SDK for 2.0 release

## [1.6.0] - 2023-02-21
### Changed
- Sync with main sdk
  - Add `count` to `Store` interface
  - Support for `bypassBlocks`

## [1.5.0] - 2023-01-24
### Added
- Add `count` function to get the number of entities (#22)

## [1.4.0] - 2022-11-11
### Changed
- Sync changes from main SDK, update `AlgorandBlockFilter` include timestamp.

## [1.3.0] - 2022-09-02
### Changed
- Updated `store.getByField` to have limit and offset options: `getByField(entity: string, field: string, value: any, options?: {offset?: number; limit?: number}): Promise<Entity[]>;`.
- Added `bulkUpdate` and `bulkGet` to the injected store. This can be used to optimise handlers and speed up indexing.

## [1.2.1] - 2022-08-04

## [1.2.0] - 2022-08-04
[Unreleased]: https://github.com/subquery/subql-algorand/compare/types/2.2.0...HEAD
[2.2.0]: https://github.com/subquery/subql-algorand/compare/types/2.1.0...types/2.2.0
[2.1.0]: https://github.com/subquery/subql-algorand/compare/types/2.0.0...types/2.1.0
[2.0.0]: https://github.com/subquery/subql-algorand/compare/types/1.6.0...types/2.0.0
[1.6.0]: https://github.com/subquery/subql-algorand/compare/types/1.5.0...types/1.6.0
[1.5.0]: https://github.com/subquery/subql-algorand/compare/types/1.4.0...types/1.5.0
[1.4.0]: https://github.com/subquery/subql-algorand/compare/types/1.3.0...types/1.4.0
[1.3.0]: https://github.com/subquery/subql-algorand/compare/types/1.2.1...types/1.3.0
[1.2.1]: https://github.com/subquery/subql-algorand/compare/types/1.2.1...types/1.3.0
[1.2.0]: https://github.com/subquery/subql-algorand/tag/types/1.2.0
