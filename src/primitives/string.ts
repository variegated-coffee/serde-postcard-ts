/**
 * String and char primitive deserializers
 *
 * Per postcard spec:
 * - string: varint(usize) length + UTF-8 bytes
 * - char: UTF-8 encoded as string (single Unicode scalar value)
 */

import { type Result, ok, err, unwrap } from "../types/result.js";
import { tryDecodeVarintU64, tryEncodeVarintU64 } from "../codec/varint.js";

export class StringDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StringDecodeError";
  }
}

export interface StringDecodeResult {
  value: string;
  bytesRead: number;
}

/**
 * Decode a UTF-8 string (Result API)
 * Format: varint(usize) length + UTF-8 bytes
 */
export function tryDecodeString(
  data: Uint8Array,
  offset = 0
): Result<StringDecodeResult, StringDecodeError> {
  if (offset < 0 || offset >= data.length) {
    return err(new StringDecodeError("Offset out of bounds"));
  }

  // Decode length as varint
  const lengthResult = tryDecodeVarintU64(data, offset);
  if (!lengthResult.ok) {
    return err(new StringDecodeError(`Failed to decode string length: ${lengthResult.error.message}`));
  }

  const length = Number(lengthResult.value.value);
  const lengthBytes = lengthResult.value.bytesRead;

  // Check if we have enough bytes for the string
  if (offset + lengthBytes + length > data.length) {
    return err(new StringDecodeError("Not enough bytes for string data"));
  }

  // Extract UTF-8 bytes
  const stringBytes = data.slice(offset + lengthBytes, offset + lengthBytes + length);

  // Decode UTF-8
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const value = decoder.decode(stringBytes);
    return ok({ value, bytesRead: lengthBytes + length });
  } catch (e) {
    return err(new StringDecodeError(`Invalid UTF-8: ${e instanceof Error ? e.message : String(e)}`));
  }
}

/**
 * Decode a char (single Unicode scalar value) (Result API)
 * Per spec, chars are UTF-8 encoded as strings
 */
export function tryDecodeChar(
  data: Uint8Array,
  offset = 0
): Result<StringDecodeResult, StringDecodeError> {
  const stringResult = tryDecodeString(data, offset);
  if (!stringResult.ok) {
    return stringResult;
  }

  const { value, bytesRead } = stringResult.value;

  // Validate it's a single Unicode scalar value
  // In JavaScript, we count code points, not UTF-16 code units
  const codePoints = Array.from(value);
  if (codePoints.length !== 1) {
    return err(new StringDecodeError(`Char must be a single Unicode scalar value, got ${String(codePoints.length)} code points`));
  }

  return ok({ value, bytesRead });
}

// ============================================================================
// Throwing wrappers
// ============================================================================

export function decodeString(data: Uint8Array, offset?: number): StringDecodeResult {
  return unwrap(tryDecodeString(data, offset));
}

export function decodeChar(data: Uint8Array, offset?: number): StringDecodeResult {
  return unwrap(tryDecodeChar(data, offset));
}

// ============================================================================
// ENCODING
// ============================================================================

export class StringEncodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StringEncodeError";
  }
}

export interface StringEncodeResult {
  bytes: Uint8Array;
  bytesWritten: number;
}

/**
 * Encode a UTF-8 string (Result API)
 * Format: varint(usize) length + UTF-8 bytes
 */
export function tryEncodeString(
  value: string
): Result<StringEncodeResult, StringEncodeError> {
  // Encode string as UTF-8
  const encoder = new TextEncoder();
  const stringBytes = encoder.encode(value);

  // Encode length as varint
  const lengthResult = tryEncodeVarintU64(BigInt(stringBytes.length));
  if (!lengthResult.ok) {
    return err(new StringEncodeError(`Failed to encode string length: ${lengthResult.error.message}`));
  }

  // Combine length + string bytes
  const result = new Uint8Array(lengthResult.value.bytesWritten + stringBytes.length);
  result.set(lengthResult.value.bytes, 0);
  result.set(stringBytes, lengthResult.value.bytesWritten);

  return ok({
    bytes: result,
    bytesWritten: lengthResult.value.bytesWritten + stringBytes.length
  });
}

/**
 * Encode a char (single Unicode scalar value) (Result API)
 * Per spec, chars are UTF-8 encoded as strings
 */
export function tryEncodeChar(
  value: string
): Result<StringEncodeResult, StringEncodeError> {
  // Validate it's a single Unicode scalar value
  const codePoints = Array.from(value);
  if (codePoints.length !== 1) {
    return err(new StringEncodeError(`Char must be a single Unicode scalar value, got ${String(codePoints.length)} code points`));
  }

  return tryEncodeString(value);
}

// ============================================================================
// Throwing wrappers - Encoding
// ============================================================================

export function encodeString(value: string): StringEncodeResult {
  return unwrap(tryEncodeString(value));
}

export function encodeChar(value: string): StringEncodeResult {
  return unwrap(tryEncodeChar(value));
}
