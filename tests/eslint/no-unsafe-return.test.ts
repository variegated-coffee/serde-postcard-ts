/**
 * ESLint type safety tests for no-unsafe-return rule
 *
 * This file tests that deserialize() can be used in generic functions
 * that return InferType<S> without triggering ESLint warnings.
 *
 * Run with: npx eslint tests/eslint/no-unsafe-return.test.ts
 *
 * These tests should PASS (no ESLint errors) after the fix.
 * Before the fix, they will fail with @typescript-eslint/no-unsafe-return errors.
 */

import { describe, it, expect } from 'vitest';
import {
  deserialize,
  serialize,
  type InferType,
  type Schema,
  bool,
  u8,
  u32,
  string,
  option,
  seq,
  struct,
  map,
} from '../../src/index.js';

describe('ESLint no-unsafe-return compliance', () => {
  describe('Generic functions returning InferType<S>', () => {
    it('should allow returning deserialize result from generic function', () => {
      // This is the exact pattern from the issue report
      function testDeserialize<S extends Schema>(
        schema: S,
        data: Uint8Array
      ): InferType<S> {
        const result = deserialize(schema, data);
        // This line should NOT trigger: "Unsafe return of type 'any'"
        return result.value;
      }

      const data = serialize(u8(), 42);
      const value = testDeserialize(u8(), data);
      expect(value).toBe(42);
    });

    it('should allow returning option schema results', () => {
      function deserializeOptional<S extends Schema>(
        schema: S,
        data: Uint8Array
      ): InferType<S> | null {
        const optSchema = option(schema);
        const result = deserialize(optSchema, data);
        // Should not trigger ESLint error
        return result.value;
      }

      const data = serialize(option(string()), "hello");
      const value = deserializeOptional(string(), data);
      expect(value).toBe("hello");
    });

    it('should allow returning seq schema results', () => {
      function deserializeArray<S extends Schema>(
        itemSchema: S,
        data: Uint8Array
      ): InferType<S>[] {
        const seqSchema = seq(itemSchema);
        const result = deserialize(seqSchema, data);
        // Should not trigger ESLint error
        return result.value;
      }

      const data = serialize(seq(u32()), [1, 2, 3]);
      const value = deserializeArray(u32(), data);
      expect(value).toEqual([1, 2, 3]);
    });

    it('should allow returning struct schema results', () => {
      const PersonSchema = struct({
        age: u8(),
        name: string(),
      });

      function deserializePerson(data: Uint8Array): InferType<typeof PersonSchema> {
        const result = deserialize(PersonSchema, data);
        // Should not trigger ESLint error
        return result.value;
      }

      const person = { age: 30, name: "Alice" };
      const data = serialize(PersonSchema, person);
      const value = deserializePerson(data);
      expect(value).toEqual(person);
    });

    it('should allow returning map schema results', () => {
      function deserializeMap<K extends Schema, V extends Schema>(
        keySchema: K,
        valueSchema: V,
        data: Uint8Array
      ): Map<InferType<K>, InferType<V>> {
        const mapSchema = map(keySchema, valueSchema);
        const result = deserialize(mapSchema, data);
        // Should not trigger ESLint error
        return result.value;
      }

      const testMap = new Map([["a", 1], ["b", 2]]);
      const data = serialize(map(string(), u32()), testMap);
      const value = deserializeMap(string(), u32(), data);
      expect(value).toEqual(testMap);
    });
  });

  describe('Nested generic functions', () => {
    it('should allow chaining generic deserialize functions', () => {
      function innerDeserialize<S extends Schema>(
        schema: S,
        data: Uint8Array
      ): InferType<S> {
        const result = deserialize(schema, data);
        return result.value;
      }

      function outerDeserialize<S extends Schema>(
        schema: S,
        data: Uint8Array
      ): InferType<S> {
        // Should not trigger ESLint error when calling another generic function
        return innerDeserialize(schema, data);
      }

      const data = serialize(bool(), true);
      const value = outerDeserialize(bool(), data);
      expect(value).toBe(true);
    });
  });

  describe('Real-world usage patterns', () => {
    it('should work in class methods', () => {
      class DataLoader<S extends Schema> {
        constructor(private schema: S) {}

        load(data: Uint8Array): InferType<S> {
          const result = deserialize(this.schema, data);
          // Should not trigger ESLint error
          return result.value;
        }
      }

      const loader = new DataLoader(string());
      const data = serialize(string(), "test");
      const value = loader.load(data);
      expect(value).toBe("test");
    });

    it('should work with async functions', async () => {
      async function fetchAndDeserialize<S extends Schema>(
        schema: S,
        data: Uint8Array
      ): Promise<InferType<S>> {
        // Simulate async operation
        await Promise.resolve();
        const result = deserialize(schema, data);
        // Should not trigger ESLint error
        return result.value;
      }

      const data = serialize(u32(), 12345);
      const value = await fetchAndDeserialize(u32(), data);
      expect(value).toBe(12345);
    });

    it('should work with Result-style error handling', () => {
      function safeDeserialize<S extends Schema>(
        schema: S,
        data: Uint8Array
      ): { ok: true; value: InferType<S> } | { ok: false; error: string } {
        try {
          const result = deserialize(schema, data);
          // Should not trigger ESLint error
          return { ok: true, value: result.value };
        } catch (error) {
          return { ok: false, error: String(error) };
        }
      }

      const data = serialize(u8(), 255);
      const result = safeDeserialize(u8(), data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(255);
      }
    });
  });
});
