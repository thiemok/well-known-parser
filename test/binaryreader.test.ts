import { describe, expect, it } from 'vitest';
import { Buffer } from 'buffer';

import { BinaryReader } from '../src/binaryreader';

describe('wkx', () => {
  describe('BinaryReader', () => {
    it('readVarInt', () => {
      expect(new BinaryReader(Buffer.from('01', 'hex')).readVarInt()).toBe(1);
      expect(new BinaryReader(Buffer.from('ac02', 'hex')).readVarInt()).toBe(300);
    });
  });
});