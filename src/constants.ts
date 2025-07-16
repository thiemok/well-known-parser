export const GEOMETRY_TYPES = {
  Point: {
    wkt: 'POINT',
    wkb: 1,
    geoJSON: 'Point'
  },
  LineString: {
    wkt: 'LINESTRING',
    wkb: 2,
    geoJSON: 'LineString'
  },
  Polygon: {
    wkt: 'POLYGON',
    wkb: 3,
    geoJSON: 'Polygon'
  },
  MultiPoint: {
    wkt: 'MULTIPOINT',
    wkb: 4,
    geoJSON: 'MultiPoint'
  },
  MultiLineString: {
    wkt: 'MULTILINESTRING',
    wkb: 5,
    geoJSON: 'MultiLineString'
  },
  MultiPolygon: {
    wkt: 'MULTIPOLYGON',
    wkb: 6,
    geoJSON: 'MultiPolygon'
  },
  GeometryCollection: {
    wkt: 'GEOMETRYCOLLECTION',
    wkb: 7,
    geoJSON: 'GeometryCollection'
  }
};

export type GeometryType = keyof typeof GEOMETRY_TYPES;
export type FormatType = 'wkt' | 'wkb' | 'geoJSON';

export default GEOMETRY_TYPES;