import fs from 'fs';
import path from 'path';
import { parseLitematic } from '../src/utils/litematica-parser.js';

const litematicPath = path.resolve('con rồng fix.litematic');
console.log('Reading file:', litematicPath);

const fileBuffer = fs.readFileSync(litematicPath);
console.log('Raw buffer size:', fileBuffer.length, 'bytes');

const start = Date.now();
const parsed = parseLitematic(fileBuffer);
const elapsed = Date.now() - start;

console.log(`Successfully parsed Litematica in ${elapsed}ms!`);
console.log('Metadata:', JSON.stringify(parsed.metadata, null, 2));
console.log('Regions count:', parsed.regions.length);

for (const reg of parsed.regions) {
  console.log(`Region [${reg.name}]:`);
  console.log(`  Dimensions: ${reg.width} x ${reg.height} x ${reg.length} (total volume: ${reg.totalBlocks})`);
  console.log(`  Palette size: ${reg.palette.length} entries (bitsPerBlock: ${reg.bitsPerBlock})`);
  console.log(`  Block indices length: ${reg.blockIndices.length}`);
  
  // Count top 5 most common blocks
  const counts = {};
  for (let i = 0; i < reg.blockIndices.length; i++) {
    const idx = reg.blockIndices[i];
    counts[idx] = (counts[idx] || 0) + 1;
  }
  
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
    
  console.log('  Most common blocks:');
  for (const [palIdx, count] of sorted) {
    const block = reg.palette[palIdx];
    console.log(`    - ${block ? block.name : 'Unknown'}: ${count} blocks`);
  }
}
