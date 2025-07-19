import { describe, expect, it } from 'vitest';

import * as ZigZag from '../src/zigzag';

describe('wkx', () => {
  describe('ZigZag', () => {
    it('encode', () => {
      expect(ZigZag.encode(-1)).toBe(1);
      expect(ZigZag.encode(1)).toBe(2);
      expect(ZigZag.encode(-2)).toBe(3);
      expect(ZigZag.encode(2)).toBe(4);
    });
    
    it('decode', () => {
      expect(ZigZag.decode(1)).toBe(-1);
      expect(ZigZag.decode(2)).toBe(1);
      expect(ZigZag.decode(3)).toBe(-2);
      expect(ZigZag.decode(4)).toBe(2);
    });
  });
});