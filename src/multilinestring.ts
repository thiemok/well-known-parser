import { Geometry } from './geometry';
import { GeometryOptions } from './types';
import { GEOMETRY_TYPES } from './constants';
import { Point } from './point';
import { LineString } from './linestring';
import { BinaryWriter } from './binarywriter';

export class MultiLineString extends Geometry {
  lineStrings: LineString[];

  constructor(lineStrings?: LineString[], srid?: number) {
    super();

    this.lineStrings = lineStrings || [];
    this.srid = srid;

    if (this.lineStrings.length > 0) {
      this.hasZ = this.lineStrings[0].hasZ;
      this.hasM = this.lineStrings[0].hasM;
    }
  }

  static Z(lineStrings?: LineString[], srid?: number): MultiLineString {
    const multiLineString = new MultiLineString(lineStrings, srid);
    multiLineString.hasZ = true;
    return multiLineString;
  }

  static M(lineStrings?: LineString[], srid?: number): MultiLineString {
    const multiLineString = new MultiLineString(lineStrings, srid);
    multiLineString.hasM = true;
    return multiLineString;
  }

  static ZM(lineStrings?: LineString[], srid?: number): MultiLineString {
    const multiLineString = new MultiLineString(lineStrings, srid);
    multiLineString.hasZ = true;
    multiLineString.hasM = true;
    return multiLineString;
  }

  toWkt(): string {
    if (this.lineStrings.length === 0) {
      return this.getWktType(GEOMETRY_TYPES.MultiLineString.wkt, true);
    }

    let wkt = this.getWktType(GEOMETRY_TYPES.MultiLineString.wkt, false) + '(';

    for (let i = 0; i < this.lineStrings.length; i++) {
      wkt += this.lineStrings[i].toInnerWkt() + ',';
    }

    wkt = wkt.slice(0, -1);
    wkt += ')';

    return wkt;
  }

  toWkb(parentOptions?: GeometryOptions): Buffer {
    const wkb = new BinaryWriter(this.getWkbSize());

    wkb.writeInt8(1);
    this.writeWkbType(wkb, GEOMETRY_TYPES.MultiLineString.wkb as number, parentOptions);
    wkb.writeUInt32LE(this.lineStrings.length);

    for (let i = 0; i < this.lineStrings.length; i++) {
      wkb.writeBuffer(this.lineStrings[i].toWkb({ srid: this.srid }));
    }

    return wkb.buffer;
  }

  toTwkb(): Buffer {
    const twkb = new BinaryWriter(0, true);

    const precision = Geometry.getTwkbPrecision(5, 0, 0);
    const isEmpty = this.lineStrings.length === 0;

    this.writeTwkbHeader(twkb, GEOMETRY_TYPES.MultiLineString.wkb as number, precision, isEmpty);

    if (this.lineStrings.length > 0) {
      twkb.writeVarInt(this.lineStrings.length);

      const previousPoint = new Point(0, 0, 0, 0);
      for (const lineString of this.lineStrings) {
        twkb.writeVarInt(lineString.points.length);
        for (const p of lineString.points) {
            twkb.writeBuffer(p.toTwkb(previousPoint));
        }
      }
    }

    return twkb.buffer;
  }

  getWkbSize(): number {
    let size = 1 + 4 + 4;

    for (let i = 0; i < this.lineStrings.length; i++) {
      size += this.lineStrings[i].getWkbSize();
    }

    return size;
  }

  toGeoJSON(options?: any): any {
    const geoJSON = super.toGeoJSON(options);
    geoJSON.type = GEOMETRY_TYPES.MultiLineString.geoJSON;
    geoJSON.coordinates = [];

    for (let i = 0; i < this.lineStrings.length; i++) {
      geoJSON.coordinates.push(this.lineStrings[i].toGeoJSON().coordinates);
    }

    return geoJSON;
  }
}
