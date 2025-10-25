/**
 * serde-postcard-ts
 * TypeScript implementation of the postcard serialization format
 * https://github.com/jamesmunns/postcard
 */

// Export schema system (runtime builders and types)
export * from "./types/schema.js";

// Export Result type for error handling (excluding 'map' to avoid conflict with schema.map)
export type { Result } from "./types/result.js";
export { ok, err, unwrap, andThen } from "./types/result.js";

// Export type definitions (placeholder - not yet implemented)
// export type * from "./types/serde.js";

// Export varint codec
export * from "./codec/varint.js";

// Export primitive deserializers
export * from "./primitives/bool.js";
export * from "./primitives/numbers.js";
export * from "./primitives/string.js";
export * from "./primitives/bytes.js";

// Export core codec
export * from "./codec/serializer.js";
export * from "./codec/deserializer.js";
