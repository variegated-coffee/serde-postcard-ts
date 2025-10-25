# serde-postcard-ts

TypeScript implementation of the [postcard](https://github.com/jamesmunns/postcard) serialization format created by [James Munns](https://github.com/jamesmunns).

## About

**Postcard** is a compact, non-self-describing binary serialization format based on the Serde data model, originally created by [James Munns](https://github.com/jamesmunns) for the Rust ecosystem. This library provides a type-safe TypeScript implementation that aims to be wire-format compatible with the original Rust implementation, allowing TypeScript and Rust applications to exchange binary data seamlessly.

This TypeScript implementation leverages TypeScript's strong typing system to ensure correct serialization and deserialization while maintaining compatibility with the excellent work done on the original postcard format.

## Installation

```bash
npm install @variegated-coffee/serde-postcard-ts
```

## Usage

### Schema Definition

Since postcard is **non-self-describing**, you must define a schema that describes your data structure. The schema maps 1:1 with Serde's 29 data model types and provides TypeScript type inference:

```typescript
import { struct, string, u32, option, seq, InferType } from "@variegated-coffee/serde-postcard-ts";

// Define a schema
const PersonSchema = struct({
  name: string(),
  age: u32(),
  email: option(string()),
  tags: seq(string()),
});

// TypeScript automatically infers the type from the schema!
type Person = InferType<typeof PersonSchema>;
// type Person = {
//   name: string;
//   age: number;
//   email: string | null;
//   tags: string[];
// }

// Serialize and deserialize
const person: Person = {
  name: "Alice",
  age: 30,
  email: "alice@example.com",
  tags: ["developer", "rust", "typescript"],
};

const data = serialize(PersonSchema, person);
const decoded = deserialize(PersonSchema, data);
console.log(decoded.value); // { name: "Alice", age: 30, ... }
```

### Available Schema Builders

The library provides schema builders for all 29 Serde data model types:

**Primitives:**
- `bool()`, `i8()`, `i16()`, `i32()`, `i64()`, `i128()`
- `u8()`, `u16()`, `u32()`, `u64()`, `u128()`
- `f32()`, `f64()`
- `char()`, `string()`, `bytes()`

**Collections:**
- `seq(itemSchema)` - Variable-length sequences (Vec)
- `tuple(...itemSchemas)` - Fixed-length heterogeneous tuples
- `map(keySchema, valueSchema)` - Key-value maps

**Structures:**
- `struct({ field: schema, ... })` - Named fields
- `option(schema)` - Optional values (Some/None)

**Enums (Tagged Unions):**
```typescript
import { enumType, unitVariant, newtypeVariant, tupleVariant, structVariant } from "@variegated-coffee/serde-postcard-ts";

const MessageSchema = enumType("Message", {
  Quit: unitVariant("Quit"),
  Echo: newtypeVariant("Echo", string()),
  Move: tupleVariant("Move", i32(), i32()),
  ChangeColor: structVariant("ChangeColor", {
    r: u8(),
    g: u8(),
    b: u8(),
  }),
});

type Message = InferType<typeof MessageSchema>;
// type Message =
//   | { type: "Quit" }
//   | { type: "Echo"; value: string }
//   | { type: "Move"; value: [number, number] }
//   | { type: "ChangeColor"; value: { r: number; g: number; b: number } }
```

### Rust Compatibility

The library includes Rust test fixtures to ensure wire-format compatibility. See [`test-fixtures/`](./test-fixtures/) for the Rust implementation that generates binary test data.

## Development

### Setup

Install dependencies:

```bash
npm install
```

### Scripts

- `npm run build` - Build the library
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint the code
- `npm run lint:fix` - Fix linting issues
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Type Safety

This project uses extremely strict TypeScript configuration to ensure maximum type safety:

- All strict mode flags enabled
- `noUncheckedIndexedAccess` - Prevents unsafe array access
- `exactOptionalPropertyTypes` - Enforces precise optional properties
- `noUnusedLocals` and `noUnusedParameters` - No unused code
- ESLint with `strict-type-checked` preset

## Module Structure

```
src/
├── index.ts                 # Main exports
├── types/
│   ├── serde.ts            # Serde Data Model type definitions
│   └── schema.ts           # Schema definition interfaces
├── codec/
│   ├── varint.ts           # Variable-length integer encoding
│   ├── serializer.ts       # Core serializer
│   └── deserializer.ts     # Core deserializer
├── primitives/
│   ├── numbers.ts          # Integer/float serializers
│   ├── bool.ts             # Boolean serializer
│   ├── string.ts           # String/char serializers
│   └── bytes.ts            # Byte array serializer
└── complex/
    ├── option.ts           # Option type serializer
    ├── collections.ts      # Seq, tuple, map serializers
    └── enums.ts            # Tagged union serializers
```

## Credits

This project implements the **postcard** serialization format, which was created by [James Munns](https://github.com/jamesmunns). The original Rust implementation and format specification can be found at [github.com/jamesmunns/postcard](https://github.com/jamesmunns/postcard).

We are grateful for James Munns' excellent work in designing and documenting this compact and efficient serialization format.

## License

This TypeScript implementation is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

### Postcard Specification License

The contents of the [`spec/`](./spec/) directory are taken directly from the original [postcard project](https://github.com/jamesmunns/postcard) and are:

- **Copyright:** James Munns
- **License:** [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/)
- **License File:** [`spec/LICENSE-CC-BY-SA`](./spec/LICENSE-CC-BY-SA)

The specification documents are included here for reference and to ensure accurate implementation of the wire format. All credit for the specification and format design belongs to James Munns.

## Specification

See the [postcard specification](./spec/) for details on the wire format. The specification is maintained by James Munns in the original postcard repository.
