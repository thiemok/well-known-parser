import { GEOMETRY_TYPES } from '../constants';
import { BinaryReader } from '../binaryreader';
import { WktParser } from '../wktparser';
import { GeoJSONGeometry, GeometryOptions } from '../types';
import { Geometry } from '../geometry';
import * as ZigZag from '../zigzag';
import { GeometryCollection as GeoJSONGeometryCollection } from 'geojson';

// Import geometry-specific parsers
import { parsePointGeoJSON, parsePointTwkb, parsePointWkb, parsePointWkt } from './point';
import {
  parseLineStringGeoJSON,
  parseLineStringTwkb,
  parseLineStringWkb,
  parseLineStringWkt,
} from './linestring';
import { parsePolygonGeoJSON, parsePolygonTwkb, parsePolygonWkb, parsePolygonWkt } from './polygon';
import {
  parseMultiPointGeoJSON,
  parseMultiPointTwkb,
  parseMultiPointWkb,
  parseMultiPointWkt,
} from './multipoint';
import {
  parseMultiLineStringGeoJSON,
  parseMultiLineStringTwkb,
  parseMultiLineStringWkb,
  parseMultiLineStringWkt,
} from './multilinestring';
import {
  parseMultiPolygonGeoJSON,
  parseMultiPolygonTwkb,
  parseMultiPolygonWkb,
  parseMultiPolygonWkt,
} from './multipolygon';
import { GeometryCollection } from '../geometrycollection';

export function parse(
  value: string | Buffer | WktParser | BinaryReader,
  options?: GeometryOptions
): Geometry {
  if (typeof value === 'string' || value instanceof WktParser) {
    return parseWkt(value, options);
  } else if (Buffer.isBuffer(value) || value instanceof BinaryReader) {
    return parseWkb(value, options);
  } else {
    throw new Error('first argument must be a string or Buffer');
  }
}

/**
 * Helper function to parse WKT format
 */
export function parseWkt(value: string | WktParser, inputOptions?: GeometryOptions): Geometry {
  let wktParser: WktParser;
  let srid: number | undefined;

  if (value instanceof WktParser) {
    wktParser = value;
  } else {
    wktParser = new WktParser(value);
  }

  const match = wktParser.matchRegex([/^SRID=(\d+);/]);
  if (match) {
    srid = parseInt(match[1], 10);
  }

  const geometryType = wktParser.matchType();
  const dimension = wktParser.matchDimension();

  const options: GeometryOptions = {
    ...(inputOptions || {}),
    srid,
    hasZ: dimension.hasZ,
    hasM: dimension.hasM,
  };

  switch (geometryType) {
    case GEOMETRY_TYPES.Point.wkt:
      return parsePointWkt(wktParser, options);
    case GEOMETRY_TYPES.LineString.wkt:
      return parseLineStringWkt(wktParser, options);
    case GEOMETRY_TYPES.Polygon.wkt:
      return parsePolygonWkt(wktParser, options);
    case GEOMETRY_TYPES.MultiPoint.wkt:
      return parseMultiPointWkt(wktParser, options);
    case GEOMETRY_TYPES.MultiLineString.wkt:
      return parseMultiLineStringWkt(wktParser, options);
    case GEOMETRY_TYPES.MultiPolygon.wkt:
      return parseMultiPolygonWkt(wktParser, options);
    case GEOMETRY_TYPES.GeometryCollection.wkt:
      return parseGeometryCollectionWkt(wktParser, options);
    default:
      throw new Error(`GeometryType ${geometryType} not supported`);
  }
}

/**
 * Helper function to parse WKB format
 */
export function parseWkb(value: Buffer | BinaryReader, parentOptions?: GeometryOptions): Geometry {
  let binaryReader: BinaryReader;
  let geometryType: number;
  const options: GeometryOptions = {};

  if (value instanceof BinaryReader) {
    binaryReader = value;
  } else {
    binaryReader = new BinaryReader(value);
  }

  binaryReader.isBigEndian = !binaryReader.readInt8();
  const wkbType = binaryReader.readUInt32();

  options.hasSrid = (wkbType & 0x20000000) === 0x20000000;
  options.isEwkb = Boolean(wkbType & 0x20000000 || wkbType & 0x40000000 || wkbType & 0x80000000);

  if (options.hasSrid) {
    options.srid = binaryReader.readUInt32();
  }

  options.hasZ = false;
  options.hasM = false;

  if (!options.isEwkb && (!parentOptions || !parentOptions.isEwkb)) {
    if (wkbType >= 1000 && wkbType < 2000) {
      options.hasZ = true;
      geometryType = wkbType - 1000;
    } else if (wkbType >= 2000 && wkbType < 3000) {
      options.hasM = true;
      geometryType = wkbType - 2000;
    } else if (wkbType >= 3000 && wkbType < 4000) {
      options.hasZ = true;
      options.hasM = true;
      geometryType = wkbType - 3000;
    } else {
      geometryType = wkbType;
    }
  } else {
    if (wkbType & 0x80000000) {
      options.hasZ = true;
    }
    if (wkbType & 0x40000000) {
      options.hasM = true;
    }

    geometryType = wkbType & 0xf;
  }

  switch (geometryType) {
    case GEOMETRY_TYPES.Point.wkb:
      return parsePointWkb(binaryReader, options);
    case GEOMETRY_TYPES.LineString.wkb:
      return parseLineStringWkb(binaryReader, options);
    case GEOMETRY_TYPES.Polygon.wkb:
      return parsePolygonWkb(binaryReader, options);
    case GEOMETRY_TYPES.MultiPoint.wkb:
      return parseMultiPointWkb(binaryReader, options);
    case GEOMETRY_TYPES.MultiLineString.wkb:
      return parseMultiLineStringWkb(binaryReader, options);
    case GEOMETRY_TYPES.MultiPolygon.wkb:
      return parseMultiPolygonWkb(binaryReader, options);
    case GEOMETRY_TYPES.GeometryCollection.wkb:
      return parseGeometryCollectionWkb(binaryReader, options);
    default:
      throw new Error(`GeometryType ${geometryType} not supported`);
  }
}

/**
 * Helper function to parse TWKB format
 */
export function parseTwkb(value: Buffer | BinaryReader, inputOptions?: GeometryOptions): Geometry {
  let binaryReader: BinaryReader;
  const options: GeometryOptions = { ...(inputOptions || {}) };

  if (value instanceof BinaryReader) {
    binaryReader = value;
  } else {
    binaryReader = new BinaryReader(value);
  }

  const type = binaryReader.readUInt8();
  const metadataHeader = binaryReader.readUInt8();

  const geometryType = type & 0x0f;
  options.precision = ZigZag.decode(type >> 4);
  options.precisionFactor = Math.pow(10, options.precision);

  options.hasBoundingBox = Boolean((metadataHeader >> 0) & 1);
  options.hasSizeAttribute = Boolean((metadataHeader >> 1) & 1);
  options.hasIdList = Boolean((metadataHeader >> 2) & 1);
  options.hasExtendedPrecision = Boolean((metadataHeader >> 3) & 1);
  options.isEmpty = Boolean((metadataHeader >> 4) & 1);

  if (options.hasExtendedPrecision) {
    const extendedPrecision = binaryReader.readUInt8();
    options.hasZ = (extendedPrecision & 0x01) === 0x01;
    options.hasM = (extendedPrecision & 0x02) === 0x02;

    options.zPrecision = ZigZag.decode((extendedPrecision & 0x1c) >> 2);
    options.zPrecisionFactor = Math.pow(10, options.zPrecision);

    options.mPrecision = ZigZag.decode((extendedPrecision & 0xe0) >> 5);
    options.mPrecisionFactor = Math.pow(10, options.mPrecision);
  } else {
    options.hasZ = false;
    options.hasM = false;
  }

  if (options.hasSizeAttribute) {
    binaryReader.readVarInt();
  }

  if (options.hasBoundingBox) {
    let dimensions = 2;

    if (options.hasZ) {
      dimensions++;
    }
    if (options.hasM) {
      dimensions++;
    }

    for (let i = 0; i < dimensions; i++) {
      binaryReader.readVarInt();
      binaryReader.readVarInt();
    }
  }

  switch (geometryType) {
    case GEOMETRY_TYPES.Point.wkb:
      return parsePointTwkb(binaryReader, options);
    case GEOMETRY_TYPES.LineString.wkb:
      return parseLineStringTwkb(binaryReader, options);
    case GEOMETRY_TYPES.Polygon.wkb:
      return parsePolygonTwkb(binaryReader, options);
    case GEOMETRY_TYPES.MultiPoint.wkb:
      return parseMultiPointTwkb(binaryReader, options);
    case GEOMETRY_TYPES.MultiLineString.wkb:
      return parseMultiLineStringTwkb(binaryReader, options);
    case GEOMETRY_TYPES.MultiPolygon.wkb:
      return parseMultiPolygonTwkb(binaryReader, options);
    case GEOMETRY_TYPES.GeometryCollection.wkb:
      return parseGeometryCollectionTwkb(binaryReader, options);
    default:
      throw new Error(`GeometryType ${geometryType} not supported`);
  }
}

/**
 * Helper function to parse GeoJSON
 */
export function parseGeoJSON(value: GeoJSONGeometry, isSubGeometry = false): Geometry {
  let geometry: Geometry;

  switch (value.type) {
    case GEOMETRY_TYPES.Point.geoJSON:
      geometry = parsePointGeoJSON(value.coordinates);
      break;
    case GEOMETRY_TYPES.LineString.geoJSON:
      geometry = parseLineStringGeoJSON(value);
      break;
    case GEOMETRY_TYPES.Polygon.geoJSON:
      geometry = parsePolygonGeoJSON(value);
      break;
    case GEOMETRY_TYPES.MultiPoint.geoJSON:
      geometry = parseMultiPointGeoJSON(value);
      break;
    case GEOMETRY_TYPES.MultiLineString.geoJSON:
      geometry = parseMultiLineStringGeoJSON(value);
      break;
    case GEOMETRY_TYPES.MultiPolygon.geoJSON:
      geometry = parseMultiPolygonGeoJSON(value);
      break;
    case GEOMETRY_TYPES.GeometryCollection.geoJSON:
      geometry = parseGeometryCollectionGeoJSON(value);
      break;
    default:
      // @ts-expect-error -- fallback for invalid data
      throw new Error(`GeometryType ${value.type} not supported`);
  }

  if (!isSubGeometry) {
    geometry.srid = 4326;
  }

  return geometry;
}

export function parseGeometryCollectionWkt(
  value: WktParser,
  options: GeometryOptions
): GeometryCollection {
  const geometryCollection = new GeometryCollection();
  geometryCollection.srid = options.srid;
  geometryCollection.hasZ = options.hasZ ?? false;
  geometryCollection.hasM = options.hasM ?? false;

  if (value.isMatch(['EMPTY'])) {
    return geometryCollection;
  }

  value.expectGroupStart();

  do {
    const geometryType = value.matchType();
    const dimension = value.matchDimension();

    const childOptions: GeometryOptions = {
      ...options,
      srid: undefined,
      hasZ: dimension.hasZ,
      hasM: dimension.hasM,
    };

    switch (geometryType) {
      case GEOMETRY_TYPES.Point.wkt:
        geometryCollection.geometries.push(parsePointWkt(value, childOptions));
        break;
      case GEOMETRY_TYPES.LineString.wkt:
        geometryCollection.geometries.push(parseLineStringWkt(value, childOptions));
        break;
      case GEOMETRY_TYPES.Polygon.wkt:
        geometryCollection.geometries.push(parsePolygonWkt(value, childOptions));
        break;
      case GEOMETRY_TYPES.MultiPoint.wkt:
        geometryCollection.geometries.push(parseMultiPointWkt(value, childOptions));
        break;
      case GEOMETRY_TYPES.MultiLineString.wkt:
        geometryCollection.geometries.push(parseMultiLineStringWkt(value, childOptions));
        break;
      case GEOMETRY_TYPES.MultiPolygon.wkt:
        geometryCollection.geometries.push(parseMultiPolygonWkt(value, childOptions));
        break;
      case GEOMETRY_TYPES.GeometryCollection.wkt:
        geometryCollection.geometries.push(parseGeometryCollectionWkt(value, childOptions));
        break;
      default:
        throw new Error(`GeometryType ${geometryType} not supported`);
    }
  } while (value.isMatch([',']));

  value.expectGroupEnd();

  return geometryCollection;
}

export function parseGeometryCollectionWkb(
  value: BinaryReader,
  options: GeometryOptions
): GeometryCollection {
  const geometryCollection = new GeometryCollection();
  geometryCollection.srid = options.srid;
  geometryCollection.hasZ = options.hasZ ?? false;
  geometryCollection.hasM = options.hasM ?? false;

  const geometryCount = value.readUInt32();

  for (let i = 0; i < geometryCount; i++) {
    geometryCollection.geometries.push(parseWkb(value, options));
  }

  return geometryCollection;
}

export function parseGeometryCollectionTwkb(
  value: BinaryReader,
  options: GeometryOptions
): GeometryCollection {
  const geometryCollection = new GeometryCollection();
  geometryCollection.hasZ = options.hasZ ?? false;
  geometryCollection.hasM = options.hasM ?? false;

  if (options.isEmpty) {
    return geometryCollection;
  }

  const geometryCount = value.readVarInt();

  for (let i = 0; i < geometryCount; i++) {
    geometryCollection.geometries.push(parseTwkb(value, options));
  }

  return geometryCollection;
}

export function parseGeometryCollectionGeoJSON(
  value: Pick<GeoJSONGeometryCollection, 'geometries'>
): GeometryCollection {
  const geometryCollection = new GeometryCollection();

  for (let i = 0; i < value.geometries.length; i++) {
    geometryCollection.geometries.push(parseGeoJSON(value.geometries[i], true));
  }

  if (geometryCollection.geometries.length > 0) {
    geometryCollection.hasZ = geometryCollection.geometries[0].hasZ;
  }

  return geometryCollection;
}
