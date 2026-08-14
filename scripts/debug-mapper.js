/**
 * Diagnostic script: dumps block mapping output for a litematic file.
 * Shows what Java blocks are mapped to what Bedrock blocks.
 * Run: node --experimental-vm-modules scripts/debug-mapper.js <file.litematic>
 */
import fs from 'fs';
import path from 'path';
import { parseLitematic } from '../src/utils/litematica-parser.js';
import { mapJavaToBedrockBlock } from '../src/utils/block-mapper.js';

const file = process.argv[2] || 'dao nhat ban.litematic';
const litematicPath = path.resolve(file);

if (!fs.existsSync(litematicPath)) {
  console.error('File not found:', litematicPath);
  console.log('Usage: node scripts/debug-mapper.js <file.litematic>');
  process.exit(1);
}

console.log('Reading:', litematicPath, '\n');
const fileBuffer = fs.readFileSync(litematicPath);
const parsed = parseLitematic(fileBuffer);

for (const reg of parsed.regions) {
  console.log(`=== Region: ${reg.name} (${reg.width}x${reg.height}x${reg.length}) ===`);

  // Count all unique blocks by Java name → Bedrock mapping
  const mappings = new Map();

  for (const javaBlock of reg.palette) {
    if (!javaBlock) continue;
    const javaName = javaBlock.name;
    const javaProps = javaBlock.properties || {};
    const bedrock = mapJavaToBedrockBlock(javaName, javaProps);
    const key = `${javaName} ${JSON.stringify(javaProps)}`;
    if (!mappings.has(key)) {
      mappings.set(key, {
        java: javaName,
        props: javaProps,
        bedrock: bedrock
      });
    }
  }

  // Count usage of each palette entry
  const usageCounts = new Array(reg.palette.length).fill(0);
  for (let i = 0; i < reg.blockIndices.length; i++) {
    const idx = reg.blockIndices[i];
    if (idx >= 0 && idx < reg.palette.length) usageCounts[idx]++;
  }

  // Build list sorted by usage
  const entries = reg.palette
    .map((javaBlock, idx) => {
      if (!javaBlock || javaBlock.name.includes(':air')) return null;
      const javaName = javaBlock.name;
      const javaProps = javaBlock.properties || {};
      const bedrock = mapJavaToBedrockBlock(javaName, javaProps);
      return { count: usageCounts[idx], javaName, javaProps, bedrock };
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count);

  console.log('\nTop 40 mappings (by usage count):');
  console.log(`${'Count'.padStart(7)}  ${'Java Block'.padEnd(55)}  →  Bedrock Block`);
  console.log('-'.repeat(140));

  for (const e of entries.slice(0, 40)) {
    const javaStr = `${e.javaName} ${Object.keys(e.javaProps).length ? JSON.stringify(e.javaProps) : ''}`.padEnd(55);
    const bedrockStr = `${e.bedrock.name} ${JSON.stringify(e.bedrock.states)}`;
    console.log(`${String(e.count).padStart(7)}  ${javaStr}  →  ${bedrockStr}`);
  }

  // Flag possible unknowns or suspicious mappings
  console.log('\n⚠️  Potentially problematic blocks:');
  for (const e of entries) {
    const b = e.bedrock;
    // Flag if name didn't change and has no special states (possible passthrough with unknown states)
    const noSpecialHandling = Object.keys(b.states).length === 0 && b.name === e.javaName;
    const hasProblematicProps = Object.keys(e.javaProps).length > 0 && noSpecialHandling;
    if (hasProblematicProps) {
      console.log(`  ${e.count}x ${e.javaName} ${JSON.stringify(e.javaProps)} → ${b.name} (NO STATES MAPPED)`);
    }
  }
  console.log('');
}
