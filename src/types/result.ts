/**
 * Result type for error handling
 *
 * Provides Rust-style Result<T, E> for functions that can fail.
 * Users can choose between:
 * - Using tryX() functions that return Result
 * - Using X() functions that throw errors
 */

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Create a successful Result
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create a failed Result
 */
export function err<E extends Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Unwrap a Result, throwing if it's an error
 */
export function unwrap<T, E extends Error>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  // E extends Error, so this is safe to throw
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw result.error;
}

/**
 * Map the value of a successful Result
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Chain Results together
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}
