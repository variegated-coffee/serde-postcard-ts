use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Test all primitive integer types, floats, bool, char, and string
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Primitives {
    pub bool_field: bool,
    pub i8_field: i8,
    pub i16_field: i16,
    pub i32_field: i32,
    pub i64_field: i64,
    pub i128_field: i128,
    pub u8_field: u8,
    pub u16_field: u16,
    pub u32_field: u32,
    pub u64_field: u64,
    pub u128_field: u128,
    pub f32_field: f32,
    pub f64_field: f64,
    pub char_field: char,
    pub string_field: String,
}

/// Test collection types: Vec, arrays, tuples, Option
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Collections {
    pub vec_u8: Vec<u8>,
    pub vec_string: Vec<String>,
    pub array_u32: [u32; 4],
    pub tuple_mixed: (u16, String, bool),
    pub option_some: Option<i32>,
    pub option_none: Option<i32>,
}

/// Test all enum variant types from Serde data model
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ComplexEnum {
    /// Unit variant - no data
    UnitVariant,
    /// Newtype variant - single unnamed field
    NewtypeVariant(u32),
    /// Tuple variant - multiple unnamed fields
    TupleVariant(String, i32, bool),
    /// Struct variant - named fields
    StructVariant { x: f64, y: f64, label: String },
}

/// Test nested structures and maps
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Nested {
    pub inner: InnerStruct,
    pub map: HashMap<String, i32>,
    pub vec_of_structs: Vec<InnerStruct>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct InnerStruct {
    pub id: u64,
    pub name: String,
}

/// Test edge cases: empty collections, boundary values
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EdgeCases {
    pub empty_vec: Vec<u8>,
    pub empty_string: String,
    pub zero: u64,
    pub max_u8: u8,
    pub min_i8: i8,
    pub max_i8: i8,
    pub max_u16: u16,
    pub max_u32: u32,
    pub negative: i32,
}

/// Newtype pattern test
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct NewtypeStruct(pub u64);

/// Unit struct test
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct UnitStruct;

/// Tuple struct test
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TupleStruct(pub String, pub i32, pub bool);

// ============================================================================
// Complex Integration Test - Game State
// ============================================================================

/// Complete game state - exercises deep nesting, enums in collections, optional complex types
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GameState {
    pub player: Player,
    pub enemies: Vec<Enemy>,
    pub world: World,
    pub events: Vec<GameEvent>,
    pub metadata: GameMetadata,
}

/// Player with nested inventory and equipment
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Player {
    pub id: u64,
    pub name: String,
    pub position: Coordinates,
    pub health: f32,
    pub mana: u16,
    pub inventory: Inventory,
    pub equipped: Option<Weapon>,
}

/// Player inventory containing items
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Inventory {
    pub items: Vec<Item>,
    pub capacity: u8,
    pub gold: u32,
}

/// 3D coordinates
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Coordinates {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

/// Enemy types - demonstrates all enum variant types in a Vec
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Enemy {
    /// Struct variant
    Goblin { id: u32, aggro: bool },
    /// Newtype variant with complex data
    Dragon(DragonData),
    /// Unit variant
    Skeleton,
    /// Struct variant with multiple fields
    Boss {
        name: String,
        phase: u8,
        health_percent: f32,
    },
}

/// Dragon-specific data
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DragonData {
    pub color: DragonColor,
    pub age: u16,
}

/// Dragon color enum
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum DragonColor {
    Red,
    Blue,
    Green,
}

/// Item types in inventory
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Item {
    Consumable { name: String, quantity: u16 },
    Weapon(Weapon),
    Armor { defense: u16, durability: u8 },
}

/// Weapon data
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Weapon {
    pub name: String,
    pub damage: u16,
    pub element: Option<Element>,
}

/// Elemental damage types
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Element {
    Fire,
    Ice,
    Lightning,
}

/// Game world with locations map
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct World {
    pub name: String,
    pub locations: HashMap<String, Location>,
    pub boss: Option<BossInfo>,
}

/// Location information
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Location {
    pub description: String,
    pub coordinates: Coordinates,
    pub visited: bool,
}

/// Boss encounter information
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BossInfo {
    pub name: String,
    pub difficulty: u8,
}

/// Game events - nested enums
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum GameEvent {
    PlayerAction(PlayerAction),
    EnemySpawn { enemy_type: String, count: u16 },
    ItemDropped(Item),
    LocationDiscovered(String),
}

/// Player action types
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum PlayerAction {
    Move { from: Coordinates, to: Coordinates },
    Attack { target_id: u32 },
    UseItem(String),
}

/// Game metadata
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GameMetadata {
    pub version: String,
    pub timestamp: u64,
    pub difficulty: Difficulty,
}

/// Difficulty level
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Difficulty {
    Easy,
    Normal,
    Hard,
}
