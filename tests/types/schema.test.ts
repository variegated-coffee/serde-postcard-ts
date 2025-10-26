/**
 * Tests for schema definition system and type inference
 */

import { describe, it, expect } from "vitest";
import {
  bool,
  i8,
  i16,
  i32,
  i64,
  u8,
  u16,
  u32,
  u64,
  f32,
  f64,
  string,
  char,
  bytes,
  option,
  seq,
  tuple,
  tupleStruct,
  struct,
  map,
  newtypeStruct,
  enumType,
  unitVariant,
  newtypeVariant,
  tupleVariant,
  structVariant,
  type InferType,
  type Schema,
} from "../../src/types/schema.js";

describe("Schema builders", () => {
  describe("Primitives", () => {
    it("should create bool schema", () => {
      const schema = bool();
      expect(schema.kind).toBe("bool");
    });

    it("should create integer schemas", () => {
      expect(i8().kind).toBe("i8");
      expect(i16().kind).toBe("i16");
      expect(i32().kind).toBe("i32");
      expect(i64().kind).toBe("i64");
      expect(u8().kind).toBe("u8");
      expect(u16().kind).toBe("u16");
      expect(u32().kind).toBe("u32");
      expect(u64().kind).toBe("u64");
    });

    it("should create float schemas", () => {
      expect(f32().kind).toBe("f32");
      expect(f64().kind).toBe("f64");
    });

    it("should create string schemas", () => {
      expect(string().kind).toBe("string");
      expect(char().kind).toBe("char");
      expect(bytes().kind).toBe("bytes");
    });
  });

  describe("Collections", () => {
    it("should create seq schema", () => {
      const schema = seq(u32());
      expect(schema.kind).toBe("seq");
      expect(schema.item.kind).toBe("u32");
    });

    it("should create tuple schema", () => {
      const schema = tuple(u32(), string(), bool());
      expect(schema.kind).toBe("tuple");
      expect(schema.items).toHaveLength(3);
      expect(schema.items[0]?.kind).toBe("u32");
      expect(schema.items[1]?.kind).toBe("string");
      expect(schema.items[2]?.kind).toBe("bool");
    });

    it("should create map schema", () => {
      const schema = map(string(), i32());
      expect(schema.kind).toBe("map");
      expect(schema.key.kind).toBe("string");
      expect(schema.value.kind).toBe("i32");
    });
  });

  describe("Structs", () => {
    it("should create struct schema", () => {
      const schema = struct({
        name: string(),
        age: u32(),
        active: bool(),
      });
      expect(schema.kind).toBe("struct");
      expect(schema.fields.name.kind).toBe("string");
      expect(schema.fields.age.kind).toBe("u32");
      expect(schema.fields.active.kind).toBe("bool");
    });

    it("should create nested struct schema", () => {
      const innerSchema = struct({
        id: u64(),
      });
      const outerSchema = struct({
        inner: innerSchema,
        data: seq(i32()),
      });
      expect(outerSchema.kind).toBe("struct");
      expect(outerSchema.fields.inner.kind).toBe("struct");
      expect(outerSchema.fields.data.kind).toBe("seq");
    });
  });

  describe("Options", () => {
    it("should create option schema", () => {
      const schema = option(u32());
      expect(schema.kind).toBe("option");
      expect(schema.inner.kind).toBe("u32");
    });

    it("should create nested option schema", () => {
      const schema = option(option(string()));
      expect(schema.kind).toBe("option");
      expect(schema.inner.kind).toBe("option");
    });
  });

  describe("Enums", () => {
    it("should create enum with unit variant", () => {
      const schema = enumType("Status", {
        Active: unitVariant("Active"),
        Inactive: unitVariant("Inactive"),
      });
      expect(schema.kind).toBe("enum");
      expect(schema.name).toBe("Status");
      expect(schema.variants.Active.kind).toBe("unit_variant");
    });

    it("should create enum with newtype variant", () => {
      const schema = enumType("Result", {
        Ok: newtypeVariant("Ok", u32()),
        Err: newtypeVariant("Err", string()),
      });
      expect(schema.kind).toBe("enum");
      expect(schema.variants.Ok.kind).toBe("newtype_variant");
      expect(schema.variants.Ok.inner.kind).toBe("u32");
    });

    it("should create enum with tuple variant", () => {
      const schema = enumType("Event", {
        Click: tupleVariant("Click", u32(), u32()),
        KeyPress: tupleVariant("KeyPress", char()),
      });
      expect(schema.kind).toBe("enum");
      expect(schema.variants.Click.kind).toBe("tuple_variant");
      expect(schema.variants.Click.items).toHaveLength(2);
    });

    it("should create enum with struct variant", () => {
      const schema = enumType("Shape", {
        Circle: structVariant("Circle", { radius: f64() }),
        Rectangle: structVariant("Rectangle", { width: f64(), height: f64() }),
      });
      expect(schema.kind).toBe("enum");
      expect(schema.variants.Circle.kind).toBe("struct_variant");
      expect(schema.variants.Circle.fields.radius.kind).toBe("f64");
    });

    it("should create enum with mixed variants", () => {
      const schema = enumType("Message", {
        Quit: unitVariant("Quit"),
        Echo: newtypeVariant("Echo", string()),
        Move: tupleVariant("Move", i32(), i32()),
        ChangeColor: structVariant("ChangeColor", { r: u8(), g: u8(), b: u8() }),
      });
      expect(schema.kind).toBe("enum");
      expect(Object.keys(schema.variants)).toHaveLength(4);
    });
  });
});

describe("Type inference", () => {
  it("should infer primitive types correctly", () => {
    const boolSchema = bool();
    const numSchema = u32();
    const strSchema = string();

    // These are compile-time checks, but we can verify the schema structure
    type BoolType = InferType<typeof boolSchema>;
    type NumType = InferType<typeof numSchema>;
    type StrType = InferType<typeof strSchema>;

    // Runtime verification
    expect(boolSchema.kind).toBe("bool");
    expect(numSchema.kind).toBe("u32");
    expect(strSchema.kind).toBe("string");
  });

  it("should infer struct types correctly", () => {
    const personSchema = struct({
      name: string(),
      age: u32(),
      email: option(string()),
    });

    type Person = InferType<typeof personSchema>;

    // Compile-time type check (would fail if inference is wrong)
    const _typeCheck: Person = {
      name: "Alice",
      age: 30,
      email: "alice@example.com",
    };

    expect(personSchema.kind).toBe("struct");
  });

  it("should infer seq types correctly", () => {
    const numbersSchema = seq(u32());
    type Numbers = InferType<typeof numbersSchema>;

    // Compile-time type check
    const _typeCheck: Numbers = [1, 2, 3];

    expect(numbersSchema.kind).toBe("seq");
  });

  it("should infer tuple types correctly", () => {
    const tupleSchema = tuple(string(), u32(), bool());
    type Tuple = InferType<typeof tupleSchema>;

    // Compile-time type check
    const _typeCheck: Tuple = ["test", 42, true];

    expect(tupleSchema.kind).toBe("tuple");
  });

  it("should infer enum types correctly", () => {
    const resultSchema = enumType("Result", {
      Ok: newtypeVariant("Ok", u32()),
      Err: newtypeVariant("Err", string()),
    });

    type Result = InferType<typeof resultSchema>;

    // Compile-time type checks
    const _ok: Result = { type: "Ok", value: 42 };
    const _err: Result = { type: "Err", value: "error message" };

    expect(resultSchema.kind).toBe("enum");
  });
});

describe("Schema type compatibility", () => {
  it("should allow enum schemas to be assigned to Schema type", () => {
    // This test verifies that enumType() returns a type compatible with Schema
    const enumSchema = enumType("Status", {
      Active: unitVariant("Active"),
      Inactive: unitVariant("Inactive"),
    });

    // This should not cause a type error
    const schemaVar: Schema = enumSchema;

    expect(schemaVar.kind).toBe("enum");
  });

  it("should allow enum schemas in arrays of Schema type", () => {
    // This test verifies that enum schemas can be used in arrays of Schema
    const schemas: Schema[] = [
      bool(),
      u32(),
      string(),
      enumType("Color", {
        Red: unitVariant("Red"),
        Green: unitVariant("Green"),
        Blue: unitVariant("Blue"),
      }),
      struct({ name: string() }),
    ];

    expect(schemas).toHaveLength(5);
    expect(schemas[3]?.kind).toBe("enum");
  });

  it("should allow enum schemas to be passed to functions accepting Schema", () => {
    // This test verifies that enum schemas can be passed to functions with Schema parameters
    function processSchema(schema: Schema): string {
      return schema.kind;
    }

    const enumSchema = enumType("Message", {
      Quit: unitVariant("Quit"),
      Echo: newtypeVariant("Echo", string()),
    });

    const result = processSchema(enumSchema);
    expect(result).toBe("enum");
  });

  it("should allow nested schemas with enums", () => {
    // This test verifies that enums work in nested schema contexts
    const messageSchema = enumType("Message", {
      Text: newtypeVariant("Text", string()),
      Number: newtypeVariant("Number", u32()),
    });

    // Using enum schema in a struct field
    const wrapperSchema = struct({
      id: u64(),
      message: messageSchema,
    });

    expect(wrapperSchema.kind).toBe("struct");
    expect(wrapperSchema.fields.message.kind).toBe("enum");
  });
});

describe("Generic schema type variance", () => {
  it("should allow OptionSchema to be assigned to Schema type", () => {
    const optionSchema = option(string());
    const schema: Schema = optionSchema;
    expect(schema.kind).toBe("option");
  });

  it("should allow SeqSchema to be assigned to Schema type", () => {
    const seqSchema = seq(u32());
    const schema: Schema = seqSchema;
    expect(schema.kind).toBe("seq");
  });

  it("should allow MapSchema to be assigned to Schema type", () => {
    const mapSchema = map(string(), u32());
    const schema: Schema = mapSchema;
    expect(schema.kind).toBe("map");
  });

  it("should allow StructSchema to be assigned to Schema type", () => {
    const structSchema = struct({ name: string(), age: u32() });
    const schema: Schema = structSchema;
    expect(schema.kind).toBe("struct");
  });

  it("should allow TupleSchema to be assigned to Schema type", () => {
    const tupleSchema = tuple(string(), u32(), bool());
    const schema: Schema = tupleSchema;
    expect(schema.kind).toBe("tuple");
  });

  it("should allow TupleStructSchema to be assigned to Schema type", () => {
    const tupleStructSchema = tupleStruct("Point", u32(), u32());
    const schema: Schema = tupleStructSchema;
    expect(schema.kind).toBe("tuple_struct");
  });

  it("should allow NewtypeStructSchema to be assigned to Schema type", () => {
    const newtypeSchema = newtypeStruct("UserId", u32());
    const schema: Schema = newtypeSchema;
    expect(schema.kind).toBe("newtype_struct");
  });

  it("should allow generic schemas in Schema arrays", () => {
    const schemas: Schema[] = [
      option(string()),
      seq(u32()),
      map(string(), u32()),
      struct({ x: u32() }),
      tuple(bool(), string()),
      tupleStruct("Pair", i32(), i32()),
      newtypeStruct("UserId", u64()),
    ];
    expect(schemas).toHaveLength(7);
    expect(schemas[0]?.kind).toBe("option");
    expect(schemas[1]?.kind).toBe("seq");
    expect(schemas[2]?.kind).toBe("map");
  });

  it("should allow generic schemas as function parameters", () => {
    function processSchema(schema: Schema): string {
      return schema.kind;
    }
    expect(processSchema(option(string()))).toBe("option");
    expect(processSchema(seq(u32()))).toBe("seq");
    expect(processSchema(map(string(), u32()))).toBe("map");
    expect(processSchema(struct({ x: u32() }))).toBe("struct");
  });

  it("should allow nested generic schemas", () => {
    const nested1 = option(seq(string()));
    const schema1: Schema = nested1;
    expect(schema1.kind).toBe("option");

    const nested2 = struct({
      data: seq(u32()),
      metadata: map(string(), string()),
    });
    const schema2: Schema = nested2;
    expect(schema2.kind).toBe("struct");
  });

  it("should allow InferType to work on StructSchema", () => {
    const structSchema = struct({ name: string(), age: u32() });
    type StructType = InferType<typeof structSchema>;

    const value: StructType = { name: "test", age: 5 };
    expect(value.name).toBe("test");
    expect(value.age).toBe(5);
  });

  it("should allow InferType to work on SeqSchema", () => {
    const seqSchema = seq(u32());
    type SeqType = InferType<typeof seqSchema>;

    const arr: SeqType = [1, 2, 3];
    expect(arr).toHaveLength(3);
  });

  it("should allow InferType to work on OptionSchema", () => {
    const optionSchema = option(string());
    type OptionType = InferType<typeof optionSchema>;

    const some: OptionType = "hello";
    const none: OptionType = null;
    expect(some).toBe("hello");
    expect(none).toBeNull();
  });

  it("should allow InferType to work on MapSchema", () => {
    const mapSchema = map(string(), u32());
    type MapType = InferType<typeof mapSchema>;

    const m: MapType = new Map([["a", 1], ["b", 2]]);
    expect(m.size).toBe(2);
  });

  it("should allow InferType to work on TupleSchema", () => {
    const tupleSchema = tuple(string(), u32(), bool());
    type TupleType = InferType<typeof tupleSchema>;

    const t: TupleType = ["test", 42, true];
    expect(t[0]).toBe("test");
    expect(t[1]).toBe(42);
    expect(t[2]).toBe(true);
  });

  it("should allow InferType to work on nested schemas", () => {
    const innerSchema = struct({ id: u32() });
    const outerSchema = struct({
      items: seq(innerSchema),
      metadata: map(string(), string()),
    });
    type OuterType = InferType<typeof outerSchema>;

    const value: OuterType = {
      items: [{ id: 1 }, { id: 2 }],
      metadata: new Map([["key", "value"]]),
    };
    expect(value.items).toHaveLength(2);
    expect(value.metadata.size).toBe(1);
  });
});
