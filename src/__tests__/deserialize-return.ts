/**
 * Real-world usage fixture for testing ESLint compatibility
 *
 * This file simulates how external users would use the library.
 * It should be linted as part of the build process and should NOT
 * trigger any @typescript-eslint/no-unsafe-return errors.
 */

import {
  deserialize,
  type InferType,
  type Schema,
  u8,
  string,
  option,
  seq,
  struct,
} from '../index.js';

// Example 1: Generic helper function
// This is the pattern reported in the issue
export function parsePostcard<S extends Schema>(
  schema: S,
  data: Uint8Array
): InferType<S> {
  const result = deserialize(schema, data);
  // This should NOT trigger: @typescript-eslint/no-unsafe-return
  return result.value;
}

// Example 2: Typed helper for specific schema
const PersonSchema = struct({
  age: u8(),
  name: string(),
});

export type Person = InferType<typeof PersonSchema>;

export function parsePerson(data: Uint8Array): Person {
  const result = deserialize(PersonSchema, data);
  // This should NOT trigger: @typescript-eslint/no-unsafe-return
  return result.value;
}

// Example 3: Helper with optional values
export function parseOptionalString(data: Uint8Array): string | null {
  const result = deserialize(option(string()), data);
  // This should NOT trigger: @typescript-eslint/no-unsafe-return
  return result.value;
}

// Example 4: Helper with arrays
export function parseNumberArray(data: Uint8Array): number[] {
  const result = deserialize(seq(u8()), data);
  // This should NOT trigger: @typescript-eslint/no-unsafe-return
  return result.value;
}

// Example 5: Class-based API
export class PostcardParser<S extends Schema> {
  constructor(private readonly schema: S) {}

  parse(data: Uint8Array): InferType<S> {
    const result = deserialize(this.schema, data);
    // This should NOT trigger: @typescript-eslint/no-unsafe-return
    return result.value;
  }

  parseWithOffset(data: Uint8Array, offset: number): { value: InferType<S>; bytesRead: number } {
    const result = deserialize(this.schema, data, offset);
    // This should NOT trigger: @typescript-eslint/no-unsafe-return
    return result;
  }
}

// Example 6: Async wrapper
export async function fetchAndParse<S extends Schema>(
  schema: S,
  url: string
): Promise<InferType<S>> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const data = new Uint8Array(buffer);
  const result = deserialize(schema, data);
  // This should NOT trigger: @typescript-eslint/no-unsafe-return
  return result.value;
}

// Example 7: Error handling wrapper
export function safeParse<S extends Schema>(
  schema: S,
  data: Uint8Array
): { success: true; data: InferType<S> } | { success: false; error: Error } {
  try {
    const result = deserialize(schema, data);
    // This should NOT trigger: @typescript-eslint/no-unsafe-return
    return { success: true, data: result.value };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
}
