import { Geometry } from './geometry';
import type { Coordinates, GeometryOptions } from './types';
import { GEOMETRY_TYPES } from './constants';
import { Point } from './point';
import { BinaryWriter } from './binarywriter';
import type { Polygon as GeoJSONPolygon } from 'geojson';

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

  toWkt(isNested: boolean = false): string {
    if (isNested) return this.toInnerWkt();

    if (this.exteriorRing.length === 0) {
      return this.getWktType(GEOMETRY_TYPES.Polygon.wkt, true);
    }

    return this.getWktType(GEOMETRY_TYPES.Polygon.wkt, false) + this.toInnerWkt();
  }

  private toInnerWkt(): string {
    let innerWkt = '((';

    for (const point of this.exteriorRing) {
      innerWkt += point.toWkt(true) + ',';
    }

    innerWkt = innerWkt.slice(0, -1);
    innerWkt += ')';

    for (const ring of this.interiorRings) {
      innerWkt += ',(';

      for (const point of ring) {
        innerWkt += point.toWkt(true) + ',';
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
    this.writeWkbType(wkb, GEOMETRY_TYPES.Polygon.wkb, parentOptions);

    if (this.exteriorRing.length > 0) {
      wkb.writeUInt32LE(1 + this.interiorRings.length);
      wkb.writeUInt32LE(this.exteriorRing.length);
    } else {
      wkb.writeUInt32LE(0);
    }

    for (const p of this.exteriorRing) {
      wkb.writeBuffer(p.toWkb(parentOptions, true));
    }

    for (const ring of this.interiorRings) {
      wkb.writeUInt32LE(ring.length);
      for (const p of ring) {
        wkb.writeBuffer(p.toWkb(parentOptions, true));
      }
    }

    return wkb.buffer;
  }

  toTwkb(previousPoint: Point = new Point(0, 0, 0, 0), isNested: boolean = false): Buffer {
    const twkb = new BinaryWriter(0, true);

    const precision = Geometry.getTwkbPrecision(5, 0, 0);
    const isEmpty = this.exteriorRing.length === 0;

    if (!isNested) {
      this.writeTwkbHeader(twkb, GEOMETRY_TYPES.Polygon.wkb, precision, isEmpty);
    }

    if (this.exteriorRing.length > 0) {
      twkb.writeVarInt(1 + this.interiorRings.length);
      twkb.writeVarInt(this.exteriorRing.length);

      for (const p of this.exteriorRing) {
        twkb.writeBuffer(p.toTwkb(previousPoint, true));
      }

      for (const ring of this.interiorRings) {
        twkb.writeVarInt(ring.length);
        for (const p of ring) {
          twkb.writeBuffer(p.toTwkb(previousPoint, true));
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
      size += 4 + this.exteriorRing.length * coordinateSize;
    }

    for (let i = 0; i < this.interiorRings.length; i++) {
      size += 4 + this.interiorRings[i].length * coordinateSize;
    }

    return size;
  }

  toGeoJSON(): GeoJSONPolygon;
  toGeoJSON(isNested: true): Coordinates<GeoJSONPolygon>;
  toGeoJSON(isNested: boolean = false): GeoJSONPolygon | Coordinates<GeoJSONPolygon> {
    const coordinates: Coordinates<GeoJSONPolygon> = [];

    if (this.exteriorRing.length > 0) {
      const exteriorRing: number[][] = [];

      for (const point of this.exteriorRing) {
        exteriorRing.push(point.toGeoJSON(true));
      }

      coordinates.push(exteriorRing);
    }

    for (const ring of this.interiorRings) {
      const interiorRing: number[][] = [];

      for (const point of ring) {
        interiorRing.push(point.toGeoJSON(true));
      }
      coordinates.push(interiorRing);
    }

    if (isNested) return coordinates;

    return {
      type: GEOMETRY_TYPES.Polygon.geoJSON,
      coordinates,
    };
  }
}
