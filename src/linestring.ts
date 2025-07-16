import { Geometry } from './geometry';
import { GeometryOptions } from './types';
import { GEOMETRY_TYPES } from './constants';
import { Point } from './point';
import { BinaryWriter } from './binarywriter';

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

  toWkt(): string {
    if (this.points.length === 0) {
      return this.getWktType(GEOMETRY_TYPES.LineString.wkt, true);
    }

    return this.getWktType(GEOMETRY_TYPES.LineString.wkt, false) + this.toInnerWkt();
  }

  toInnerWkt(): string {
    let innerWkt = '(';

    for (let i = 0; i < this.points.length; i++) {
      innerWkt += this.getWktCoordinate(this.points[i]) + ',';
    }

    innerWkt = innerWkt.slice(0, -1);
    innerWkt += ')';

    return innerWkt;
  }

  toWkb(parentOptions?: GeometryOptions): Buffer {
    const wkb = new BinaryWriter(this.getWkbSize());

    wkb.writeInt8(1);
    this.writeWkbType(wkb, GEOMETRY_TYPES.LineString.wkb as number, parentOptions);
    wkb.writeUInt32LE(this.points.length);

    for (const p of this.points) {
        wkb.writeBuffer(p.toWkb(parentOptions));
    }

    return wkb.buffer;
  }

  toTwkb(): Buffer {
    const twkb = new BinaryWriter(0, true);

    const precision = Geometry.getTwkbPrecision(5, 0, 0);
    const isEmpty = this.points.length === 0;

    this.writeTwkbHeader(twkb, GEOMETRY_TYPES.LineString.wkb as number, precision, isEmpty);

    if (this.points.length > 0) {
      twkb.writeVarInt(this.points.length);

      const previousPoint = new Point(0, 0, 0, 0);
      for (const p of this.points) {
          twkb.writeBuffer(p.toTwkb(previousPoint));
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

    return 1 + 4 + 4 + (this.points.length * coordinateSize);
  }

  toGeoJSON(options?: any): any {
    const geoJSON = super.toGeoJSON(options);
    geoJSON.type = GEOMETRY_TYPES.LineString.geoJSON;
    geoJSON.coordinates = [];

    for (let i = 0; i < this.points.length; i++) {
      if (this.hasZ && this.points[i].z !== undefined) {
        geoJSON.coordinates.push([this.points[i].x, this.points[i].y, this.points[i].z]);
      } else {
        geoJSON.coordinates.push([this.points[i].x, this.points[i].y]);
      }
    }

    return geoJSON;
  }
}
