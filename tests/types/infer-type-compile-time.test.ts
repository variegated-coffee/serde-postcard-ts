/**
 * Compile-time type inference tests for InferType
 *
 * This file contains type-level assertions that are verified at compile time
 * by TypeScript's type checker. These tests ensure that InferType<T> correctly
 * extracts TypeScript types from schema definitions.
 *
 * Run with: npm run type-check:tests
 *
 * If InferType is broken, these assertions will fail at compile time with
 * type errors, even though the runtime tests may pass.
 */

import { describe, it } from 'vitest';
import {
  bool,
  u8,
  u32,
  string,
  option,
  seq,
  tuple,
  map,
  struct,
  newtypeStruct,
  tupleStruct,
  enumType,
  unitVariant,
  newtypeVariant,
  structVariant,
  type InferType,
} from '../../src/types/schema.js';

describe('InferType compile-time type inference', () => {
  it('should infer correct type for OptionSchema', () => {
    const schema = option(string());
    type Inferred = InferType<typeof schema>;

    // Type assertion: Inferred should be string | null
    const test1: Inferred = "hello";
    const test2: Inferred = null;

    // This should compile without errors
    const _verify: string | null = test1;
    const _verify2: string | null = test2;

    // Prevent unused variable warnings
    void _verify;
    void _verify2;
  });

  it('should infer correct type for SeqSchema', () => {
    const schema = seq(u32());
    type Inferred = InferType<typeof schema>;

    // Type assertion: Inferred should be number[]
    const test: Inferred = [1, 2, 3];

    // This should compile without errors
    const _verify: number[] = test;
    void _verify;
  });

  it('should infer correct type for TupleSchema', () => {
    const schema = tuple(string(), u32(), bool());
    type Inferred = InferType<typeof schema>;

    // Type assertion: Inferred should be [string, number, boolean]
    const test: Inferred = ["hello", 42, true];

    // This should compile without errors
    const _verify: [string, number, boolean] = test;
    void _verify;
  });

  it('should infer correct type for MapSchema', () => {
    const schema = map(string(), u32());
    type Inferred = InferType<typeof schema>;

    // Type assertion: Inferred should be Map<string, number>
    const test: Inferred = new Map([["key", 123]]);

    // This should compile without errors
    const _verify: Map<string, number> = test;
    void _verify;
  });

  it('should infer correct type for StructSchema', () => {
    const schema = struct({
      name: string(),
      age: u32(),
      active: bool(),
    });
    type Inferred = InferType<typeof schema>;

    // Type assertion: Inferred should be { name: string; age: number; active: boolean }
    const test: Inferred = {
      name: "Alice",
      age: 30,
      active: true,
    };

    // This should compile without errors
    const _verify: { name: string; age: number; active: boolean } = test;
    void _verify;
  });

  it('should infer correct type for NewtypeStructSchema', () => {
    const schema = newtypeStruct("UserId", u32());
    type Inferred = InferType<typeof schema>;

    // Type assertion: Inferred should be number
    const test: Inferred = 42;

    // This should compile without errors
    const _verify: number = test;
    void _verify;
  });

  it('should infer correct type for TupleStructSchema', () => {
    const schema = tupleStruct("Point", u32(), u32());
    type Inferred = InferType<typeof schema>;

    // Type assertion: Inferred should be [number, number]
    const test: Inferred = [10, 20];

    // This should compile without errors
    const _verify: [number, number] = test;
    void _verify;
  });

  it('should infer correct type for EnumSchema', () => {
    const schema = enumType("Status", {
      Active: unitVariant("Active"),
      Inactive: unitVariant("Inactive"),
      Pending: newtypeVariant("Pending", u32()),
      Error: structVariant("Error", {
        code: u32(),
        message: string(),
      }),
    });
    type Inferred = InferType<typeof schema>;

    // Type assertions: Inferred should be a union of variant types
    const test1: Inferred = { type: "Active" };
    const test2: Inferred = { type: "Inactive" };
    const test3: Inferred = { type: "Pending", value: 42 };
    const test4: Inferred = {
      type: "Error",
      value: { code: 500, message: "Internal error" },
    };

    // This should compile without errors
    void test1;
    void test2;
    void test3;
    void test4;
  });

  it('should infer correct type for nested structures', () => {
    const innerSchema = struct({
      id: u32(),
      name: string(),
    });

    const outerSchema = struct({
      items: seq(innerSchema),
      metadata: map(string(), string()),
      count: option(u32()),
    });

    type Inferred = InferType<typeof outerSchema>;

    // Type assertion: Inferred should be a complex nested structure
    const test: Inferred = {
      items: [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ],
      metadata: new Map([["key", "value"]]),
      count: 42,
    };

    // This should compile without errors
    const _verify: {
      items: Array<{ id: number; name: string }>;
      metadata: Map<string, string>;
      count: number | null;
    } = test;
    void _verify;
  });

  it('should infer correct type for deeply nested schemas', () => {
    const coordinatesSchema = struct({
      x: u32(),
      y: u32(),
    });

    const itemSchema = struct({
      id: u32(),
      position: coordinatesSchema,
      tags: seq(string()),
    });

    const containerSchema = struct({
      items: seq(itemSchema),
      settings: map(string(), option(u32())),
    });

    type Inferred = InferType<typeof containerSchema>;

    // Type assertion: Inferred should be deeply nested
    const test: Inferred = {
      items: [
        {
          id: 1,
          position: { x: 10, y: 20 },
          tags: ["tag1", "tag2"],
        },
      ],
      settings: new Map([
        ["setting1", 100],
        ["setting2", null],
      ]),
    };

    // Verify the structure compiles
    void test;
    void test.items[0]?.position.x;
    void test.settings.get("setting1");
  });

  it('should NOT infer never for any schema type', () => {
    // This is a critical test - InferType should NEVER return 'never' for valid schemas
    const schemas = {
      opt: option(u32()),
      seqSchema: seq(string()),
      tup: tuple(u8(), string()),
      mapSchema: map(string(), u32()),
      structSchema: struct({ field: u32() }),
      newtype: newtypeStruct("NT", u32()),
      tupleStructSchema: tupleStruct("TS", u32(), string()),
      enumSchema: enumType("E", { A: unitVariant("A") }),
    };

    // None of these should be 'never'
    type OptType = InferType<typeof schemas.opt>;
    type SeqType = InferType<typeof schemas.seqSchema>;
    type TupType = InferType<typeof schemas.tup>;
    type MapType = InferType<typeof schemas.mapSchema>;
    type StructType = InferType<typeof schemas.structSchema>;
    type NewtypeType = InferType<typeof schemas.newtype>;
    type TupleStructType = InferType<typeof schemas.tupleStructSchema>;
    type EnumType = InferType<typeof schemas.enumSchema>;

    // Type assertions to ensure none are 'never'
    // If any of these are 'never', the assignment will fail at compile time
    const opt: OptType = 42;
    const seqVal: SeqType = ["test"];
    const tup: TupType = [5, "test"];
    const mapVal: MapType = new Map([["key", 1]]);
    const structVal: StructType = { field: 42 };
    const newtype: NewtypeType = 42;
    const tupleStructVal: TupleStructType = [42, "test"];
    const enumVal: EnumType = { type: "A" };

    void opt;
    void seqVal;
    void tup;
    void mapVal;
    void structVal;
    void newtype;
    void tupleStructVal;
    void enumVal;
  });
});
