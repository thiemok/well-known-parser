import { describe, expect, it } from 'vitest';

import { Geometry, Point, parseGeoJSON } from '../src';

describe('wkx', () => {
  describe('parseGeoJSON', () => {
    it('includes short CRS', () => {
      const point = new Point(1, 2);
      point.srid = 4326;

      expect(parseGeoJSON({
        type: 'Point',
        crs: {
          type: 'name',
          properties: {
            name: 'EPSG:4326'
          }
        },
        coordinates: [1, 2]
      })).toEqual(point);
    });
    
    it('includes long CRS', () => {
      const point = new Point(1, 2);
      point.srid = 4326;

      expect(parseGeoJSON({
        type: 'Point',
        crs: {
          type: 'name',
          properties: {
            name: 'urn:ogc:def:crs:EPSG::4326'
          }
        },
        coordinates: [1, 2]
      })).toEqual(point);
    });
    
    it('includes invalid CRS', () => {
      expect(() => parseGeoJSON({
        type: 'Point',
        crs: {
          type: 'name',
          properties: {
            name: 'TEST'
          }
        },
        coordinates: [1, 2]
      })).toThrow(/Unsupported crs: TEST/);
    });
  });
  
  describe('toGeoJSON', () => {
    it('include short CRS', () => {
      const point = new Point(1, 2);
      point.srid = 4326;

      expect(point.toGeoJSON({ shortCrs: true })).toEqual({
        type: 'Point',
        crs: {
          type: 'name',
          properties: {
            name: 'EPSG:4326'
          }
        },
        coordinates: [1, 2]
      });
    });
    
    it('include long CRS', () => {
      const point = new Point(1, 2);
      point.srid = 4326;

      expect(point.toGeoJSON({ longCrs: true })).toEqual({
        type: 'Point',
        crs: {
          type: 'name',
          properties: {
            name: 'urn:ogc:def:crs:EPSG::4326'
          }
        },
        coordinates: [1, 2]
      });
    });
    
    it('geometry with SRID - without options', () => {
      const point = new Point(1, 2);
      point.srid = 4326;

      expect(point.toGeoJSON()).toEqual({
        type: 'Point',
        coordinates: [1, 2]
      });
    });
    
    it('geometry with SRID - with empty options', () => {
      const point = new Point(1, 2);
      point.srid = 4326;

      expect(point.toGeoJSON({})).toEqual({
        type: 'Point',
        coordinates: [1, 2]
      });
    });
  });
});