import { Geometry } from './geometry';
import { Coordinates, GeometryOptions } from './types';
import { GEOMETRY_TYPES } from './constants';
import { Point } from './point';
import { BinaryWriter } from './binarywriter';
import { LineString as GeoJSONLineString } from 'geojson';

export class LineString extends Geometry {
  points: Point[];

  constructor(points?: Point[], srid?: number) {
    super();

    this.points = points || [];
    this.srid = srid;

    if (this.points.length > 0) {
      this.hasZ = this.points[0].hasZ;
      this.hasM = this.points[0].hasM;
    }
  }

  static Z(points?: Point[], srid?: number): LineString {
    const lineString = new LineString(points, srid);
    lineString.hasZ = true;
    return lineString;
  }

  static M(points?: Point[], srid?: number): LineString {
    const lineString = new LineString(points, srid);
    lineString.hasM = true;
    return lineString;
  }

  static ZM(points?: Point[], srid?: number): LineString {
    const lineString = new LineString(points, srid);
    lineString.hasZ = true;
    lineString.hasM = true;
    return lineString;
  }

  toWkt(isNested: boolean = false): string {
    if (isNested) return this.toInnerWkt();

    if (this.points.length === 0) {
      return this.getWktType(GEOMETRY_TYPES.LineString.wkt, true);
    }

    return this.getWktType(GEOMETRY_TYPES.LineString.wkt, false) + this.toInnerWkt();
  }

  private toInnerWkt(): string {
    let innerWkt = '(';

    for (const point of this.points) {
      innerWkt += point.toWkt(true) + ',';
    }

    innerWkt = innerWkt.slice(0, -1);
    innerWkt += ')';

    return innerWkt;
  }

  toWkb(parentOptions?: GeometryOptions): Buffer {
    const wkb = new BinaryWriter(this.getWkbSize());

    wkb.writeInt8(1);
    this.writeWkbType(wkb, GEOMETRY_TYPES.LineString.wkb, parentOptions);
    wkb.writeUInt32LE(this.points.length);

    for (const p of this.points) {
      wkb.writeBuffer(p.toWkb(parentOptions, true));
    }

    return wkb.buffer;
  }

  toTwkb(previousPoint: Point = new Point(0, 0, 0, 0), isNested: boolean = false): Buffer {
    const twkb = new BinaryWriter(0, true);

    const precision = Geometry.getTwkbPrecision(5, 0, 0);
    const isEmpty = this.points.length === 0;

    if (!isNested) {
      this.writeTwkbHeader(twkb, GEOMETRY_TYPES.LineString.wkb, precision, isEmpty);
    }

    if (this.points.length > 0) {
      twkb.writeVarInt(this.points.length);

      for (const p of this.points) {
        twkb.writeBuffer(p.toTwkb(previousPoint, true));
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

    return 1 + 4 + 4 + this.points.length * coordinateSize;
  }

  toGeoJSON(): GeoJSONLineString;
  toGeoJSON(isNested: true): Coordinates<GeoJSONLineString>;
  toGeoJSON(isNested: boolean = false): GeoJSONLineString | Coordinates<GeoJSONLineString> {
    const coordinates: Coordinates<GeoJSONLineString> = [];
    for (const p of this.points) {
      coordinates.push(p.toGeoJSON(true));
    }

    if (isNested) return coordinates;

    return {
      type: GEOMETRY_TYPES.LineString.geoJSON,
      coordinates,
    };
  }
}
