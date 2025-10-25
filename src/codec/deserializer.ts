/**
 * Schema-driven deserialization
 *
 * Implements deserialization for all 29 Serde data model types using
 * runtime schema definitions to drive the decoding process.
 */

import { type Result, ok, err, unwrap } from "../types/result.js";
import type {
  Schema,
  InferType,
  BoolSchema,
  I8Schema,
  I16Schema,
  I32Schema,
  I64Schema,
  I128Schema,
  U8Schema,
  U16Schema,
  U32Schema,
  U64Schema,
  U128Schema,
  F32Schema,
  F64Schema,
  CharSchema,
  StringSchema,
  BytesSchema,
  OptionSchema,
  UnitSchema,
  UnitStructSchema,
  NewtypeStructSchema,
  SeqSchema,
  TupleSchema,
  TupleStructSchema,
  MapSchema,
  StructSchema,
  EnumSchema,
  EnumVariant,
  UnitVariantSchema,
  NewtypeVariantSchema,
  TupleVariantSchema,
  StructVariantSchema,
} from "../types/schema.js";

// Import primitive deserializers
import { tryDecodeBool } from "../primitives/bool.js";
import {
  tryDecodeU8,
  tryDecodeI8,
  tryDecodeF32,
  tryDecodeF64,
} from "../primitives/numbers.js";
import { tryDecodeString, tryDecodeChar } from "../primitives/string.js";
import { tryDecodeBytes } from "../primitives/bytes.js";

// Import varint codec
import {
  tryDecodeVarintU16,
  tryDecodeVarintU32,
  tryDecodeVarintU64,
  tryDecodeVarintU128,
  tryDecodeVarintI16,
  tryDecodeVarintI32,
  tryDecodeVarintI64,
  tryDecodeVarintI128,
} from "./varint.js";

export class DeserializeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeserializeError";
  }
}

export interface DeserializeResult<T> {
  value: T;
  bytesRead: number;
}

/**
 * Deserialize data using a schema (Result API)
 *
 * The schema drives the deserialization process and provides type inference.
 */
export function tryDeserialize<S extends Schema>(
  schema: S,
  data: Uint8Array,
  offset = 0
): Result<DeserializeResult<InferType<S>>, DeserializeError> {
  // Bounds check
  if (offset < 0 || offset > data.length) {
    return err(new DeserializeError("Offset out of bounds"));
  }

  // Dispatch based on schema kind
  // TypeScript can't narrow InferType<S> based on schema.kind, so we use 'as any' for type safety
  // Each handler returns the correct type for its schema, but TS can't verify this statically
  /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
  switch (schema.kind) {
    case "bool":
      return deserializeBool(schema, data, offset) as any;
    case "i8":
      return deserializeI8(schema, data, offset) as any;
    case "i16":
      return deserializeI16(schema, data, offset) as any;
    case "i32":
      return deserializeI32(schema, data, offset) as any;
    case "i64":
      return deserializeI64(schema, data, offset) as any;
    case "i128":
      return deserializeI128(schema, data, offset) as any;
    case "u8":
      return deserializeU8(schema, data, offset) as any;
    case "u16":
      return deserializeU16(schema, data, offset) as any;
    case "u32":
      return deserializeU32(schema, data, offset) as any;
    case "u64":
      return deserializeU64(schema, data, offset) as any;
    case "u128":
      return deserializeU128(schema, data, offset) as any;
    case "f32":
      return deserializeF32(schema, data, offset) as any;
    case "f64":
      return deserializeF64(schema, data, offset) as any;
    case "char":
      return deserializeChar(schema, data, offset) as any;
    case "string":
      return deserializeString(schema, data, offset) as any;
    case "bytes":
      return deserializeBytes(schema, data, offset) as any;
    case "option":
      return deserializeOption(schema, data, offset) as any;
    case "unit":
      return deserializeUnit(schema, data, offset) as any;
    case "unit_struct":
      return deserializeUnitStruct(schema, data, offset) as any;
    case "newtype_struct":
      return deserializeNewtypeStruct(schema, data, offset) as any;
    case "seq":
      return deserializeSeq(schema, data, offset) as any;
    case "tuple":
      return deserializeTuple(schema, data, offset) as any;
    case "tuple_struct":
      return deserializeTupleStruct(schema, data, offset) as any;
    case "map":
      return deserializeMap(schema, data, offset) as any;
    case "struct":
      return deserializeStruct(schema, data, offset) as any;
    case "enum":
      return deserializeEnum(schema, data, offset) as any;
    default: {
      // Exhaustiveness check
      const _exhaustive: never = schema;
      return err(new DeserializeError(`Unknown schema kind: ${(_exhaustive as Schema).kind}`));
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
}

// ============================================================================
// PRIMITIVE TYPE HANDLERS
// ============================================================================

function deserializeBool(
  _schema: BoolSchema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<boolean>, DeserializeError> {
  const result = tryDecodeBool(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize bool: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeI8(
  _schema: I8Schema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<number>, DeserializeError> {
  const result = tryDecodeI8(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize i8: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeI16(
  _schema: I16Schema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<number>, DeserializeError> {
  const result = tryDecodeVarintI16(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize i16: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeI32(
  _schema: I32Schema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<number>, DeserializeError> {
  const result = tryDecodeVarintI32(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize i32: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeI64(
  _schema: I64Schema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<bigint>, DeserializeError> {
  const result = tryDecodeVarintI64(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize i64: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeI128(
  _schema: I128Schema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<bigint>, DeserializeError> {
  const result = tryDecodeVarintI128(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize i128: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeU8(
  _schema: U8Schema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<number>, DeserializeError> {
  const result = tryDecodeU8(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize u8: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeU16(
  _schema: U16Schema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<number>, DeserializeError> {
  const result = tryDecodeVarintU16(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize u16: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeU32(
  _schema: U32Schema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<number>, DeserializeError> {
  const result = tryDecodeVarintU32(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize u32: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeU64(
  _schema: U64Schema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<bigint>, DeserializeError> {
  const result = tryDecodeVarintU64(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize u64: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeU128(
  _schema: U128Schema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<bigint>, DeserializeError> {
  const result = tryDecodeVarintU128(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize u128: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeF32(
  _schema: F32Schema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<number>, DeserializeError> {
  const result = tryDecodeF32(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize f32: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeF64(
  _schema: F64Schema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<number>, DeserializeError> {
  const result = tryDecodeF64(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize f64: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeChar(
  _schema: CharSchema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<string>, DeserializeError> {
  const result = tryDecodeChar(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize char: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeString(
  _schema: StringSchema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<string>, DeserializeError> {
  const result = tryDecodeString(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize string: ${result.error.message}`));
  }
  return ok(result.value);
}

function deserializeBytes(
  _schema: BytesSchema,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<Uint8Array>, DeserializeError> {
  const result = tryDecodeBytes(data, offset);
  if (!result.ok) {
    return err(new DeserializeError(`Failed to deserialize bytes: ${result.error.message}`));
  }
  return ok(result.value);
}

// ============================================================================
// OPTION TYPE HANDLER
// ============================================================================

function deserializeOption<T extends Schema>(
  schema: OptionSchema<T>,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<InferType<T> | null>, DeserializeError> {
  // Read discriminant byte: 0x00 = None, 0x01 = Some
  if (offset >= data.length) {
    return err(new DeserializeError("Unexpected end of data while reading option discriminant"));
  }

  const discriminant = data[offset];
  if (discriminant === undefined) {
    return err(new DeserializeError("Unexpected end of data while reading option discriminant"));
  }

  if (discriminant === 0x00) {
    // None
    return ok({ value: null, bytesRead: 1 });
  } else if (discriminant === 0x01) {
    // Some - deserialize inner value
    const innerResult = tryDeserialize(schema.inner, data, offset + 1);
    if (!innerResult.ok) {
      return err(new DeserializeError(`Failed to deserialize option value: ${innerResult.error.message}`));
    }
    return ok({
      value: innerResult.value.value,
      bytesRead: 1 + innerResult.value.bytesRead,
    });
  } else {
    return err(new DeserializeError(`Invalid option discriminant: 0x${discriminant.toString(16)}`));
  }
}

// ============================================================================
// UNIT TYPE HANDLERS
// ============================================================================

function deserializeUnit(
  _schema: UnitSchema,
  _data: Uint8Array,
  _offset: number
): Result<DeserializeResult<void>, DeserializeError> {
  // Unit type occupies zero bytes
  return ok({ value: undefined, bytesRead: 0 });
}

function deserializeUnitStruct(
  _schema: UnitStructSchema,
  _data: Uint8Array,
  _offset: number
): Result<DeserializeResult<Record<string, never>>, DeserializeError> {
  // Unit struct occupies zero bytes
  return ok({ value: {} as Record<string, never>, bytesRead: 0 });
}

// ============================================================================
// NEWTYPE STRUCT HANDLER
// ============================================================================

function deserializeNewtypeStruct<T extends Schema>(
  schema: NewtypeStructSchema<T>,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<InferType<T>>, DeserializeError> {
  // Newtype struct is just the inner value, no wrapper
  const innerResult = tryDeserialize(schema.inner, data, offset);
  if (!innerResult.ok) {
    return err(new DeserializeError(`Failed to deserialize newtype struct: ${innerResult.error.message}`));
  }
  return ok(innerResult.value);
}

// ============================================================================
// SEQUENCE HANDLER
// ============================================================================

function deserializeSeq<T extends Schema>(
  schema: SeqSchema<T>,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<InferType<T>[]>, DeserializeError> {
  // Read length as varint(usize)
  const lengthResult = tryDecodeVarintU64(data, offset);
  if (!lengthResult.ok) {
    return err(new DeserializeError(`Failed to deserialize seq length: ${lengthResult.error.message}`));
  }

  const length = Number(lengthResult.value.value);
  let currentOffset = offset + lengthResult.value.bytesRead;
  const items: InferType<T>[] = [];

  // Deserialize each element
  for (let i = 0; i < length; i++) {
    const itemResult = tryDeserialize(schema.item, data, currentOffset);
    if (!itemResult.ok) {
      return err(new DeserializeError(`Failed to deserialize seq item ${String(i)}: ${itemResult.error.message}`));
    }
    items.push(itemResult.value.value);
    currentOffset += itemResult.value.bytesRead;
  }

  return ok({
    value: items,
    bytesRead: currentOffset - offset,
  });
}

// ============================================================================
// TUPLE HANDLER
// ============================================================================

function deserializeTuple<T extends readonly Schema[]>(
  schema: TupleSchema<T>,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<{ [K in keyof T]: T[K] extends Schema ? InferType<T[K]> : never }>, DeserializeError> {
  let currentOffset = offset;
  const items: unknown[] = [];

  // Deserialize each item (no length prefix for tuples)
  for (let i = 0; i < schema.items.length; i++) {
    const itemSchema = schema.items[i];
    if (itemSchema === undefined) {
      return err(new DeserializeError(`Tuple item ${String(i)} schema is undefined`));
    }

    const itemResult = tryDeserialize(itemSchema, data, currentOffset);
    if (!itemResult.ok) {
      return err(new DeserializeError(`Failed to deserialize tuple item ${String(i)}: ${itemResult.error.message}`));
    }
    items.push(itemResult.value.value);
    currentOffset += itemResult.value.bytesRead;
  }

  return ok({
    value: items as { [K in keyof T]: T[K] extends Schema ? InferType<T[K]> : never },
    bytesRead: currentOffset - offset,
  });
}

// ============================================================================
// TUPLE STRUCT HANDLER
// ============================================================================

function deserializeTupleStruct<T extends readonly Schema[]>(
  schema: TupleStructSchema<T>,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<{ [K in keyof T]: T[K] extends Schema ? InferType<T[K]> : never }>, DeserializeError> {
  // Tuple struct is encoded as a tuple
  let currentOffset = offset;
  const items: unknown[] = [];

  for (let i = 0; i < schema.items.length; i++) {
    const itemSchema = schema.items[i];
    if (itemSchema === undefined) {
      return err(new DeserializeError(`Tuple struct item ${String(i)} schema is undefined`));
    }

    const itemResult = tryDeserialize(itemSchema, data, currentOffset);
    if (!itemResult.ok) {
      return err(new DeserializeError(`Failed to deserialize tuple struct item ${String(i)}: ${itemResult.error.message}`));
    }
    items.push(itemResult.value.value);
    currentOffset += itemResult.value.bytesRead;
  }

  return ok({
    value: items as { [K in keyof T]: T[K] extends Schema ? InferType<T[K]> : never },
    bytesRead: currentOffset - offset,
  });
}

// ============================================================================
// MAP HANDLER
// ============================================================================

function deserializeMap<K extends Schema, V extends Schema>(
  schema: MapSchema<K, V>,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<Map<InferType<K>, InferType<V>>>, DeserializeError> {
  // Read entry count as varint(usize)
  const countResult = tryDecodeVarintU64(data, offset);
  if (!countResult.ok) {
    return err(new DeserializeError(`Failed to deserialize map count: ${countResult.error.message}`));
  }

  const count = Number(countResult.value.value);
  let currentOffset = offset + countResult.value.bytesRead;
  const map = new Map<InferType<K>, InferType<V>>();

  // Deserialize each key-value pair
  for (let i = 0; i < count; i++) {
    // Deserialize key
    const keyResult = tryDeserialize(schema.key, data, currentOffset);
    if (!keyResult.ok) {
      return err(new DeserializeError(`Failed to deserialize map key ${String(i)}: ${keyResult.error.message}`));
    }
    currentOffset += keyResult.value.bytesRead;

    // Deserialize value
    const valueResult = tryDeserialize(schema.value, data, currentOffset);
    if (!valueResult.ok) {
      return err(new DeserializeError(`Failed to deserialize map value ${String(i)}: ${valueResult.error.message}`));
    }
    currentOffset += valueResult.value.bytesRead;

    map.set(keyResult.value.value, valueResult.value.value);
  }

  return ok({
    value: map,
    bytesRead: currentOffset - offset,
  });
}

// ============================================================================
// STRUCT HANDLER
// ============================================================================

function deserializeStruct<T extends Record<string, Schema>>(
  schema: StructSchema<T>,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<{ [K in keyof T]: InferType<T[K]> }>, DeserializeError> {
  let currentOffset = offset;
  const obj: Record<string, unknown> = {};

  // Deserialize each field in order
  for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
    const fieldResult = tryDeserialize(fieldSchema, data, currentOffset);
    if (!fieldResult.ok) {
      return err(new DeserializeError(`Failed to deserialize struct field '${fieldName}': ${fieldResult.error.message}`));
    }
    obj[fieldName] = fieldResult.value.value;
    currentOffset += fieldResult.value.bytesRead;
  }

  return ok({
    value: obj as { [K in keyof T]: InferType<T[K]> },
    bytesRead: currentOffset - offset,
  });
}

// ============================================================================
// ENUM HANDLER
// ============================================================================

function deserializeEnum<V extends Record<string, EnumVariant>>(
  schema: EnumSchema<V>,
  data: Uint8Array,
  offset: number
): Result<DeserializeResult<{
  [K in keyof V]: V[K] extends UnitVariantSchema
    ? { type: K }
    : V[K] extends NewtypeVariantSchema<infer T>
      ? { type: K; value: InferType<T> }
      : V[K] extends TupleVariantSchema<infer T>
        ? { type: K; value: { [I in keyof T]: T[I] extends Schema ? InferType<T[I]> : never } }
        : V[K] extends StructVariantSchema<infer T>
          ? { type: K; value: { [F in keyof T]: InferType<T[F]> } }
          : never;
}[keyof V]>, DeserializeError> {
  // Read variant discriminant as varint(u32)
  const discriminantResult = tryDecodeVarintU32(data, offset);
  if (!discriminantResult.ok) {
    return err(new DeserializeError(`Failed to deserialize enum discriminant: ${discriminantResult.error.message}`));
  }

  const discriminant = discriminantResult.value.value;
  let currentOffset = offset + discriminantResult.value.bytesRead;

  // Map discriminant index to variant name
  const variantNames = Object.keys(schema.variants);
  const variantName = variantNames[discriminant];
  if (variantName === undefined) {
    return err(new DeserializeError(`Invalid enum discriminant: ${String(discriminant)} (max: ${String(variantNames.length - 1)})`));
  }

  const variant = schema.variants[variantName];
  if (variant === undefined) {
    return err(new DeserializeError(`Variant '${variantName}' not found in schema`));
  }

  // Deserialize variant based on its kind
  switch (variant.kind) {
    case "unit_variant": {
      // Unit variant has no additional data
      return ok({
        value: { type: variantName } as {
          [K in keyof V]: V[K] extends UnitVariantSchema
            ? { type: K }
            : V[K] extends NewtypeVariantSchema<infer T>
              ? { type: K; value: InferType<T> }
              : V[K] extends TupleVariantSchema<infer T>
                ? { type: K; value: { [I in keyof T]: T[I] extends Schema ? InferType<T[I]> : never } }
                : V[K] extends StructVariantSchema<infer T>
                  ? { type: K; value: { [F in keyof T]: InferType<T[F]> } }
                  : never;
        }[keyof V],
        bytesRead: currentOffset - offset,
      });
    }

    case "newtype_variant": {
      // Newtype variant contains a single value
      const valueResult = tryDeserialize(variant.inner, data, currentOffset);
      if (!valueResult.ok) {
        return err(new DeserializeError(`Failed to deserialize newtype variant value: ${valueResult.error.message}`));
      }
      currentOffset += valueResult.value.bytesRead;

      return ok({
        value: { type: variantName, value: valueResult.value.value } as {
          [K in keyof V]: V[K] extends UnitVariantSchema
            ? { type: K }
            : V[K] extends NewtypeVariantSchema<infer T>
              ? { type: K; value: InferType<T> }
              : V[K] extends TupleVariantSchema<infer T>
                ? { type: K; value: { [I in keyof T]: T[I] extends Schema ? InferType<T[I]> : never } }
                : V[K] extends StructVariantSchema<infer T>
                  ? { type: K; value: { [F in keyof T]: InferType<T[F]> } }
                  : never;
        }[keyof V],
        bytesRead: currentOffset - offset,
      });
    }

    case "tuple_variant": {
      // Tuple variant contains tuple items
      const items: unknown[] = [];
      for (let i = 0; i < variant.items.length; i++) {
        const itemSchema = variant.items[i];
        if (itemSchema === undefined) {
          return err(new DeserializeError(`Tuple variant item ${String(i)} schema is undefined`));
        }

        const itemResult = tryDeserialize(itemSchema, data, currentOffset);
        if (!itemResult.ok) {
          return err(new DeserializeError(`Failed to deserialize tuple variant item ${String(i)}: ${itemResult.error.message}`));
        }
        items.push(itemResult.value.value);
        currentOffset += itemResult.value.bytesRead;
      }

      return ok({
        value: { type: variantName, value: items } as {
          [K in keyof V]: V[K] extends UnitVariantSchema
            ? { type: K }
            : V[K] extends NewtypeVariantSchema<infer T>
              ? { type: K; value: InferType<T> }
              : V[K] extends TupleVariantSchema<infer T>
                ? { type: K; value: { [I in keyof T]: T[I] extends Schema ? InferType<T[I]> : never } }
                : V[K] extends StructVariantSchema<infer T>
                  ? { type: K; value: { [F in keyof T]: InferType<T[F]> } }
                  : never;
        }[keyof V],
        bytesRead: currentOffset - offset,
      });
    }

    case "struct_variant": {
      // Struct variant contains named fields
      const obj: Record<string, unknown> = {};
      for (const [fieldName, fieldSchema] of Object.entries(variant.fields)) {
        const fieldResult = tryDeserialize(fieldSchema, data, currentOffset);
        if (!fieldResult.ok) {
          return err(new DeserializeError(`Failed to deserialize struct variant field '${fieldName}': ${fieldResult.error.message}`));
        }
        obj[fieldName] = fieldResult.value.value;
        currentOffset += fieldResult.value.bytesRead;
      }

      return ok({
        value: { type: variantName, value: obj } as {
          [K in keyof V]: V[K] extends UnitVariantSchema
            ? { type: K }
            : V[K] extends NewtypeVariantSchema<infer T>
              ? { type: K; value: InferType<T> }
              : V[K] extends TupleVariantSchema<infer T>
                ? { type: K; value: { [I in keyof T]: T[I] extends Schema ? InferType<T[I]> : never } }
                : V[K] extends StructVariantSchema<infer T>
                  ? { type: K; value: { [F in keyof T]: InferType<T[F]> } }
                  : never;
        }[keyof V],
        bytesRead: currentOffset - offset,
      });
    }

    default: {
      const _exhaustive: never = variant;
      return err(new DeserializeError(`Unknown variant kind: ${(_exhaustive as EnumVariant).kind}`));
    }
  }
}

// ============================================================================
// THROWING WRAPPER
// ============================================================================

/**
 * Deserialize data using a schema (throwing API)
 *
 * Throws DeserializeError on failure
 */
export function deserialize<S extends Schema>(
  schema: S,
  data: Uint8Array,
  offset?: number
): DeserializeResult<InferType<S>> {
  return unwrap(tryDeserialize(schema, data, offset));
}
