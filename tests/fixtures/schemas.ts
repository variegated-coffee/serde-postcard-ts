/**
 * Schema definitions for Rust test fixtures
 *
 * These schemas correspond exactly to the Rust structs in test-fixtures/src/types.rs
 * and provide runtime schema information for deserialization.
 */

import {
  bool,
  i8,
  i16,
  i32,
  i64,
  i128,
  u8,
  u16,
  u32,
  u64,
  u128,
  f32,
  f64,
  char,
  string,
  seq,
  tuple,
  option,
  struct,
  map,
  enumType,
  unitVariant,
  newtypeVariant,
  tupleVariant,
  structVariant,
  newtypeStruct,
  unitStruct,
  tupleStruct,
  type InferType,
} from "../../src/types/schema.js";

/**
 * Test all primitive types
 * Rust: struct Primitives
 */
export const PrimitivesSchema = struct({
  bool_field: bool(),
  i8_field: i8(),
  i16_field: i16(),
  i32_field: i32(),
  i64_field: i64(),
  i128_field: i128(),
  u8_field: u8(),
  u16_field: u16(),
  u32_field: u32(),
  u64_field: u64(),
  u128_field: u128(),
  f32_field: f32(),
  f64_field: f64(),
  char_field: char(),
  string_field: string(),
});

export type Primitives = InferType<typeof PrimitivesSchema>;

/**
 * Test collection types
 * Rust: struct Collections
 */
export const CollectionsSchema = struct({
  vec_u8: seq(u8()),
  vec_string: seq(string()),
  array_u32: tuple(u32(), u32(), u32(), u32()), // Fixed-size arrays have no length prefix
  tuple_mixed: tuple(u16(), string(), bool()),
  option_some: option(i32()),
  option_none: option(i32()),
});

export type Collections = InferType<typeof CollectionsSchema>;

/**
 * Inner struct used in nested structures
 * Rust: struct InnerStruct
 */
export const InnerStructSchema = struct({
  id: u64(),
  name: string(),
});

export type InnerStruct = InferType<typeof InnerStructSchema>;

/**
 * Test nested structures and maps
 * Rust: struct Nested
 */
export const NestedSchema = struct({
  inner: InnerStructSchema,
  map: map(string(), i32()),
  vec_of_structs: seq(InnerStructSchema),
});

export type Nested = InferType<typeof NestedSchema>;

/**
 * Test all enum variant types
 * Rust: enum ComplexEnum
 */
export const ComplexEnumSchema = enumType("ComplexEnum", {
  UnitVariant: unitVariant("UnitVariant"),
  NewtypeVariant: newtypeVariant("NewtypeVariant", u32()),
  TupleVariant: tupleVariant("TupleVariant", string(), i32(), bool()),
  StructVariant: structVariant("StructVariant", {
    x: f64(),
    y: f64(),
    label: string(),
  }),
});

export type ComplexEnum = InferType<typeof ComplexEnumSchema>;

/**
 * Test edge cases
 * Rust: struct EdgeCases
 */
export const EdgeCasesSchema = struct({
  empty_vec: seq(u8()),
  empty_string: string(),
  zero: u64(),
  max_u8: u8(),
  min_i8: i8(),
  max_i8: i8(),
  max_u16: u16(),
  max_u32: u32(),
  negative: i32(),
});

export type EdgeCases = InferType<typeof EdgeCasesSchema>;

/**
 * Newtype pattern
 * Rust: struct NewtypeStruct(u64)
 */
export const NewtypeStructSchema = newtypeStruct("NewtypeStruct", u64());

export type NewtypeStruct = InferType<typeof NewtypeStructSchema>;

/**
 * Unit struct
 * Rust: struct UnitStruct
 */
export const UnitStructSchema = unitStruct("UnitStruct");

export type UnitStruct = InferType<typeof UnitStructSchema>;

/**
 * Tuple struct
 * Rust: struct TupleStruct(String, i32, bool)
 */
export const TupleStructSchema = tupleStruct("TupleStruct", string(), i32(), bool());

export type TupleStruct = InferType<typeof TupleStructSchema>;

// ============================================================================
// Complex Integration Test - Game State
// ============================================================================

/**
 * 3D Coordinates
 * Rust: struct Coordinates
 */
export const CoordinatesSchema = struct({
  x: f64(),
  y: f64(),
  z: f64(),
});

export type Coordinates = InferType<typeof CoordinatesSchema>;

/**
 * Elemental damage types
 * Rust: enum Element
 */
export const ElementSchema = enumType("Element", {
  Fire: unitVariant("Fire"),
  Ice: unitVariant("Ice"),
  Lightning: unitVariant("Lightning"),
});

export type Element = InferType<typeof ElementSchema>;

/**
 * Weapon data
 * Rust: struct Weapon
 */
export const WeaponSchema = struct({
  name: string(),
  damage: u16(),
  element: option(ElementSchema),
});

export type Weapon = InferType<typeof WeaponSchema>;

/**
 * Item types in inventory
 * Rust: enum Item
 */
export const ItemSchema = enumType("Item", {
  Consumable: structVariant("Consumable", {
    name: string(),
    quantity: u16(),
  }),
  Weapon: newtypeVariant("Weapon", WeaponSchema),
  Armor: structVariant("Armor", {
    defense: u16(),
    durability: u8(),
  }),
});

export type Item = InferType<typeof ItemSchema>;

/**
 * Player inventory
 * Rust: struct Inventory
 */
export const InventorySchema = struct({
  items: seq(ItemSchema),
  capacity: u8(),
  gold: u32(),
});

export type Inventory = InferType<typeof InventorySchema>;

/**
 * Player data
 * Rust: struct Player
 */
export const PlayerSchema = struct({
  id: u64(),
  name: string(),
  position: CoordinatesSchema,
  health: f32(),
  mana: u16(),
  inventory: InventorySchema,
  equipped: option(WeaponSchema),
});

export type Player = InferType<typeof PlayerSchema>;

/**
 * Dragon color enum
 * Rust: enum DragonColor
 */
export const DragonColorSchema = enumType("DragonColor", {
  Red: unitVariant("Red"),
  Blue: unitVariant("Blue"),
  Green: unitVariant("Green"),
});

export type DragonColor = InferType<typeof DragonColorSchema>;

/**
 * Dragon-specific data
 * Rust: struct DragonData
 */
export const DragonDataSchema = struct({
  color: DragonColorSchema,
  age: u16(),
});

export type DragonData = InferType<typeof DragonDataSchema>;

/**
 * Enemy types
 * Rust: enum Enemy
 */
export const EnemySchema = enumType("Enemy", {
  Goblin: structVariant("Goblin", {
    id: u32(),
    aggro: bool(),
  }),
  Dragon: newtypeVariant("Dragon", DragonDataSchema),
  Skeleton: unitVariant("Skeleton"),
  Boss: structVariant("Boss", {
    name: string(),
    phase: u8(),
    health_percent: f32(),
  }),
});

export type Enemy = InferType<typeof EnemySchema>;

/**
 * Location information
 * Rust: struct Location
 */
export const LocationSchema = struct({
  description: string(),
  coordinates: CoordinatesSchema,
  visited: bool(),
});

export type Location = InferType<typeof LocationSchema>;

/**
 * Boss encounter information
 * Rust: struct BossInfo
 */
export const BossInfoSchema = struct({
  name: string(),
  difficulty: u8(),
});

export type BossInfo = InferType<typeof BossInfoSchema>;

/**
 * Game world
 * Rust: struct World
 */
export const WorldSchema = struct({
  name: string(),
  locations: map(string(), LocationSchema),
  boss: option(BossInfoSchema),
});

export type World = InferType<typeof WorldSchema>;

/**
 * Player action types
 * Rust: enum PlayerAction
 */
export const PlayerActionSchema = enumType("PlayerAction", {
  Move: structVariant("Move", {
    from: CoordinatesSchema,
    to: CoordinatesSchema,
  }),
  Attack: structVariant("Attack", {
    target_id: u32(),
  }),
  UseItem: newtypeVariant("UseItem", string()),
});

export type PlayerAction = InferType<typeof PlayerActionSchema>;

/**
 * Game events
 * Rust: enum GameEvent
 */
export const GameEventSchema = enumType("GameEvent", {
  PlayerAction: newtypeVariant("PlayerAction", PlayerActionSchema),
  EnemySpawn: structVariant("EnemySpawn", {
    enemy_type: string(),
    count: u16(),
  }),
  ItemDropped: newtypeVariant("ItemDropped", ItemSchema),
  LocationDiscovered: newtypeVariant("LocationDiscovered", string()),
});

export type GameEvent = InferType<typeof GameEventSchema>;

/**
 * Difficulty level
 * Rust: enum Difficulty
 */
export const DifficultySchema = enumType("Difficulty", {
  Easy: unitVariant("Easy"),
  Normal: unitVariant("Normal"),
  Hard: unitVariant("Hard"),
});

export type Difficulty = InferType<typeof DifficultySchema>;

/**
 * Game metadata
 * Rust: struct GameMetadata
 */
export const GameMetadataSchema = struct({
  version: string(),
  timestamp: u64(),
  difficulty: DifficultySchema,
});

export type GameMetadata = InferType<typeof GameMetadataSchema>;

/**
 * Complete game state
 * Rust: struct GameState
 */
export const GameStateSchema = struct({
  player: PlayerSchema,
  enemies: seq(EnemySchema),
  world: WorldSchema,
  events: seq(GameEventSchema),
  metadata: GameMetadataSchema,
});

export type GameState = InferType<typeof GameStateSchema>;
