import pako from 'pako';
import { NBTReader } from './nbt-reader.js';

/**
 * Unpacks bit-packed LongArray from Litematica format.
 * Litematica packs bits continuously across 64-bit boundaries.
 * 
 * @param {BigInt64Array} longArray 
 * @param {number} bitsPerBlock 
 * @param {number} totalBlocks 
 * @returns {Uint32Array} Array of palette indices for each block
 */
export function unpackLitematicaBlockStates(longArray, bitsPerBlock, totalBlocks) {
  const result = new Uint32Array(totalBlocks);
  if (!longArray || longArray.length === 0 || bitsPerBlock === 0) {
    return result;
  }

  const mask = (1n << BigInt(bitsPerBlock)) - 1n;
  const numLongs = longArray.length;

  for (let i = 0; i < totalBlocks; i++) {
    const startBit = BigInt(i) * BigInt(bitsPerBlock);
    const startLongIdx = Number(startBit / 64n);
    const bitOffset = Number(startBit % 64n);

    if (startLongIdx >= numLongs) break;

    // Convert BigInt to unsigned 64-bit equivalent for bit operations
    const currentLong = BigInt.asUintN(64, longArray[startLongIdx]);
    let val = (currentLong >> BigInt(bitOffset)) & mask;

    const bitsInFirst = 64 - bitOffset;
    if (bitsInFirst < bitsPerBlock && (startLongIdx + 1) < numLongs) {
      const nextLong = BigInt.asUintN(64, longArray[startLongIdx + 1]);
      const bitsNeededFromNext = bitsPerBlock - bitsInFirst;
      const nextMask = (1n << BigInt(bitsNeededFromNext)) - 1n;
      const nextVal = nextLong & nextMask;
      val |= (nextVal << BigInt(bitsInFirst));
    }

    result[i] = Number(val);
  }

  return result;
}

/**
 * Parses a raw .litematic file buffer into structured JSON data.
 * @param {ArrayBuffer|Uint8Array} fileData 
 * @returns {Object} Parsed Litematica schematic data
 */
export function parseLitematic(fileData) {
  const uint8 = fileData instanceof Uint8Array ? fileData : new Uint8Array(fileData);
  
  // Decompress gzip if magic header 0x1F 0x8B
  let decompressed = uint8;
  if (uint8[0] === 0x1f && uint8[1] === 0x8b) {
    decompressed = pako.ungzip(uint8);
  }

  const reader = new NBTReader(decompressed);
  const nbt = reader.readRoot();
  const root = nbt.value;

  const metadata = root.Metadata || {};
  const regionsRaw = root.Regions || {};
  const regions = [];

  for (const [regionName, reg] of Object.entries(regionsRaw)) {
    const size = reg.Size || { x: 0, y: 0, z: 0 };
    const pos = reg.Position || { x: 0, y: 0, z: 0 };

    const width = Math.abs(size.x);
    const height = Math.abs(size.y);
    const length = Math.abs(size.z);
    const totalBlocks = width * height * length;

    const paletteRaw = reg.BlockStatePalette || [];
    const palette = paletteRaw.map(entry => {
      const name = entry.Name || 'minecraft:air';
      const properties = entry.Properties || {};
      return { name, properties };
    });

    const paletteSize = palette.length;
    const bitsPerBlock = paletteSize <= 1 ? 2 : Math.max(2, Math.ceil(Math.log2(paletteSize)));

    const blockStatesLongs = reg.BlockStates || new BigInt64Array(0);
    const blockIndices = unpackLitematicaBlockStates(blockStatesLongs, bitsPerBlock, totalBlocks);

    regions.push({
      name: regionName,
      position: pos,
      size: { x: size.x, y: size.y, z: size.z },
      width,
      height,
      length,
      totalBlocks,
      palette,
      bitsPerBlock,
      blockIndices,
      // Sign of size determines iteration direction if needed
      stepX: size.x < 0 ? -1 : 1,
      stepY: size.y < 0 ? -1 : 1,
      stepZ: size.z < 0 ? -1 : 1,
    });
  }

  return {
    version: root.Version,
    dataVersion: root.MinecraftDataVersion,
    metadata: {
      name: metadata.Name || 'Litematica Schem',
      author: metadata.Author || 'Unknown',
      description: metadata.Description || '',
      enclosingSize: metadata.EnclosingSize || { x: 0, y: 0, z: 0 },
      totalBlocks: metadata.TotalBlocks || 0,
      totalVolume: metadata.TotalVolume || 0,
    },
    regions,
  };
}
