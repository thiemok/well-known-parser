import { BinaryReader } from '../binaryreader';
import { WktParser } from '../wktparser';
import { GeometryOptions } from '../types';
import { Point } from '../point';
import * as ZigZag from '../zigzag';

export function parsePointWkt(value: WktParser, options: GeometryOptions): Point {
  const point = new Point();
  point.srid = options.srid;
  point.hasZ = options.hasZ ?? false;
  point.hasM = options.hasM ?? false;

  if (value.isMatch(['EMPTY'])) {
    return point;
  }

  value.expectGroupStart();

  const coordinate = value.matchCoordinate({
    hasZ: point.hasZ,
    hasM: point.hasM,
  });

  point.x = coordinate.x;
  point.y = coordinate.y;
  point.z = coordinate.z;
  point.m = coordinate.m;

  value.expectGroupEnd();

  return point;
}

export function parsePointWkb(value: BinaryReader, options: GeometryOptions): Point {
  const x = value.readDouble();
  const y = value.readDouble();
  const z = options.hasZ ? value.readDouble() : undefined;
  const m = options.hasM ? value.readDouble() : undefined;

  return new Point(x, y, z, m, options.srid);
}

export function parsePointTwkb(value: BinaryReader, options: GeometryOptions): Point {
  if (options.isEmpty) {
    const p = new Point(undefined, undefined, undefined, undefined, options.srid);
    p.hasZ = options.hasZ ?? false;
    p.hasM = options.hasM ?? false;
    return p;
  }

  return parseRelativePointTwkb(
    value,
    options,
    new Point(0, 0, options.hasZ ? 0 : undefined, options.hasM ? 0 : undefined)
  );
}

/**
 * Parses a Twkb point relative to previous point.
 * Previous point is mutated while parsing to allow for continuous use of the same point instance during parsing.
 * @param value The reader to parse
 * @param options
 * @param previousPoint The previous point to start from, is modified during parsing
 */
export function parseRelativePointTwkb(
  value: BinaryReader,
  options: GeometryOptions,
  previousPoint: Point
): Point {
  const precisionFactor = options.precisionFactor ?? 1;
  const zPrecisionFactor = options.zPrecisionFactor ?? 1;
  const mPrecisionFactor = options.mPrecisionFactor ?? 1;

  previousPoint.x += ZigZag.decode(value.readVarInt()) / precisionFactor;
  previousPoint.y += ZigZag.decode(value.readVarInt()) / precisionFactor;

  if (options.hasZ) {
    previousPoint.z += ZigZag.decode(value.readVarInt()) / zPrecisionFactor;
  }
  if (options.hasM) {
    previousPoint.m += ZigZag.decode(value.readVarInt()) / mPrecisionFactor;
  }

  return new Point(
    previousPoint.x,
    previousPoint.y,
    previousPoint.z,
    previousPoint.m,
    options.srid
  );
}

export function parsePointGeoJSON(coordinates: number[]): Point {
  if (coordinates.length === 0) {
    return new Point(undefined, undefined, undefined, undefined);
  }

  if (coordinates.length > 2) {
    return new Point(coordinates[0], coordinates[1], coordinates[2], undefined);
  }

  return new Point(coordinates[0], coordinates[1], undefined, undefined);
}
