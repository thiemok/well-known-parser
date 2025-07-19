import {
  GeometryCollection as GeoJSONGeometryCollection,
  LineString as GeoJSONLineString,
  MultiLineString as GeoJSONMultiLineString,
  MultiPoint as GeoJSONMultiPoint,
  MultiPolygon as GeoJSONMultiPolygon,
  Point as GeoJSONPoint,
  Polygon as GeoJSONPolygon,
} from 'geojson';

export interface GeometryOptions {
  srid?: number;
  hasZ?: boolean;
  hasM?: boolean;
  hasSrid?: boolean;
  isEwkb?: boolean;
  isEmpty?: boolean;
  // TWKB specific options
  precision?: number;
  precisionFactor?: number;
  hasBoundingBox?: boolean;
  hasSizeAttribute?: boolean;
  hasIdList?: boolean;
  hasExtendedPrecision?: boolean;
  zPrecision?: number;
  zPrecisionFactor?: number;
  mPrecision?: number;
  mPrecisionFactor?: number;
}

export interface TwkbPrecision {
  xy: number;
  z: number;
  m: number;
  xyFactor: number;
  zFactor: number;
  mFactor: number;
}

export type GeoJSONGeometry =
  | GeoJSONPoint
  | GeoJSONMultiPoint
  | GeoJSONLineString
  | GeoJSONMultiLineString
  | GeoJSONPolygon
  | GeoJSONMultiPolygon
  | GeoJSONGeometryCollection;

export type Coordinates<T extends Exclude<GeoJSONGeometry, GeoJSONGeometryCollection>> =
  T['coordinates'];
