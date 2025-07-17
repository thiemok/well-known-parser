import { describe, expect, it } from 'vitest';

import { BinaryWriter } from '../src/binarywriter';

describe('wkx', () => {
  describe('BinaryWriter', () => {
    it('writeVarInt - 1', () => {
      const binaryWriter = new BinaryWriter(1);
      const length = binaryWriter.writeVarInt(1);

      expect(binaryWriter.buffer.toString('hex')).toBe('01');
      expect(length).toBe(1);
    });

    it('writeVarInt - 300', () => {
      const binaryWriter = new BinaryWriter(2);
      const length = binaryWriter.writeVarInt(300);

      expect(binaryWriter.buffer.toString('hex')).toBe('ac02');
      expect(length).toBe(2);
    });

    it('writeUInt8 - enough space', () => {
      const binaryWriter = new BinaryWriter(1);
      binaryWriter.writeUInt8(1);
      expect(binaryWriter.buffer.length).toBe(1);
      expect(binaryWriter.position).toBe(1);
    });

    it('writeUInt16LE - not enough space', () => {
      const binaryWriter = new BinaryWriter(1);
      expect(() => binaryWriter.writeUInt16LE(1)).toThrow(new RangeError('index out of range'));
    });

    it('writeUInt8 - enough space / allow resize', () => {
      const binaryWriter = new BinaryWriter(1, true);
      binaryWriter.writeUInt8(1);
      expect(binaryWriter.buffer.length).toBe(1);
      expect(binaryWriter.position).toBe(1);
    });

    it('writeUInt16LE - not enough space  / allow resize', () => {
      const binaryWriter = new BinaryWriter(1, true);
      binaryWriter.writeUInt16LE(1);
      expect(binaryWriter.buffer.length).toBe(2);
      expect(binaryWriter.position).toBe(2);
    });
  });
});
