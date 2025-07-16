/**
 * A class for reading binary data with support for different endianness
 */
export class BinaryReader {
  buffer: Buffer;
  position: number;
  isBigEndian: boolean;

  constructor(buffer: Buffer, isBigEndian: boolean = false) {
    this.buffer = buffer;
    this.position = 0;
    this.isBigEndian = isBigEndian;
  }

  readUInt8(): number {
    const value = this.buffer.readUInt8(this.position);
    this.position += 1;
    return value;
  }

  readUInt16(): number {
    const value = this.isBigEndian
      ? this.buffer.readUInt16BE(this.position)
      : this.buffer.readUInt16LE(this.position);
    this.position += 2;
    return value;
  }

  readUInt32(): number {
    const value = this.isBigEndian
      ? this.buffer.readUInt32BE(this.position)
      : this.buffer.readUInt32LE(this.position);
    this.position += 4;
    return value;
  }

  readInt8(): number {
    const value = this.buffer.readInt8(this.position);
    this.position += 1;
    return value;
  }

  readInt16(): number {
    const value = this.isBigEndian
      ? this.buffer.readInt16BE(this.position)
      : this.buffer.readInt16LE(this.position);
    this.position += 2;
    return value;
  }

  readInt32(): number {
    const value = this.isBigEndian
      ? this.buffer.readInt32BE(this.position)
      : this.buffer.readInt32LE(this.position);
    this.position += 4;
    return value;
  }

  readFloat(): number {
    const value = this.isBigEndian
      ? this.buffer.readFloatBE(this.position)
      : this.buffer.readFloatLE(this.position);
    this.position += 4;
    return value;
  }

  readDouble(): number {
    const value = this.isBigEndian
      ? this.buffer.readDoubleBE(this.position)
      : this.buffer.readDoubleLE(this.position);
    this.position += 8;
    return value;
  }

  readVarInt(): number {
    let nextByte: number;
    let result = 0;
    let bytesRead = 0;

    do {
      nextByte = this.buffer[this.position + bytesRead];
      result += (nextByte & 0x7F) << (7 * bytesRead);
      bytesRead++;
    } while (nextByte >= 0x80);

    this.position += bytesRead;

    return result;
  }
}