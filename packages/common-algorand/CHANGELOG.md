# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- Update `@subql/common` (#161)

## [4.4.4] - 2025-11-03
### Changed
- Update `@subql/common` (#161)

## [4.4.3] - 2025-07-01
### Changed
- Update `@subql/common` (#154)

## [4.4.2] - 2025-05-01
### Changed
- Re release of previously failed release

## [4.4.1] - 2025-05-01
### Changed
- Update `@subql/common`

## [4.4.0] - 2025-04-28
### Changed
- Update `@subql/common`

## [4.3.1] - 2025-01-28
### Changed
- Update `@subql/common` dependency

## [4.3.0] - 2024-12-17
### Changed
- Update `@subql/common` dependency

## [4.2.5] - 2024-11-26
### Changed
- Bump `@subql/common` dependency

## [4.2.4] - 2024-10-23
### Changed
- Bump `@subql/common` dependency (#139)

## [4.2.3] - 2024-10-22
### Changed
- Bump `@subql/common` dependency (#135)

## [4.2.1] - 2024-09-10
### Changed
- Bump version with `@subql/common`

## [4.1.0] - 2024-08-07
### Removed
- `apiKey` option from network config, please use endpoint config and specify the `X-Indexer-API-Token` header instead (#130)

### Added
- Suport for network endpoint config providing the ability to set headers (#130)

## [4.0.0] - 2024-07-03
### Added
- Add alias `parseProjectManifest`, also follow type of `INetworkCommonModule` (#2462)

## [3.5.0] - 2024-05-20
### Removed
- Transient dependencies specified already in `@subql/common` (#123)

## [3.4.0] - 2024-05-02
### Changed
- Update dependencies and apply changes to match (#115)

## [3.3.0] - 2024-04-10
### Changed
- version bump with `@subql/common`

## [3.2.2] - 2024-02-23
### Changed
- version bump with `@subql/common`

## [3.2.1] - 2024-02-07
### Changed
- Update `@subql/common`

## [3.2.0] - 2024-01-25
### Changed
- bump with @subql/common 3.3.1

## [3.1.0] - 2023-11-01
### Added
- Update `@subql/common` and relevant changes to support endBlock feature (#83)

## [3.0.2] - 2023-10-26
### Changed
- Update @subql/common

## [3.0.1] - 2023-10-12
### Changed
- Version bump with `@subql/common` 3.1.2

## [3.0.0] - 2023-10-04
### Added
- Parent field to manifest for project upgrades

### Changed
- Update model with `@subql/types-core` and `@subql/common`

## [2.4.0] - 2023-07-31
### Added
- Add `applicationArgs` to `AlgorandTransactionFilter` (#67)

### Changed
- Update license to GPL-3.0 (#70)
- Sync with `@subql/common` 2.4.0

## [2.3.0] - 2023-06-27
### Changed
- Update @subql/common dependency (#62)

## [2.2.1] - 2023-06-09
### Changed
- Update common

## [2.2.0] - 2023-06-02
### Changed
- update common package (#49)

## [2.1.0] - 2023-05-17
### Changed
- Sync with main SDK

## [2.0.0] - 2023-05-01
### Changed
- Sync with main SDK for 2.0 release

## [1.2.0] - 2023-01-24
### Added
- Ability to bypass blocks. (#22)

## [1.1.0] - 2022-11-11
### Added
- Added timestamp to BlockFilter. (#19)

## [1.0.1] - 2022-08-09
### Fixed
- Fixed `assetId` on transaction filter being validated as a string. (#9)

## [1.0.0] - 2022-08-04
[Unreleased]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.4.4...HEAD
[4.4.4]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.4.3...common-algorand/4.4.4
[4.4.3]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.4.2...common-algorand/4.4.3
[4.4.2]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.4.1...common-algorand/4.4.2
[4.4.1]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.4.0...common-algorand/4.4.1
[4.4.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.3.1...common-algorand/4.4.0
[4.3.1]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.3.0...common-algorand/4.3.1
[4.3.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.2.5...common-algorand/4.3.0
[4.2.5]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.2.4...common-algorand/4.2.5
[4.2.4]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.2.3...common-algorand/4.2.4
[4.2.3]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.2.1...common-algorand/4.2.3
[4.2.1]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.1.0...common-algorand/4.2.1
[4.1.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/4.0.0...common-algorand/4.1.0
[4.0.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/3.5.0...common-algorand/4.0.0
[3.5.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/3.4.0...common-algorand/3.5.0
[3.4.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/3.3.0...common-algorand/3.4.0
[3.3.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/3.2.2...common-algorand/3.3.0
[3.2.2]: https://github.com/subquery/subql-algorand/compare/common-algorand/3.2.1...common-algorand/3.2.2
[3.2.1]: https://github.com/subquery/subql-algorand/compare/common-algorand/3.2.0...common-algorand/3.2.1
[3.2.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/3.1.0...common-algorand/3.2.0
[3.1.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/3.0.2...common-algorand/3.1.0
[3.0.2]: https://github.com/subquery/subql-algorand/compare/common-algorand/3.0.1...common-algorand/3.0.2
[3.0.1]: https://github.com/subquery/subql-algorand/compare/common-algorand/3.0.0...common-algorand/3.0.1
[3.0.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/2.4.0...common-algorand/3.0.0
[2.4.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/2.3.0...common-algorand/2.4.0
[2.3.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/2.2.1...common-algorand/2.3.0
[2.2.1]: https://github.com/subquery/subql-algorand/compare/common-algorand/2.2.0...common-algorand/2.2.1
[2.2.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/2.1.0...common-algorand/2.2.0
[2.1.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/2.0.0...common-algorand/2.1.0
[2.0.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/1.2.0...common-algorand/2.0.0
[1.2.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/1.1.0...common-algorand/1.2.0
[1.1.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/1.0.1...common-algorand/1.1.0
[1.0.1]: https://github.com/subquery/subql-algorand/compare/common-algorand/v1.0.0...common-algorand/v1.0.1
[1.0.0]: https://github.com/subquery/subql-algorand/compare/common-algorand/v1.0.0
