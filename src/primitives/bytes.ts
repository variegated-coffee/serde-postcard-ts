/**
 * Byte array primitive deserializer
 *
 * Per postcard spec:
 * - bytes: varint(usize) length + raw bytes
 */

import { type Result, ok, err, unwrap } from "../types/result.js";
import { tryDecodeVarintU64, tryEncodeVarintU64 } from "../codec/varint.js";

export class BytesDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BytesDecodeError";
  }
}

export interface BytesDecodeResult {
  value: Uint8Array;
  bytesRead: number;
}

/**
 * Decode a byte array (Result API)
 * Format: varint(usize) length + raw bytes
 */
export function tryDecodeBytes(
  data: Uint8Array,
  offset = 0
): Result<BytesDecodeResult, BytesDecodeError> {
  if (offset < 0 || offset >= data.length) {
    return err(new BytesDecodeError("Offset out of bounds"));
  }

  // Decode length as varint
  const lengthResult = tryDecodeVarintU64(data, offset);
  if (!lengthResult.ok) {
    return err(new BytesDecodeError(`Failed to decode bytes length: ${lengthResult.error.message}`));
  }

  const length = Number(lengthResult.value.value);
  const lengthBytes = lengthResult.value.bytesRead;

  // Check if we have enough bytes
  if (offset + lengthBytes + length > data.length) {
    return err(new BytesDecodeError("Not enough bytes for byte array data"));
  }

  // Extract bytes
  const value = data.slice(offset + lengthBytes, offset + lengthBytes + length);

  return ok({ value, bytesRead: lengthBytes + length });
}

/**
 * Decode a byte array (throwing API)
 */
export function decodeBytes(data: Uint8Array, offset?: number): BytesDecodeResult {
  return unwrap(tryDecodeBytes(data, offset));
}

// ============================================================================
// ENCODING
// ============================================================================

export class BytesEncodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BytesEncodeError";
  }
}

export interface BytesEncodeResult {
  bytes: Uint8Array;
  bytesWritten: number;
}

/**
 * Encode a byte array (Result API)
 * Format: varint(usize) length + raw bytes
 */
export function tryEncodeBytes(
  value: Uint8Array
): Result<BytesEncodeResult, BytesEncodeError> {
  // Encode length as varint
  const lengthResult = tryEncodeVarintU64(BigInt(value.length));
  if (!lengthResult.ok) {
    return err(new BytesEncodeError(`Failed to encode bytes length: ${lengthResult.error.message}`));
  }

  // Combine length + raw bytes
  const result = new Uint8Array(lengthResult.value.bytesWritten + value.length);
  result.set(lengthResult.value.bytes, 0);
  result.set(value, lengthResult.value.bytesWritten);

  return ok({
    bytes: result,
    bytesWritten: lengthResult.value.bytesWritten + value.length
  });
}

/**
 * Encode a byte array (throwing API)
 */
export function encodeBytes(value: Uint8Array): BytesEncodeResult {
  return unwrap(tryEncodeBytes(value));
}
