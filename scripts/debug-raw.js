/**
 * Deep diagnostic: prints raw NBT of first few palette entries.
 */
import fs from 'fs';
import path from 'path';
import pako from 'pako';
import { NBTReader } from '../src/utils/nbt-reader.js';
import { mapJavaToBedrockBlock } from '../src/utils/block-mapper.js';

const file = process.argv[2] || 'dao nhat ban.litematic';
const buf = fs.readFileSync(path.resolve(file));
const uint8 = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
const decompressed = (uint8[0] === 0x1f && uint8[1] === 0x8b) ? pako.ungzip(uint8) : uint8;

const reader = new NBTReader(decompressed);
const nbt = reader.readRoot();
const root = nbt.value;
const regionsRaw = root.Regions || {};

for (const [regionName, reg] of Object.entries(regionsRaw)) {
  const paletteRaw = reg.BlockStatePalette || [];
  console.log(`\n=== Region: ${regionName} — First 20 palette entries (RAW) ===`);
  for (let i = 0; i < Math.min(20, paletteRaw.length); i++) {
    const entry = paletteRaw[i];
    console.log(`[${i}] RAW entry:`, JSON.stringify(entry));
    const name = entry.Name || 'minecraft:air';
    const properties = entry.Properties || {};
    console.log(`    name=${name}  properties=${JSON.stringify(properties)}`);
    const bedrock = mapJavaToBedrockBlock(name, properties);
    console.log(`    → Bedrock: name=${bedrock.name}  states=${JSON.stringify(bedrock.states)}`);
  }

  // Find slab entries specifically
  console.log(`\n=== Slab/Hanging/Shelf entries ===`);
  for (let i = 0; i < paletteRaw.length; i++) {
    const entry = paletteRaw[i];
    const name = (entry.Name || '');
    if (name.includes('slab') || name.includes('hanging') || name.includes('shelf')) {
      const properties = entry.Properties || {};
      const bedrock = mapJavaToBedrockBlock(name, properties);
      console.log(`[${i}] ${name} ${JSON.stringify(properties)}`);
      console.log(`     → ${bedrock.name} ${JSON.stringify(bedrock.states)}`);
    }
  }
  break; // Only check first region
}
