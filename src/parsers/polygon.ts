import { BinaryReader } from '../binaryreader';
import { WktParser } from '../wktparser';
import { GeometryOptions } from '../types';
import { Polygon } from '../polygon';
import { Point } from '../point';
import { parsePointGeoJSON, parsePointWkb, parseRelativePointTwkb } from './point';

export function parsePolygonWkt(value: WktParser, options: GeometryOptions): Polygon {
  const polygon = new Polygon();
  polygon.srid = options.srid;
  polygon.hasZ = options.hasZ ?? false;
  polygon.hasM = options.hasM ?? false;

  if (value.isMatch(['EMPTY'])) {
    return polygon;
  }

  value.expectGroupStart();

  value.expectGroupStart();
  const exteriorCoords = value.matchCoordinates(options);
  for (const coord of exteriorCoords) {
    polygon.exteriorRing.push(coord);
  }
  value.expectGroupEnd();

  while (value.isMatch([','])) {
    value.expectGroupStart();
    const interiorCoords = value.matchCoordinates(options);
    const ring = [];
    for (const coord of interiorCoords) {
      ring.push(coord);
    }
    polygon.interiorRings.push(ring);
    value.expectGroupEnd();
  }

  value.expectGroupEnd();

  return polygon;
}

export function parsePolygonWkb(value: BinaryReader, options: GeometryOptions): Polygon {
  const polygon = new Polygon();
  polygon.srid = options.srid;
  polygon.hasZ = options.hasZ ?? false;
  polygon.hasM = options.hasM ?? false;

  const ringCount = value.readUInt32();
  const childOptions: GeometryOptions = {
    ...options,
    srid: undefined,
  };

  if (ringCount > 0) {
    const exteriorRingCount = value.readUInt32();

    for (let i = 0; i < exteriorRingCount; i++) {
      polygon.exteriorRing.push(parsePointWkb(value, childOptions));
    }

    for (let i = 1; i < ringCount; i++) {
      const interiorRing: Point[] = [];
      const interiorRingCount = value.readUInt32();

      for (let j = 0; j < interiorRingCount; j++) {
        interiorRing.push(parsePointWkb(value, childOptions));
      }

      polygon.interiorRings.push(interiorRing);
    }
  }

  return polygon;
}

export function parsePolygonTwkb(value: BinaryReader, options: GeometryOptions): Polygon {
  const polygon = new Polygon();
  polygon.hasZ = options.hasZ ?? false;
  polygon.hasM = options.hasM ?? false;

  if (options.isEmpty) {
    return polygon;
  }

  const previousPoint = new Point(0, 0, options.hasZ ? 0 : undefined, options.hasM ? 0 : undefined);

  const ringCount = value.readVarInt();
  const exteriorRingCount = value.readVarInt();

  for (let i = 0; i < exteriorRingCount; i++) {
    polygon.exteriorRing.push(parseRelativePointTwkb(value, options, previousPoint));
  }

  for (let i = 1; i < ringCount; i++) {
    const interiorRing: Point[] = [];
    const interiorRingCount = value.readVarInt();

    for (let j = 0; j < interiorRingCount; j++) {
      interiorRing.push(parseRelativePointTwkb(value, options, previousPoint));
    }

    polygon.interiorRings.push(interiorRing);
  }

  return polygon;
}

export function parsePolygonGeoJSON(value: any): Polygon {
  const polygon = new Polygon();

  if (value.coordinates.length > 0 && value.coordinates[0].length > 0) {
    polygon.hasZ = value.coordinates[0][0].length > 2;
  }

  for (let i = 0; i < value.coordinates.length; i++) {
    if (i > 0) {
      polygon.interiorRings.push([]);
    }

    for (let j = 0; j < value.coordinates[i].length; j++) {
      const pointData = parsePointGeoJSON(value.coordinates[i][j]);
      if (i === 0) {
        polygon.exteriorRing.push(pointData);
      } else {
        polygon.interiorRings[i - 1].push(pointData);
      }
    }
  }

  return polygon;
}
