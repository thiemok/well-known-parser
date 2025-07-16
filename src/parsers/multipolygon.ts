import { BinaryReader } from '../binaryreader';
import { WktParser } from '../wktparser';
import { GeometryOptions } from '../types';
import { MultiPolygon } from '../multipolygon';
import { Polygon } from '../polygon';
import { Point } from '../point';
import { parsePolygonGeoJSON } from './polygon';
import { parseRelativePointTwkb } from './point';
import { parseWkb } from './index';

export function parseMultiPolygonWkt(value: WktParser, options: GeometryOptions): MultiPolygon {
  const multiPolygon = new MultiPolygon();
  multiPolygon.srid = options.srid;
  multiPolygon.hasZ = options.hasZ ?? false;
  multiPolygon.hasM = options.hasM ?? false;

  if (value.isMatch(['EMPTY'])) {
    return multiPolygon;
  }

  value.expectGroupStart();

  do {
    value.expectGroupStart();

    const exteriorRing: Point[] = [];
    const interiorRings: Point[][] = [];

    value.expectGroupStart();
    const exteriorCoords = value.matchCoordinates(options);
    for (const coord of exteriorCoords) {
      exteriorRing.push(coord);
    }
    value.expectGroupEnd();

    while (value.isMatch([','])) {
      value.expectGroupStart();
      const interiorCoords = value.matchCoordinates(options);
      const ring = [];
      for (const coord of interiorCoords) {
        ring.push(coord);
      }
      interiorRings.push(ring);
      value.expectGroupEnd();
    }

    multiPolygon.polygons.push(new Polygon(exteriorRing, interiorRings));

    value.expectGroupEnd();
  } while (value.isMatch([',']));

  value.expectGroupEnd();

  return multiPolygon;
}

export function parseMultiPolygonWkb(value: BinaryReader, options: GeometryOptions): MultiPolygon {
  const multiPolygon = new MultiPolygon();
  multiPolygon.srid = options.srid;
  multiPolygon.hasZ = options.hasZ ?? false;
  multiPolygon.hasM = options.hasM ?? false;

  const polygonCount = value.readUInt32();

  for (let i = 0; i < polygonCount; i++) {
    // This can only return a Polygon, but we need to call parseWkb in order to make sure wkb headers are read
    multiPolygon.polygons.push(parseWkb(value, options) as Polygon);
  }

  return multiPolygon;
}

export function parseMultiPolygonTwkb(value: BinaryReader, options: GeometryOptions): MultiPolygon {
  const multiPolygon = new MultiPolygon();
  multiPolygon.hasZ = options.hasZ ?? false;
  multiPolygon.hasM = options.hasM ?? false;

  if (options.isEmpty) {
    return multiPolygon;
  }

  const previousPoint = new Point(0, 0, options.hasZ ? 0 : undefined, options.hasM ? 0 : undefined);

  const polygonCount = value.readVarInt();

  for (let i = 0; i < polygonCount; i++) {
    const polygon = new Polygon();
    polygon.hasZ = options.hasZ ?? false;
    polygon.hasM = options.hasM ?? false;

    const ringCount = value.readVarInt();
    const exteriorRingCount = value.readVarInt();

    for (let j = 0; j < exteriorRingCount; j++) {
      polygon.exteriorRing.push(parseRelativePointTwkb(value, options, previousPoint));
    }

    for (let j = 1; j < ringCount; j++) {
      const interiorRing: Point[] = [];
      const interiorRingCount = value.readVarInt();

      for (let k = 0; k < interiorRingCount; k++) {
        interiorRing.push(parseRelativePointTwkb(value, options, previousPoint));
      }

      polygon.interiorRings.push(interiorRing);
    }

    multiPolygon.polygons.push(polygon);
  }

  return multiPolygon;
}

export function parseMultiPolygonGeoJSON(value: any): MultiPolygon {
  const multiPolygon = new MultiPolygon();

  if (
    value.coordinates.length > 0 &&
    value.coordinates[0].length > 0 &&
    value.coordinates[0][0].length > 0
  ) {
    multiPolygon.hasZ = value.coordinates[0][0][0].length > 2;
  }

  for (let i = 0; i < value.coordinates.length; i++) {
    multiPolygon.polygons.push(parsePolygonGeoJSON({ coordinates: value.coordinates[i] }));
  }

  return multiPolygon;
}
