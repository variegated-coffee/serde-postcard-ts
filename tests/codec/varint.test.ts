/**
 * Tests for varint encoding/decoding
 * Test cases from the postcard wire format specification
 */

import { describe, it, expect } from "vitest";
import {
  tryDecodeVarintU16,
  tryDecodeVarintU32,
  tryDecodeVarintU64,
  tryDecodeVarintU128,
  tryDecodeVarintI16,
  tryDecodeVarintI32,
  tryDecodeVarintI64,
  tryDecodeVarintI128,
  decodeVarintU16,
  decodeVarintU32,
  decodeVarintI16,
  decodeVarintI32,
  zigzagDecodeI32,
  zigzagDecodeBigInt,
  VarintDecodeError,
} from "../../src/codec/varint.js";

describe("Varint decoding", () => {
  describe("Unsigned integers (u16)", () => {
    // Test cases from the postcard spec wire-format.md
    it("should decode 0", () => {
      const data = new Uint8Array([0x00]);
      const result = decodeVarintU16(data);
      expect(result.value).toBe(0);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode 127", () => {
      const data = new Uint8Array([0x7f]);
      const result = decodeVarintU16(data);
      expect(result.value).toBe(127);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode 128", () => {
      const data = new Uint8Array([0x80, 0x01]);
      const result = decodeVarintU16(data);
      expect(result.value).toBe(128);
      expect(result.bytesRead).toBe(2);
    });

    it("should decode 16383", () => {
      const data = new Uint8Array([0xff, 0x7f]);
      const result = decodeVarintU16(data);
      expect(result.value).toBe(16383);
      expect(result.bytesRead).toBe(2);
    });

    it("should decode 16384", () => {
      const data = new Uint8Array([0x80, 0x80, 0x01]);
      const result = decodeVarintU16(data);
      expect(result.value).toBe(16384);
      expect(result.bytesRead).toBe(3);
    });

    it("should decode 16385", () => {
      const data = new Uint8Array([0x81, 0x80, 0x01]);
      const result = decodeVarintU16(data);
      expect(result.value).toBe(16385);
      expect(result.bytesRead).toBe(3);
    });

    it("should decode 65535 (max u16)", () => {
      const data = new Uint8Array([0xff, 0xff, 0x03]);
      const result = decodeVarintU16(data);
      expect(result.value).toBe(65535);
      expect(result.bytesRead).toBe(3);
    });
  });

  describe("Unsigned integers (u32)", () => {
    it("should decode 0", () => {
      const data = new Uint8Array([0x00]);
      const result = decodeVarintU32(data);
      expect(result.value).toBe(0);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode 4294967295 (max u32)", () => {
      const data = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x0f]);
      const result = decodeVarintU32(data);
      expect(result.value).toBe(4294967295);
      expect(result.bytesRead).toBe(5);
    });
  });

  describe("Signed integers with zigzag encoding (i16)", () => {
    // Test cases from the postcard spec

    it("should decode 0", () => {
      const data = new Uint8Array([0x00]);
      const result = decodeVarintI16(data);
      expect(result.value).toBe(0);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode -1", () => {
      const data = new Uint8Array([0x01]);
      const result = decodeVarintI16(data);
      expect(result.value).toBe(-1);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode 1", () => {
      const data = new Uint8Array([0x02]);
      const result = decodeVarintI16(data);
      expect(result.value).toBe(1);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode 63", () => {
      const data = new Uint8Array([0x7e]);
      const result = decodeVarintI16(data);
      expect(result.value).toBe(63);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode -64", () => {
      const data = new Uint8Array([0x7f]);
      const result = decodeVarintI16(data);
      expect(result.value).toBe(-64);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode 64", () => {
      const data = new Uint8Array([0x80, 0x01]);
      const result = decodeVarintI16(data);
      expect(result.value).toBe(64);
      expect(result.bytesRead).toBe(2);
    });

    it("should decode -65", () => {
      const data = new Uint8Array([0x81, 0x01]);
      const result = decodeVarintI16(data);
      expect(result.value).toBe(-65);
      expect(result.bytesRead).toBe(2);
    });

    it("should decode 32767 (max i16)", () => {
      const data = new Uint8Array([0xfe, 0xff, 0x03]);
      const result = decodeVarintI16(data);
      expect(result.value).toBe(32767);
      expect(result.bytesRead).toBe(3);
    });

    it("should decode -32768 (min i16)", () => {
      const data = new Uint8Array([0xff, 0xff, 0x03]);
      const result = decodeVarintI16(data);
      expect(result.value).toBe(-32768);
      expect(result.bytesRead).toBe(3);
    });
  });

  describe("Signed integers (i32)", () => {
    it("should decode 0", () => {
      const data = new Uint8Array([0x00]);
      const result = decodeVarintI32(data);
      expect(result.value).toBe(0);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode -1", () => {
      const data = new Uint8Array([0x01]);
      const result = decodeVarintI32(data);
      expect(result.value).toBe(-1);
      expect(result.bytesRead).toBe(1);
    });

    it("should decode 1", () => {
      const data = new Uint8Array([0x02]);
      const result = decodeVarintI32(data);
      expect(result.value).toBe(1);
      expect(result.bytesRead).toBe(1);
    });
  });

  describe("Zigzag encoding helpers", () => {
    it("should decode zigzag for positive numbers", () => {
      expect(zigzagDecodeI32(0)).toBe(0);
      expect(zigzagDecodeI32(2)).toBe(1);
      expect(zigzagDecodeI32(4)).toBe(2);
    });

    it("should decode zigzag for negative numbers", () => {
      expect(zigzagDecodeI32(1)).toBe(-1);
      expect(zigzagDecodeI32(3)).toBe(-2);
      expect(zigzagDecodeI32(5)).toBe(-3);
    });

    it("should decode zigzag bigint for positive numbers", () => {
      expect(zigzagDecodeBigInt(0n)).toBe(0n);
      expect(zigzagDecodeBigInt(2n)).toBe(1n);
      expect(zigzagDecodeBigInt(4n)).toBe(2n);
    });

    it("should decode zigzag bigint for negative numbers", () => {
      expect(zigzagDecodeBigInt(1n)).toBe(-1n);
      expect(zigzagDecodeBigInt(3n)).toBe(-2n);
      expect(zigzagDecodeBigInt(5n)).toBe(-3n);
    });
  });

  describe("Error handling - Result type", () => {
    it("should return error for empty data", () => {
      const data = new Uint8Array([]);
      const result = tryDecodeVarintU16(data);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintDecodeError);
        expect(result.error.message).toContain("out of bounds");
      }
    });

    it("should return error for truncated data", () => {
      const data = new Uint8Array([0x80]); // Continuation flag set but no next byte
      const result = tryDecodeVarintU16(data);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintDecodeError);
        expect(result.error.message).toContain("Unexpected end of data");
      }
    });

    it("should return error when exceeding max encoded length", () => {
      // u16 has max length of 3 bytes, this has 4 bytes with continuation
      const data = new Uint8Array([0x80, 0x80, 0x80, 0x80]);
      const result = tryDecodeVarintU16(data);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintDecodeError);
        expect(result.error.message).toContain("maximum encoded length");
      }
    });

    it("should return error when value exceeds type maximum", () => {
      // This encodes 131071 which exceeds u16 max of 65535
      const data = new Uint8Array([0xff, 0xff, 0x07]);
      const result = tryDecodeVarintU16(data);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintDecodeError);
        expect(result.error.message).toContain("exceeds u16 maximum");
      }
    });
  });

  describe("Error handling - Throwing API", () => {
    it("should throw for empty data", () => {
      const data = new Uint8Array([]);
      expect(() => decodeVarintU16(data)).toThrow(VarintDecodeError);
      expect(() => decodeVarintU16(data)).toThrow(/out of bounds/);
    });

    it("should throw for truncated data", () => {
      const data = new Uint8Array([0x80]);
      expect(() => decodeVarintU16(data)).toThrow(VarintDecodeError);
      expect(() => decodeVarintU16(data)).toThrow(/Unexpected end of data/);
    });
  });

  describe("Offset parameter", () => {
    it("should decode from specified offset", () => {
      const data = new Uint8Array([0xff, 0xff, 0x7f, 0x00]); // garbage, then 127 at offset 2
      const result = decodeVarintU16(data, 2);
      expect(result.value).toBe(127);
      expect(result.bytesRead).toBe(1);
    });

    it("should handle out of bounds offset", () => {
      const data = new Uint8Array([0x00]);
      const result = tryDecodeVarintU16(data, 10);
      expect(result.ok).toBe(false);
    });
  });

  describe("Non-canonical encodings", () => {
    // Per spec, non-canonical encodings are accepted as long as they fit within max length
    it("should accept non-canonical encoding of 0", () => {
      const data = new Uint8Array([0x80, 0x00]); // Non-canonical: has extra byte
      const result = decodeVarintU16(data);
      expect(result.value).toBe(0);
      expect(result.bytesRead).toBe(2);
    });

    it("should accept non-canonical encoding within max length", () => {
      const data = new Uint8Array([0x80, 0x80, 0x00]); // Non-canonical: has extra bytes
      const result = decodeVarintU16(data);
      expect(result.value).toBe(0);
      expect(result.bytesRead).toBe(3);
    });

    it("should reject non-canonical encoding exceeding max length", () => {
      const data = new Uint8Array([0x80, 0x80, 0x80, 0x00]); // 4 bytes exceeds u16 max of 3
      const result = tryDecodeVarintU16(data);
      expect(result.ok).toBe(false);
    });
  });

  describe("Bigint types (u64, i64)", () => {
    it("should decode u64 max value", () => {
      const data = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01]);
      const result = tryDecodeVarintU64(data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe(18446744073709551615n);
      }
    });

    it("should decode i64 negative value", () => {
      const data = new Uint8Array([0x01]); // Zigzag encoded -1
      const result = tryDecodeVarintI64(data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.value).toBe(-1n);
      }
    });
  });
});
