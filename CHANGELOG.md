# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-10-26

### Fixed

- Fixed TypeScript type compatibility issue where `EnumSchema` instances created with `enumType()` could not be assigned to the `Schema` type. The Schema union type now accepts enum schemas with specific variant object types (e.g., `{ Active: ..., Inactive: ... }`) instead of only the generic `Record<string, EnumVariant>` type.

### Changed

- Modified `Schema` type definition to use structural typing for enum schemas, improving type variance handling while maintaining runtime type safety through the `enumType()` function.

## [0.1.0] - 2025-10-25

### Added

- Initial release of serde-postcard-ts
- Full serialization support for all 29 Serde data model types
- Full deserialization support for all 29 Serde data model types
- Type-safe schema builders with TypeScript type inference
- Comprehensive test suite with 319 passing tests
- Wire-format compatibility with Rust postcard implementation
- Support for all primitive types: bool, i8-i128, u8-u128, f32, f64, char, string, bytes
- Support for collections: seq (arrays), tuples, maps
- Support for structures: struct, unit, unit_struct, newtype_struct, tuple_struct
- Support for enums with all variant types: unit, newtype, tuple, struct
- Support for option type (Some/None)
- Varint encoding/decoding with zigzag encoding for signed integers
- Result-based error handling with both throwing and non-throwing APIs
- Rust test fixtures for cross-platform compatibility verification
- Comprehensive documentation and usage examples

[0.1.1]: https://github.com/variegated-coffee/serde-postcard-ts/releases/tag/v0.1.1
[0.1.0]: https://github.com/variegated-coffee/serde-postcard-ts/releases/tag/v0.1.0
