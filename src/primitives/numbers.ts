/**
 * Number primitive deserializers
 *
 * Handles:
 * - u8, i8: single byte
 * - f32: 4 bytes, little-endian IEEE 754
 * - f64: 8 bytes, little-endian IEEE 754
 * - Larger integers use varint (see codec/varint.ts)
 */

import { type Result, ok, err, unwrap } from "../types/result.js";

export class NumberDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NumberDecodeError";
  }
}

export interface NumberDecodeResult {
  value: number;
  bytesRead: number;
}

// ============================================================================
// U8 / I8 (single byte)
// ============================================================================

/**
 * Decode an unsigned 8-bit integer (Result API)
 */
export function tryDecodeU8(
  data: Uint8Array,
  offset = 0
): Result<NumberDecodeResult, NumberDecodeError> {
  if (offset < 0 || offset >= data.length) {
    return err(new NumberDecodeError("Offset out of bounds"));
  }

  const byte = data[offset];
  if (byte === undefined) {
    return err(new NumberDecodeError("Unexpected end of data"));
  }

  return ok({ value: byte, bytesRead: 1 });
}

/**
 * Decode a signed 8-bit integer (Result API)
 */
export function tryDecodeI8(
  data: Uint8Array,
  offset = 0
): Result<NumberDecodeResult, NumberDecodeError> {
  if (offset < 0 || offset >= data.length) {
    return err(new NumberDecodeError("Offset out of bounds"));
  }

  const byte = data[offset];
  if (byte === undefined) {
    return err(new NumberDecodeError("Unexpected end of data"));
  }

  // Convert to signed using two's complement
  const signed = byte > 127 ? byte - 256 : byte;
  return ok({ value: signed, bytesRead: 1 });
}

// ============================================================================
// F32 / F64 (IEEE 754 floating point)
// ============================================================================

/**
 * Decode a 32-bit float (f32) in little-endian format (Result API)
 */
export function tryDecodeF32(
  data: Uint8Array,
  offset = 0
): Result<NumberDecodeResult, NumberDecodeError> {
  if (offset < 0 || offset + 4 > data.length) {
    return err(new NumberDecodeError("Not enough bytes for f32"));
  }

  // Read 4 bytes in little-endian order
  const bytes = data.slice(offset, offset + 4);
  const view = new DataView(bytes.buffer, bytes.byteOffset, 4);
  const value = view.getFloat32(0, true); // true = little-endian

  return ok({ value, bytesRead: 4 });
}

/**
 * Decode a 64-bit float (f64) in little-endian format (Result API)
 */
export function tryDecodeF64(
  data: Uint8Array,
  offset = 0
): Result<NumberDecodeResult, NumberDecodeError> {
  if (offset < 0 || offset + 8 > data.length) {
    return err(new NumberDecodeError("Not enough bytes for f64"));
  }

  // Read 8 bytes in little-endian order
  const bytes = data.slice(offset, offset + 8);
  const view = new DataView(bytes.buffer, bytes.byteOffset, 8);
  const value = view.getFloat64(0, true); // true = little-endian

  return ok({ value, bytesRead: 8 });
}

// ============================================================================
// Throwing wrappers
// ============================================================================

export function decodeU8(data: Uint8Array, offset?: number): NumberDecodeResult {
  return unwrap(tryDecodeU8(data, offset));
}

export function decodeI8(data: Uint8Array, offset?: number): NumberDecodeResult {
  return unwrap(tryDecodeI8(data, offset));
}

export function decodeF32(data: Uint8Array, offset?: number): NumberDecodeResult {
  return unwrap(tryDecodeF32(data, offset));
}

export function decodeF64(data: Uint8Array, offset?: number): NumberDecodeResult {
  return unwrap(tryDecodeF64(data, offset));
}

// ============================================================================
// ENCODING
// ============================================================================

export class NumberEncodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NumberEncodeError";
  }
}

export interface NumberEncodeResult {
  bytes: Uint8Array;
  bytesWritten: number;
}

/**
 * Encode an unsigned 8-bit integer (Result API)
 */
export function tryEncodeU8(
  value: number
): Result<NumberEncodeResult, NumberEncodeError> {
  if (value < 0 || value > 255) {
    return err(new NumberEncodeError(`Value ${String(value)} is out of range for u8`));
  }

  return ok({ bytes: new Uint8Array([value]), bytesWritten: 1 });
}

/**
 * Encode a signed 8-bit integer (Result API)
 */
export function tryEncodeI8(
  value: number
): Result<NumberEncodeResult, NumberEncodeError> {
  if (value < -128 || value > 127) {
    return err(new NumberEncodeError(`Value ${String(value)} is out of range for i8`));
  }

  // Convert to unsigned using two's complement
  const unsigned = value < 0 ? value + 256 : value;
  return ok({ bytes: new Uint8Array([unsigned]), bytesWritten: 1 });
}

/**
 * Encode a 32-bit float (f32) in little-endian format (Result API)
 */
export function tryEncodeF32(
  value: number
): Result<NumberEncodeResult, NumberEncodeError> {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setFloat32(0, value, true); // true = little-endian

  return ok({ bytes: new Uint8Array(buffer), bytesWritten: 4 });
}

/**
 * Encode a 64-bit float (f64) in little-endian format (Result API)
 */
export function tryEncodeF64(
  value: number
): Result<NumberEncodeResult, NumberEncodeError> {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, true); // true = little-endian

  return ok({ bytes: new Uint8Array(buffer), bytesWritten: 8 });
}

// ============================================================================
// Throwing wrappers - Encoding
// ============================================================================

export function encodeU8(value: number): NumberEncodeResult {
  return unwrap(tryEncodeU8(value));
}

export function encodeI8(value: number): NumberEncodeResult {
  return unwrap(tryEncodeI8(value));
}

export function encodeF32(value: number): NumberEncodeResult {
  return unwrap(tryEncodeF32(value));
}

export function encodeF64(value: number): NumberEncodeResult {
  return unwrap(tryEncodeF64(value));
}
