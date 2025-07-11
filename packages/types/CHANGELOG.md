# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.1.1] - 2025-07-01
### Changed
- Update `@subql/types-core` (#154)

## [4.1.0] - 2025-04-28
### Changed
- Update `@subql/types-core`

## [4.0.1] - 2024-10-22
### Changed
- Bump `@subql/types-core` dependency (#135)

## [3.6.1] - 2024-09-10
### Changed
- Bump version with `@subql/types-core`

## [3.5.0] - 2024-08-07
### Changed
- Update dependencies (#130)

## [3.4.0] - 2024-07-03
### Changed
- Bump version with `@subql/types-core`

## [3.3.0] - 2024-05-02
### Changed
- Update dependencies and apply changes to match (#115)

## [3.2.0] - 2024-04-10
### Changed
- Update `@subql/types-core`

## [3.1.2] - 2024-02-07
### Changed
- Update `@subql/types-core`

## [3.1.1] - 2023-11-30
### Changed
- Sync with `@subql/types-core` 0.4.0

## [3.1.0] - 2023-11-01
### Changed
- Import `@subql/types-core` global into global so its no longer needed to update tsconfig in projects (#83)

## [3.0.1] - 2023-10-26
### Changed
- Update types-core dependency

## [3.0.0] - 2023-10-04
### Changed
- Use `@subql/types-core`

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
[Unreleased]: https://github.com/subquery/subql-algorand/compare/types-algorand/4.1.1...HEAD
[4.1.1]: https://github.com/subquery/subql-algorand/compare/types-algorand/4.1.0...types-algorand/4.1.1
[4.1.0]: https://github.com/subquery/subql-algorand/compare/types-algorand/4.0.1...types-algorand/4.1.0
[4.0.1]: https://github.com/subquery/subql-algorand/compare/types-algorand/3.6.1...types-algorand/4.0.1
[3.6.1]: https://github.com/subquery/subql-algorand/compare/types-algorand/3.5.0...types-algorand/3.6.1
[3.5.0]: https://github.com/subquery/subql-algorand/compare/types-algorand/3.4.0...types-algorand/3.5.0
[3.4.0]: https://github.com/subquery/subql-algorand/compare/types-algorand/3.3.0...types-algorand/3.4.0
[3.3.0]: https://github.com/subquery/subql-algorand/compare/types-algorand/3.2.0...types-algorand/3.3.0
[3.2.0]: https://github.com/subquery/subql-algorand/compare/types-algorand/3.1.2...types-algorand/3.2.0
[3.1.2]: https://github.com/subquery/subql-algorand/compare/types-algorand/3.1.1...types-algorand/3.1.2
[3.1.1]: https://github.com/subquery/subql-algorand/compare/types-algorand/3.1.0...types-algorand/3.1.1
[3.1.0]: https://github.com/subquery/subql-algorand/compare/types-algorand/3.0.1...types-algorand/3.1.0
[3.0.1]: https://github.com/subquery/subql-algorand/compare/types-algorand/3.0.0...types-algorand/3.0.1
[3.0.0]: https://github.com/subquery/subql-algorand/compare/types/2.2.0...types/3.0.0
[2.2.0]: https://github.com/subquery/subql-algorand/compare/types/2.1.0...types/2.2.0
[2.1.0]: https://github.com/subquery/subql-algorand/compare/types/2.0.0...types/2.1.0
[2.0.0]: https://github.com/subquery/subql-algorand/compare/types/1.6.0...types/2.0.0
[1.6.0]: https://github.com/subquery/subql-algorand/compare/types/1.5.0...types/1.6.0
[1.5.0]: https://github.com/subquery/subql-algorand/compare/types/1.4.0...types/1.5.0
[1.4.0]: https://github.com/subquery/subql-algorand/compare/types/1.3.0...types/1.4.0
[1.3.0]: https://github.com/subquery/subql-algorand/compare/types/1.2.1...types/1.3.0
[1.2.1]: https://github.com/subquery/subql-algorand/compare/types/1.2.1...types/1.3.0
[1.2.0]: https://github.com/subquery/subql-algorand/tag/types/1.2.0
