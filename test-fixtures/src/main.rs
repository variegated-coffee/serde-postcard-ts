mod types;

use std::collections::HashMap;
use std::fs;
use std::path::Path;
use types::*;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let fixtures_dir = Path::new("fixtures");
    fs::create_dir_all(fixtures_dir)?;

    println!("Generating postcard binary fixtures...\n");

    // Primitives
    let primitives = Primitives {
        bool_field: true,
        i8_field: -42,
        i16_field: -1000,
        i32_field: -100000,
        i64_field: -10000000000,
        i128_field: -123456789012345678901234567890,
        u8_field: 255,
        u16_field: 65535,
        u32_field: 4294967295,
        u64_field: 18446744073709551615,
        u128_field: 340282366920938463463374607431768211455,
        f32_field: -32.005859375,
        f64_field: -32.005859375,
        char_field: '🦀',
        string_field: "Hello, postcard!".to_string(),
    };
    write_fixture("primitives.bin", &primitives)?;

    // Collections
    let collections = Collections {
        vec_u8: vec![1, 2, 3, 4, 5],
        vec_string: vec!["one".to_string(), "two".to_string(), "three".to_string()],
        array_u32: [100, 200, 300, 400],
        tuple_mixed: (42, "test".to_string(), true),
        option_some: Some(12345),
        option_none: None,
    };
    write_fixture("collections.bin", &collections)?;

    // Enums - Unit variant
    let enum_unit = ComplexEnum::UnitVariant;
    write_fixture("enum_unit.bin", &enum_unit)?;

    // Enums - Newtype variant
    let enum_newtype = ComplexEnum::NewtypeVariant(999);
    write_fixture("enum_newtype.bin", &enum_newtype)?;

    // Enums - Tuple variant
    let enum_tuple = ComplexEnum::TupleVariant("tuple".to_string(), -500, false);
    write_fixture("enum_tuple.bin", &enum_tuple)?;

    // Enums - Struct variant
    let enum_struct = ComplexEnum::StructVariant {
        x: 3.14159,
        y: 2.71828,
        label: "point".to_string(),
    };
    write_fixture("enum_struct.bin", &enum_struct)?;

    // Nested structures
    let mut map = HashMap::new();
    map.insert("alice".to_string(), 100);
    map.insert("bob".to_string(), 200);
    map.insert("charlie".to_string(), 300);

    let nested = Nested {
        inner: InnerStruct {
            id: 12345,
            name: "primary".to_string(),
        },
        map,
        vec_of_structs: vec![
            InnerStruct {
                id: 1,
                name: "first".to_string(),
            },
            InnerStruct {
                id: 2,
                name: "second".to_string(),
            },
        ],
    };
    write_fixture("nested.bin", &nested)?;

    // Edge cases
    let edge_cases = EdgeCases {
        empty_vec: vec![],
        empty_string: String::new(),
        zero: 0,
        max_u8: u8::MAX,
        min_i8: i8::MIN,
        max_i8: i8::MAX,
        max_u16: u16::MAX,
        max_u32: u32::MAX,
        negative: -999999,
    };
    write_fixture("edge_cases.bin", &edge_cases)?;

    // Newtype struct
    let newtype = NewtypeStruct(987654321);
    write_fixture("newtype_struct.bin", &newtype)?;

    // Unit struct
    let unit = UnitStruct;
    write_fixture("unit_struct.bin", &unit)?;

    // Tuple struct
    let tuple_struct = TupleStruct("tuple_data".to_string(), 777, true);
    write_fixture("tuple_struct.bin", &tuple_struct)?;

    // Complex integration test - Game State
    let game_state = create_game_state();
    write_fixture("game_state.bin", &game_state)?;

    println!("\n✓ All fixtures generated successfully!");
    Ok(())
}

fn create_game_state() -> GameState {
    // Create player with inventory
    let player = Player {
        id: 12345,
        name: "Hero".to_string(),
        position: Coordinates {
            x: 10.5,
            y: 20.3,
            z: 5.0,
        },
        health: 85.5,
        mana: 120,
        inventory: Inventory {
            items: vec![
                Item::Consumable {
                    name: "Health Potion".to_string(),
                    quantity: 5,
                },
                Item::Weapon(Weapon {
                    name: "Flaming Sword".to_string(),
                    damage: 50,
                    element: Some(Element::Fire),
                }),
                Item::Armor {
                    defense: 30,
                    durability: 95,
                },
            ],
            capacity: 20,
            gold: 1500,
        },
        equipped: Some(Weapon {
            name: "Frost Bow".to_string(),
            damage: 35,
            element: Some(Element::Ice),
        }),
    };

    // Create diverse enemy types
    let enemies = vec![
        Enemy::Goblin {
            id: 1,
            aggro: true,
        },
        Enemy::Dragon(DragonData {
            color: DragonColor::Red,
            age: 500,
        }),
        Enemy::Skeleton,
        Enemy::Boss {
            name: "Dark Lord".to_string(),
            phase: 2,
            health_percent: 65.8,
        },
    ];

    // Create world with locations
    let mut locations = HashMap::new();
    locations.insert(
        "forest".to_string(),
        Location {
            description: "Dense woodland".to_string(),
            coordinates: Coordinates {
                x: 0.0,
                y: 0.0,
                z: 0.0,
            },
            visited: true,
        },
    );
    locations.insert(
        "cave".to_string(),
        Location {
            description: "Dark cavern".to_string(),
            coordinates: Coordinates {
                x: 15.0,
                y: -5.0,
                z: -10.0,
            },
            visited: false,
        },
    );
    locations.insert(
        "castle".to_string(),
        Location {
            description: "Ancient fortress".to_string(),
            coordinates: Coordinates {
                x: 100.0,
                y: 50.0,
                z: 20.0,
            },
            visited: false,
        },
    );

    let world = World {
        name: "Realm of Testing".to_string(),
        locations,
        boss: Some(BossInfo {
            name: "The Final Test".to_string(),
            difficulty: 10,
        }),
    };

    // Create game events
    let events = vec![
        GameEvent::PlayerAction(PlayerAction::Move {
            from: Coordinates {
                x: 0.0,
                y: 0.0,
                z: 0.0,
            },
            to: Coordinates {
                x: 10.5,
                y: 20.3,
                z: 5.0,
            },
        }),
        GameEvent::EnemySpawn {
            enemy_type: "Goblin".to_string(),
            count: 3,
        },
        GameEvent::ItemDropped(Item::Consumable {
            name: "Mana Potion".to_string(),
            quantity: 2,
        }),
        GameEvent::PlayerAction(PlayerAction::Attack { target_id: 1 }),
        GameEvent::LocationDiscovered("cave".to_string()),
    ];

    // Create metadata
    let metadata = GameMetadata {
        version: "1.0.0".to_string(),
        timestamp: 1699000000,
        difficulty: Difficulty::Normal,
    };

    GameState {
        player,
        enemies,
        world,
        events,
        metadata,
    }
}

fn write_fixture<T: serde::Serialize>(
    filename: &str,
    value: &T,
) -> Result<(), Box<dyn std::error::Error>> {
    let bytes = postcard::to_allocvec(value)?;
    let path = Path::new("fixtures").join(filename);
    fs::write(&path, &bytes)?;
    println!("  {} ({} bytes)", filename, bytes.len());
    Ok(())
}
