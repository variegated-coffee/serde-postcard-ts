/**
 * Tests for serialization and round-trip encoding/decoding
 */

import { describe, it, expect } from "vitest";
import {
  serialize,
  trySerialize,
  SerializeError,
  deserialize,
  bool,
  i8,
  i16,
  i32,
  i64,
  i128,
  u8,
  u16,
  u32,
  u64,
  u128,
  f32,
  f64,
  string,
  bytes,
  char,
  option,
  seq,
  tuple,
  struct,
  enumType,
  unit,
  unitStruct,
  unitVariant,
  newtypeStruct,
  newtypeVariant,
  tupleStruct,
  tupleVariant,
  structVariant,
  map,
} from "../../src/index.js";

describe("Serialization", () => {
  describe("Primitives", () => {
    it("should serialize bool", () => {
      const schema = bool();
      const result = serialize(schema, true);
      expect(result).toEqual(new Uint8Array([0x01]));
    });

    it("should serialize u8", () => {
      const schema = u8();
      const result = serialize(schema, 255);
      expect(result).toEqual(new Uint8Array([0xff]));
    });

    it("should serialize i8", () => {
      const schema = i8();
      const result = serialize(schema, -1);
      expect(result).toEqual(new Uint8Array([0xff]));
    });

    it("should serialize string", () => {
      const schema = string();
      const result = serialize(schema, "Hello");
      // Length (5) + "Hello"
      expect(result).toEqual(new Uint8Array([0x05, 0x48, 0x65, 0x6c, 0x6c, 0x6f]));
    });

    it("should serialize empty string", () => {
      const schema = string();
      const result = serialize(schema, "");
      expect(result).toEqual(new Uint8Array([0x00]));
    });
  });

  describe("Round-trip tests", () => {
    it("should round-trip bool values", () => {
      const schema = bool();
      const original = true;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
    });

    it("should round-trip i32 values", () => {
      const schema = i32();
      const original = -42;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
    });

    it("should round-trip u32 values", () => {
      const schema = u32();
      const original = 12345;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
    });

    it("should round-trip i64 values", () => {
      const schema = i64();
      const original = -10000000000n;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
    });

    it("should round-trip f32 values", () => {
      const schema = f32();
      const original = -32.005859375;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBeCloseTo(original, 6);
    });

    it("should round-trip f64 values", () => {
      const schema = f64();
      const original = -32.005859375;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
    });

    it("should round-trip string values", () => {
      const schema = string();
      const original = "Hello, postcard!";
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
    });

    it("should round-trip char values", () => {
      const schema = char();
      const original = "🦀";
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
    });

    it("should round-trip bytes values", () => {
      const schema = bytes();
      const original = new Uint8Array([1, 2, 3, 4, 5]);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
    });

    it("should round-trip option Some", () => {
      const schema = option(u32());
      const original = 12345;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
    });

    it("should round-trip option None", () => {
      const schema = option(u32());
      const original = null;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(null);
    });

    it("should round-trip seq/array", () => {
      const schema = seq(u8());
      const original = [1, 2, 3, 4, 5];
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
    });

    it("should round-trip empty seq", () => {
      const schema = seq(u8());
      const original: number[] = [];
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
    });

    it("should round-trip tuple", () => {
      const schema = tuple(u32(), string(), bool());
      const original = [42, "test", true] as const;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual([42, "test", true]);
    });

    it("should round-trip struct", () => {
      const schema = struct({
        name: string(),
        age: u32(),
        email: option(string()),
      });
      const original = {
        name: "Alice",
        age: 30,
        email: "alice@example.com",
      };
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
    });

    it("should round-trip enum unit variant", () => {
      const schema = enumType("Message", {
        Quit: unitVariant("Quit"),
      });
      const original = { type: "Quit" as const };
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value.type).toBe("Quit");
    });

    it("should round-trip enum newtype variant", () => {
      const schema = enumType("Message", {
        Echo: newtypeVariant("Echo", string()),
      });
      const original = { type: "Echo" as const, value: "hello" };
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual({ type: "Echo", value: "hello" });
    });

    it("should round-trip enum tuple variant", () => {
      const schema = enumType("Message", {
        Move: tupleVariant("Move", i32(), i32()),
      });
      const original = { type: "Move" as const, value: [10, 20] as const };
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual({ type: "Move", value: [10, 20] });
    });

    it("should round-trip enum struct variant", () => {
      const schema = enumType("Message", {
        ChangeColor: structVariant("ChangeColor", {
          r: u8(),
          g: u8(),
          b: u8(),
        }),
      });
      const original = { type: "ChangeColor" as const, value: { r: 255, g: 0, b: 0 } };
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual({ type: "ChangeColor", value: { r: 255, g: 0, b: 0 } });
    });

    it("should round-trip complex nested structure", () => {
      const schema = struct({
        id: u64(),
        name: string(),
        tags: seq(string()),
        metadata: option(struct({
          created: u32(),
          updated: u32(),
        })),
      });

      const original = {
        id: 12345n,
        name: "Item",
        tags: ["tag1", "tag2", "tag3"],
        metadata: {
          created: 1000,
          updated: 2000,
        },
      };

      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
    });
  });

  describe("Error handling", () => {
    it("should return error for invalid value type", () => {
      const schema = u8();
      const result = trySerialize(schema, -1); // u8 can't be negative
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
      }
    });

    it("should throw for invalid value with throwing API", () => {
      const schema = u8();
      expect(() => serialize(schema, 256)).toThrow(SerializeError);
    });
  });

  describe("Missing type tests - Map", () => {
    it("should round-trip empty map", () => {
      const schema = map(string(), u32());
      const original = new Map<string, number>();
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
    });

    it("should round-trip single entry map", () => {
      const schema = map(string(), u32());
      const original = new Map([["key1", 100]]);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
    });

    it("should round-trip multi-entry map", () => {
      const schema = map(string(), u32());
      const original = new Map([
        ["alice", 100],
        ["bob", 200],
        ["charlie", 300],
      ]);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value.size).toBe(3);
      expect(deserialized.value.get("alice")).toBe(100);
      expect(deserialized.value.get("bob")).toBe(200);
      expect(deserialized.value.get("charlie")).toBe(300);
    });

    it("should round-trip map with complex keys", () => {
      const schema = map(u32(), string());
      const original = new Map([
        [1, "one"],
        [2, "two"],
        [3, "three"],
      ]);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
    });

    it("should round-trip map with complex values", () => {
      const valueSchema = struct({
        x: i32(),
        y: i32(),
      });
      const schema = map(string(), valueSchema);
      const original = new Map([
        ["point1", { x: 10, y: 20 }],
        ["point2", { x: 30, y: 40 }],
      ]);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value.size).toBe(2);
      expect(deserialized.value.get("point1")).toEqual({ x: 10, y: 20 });
      expect(deserialized.value.get("point2")).toEqual({ x: 30, y: 40 });
    });

    it("should round-trip map with nested structures", () => {
      const schema = map(string(), option(seq(u8())));
      const original = new Map([
        ["data1", [1, 2, 3]],
        ["data2", null],
        ["data3", [4, 5, 6, 7]],
      ]);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value.get("data1")).toEqual([1, 2, 3]);
      expect(deserialized.value.get("data2")).toBe(null);
      expect(deserialized.value.get("data3")).toEqual([4, 5, 6, 7]);
    });
  });

  describe("Missing type tests - Unit types", () => {
    it("should serialize unit to empty array", () => {
      const schema = unit();
      const serialized = serialize(schema, undefined);
      expect(serialized).toEqual(new Uint8Array([]));
      expect(serialized.length).toBe(0);
    });

    it("should round-trip unit", () => {
      const schema = unit();
      const serialized = serialize(schema, undefined);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(undefined);
    });

    it("should serialize unitStruct to empty array", () => {
      const schema = unitStruct("EmptyStruct");
      const serialized = serialize(schema, {});
      expect(serialized).toEqual(new Uint8Array([]));
      expect(serialized.length).toBe(0);
    });

    it("should round-trip unitStruct", () => {
      const schema = unitStruct("EmptyStruct");
      const original = {};
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual({});
    });
  });

  describe("Missing type tests - Newtype struct", () => {
    it("should round-trip newtypeStruct with primitive inner", () => {
      const schema = newtypeStruct("UserId", u64());
      const original = 987654321n;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
    });

    it("should round-trip newtypeStruct with string inner", () => {
      const schema = newtypeStruct("Username", string());
      const original = "alice123";
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
    });

    it("should round-trip newtypeStruct with complex inner", () => {
      const innerSchema = struct({
        x: i32(),
        y: i32(),
      });
      const schema = newtypeStruct("Point", innerSchema);
      const original = { x: 10, y: 20 };
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
    });

    it("should verify newtypeStruct has no wrapper bytes", () => {
      const schema = newtypeStruct("UserId", u32());
      const serialized = serialize(schema, 12345);
      // Should be same as serializing u32 directly
      const directSerialized = serialize(u32(), 12345);
      expect(serialized).toEqual(directSerialized);
    });
  });

  describe("Missing type tests - Tuple struct", () => {
    it("should round-trip tupleStruct with various fields", () => {
      const schema = tupleStruct("RGB", u8(), u8(), u8());
      const original = [255, 128, 0] as const;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual([255, 128, 0]);
    });

    it("should round-trip tupleStruct with mixed types", () => {
      const schema = tupleStruct("Person", string(), u32(), bool());
      const original = ["Alice", 30, true] as const;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(["Alice", 30, true]);
    });

    it("should round-trip empty tupleStruct", () => {
      const schema = tupleStruct("Empty");
      const original = [] as const;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual([]);
    });

    it("should round-trip tupleStruct with many fields", () => {
      const schema = tupleStruct("Data", u8(), u16(), u32(), u64(), string());
      const original = [1, 256, 70000, 10000000000n, "test"] as const;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual([1, 256, 70000, 10000000000n, "test"]);
    });

    it("should round-trip tupleStruct with nested structures", () => {
      const innerSchema = struct({ a: u32(), b: u32() });
      const schema = tupleStruct("Pair", innerSchema, innerSchema);
      const original = [{ a: 10, b: 20 }, { a: 30, b: 40 }] as const;
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual([{ a: 10, b: 20 }, { a: 30, b: 40 }]);
    });
  });

  describe("Boundary value tests", () => {
    it("should round-trip u16 boundary values", () => {
      const schema = u16();
      const values = [0, 127, 128, 255, 256, 16383, 16384, 32767, 65535];
      for (const value of values) {
        const serialized = serialize(schema, value);
        const deserialized = deserialize(schema, serialized);
        expect(deserialized.value).toBe(value);
      }
    });

    it("should round-trip i16 boundary values", () => {
      const schema = i16();
      const values = [-32768, -128, -1, 0, 1, 127, 128, 32767];
      for (const value of values) {
        const serialized = serialize(schema, value);
        const deserialized = deserialize(schema, serialized);
        expect(deserialized.value).toBe(value);
      }
    });

    it("should round-trip u32 boundary values", () => {
      const schema = u32();
      const values = [0, 127, 128, 16383, 16384, 2097151, 2097152, 268435455, 268435456, 4294967295];
      for (const value of values) {
        const serialized = serialize(schema, value);
        const deserialized = deserialize(schema, serialized);
        expect(deserialized.value).toBe(value);
      }
    });

    it("should round-trip i32 boundary values", () => {
      const schema = i32();
      const values = [-2147483648, -100000, -1, 0, 1, 100000, 2147483647];
      for (const value of values) {
        const serialized = serialize(schema, value);
        const deserialized = deserialize(schema, serialized);
        expect(deserialized.value).toBe(value);
      }
    });

    it("should round-trip u64 boundary values", () => {
      const schema = u64();
      const values = [0n, 127n, 128n, 16383n, 16384n, 10000000000n, 18446744073709551615n];
      for (const value of values) {
        const serialized = serialize(schema, value);
        const deserialized = deserialize(schema, serialized);
        expect(deserialized.value).toBe(value);
      }
    });

    it("should round-trip i64 boundary values", () => {
      const schema = i64();
      const values = [-9223372036854775808n, -10000000000n, -1n, 0n, 1n, 10000000000n, 9223372036854775807n];
      for (const value of values) {
        const serialized = serialize(schema, value);
        const deserialized = deserialize(schema, serialized);
        expect(deserialized.value).toBe(value);
      }
    });

    it("should round-trip u128 boundary values", () => {
      const schema = u128();
      const values = [
        0n,
        127n,
        128n,
        16383n,
        16384n,
        123456789012345678901234567890n,
        340282366920938463463374607431768211455n,
      ];
      for (const value of values) {
        const serialized = serialize(schema, value);
        const deserialized = deserialize(schema, serialized);
        expect(deserialized.value).toBe(value);
      }
    });

    it("should round-trip i128 boundary values", () => {
      const schema = i128();
      const values = [
        -123456789012345678901234567890n,
        -1n,
        0n,
        1n,
        123456789012345678901234567890n,
      ];
      for (const value of values) {
        const serialized = serialize(schema, value);
        const deserialized = deserialize(schema, serialized);
        expect(deserialized.value).toBe(value);
      }
    });

    it("should round-trip f32 special values", () => {
      const schema = f32();
      const serialized1 = serialize(schema, Infinity);
      const deserialized1 = deserialize(schema, serialized1);
      expect(deserialized1.value).toBe(Infinity);

      const serialized2 = serialize(schema, -Infinity);
      const deserialized2 = deserialize(schema, serialized2);
      expect(deserialized2.value).toBe(-Infinity);

      const serialized3 = serialize(schema, NaN);
      const deserialized3 = deserialize(schema, serialized3);
      expect(deserialized3.value).toBeNaN();

      const serialized4 = serialize(schema, -0.0);
      const deserialized4 = deserialize(schema, serialized4);
      // -0.0 should maintain sign bit
      expect(Object.is(deserialized4.value, -0.0)).toBe(true);
    });

    it("should round-trip f64 special values", () => {
      const schema = f64();
      const serialized1 = serialize(schema, Infinity);
      const deserialized1 = deserialize(schema, serialized1);
      expect(deserialized1.value).toBe(Infinity);

      const serialized2 = serialize(schema, -Infinity);
      const deserialized2 = deserialize(schema, serialized2);
      expect(deserialized2.value).toBe(-Infinity);

      const serialized3 = serialize(schema, NaN);
      const deserialized3 = deserialize(schema, serialized3);
      expect(deserialized3.value).toBeNaN();

      const serialized4 = serialize(schema, -0.0);
      const deserialized4 = deserialize(schema, serialized4);
      expect(Object.is(deserialized4.value, -0.0)).toBe(true);
    });
  });

  describe("Error condition tests", () => {
    it("should error on i8 underflow", () => {
      const schema = i8();
      const result = trySerialize(schema, -129);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
        expect(result.error.message).toContain("out of range");
      }
    });

    it("should error on i8 overflow", () => {
      const schema = i8();
      const result = trySerialize(schema, 128);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
        expect(result.error.message).toContain("out of range");
      }
    });

    it("should error on u16 overflow", () => {
      const schema = u16();
      const result = trySerialize(schema, 65536);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
        expect(result.error.message).toContain("out of range");
      }
    });

    it("should error on u16 negative value", () => {
      const schema = u16();
      const result = trySerialize(schema, -1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
      }
    });

    it("should error on i16 overflow", () => {
      const schema = i16();
      const result = trySerialize(schema, 32768);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
      }
    });

    it("should error on i16 underflow", () => {
      const schema = i16();
      const result = trySerialize(schema, -32769);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
      }
    });

    it("should error on char with multiple codepoints", () => {
      const schema = char();
      const result = trySerialize(schema, "ab");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
        expect(result.error.message).toContain("Unicode scalar value");
      }
    });

    it("should error on char with empty string", () => {
      const schema = char();
      const result = trySerialize(schema, "");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
        expect(result.error.message).toContain("Unicode scalar value");
      }
    });

    it("should handle seq with non-array gracefully", () => {
      const schema = seq(u8());
      const result = trySerialize(schema, "not an array" as any);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
      }
    });

    it("should handle map with non-Map gracefully", () => {
      const schema = map(string(), u32());
      const result = trySerialize(schema, "not a map" as any);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
      }
    });

    it("should handle struct with missing fields gracefully", () => {
      const schema = struct({
        name: string(),
        age: u32(),
      });
      const result = trySerialize(schema, { name: "Alice" } as any);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
      }
    });

    it("should handle tuple with wrong arity", () => {
      const schema = tuple(u32(), string());
      const result = trySerialize(schema, [42] as any);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(SerializeError);
      }
    });

    it("should throw errors with throwing API", () => {
      const schema = i8();
      expect(() => serialize(schema, -129)).toThrow(SerializeError);
      expect(() => serialize(schema, 128)).toThrow(SerializeError);
    });

    it("should validate error messages contain useful info", () => {
      const schema = u8();
      const result = trySerialize(schema, 256);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("256");
        expect(result.error.message).toContain("out of range");
      }
    });
  });

  describe("Multi-variant enum tests", () => {
    it("should round-trip enum with all 4 variant types", () => {
      const schema = enumType("ComplexMessage", {
        Quit: unitVariant("Quit"),
        Echo: newtypeVariant("Echo", string()),
        Move: tupleVariant("Move", i32(), i32()),
        SetColor: structVariant("SetColor", {
          r: u8(),
          g: u8(),
          b: u8(),
        }),
      });

      // Test unit variant
      const msg1 = { type: "Quit" as const };
      const ser1 = serialize(schema, msg1);
      const deser1 = deserialize(schema, ser1);
      expect(deser1.value.type).toBe("Quit");

      // Test newtype variant
      const msg2 = { type: "Echo" as const, value: "hello" };
      const ser2 = serialize(schema, msg2);
      const deser2 = deserialize(schema, ser2);
      expect(deser2.value).toEqual({ type: "Echo", value: "hello" });

      // Test tuple variant
      const msg3 = { type: "Move" as const, value: [10, 20] as const };
      const ser3 = serialize(schema, msg3);
      const deser3 = deserialize(schema, ser3);
      expect(deser3.value).toEqual({ type: "Move", value: [10, 20] });

      // Test struct variant
      const msg4 = { type: "SetColor" as const, value: { r: 255, g: 128, b: 0 } };
      const ser4 = serialize(schema, msg4);
      const deser4 = deserialize(schema, ser4);
      expect(deser4.value).toEqual({ type: "SetColor", value: { r: 255, g: 128, b: 0 } });
    });

    it("should serialize enum discriminants in order", () => {
      const schema = enumType("Ordered", {
        First: unitVariant("First"),
        Second: unitVariant("Second"),
        Third: unitVariant("Third"),
      });

      // First variant should have discriminant 0
      const ser1 = serialize(schema, { type: "First" });
      expect(ser1[0]).toBe(0x00);

      // Second variant should have discriminant 1
      const ser2 = serialize(schema, { type: "Second" });
      expect(ser2[0]).toBe(0x01);

      // Third variant should have discriminant 2
      const ser3 = serialize(schema, { type: "Third" });
      expect(ser3[0]).toBe(0x02);
    });

    it("should round-trip enum with multiple variants of same type", () => {
      const schema = enumType("MultiNewtype", {
        Name: newtypeVariant("Name", string()),
        Email: newtypeVariant("Email", string()),
        Phone: newtypeVariant("Phone", string()),
      });

      const msg1 = { type: "Name" as const, value: "Alice" };
      const ser1 = serialize(schema, msg1);
      const deser1 = deserialize(schema, ser1);
      expect(deser1.value).toEqual({ type: "Name", value: "Alice" });

      const msg2 = { type: "Email" as const, value: "alice@example.com" };
      const ser2 = serialize(schema, msg2);
      const deser2 = deserialize(schema, ser2);
      expect(deser2.value).toEqual({ type: "Email", value: "alice@example.com" });

      const msg3 = { type: "Phone" as const, value: "+1234567890" };
      const ser3 = serialize(schema, msg3);
      const deser3 = deserialize(schema, ser3);
      expect(deser3.value).toEqual({ type: "Phone", value: "+1234567890" });
    });

    it("should round-trip nested enums", () => {
      const innerEnum = enumType("Inner", {
        A: unitVariant("A"),
        B: newtypeVariant("B", u32()),
      });

      const outerEnum = enumType("Outer", {
        Left: newtypeVariant("Left", innerEnum),
        Right: unitVariant("Right"),
      });

      const msg1 = { type: "Left" as const, value: { type: "A" as const } };
      const ser1 = serialize(outerEnum, msg1);
      const deser1 = deserialize(outerEnum, ser1);
      expect(deser1.value).toEqual({ type: "Left", value: { type: "A" } });

      const msg2 = { type: "Left" as const, value: { type: "B" as const, value: 42 } };
      const ser2 = serialize(outerEnum, msg2);
      const deser2 = deserialize(outerEnum, ser2);
      expect(deser2.value).toEqual({ type: "Left", value: { type: "B", value: 42 } });
    });

    it("should round-trip enum with complex nested structures", () => {
      const schema = enumType("Event", {
        Click: tupleVariant("Click", i32(), i32()),
        KeyPress: newtypeVariant("KeyPress", char()),
        Resize: structVariant("Resize", {
          width: u32(),
          height: u32(),
        }),
        Data: newtypeVariant("Data", seq(u8())),
      });

      const event1 = { type: "Click" as const, value: [100, 200] as const };
      const ser1 = serialize(schema, event1);
      const deser1 = deserialize(schema, ser1);
      expect(deser1.value).toEqual({ type: "Click", value: [100, 200] });

      const event2 = { type: "KeyPress" as const, value: "A" };
      const ser2 = serialize(schema, event2);
      const deser2 = deserialize(schema, ser2);
      expect(deser2.value).toEqual({ type: "KeyPress", value: "A" });

      const event3 = { type: "Resize" as const, value: { width: 1920, height: 1080 } };
      const ser3 = serialize(schema, event3);
      const deser3 = deserialize(schema, ser3);
      expect(deser3.value).toEqual({ type: "Resize", value: { width: 1920, height: 1080 } });

      const event4 = { type: "Data" as const, value: [1, 2, 3, 4, 5] };
      const ser4 = serialize(schema, event4);
      const deser4 = deserialize(schema, ser4);
      expect(deser4.value).toEqual({ type: "Data", value: [1, 2, 3, 4, 5] });
    });
  });
});
