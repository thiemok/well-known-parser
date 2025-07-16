/**
 * ZigZag encoding and decoding for efficient integer compression
 * Used in the TWKB format to compress coordinate values
 */
export function encode(value: number): number {
  return (value << 1) ^ (value >> 31);
}

export function decode(value: number): number {
  return (value >> 1) ^ (-(value & 1));
}