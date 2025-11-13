# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2025-11-13

### Fixed

- **ESLint Type Safety**: Fixed `@typescript-eslint/no-unsafe-return` errors that occurred when users returned values from `deserialize()` in their own generic functions. ESLint was incorrectly flagging these as unsafe due to `any` contamination in the Schema union type's `_type` property.
- Removed the `_type?: any` property from structural union members in the Schema type definition (lines 184-198 in schema.ts). The `_type` property is only needed on concrete schema types for inference, not in the union members used for variance compatibility.
- Updated type assertion in deserializer.ts to handle stricter type checking after Schema union changes.

### Added

- Comprehensive ESLint type safety tests in `tests/eslint/no-unsafe-return.test.ts` with 9 test cases covering generic functions, nested functions, class methods, async functions, and error handling patterns.
- Real-world usage fixture file `src/__tests__/deserialize-return.ts` demonstrating library usage patterns that should not trigger ESLint warnings.

### Changed

- Schema union type now omits the `_type` property from structural members, eliminating `any` contamination while preserving variance compatibility and InferType functionality.
- Updated Schema type documentation to explain why `_type` is omitted from structural union members.

### Technical Details

This fix resolves the root cause identified in the issue report where ESLint's type checker saw `_type?: any` in the Schema union and flagged any derived types as potentially unsafe. By removing this property from the structural union members while keeping it on concrete schema types, `InferType<S>` continues to work correctly (extracting from concrete types) while eliminating the `any` contamination that triggered ESLint warnings.

## [0.1.3] - 2025-10-26

### Fixed

- **CRITICAL**: Completed the fix for `InferType<T>` that was partially addressed in v0.1.2. The v0.1.2 fix added structural typing to the Schema union but forgot to include the `_type` property in those structural types, causing `InferType` to still return `never`.
- Added `readonly _type?: any` to all structural schema types in the Schema union (option, newtype_struct, seq, tuple, tuple_struct, map, struct, enum).
- Updated `InferType` implementation to check for optional `_type?` property instead of required `_type` property to match the structural types.

### Added

- Comprehensive compile-time type inference tests in `tests/types/infer-type-compile-time.test.ts` that verify `InferType<T>` returns correct types and never returns `never`.
- Added 11 new compile-time type checking tests (total now 356 tests, was 345).

### Changed

- InferType conditional type now checks for `readonly _type?: infer T` instead of `readonly _type: infer T` to properly handle optional phantom type properties.

## [0.1.2] - 2025-10-26

### Fixed

- **CRITICAL**: Fixed TypeScript variance issue that caused `InferType<T>` to return `never` for all generic schema types. The v0.1.1 fix only addressed schema assignment but missed the primary API (`InferType`) which uses generic constraints. This was a blocking bug that made the library unusable for type inference on complex schemas.
- Applied structural typing to all generic schema types in the Schema union: `OptionSchema`, `NewtypeStructSchema`, `SeqSchema`, `TupleSchema`, `TupleStructSchema`, `MapSchema`, and `StructSchema`.
- Updated serializer and deserializer to properly handle the new structural types with appropriate type casts.

### Added

- Comprehensive `InferType` tests for all generic schema types to prevent regression.
- Added 22 new tests (total now 345 tests, was 323).
- Added `npm run type-check:tests` script to verify type inference works correctly.

### Changed

- Schema union type now uses structural typing with `any` for all generic type parameters to handle TypeScript variance correctly.
- All generic schemas can now be properly used with `InferType<T>` to get correct TypeScript types.

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

[0.1.4]: https://github.com/variegated-coffee/serde-postcard-ts/releases/tag/v0.1.4
[0.1.3]: https://github.com/variegated-coffee/serde-postcard-ts/releases/tag/v0.1.3
[0.1.2]: https://github.com/variegated-coffee/serde-postcard-ts/releases/tag/v0.1.2
[0.1.1]: https://github.com/variegated-coffee/serde-postcard-ts/releases/tag/v0.1.1
[0.1.0]: https://github.com/variegated-coffee/serde-postcard-ts/releases/tag/v0.1.0
