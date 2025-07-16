import { Geometry } from './geometry';
import { GeometryOptions } from './types';
import { GEOMETRY_TYPES } from './constants';
import { Point } from './point';
import { BinaryWriter } from './binarywriter';

export class MultiPoint extends Geometry {
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

  static Z(points?: Point[], srid?: number): MultiPoint {
    const multiPoint = new MultiPoint(points, srid);
    multiPoint.hasZ = true;
    return multiPoint;
  }

  static M(points?: Point[], srid?: number): MultiPoint {
    const multiPoint = new MultiPoint(points, srid);
    multiPoint.hasM = true;
    return multiPoint;
  }

  static ZM(points?: Point[], srid?: number): MultiPoint {
    const multiPoint = new MultiPoint(points, srid);
    multiPoint.hasZ = true;
    multiPoint.hasM = true;
    return multiPoint;
  }

  toWkt(): string {
    if (this.points.length === 0) {
      return this.getWktType(GEOMETRY_TYPES.MultiPoint.wkt, true);
    }

    let wkt = this.getWktType(GEOMETRY_TYPES.MultiPoint.wkt, false) + '(';

    for (let i = 0; i < this.points.length; i++) {
      wkt += this.getWktCoordinate(this.points[i]) + ',';
    }

    wkt = wkt.slice(0, -1);
    wkt += ')';

    return wkt;
  }

  toWkb(parentOptions?: GeometryOptions): Buffer {
    const wkb = new BinaryWriter(this.getWkbSize());

    wkb.writeInt8(1);
    this.writeWkbType(wkb, GEOMETRY_TYPES.MultiPoint.wkb as number, parentOptions);
    wkb.writeUInt32LE(this.points.length);

    for (let i = 0; i < this.points.length; i++) {
      wkb.writeBuffer(this.points[i].toWkb({ srid: this.srid }));
    }

    return wkb.buffer;
  }

  toTwkb(): Buffer {
    const twkb = new BinaryWriter(0, true);

    const precision = Geometry.getTwkbPrecision(5, 0, 0);
    const isEmpty = this.points.length === 0;

    this.writeTwkbHeader(twkb, GEOMETRY_TYPES.MultiPoint.wkb as number, precision, isEmpty);

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

    coordinateSize += 5;

    return 1 + 4 + 4 + (this.points.length * coordinateSize);
  }

  toGeoJSON(options?: any): any {
    const geoJSON = super.toGeoJSON(options);
    geoJSON.type = GEOMETRY_TYPES.MultiPoint.geoJSON;
    geoJSON.coordinates = [];

    for (let i = 0; i < this.points.length; i++) {
      geoJSON.coordinates.push(this.points[i].toGeoJSON().coordinates);
    }

    return geoJSON;
  }
}
