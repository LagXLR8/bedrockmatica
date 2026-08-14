import { mapJavaToBedrockBlock } from './block-mapper.js';
import { encodeBedrockStructure } from './bedrock-encoder.js';

/**
 * Slices a large Litematica region into <= 64x64x64 Bedrock structure files.
 * 
 * @param {Object} region Litematica parsed region
 * @param {number} maxChunkSize Max length along X, Y, Z (default 64)
 * @returns {Array<Object>} List of sub-structures with binary data and metadata
 */
export function sliceRegionToBedrockStructures(region, maxChunkSize = 64) {
  const { width, height, length, palette, blockIndices } = region;

  const countX = Math.ceil(width / maxChunkSize);
  const countY = Math.ceil(height / maxChunkSize);
  const countZ = Math.ceil(length / maxChunkSize);

  // Pre-map Java palette entries to Bedrock equivalents
  const mappedPaletteEntries = palette.map(p => mapJavaToBedrockBlock(p.name, p.properties));

  const results = [];

  for (let cy = 0; cy < countY; cy++) {
    for (let cz = 0; cz < countZ; cz++) {
      for (let cx = 0; cx < countX; cx++) {
        const sx = Math.min(maxChunkSize, width - cx * maxChunkSize);
        const sy = Math.min(maxChunkSize, height - cy * maxChunkSize);
        const sz = Math.min(maxChunkSize, length - cz * maxChunkSize);

        const offsetX = cx * maxChunkSize;
        const offsetY = cy * maxChunkSize;
        const offsetZ = cz * maxChunkSize;

        // Collect unique Bedrock blocks for this sub-chunk
        const subPaletteMap = new Map();
        const subPaletteList = [];

        function getOrAddSubPaletteIndex(javaPalIdx) {
          const mapped = mappedPaletteEntries[javaPalIdx] || { name: 'minecraft:air', states: {} };
          const key = mapped.name + '|' + JSON.stringify(mapped.states);
          if (!subPaletteMap.has(key)) {
            const newIdx = subPaletteList.length;
            subPaletteMap.set(key, newIdx);
            subPaletteList.push(mapped);
            return newIdx;
          }
          return subPaletteMap.get(key);
        }

        // Air is index 0 by convention
        getOrAddSubPaletteIndex(0);

        const totalSubVolume = sx * sy * sz;
        const subIndices = new Int32Array(totalSubVolume);
        let nonAirCount = 0;

        for (let bx = 0; bx < sx; bx++) {
          const x = offsetX + bx;
          for (let by = 0; by < sy; by++) {
            const y = offsetY + by;
            for (let bz = 0; bz < sz; bz++) {
              const z = offsetZ + bz;

              // Litematica 1D index: (y * length * width) + (z * width) + x
              const litIdx = (y * length * width) + (z * width) + x;
              const javaPalIdx = blockIndices[litIdx] || 0;

              const subPalIdx = getOrAddSubPaletteIndex(javaPalIdx);
              // Bedrock 3D index: (bx * sy * sz) + (by * sz) + bz
              const bedrockIdx = (bx * sy * sz) + (by * sz) + bz;
              subIndices[bedrockIdx] = subPalIdx;

              if (subPalIdx !== 0 && mappedPaletteEntries[javaPalIdx].name !== 'minecraft:air') {
                nonAirCount++;
              }
            }
          }
        }

        // Skip completely empty sub-chunks
        if (nonAirCount === 0) {
          continue;
        }

        const fileName = `struct_y${cy}_z${cz}_x${cx}.mcstructure`;
        const buffer = encodeBedrockStructure(sx, sy, sz, subPaletteList, subIndices);

        results.push({
          fileName,
          gridIndex: { x: cx, y: cy, z: cz },
          size: { x: sx, y: sy, z: sz },
          offset: { x: offsetX, y: offsetY, z: offsetZ },
          nonAirCount,
          buffer,
        });
      }
    }
  }

  return results;
}
