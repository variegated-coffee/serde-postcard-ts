/**
 * Schema-driven serialization
 *
 * Implements serialization for all 29 Serde data model types using
 * runtime schema definitions to drive the encoding process.
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
} from "../types/schema.js";

// Import primitive serializers
import { tryEncodeBool } from "../primitives/bool.js";
import {
  tryEncodeU8,
  tryEncodeI8,
  tryEncodeF32,
  tryEncodeF64,
} from "../primitives/numbers.js";
import { tryEncodeString, tryEncodeChar } from "../primitives/string.js";
import { tryEncodeBytes } from "../primitives/bytes.js";

// Import varint codec
import {
  tryEncodeVarintU16,
  tryEncodeVarintU32,
  tryEncodeVarintU64,
  tryEncodeVarintU128,
  tryEncodeVarintI16,
  tryEncodeVarintI32,
  tryEncodeVarintI64,
  tryEncodeVarintI128,
} from "./varint.js";

export class SerializeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SerializeError";
  }
}

/**
 * Serialize data using a schema (Result API)
 *
 * The schema drives the serialization process and provides type inference.
 * Note: value is unknown for maximum flexibility - the schema validates the structure
 */
export function trySerialize<S extends Schema>(
  schema: S,
  value: unknown
): Result<Uint8Array, SerializeError> {
  // Dispatch based on schema kind
  // TypeScript can't narrow InferType<S> based on schema.kind, so we use 'as any' for type safety
  // Each handler accepts the correct type for its schema, but TS can't verify this statically
  /* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
  switch (schema.kind) {
    case "bool":
      return serializeBool(schema, value as any);
    case "i8":
      return serializeI8(schema, value as any);
    case "i16":
      return serializeI16(schema, value as any);
    case "i32":
      return serializeI32(schema, value as any);
    case "i64":
      return serializeI64(schema, value as any);
    case "i128":
      return serializeI128(schema, value as any);
    case "u8":
      return serializeU8(schema, value as any);
    case "u16":
      return serializeU16(schema, value as any);
    case "u32":
      return serializeU32(schema, value as any);
    case "u64":
      return serializeU64(schema, value as any);
    case "u128":
      return serializeU128(schema, value as any);
    case "f32":
      return serializeF32(schema, value as any);
    case "f64":
      return serializeF64(schema, value as any);
    case "char":
      return serializeChar(schema, value as any);
    case "string":
      return serializeString(schema, value as any);
    case "bytes":
      return serializeBytes(schema, value as any);
    case "option":
      return serializeOption(schema as OptionSchema<Schema>, value as any);
    case "unit":
      return serializeUnit(schema, value as any);
    case "unit_struct":
      return serializeUnitStruct(schema, value as any);
    case "newtype_struct":
      return serializeNewtypeStruct(schema as NewtypeStructSchema<Schema>, value as any);
    case "seq":
      return serializeSeq(schema as SeqSchema<Schema>, value as any);
    case "tuple":
      return serializeTuple(schema as TupleSchema<readonly Schema[]>, value as any);
    case "tuple_struct":
      return serializeTupleStruct(schema as TupleStructSchema<readonly Schema[]>, value as any);
    case "map":
      return serializeMap(schema as MapSchema<Schema, Schema>, value as any);
    case "struct":
      return serializeStruct(schema as StructSchema<Record<string, Schema>>, value as any);
    case "enum":
      return serializeEnum(schema as EnumSchema<Record<string, EnumVariant>>, value as any);
    default: {
      // Exhaustiveness check
      const _exhaustive: never = schema;
      return err(new SerializeError(`Unknown schema kind: ${(_exhaustive as Schema).kind}`));
    }
  }
  /* eslint-enable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
}

// ============================================================================
// PRIMITIVE TYPE HANDLERS
// ============================================================================

function serializeBool(
  _schema: BoolSchema,
  value: boolean
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeBool(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize bool: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeI8(
  _schema: I8Schema,
  value: number
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeI8(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize i8: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeI16(
  _schema: I16Schema,
  value: number
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeVarintI16(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize i16: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeI32(
  _schema: I32Schema,
  value: number
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeVarintI32(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize i32: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeI64(
  _schema: I64Schema,
  value: bigint
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeVarintI64(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize i64: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeI128(
  _schema: I128Schema,
  value: bigint
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeVarintI128(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize i128: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeU8(
  _schema: U8Schema,
  value: number
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeU8(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize u8: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeU16(
  _schema: U16Schema,
  value: number
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeVarintU16(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize u16: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeU32(
  _schema: U32Schema,
  value: number
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeVarintU32(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize u32: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeU64(
  _schema: U64Schema,
  value: bigint
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeVarintU64(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize u64: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeU128(
  _schema: U128Schema,
  value: bigint
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeVarintU128(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize u128: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeF32(
  _schema: F32Schema,
  value: number
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeF32(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize f32: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeF64(
  _schema: F64Schema,
  value: number
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeF64(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize f64: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeChar(
  _schema: CharSchema,
  value: string
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeChar(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize char: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeString(
  _schema: StringSchema,
  value: string
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeString(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize string: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

function serializeBytes(
  _schema: BytesSchema,
  value: Uint8Array
): Result<Uint8Array, SerializeError> {
  const result = tryEncodeBytes(value);
  if (!result.ok) {
    return err(new SerializeError(`Failed to serialize bytes: ${result.error.message}`));
  }
  return ok(result.value.bytes);
}

// ============================================================================
// OPTION TYPE HANDLER
// ============================================================================

function serializeOption<T extends Schema>(
  schema: OptionSchema<T>,
  value: InferType<T> | null
): Result<Uint8Array, SerializeError> {
  if (value === null) {
    // None: 0x00
    return ok(new Uint8Array([0x00]));
  } else {
    // Some: 0x01 + serialized value
    const discriminant = new Uint8Array([0x01]);
    const innerResult = trySerialize(schema.inner, value);
    if (!innerResult.ok) {
      return err(new SerializeError(`Failed to serialize option value: ${innerResult.error.message}`));
    }

    // Combine discriminant + value
    const result = new Uint8Array(1 + innerResult.value.length);
    result.set(discriminant, 0);
    result.set(innerResult.value, 1);
    return ok(result);
  }
}

// ============================================================================
// UNIT TYPE HANDLERS
// ============================================================================

function serializeUnit(
  _schema: UnitSchema,
  _value: undefined
): Result<Uint8Array, SerializeError> {
  // Unit type occupies zero bytes
  return ok(new Uint8Array(0));
}

function serializeUnitStruct(
  _schema: UnitStructSchema,
  _value: Record<string, never>
): Result<Uint8Array, SerializeError> {
  // Unit struct occupies zero bytes
  return ok(new Uint8Array(0));
}

// ============================================================================
// NEWTYPE STRUCT HANDLER
// ============================================================================

function serializeNewtypeStruct(
  schema: NewtypeStructSchema<Schema>,
  value: unknown
): Result<Uint8Array, SerializeError> {
  // Newtype struct is just the inner value, no wrapper
  const innerResult = trySerialize(schema.inner, value);
  if (!innerResult.ok) {
    return err(new SerializeError(`Failed to serialize newtype struct: ${innerResult.error.message}`));
  }
  return ok(innerResult.value);
}

// ============================================================================
// SEQUENCE HANDLER
// ============================================================================

function serializeSeq<T extends Schema>(
  schema: SeqSchema<T>,
  value: InferType<T>[]
): Result<Uint8Array, SerializeError> {
  // Validate that value is an array
  if (!Array.isArray(value)) {
    return err(new SerializeError(`Expected array, got ${typeof value}`));
  }

  // Encode length as varint
  const lengthResult = tryEncodeVarintU64(BigInt(value.length));
  if (!lengthResult.ok) {
    return err(new SerializeError(`Failed to serialize seq length: ${lengthResult.error.message}`));
  }

  const parts: Uint8Array[] = [lengthResult.value.bytes];
  let totalSize = lengthResult.value.bytesWritten;

  // Serialize each element
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (item === undefined) {
      return err(new SerializeError(`Seq item ${String(i)} is undefined`));
    }

    const itemResult = trySerialize(schema.item, item);
    if (!itemResult.ok) {
      return err(new SerializeError(`Failed to serialize seq item ${String(i)}: ${itemResult.error.message}`));
    }
    parts.push(itemResult.value);
    totalSize += itemResult.value.length;
  }

  // Combine all parts
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return ok(result);
}

// ============================================================================
// TUPLE HANDLER
// ============================================================================

function serializeTuple<T extends readonly Schema[]>(
  schema: TupleSchema<T>,
  value: { [K in keyof T]: T[K] extends Schema ? InferType<T[K]> : never }
): Result<Uint8Array, SerializeError> {
  const parts: Uint8Array[] = [];
  let totalSize = 0;

  // Serialize each item (no length prefix for tuples)
  for (let i = 0; i < schema.items.length; i++) {
    const itemSchema = schema.items[i];
    const itemValue = value[i];

    if (itemSchema === undefined) {
      return err(new SerializeError(`Tuple item ${String(i)} schema is undefined`));
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (itemValue === undefined) {
      return err(new SerializeError(`Tuple item ${String(i)} value is undefined`));
    }

    const itemResult = trySerialize(itemSchema, itemValue);
    if (!itemResult.ok) {
      return err(new SerializeError(`Failed to serialize tuple item ${String(i)}: ${itemResult.error.message}`));
    }
    parts.push(itemResult.value);
    totalSize += itemResult.value.length;
  }

  // Combine all parts
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return ok(result);
}

// ============================================================================
// TUPLE STRUCT HANDLER
// ============================================================================

function serializeTupleStruct<T extends readonly Schema[]>(
  schema: TupleStructSchema<T>,
  value: { [K in keyof T]: T[K] extends Schema ? InferType<T[K]> : never }
): Result<Uint8Array, SerializeError> {
  // Tuple struct is encoded as a tuple
  const parts: Uint8Array[] = [];
  let totalSize = 0;

  for (let i = 0; i < schema.items.length; i++) {
    const itemSchema = schema.items[i];
    const itemValue = value[i];

    if (itemSchema === undefined) {
      return err(new SerializeError(`Tuple struct item ${String(i)} schema is undefined`));
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (itemValue === undefined) {
      return err(new SerializeError(`Tuple struct item ${String(i)} value is undefined`));
    }

    const itemResult = trySerialize(itemSchema, itemValue);
    if (!itemResult.ok) {
      return err(new SerializeError(`Failed to serialize tuple struct item ${String(i)}: ${itemResult.error.message}`));
    }
    parts.push(itemResult.value);
    totalSize += itemResult.value.length;
  }

  // Combine all parts
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return ok(result);
}

// ============================================================================
// MAP HANDLER
// ============================================================================

function serializeMap<K extends Schema, V extends Schema>(
  schema: MapSchema<K, V>,
  value: Map<InferType<K>, InferType<V>>
): Result<Uint8Array, SerializeError> {
  // Validate that value is a Map
  if (!(value instanceof Map)) {
    return err(new SerializeError(`Expected Map, got ${typeof value}`));
  }

  // Encode entry count as varint
  const countResult = tryEncodeVarintU64(BigInt(value.size));
  if (!countResult.ok) {
    return err(new SerializeError(`Failed to serialize map count: ${countResult.error.message}`));
  }

  const parts: Uint8Array[] = [countResult.value.bytes];
  let totalSize = countResult.value.bytesWritten;

  // Serialize each key-value pair
  let i = 0;
  for (const [key, val] of value.entries()) {
    // Serialize key
    const keyResult = trySerialize(schema.key, key);
    if (!keyResult.ok) {
      return err(new SerializeError(`Failed to serialize map key ${String(i)}: ${keyResult.error.message}`));
    }
    parts.push(keyResult.value);
    totalSize += keyResult.value.length;

    // Serialize value
    const valueResult = trySerialize(schema.value, val);
    if (!valueResult.ok) {
      return err(new SerializeError(`Failed to serialize map value ${String(i)}: ${valueResult.error.message}`));
    }
    parts.push(valueResult.value);
    totalSize += valueResult.value.length;

    i++;
  }

  // Combine all parts
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return ok(result);
}

// ============================================================================
// STRUCT HANDLER
// ============================================================================

function serializeStruct<T extends Record<string, Schema>>(
  schema: StructSchema<T>,
  value: { [K in keyof T]: InferType<T[K]> }
): Result<Uint8Array, SerializeError> {
  const parts: Uint8Array[] = [];
  let totalSize = 0;

  // Serialize each field in order
  for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
    const fieldValue = value[fieldName];
    if (fieldValue === undefined) {
      return err(new SerializeError(`Struct field '${fieldName}' is undefined`));
    }

    const fieldResult = trySerialize(fieldSchema, fieldValue);
    if (!fieldResult.ok) {
      return err(new SerializeError(`Failed to serialize struct field '${fieldName}': ${fieldResult.error.message}`));
    }
    parts.push(fieldResult.value);
    totalSize += fieldResult.value.length;
  }

  // Combine all parts
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return ok(result);
}

// ============================================================================
// ENUM HANDLER
// ============================================================================

function serializeEnum(
  schema: EnumSchema<Record<string, EnumVariant>>,
  value: unknown
): Result<Uint8Array, SerializeError> {
  // Get variant type and find discriminant
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  const variantType = (value as any).type as string;
  const variantNames = Object.keys(schema.variants);
  const discriminant = variantNames.indexOf(variantType);

  if (discriminant === -1) {
    return err(new SerializeError(`Unknown variant type: ${String(variantType)}`));
  }

  // Encode discriminant as varint
  const discriminantResult = tryEncodeVarintU32(discriminant);
  if (!discriminantResult.ok) {
    return err(new SerializeError(`Failed to serialize enum discriminant: ${discriminantResult.error.message}`));
  }

  const variant = schema.variants[variantType];
  if (variant === undefined) {
    return err(new SerializeError(`Variant '${String(variantType)}' not found in schema`));
  }

  // Serialize variant based on its kind
  switch (variant.kind) {
    case "unit_variant": {
      // Unit variant has no additional data
      return ok(discriminantResult.value.bytes);
    }

    case "newtype_variant": {
      // Newtype variant contains a single value
      const variantValue = (value as { type: string; value: unknown }).value;
      const valueResult = trySerialize(variant.inner, variantValue);
      if (!valueResult.ok) {
        return err(new SerializeError(`Failed to serialize newtype variant value: ${valueResult.error.message}`));
      }

      // Combine discriminant + value
      const result = new Uint8Array(discriminantResult.value.bytesWritten + valueResult.value.length);
      result.set(discriminantResult.value.bytes, 0);
      result.set(valueResult.value, discriminantResult.value.bytesWritten);
      return ok(result);
    }

    case "tuple_variant": {
      // Tuple variant contains tuple items
      const variantValue = (value as { type: string; value: unknown[] }).value;
      const parts: Uint8Array[] = [discriminantResult.value.bytes];
      let totalSize = discriminantResult.value.bytesWritten;

      for (let i = 0; i < variant.items.length; i++) {
        const itemSchema = variant.items[i];
        const itemValue = variantValue[i];

        if (itemSchema === undefined) {
          return err(new SerializeError(`Tuple variant item ${String(i)} schema is undefined`));
        }
        if (itemValue === undefined) {
          return err(new SerializeError(`Tuple variant item ${String(i)} value is undefined`));
        }

        const itemResult = trySerialize(itemSchema, itemValue);
        if (!itemResult.ok) {
          return err(new SerializeError(`Failed to serialize tuple variant item ${String(i)}: ${itemResult.error.message}`));
        }
        parts.push(itemResult.value);
        totalSize += itemResult.value.length;
      }

      // Combine all parts
      const result = new Uint8Array(totalSize);
      let offset = 0;
      for (const part of parts) {
        result.set(part, offset);
        offset += part.length;
      }
      return ok(result);
    }

    case "struct_variant": {
      // Struct variant contains named fields
      const variantValue = (value as { type: string; value: Record<string, unknown> }).value;
      const parts: Uint8Array[] = [discriminantResult.value.bytes];
      let totalSize = discriminantResult.value.bytesWritten;

      for (const [fieldName, fieldSchema] of Object.entries(variant.fields)) {
        const fieldValue = variantValue[fieldName];
        if (fieldValue === undefined) {
          return err(new SerializeError(`Struct variant field '${fieldName}' is undefined`));
        }

        const fieldResult = trySerialize(fieldSchema, fieldValue);
        if (!fieldResult.ok) {
          return err(new SerializeError(`Failed to serialize struct variant field '${fieldName}': ${fieldResult.error.message}`));
        }
        parts.push(fieldResult.value);
        totalSize += fieldResult.value.length;
      }

      // Combine all parts
      const result = new Uint8Array(totalSize);
      let offset = 0;
      for (const part of parts) {
        result.set(part, offset);
        offset += part.length;
      }
      return ok(result);
    }

    default: {
      const _exhaustive: never = variant;
      return err(new SerializeError(`Unknown variant kind: ${(_exhaustive as EnumVariant).kind}`));
    }
  }
}

// ============================================================================
// THROWING WRAPPER
// ============================================================================

/**
 * Serialize data using a schema (throwing API)
 *
 * Throws SerializeError on failure
 * Note: value is unknown for maximum flexibility - the schema validates the structure
 */
export function serialize<S extends Schema>(
  schema: S,
  value: unknown
): Uint8Array {
  return unwrap(trySerialize(schema, value));
}
