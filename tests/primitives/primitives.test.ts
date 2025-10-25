/**
 * Tests for primitive deserializers
 */

import { describe, it, expect } from "vitest";
import {
  decodeBool,
  tryDecodeBool,
  BoolDecodeError,
} from "../../src/primitives/bool.js";
import {
  decodeU8,
  decodeI8,
  decodeF32,
  decodeF64,
} from "../../src/primitives/numbers.js";
import {
  decodeString,
  decodeChar,
} from "../../src/primitives/string.js";
import {
  decodeBytes,
} from "../../src/primitives/bytes.js";

describe("Primitive deserializers", () => {
  describe("Bool", () => {
    it("should decode false (0x00)", () => {
      const data = new Uint8Array([0x00]);
      const result = decodeBool(data);
      expect(result.value).toBe(false);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode true (0x01)", () => {
      const data = new Uint8Array([0x01]);
      const result = decodeBool(data);
      expect(result.value).toBe(true);
      expect(result.bytesRead).toBe(1);
    });

    it("should reject invalid boolean value", () => {
      const data = new Uint8Array([0x02]);
      const result = tryDecodeBool(data);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(BoolDecodeError);
      }
    });
  });

  describe("Numbers", () => {
    it("should decode u8", () => {
      const data = new Uint8Array([0xff]);
      const result = decodeU8(data);
      expect(result.value).toBe(255);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode i8 positive", () => {
      const data = new Uint8Array([0x7f]);
      const result = decodeI8(data);
      expect(result.value).toBe(127);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode i8 negative", () => {
      const data = new Uint8Array([0xff]);
      const result = decodeI8(data);
      expect(result.value).toBe(-1);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode f32", () => {
      // -32.005859375f32 = 0xc2000600 in little-endian
      const data = new Uint8Array([0x00, 0x06, 0x00, 0xc2]);
      const result = decodeF32(data);
      expect(result.value).toBeCloseTo(-32.005859375, 6);
      expect(result.bytesRead).toBe(4);
    });

    it("should decode f64", () => {
      // -32.005859375f64 = 0xc04000c000000000 in little-endian
      const data = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0xc0, 0x00, 0x40, 0xc0]);
      const result = decodeF64(data);
      expect(result.value).toBe(-32.005859375);
      expect(result.bytesRead).toBe(8);
    });
  });

  describe("String", () => {
    it("should decode empty string", () => {
      const data = new Uint8Array([0x00]); // length 0
      const result = decodeString(data);
      expect(result.value).toBe("");
      expect(result.bytesRead).toBe(1);
    });

    it("should decode ASCII string", () => {
      const data = new Uint8Array([
        0x05, // length 5
        0x48, 0x65, 0x6c, 0x6c, 0x6f, // "Hello"
      ]);
      const result = decodeString(data);
      expect(result.value).toBe("Hello");
      expect(result.bytesRead).toBe(6);
    });

    it("should decode UTF-8 string with emoji", () => {
      const data = new Uint8Array([
        0x04, // length 4 bytes
        0xf0, 0x9f, 0xa6, 0x80, // 🦀 crab emoji
      ]);
      const result = decodeString(data);
      expect(result.value).toBe("🦀");
      expect(result.bytesRead).toBe(5);
    });

    it("should decode char (single code point)", () => {
      const data = new Uint8Array([
        0x04, // length 4 bytes
        0xf0, 0x9f, 0xa6, 0x80, // 🦀
      ]);
      const result = decodeChar(data);
      expect(result.value).toBe("🦀");
      expect(result.bytesRead).toBe(5);
    });
  });

  describe("Bytes", () => {
    it("should decode empty byte array", () => {
      const data = new Uint8Array([0x00]); // length 0
      const result = decodeBytes(data);
      expect(result.value).toEqual(new Uint8Array([]));
      expect(result.bytesRead).toBe(1);
    });

    it("should decode byte array", () => {
      const data = new Uint8Array([
        0x05, // length 5
        0x01, 0x02, 0x03, 0x04, 0x05,
      ]);
      const result = decodeBytes(data);
      expect(result.value).toEqual(new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]));
      expect(result.bytesRead).toBe(6);
    });
  });

  describe("Offset handling", () => {
    it("should decode from offset", () => {
      const data = new Uint8Array([0xff, 0xff, 0x01, 0x00]); // garbage, then true at offset 2
      const result = decodeBool(data, 2);
      expect(result.value).toBe(true);
      expect(result.bytesRead).toBe(1);
    });
  });
});
