# Postcard Test Fixtures

This directory contains a Rust project that generates binary test fixtures for validating compatibility between the Rust and TypeScript implementations of postcard.

## Purpose

The postcard format is non-self-describing, meaning correct serialization and deserialization depends on both sides agreeing on the exact wire format. These fixtures ensure that:

1. TypeScript can deserialize data serialized by Rust
2. The TypeScript implementation matches the official Rust implementation's wire format
3. All Serde data model types are correctly implemented

## Structure

- **src/types.rs** - Rust struct definitions covering all Serde types
- **src/main.rs** - Generator that serializes test data to binary files
- **fixtures/** - Generated `.bin` files (gitignored, regenerate as needed)

## Usage

### Generate fixtures

From the project root:

```bash
npm run generate-fixtures
```

Or directly:

```bash
cd test-fixtures
cargo run --release
```

This will generate `.bin` files in the `fixtures/` directory.

### Run compatibility tests

```bash
npm test tests/integration/rust-compat.test.ts
```

## Test Types

The fixtures include:

### Primitives
All basic types: bool, i8-i128, u8-u128, f32, f64, char, String

### Collections
- `Vec<T>` - dynamic arrays
- `[T; N]` - fixed-size arrays
- `(A, B, C)` - tuples
- `Option<T>` - optional values

### Enums (Tagged Unions)
All four variant types from the Serde data model:
- Unit variants (no data)
- Newtype variants (single value)
- Tuple variants (multiple unnamed fields)
- Struct variants (named fields)

### Complex Types
- Nested structs
- `HashMap<K, V>`
- Vectors of structs
- Mixed structures

### Edge Cases
- Empty collections
- Empty strings
- Boundary values (min/max for integer types)
- Zero values

## TypeScript Type Mirrors

Corresponding TypeScript types are defined in `src/types/fixtures.ts` with exact field names and order to match the Rust structs.

## Regenerating Fixtures

Regenerate fixtures whenever:
- Rust struct definitions change
- New test cases are added
- Postcard library is updated
- Wire format compatibility needs to be verified

## Dependencies

- Rust (stable toolchain)
- `serde` with derive feature
- `postcard` v1.0
