# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

All logs must start with the format: [x.y.z] - yyyy-mm-dd

## [Unreleased]
## [1.7.1] - 2023-01-23
### Added
- Add `count` to `Store` interface (#1480)

## [1.7.0] - 2022-12-06
- Support for `bypassBlocks` (#1435)

## [1.6.0] - 2022-10-27
### Added
- Timestamp filter to block handlers (#1310)

## [1.5.1] - 2022-10-11
### Added
- Matcher to dictionary query condition. (#1345)

## [1.5.0] - 2022-09-13
### Changed
- Change types to support wasm processor and update polkadot API to v9. (#1280)

## [1.4.0] - 2022-08-26

### Changed
- Updated store.getByField to have limit and offset options. `getByField(entity: string, field: string, value: any, options?: {offset?: number; limit?: number}): Promise<Entity[]>;`. (#1259)

## [1.3.0] - 2022-08-17
### Added
- `bulkUpdate` and `bulkGet` to the injected store. This can be used to optimise handlers and speed up indexing. (#1246)

## [1.2.1] - 2022-08-04
### Fixed
- Export `EventTypeRecord`. (#1225)

## [1.2.0] - 2022-07-27
### Changed
- Update `SubstrateBlockFilter` with new `modulo` filter. (#1196)
- Make `SubstrateExtrinsic` and `SubstrateEvent` types generic. This allows specifying the data/args type rather than being provided with `Codec[]` or `AnyTuple`. (#1194)

## [1.6.0] - 2023-02-21
### Updated
- Sync with main sdk
  - Add `count` to `Store` interface
  - Support for `bypassBlocks`


## [1.5.0] - 2023-01-24
### Added
* Add `count` function to get the number of entities (#22)


## [1.4.0] - 2022-11-11
### Changed
- Sync changes from main SDK, update `AlgorandBlockFilter` include timestamp.  

## [1.3.0] - 2022-09-02

### Changed
Sync changes from main SDK:
- Updated `store.getByField` to have limit and offset options: `getByField(entity: string, field: string, value: any, options?: {offset?: number; limit?: number}): Promise<Entity[]>;`.
- Added `bulkUpdate` and `bulkGet` to the injected store. This can be used to optimise handlers and speed up indexing.

## [1.2.1] - 2022-08-04
No Changes, fixing build issue

## [1.2.0] - 2022-08-04
Initial Algorand support

[Unreleased]: https://github.com/subquery/subql/compare/types/v1.3.0...HEAD
[1.2.1]: https://github.com/subquery/subql/compare/types/v1.2.1...types/v1.3.0
[1.2.1]: https://github.com/subquery/subql/compare/types/v1.2.0...types/v1.2.1
[1.2.0]: https://github.com/subquery/subql/compare/types/v1.2.0

