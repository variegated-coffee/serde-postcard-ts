/**
 * Boolean primitive deserializer
 *
 * Per postcard spec:
 * - false: 0x00
 * - true: 0x01
 * - All other values are errors
 */

import { type Result, ok, err, unwrap } from "../types/result.js";

export class BoolDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoolDecodeError";
  }
}

export interface BoolDecodeResult {
  value: boolean;
  bytesRead: number;
}

/**
 * Decode a boolean value (Result API)
 */
export function tryDecodeBool(
  data: Uint8Array,
  offset = 0
): Result<BoolDecodeResult, BoolDecodeError> {
  if (offset < 0 || offset >= data.length) {
    return err(new BoolDecodeError("Offset out of bounds"));
  }

  const byte = data[offset];
  if (byte === undefined) {
    return err(new BoolDecodeError("Unexpected end of data"));
  }

  if (byte === 0x00) {
    return ok({ value: false, bytesRead: 1 });
  } else if (byte === 0x01) {
    return ok({ value: true, bytesRead: 1 });
  } else {
    return err(new BoolDecodeError(`Invalid boolean value: 0x${byte.toString(16)}`));
  }
}

/**
 * Decode a boolean value (throwing API)
 */
export function decodeBool(data: Uint8Array, offset?: number): BoolDecodeResult {
  return unwrap(tryDecodeBool(data, offset));
}

// ============================================================================
// ENCODING
// ============================================================================

export class BoolEncodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoolEncodeError";
  }
}

export interface BoolEncodeResult {
  bytes: Uint8Array;
  bytesWritten: number;
}

/**
 * Encode a boolean value (Result API)
 * false: 0x00, true: 0x01
 */
export function tryEncodeBool(
  value: boolean
): Result<BoolEncodeResult, BoolEncodeError> {
  const byte = value ? 0x01 : 0x00;
  return ok({ bytes: new Uint8Array([byte]), bytesWritten: 1 });
}

/**
 * Encode a boolean value (throwing API)
 */
export function encodeBool(value: boolean): BoolEncodeResult {
  return unwrap(tryEncodeBool(value));
}
