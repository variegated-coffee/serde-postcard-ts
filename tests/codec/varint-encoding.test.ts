/**
 * Tests for varint encoding
 * Complements varint.test.ts which only tests decoding
 */

import { describe, it, expect } from "vitest";
import {
  tryEncodeVarintU16,
  tryEncodeVarintU32,
  tryEncodeVarintU64,
  tryEncodeVarintU128,
  tryEncodeVarintI16,
  tryEncodeVarintI32,
  tryEncodeVarintI64,
  tryEncodeVarintI128,
  encodeVarintU16,
  encodeVarintU32,
  encodeVarintU64,
  encodeVarintU128,
  encodeVarintI16,
  encodeVarintI32,
  encodeVarintI64,
  encodeVarintI128,
  zigzagEncodeI32,
  zigzagEncodeBigInt,
  decodeVarintU16,
  decodeVarintU32,
  decodeVarintU64,
  decodeVarintU128,
  decodeVarintI16,
  decodeVarintI32,
  decodeVarintI64,
  decodeVarintI128,
  VarintEncodeError,
} from "../../src/codec/varint.js";

describe("Varint encoding", () => {
  describe("Unsigned integers (u16)", () => {
    it("should encode 0", () => {
      const result = encodeVarintU16(0);
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 127 (single byte max)", () => {
      const result = encodeVarintU16(127);
      expect(result.bytes).toEqual(new Uint8Array([0x7f]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 128 (two byte start)", () => {
      const result = encodeVarintU16(128);
      expect(result.bytes).toEqual(new Uint8Array([0x80, 0x01]));
      expect(result.bytesWritten).toBe(2);
    });

    it("should encode 16383 (two byte max)", () => {
      const result = encodeVarintU16(16383);
      expect(result.bytes).toEqual(new Uint8Array([0xff, 0x7f]));
      expect(result.bytesWritten).toBe(2);
    });

    it("should encode 16384 (three byte start)", () => {
      const result = encodeVarintU16(16384);
      expect(result.bytes).toEqual(new Uint8Array([0x80, 0x80, 0x01]));
      expect(result.bytesWritten).toBe(3);
    });

    it("should encode 16385", () => {
      const result = encodeVarintU16(16385);
      expect(result.bytes).toEqual(new Uint8Array([0x81, 0x80, 0x01]));
      expect(result.bytesWritten).toBe(3);
    });

    it("should encode 65535 (max u16)", () => {
      const result = encodeVarintU16(65535);
      expect(result.bytes).toEqual(new Uint8Array([0xff, 0xff, 0x03]));
      expect(result.bytesWritten).toBe(3);
    });
  });

  describe("Unsigned integers (u32)", () => {
    it("should encode 0", () => {
      const result = encodeVarintU32(0);
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 127", () => {
      const result = encodeVarintU32(127);
      expect(result.bytes).toEqual(new Uint8Array([0x7f]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 128", () => {
      const result = encodeVarintU32(128);
      expect(result.bytes).toEqual(new Uint8Array([0x80, 0x01]));
      expect(result.bytesWritten).toBe(2);
    });

    it("should encode 16383", () => {
      const result = encodeVarintU32(16383);
      expect(result.bytes).toEqual(new Uint8Array([0xff, 0x7f]));
      expect(result.bytesWritten).toBe(2);
    });

    it("should encode 16384", () => {
      const result = encodeVarintU32(16384);
      expect(result.bytes).toEqual(new Uint8Array([0x80, 0x80, 0x01]));
      expect(result.bytesWritten).toBe(3);
    });

    it("should encode 2097151 (three byte max)", () => {
      const result = encodeVarintU32(2097151);
      expect(result.bytes).toEqual(new Uint8Array([0xff, 0xff, 0x7f]));
      expect(result.bytesWritten).toBe(3);
    });

    it("should encode 2097152 (four byte start)", () => {
      const result = encodeVarintU32(2097152);
      expect(result.bytes).toEqual(new Uint8Array([0x80, 0x80, 0x80, 0x01]));
      expect(result.bytesWritten).toBe(4);
    });

    it("should encode 268435455 (four byte max)", () => {
      const result = encodeVarintU32(268435455);
      expect(result.bytes).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0x7f]));
      expect(result.bytesWritten).toBe(4);
    });

    it("should encode 268435456 (five byte start)", () => {
      const result = encodeVarintU32(268435456);
      expect(result.bytes).toEqual(new Uint8Array([0x80, 0x80, 0x80, 0x80, 0x01]));
      expect(result.bytesWritten).toBe(5);
    });

    it("should encode 4294967295 (max u32)", () => {
      const result = encodeVarintU32(4294967295);
      expect(result.bytes).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x0f]));
      expect(result.bytesWritten).toBe(5);
    });
  });

  describe("Unsigned integers (u64)", () => {
    it("should encode 0", () => {
      const result = encodeVarintU64(0n);
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 127", () => {
      const result = encodeVarintU64(127n);
      expect(result.bytes).toEqual(new Uint8Array([0x7f]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 128", () => {
      const result = encodeVarintU64(128n);
      expect(result.bytes).toEqual(new Uint8Array([0x80, 0x01]));
      expect(result.bytesWritten).toBe(2);
    });

    it("should encode large value", () => {
      const result = encodeVarintU64(10000000000n);
      expect(result.bytesWritten).toBeGreaterThan(0);
      expect(result.bytesWritten).toBeLessThanOrEqual(10);
    });

    it("should encode max u64", () => {
      const result = encodeVarintU64(18446744073709551615n);
      expect(result.bytes).toEqual(new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x01]));
      expect(result.bytesWritten).toBe(10);
    });
  });

  describe("Unsigned integers (u128)", () => {
    it("should encode 0", () => {
      const result = encodeVarintU128(0n);
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 127", () => {
      const result = encodeVarintU128(127n);
      expect(result.bytes).toEqual(new Uint8Array([0x7f]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 128", () => {
      const result = encodeVarintU128(128n);
      expect(result.bytes).toEqual(new Uint8Array([0x80, 0x01]));
      expect(result.bytesWritten).toBe(2);
    });

    it("should encode very large value", () => {
      const result = encodeVarintU128(123456789012345678901234567890n);
      expect(result.bytesWritten).toBeGreaterThan(0);
      expect(result.bytesWritten).toBeLessThanOrEqual(19);
    });

    it("should encode max u128", () => {
      const result = encodeVarintU128(340282366920938463463374607431768211455n);
      expect(result.bytesWritten).toBe(19);
    });
  });

  describe("Signed integers with zigzag encoding (i16)", () => {
    it("should encode 0", () => {
      const result = encodeVarintI16(0);
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode -1", () => {
      const result = encodeVarintI16(-1);
      expect(result.bytes).toEqual(new Uint8Array([0x01]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 1", () => {
      const result = encodeVarintI16(1);
      expect(result.bytes).toEqual(new Uint8Array([0x02]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 63", () => {
      const result = encodeVarintI16(63);
      expect(result.bytes).toEqual(new Uint8Array([0x7e]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode -64", () => {
      const result = encodeVarintI16(-64);
      expect(result.bytes).toEqual(new Uint8Array([0x7f]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 64", () => {
      const result = encodeVarintI16(64);
      expect(result.bytes).toEqual(new Uint8Array([0x80, 0x01]));
      expect(result.bytesWritten).toBe(2);
    });

    it("should encode -65", () => {
      const result = encodeVarintI16(-65);
      expect(result.bytes).toEqual(new Uint8Array([0x81, 0x01]));
      expect(result.bytesWritten).toBe(2);
    });

    it("should encode 32767 (max i16)", () => {
      const result = encodeVarintI16(32767);
      expect(result.bytes).toEqual(new Uint8Array([0xfe, 0xff, 0x03]));
      expect(result.bytesWritten).toBe(3);
    });

    it("should encode -32768 (min i16)", () => {
      const result = encodeVarintI16(-32768);
      expect(result.bytes).toEqual(new Uint8Array([0xff, 0xff, 0x03]));
      expect(result.bytesWritten).toBe(3);
    });
  });

  describe("Signed integers (i32)", () => {
    it("should encode 0", () => {
      const result = encodeVarintI32(0);
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode -1", () => {
      const result = encodeVarintI32(-1);
      expect(result.bytes).toEqual(new Uint8Array([0x01]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 1", () => {
      const result = encodeVarintI32(1);
      expect(result.bytes).toEqual(new Uint8Array([0x02]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode -100000", () => {
      const result = encodeVarintI32(-100000);
      expect(result.bytesWritten).toBeGreaterThan(1);
    });

    it("should encode 2147483647 (max i32)", () => {
      const result = encodeVarintI32(2147483647);
      expect(result.bytesWritten).toBe(5);
    });

    it("should encode -2147483648 (min i32)", () => {
      const result = encodeVarintI32(-2147483648);
      expect(result.bytesWritten).toBe(5);
    });
  });

  describe("Signed integers (i64)", () => {
    it("should encode 0", () => {
      const result = encodeVarintI64(0n);
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode -1", () => {
      const result = encodeVarintI64(-1n);
      expect(result.bytes).toEqual(new Uint8Array([0x01]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 1", () => {
      const result = encodeVarintI64(1n);
      expect(result.bytes).toEqual(new Uint8Array([0x02]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode -10000000000", () => {
      const result = encodeVarintI64(-10000000000n);
      expect(result.bytesWritten).toBeGreaterThan(1);
    });

    it("should encode max i64", () => {
      const result = encodeVarintI64(9223372036854775807n);
      expect(result.bytesWritten).toBe(10);
    });

    it("should encode min i64", () => {
      const result = encodeVarintI64(-9223372036854775808n);
      expect(result.bytesWritten).toBe(10);
    });
  });

  describe("Signed integers (i128)", () => {
    it("should encode 0", () => {
      const result = encodeVarintI128(0n);
      expect(result.bytes).toEqual(new Uint8Array([0x00]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode -1", () => {
      const result = encodeVarintI128(-1n);
      expect(result.bytes).toEqual(new Uint8Array([0x01]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode 1", () => {
      const result = encodeVarintI128(1n);
      expect(result.bytes).toEqual(new Uint8Array([0x02]));
      expect(result.bytesWritten).toBe(1);
    });

    it("should encode -123456789012345678901234567890", () => {
      const result = encodeVarintI128(-123456789012345678901234567890n);
      expect(result.bytesWritten).toBeGreaterThan(1);
    });
  });

  describe("Zigzag encoding helpers", () => {
    it("should encode positive numbers correctly", () => {
      expect(zigzagEncodeI32(0)).toBe(0);
      expect(zigzagEncodeI32(1)).toBe(2);
      expect(zigzagEncodeI32(2)).toBe(4);
      expect(zigzagEncodeI32(63)).toBe(126);
      expect(zigzagEncodeI32(64)).toBe(128);
    });

    it("should encode negative numbers correctly", () => {
      expect(zigzagEncodeI32(-1)).toBe(1);
      expect(zigzagEncodeI32(-2)).toBe(3);
      expect(zigzagEncodeI32(-3)).toBe(5);
      expect(zigzagEncodeI32(-64)).toBe(127);
      expect(zigzagEncodeI32(-65)).toBe(129);
    });

    it("should encode zigzag bigint for positive numbers", () => {
      expect(zigzagEncodeBigInt(0n)).toBe(0n);
      expect(zigzagEncodeBigInt(1n)).toBe(2n);
      expect(zigzagEncodeBigInt(2n)).toBe(4n);
    });

    it("should encode zigzag bigint for negative numbers", () => {
      expect(zigzagEncodeBigInt(-1n)).toBe(1n);
      expect(zigzagEncodeBigInt(-2n)).toBe(3n);
      expect(zigzagEncodeBigInt(-3n)).toBe(5n);
    });

    it("should encode large positive bigint", () => {
      const large = 9223372036854775807n; // max i64
      const encoded = zigzagEncodeBigInt(large);
      expect(encoded).toBeGreaterThan(0n);
    });

    it("should encode large negative bigint", () => {
      const large = -9223372036854775808n; // min i64
      const encoded = zigzagEncodeBigInt(large);
      expect(encoded).toBeGreaterThan(0n);
    });
  });

  describe("Error handling - Result type", () => {
    it("should return error for u16 negative value", () => {
      const result = tryEncodeVarintU16(-1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintEncodeError);
        expect(result.error.message).toContain("out of range");
      }
    });

    it("should return error for u16 overflow", () => {
      const result = tryEncodeVarintU16(65536);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintEncodeError);
        expect(result.error.message).toContain("out of range");
      }
    });

    it("should return error for u32 negative value", () => {
      const result = tryEncodeVarintU32(-1);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintEncodeError);
      }
    });

    it("should return error for u32 overflow", () => {
      const result = tryEncodeVarintU32(4294967296);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintEncodeError);
      }
    });

    it("should return error for u64 negative value", () => {
      const result = tryEncodeVarintU64(-1n);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintEncodeError);
      }
    });

    it("should return error for i16 underflow", () => {
      const result = tryEncodeVarintI16(-32769);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintEncodeError);
      }
    });

    it("should return error for i16 overflow", () => {
      const result = tryEncodeVarintI16(32768);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintEncodeError);
      }
    });

    it("should return error for i32 underflow", () => {
      const result = tryEncodeVarintI32(-2147483649);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintEncodeError);
      }
    });

    it("should return error for i32 overflow", () => {
      const result = tryEncodeVarintI32(2147483648);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(VarintEncodeError);
      }
    });
  });

  describe("Error handling - Throwing API", () => {
    it("should throw for u16 negative value", () => {
      expect(() => encodeVarintU16(-1)).toThrow(VarintEncodeError);
    });

    it("should throw for u16 overflow", () => {
      expect(() => encodeVarintU16(65536)).toThrow(VarintEncodeError);
    });

    it("should throw for u32 overflow", () => {
      expect(() => encodeVarintU32(4294967296)).toThrow(VarintEncodeError);
    });
  });

  describe("Round-trip encoding and decoding", () => {
    it("should round-trip u16 values", () => {
      const values = [0, 1, 127, 128, 255, 256, 16383, 16384, 32767, 65535];
      for (const value of values) {
        const encoded = encodeVarintU16(value);
        const decoded = decodeVarintU16(encoded.bytes);
        expect(decoded.value).toBe(value);
      }
    });

    it("should round-trip u32 values", () => {
      const values = [0, 1, 127, 128, 16383, 16384, 2097151, 2097152, 268435455, 268435456, 4294967295];
      for (const value of values) {
        const encoded = encodeVarintU32(value);
        const decoded = decodeVarintU32(encoded.bytes);
        expect(decoded.value).toBe(value);
      }
    });

    it("should round-trip u64 values", () => {
      const values = [0n, 1n, 127n, 128n, 10000000000n, 18446744073709551615n];
      for (const value of values) {
        const encoded = encodeVarintU64(value);
        const decoded = decodeVarintU64(encoded.bytes);
        expect(decoded.value).toBe(value);
      }
    });

    it("should round-trip u128 values", () => {
      const values = [0n, 1n, 127n, 128n, 123456789012345678901234567890n, 340282366920938463463374607431768211455n];
      for (const value of values) {
        const encoded = encodeVarintU128(value);
        const decoded = decodeVarintU128(encoded.bytes);
        expect(decoded.value).toBe(value);
      }
    });

    it("should round-trip i16 values", () => {
      const values = [-32768, -65, -64, -1, 0, 1, 63, 64, 32767];
      for (const value of values) {
        const encoded = encodeVarintI16(value);
        const decoded = decodeVarintI16(encoded.bytes);
        expect(decoded.value).toBe(value);
      }
    });

    it("should round-trip i32 values", () => {
      const values = [-2147483648, -100000, -1, 0, 1, 100000, 2147483647];
      for (const value of values) {
        const encoded = encodeVarintI32(value);
        const decoded = decodeVarintI32(encoded.bytes);
        expect(decoded.value).toBe(value);
      }
    });

    it("should round-trip i64 values", () => {
      const values = [-9223372036854775808n, -10000000000n, -1n, 0n, 1n, 10000000000n, 9223372036854775807n];
      for (const value of values) {
        const encoded = encodeVarintI64(value);
        const decoded = decodeVarintI64(encoded.bytes);
        expect(decoded.value).toBe(value);
      }
    });

    it("should round-trip i128 values", () => {
      const values = [-123456789012345678901234567890n, -1n, 0n, 1n, 123456789012345678901234567890n];
      for (const value of values) {
        const encoded = encodeVarintI128(value);
        const decoded = decodeVarintI128(encoded.bytes);
        expect(decoded.value).toBe(value);
      }
    });
  });
});
