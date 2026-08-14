import { parseLitematic } from './utils/litematica-parser.js';
import { sliceRegionToBedrockStructures } from './utils/structure-slicer.js';
import { buildBedrockAddon } from './utils/addon-builder.js';

self.onmessage = async (event) => {
  const { fileBuffer, maxChunkSize = 64, fileName = '' } = event.data;

  try {
    self.postMessage({ type: 'progress', percent: 15, status: 'Phân tích dữ liệu Litematica NBT...' });
    const parsed = parseLitematic(fileBuffer);

    if (!parsed.regions || parsed.regions.length === 0) {
      throw new Error('Không tìm thấy vùng cấu trúc (Region) hợp lệ trong file .litematic.');
    }

    const region = parsed.regions[0];
    self.postMessage({
      type: 'progress',
      percent: 40,
      status: `Đang cắt lát (${region.width}×${region.height}×${region.length}) thành các khối ≤ ${maxChunkSize}...`
    });

    const subStructures = sliceRegionToBedrockStructures(region, maxChunkSize);

    self.postMessage({
      type: 'progress',
      percent: 75,
      status: `Đang mã hóa ${subStructures.length} cấu trúc Bedrock & tạo .mcaddon...`
    });

    // Determine initial clean schematic name:
    // If metadata name is empty, 'Unnamed', 'unnamed', or 'Litematica Schem', fallback to uploaded fileName
    let schematicName = parsed.metadata.name;
    if (
      !schematicName || 
      schematicName.trim() === '' || 
      schematicName.toLowerCase() === 'unnamed' || 
      schematicName === 'Litematica Schem'
    ) {
      schematicName = fileName || 'My_Schematic';
    }

    const addonBlob = await buildBedrockAddon(schematicName, subStructures);

    self.postMessage({
      type: 'complete',
      percent: 100,
      status: 'Chuyển đổi hoàn tất!',
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
      error: err.message || 'Đã xảy ra lỗi trong quá trình chuyển đổi.'
    });
  }
};
