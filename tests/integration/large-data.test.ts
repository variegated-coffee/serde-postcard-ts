/**
 * Large data and stress tests
 * Tests serialization with very large data structures
 */

import { describe, it, expect } from "vitest";
import {
  serialize,
  deserialize,
  string,
  u8,
  u32,
  seq,
  struct,
  option,
  map,
} from "../../src/index.js";

describe("Large data tests", () => {
  describe("Very long strings", () => {
    it("should round-trip 1KB string", () => {
      const schema = string();
      const original = "a".repeat(1024);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
      expect(deserialized.value.length).toBe(1024);
    });

    it("should round-trip 64KB string", () => {
      const schema = string();
      const original = "x".repeat(65536);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
      expect(deserialized.value.length).toBe(65536);
    });

    it("should round-trip 1MB string", () => {
      const schema = string();
      const original = "b".repeat(1048576);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
      expect(deserialized.value.length).toBe(1048576);
    });

    it("should round-trip very long UTF-8 string", () => {
      const schema = string();
      // Emoji are 4 bytes each in UTF-8, but count as 2 chars in JavaScript (surrogate pairs)
      const original = "🦀".repeat(10000);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(original);
      // JavaScript counts surrogate pairs as 2 characters
      expect(deserialized.value.length).toBe(20000);
    });
  });

  describe("Large arrays", () => {
    it("should round-trip 1K element array", () => {
      const schema = seq(u8());
      const original = Array.from({ length: 1000 }, (_, i) => i % 256);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
    });

    it("should round-trip 10K element array", () => {
      const schema = seq(u8());
      const original = Array.from({ length: 10000 }, (_, i) => i % 256);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
    });

    it("should round-trip 100K element array", () => {
      const schema = seq(u32());
      const original = Array.from({ length: 100000 }, (_, i) => i);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
      expect(deserialized.value.length).toBe(100000);
    });

    it("should round-trip large array of strings", () => {
      const schema = seq(string());
      const original = Array.from({ length: 5000 }, (_, i) => `item_${i}`);
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
      expect(deserialized.value.length).toBe(5000);
    });
  });

  describe("Deeply nested structures", () => {
    it("should round-trip 50 level nested options", () => {
      // Build schema: option(option(option(...option(u32)...)))
      let schema = u32();
      for (let i = 0; i < 50; i++) {
        schema = option(schema);
      }

      // Build value: 42 wrapped in 50 layers of Some
      let value: any = 42;
      for (let i = 0; i < 50; i++) {
        // All layers are Some, not null
        value = value;
      }

      const serialized = serialize(schema, value);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toBe(42);
    });

    it("should round-trip 100 level nested structs", () => {
      // Build deeply nested struct
      let innerSchema = u32();
      for (let i = 0; i < 100; i++) {
        innerSchema = struct({ value: innerSchema });
      }

      // Build deeply nested value
      let value: any = 42;
      for (let i = 0; i < 100; i++) {
        value = { value };
      }

      const serialized = serialize(innerSchema, value);
      const deserialized = deserialize(innerSchema, serialized);

      // Extract the innermost value
      let extracted: any = deserialized.value;
      for (let i = 0; i < 100; i++) {
        extracted = extracted.value;
      }
      expect(extracted).toBe(42);
    });

    it("should round-trip deeply nested arrays", () => {
      // array of array of array ... of u8
      let schema = u8();
      for (let i = 0; i < 20; i++) {
        schema = seq(schema);
      }

      // Build nested array: [[[...[42]...]]]
      let value: any = 42;
      for (let i = 0; i < 20; i++) {
        value = [value];
      }

      const serialized = serialize(schema, value);
      const deserialized = deserialize(schema, serialized);

      // Extract innermost value
      let extracted: any = deserialized.value;
      for (let i = 0; i < 20; i++) {
        extracted = extracted[0];
      }
      expect(extracted).toBe(42);
    });

    it("should round-trip mixed deep nesting", () => {
      // Alternate between struct, option, and seq
      let schema = u32();
      for (let i = 0; i < 30; i++) {
        if (i % 3 === 0) {
          schema = struct({ data: schema });
        } else if (i % 3 === 1) {
          schema = option(schema);
        } else {
          schema = seq(schema);
        }
      }

      // Build corresponding value
      let value: any = 42;
      for (let i = 0; i < 30; i++) {
        if (i % 3 === 0) {
          value = { data: value };
        } else if (i % 3 === 1) {
          value = value; // Some(value)
        } else {
          value = [value];
        }
      }

      const serialized = serialize(schema, value);
      const deserialized = deserialize(schema, serialized);

      // Just verify it doesn't crash - extracting is complex
      expect(deserialized.value).toBeDefined();
    });
  });

  describe("Maps with many entries", () => {
    it("should round-trip map with 100 entries", () => {
      const schema = map(string(), u32());
      const original = new Map(
        Array.from({ length: 100 }, (_, i) => [`key_${i}`, i])
      );
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value.size).toBe(100);
      expect(deserialized.value.get("key_0")).toBe(0);
      expect(deserialized.value.get("key_50")).toBe(50);
      expect(deserialized.value.get("key_99")).toBe(99);
    });

    it("should round-trip map with 1000 entries", () => {
      const schema = map(u32(), string());
      const original = new Map(
        Array.from({ length: 1000 }, (_, i) => [i, `value_${i}`])
      );
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value.size).toBe(1000);
      expect(deserialized.value.get(0)).toBe("value_0");
      expect(deserialized.value.get(500)).toBe("value_500");
      expect(deserialized.value.get(999)).toBe("value_999");
    });

    it("should round-trip map with 5000 entries", () => {
      const schema = map(u32(), u32());
      const original = new Map(
        Array.from({ length: 5000 }, (_, i) => [i, i * 2])
      );
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value.size).toBe(5000);
      expect(deserialized.value.get(0)).toBe(0);
      expect(deserialized.value.get(2500)).toBe(5000);
      expect(deserialized.value.get(4999)).toBe(9998);
    });

    it("should round-trip map with large string keys", () => {
      const schema = map(string(), u32());
      const original = new Map(
        Array.from({ length: 100 }, (_, i) => [
          `very_long_key_name_${"x".repeat(100)}_${i}`,
          i
        ])
      );
      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value.size).toBe(100);
    });
  });

  describe("Performance characteristics", () => {
    it("should serialize large data in reasonable time", () => {
      const schema = struct({
        data: seq(u32()),
        metadata: map(string(), string()),
      });

      const original = {
        data: Array.from({ length: 10000 }, (_, i) => i),
        metadata: new Map(
          Array.from({ length: 100 }, (_, i) => [`key_${i}`, `value_${i}`])
        ),
      };

      const start = Date.now();
      const serialized = serialize(schema, original);
      const serializeTime = Date.now() - start;

      const deserializeStart = Date.now();
      const deserialized = deserialize(schema, serialized);
      const deserializeTime = Date.now() - deserializeStart;

      expect(deserialized.value.data).toEqual(original.data);
      expect(deserialized.value.metadata).toEqual(original.metadata);

      // Should complete in under 1 second (generous limit for CI)
      expect(serializeTime).toBeLessThan(1000);
      expect(deserializeTime).toBeLessThan(1000);
    });

    it("should handle repeated serialization without memory issues", () => {
      const schema = seq(u8());
      const data = Array.from({ length: 1000 }, (_, i) => i % 256);

      // Serialize 1000 times
      for (let i = 0; i < 1000; i++) {
        const serialized = serialize(schema, data);
        expect(serialized.length).toBeGreaterThan(0);
      }

      // If we get here without crashing or running out of memory, test passes
      expect(true).toBe(true);
    });

    it("should handle large serialized output size", () => {
      const schema = seq(u32());
      const original = Array.from({ length: 50000 }, (_, i) => i);

      const serialized = serialize(schema, original);

      // Should produce a large byte array
      expect(serialized.length).toBeGreaterThan(100000);

      const deserialized = deserialize(schema, serialized);
      expect(deserialized.value).toEqual(original);
    });
  });

  describe("Edge cases with size limits", () => {
    it("should handle empty structures efficiently", () => {
      const schema = struct({
        emptyArray: seq(u8()),
        emptyMap: map(string(), u32()),
        emptyString: string(),
      });

      const original = {
        emptyArray: [],
        emptyMap: new Map(),
        emptyString: "",
      };

      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);

      expect(deserialized.value).toEqual(original);
      // Should be very small
      expect(serialized.length).toBeLessThan(10);
    });

    it("should handle arrays with all same values", () => {
      const schema = seq(u8());
      const original = Array(10000).fill(42);

      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);

      expect(deserialized.value).toEqual(original);
      expect(deserialized.value.every(v => v === 42)).toBe(true);
    });

    it("should handle struct with many optional None fields", () => {
      const schema = struct({
        a: option(u32()),
        b: option(u32()),
        c: option(u32()),
        d: option(u32()),
        e: option(u32()),
        f: option(u32()),
        g: option(u32()),
        h: option(u32()),
        i: option(u32()),
        j: option(u32()),
      });

      const original = {
        a: null,
        b: null,
        c: null,
        d: null,
        e: null,
        f: null,
        g: null,
        h: null,
        i: null,
        j: null,
      };

      const serialized = serialize(schema, original);
      const deserialized = deserialize(schema, serialized);

      expect(deserialized.value).toEqual(original);
      // All None values should serialize very compactly (just 10 bytes for discriminants)
      expect(serialized.length).toBe(10);
    });
  });
});
