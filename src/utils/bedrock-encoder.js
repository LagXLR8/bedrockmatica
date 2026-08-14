/**
 * Little-Endian NBT Encoder for Minecraft Bedrock .mcstructure files.
 */

export class LittleEndianNBTWriter {
  constructor() {
    this.buffer = new Uint8Array(1024 * 64);
    this.offset = 0;
    this.encoder = new TextEncoder();
  }

  ensureCapacity(additional) {
    if (this.offset + additional >= this.buffer.length) {
      const newCap = Math.max(this.buffer.length * 2, this.offset + additional + 65536);
      const newBuf = new Uint8Array(newCap);
      newBuf.set(this.buffer);
      this.buffer = newBuf;
    }
  }

  getUint8Array() {
    return this.buffer.subarray(0, this.offset);
  }

  writeByte(val) {
    this.ensureCapacity(1);
    this.buffer[this.offset] = val & 0xff;
    this.offset += 1;
  }

  writeShort(val) {
    this.ensureCapacity(2);
    const view = new DataView(this.buffer.buffer, this.offset, 2);
    view.setInt16(0, val, true); // true = Little-Endian
    this.offset += 2;
  }

  writeInt(val) {
    this.ensureCapacity(4);
    const view = new DataView(this.buffer.buffer, this.offset, 4);
    view.setInt32(0, val, true);
    this.offset += 4;
  }

  writeLong(val) {
    this.ensureCapacity(8);
    const view = new DataView(this.buffer.buffer, this.offset, 8);
    view.setBigInt64(0, BigInt(val), true);
    this.offset += 8;
  }

  writeFloat(val) {
    this.ensureCapacity(4);
    const view = new DataView(this.buffer.buffer, this.offset, 4);
    view.setFloat32(0, val, true);
    this.offset += 4;
  }

  writeDouble(val) {
    this.ensureCapacity(8);
    const view = new DataView(this.buffer.buffer, this.offset, 8);
    view.setFloat64(0, val, true);
    this.offset += 8;
  }

  writeString(str) {
    const bytes = this.encoder.encode(str);
    this.writeShort(bytes.length);
    this.ensureCapacity(bytes.length);
    this.buffer.set(bytes, this.offset);
    this.offset += bytes.length;
  }

  writeRootCompound(name, compoundObj) {
    this.writeByte(10); // TAG_Compound
    this.writeString(name);
    this.writeCompoundPayload(compoundObj);
  }

  writeTag(name, tagType, value) {
    this.writeByte(tagType);
    this.writeString(name);
    this.writeTagPayload(tagType, value);
  }

  writeTagPayload(type, value) {
    switch (type) {
      case 1: this.writeByte(value); break;
      case 2: this.writeShort(value); break;
      case 3: this.writeInt(value); break;
      case 4: this.writeLong(value); break;
      case 5: this.writeFloat(value); break;
      case 6: this.writeDouble(value); break;
      case 8: this.writeString(value); break;
      case 9: { // TAG_List: value = { subType: number, list: Array }
        this.writeByte(value.subType);
        this.writeInt(value.list.length);
        for (const item of value.list) {
          this.writeTagPayload(value.subType, item);
        }
        break;
      }
      case 10: { // TAG_Compound: value = object of { type, value }
        this.writeCompoundPayload(value);
        break;
      }
      default:
        throw new Error(`Unsupported NBT Tag Type for writing: ${type}`);
    }
  }

  writeCompoundPayload(compoundObj) {
    for (const [key, entry] of Object.entries(compoundObj)) {
      this.writeTag(key, entry.type, entry.value);
    }
    this.writeByte(0); // TAG_End
  }
}

/**
 * Creates a Bedrock .mcstructure Uint8Array buffer from a 3D block palette grid.
 * 
 * @param {number} sizeX width <= 64
 * @param {number} sizeY height <= 64
 * @param {number} sizeZ length <= 64
 * @param {Array<{name: string, states: Object}>} bedrockPalette 
 * @param {Int32Array} blockIndices 3D array indexed by (x * sizeY * sizeZ) + (y * sizeZ) + z
 * @returns {Uint8Array} Binary .mcstructure buffer
 */
export function encodeBedrockStructure(sizeX, sizeY, sizeZ, bedrockPalette, blockIndices) {
  const writer = new LittleEndianNBTWriter();

  // Format bedrock palette NBT
  const paletteNBTList = bedrockPalette.map(b => ({
    name: { type: 8, value: b.name },
    states: {
      type: 10,
      value: Object.fromEntries(
        Object.entries(b.states).map(([k, v]) => {
          if (typeof v === 'boolean') return [k, { type: 1, value: v ? 1 : 0 }];
          if (typeof v === 'number') return [k, { type: 3, value: v }];
          return [k, { type: 8, value: String(v) }];
        })
      )
    },
    version: { type: 3, value: 18166273 }  // Bedrock 1.21.50.1
  }));

  const totalVolume = sizeX * sizeY * sizeZ;
  const layer0 = new Array(totalVolume);
  const layer1 = new Array(totalVolume).fill(-1);

  for (let i = 0; i < totalVolume; i++) {
    layer0[i] = blockIndices[i] !== undefined ? blockIndices[i] : -1;
  }

  const rootNBT = {
    format_version: { type: 3, value: 1 },
    size: {
      type: 9,
      value: { subType: 3, list: [sizeX, sizeY, sizeZ] }
    },
    structure_world_origin: {
      type: 9,
      value: { subType: 3, list: [0, 0, 0] }
    },
    structure: {
      type: 10,
      value: {
        block_indices: {
          type: 9,
          value: {
            subType: 9,
            list: [
              { subType: 3, list: layer0 },
              { subType: 3, list: layer1 }
            ]
          }
        },
        entities: {
          type: 9,
          value: { subType: 10, list: [] }
        },
        palette: {
          type: 10,
          value: {
            default: {
              type: 10,
              value: {
                block_palette: {
                  type: 9,
                  value: { subType: 10, list: paletteNBTList }
                },
                block_position_data: {
                  type: 10,
                  value: {}
                }
              }
            }
          }
        }
      }
    }
  };

  writer.writeRootCompound('', rootNBT);
  return writer.getUint8Array();
}
