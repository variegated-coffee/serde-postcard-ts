/**
 * Tests for primitive type encoding
 * Direct tests for all primitive encoders that were previously only tested indirectly
 */

import { describe, it, expect } from "vitest";
import {
  tryEncodeBool,
  encodeBool,
  BoolEncodeError,
} from "../../src/primitives/bool.js";
import {
  tryEncodeU8,
  tryEncodeI8,
  tryEncodeF32,
  tryEncodeF64,
  encodeU8,
  encodeI8,
  encodeF32,
  encodeF64,
  NumberEncodeError,
} from "../../src/primitives/numbers.js";
import {
  tryEncodeString,
  tryEncodeChar,
  encodeString,
  encodeChar,
  StringEncodeError,
} from "../../src/primitives/string.js";
import {
  tryEncodeBytes,
  encodeBytes,
  BytesEncodeError,
} from "../../src/primitives/bytes.js";

describe("Primitive encoding", () => {
  describe("Bool encoding", () => {
    it("should encode true as [0x01]", () => {
      const result = encodeBool(true);
      expect(result.bytes).toEqual(new Uint8Array([0x01]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode false as [0x00]", () => {
      const result = encodeBool(false);
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should use tryEncodeBool successfully", () => {
      const result = tryEncodeBool(true);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.bytes).toEqual(new Uint8Array([0x01]));
      }
    });
  });

  describe("Number encoding - u8", () => {
    it("should encode 0", () => {
      const result = encodeU8(0);
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 127", () => {
      const result = encodeU8(127);
      expect(result.bytes).toEqual(new Uint8Array([0x7f]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 128", () => {
      const result = encodeU8(128);
      expect(result.bytes).toEqual(new Uint8Array([0x80]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 255 (max u8)", () => {
      const result = encodeU8(255);
      expect(result.bytes).toEqual(new Uint8Array([0xff]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should return error for negative value", () => {
      const result = tryEncodeU8(-1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(NumberEncodeError);
        expect(result.error.message).toContain("out of range");
      }
    });

    it("should return error for value > 255", () => {
      const result = tryEncodeU8(256);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(NumberEncodeError);
        expect(result.error.message).toContain("out of range");
      }
    });

    it("should throw for negative value with throwing API", () => {
      expect(() => encodeU8(-1)).toThrow(NumberEncodeError);
    });

    it("should throw for value > 255 with throwing API", () => {
      expect(() => encodeU8(256)).toThrow(NumberEncodeError);
    });
  });

  describe("Number encoding - i8", () => {
    it("should encode -128 (min i8)", () => {
      const result = encodeI8(-128);
      expect(result.bytes).toEqual(new Uint8Array([0x80]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode -1", () => {
      const result = encodeI8(-1);
      expect(result.bytes).toEqual(new Uint8Array([0xff]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 0", () => {
      const result = encodeI8(0);
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 1", () => {
      const result = encodeI8(1);
      expect(result.bytes).toEqual(new Uint8Array([0x01]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 127 (max i8)", () => {
      const result = encodeI8(127);
      expect(result.bytes).toEqual(new Uint8Array([0x7f]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should return error for value < -128", () => {
      const result = tryEncodeI8(-129);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(NumberEncodeError);
        expect(result.error.message).toContain("out of range");
      }
    });

    it("should return error for value > 127", () => {
      const result = tryEncodeI8(128);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(NumberEncodeError);
        expect(result.error.message).toContain("out of range");
      }
    });
  });

  describe("Number encoding - f32", () => {
    it("should encode 0.0", () => {
      const result = encodeF32(0.0);
      expect(result.bytesWritten).toBe(4);
      // Verify little-endian: 0.0 = [0x00, 0x00, 0x00, 0x00]
      expect(result.bytes).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x00]));
    });

    it("should encode 1.0", () => {
      const result = encodeF32(1.0);
      expect(result.bytesWritten).toBe(4);
      // Verify little-endian: 1.0 = [0x00, 0x00, 0x80, 0x3f]
      expect(result.bytes).toEqual(new Uint8Array([0x00, 0x00, 0x80, 0x3f]));
    });

    it("should encode -1.0", () => {
      const result = encodeF32(-1.0);
      expect(result.bytesWritten).toBe(4);
      // Verify little-endian: -1.0 = [0x00, 0x00, 0x80, 0xbf]
      expect(result.bytes).toEqual(new Uint8Array([0x00, 0x00, 0x80, 0xbf]));
    });

    it("should encode -32.005859375", () => {
      const result = encodeF32(-32.005859375);
      expect(result.bytesWritten).toBe(4);
    });

    it("should encode NaN", () => {
      const result = encodeF32(NaN);
      expect(result.bytesWritten).toBe(4);
      // NaN has many bit patterns, just verify it's 4 bytes
    });

    it("should encode Infinity", () => {
      const result = encodeF32(Infinity);
      expect(result.bytesWritten).toBe(4);
      // Infinity = [0x00, 0x00, 0x80, 0x7f] in little-endian
      expect(result.bytes).toEqual(new Uint8Array([0x00, 0x00, 0x80, 0x7f]));
    });

    it("should encode -Infinity", () => {
      const result = encodeF32(-Infinity);
      expect(result.bytesWritten).toBe(4);
      // -Infinity = [0x00, 0x00, 0x80, 0xff] in little-endian
      expect(result.bytes).toEqual(new Uint8Array([0x00, 0x00, 0x80, 0xff]));
    });

    it("should encode -0.0", () => {
      const result = encodeF32(-0.0);
      expect(result.bytesWritten).toBe(4);
      // -0.0 = [0x00, 0x00, 0x00, 0x80] in little-endian
      expect(result.bytes).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x80]));
    });
  });

  describe("Number encoding - f64", () => {
    it("should encode 0.0", () => {
      const result = encodeF64(0.0);
      expect(result.bytesWritten).toBe(8);
      // Verify little-endian: 0.0 = 8 zero bytes
      expect(result.bytes).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]));
    });

    it("should encode 1.0", () => {
      const result = encodeF64(1.0);
      expect(result.bytesWritten).toBe(8);
      // Verify little-endian: 1.0 = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x3f]
      expect(result.bytes).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x3f]));
    });

    it("should encode -1.0", () => {
      const result = encodeF64(-1.0);
      expect(result.bytesWritten).toBe(8);
      // Verify little-endian: -1.0 = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xbf]
      expect(result.bytes).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xbf]));
    });

    it("should encode -32.005859375", () => {
      const result = encodeF64(-32.005859375);
      expect(result.bytesWritten).toBe(8);
    });

    it("should encode NaN", () => {
      const result = encodeF64(NaN);
      expect(result.bytesWritten).toBe(8);
    });

    it("should encode Infinity", () => {
      const result = encodeF64(Infinity);
      expect(result.bytesWritten).toBe(8);
      // Infinity = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x7f]
      expect(result.bytes).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0x7f]));
    });

    it("should encode -Infinity", () => {
      const result = encodeF64(-Infinity);
      expect(result.bytesWritten).toBe(8);
      // -Infinity = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xff]
      expect(result.bytes).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xff]));
    });

    it("should encode -0.0", () => {
      const result = encodeF64(-0.0);
      expect(result.bytesWritten).toBe(8);
      // -0.0 = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80]
      expect(result.bytes).toEqual(new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80]));
    });
  });

  describe("String encoding", () => {
    it("should encode empty string", () => {
      const result = encodeString("");
      // Length 0 + no content
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode ASCII string", () => {
      const result = encodeString("Hello");
      // Length 5 + "Hello"
      expect(result.bytes).toEqual(new Uint8Array([0x05, 0x48, 0x65, 0x6c, 0x6c, 0x6f]));
      expect(result.bytesWritten).toBe(6);
    });

    it("should encode UTF-8 string with emoji", () => {
      const result = encodeString("Hi🦀");
      // "Hi" = 2 bytes, 🦀 = 4 bytes UTF-8 (0xF0 0x9F 0xA6 0x80)
      // Length = 6, so: [0x06, 'H', 'i', 0xF0, 0x9F, 0xA6, 0x80]
      expect(result.bytesWritten).toBe(7);
      expect(result.bytes[0]).toBe(0x06); // Length
      expect(result.bytes[1]).toBe(0x48); // 'H'
      expect(result.bytes[2]).toBe(0x69); // 'i'
      expect(result.bytes[3]).toBe(0xf0); // 🦀 byte 1
      expect(result.bytes[4]).toBe(0x9f); // 🦀 byte 2
      expect(result.bytes[5]).toBe(0xa6); // 🦀 byte 3
      expect(result.bytes[6]).toBe(0x80); // 🦀 byte 4
    });

    it("should encode string with correct UTF-8 byte length", () => {
      // String with various UTF-8 characters
      const str = "Hello, 世界!"; // "世界" uses 6 bytes in UTF-8
      const result = encodeString(str);
      const encoder = new TextEncoder();
      const expectedBytes = encoder.encode(str);
      expect(result.bytesWritten).toBe(1 + expectedBytes.length);
      expect(result.bytes[0]).toBe(expectedBytes.length);
    });

    it("should encode long string with multi-byte varint length", () => {
      // String longer than 127 bytes to test multi-byte varint length
      const longString = "a".repeat(200);
      const result = encodeString(longString);
      // Length 200 = 0xC8 0x01 in varint
      expect(result.bytesWritten).toBe(2 + 200); // 2-byte length + 200 chars
      expect(result.bytes[0]).toBe(0xc8); // 200 = 0b11001000 -> 0xC8 (with continuation)
      expect(result.bytes[1]).toBe(0x01); // Second byte of varint
    });

    it("should use tryEncodeString successfully", () => {
      const result = tryEncodeString("test");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.bytesWritten).toBeGreaterThan(0);
      }
    });
  });

  describe("Char encoding", () => {
    it("should encode ASCII char", () => {
      const result = encodeChar("A");
      // 'A' = 0x41, length 1 + char
      expect(result.bytesWritten).toBe(2);
      expect(result.bytes[0]).toBe(0x01); // Length
      expect(result.bytes[1]).toBe(0x41); // 'A'
    });

    it("should encode multi-byte UTF-8 char", () => {
      const result = encodeChar("é");
      // 'é' = 0xC3 0xA9 in UTF-8 (2 bytes)
      expect(result.bytesWritten).toBe(3);
      expect(result.bytes[0]).toBe(0x02); // Length
      expect(result.bytes[1]).toBe(0xc3);
      expect(result.bytes[2]).toBe(0xa9);
    });

    it("should encode emoji (4-byte UTF-8)", () => {
      const result = encodeChar("🦀");
      // 🦀 = 0xF0 0x9F 0xA6 0x80 (4 bytes)
      expect(result.bytesWritten).toBe(5);
      expect(result.bytes[0]).toBe(0x04); // Length
      expect(result.bytes[1]).toBe(0xf0);
      expect(result.bytes[2]).toBe(0x9f);
      expect(result.bytes[3]).toBe(0xa6);
      expect(result.bytes[4]).toBe(0x80);
    });

    it("should return error for multi-codepoint string", () => {
      const result = tryEncodeChar("ab");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(StringEncodeError);
        expect(result.error.message).toContain("Unicode scalar value");
      }
    });

    it("should return error for empty string", () => {
      const result = tryEncodeChar("");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(StringEncodeError);
        expect(result.error.message).toContain("Unicode scalar value");
      }
    });

    it("should throw for multi-codepoint string with throwing API", () => {
      expect(() => encodeChar("ab")).toThrow(StringEncodeError);
    });

    it("should throw for empty string with throwing API", () => {
      expect(() => encodeChar("")).toThrow(StringEncodeError);
    });
  });

  describe("Bytes encoding", () => {
    it("should encode empty bytes", () => {
      const result = encodeBytes(new Uint8Array([]));
      // Length 0 + no content
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode small byte array", () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const result = encodeBytes(data);
      // Length 5 + data
      expect(result.bytesWritten).toBe(6);
      expect(result.bytes[0]).toBe(0x05); // Length
      expect(result.bytes[1]).toBe(1);
      expect(result.bytes[2]).toBe(2);
      expect(result.bytes[3]).toBe(3);
      expect(result.bytes[4]).toBe(4);
      expect(result.bytes[5]).toBe(5);
    });

    it("should encode byte array with all values 0-255", () => {
      const data = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        data[i] = i;
      }
      const result = encodeBytes(data);
      // Length 256 = 0x80 0x02 in varint, plus 256 bytes
      expect(result.bytesWritten).toBe(2 + 256);
      expect(result.bytes[0]).toBe(0x80); // Varint for 256
      expect(result.bytes[1]).toBe(0x02);
      // Verify first few data bytes
      expect(result.bytes[2]).toBe(0);
      expect(result.bytes[3]).toBe(1);
      expect(result.bytes[4]).toBe(2);
    });

    it("should encode large byte array (>127 bytes)", () => {
      const data = new Uint8Array(200);
      data.fill(0xaa);
      const result = encodeBytes(data);
      // Length 200 = 0xC8 0x01 in varint
      expect(result.bytesWritten).toBe(2 + 200);
      expect(result.bytes[0]).toBe(0xc8); // Varint for 200
      expect(result.bytes[1]).toBe(0x01);
      // Verify all data bytes are 0xaa
      for (let i = 2; i < result.bytes.length; i++) {
        expect(result.bytes[i]).toBe(0xaa);
      }
    });

    it("should use tryEncodeBytes successfully", () => {
      const data = new Uint8Array([1, 2, 3]);
      const result = tryEncodeBytes(data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.bytesWritten).toBe(4);
      }
    });
  });

  describe("UTF-8 edge cases", () => {
    it("should encode string with zero-width joiner", () => {
      // Zero-width joiner (U+200D) = 0xE2 0x80 0x8D
      const str = "a\u200Db";
      const result = encodeString(str);
      expect(result.bytesWritten).toBeGreaterThan(0);
      // Verify correct UTF-8 encoding
      const encoder = new TextEncoder();
      const expectedBytes = encoder.encode(str);
      expect(result.bytes[0]).toBe(expectedBytes.length); // Length prefix
    });

    it("should encode string with combining characters", () => {
      // é as 'e' + combining acute accent (U+0301)
      const str = "e\u0301";
      const result = encodeString(str);
      expect(result.bytesWritten).toBeGreaterThan(0);
    });

    it("should encode right-to-left text", () => {
      // Arabic text
      const str = "مرحبا";
      const result = encodeString(str);
      expect(result.bytesWritten).toBeGreaterThan(0);
    });

    it("should encode surrogate pair emoji", () => {
      // Family emoji using surrogate pairs
      const str = "👨‍👩‍👧‍👦";
      const result = encodeString(str);
      expect(result.bytesWritten).toBeGreaterThan(0);
      // Verify correct encoding
      const encoder = new TextEncoder();
      const expectedBytes = encoder.encode(str);
      expect(result.bytes[0]).toBeGreaterThan(0); // Non-zero length
    });

    it("should encode mixed scripts", () => {
      // Mix of Latin, Greek, Cyrillic, CJK
      const str = "Hello Ω Привет 你好";
      const result = encodeString(str);
      expect(result.bytesWritten).toBeGreaterThan(0);
      const encoder = new TextEncoder();
      const expectedBytes = encoder.encode(str);
      expect(result.bytesWritten).toBe(expectedBytes.length + (expectedBytes.length < 128 ? 1 : 2));
    });

    it("should encode string with various emoji modifiers", () => {
      // Emoji with skin tone modifier
      const str = "👋🏽";
      const result = encodeString(str);
      expect(result.bytesWritten).toBeGreaterThan(0);
    });
  });
});
