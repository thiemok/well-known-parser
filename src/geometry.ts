import { BinaryWriter } from './binarywriter';
import * as ZigZag from './zigzag';
import type { GeoJSONGeometry, GeometryOptions, TwkbPrecision } from './types';

export class Geometry {
  srid?: number;
  hasZ: boolean;
  hasM: boolean;

  constructor() {
    this.srid = undefined;
    this.hasZ = false;
    this.hasM = false;
  }

  toEwkt(): string {
    return `SRID=${this.srid};${this.toWkt()}`;
  }

  toEwkb(): Buffer {
    const ewkb = new BinaryWriter(this.getWkbSize() + 4, false);
    const wkb = this.toWkb();

    ewkb.writeInt8(1);
    ewkb.writeUInt32LE((wkb.subarray(1, 5).readUInt32LE(0) | 0x20000000) >>> 0);
    ewkb.writeUInt32LE(this.srid!);
    ewkb.writeBuffer(wkb.subarray(5));

    return ewkb.buffer;
  }

  protected getWktType(wktType: string, isEmpty: boolean): string {
    let wkt = wktType;

    if (this.hasZ && this.hasM) {
      wkt += ' ZM ';
    } else if (this.hasZ) {
      wkt += ' Z ';
    } else if (this.hasM) {
      wkt += ' M ';
    }

    if (isEmpty && !this.hasZ && !this.hasM) {
      wkt += ' ';
    }

    if (isEmpty) {
      wkt += 'EMPTY';
    }

    return wkt;
  }

  protected writeWkbType(
    wkb: BinaryWriter,
    geometryType: number,
    parentOptions?: GeometryOptions
  ): void {
    let dimensionType = 0;

    if (
      typeof this.srid === 'undefined' &&
      (!parentOptions || typeof parentOptions.srid === 'undefined')
    ) {
      if (this.hasZ && this.hasM) {
        dimensionType += 3000;
      } else if (this.hasZ) {
        dimensionType += 1000;
      } else if (this.hasM) {
        dimensionType += 2000;
      }
    } else {
      if (this.hasZ) {
        dimensionType |= 0x80000000;
      }
      if (this.hasM) {
        dimensionType |= 0x40000000;
      }
    }

    wkb.writeUInt32LE((dimensionType + geometryType) >>> 0);
  }

  static getTwkbPrecision(
    xyPrecision: number,
    zPrecision: number,
    mPrecision: number
  ): TwkbPrecision {
    return {
      xy: xyPrecision,
      z: zPrecision,
      m: mPrecision,
      xyFactor: Math.pow(10, xyPrecision),
      zFactor: Math.pow(10, zPrecision),
      mFactor: Math.pow(10, mPrecision),
    };
  }

  protected writeTwkbHeader(
    twkb: BinaryWriter,
    geometryType: number,
    precision: TwkbPrecision,
    isEmpty: boolean
  ): void {
    const type = (ZigZag.encode(precision.xy) << 4) + geometryType;
    let metadataHeader = (this.hasZ || this.hasM ? 1 : 0) << 3;
    metadataHeader += isEmpty ? 1 << 4 : 0;

    twkb.writeUInt8(type);
    twkb.writeUInt8(metadataHeader);

    if (this.hasZ || this.hasM) {
      let extendedPrecision = 0;
      if (this.hasZ) {
        extendedPrecision |= 0x1;
      }
      if (this.hasM) {
        extendedPrecision |= 0x2;
      }

      // Add Z and M precision information
      if (this.hasZ) {
        extendedPrecision |= ZigZag.encode(precision.z) << 2;
      }
      if (this.hasM) {
        extendedPrecision |= ZigZag.encode(precision.m) << 5;
      }

      twkb.writeUInt8(extendedPrecision);
    }
  }

  toGeoJSON(): GeoJSONGeometry {
    throw new Error('Method not implemented.');
  }

  // Methods to be implemented by subclasses
  toWkt(): string {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toWkb(_parentOptions?: GeometryOptions): Buffer {
    throw new Error('Method not implemented.');
  }

  toTwkb(): Buffer {
    throw new Error('Method not implemented.');
  }

  getWkbSize(): number {
    throw new Error('Method not implemented.');
  }
}
