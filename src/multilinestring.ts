import { Geometry } from './geometry';
import { Coordinates, GeometryOptions } from './types';
import { GEOMETRY_TYPES } from './constants';
import { Point } from './point';
import { LineString } from './linestring';
import { BinaryWriter } from './binarywriter';
import { MultiLineString as GeoJSONMultiLineString } from 'geojson';

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
      wkt += this.lineStrings[i].toWkt(true) + ',';
    }

    wkt = wkt.slice(0, -1);
    wkt += ')';

    return wkt;
  }

  toWkb(parentOptions?: GeometryOptions): Buffer {
    const wkb = new BinaryWriter(this.getWkbSize());

    wkb.writeInt8(1);
    this.writeWkbType(wkb, GEOMETRY_TYPES.MultiLineString.wkb, parentOptions);
    wkb.writeUInt32LE(this.lineStrings.length);

    for (const lineString of this.lineStrings) {
      wkb.writeBuffer(lineString.toWkb({ srid: this.srid }));
    }

    return wkb.buffer;
  }

  toTwkb(): Buffer {
    const twkb = new BinaryWriter(0, true);

    const precision = Geometry.getTwkbPrecision(5, 0, 0);
    const isEmpty = this.lineStrings.length === 0;

    this.writeTwkbHeader(twkb, GEOMETRY_TYPES.MultiLineString.wkb, precision, isEmpty);

    if (this.lineStrings.length > 0) {
      twkb.writeVarInt(this.lineStrings.length);

      const previousPoint = new Point(0, 0, 0, 0);
      for (const lineString of this.lineStrings) {
        twkb.writeBuffer(lineString.toTwkb(previousPoint, true));
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

  toGeoJSON(): GeoJSONMultiLineString {
    const coordinates: Coordinates<GeoJSONMultiLineString> = [];

    for (const lineString of this.lineStrings) {
      coordinates.push(lineString.toGeoJSON(true));
    }

    return {
      type: GEOMETRY_TYPES.MultiLineString.geoJSON,
      coordinates,
    };
  }
}
