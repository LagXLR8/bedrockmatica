/**
 * Master Java Edition → Bedrock Edition Block State & ID Mapper
 * Supports Bedrock 1.20+ / 1.21+ flat block formats and exact state specifications.
 */

const FACING_DIR = { down: 0, up: 1, north: 2, south: 3, west: 4, east: 5 };
const CARDINAL_DIR = { south: 0, west: 1, north: 2, east: 3 };
const WEIRDO_DIR = { east: 0, west: 1, south: 2, north: 3 };

const TORCH_FACING = {
  unknown: 'unknown',
  west: 'west',
  east: 'east',
  north: 'north',
  south: 'south',
  top: 'top'
};

const LEGACY_WOOD_TYPES = {
  'minecraft:oak_planks': 'oak',
  'minecraft:spruce_planks': 'spruce',
  'minecraft:birch_planks': 'birch',
  'minecraft:jungle_planks': 'jungle',
  'minecraft:acacia_planks': 'acacia',
  'minecraft:dark_oak_planks': 'dark_oak',
};

const NAME_REMAP = {
  'minecraft:grass_block': 'minecraft:grass',
  'minecraft:short_grass': 'minecraft:grass',
  'minecraft:nether_bricks': 'minecraft:nether_brick',
  'minecraft:red_nether_bricks': 'minecraft:red_nether_brick',
  'minecraft:rooted_dirt': 'minecraft:dirt_with_roots',
};

// Slabs that use old-format stone_block_slab IDs with top_slot_bit
const STONE_SLAB1_MAP = {
  'minecraft:petrified_oak_slab': 'wood',
  'minecraft:cobblestone_slab': 'cobblestone',
  'minecraft:brick_slab': 'brick',
  'minecraft:stone_brick_slab': 'stone_brick',
  'minecraft:quartz_slab': 'quartz',
  'minecraft:nether_brick_slab': 'nether_brick',
  'minecraft:stone_slab': 'stone',
};

const STONE_SLAB2_MAP = {
  'minecraft:sandstone_slab': 'sandstone',
  'minecraft:cut_sandstone_slab': 'cut_sandstone',
  'minecraft:red_sandstone_slab': 'red_sandstone',
  'minecraft:purpur_slab': 'purpur',
  'minecraft:prismarine_slab': 'prismarine_rough',
  'minecraft:prismarine_brick_slab': 'prismarine_brick',
  'minecraft:dark_prismarine_slab': 'prismarine_dark',
  'minecraft:mossy_cobblestone_slab': 'mossy_cobblestone',
};

// Classic 6 wooden slabs use old-format wooden_slab with wood_type
const LEGACY_WOOD_SLABS = {
  'minecraft:oak_slab': 'oak',
  'minecraft:spruce_slab': 'spruce',
  'minecraft:birch_slab': 'birch',
  'minecraft:jungle_slab': 'jungle',
  'minecraft:acacia_slab': 'acacia',
  'minecraft:dark_oak_slab': 'dark_oak',
};

function getLeverDirection(face, facing) {
  if (face === 'floor') {
    return (facing === 'east' || facing === 'west') ? 'up_east_west' : 'up_north_south';
  }
  if (face === 'ceiling') {
    return (facing === 'east' || facing === 'west') ? 'down_east_west' : 'down_north_south';
  }
  return facing; // 'north' | 'south' | 'east' | 'west'
}

function getGrindstoneAttachment(face) {
  if (face === 'ceiling') return 'hanging';
  if (face === 'wall') return 'side';
  return 'stand';
}

/**
 * Maps Java BlockState to Bedrock BlockState definition.
 */
export function mapJavaToBedrockBlock(javaName, javaProperties = {}) {
  const p = javaProperties;

  // Air check
  if (javaName.endsWith(':air') || javaName === 'minecraft:cave_air' || javaName === 'minecraft:void_air') {
    return { name: 'minecraft:air', states: {} };
  }

  let name = NAME_REMAP[javaName] || javaName;

  // ── SLABS (All variants) ────────────────────────────────────────────────
  // Bedrock 1.20+ uses per-block flat IDs with state key "minecraft:vertical_half".
  // Old-format stone_block_slab still uses top_slot_bit.
  if (javaName.endsWith('_slab')) {
    const isDouble = p.type === 'double';
    const isTop = p.type === 'top';
    const half = isTop ? 'top' : 'bottom';

    // 1. Legacy stone_block_slab (use top_slot_bit — Bedrock never updated these to flat IDs)
    if (STONE_SLAB1_MAP[javaName]) {
      const stoneType = STONE_SLAB1_MAP[javaName];
      if (isDouble) return { name: 'minecraft:double_stone_block_slab', states: { stone_slab_type: stoneType } };
      return { name: 'minecraft:stone_block_slab', states: { stone_slab_type: stoneType, top_slot_bit: isTop } };
    }

    // 2. Legacy stone_block_slab2 (use top_slot_bit)
    if (STONE_SLAB2_MAP[javaName]) {
      const stoneType = STONE_SLAB2_MAP[javaName];
      if (isDouble) return { name: 'minecraft:double_stone_block_slab2', states: { stone_slab_type_2: stoneType } };
      return { name: 'minecraft:stone_block_slab2', states: { stone_slab_type_2: stoneType, top_slot_bit: isTop } };
    }

    // 3. All other slabs (classic wood + modern): use flat ID + "minecraft:vertical_half"
    //    (Bedrock 1.20+ moved oak/spruce/birch/jungle/acacia/dark_oak to flat IDs too)
    const baseName = javaName.replace('minecraft:', '').replace('_slab', '');
    if (isDouble) {
      // Double slab IDs
      const doubles = {
        oak: 'minecraft:double_wooden_slab', spruce: 'minecraft:double_wooden_slab',
        birch: 'minecraft:double_wooden_slab', jungle: 'minecraft:double_wooden_slab',
        acacia: 'minecraft:double_wooden_slab', dark_oak: 'minecraft:double_wooden_slab',
      };
      const woodTypes = { oak: 'oak', spruce: 'spruce', birch: 'birch', jungle: 'jungle', acacia: 'acacia', dark_oak: 'dark_oak' };
      if (doubles[baseName]) return { name: doubles[baseName], states: { wood_type: woodTypes[baseName] } };
      return { name: `minecraft:${baseName}_double_slab`, states: {} };
    }
    // Single: Bedrock 1.20+ state key has namespace prefix
    return { name: `minecraft:${baseName}_slab`, states: { 'minecraft:vertical_half': half } };
  }

  // ── SHELVES (Minecraft 1.21.5+ Shelf Blocks) ─────────────────────────────
  // Bedrock 1.21+ uses "minecraft:cardinal_direction" (string) for shelf facing.
  if (javaName.endsWith('_shelf')) {
    return {
      name,
      states: {
        'minecraft:cardinal_direction': p.facing ?? 'north'
      }
    };
  }

  // ── HANGING SIGNS (Ceiling Parallel Chains / Attached V-Chains / Wall Bracket) ─────────
  // In Bedrock Edition, ALL hanging sign variants share the single ID: `minecraft:<wood>_hanging_sign`
  // (There is NO `_wall_hanging_sign` block ID in Bedrock).
  // - Ceiling hanging sign: hanging=true, attached_bit=boolean (true=V-chains, false=parallel chains), ground_sign_direction=0..15, facing_direction=0
  // - Wall hanging sign: hanging=false, facing_direction=2..5 (north=2, south=3, west=4, east=5), attached_bit=false, ground_sign_direction=0
  // Wood types: oak, spruce, birch, jungle, acacia, dark_oak, mangrove, cherry, pale_oak, bamboo, crimson, warped
  if (javaName.endsWith('_hanging_sign')) {
    const isWall = javaName.includes('_wall_hanging_sign');
    const woodType = javaName
      .replace('minecraft:', '')
      .replace('_wall_hanging_sign', '')
      .replace('_hanging_sign', '');

    if (isWall) {
      // Wall-mounted bracket hanging sign (hanging=false, facing_direction=2..5)
      return {
        name: `minecraft:${woodType}_hanging_sign`,
        states: {
          hanging: false,
          facing_direction: FACING_DIR[p.facing] ?? 2,
          attached_bit: false,
          ground_sign_direction: 0
        }
      };
    } else {
      // Ceiling hanging sign (hanging=true, attached_bit=boolean, ground_sign_direction=0..15)
      const isAttached = p.attached === 'true' || p.attached === true;
      const rotation = parseInt(p.rotation ?? '0', 10);
      return {
        name: `minecraft:${woodType}_hanging_sign`,
        states: {
          hanging: true,
          attached_bit: isAttached,
          ground_sign_direction: isNaN(rotation) ? 0 : rotation,
          facing_direction: 0
        }
      };
    }
  }

  // ── BANNERS ──────────────────────────────────────────────────────────────
  if (javaName.endsWith('_banner')) {
    const isWall = javaName.endsWith('_wall_banner');
    if (isWall) {
      return {
        name: 'minecraft:wall_banner',
        states: { facing_direction: FACING_DIR[p.facing] ?? 2 }
      };
    } else {
      return {
        name: 'minecraft:standing_banner',
        states: { ground_sign_direction: parseInt(p.rotation ?? '0', 10) }
      };
    }
  }

  // ── LEVER ────────────────────────────────────────────────────────────────
  if (javaName === 'minecraft:lever') {
    return {
      name,
      states: {
        lever_direction: getLeverDirection(p.face ?? 'wall', p.facing ?? 'north'),
        open_bit: p.powered === 'true'
      }
    };
  }

  // ── GRINDSTONE ───────────────────────────────────────────────────────────
  if (javaName === 'minecraft:grindstone') {
    return {
      name,
      states: {
        attachment: getGrindstoneAttachment(p.face || 'floor'),
        direction: CARDINAL_DIR[p.facing] ?? 0,
      }
    };
  }

  // ── SKULLS / HEADS ────────────────────────────────────────────────────────
  if (javaName.endsWith('_skull') || javaName.endsWith('_head')) {
    const isWall = javaName.includes('_wall_');
    return {
      name: 'minecraft:skull',
      states: {
        facing_direction: isWall ? (FACING_DIR[p.facing] ?? 2) : 1
      }
    };
  }

  // ── BELL ─────────────────────────────────────────────────────────────────
  if (javaName === 'minecraft:bell') {
    const attachMap = { floor: 'stand', ceiling: 'hanging', single_wall: 'side', double_wall: 'multiple' };
    return {
      name,
      states: {
        attachment: attachMap[p.attachment] || 'stand',
        direction: CARDINAL_DIR[p.facing] ?? 0,
        toggle_bit: p.powered === 'true'
      }
    };
  }

  // ── CHISELED BOOKSHELF ───────────────────────────────────────────────────
  if (javaName === 'minecraft:chiseled_bookshelf') {
    const booksStored =
      (p.slot_0_occupied === 'true' ? 1 : 0) |
      (p.slot_1_occupied === 'true' ? 2 : 0) |
      (p.slot_2_occupied === 'true' ? 4 : 0) |
      (p.slot_3_occupied === 'true' ? 8 : 0) |
      (p.slot_4_occupied === 'true' ? 16 : 0) |
      (p.slot_5_occupied === 'true' ? 32 : 0);
    return {
      name,
      states: {
        direction: CARDINAL_DIR[p.facing] ?? 0,
        books_stored: booksStored,
      }
    };
  }

  // ── LANTERNS ─────────────────────────────────────────────────────────────
  if (javaName === 'minecraft:lantern' || javaName === 'minecraft:soul_lantern') {
    return {
      name,
      states: { hanging: p.hanging === 'true' }
    };
  }

  // ── STAIRS ───────────────────────────────────────────────────────────────
  if (javaName.endsWith('_stairs')) {
    return {
      name,
      states: {
        weirdo_direction: WEIRDO_DIR[p.facing] ?? 0,
        upside_down_bit: p.half === 'top',
      }
    };
  }

  // ── LOGS / WOOD / PILLARS / CHAINS ─────────────────────────────────────────
  if (javaName.endsWith('_log') || javaName.endsWith('_wood') || javaName.endsWith('_stem') || javaName.endsWith('_hyphae') || javaName === 'minecraft:chain' || javaName.endsWith('_pillar')) {
    return { name, states: { pillar_axis: p.axis || 'y' } };
  }

  // ── PLANKS ───────────────────────────────────────────────────────────────
  if (LEGACY_WOOD_TYPES[javaName]) {
    return { name: 'minecraft:planks', states: { wood_type: LEGACY_WOOD_TYPES[javaName] } };
  }

  // ── BEDS ─────────────────────────────────────────────────────────────────
  if (javaName.endsWith('_bed')) {
    return {
      name: 'minecraft:bed',
      states: {
        direction: WEIRDO_DIR[p.facing] ?? 0,
        head_piece_bit: p.part === 'head',
        occupied_bit: p.occupied === 'true',
      }
    };
  }

  // ── SIGNS ────────────────────────────────────────────────────────────────
  if (javaName.endsWith('_sign') && !javaName.includes('wall') && !javaName.includes('hanging')) {
    return {
      name,
      states: { ground_sign_direction: parseInt(p.rotation ?? '0', 10) }
    };
  }
  if (javaName.endsWith('_wall_sign')) {
    return {
      name,
      states: { facing_direction: FACING_DIR[p.facing] ?? 2 }
    };
  }

  // ── CANDLES (colored + plain) ─────────────────────────────────────────────
  if (javaName === 'minecraft:candle' || (javaName.endsWith('_candle') && !javaName.endsWith('_candle_cake'))) {
    return {
      name,
      states: {
        candles: Math.max(0, parseInt(p.candles ?? '1', 10) - 1),
        lit: p.lit === 'true',
      }
    };
  }
  if (javaName === 'minecraft:candle_cake' || javaName.endsWith('_candle_cake')) {
    return { name, states: { lit: p.lit === 'true' } };
  }

  // ── TRAPDOORS ────────────────────────────────────────────────────────────
  if (javaName.endsWith('_trapdoor')) {
    return {
      name,
      states: {
        direction: WEIRDO_DIR[p.facing] ?? 0,
        upside_down_bit: p.half === 'top',
        open_bit: p.open === 'true',
      }
    };
  }

  // ── DOORS ────────────────────────────────────────────────────────────────
  if (javaName.endsWith('_door')) {
    return {
      name,
      states: {
        direction: WEIRDO_DIR[p.facing] ?? 0,
        upper_block_bit: p.half === 'upper',
        open_bit: p.open === 'true',
        door_hinge_bit: p.hinge === 'right',
      }
    };
  }

  // ── FENCE GATES ──────────────────────────────────────────────────────────
  if (javaName.endsWith('_fence_gate')) {
    return {
      name,
      states: {
        direction: CARDINAL_DIR[p.facing] ?? 0,
        open_bit: p.open === 'true',
        in_wall_bit: p.in_wall === 'true',
      }
    };
  }

  // ── GLAZED TERRACOTTA ────────────────────────────────────────────────────
  if (javaName.endsWith('_glazed_terracotta')) {
    return { name, states: { facing_direction: FACING_DIR[p.facing] ?? 2 } };
  }

  // ── WALL TORCHES ─────────────────────────────────────────────────────────
  if (javaName.endsWith('_wall_torch')) {
    return {
      name,
      states: { torch_facing_direction: TORCH_FACING[p.facing] || 'torch_facing_direction' }
    };
  }

  // ── CAMPFIRE ─────────────────────────────────────────────────────────────
  if (javaName === 'minecraft:campfire' || javaName === 'minecraft:soul_campfire') {
    return {
      name,
      states: {
        cardinal_direction: p.facing || 'north',
        extinguished: p.lit === 'false'
      }
    };
  }

  // ── CHESTS / BARRELS / HOPPERS / DISPENSERS ──────────────────────────────
  if (javaName === 'minecraft:chest' || javaName === 'minecraft:trapped_chest' || javaName === 'minecraft:ender_chest' || javaName === 'minecraft:barrel' || javaName === 'minecraft:dispenser' || javaName === 'minecraft:dropper' || javaName === 'minecraft:furnace' || javaName === 'minecraft:blast_furnace' || javaName === 'minecraft:smoker' || javaName === 'minecraft:observer') {
    return {
      name,
      states: { facing_direction: FACING_DIR[p.facing] ?? 2 }
    };
  }

  if (javaName === 'minecraft:hopper') {
    return {
      name,
      states: {
        facing_direction: FACING_DIR[p.facing] ?? 0,
        toggle_bit: p.enabled === 'false'
      }
    };
  }

  // ── TALL GRASS / PLANTS ──────────────────────────────────────────────────
  if (javaName === 'minecraft:grass' || javaName === 'minecraft:short_grass') {
    return { name: 'minecraft:tallgrass', states: { tall_grass_type: 'tall' } };
  }
  if (javaName === 'minecraft:fern') {
    return { name: 'minecraft:tallgrass', states: { tall_grass_type: 'fern' } };
  }

  // ── GENERIC FACING & AXIS FALLBACKS ──────────────────────────────────────
  if (p.facing) {
    return { name, states: { facing_direction: FACING_DIR[p.facing] ?? 2 } };
  }
  if (p.axis) {
    return { name, states: { pillar_axis: p.axis } };
  }
  if (p.rotation !== undefined) {
    return { name, states: { ground_sign_direction: parseInt(p.rotation, 10) } };
  }

  return { name, states: {} };
}
