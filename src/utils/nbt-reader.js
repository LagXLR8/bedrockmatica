/**
 * Big-Endian NBT Reader for Java Minecraft / Litematica files.
 */
export class NBTReader {
  constructor(buffer) {
    this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.offset = 0;
    this.decoder = new TextDecoder('utf-8');
  }

  readRoot() {
    const type = this.readByte();
    if (type !== 10) {
      throw new Error(`Expected TAG_Compound root (10), got ${type}`);
    }
    const name = this.readString();
    const value = this.readTagPayload(10);
    return { name, value };
  }

  readByte() {
    const val = this.view.getInt8(this.offset);
    this.offset += 1;
    return val;
  }

  readUnsignedByte() {
    const val = this.view.getUint8(this.offset);
    this.offset += 1;
    return val;
  }

  readShort() {
    const val = this.view.getInt16(this.offset, false);
    this.offset += 2;
    return val;
  }

  readInt() {
    const val = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return val;
  }

  readLong() {
    const val = this.view.getBigInt64(this.offset, false);
    this.offset += 8;
    return val;
  }

  readFloat() {
    const val = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return val;
  }

  readDouble() {
    const val = this.view.getFloat64(this.offset, false);
    this.offset += 8;
    return val;
  }

  readString() {
    const len = this.view.getUint16(this.offset, false);
    this.offset += 2;
    const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, len);
    this.offset += len;
    return this.decoder.decode(bytes);
  }

  readTagPayload(type) {
    switch (type) {
      case 0: return null; // TAG_End
      case 1: return this.readByte();
      case 2: return this.readShort();
      case 3: return this.readInt();
      case 4: return this.readLong();
      case 5: return this.readFloat();
      case 6: return this.readDouble();
      case 7: { // TAG_Byte_Array
        const len = this.readInt();
        const arr = new Int8Array(this.view.buffer.slice(this.view.byteOffset + this.offset, this.view.byteOffset + this.offset + len));
        this.offset += len;
        return arr;
      }
      case 8: return this.readString();
      case 9: { // TAG_List
        const subType = this.readByte();
        const len = this.readInt();
        const list = [];
        for (let i = 0; i < len; i++) {
          list.push(this.readTagPayload(subType));
        }
        return list;
      }
      case 10: { // TAG_Compound
        const compound = {};
        while (true) {
          const t = this.readByte();
          if (t === 0) break;
          const name = this.readString();
          compound[name] = this.readTagPayload(t);
        }
        return compound;
      }
      case 11: { // TAG_Int_Array
        const len = this.readInt();
        const arr = new Int32Array(len);
        for (let i = 0; i < len; i++) {
          arr[i] = this.readInt();
        }
        return arr;
      }
      case 12: { // TAG_Long_Array
        const len = this.readInt();
        const arr = new BigInt64Array(len);
        for (let i = 0; i < len; i++) {
          arr[i] = this.readLong();
        }
        return arr;
      }
      default:
        throw new Error(`Unknown NBT Tag type: ${type} at offset ${this.offset}`);
    }
  }
}
