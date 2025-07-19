import { describe, expect, it } from 'vitest';
import { Buffer } from 'buffer';

import { parseTwkb, Point } from '../src';

describe('wkx', () => {
  describe('parseTwkb', () => {
    it('includes size', () => {
      expect(parseTwkb(Buffer.from('0102020204', 'hex'))).toEqual(new Point(1, 2));
    });
    
    it('includes bounding box', () => {
      expect(parseTwkb(Buffer.from('0101020004000204', 'hex'))).toEqual(new Point(1, 2));
    });
    
    it('includes extended precision', () => {
      expect(parseTwkb(Buffer.from('01080302040608', 'hex'))).toEqual(new Point(1, 2, 3, 4));
    });
    
    it('includes extended precision and bounding box', () => {
      expect(parseTwkb(Buffer.from('010903020004000600080002040608', 'hex'))).toEqual(new Point(1, 2, 3, 4));
    });
  });
  
  describe('toTwkb', () => {
    it('Point small', () => {
      expect(new Point(1, 2).toTwkb().toString('hex')).toBe('a100c09a0c80b518');
    });
    
    it('Point large', () => {
      expect(new Point(10000, 20000).toTwkb().toString('hex')).toBe('a10080a8d6b90780d0acf30e');
    });
  });
});