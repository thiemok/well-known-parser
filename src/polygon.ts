import { Geometry } from './geometry';
import { GeometryOptions } from './types';
import { GEOMETRY_TYPES } from './constants';
import { Point } from './point';
import { BinaryWriter } from './binarywriter';

export class Polygon extends Geometry {
  exteriorRing: Point[];
  interiorRings: Point[][];

  constructor(exteriorRing?: Point[], interiorRings?: Point[][], srid?: number) {
    super();

    this.exteriorRing = exteriorRing || [];
    this.interiorRings = interiorRings || [];
    this.srid = srid;

    if (this.exteriorRing.length > 0) {
      this.hasZ = this.exteriorRing[0].hasZ;
      this.hasM = this.exteriorRing[0].hasM;
    }
  }

  static Z(exteriorRing?: Point[], interiorRings?: Point[][], srid?: number): Polygon {
    const polygon = new Polygon(exteriorRing, interiorRings, srid);
    polygon.hasZ = true;
    return polygon;
  }

  static M(exteriorRing?: Point[], interiorRings?: Point[][], srid?: number): Polygon {
    const polygon = new Polygon(exteriorRing, interiorRings, srid);
    polygon.hasM = true;
    return polygon;
  }

  static ZM(exteriorRing?: Point[], interiorRings?: Point[][], srid?: number): Polygon {
    const polygon = new Polygon(exteriorRing, interiorRings, srid);
    polygon.hasZ = true;
    polygon.hasM = true;
    return polygon;
  }

  toWkt(): string {
    if (this.exteriorRing.length === 0) {
      return this.getWktType(GEOMETRY_TYPES.Polygon.wkt, true);
    }

    return this.getWktType(GEOMETRY_TYPES.Polygon.wkt, false) + this.toInnerWkt();
  }

  toInnerWkt(): string {
    let innerWkt = '((';

    for (let i = 0; i < this.exteriorRing.length; i++) {
      innerWkt += this.getWktCoordinate(this.exteriorRing[i]) + ',';
    }

    innerWkt = innerWkt.slice(0, -1);
    innerWkt += ')';

    for (let i = 0; i < this.interiorRings.length; i++) {
      innerWkt += ',(';

      for (let j = 0; j < this.interiorRings[i].length; j++) {
        innerWkt += this.getWktCoordinate(this.interiorRings[i][j]) + ',';
      }

      innerWkt = innerWkt.slice(0, -1);
      innerWkt += ')';
    }

    innerWkt += ')';

    return innerWkt;
  }

  toWkb(parentOptions?: GeometryOptions): Buffer {
    const wkb = new BinaryWriter(this.getWkbSize());

    wkb.writeInt8(1);
    this.writeWkbType(wkb, GEOMETRY_TYPES.Polygon.wkb as number, parentOptions);

    if (this.exteriorRing.length > 0) {
      wkb.writeUInt32LE(1 + this.interiorRings.length);
      wkb.writeUInt32LE(this.exteriorRing.length);
    } else {
      wkb.writeUInt32LE(0);
    }

    for (const p of this.exteriorRing) {
        wkb.writeBuffer(p.toWkb(parentOptions));
    }

    for (const ring of this.interiorRings) {
        wkb.writeUInt32LE(ring.length);
        for (const p of ring) {
            wkb.writeBuffer(p.toWkb(parentOptions));
        }
    }

    return wkb.buffer;
  }

  toTwkb(previousPoint: Point = new Point(0, 0, 0, 0)): Buffer {
    const twkb = new BinaryWriter(0, true);

    const precision = Geometry.getTwkbPrecision(5, 0, 0);
    const isEmpty = this.exteriorRing.length === 0;

    this.writeTwkbHeader(twkb, GEOMETRY_TYPES.Polygon.wkb as number, precision, isEmpty);

    if (this.exteriorRing.length > 0) {
      twkb.writeVarInt(1 + this.interiorRings.length);
      twkb.writeVarInt(this.exteriorRing.length);

      for (const p of this.exteriorRing) {
          twkb.writeBuffer(p.toTwkb(previousPoint));
      }

      for (const ring of this.interiorRings) {
        twkb.writeVarInt(ring.length);
        for (const p of ring) {
            twkb.writeBuffer(p.toTwkb(previousPoint));
        }
      }
    }

    return twkb.buffer;
  }

  getWkbSize(): number {
    let coordinateSize = 16;

    if (this.hasZ) {
      coordinateSize += 8;
    }
    if (this.hasM) {
      coordinateSize += 8;
    }

    let size = 1 + 4 + 4;

    if (this.exteriorRing.length > 0) {
      size += 4 + (this.exteriorRing.length * coordinateSize);
    }

    for (let i = 0; i < this.interiorRings.length; i++) {
      size += 4 + (this.interiorRings[i].length * coordinateSize);
    }

    return size;
  }

  toGeoJSON(options?: any): any {
    const geoJSON = super.toGeoJSON(options);
    geoJSON.type = GEOMETRY_TYPES.Polygon.geoJSON;
    geoJSON.coordinates = [];

    if (this.exteriorRing.length > 0) {
      const exteriorRing: number[][] = [];

      for (let i = 0; i < this.exteriorRing.length; i++) {
        if (this.hasZ && this.exteriorRing[i].z !== undefined) {
          exteriorRing.push([this.exteriorRing[i].x, this.exteriorRing[i].y, this.exteriorRing[i].z]);
        } else {
          exteriorRing.push([this.exteriorRing[i].x, this.exteriorRing[i].y]);
        }
      }

      geoJSON.coordinates.push(exteriorRing);
    }

    for (let j = 0; j < this.interiorRings.length; j++) {
      const interiorRing: number[][] = [];

      for (let k = 0; k < this.interiorRings[j].length; k++) {
        if (this.hasZ && this.interiorRings[j][k].z !== undefined) {
          interiorRing.push([this.interiorRings[j][k].x, this.interiorRings[j][k].y, this.interiorRings[j][k].z]);
        } else {
          interiorRing.push([this.interiorRings[j][k].x, this.interiorRings[j][k].y]);
        }
      }

      geoJSON.coordinates.push(interiorRing);
    }

    return geoJSON;
  }
}
