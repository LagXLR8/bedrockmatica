import { parseLitematic } from './utils/litematica-parser.js';
import { sliceRegionToBedrockStructures } from './utils/structure-slicer.js';
import { buildBedrockAddon } from './utils/addon-builder.js';

self.onmessage = async (event) => {
  const { fileBuffer, maxChunkSize = 64, fileName = '', lang = 'vi' } = event.data;
  const isVi = lang === 'vi';

  try {
    self.postMessage({
      type: 'progress',
      percent: 15,
      status: isVi ? 'Phân tích dữ liệu Litematica NBT...' : 'Parsing Litematica NBT data...'
    });
    const parsed = parseLitematic(fileBuffer);

    if (!parsed.regions || parsed.regions.length === 0) {
      throw new Error(isVi ? 'Không tìm thấy vùng cấu trúc (Region) hợp lệ trong file .litematic.' : 'No valid regions found in .litematic file.');
    }

    const region = parsed.regions[0];
    self.postMessage({
      type: 'progress',
      percent: 40,
      status: isVi 
        ? `Đang cắt lát (${region.width}×${region.height}×${region.length}) thành các khối ≤ ${maxChunkSize}...`
        : `Slicing (${region.width}×${region.height}×${region.length}) into blocks ≤ ${maxChunkSize}...`
    });

    const subStructures = sliceRegionToBedrockStructures(region, maxChunkSize);

    self.postMessage({
      type: 'progress',
      percent: 75,
      status: isVi 
        ? `Đang mã hóa ${subStructures.length} cấu trúc Bedrock & tạo .mcaddon...`
        : `Encoding ${subStructures.length} Bedrock structures & building .mcaddon...`
    });

    // Determine initial clean schematic name:
    let schematicName = parsed.metadata.name;
    if (
      !schematicName || 
      schematicName.trim() === '' || 
      schematicName.toLowerCase() === 'unnamed' || 
      schematicName === 'Litematica Schem'
    ) {
      schematicName = fileName || 'My_Schematic';
    }

    const addonBlob = await buildBedrockAddon(schematicName, subStructures, lang);

    self.postMessage({
      type: 'complete',
      percent: 100,
      status: isVi ? 'Chuyển đổi hoàn tất!' : 'Conversion complete!',
      result: {
        schematicName: schematicName,
        author: parsed.metadata.author || 'Unknown',
        dimensions: { width: region.width, height: region.height, length: region.length },
        totalVolume: region.totalBlocks,
        subStructuresCount: subStructures.length,
        paletteCount: region.palette.length,
        addonBlob: addonBlob,
        subStructures: subStructures
      }
    });
  } catch (err) {
    self.postMessage({
      type: 'error',
      error: err.message || (isVi ? 'Đã xảy ra lỗi trong quá trình chuyển đổi.' : 'An error occurred during conversion.')
    });
  }
};
