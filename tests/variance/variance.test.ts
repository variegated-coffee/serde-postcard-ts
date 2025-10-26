import { describe, it, expectTypeOf } from 'vitest';
import {
  struct,
  map,
  seq,
  string,
  u8,
  option,
  enumType,
  unitVariant,
  type InferType
} from '../../src/types/schema.js';

describe('Postcard Schema Type Inference', () => {
  it('should infer simple struct types correctly', () => {
    const SimpleSchema = struct({
      name: string(),
      age: u8()
    });

    type Simple = InferType<typeof SimpleSchema>;

    // This should work - simple structs infer correctly
    expectTypeOf<Simple>().toEqualTypeOf<{
      name: string;
      age: number;
    }>();
  });

  it('should infer enum types correctly', () => {
    const ModeSchema = enumType('Mode', {
      On: unitVariant('On'),
      Off: unitVariant('Off')
    });

    type Mode = InferType<typeof ModeSchema>;

    // This should work after the 0.1.1 fix
    expectTypeOf<Mode>().not.toEqualTypeOf<never>();
    expectTypeOf<Mode>().toMatchTypeOf<{ type: 'On' } | { type: 'Off' }>();
  });

  it('should infer struct with seq types correctly', () => {
    const ItemSchema = struct({
      id: u8(),
      name: string()
    });

    const ListSchema = struct({
      items: seq(ItemSchema)
    });

    type List = InferType<typeof ListSchema>;

    // This FAILS - InferType returns `never` for complex schemas with seq
    // Expected: { items: Array<{ id: number; name: string }> }
    // Actual: never
    expectTypeOf<List>().not.toEqualTypeOf<never>();
  });

  it('should infer struct with map types correctly', () => {
    const ValueSchema = struct({
      temperature: u8(),
      enabled: option(string())
    });

    const ConfigSchema = struct({
      settings: map(string(), ValueSchema)
    });

    type Config = InferType<typeof ConfigSchema>;

    // This FAILS - InferType returns `never` for complex schemas with map
    // Expected: { settings: Map<string, { temperature: number; enabled: string | null }> }
    // Actual: never
    expectTypeOf<Config>().not.toEqualTypeOf<never>();
  });

  it('should infer deeply nested struct types correctly', () => {
    const BoilerStatusSchema = struct({
      temperature: u8(),
      pressure: u8()
    });

    const StatusSchema = struct({
      boiler_statuses: map(string(), BoilerStatusSchema),
      items: seq(string())
    });

    type Status = InferType<typeof StatusSchema>;

    // This FAILS - InferType returns `never` for deeply nested schemas
    // Expected: { boiler_statuses: Map<string, { temperature: number; pressure: number }>; items: string[] }
    // Actual: never
    expectTypeOf<Status>().not.toEqualTypeOf<never>();
  });

  it('demonstrates the root cause - Schema union type constraint', () => {
    // The issue is that the Schema union type in the library is:
    // type Schema = ... | SeqSchema<Schema> | MapSchema<Schema, Schema> | StructSchema<Record<string, Schema>>
    //
    // But when we call:
    //   seq(ItemSchema)  -> returns SeqSchema<typeof ItemSchema>
    //   map(string(), ValueSchema) -> returns MapSchema<StringSchema, typeof ValueSchema>
    //   struct({ field: schema }) -> returns StructSchema<{ field: typeof schema }>
    //
    // These specific types don't match the union constraint because:
    //   SeqSchema<typeof ItemSchema> !== SeqSchema<Schema>
    //   MapSchema<StringSchema, typeof ValueSchema> !== MapSchema<Schema, Schema>
    //
    // So InferType<S extends Schema> fails because S doesn't extend Schema

    const ItemSchema = struct({
      id: u8()
    });

    const seq1 = seq(ItemSchema);

    // This type should satisfy the Schema constraint, but doesn't due to variance
    type SeqType = typeof seq1;

    // The fix would be to make the Schema union more permissive, e.g.:
    // type Schema = ...
    //   | { readonly kind: "seq"; readonly item: Schema }
    //   | { readonly kind: "map"; readonly key: Schema; readonly value: Schema }
    //   | { readonly kind: "struct"; readonly fields: Record<string, Schema> }
  });
});
