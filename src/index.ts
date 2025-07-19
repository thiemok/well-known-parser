import { GEOMETRY_TYPES } from './constants';
import { Geometry } from './geometry';
import { Point } from './point';
import { LineString } from './linestring';
import { Polygon } from './polygon';
import { MultiPoint } from './multipoint';
import { MultiLineString } from './multilinestring';
import { MultiPolygon } from './multipolygon';
import { GeometryCollection } from './geometrycollection';
import { parse, parseGeoJSON, parseTwkb } from './parsers';

export type { GeometryOptions, TwkbPrecision, GeoJSONGeometry } from './types';

export {
  GEOMETRY_TYPES as Types,
  parse,
  parseTwkb,
  parseGeoJSON,
  Geometry,
  Point,
  LineString,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon,
  GeometryCollection,
};
