import { Geometry } from './geometry';
import { GeometryOptions } from './types';
import { GEOMETRY_TYPES } from './constants';
import { BinaryWriter } from './binarywriter';
import * as ZigZag from './zigzag';

export class Point extends Geometry {
  x: number;
  y: number;
  z: number | undefined;
  m: number | undefined;

  constructor(x?: number, y?: number, z?: number, m?: number, srid?: number) {
    super();

    this.x = x;
    this.y = y;
    this.z = z;
    this.m = m;
    this.srid = srid;

    this.hasZ = typeof this.z !== 'undefined';
    this.hasM = typeof this.m !== 'undefined';
  }

  static Z(x: number, y: number, z: number, srid?: number): Point {
    const point = new Point(x, y, z, undefined, srid);
    point.hasZ = true;
    return point;
  }

  static M(x: number, y: number, m: number, srid?: number): Point {
    const point = new Point(x, y, undefined, m, srid);
    point.hasM = true;
    return point;
  }

  static ZM(x: number, y: number, z: number, m: number, srid?: number): Point {
    const point = new Point(x, y, z, m, srid);
    point.hasZ = true;
    point.hasM = true;
    return point;
  }

  toWkt(): string {
    if (
      typeof this.x === 'undefined' &&
      typeof this.y === 'undefined' &&
      typeof this.z === 'undefined' &&
      typeof this.m === 'undefined'
    ) {
      return this.getWktType(GEOMETRY_TYPES.Point.wkt, true);
    }

    return (
      this.getWktType(GEOMETRY_TYPES.Point.wkt, false) + '(' + this.getWktCoordinate(this) + ')'
    );
  }

  toWkb(parentOptions?: GeometryOptions, isNested: boolean = false): Buffer {
    const wkb = new BinaryWriter(this.getWkbSize(isNested));

    if (!isNested) {
      wkb.writeInt8(1);
      this.writeWkbType(wkb, GEOMETRY_TYPES.Point.wkb, parentOptions);
    }

    if (typeof this.x === 'undefined' && typeof this.y === 'undefined') {
      wkb.writeDoubleLE(NaN);
      wkb.writeDoubleLE(NaN);

      if (this.hasZ) {
        wkb.writeDoubleLE(NaN);
      }
      if (this.hasM) {
        wkb.writeDoubleLE(NaN);
      }
    } else {
      wkb.writeDoubleLE(this.x);
      wkb.writeDoubleLE(this.y);

      if (this.hasZ && this.z !== undefined) {
        wkb.writeDoubleLE(this.z);
      }
      if (this.hasM && this.m !== undefined) {
        wkb.writeDoubleLE(this.m);
      }
    }

    return wkb.buffer;
  }

  toTwkb(previousPoint?: Point, isNested: boolean = false): Buffer {
    const twkb = new BinaryWriter(0, true);

    const precision = Geometry.getTwkbPrecision(5, 0, 0);
    const isEmpty = typeof this.x === 'undefined' && typeof this.y === 'undefined';

    if (!isNested) {
      this.writeTwkbHeader(twkb, GEOMETRY_TYPES.Point.wkb as number, precision, isEmpty);
    }

    if (isEmpty) {
      return twkb.buffer;
    }

    const x = this.x * precision.xyFactor;
    const y = this.y * precision.xyFactor;

    // Use 0 as default value if z or m is undefined
    const z = this.hasZ ? (this.z ?? 0) * precision.zFactor : 0;
    const m = this.hasM ? (this.m ?? 0) * precision.mFactor : 0;

    // Write delta from previous point
    twkb.writeVarInt(ZigZag.encode(x - (previousPoint?.x ?? 0)));
    twkb.writeVarInt(ZigZag.encode(y - (previousPoint?.y ?? 0)));

    if (this.hasZ) {
      // Use 0 as default if z is undefined in previous point
      const prevZ = previousPoint?.z ?? 0;
      twkb.writeVarInt(ZigZag.encode(z - prevZ));
    }

    if (this.hasM) {
      // Use 0 as default if m is undefined in previous point
      const prevM = previousPoint?.m ?? 0;
      twkb.writeVarInt(ZigZag.encode(m - prevM));
    }

    if (previousPoint) {
      // Update the previous point with the current values
      previousPoint.x = x;
      previousPoint.y = y;

      if (this.hasZ) {
        previousPoint.z = z;
      }

      if (this.hasM) {
        previousPoint.m = m;
      }
    }

    return twkb.buffer;
  }

  getWkbSize(isNested: boolean = false): number {
    let size = 8 + 8;

    if (!isNested) {
      size += 1 + 4;
    }

    if (this.hasZ) {
      size += 8;
    }
    if (this.hasM) {
      size += 8;
    }

    return size;
  }

  toGeoJSON(options?: any): any {
    const geoJSON = super.toGeoJSON(options);
    geoJSON.type = GEOMETRY_TYPES.Point.geoJSON;

    if (typeof this.x === 'undefined' && typeof this.y === 'undefined') {
      geoJSON.coordinates = [];
    } else if (typeof this.z !== 'undefined') {
      geoJSON.coordinates = [this.x, this.y, this.z];
    } else {
      geoJSON.coordinates = [this.x, this.y];
    }

    return geoJSON;
  }
}
