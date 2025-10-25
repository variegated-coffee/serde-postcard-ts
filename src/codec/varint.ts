/**
 * Variable-length integer (varint) encoding and decoding
 * Implements LEB128 encoding with zigzag for signed integers
 *
 * Based on the postcard wire format specification:
 * - 7 data bits per byte
 * - MSB is continuation flag (1 = more bytes, 0 = last byte)
 * - Little-endian order (first byte = least significant bits)
 * - Signed integers use zigzag encoding
 */

import { type Result, ok, err, unwrap } from "../types/result.js";

/**
 * Error thrown when varint decoding fails
 */
export class VarintDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VarintDecodeError";
  }
}

/**
 * Result of decoding a varint
 */
export interface VarintDecodeResult<T> {
  value: T;
  bytesRead: number;
}

/**
 * Maximum encoded lengths for each type (from spec)
 */
const MAX_ENCODED_LEN = {
  u16: 3,
  i16: 3,
  u32: 5,
  i32: 5,
  u64: 10,
  i64: 10,
  u128: 19,
  i128: 19,
} as const;

// ============================================================================
// ZIGZAG ENCODING/DECODING
// ============================================================================

/**
 * Encode signed integer using zigzag encoding (32-bit)
 * Zigzag encoding: (n << 1) ^ (n >> 31)
 * Maps signed integers to unsigned: 0, -1, 1, -2, 2, ... => 0, 1, 2, 3, 4, ...
 */
export function zigzagEncodeI32(n: number): number {
  return (n << 1) ^ (n >> 31);
}

/**
 * Encode signed bigint using zigzag encoding (64-bit/128-bit)
 * For bigint values
 */
export function zigzagEncodeBigInt(n: bigint): bigint {
  return (n << 1n) ^ (n >> 127n);
}

/**
 * Decode zigzag-encoded signed integer (32-bit)
 * Zigzag encoding: (n << 1) ^ (n >> 31) for encoding
 * Decoding: (n >>> 1) ^ -(n & 1)
 */
export function zigzagDecodeI32(n: number): number {
  return (n >>> 1) ^ -(n & 1);
}

/**
 * Decode zigzag-encoded signed integer (64-bit/128-bit)
 * For bigint values
 */
export function zigzagDecodeBigInt(n: bigint): bigint {
  return (n >> 1n) ^ (0n - (n & 1n));
}

// ============================================================================
// UNSIGNED VARINT DECODERS
// ============================================================================

/**
 * Decode an unsigned 16-bit varint
 */
export function tryDecodeVarintU16(
  data: Uint8Array,
  offset = 0
): Result<VarintDecodeResult<number>, VarintDecodeError> {
  if (offset < 0 || offset >= data.length) {
    return err(new VarintDecodeError("Offset out of bounds"));
  }

  let result = 0;
  let shift = 0;
  let bytesRead = 0;

  while (bytesRead < MAX_ENCODED_LEN.u16) {
    if (offset + bytesRead >= data.length) {
      return err(new VarintDecodeError("Unexpected end of data"));
    }

    const byte = data[offset + bytesRead];
    if (byte === undefined) {
      return err(new VarintDecodeError("Unexpected end of data"));
    }

    bytesRead++;

    // Extract 7 data bits
    const dataBits = byte & 0x7f;
    result |= dataBits << shift;

    // Check continuation flag
    if ((byte & 0x80) === 0) {
      // Last byte - validate value fits in u16
      if (result > 0xffff) {
        return err(new VarintDecodeError("Value exceeds u16 maximum"));
      }
      return ok({ value: result, bytesRead });
    }

    shift += 7;
  }

  return err(new VarintDecodeError("Varint exceeds maximum encoded length for u16"));
}

/**
 * Decode an unsigned 32-bit varint
 */
export function tryDecodeVarintU32(
  data: Uint8Array,
  offset = 0
): Result<VarintDecodeResult<number>, VarintDecodeError> {
  if (offset < 0 || offset >= data.length) {
    return err(new VarintDecodeError("Offset out of bounds"));
  }

  let result = 0;
  let shift = 0;
  let bytesRead = 0;

  while (bytesRead < MAX_ENCODED_LEN.u32) {
    if (offset + bytesRead >= data.length) {
      return err(new VarintDecodeError("Unexpected end of data"));
    }

    const byte = data[offset + bytesRead];
    if (byte === undefined) {
      return err(new VarintDecodeError("Unexpected end of data"));
    }

    bytesRead++;

    // Extract 7 data bits
    const dataBits = byte & 0x7f;
    result |= dataBits << shift;

    // Check continuation flag
    if ((byte & 0x80) === 0) {
      // Last byte - validate value fits in u32
      if (result > 0xffffffff) {
        return err(new VarintDecodeError("Value exceeds u32 maximum"));
      }
      // Convert to unsigned 32-bit
      return ok({ value: result >>> 0, bytesRead });
    }

    shift += 7;
  }

  return err(new VarintDecodeError("Varint exceeds maximum encoded length for u32"));
}

/**
 * Decode an unsigned 64-bit varint (returns bigint)
 */
export function tryDecodeVarintU64(
  data: Uint8Array,
  offset = 0
): Result<VarintDecodeResult<bigint>, VarintDecodeError> {
  if (offset < 0 || offset >= data.length) {
    return err(new VarintDecodeError("Offset out of bounds"));
  }

  let result = 0n;
  let shift = 0n;
  let bytesRead = 0;

  while (bytesRead < MAX_ENCODED_LEN.u64) {
    if (offset + bytesRead >= data.length) {
      return err(new VarintDecodeError("Unexpected end of data"));
    }

    const byte = data[offset + bytesRead];
    if (byte === undefined) {
      return err(new VarintDecodeError("Unexpected end of data"));
    }

    bytesRead++;

    // Extract 7 data bits
    const dataBits = BigInt(byte & 0x7f);
    result |= dataBits << shift;

    // Check continuation flag
    if ((byte & 0x80) === 0) {
      // Last byte - validate value fits in u64
      if (result > 0xffff_ffff_ffff_ffffn) {
        return err(new VarintDecodeError("Value exceeds u64 maximum"));
      }
      return ok({ value: result, bytesRead });
    }

    shift += 7n;
  }

  return err(new VarintDecodeError("Varint exceeds maximum encoded length for u64"));
}

/**
 * Decode an unsigned 128-bit varint (returns bigint)
 */
export function tryDecodeVarintU128(
  data: Uint8Array,
  offset = 0
): Result<VarintDecodeResult<bigint>, VarintDecodeError> {
  if (offset < 0 || offset >= data.length) {
    return err(new VarintDecodeError("Offset out of bounds"));
  }

  let result = 0n;
  let shift = 0n;
  let bytesRead = 0;

  while (bytesRead < MAX_ENCODED_LEN.u128) {
    if (offset + bytesRead >= data.length) {
      return err(new VarintDecodeError("Unexpected end of data"));
    }

    const byte = data[offset + bytesRead];
    if (byte === undefined) {
      return err(new VarintDecodeError("Unexpected end of data"));
    }

    bytesRead++;

    // Extract 7 data bits
    const dataBits = BigInt(byte & 0x7f);
    result |= dataBits << shift;

    // Check continuation flag
    if ((byte & 0x80) === 0) {
      // Last byte - validate value fits in u128
      const maxU128 = (1n << 128n) - 1n;
      if (result > maxU128) {
        return err(new VarintDecodeError("Value exceeds u128 maximum"));
      }
      return ok({ value: result, bytesRead });
    }

    shift += 7n;
  }

  return err(new VarintDecodeError("Varint exceeds maximum encoded length for u128"));
}

// ============================================================================
// SIGNED VARINT DECODERS (with zigzag)
// ============================================================================

/**
 * Decode a signed 16-bit varint (zigzag encoded)
 */
export function tryDecodeVarintI16(
  data: Uint8Array,
  offset = 0
): Result<VarintDecodeResult<number>, VarintDecodeError> {
  const result = tryDecodeVarintU16(data, offset);
  if (!result.ok) {
    return result;
  }

  const decoded = zigzagDecodeI32(result.value.value);

  // Validate fits in i16 range
  if (decoded < -32768 || decoded > 32767) {
    return err(new VarintDecodeError("Value exceeds i16 range"));
  }

  return ok({ value: decoded, bytesRead: result.value.bytesRead });
}

/**
 * Decode a signed 32-bit varint (zigzag encoded)
 */
export function tryDecodeVarintI32(
  data: Uint8Array,
  offset = 0
): Result<VarintDecodeResult<number>, VarintDecodeError> {
  const result = tryDecodeVarintU32(data, offset);
  if (!result.ok) {
    return result;
  }

  const decoded = zigzagDecodeI32(result.value.value);

  return ok({ value: decoded, bytesRead: result.value.bytesRead });
}

/**
 * Decode a signed 64-bit varint (zigzag encoded, returns bigint)
 */
export function tryDecodeVarintI64(
  data: Uint8Array,
  offset = 0
): Result<VarintDecodeResult<bigint>, VarintDecodeError> {
  const result = tryDecodeVarintU64(data, offset);
  if (!result.ok) {
    return result;
  }

  const decoded = zigzagDecodeBigInt(result.value.value);

  // Validate fits in i64 range
  const minI64 = -(1n << 63n);
  const maxI64 = (1n << 63n) - 1n;
  if (decoded < minI64 || decoded > maxI64) {
    return err(new VarintDecodeError("Value exceeds i64 range"));
  }

  return ok({ value: decoded, bytesRead: result.value.bytesRead });
}

/**
 * Decode a signed 128-bit varint (zigzag encoded, returns bigint)
 */
export function tryDecodeVarintI128(
  data: Uint8Array,
  offset = 0
): Result<VarintDecodeResult<bigint>, VarintDecodeError> {
  const result = tryDecodeVarintU128(data, offset);
  if (!result.ok) {
    return result;
  }

  const decoded = zigzagDecodeBigInt(result.value.value);

  // Validate fits in i128 range
  const minI128 = -(1n << 127n);
  const maxI128 = (1n << 127n) - 1n;
  if (decoded < minI128 || decoded > maxI128) {
    return err(new VarintDecodeError("Value exceeds i128 range"));
  }

  return ok({ value: decoded, bytesRead: result.value.bytesRead });
}

// ============================================================================
// VARINT ENCODING ERROR
// ============================================================================

/**
 * Error thrown when varint encoding fails
 */
export class VarintEncodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VarintEncodeError";
  }
}

/**
 * Result of encoding a varint
 */
export interface VarintEncodeResult {
  bytes: Uint8Array;
  bytesWritten: number;
}

// ============================================================================
// UNSIGNED VARINT ENCODERS
// ============================================================================

/**
 * Encode an unsigned 16-bit varint
 */
export function tryEncodeVarintU16(
  value: number
): Result<VarintEncodeResult, VarintEncodeError> {
  // Validate range
  if (value < 0 || value > 0xffff) {
    return err(new VarintEncodeError(`Value ${String(value)} is out of range for u16`));
  }

  const bytes: number[] = [];
  let n = value;

  while (n > 0x7f) {
    // Write 7 data bits with continuation flag
    bytes.push((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  // Write final byte without continuation flag
  bytes.push(n & 0x7f);

  return ok({ bytes: new Uint8Array(bytes), bytesWritten: bytes.length });
}

/**
 * Encode an unsigned 32-bit varint
 */
export function tryEncodeVarintU32(
  value: number
): Result<VarintEncodeResult, VarintEncodeError> {
  // Validate range
  if (value < 0 || value > 0xffffffff) {
    return err(new VarintEncodeError(`Value ${String(value)} is out of range for u32`));
  }

  const bytes: number[] = [];
  let n = value >>> 0; // Convert to unsigned 32-bit

  while (n > 0x7f) {
    bytes.push((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  bytes.push(n & 0x7f);

  return ok({ bytes: new Uint8Array(bytes), bytesWritten: bytes.length });
}

/**
 * Encode an unsigned 64-bit varint (accepts bigint)
 */
export function tryEncodeVarintU64(
  value: bigint
): Result<VarintEncodeResult, VarintEncodeError> {
  // Validate range
  if (value < 0n || value > 0xffff_ffff_ffff_ffffn) {
    return err(new VarintEncodeError(`Value ${String(value)} is out of range for u64`));
  }

  const bytes: number[] = [];
  let n = value;

  while (n > 0x7fn) {
    bytes.push(Number(n & 0x7fn) | 0x80);
    n >>= 7n;
  }
  bytes.push(Number(n & 0x7fn));

  return ok({ bytes: new Uint8Array(bytes), bytesWritten: bytes.length });
}

/**
 * Encode an unsigned 128-bit varint (accepts bigint)
 */
export function tryEncodeVarintU128(
  value: bigint
): Result<VarintEncodeResult, VarintEncodeError> {
  // Validate range
  const maxU128 = (1n << 128n) - 1n;
  if (value < 0n || value > maxU128) {
    return err(new VarintEncodeError(`Value ${String(value)} is out of range for u128`));
  }

  const bytes: number[] = [];
  let n = value;

  while (n > 0x7fn) {
    bytes.push(Number(n & 0x7fn) | 0x80);
    n >>= 7n;
  }
  bytes.push(Number(n & 0x7fn));

  return ok({ bytes: new Uint8Array(bytes), bytesWritten: bytes.length });
}

// ============================================================================
// SIGNED VARINT ENCODERS (with zigzag)
// ============================================================================

/**
 * Encode a signed 16-bit varint (zigzag encoded)
 */
export function tryEncodeVarintI16(
  value: number
): Result<VarintEncodeResult, VarintEncodeError> {
  // Validate range
  if (value < -32768 || value > 32767) {
    return err(new VarintEncodeError(`Value ${String(value)} is out of range for i16`));
  }

  const encoded = zigzagEncodeI32(value);
  return tryEncodeVarintU16(encoded);
}

/**
 * Encode a signed 32-bit varint (zigzag encoded)
 */
export function tryEncodeVarintI32(
  value: number
): Result<VarintEncodeResult, VarintEncodeError> {
  // Validate range
  const minI32 = -2147483648;
  const maxI32 = 2147483647;
  if (value < minI32 || value > maxI32) {
    return err(new VarintEncodeError(`Value ${String(value)} is out of range for i32`));
  }

  const encoded = zigzagEncodeI32(value);
  return tryEncodeVarintU32(encoded >>> 0); // Convert to unsigned
}

/**
 * Encode a signed 64-bit varint (zigzag encoded, accepts bigint)
 */
export function tryEncodeVarintI64(
  value: bigint
): Result<VarintEncodeResult, VarintEncodeError> {
  // Validate range
  const minI64 = -(1n << 63n);
  const maxI64 = (1n << 63n) - 1n;
  if (value < minI64 || value > maxI64) {
    return err(new VarintEncodeError(`Value ${String(value)} is out of range for i64`));
  }

  const encoded = zigzagEncodeBigInt(value);
  return tryEncodeVarintU64(encoded);
}

/**
 * Encode a signed 128-bit varint (zigzag encoded, accepts bigint)
 */
export function tryEncodeVarintI128(
  value: bigint
): Result<VarintEncodeResult, VarintEncodeError> {
  // Validate range
  const minI128 = -(1n << 127n);
  const maxI128 = (1n << 127n) - 1n;
  if (value < minI128 || value > maxI128) {
    return err(new VarintEncodeError(`Value ${String(value)} is out of range for i128`));
  }

  const encoded = zigzagEncodeBigInt(value);
  return tryEncodeVarintU128(encoded);
}

// ============================================================================
// THROWING WRAPPERS - DECODING
// ============================================================================

export function decodeVarintU16(data: Uint8Array, offset?: number): VarintDecodeResult<number> {
  return unwrap(tryDecodeVarintU16(data, offset));
}

export function decodeVarintU32(data: Uint8Array, offset?: number): VarintDecodeResult<number> {
  return unwrap(tryDecodeVarintU32(data, offset));
}

export function decodeVarintU64(data: Uint8Array, offset?: number): VarintDecodeResult<bigint> {
  return unwrap(tryDecodeVarintU64(data, offset));
}

export function decodeVarintU128(data: Uint8Array, offset?: number): VarintDecodeResult<bigint> {
  return unwrap(tryDecodeVarintU128(data, offset));
}

export function decodeVarintI16(data: Uint8Array, offset?: number): VarintDecodeResult<number> {
  return unwrap(tryDecodeVarintI16(data, offset));
}

export function decodeVarintI32(data: Uint8Array, offset?: number): VarintDecodeResult<number> {
  return unwrap(tryDecodeVarintI32(data, offset));
}

export function decodeVarintI64(data: Uint8Array, offset?: number): VarintDecodeResult<bigint> {
  return unwrap(tryDecodeVarintI64(data, offset));
}

export function decodeVarintI128(data: Uint8Array, offset?: number): VarintDecodeResult<bigint> {
  return unwrap(tryDecodeVarintI128(data, offset));
}

// ============================================================================
// THROWING WRAPPERS - ENCODING
// ============================================================================

export function encodeVarintU16(value: number): VarintEncodeResult {
  return unwrap(tryEncodeVarintU16(value));
}

export function encodeVarintU32(value: number): VarintEncodeResult {
  return unwrap(tryEncodeVarintU32(value));
}

export function encodeVarintU64(value: bigint): VarintEncodeResult {
  return unwrap(tryEncodeVarintU64(value));
}

export function encodeVarintU128(value: bigint): VarintEncodeResult {
  return unwrap(tryEncodeVarintU128(value));
}

export function encodeVarintI16(value: number): VarintEncodeResult {
  return unwrap(tryEncodeVarintI16(value));
}

export function encodeVarintI32(value: number): VarintEncodeResult {
  return unwrap(tryEncodeVarintI32(value));
}

export function encodeVarintI64(value: bigint): VarintEncodeResult {
  return unwrap(tryEncodeVarintI64(value));
}

export function encodeVarintI128(value: bigint): VarintEncodeResult {
  return unwrap(tryEncodeVarintI128(value));
}
