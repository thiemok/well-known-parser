import { BinaryReader } from '../binaryreader';
import { WktParser } from '../wktparser';
import { GeometryOptions } from '../types';
import { MultiPoint } from '../multipoint';
import { Point } from '../point';
import { parsePointGeoJSON, parseRelativePointTwkb } from './point';
import { parseWkb } from './index';
import { MultiPoint as GeoJSONMultiPoint } from 'geojson';

export function parseMultiPointWkt(value: WktParser, options: GeometryOptions): MultiPoint {
  const multiPoint = new MultiPoint();
  multiPoint.srid = options.srid;
  multiPoint.hasZ = options.hasZ ?? false;
  multiPoint.hasM = options.hasM ?? false;

  if (value.isMatch(['EMPTY'])) {
    return multiPoint;
  }

  value.expectGroupStart();
  const coordinates = value.matchCoordinates(options);
  for (const coord of coordinates) {
    multiPoint.points.push(coord);
  }
  value.expectGroupEnd();

  return multiPoint;
}

export function parseMultiPointWkb(value: BinaryReader, options: GeometryOptions): MultiPoint {
  const multiPoint = new MultiPoint();
  multiPoint.srid = options.srid;
  multiPoint.hasZ = options.hasZ ?? false;
  multiPoint.hasM = options.hasM ?? false;

  const pointCount = value.readUInt32();

  for (let i = 0; i < pointCount; i++) {
    // This can only return a Point, but we need to call parseWkb in order to make sure wkb headers are read
    multiPoint.points.push(parseWkb(value, options) as Point);
  }

  return multiPoint;
}

export function parseMultiPointTwkb(value: BinaryReader, options: GeometryOptions): MultiPoint {
  const multiPoint = new MultiPoint();
  multiPoint.hasZ = options.hasZ ?? false;
  multiPoint.hasM = options.hasM ?? false;

  if (options.isEmpty) {
    return multiPoint;
  }

  const previousPoint = new Point(0, 0, options.hasZ ? 0 : undefined, options.hasM ? 0 : undefined);

  const pointCount = value.readVarInt();

  for (let i = 0; i < pointCount; i++) {
    multiPoint.points.push(parseRelativePointTwkb(value, options, previousPoint));
  }

  return multiPoint;
}

export function parseMultiPointGeoJSON(value: Pick<GeoJSONMultiPoint, 'coordinates'>): MultiPoint {
  const multiPoint = new MultiPoint();

  if (value.coordinates.length > 0) {
    multiPoint.hasZ = value.coordinates[0].length > 2;
  }

  for (const point of value.coordinates) {
    multiPoint.points.push(parsePointGeoJSON(point));
  }

  return multiPoint;
}
