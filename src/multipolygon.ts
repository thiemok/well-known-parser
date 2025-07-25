import { Geometry } from './geometry';
import type { Coordinates, GeometryOptions } from './types';
import { GEOMETRY_TYPES } from './constants';
import { Point } from './point';
import type { Polygon } from './polygon';
import { BinaryWriter } from './binarywriter';
import type { MultiPolygon as GeoJSONMultiPolygon } from 'geojson';

export class MultiPolygon extends Geometry {
  polygons: Polygon[];

  constructor(polygons?: Polygon[], srid?: number) {
    super();

    this.polygons = polygons || [];
    this.srid = srid;

    if (this.polygons.length > 0) {
      this.hasZ = this.polygons[0].hasZ;
      this.hasM = this.polygons[0].hasM;
    }
  }

  static Z(polygons?: Polygon[], srid?: number): MultiPolygon {
    const multiPolygon = new MultiPolygon(polygons, srid);
    multiPolygon.hasZ = true;
    return multiPolygon;
  }

  static M(polygons?: Polygon[], srid?: number): MultiPolygon {
    const multiPolygon = new MultiPolygon(polygons, srid);
    multiPolygon.hasM = true;
    return multiPolygon;
  }

  static ZM(polygons?: Polygon[], srid?: number): MultiPolygon {
    const multiPolygon = new MultiPolygon(polygons, srid);
    multiPolygon.hasZ = true;
    multiPolygon.hasM = true;
    return multiPolygon;
  }

  toWkt(): string {
    if (this.polygons.length === 0) {
      return this.getWktType(GEOMETRY_TYPES.MultiPolygon.wkt, true);
    }

    let wkt = this.getWktType(GEOMETRY_TYPES.MultiPolygon.wkt, false) + '(';

    for (const polygon of this.polygons) {
      wkt += polygon.toWkt(true) + ',';
    }

    wkt = wkt.slice(0, -1);
    wkt += ')';

    return wkt;
  }

  toWkb(parentOptions?: GeometryOptions): Buffer {
    const wkb = new BinaryWriter(this.getWkbSize());

    wkb.writeInt8(1);
    this.writeWkbType(wkb, GEOMETRY_TYPES.MultiPolygon.wkb, parentOptions);
    wkb.writeUInt32LE(this.polygons.length);

    for (const polygon of this.polygons) {
      wkb.writeBuffer(polygon.toWkb({ srid: this.srid }));
    }

    return wkb.buffer;
  }

  toTwkb(): Buffer {
    const twkb = new BinaryWriter(0, true);

    const precision = Geometry.getTwkbPrecision(5, 0, 0);
    const isEmpty = this.polygons.length === 0;

    this.writeTwkbHeader(twkb, GEOMETRY_TYPES.MultiPolygon.wkb, precision, isEmpty);

    if (this.polygons.length > 0) {
      twkb.writeVarInt(this.polygons.length);

      const previousPoint = new Point(0, 0, 0, 0);
      for (const polygon of this.polygons) {
        twkb.writeBuffer(polygon.toTwkb(previousPoint, true));
      }
    }

    return twkb.buffer;
  }

  getWkbSize(): number {
    let size = 1 + 4 + 4;

    for (let i = 0; i < this.polygons.length; i++) {
      size += this.polygons[i].getWkbSize();
    }

    return size;
  }

  toGeoJSON(): GeoJSONMultiPolygon {
    const coordinates: Coordinates<GeoJSONMultiPolygon> = [];

    for (const polygon of this.polygons) {
      coordinates.push(polygon.toGeoJSON(true));
    }

    return {
      type: GEOMETRY_TYPES.MultiPolygon.geoJSON,
      coordinates,
    };
  }
}
