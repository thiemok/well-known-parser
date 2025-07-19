import { BinaryReader } from '../binaryreader';
import { WktParser } from '../wktparser';
import { GeometryOptions } from '../types';
import { MultiLineString } from '../multilinestring';
import { LineString } from '../linestring';
import { Point } from '../point';
import { parseLineStringGeoJSON } from './linestring';
import { parseRelativePointTwkb } from './point';
import { parseWkb } from './index';
import { MultiLineString as GeoJSONMultiLineString } from 'geojson';

export function parseMultiLineStringWkt(
  value: WktParser,
  options: GeometryOptions
): MultiLineString {
  const multiLineString = new MultiLineString();
  multiLineString.srid = options.srid;
  multiLineString.hasZ = options.hasZ ?? false;
  multiLineString.hasM = options.hasM ?? false;

  if (value.isMatch(['EMPTY'])) {
    return multiLineString;
  }

  value.expectGroupStart();

  do {
    value.expectGroupStart();
    const coordinates = value.matchCoordinates(options);
    multiLineString.lineStrings.push(new LineString(coordinates));
    value.expectGroupEnd();
  } while (value.isMatch([',']));

  value.expectGroupEnd();

  return multiLineString;
}

export function parseMultiLineStringWkb(
  value: BinaryReader,
  options: GeometryOptions
): MultiLineString {
  const multiLineString = new MultiLineString();
  multiLineString.srid = options.srid;
  multiLineString.hasZ = options.hasZ ?? false;
  multiLineString.hasM = options.hasM ?? false;

  const lineStringCount = value.readUInt32();

  for (let i = 0; i < lineStringCount; i++) {
    // This can only return a LineString, but we need to call parseWkb in order to make sure wkb headers are read
    multiLineString.lineStrings.push(parseWkb(value, options) as LineString);
  }

  return multiLineString;
}

export function parseMultiLineStringTwkb(
  value: BinaryReader,
  options: GeometryOptions
): MultiLineString {
  const multiLineString = new MultiLineString();
  multiLineString.hasZ = options.hasZ ?? false;
  multiLineString.hasM = options.hasM ?? false;

  if (options.isEmpty) {
    return multiLineString;
  }

  const previousPoint = new Point(0, 0, options.hasZ ? 0 : undefined, options.hasM ? 0 : undefined);

  const lineStringCount = value.readVarInt();

  for (let i = 0; i < lineStringCount; i++) {
    const lineString = new LineString();
    lineString.hasZ = options.hasZ ?? false;
    lineString.hasM = options.hasM ?? false;

    const pointCount = value.readVarInt();

    for (let j = 0; j < pointCount; j++) {
      lineString.points.push(parseRelativePointTwkb(value, options, previousPoint));
    }

    multiLineString.lineStrings.push(lineString);
  }

  return multiLineString;
}

export function parseMultiLineStringGeoJSON(
  value: Pick<GeoJSONMultiLineString, 'coordinates'>
): MultiLineString {
  const multiLineString = new MultiLineString();

  if (value.coordinates.length > 0 && value.coordinates[0].length > 0) {
    multiLineString.hasZ = value.coordinates[0][0].length > 2;
  }

  for (let i = 0; i < value.coordinates.length; i++) {
    multiLineString.lineStrings.push(parseLineStringGeoJSON({ coordinates: value.coordinates[i] }));
  }

  return multiLineString;
}
