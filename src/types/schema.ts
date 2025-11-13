/**
 * Schema definition system for postcard serialization
 *
 * Since postcard is non-self-describing, we need runtime schema definitions
 * that map 1:1 with the Serde data model's 29 types. These schemas:
 * - Drive serialization/deserialization at runtime
 * - Provide TypeScript type inference at compile time
 * - Ensure compatibility with Rust's Serde implementation
 */

/**
 * Base schema type with kind discriminator
 */
export interface BaseSchema<K extends string, T = unknown> {
  readonly kind: K;
  readonly _type?: T; // Phantom type for inference
}

// ============================================================================
// PRIMITIVE TYPES (1-13)
// ============================================================================

export type BoolSchema = BaseSchema<"bool", boolean>

export type I8Schema = BaseSchema<"i8", number>
export type I16Schema = BaseSchema<"i16", number>
export type I32Schema = BaseSchema<"i32", number>
export type I64Schema = BaseSchema<"i64", bigint>
export type I128Schema = BaseSchema<"i128", bigint>

export type U8Schema = BaseSchema<"u8", number>
export type U16Schema = BaseSchema<"u16", number>
export type U32Schema = BaseSchema<"u32", number>
export type U64Schema = BaseSchema<"u64", bigint>
export type U128Schema = BaseSchema<"u128", bigint>

export type F32Schema = BaseSchema<"f32", number>
export type F64Schema = BaseSchema<"f64", number>

// ============================================================================
// STRING TYPES (14-16)
// ============================================================================

export type CharSchema = BaseSchema<"char", string>
export type StringSchema = BaseSchema<"string", string>
export type BytesSchema = BaseSchema<"bytes", Uint8Array>

// ============================================================================
// OPTION TYPE (17)
// ============================================================================

export interface OptionSchema<T extends Schema> extends BaseSchema<"option", InferType<T> | null> {
  readonly inner: T;
}

// ============================================================================
// UNIT TYPES (18-19)
// ============================================================================

export type UnitSchema = BaseSchema<"unit", void>
export interface UnitStructSchema extends BaseSchema<"unit_struct", Record<string, never>> {
  readonly name: string;
}

// ============================================================================
// NEWTYPE TYPES (21-22)
// ============================================================================

export interface NewtypeStructSchema<T extends Schema>
  extends BaseSchema<"newtype_struct", InferType<T>> {
  readonly name: string;
  readonly inner: T;
}

export interface NewtypeVariantSchema<T extends Schema>
  extends BaseSchema<"newtype_variant", InferType<T>> {
  readonly name: string;
  readonly inner: T;
}

// ============================================================================
// SEQUENCE TYPES (23)
// ============================================================================

export interface SeqSchema<T extends Schema>
  extends BaseSchema<"seq", InferType<T>[]> {
  readonly item: T;
}

// ============================================================================
// TUPLE TYPES (24-26)
// ============================================================================

export interface TupleSchema<T extends readonly Schema[]>
  extends BaseSchema<"tuple", InferTupleType<T>> {
  readonly items: T;
}

export interface TupleStructSchema<T extends readonly Schema[]>
  extends BaseSchema<"tuple_struct", InferTupleType<T>> {
  readonly name: string;
  readonly items: T;
}

export interface TupleVariantSchema<T extends readonly Schema[]>
  extends BaseSchema<"tuple_variant", InferTupleType<T>> {
  readonly name: string;
  readonly items: T;
}

// ============================================================================
// MAP TYPE (27)
// ============================================================================

export interface MapSchema<K extends Schema, V extends Schema>
  extends BaseSchema<"map", Map<InferType<K>, InferType<V>>> {
  readonly key: K;
  readonly value: V;
}

// ============================================================================
// STRUCT TYPES (28-29)
// ============================================================================

export interface StructSchema<T extends Record<string, Schema>>
  extends BaseSchema<"struct", InferStructType<T>> {
  readonly fields: T;
}

export interface StructVariantSchema<T extends Record<string, Schema>>
  extends BaseSchema<"struct_variant", InferStructType<T>> {
  readonly name: string;
  readonly fields: T;
}

// ============================================================================
// ENUM TYPE (Tagged Union - 20, 22, 26, 29)
// ============================================================================

export interface UnitVariantSchema extends BaseSchema<"unit_variant", void> {
  readonly name: string;
}

export type EnumVariant =
  | UnitVariantSchema
  | NewtypeVariantSchema<Schema>
  | TupleVariantSchema<readonly Schema[]>
  | StructVariantSchema<Record<string, Schema>>;

export type EnumVariantRecord = Record<string, EnumVariant>;

export interface EnumSchema<V extends EnumVariantRecord>
  extends BaseSchema<"enum", InferEnumType<V>> {
  readonly name: string;
  readonly variants: V;
}

// ============================================================================
// UNION TYPE
// ============================================================================

export type Schema =
  | BoolSchema
  | I8Schema
  | I16Schema
  | I32Schema
  | I64Schema
  | I128Schema
  | U8Schema
  | U16Schema
  | U32Schema
  | U64Schema
  | U128Schema
  | F32Schema
  | F64Schema
  | CharSchema
  | StringSchema
  | BytesSchema
  | UnitSchema
  | UnitStructSchema
  // Use structural typing for generic schema types to handle variance.
  // Note: _type is omitted here as it's only needed on concrete schema types for inference.
  // The optional _type property from concrete types (e.g., OptionSchema<T>) is preserved
  // during type narrowing, allowing InferType to extract the correct type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { readonly kind: "option"; readonly inner: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { readonly kind: "newtype_struct"; readonly name: string; readonly inner: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { readonly kind: "seq"; readonly item: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { readonly kind: "tuple"; readonly items: readonly any[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { readonly kind: "tuple_struct"; readonly name: string; readonly items: readonly any[] }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { readonly kind: "map"; readonly key: any; readonly value: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { readonly kind: "struct"; readonly fields: Record<string, any> }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { readonly kind: "enum"; readonly name: string; readonly variants: Record<string, any> };

// ============================================================================
// TYPE INFERENCE
// ============================================================================

/**
 * Infer the TypeScript type from a schema
 *
 * Uses optional property check (_type?) because the Schema union types
 * have _type as an optional property for structural typing purposes
 */
export type InferType<S extends Schema> = S extends { readonly _type?: infer T } ? T : never;

/**
 * Infer tuple type from array of schemas
 */
type InferTupleType<T extends readonly Schema[]> = {
  [K in keyof T]: T[K] extends Schema ? InferType<T[K]> : never;
};

/**
 * Infer struct type from field schemas
 */
type InferStructType<T extends Record<string, Schema>> = {
  [K in keyof T]: InferType<T[K]>;
};

/**
 * Infer enum type from variant schemas
 */
type InferEnumType<V extends Record<string, EnumVariant>> = {
  [K in keyof V]: V[K] extends UnitVariantSchema
    ? { type: K }
    : V[K] extends NewtypeVariantSchema<infer T>
      ? { type: K; value: InferType<T> }
      : V[K] extends TupleVariantSchema<infer T>
        ? { type: K; value: InferTupleType<T> }
        : V[K] extends StructVariantSchema<infer T>
          ? { type: K; value: InferStructType<T> }
          : never;
}[keyof V];

// ============================================================================
// SCHEMA BUILDERS
// ============================================================================

// Primitives
export const bool = (): BoolSchema => ({ kind: "bool" });

export const i8 = (): I8Schema => ({ kind: "i8" });
export const i16 = (): I16Schema => ({ kind: "i16" });
export const i32 = (): I32Schema => ({ kind: "i32" });
export const i64 = (): I64Schema => ({ kind: "i64" });
export const i128 = (): I128Schema => ({ kind: "i128" });

export const u8 = (): U8Schema => ({ kind: "u8" });
export const u16 = (): U16Schema => ({ kind: "u16" });
export const u32 = (): U32Schema => ({ kind: "u32" });
export const u64 = (): U64Schema => ({ kind: "u64" });
export const u128 = (): U128Schema => ({ kind: "u128" });

export const f32 = (): F32Schema => ({ kind: "f32" });
export const f64 = (): F64Schema => ({ kind: "f64" });

// Strings
export const char = (): CharSchema => ({ kind: "char" });
export const string = (): StringSchema => ({ kind: "string" });
export const bytes = (): BytesSchema => ({ kind: "bytes" });

// Option
export const option = <T extends Schema>(inner: T): OptionSchema<T> => ({
  kind: "option",
  inner,
});

// Unit
export const unit = (): UnitSchema => ({ kind: "unit" });
export const unitStruct = (name: string): UnitStructSchema => ({
  kind: "unit_struct",
  name,
});

// Newtype
export const newtypeStruct = <T extends Schema>(
  name: string,
  inner: T
): NewtypeStructSchema<T> => ({
  kind: "newtype_struct",
  name,
  inner,
});

// Collections
export const seq = <T extends Schema>(item: T): SeqSchema<T> => ({
  kind: "seq",
  item,
});

export const tuple = <T extends readonly Schema[]>(...items: T): TupleSchema<T> => ({
  kind: "tuple",
  items,
});

export const tupleStruct = <T extends readonly Schema[]>(
  name: string,
  ...items: T
): TupleStructSchema<T> => ({
  kind: "tuple_struct",
  name,
  items,
});

export const map = <K extends Schema, V extends Schema>(
  key: K,
  value: V
): MapSchema<K, V> => ({
  kind: "map",
  key,
  value,
});

// Struct
export const struct = <T extends Record<string, Schema>>(
  fields: T
): StructSchema<T> => ({
  kind: "struct",
  fields,
});

// Enum
export const unitVariant = (name: string): UnitVariantSchema => ({
  kind: "unit_variant",
  name,
});

export const newtypeVariant = <T extends Schema>(
  name: string,
  inner: T
): NewtypeVariantSchema<T> => ({
  kind: "newtype_variant",
  name,
  inner,
});

export const tupleVariant = <T extends readonly Schema[]>(
  name: string,
  ...items: T
): TupleVariantSchema<T> => ({
  kind: "tuple_variant",
  name,
  items,
});

export const structVariant = <T extends Record<string, Schema>>(
  name: string,
  fields: T
): StructVariantSchema<T> => ({
  kind: "struct_variant",
  name,
  fields,
});

export const enumType = <V extends EnumVariantRecord>(
  name: string,
  variants: V
): EnumSchema<V> => ({
  kind: "enum",
  name,
  variants,
});
