import fs from 'fs';
import path from 'path';
import { parseLitematic } from '../src/utils/litematica-parser.js';
import { sliceRegionToBedrockStructures } from '../src/utils/structure-slicer.js';
import { buildBedrockAddon } from '../src/utils/addon-builder.js';

async function runEndToEndTest() {
  const fileBuffer = fs.readFileSync(path.resolve('con rồng fix.litematic'));
  console.log('1. Parsing Litematica file...');
  const parsed = parseLitematic(fileBuffer);
  console.log(`   Schematic Name: ${parsed.metadata.name}`);
  console.log(`   Dimensions: ${parsed.regions[0].width}x${parsed.regions[0].height}x${parsed.regions[0].length}`);

  console.log('2. Slicing region into <= 64x64x64 sub-structures...');
  const startSlice = Date.now();
  const subStructures = sliceRegionToBedrockStructures(parsed.regions[0], 64);
  const sliceTime = Date.now() - startSlice;
  console.log(`   Sliced into ${subStructures.length} non-empty sub-structures in ${sliceTime}ms!`);

  console.log('3. Packaging Bedrock Addon (.mcaddon)...');
  const startPack = Date.now();
  const addonBlob = await buildBedrockAddon(parsed.metadata.name, subStructures);
  const packTime = Date.now() - startPack;
  console.log(`   Generated .mcaddon in ${packTime}ms! Size: ${(addonBlob.size / 1024 / 1024).toFixed(2)} MB`);

  const arrayBuffer = await addonBlob.arrayBuffer();
  fs.writeFileSync('con_rong_fix.mcaddon', Buffer.from(arrayBuffer));
  console.log('   Saved test addon file to: con_rong_fix.mcaddon');
}

runEndToEndTest().catch(console.error);
