import type { BinaryReader } from '../binaryreader';
import type { WktParser } from '../wktparser';
import type { GeometryOptions } from '../types';
import { LineString } from '../linestring';
import { Point } from '../point';
import { parsePointGeoJSON, parsePointWkb, parseRelativePointTwkb } from './point';
import type { LineString as GeoJSONLineString } from 'geojson';

export function parseLineStringWkt(value: WktParser, options: GeometryOptions): LineString {
  const lineString = new LineString();
  lineString.srid = options.srid;
  lineString.hasZ = options.hasZ ?? false;
  lineString.hasM = options.hasM ?? false;

  if (value.isMatch(['EMPTY'])) {
    return lineString;
  }

  value.expectGroupStart();
  const coordinates = value.matchCoordinates(options);
  for (const coord of coordinates) {
    lineString.points.push(coord);
  }
  value.expectGroupEnd();

  return lineString;
}

export function parseLineStringWkb(value: BinaryReader, options: GeometryOptions): LineString {
  const lineString = new LineString();
  lineString.srid = options.srid;
  lineString.hasZ = options.hasZ ?? false;
  lineString.hasM = options.hasM ?? false;

  const pointCount = value.readUInt32();
  const childOptions: GeometryOptions = {
    ...options,
    srid: undefined,
  };

  for (let i = 0; i < pointCount; i++) {
    lineString.points.push(parsePointWkb(value, childOptions));
  }

  return lineString;
}

export function parseLineStringTwkb(value: BinaryReader, options: GeometryOptions): LineString {
  const lineString = new LineString();
  lineString.hasZ = options.hasZ ?? false;
  lineString.hasM = options.hasM ?? false;

  if (options.isEmpty) {
    return lineString;
  }

  const previousPoint = new Point(0, 0, options.hasZ ? 0 : undefined, options.hasM ? 0 : undefined);

  const pointCount = value.readVarInt();

  for (let i = 0; i < pointCount; i++) {
    lineString.points.push(parseRelativePointTwkb(value, options, previousPoint));
  }

  return lineString;
}

export function parseLineStringGeoJSON(value: Pick<GeoJSONLineString, 'coordinates'>): LineString {
  const lineString = new LineString();

  if (value.coordinates.length > 0) {
    lineString.hasZ = value.coordinates[0].length > 2;
  }

  for (const point of value.coordinates) {
    lineString.points.push(parsePointGeoJSON(point));
  }

  return lineString;
}
