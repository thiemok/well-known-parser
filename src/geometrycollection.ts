import { Geometry } from './geometry';
import type { GeometryOptions } from './types';
import { GEOMETRY_TYPES } from './constants';
import { BinaryWriter } from './binarywriter';
import type { GeometryCollection as GeoJSONGeometryCollection } from 'geojson';

export class GeometryCollection extends Geometry {
  geometries: Geometry[];

  constructor(geometries?: Geometry[], srid?: number) {
    super();

    this.geometries = geometries || [];
    this.srid = srid;

    if (this.geometries.length > 0) {
      this.hasZ = this.geometries[0].hasZ;
      this.hasM = this.geometries[0].hasM;
    }
  }

  static Z(geometries?: Geometry[], srid?: number): GeometryCollection {
    const geometryCollection = new GeometryCollection(geometries, srid);
    geometryCollection.hasZ = true;
    return geometryCollection;
  }

  static M(geometries?: Geometry[], srid?: number): GeometryCollection {
    const geometryCollection = new GeometryCollection(geometries, srid);
    geometryCollection.hasM = true;
    return geometryCollection;
  }

  static ZM(geometries?: Geometry[], srid?: number): GeometryCollection {
    const geometryCollection = new GeometryCollection(geometries, srid);
    geometryCollection.hasZ = true;
    geometryCollection.hasM = true;
    return geometryCollection;
  }

  toWkt(): string {
    if (this.geometries.length === 0) {
      return this.getWktType(GEOMETRY_TYPES.GeometryCollection.wkt, true);
    }

    let wkt = this.getWktType(GEOMETRY_TYPES.GeometryCollection.wkt, false) + '(';

    for (let i = 0; i < this.geometries.length; i++) {
      wkt += this.geometries[i].toWkt() + ',';
    }

    wkt = wkt.slice(0, -1);
    wkt += ')';

    return wkt;
  }

  toWkb(parentOptions?: GeometryOptions): Buffer {
    const wkb = new BinaryWriter(this.getWkbSize());

    wkb.writeInt8(1);
    this.writeWkbType(wkb, GEOMETRY_TYPES.GeometryCollection.wkb, parentOptions);
    wkb.writeUInt32LE(this.geometries.length);

    for (let i = 0; i < this.geometries.length; i++) {
      const childOptions = { srid: this.srid };
      wkb.writeBuffer(this.geometries[i].toWkb(childOptions));
    }

    return wkb.buffer;
  }

  toTwkb(): Buffer {
    const twkb = new BinaryWriter(0, true);

    const precision = Geometry.getTwkbPrecision(5, 0, 0);
    const isEmpty = this.geometries.length === 0;

    this.writeTwkbHeader(twkb, GEOMETRY_TYPES.GeometryCollection.wkb, precision, isEmpty);

    if (this.geometries.length > 0) {
      twkb.writeVarInt(this.geometries.length);

      for (let i = 0; i < this.geometries.length; i++) {
        twkb.writeBuffer(this.geometries[i].toTwkb());
      }
    }

    return twkb.buffer;
  }

  getWkbSize(): number {
    let size = 1 + 4 + 4;

    for (let i = 0; i < this.geometries.length; i++) {
      size += this.geometries[i].getWkbSize();
    }

    return size;
  }

  toGeoJSON(): GeoJSONGeometryCollection {
    const geometries: GeoJSONGeometryCollection['geometries'] = [];

    for (const geometry of this.geometries) {
      geometries.push(geometry.toGeoJSON());
    }

    return {
      type: GEOMETRY_TYPES.GeometryCollection.geoJSON,
      geometries,
    };
  }
}
