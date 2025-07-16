/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { Buffer } from 'buffer';

import './matchers';

import { Geometry, MultiPoint, parse, parseGeoJSON, parseTwkb, Point } from '../src';

import tests2D from './testdata';
import testsZ from './testdataZ';
import testsM from './testdataM';
import testsZM from './testdataZM';
import issueTests from './issuetestdata';

const tests = {
  '2D': tests2D,
  Z: testsZ,
  M: testsM,
  ZM: testsZM,
} as const;

type DatasetName = keyof typeof tests;
type TestDataset = (typeof tests)[DatasetName];
type TestData = {
  geometry: () => Geometry;
  wkbGeometry?: () => Geometry;
  geoJSONGeometry?: () => Geometry;
  wkt: string;
  wkb: string;
  ewkb: string;
  wkbXdr: string;
  ewkbXdr: string;
  twkb: string;
  geoJSON: unknown; // TODO: geoJson types
  ewkbNoSrid: string;
  ewkbXdrNoSrid: string;
};

describe('wkx', () => {
  describe('Geometry.parse with WKT', () => {
    const basicPointCases = [
      { input: 'POINT(1 2)', expected: new Point(1, 2) },
      { input: 'POINT(1.2 3.4)', expected: new Point(1.2, 3.4) },
      { input: 'POINT(1 3.4)', expected: new Point(1, 3.4) },
      { input: 'POINT(1.2 3)', expected: new Point(1.2, 3) },
      { input: 'POINT(-1 -2)', expected: new Point(-1, -2) },
      { input: 'POINT(-1 2)', expected: new Point(-1, 2) },
      { input: 'POINT(1 -2)', expected: new Point(1, -2) },
      { input: 'POINT(-1.2 -3.4)', expected: new Point(-1.2, -3.4) },
      { input: 'POINT(-1.2 3.4)', expected: new Point(-1.2, 3.4) },
      { input: 'POINT(1.2 -3.4)', expected: new Point(1.2, -3.4) },
      { input: 'POINT(1.2e1 3.4e1)', expected: new Point(12, 34) },
      { input: 'POINT(1.2e-1 3.4e-1)', expected: new Point(0.12, 0.34) },
      { input: 'POINT(-1.2e1 -3.4e1)', expected: new Point(-12, -34) },
      { input: 'POINT(-1.2e-1 -3.4e-1)', expected: new Point(-0.12, -0.34) },
    ];

    it.each(basicPointCases)('parses $input', ({ input, expected }) => {
      expect(parse(input)).toEqual(expected);
    });

    const multiPointCases = [
      {
        input: 'MULTIPOINT(1 2,3 4)',
        expected: new MultiPoint([new Point(1, 2), new Point(3, 4)]),
      },
      {
        input: 'MULTIPOINT(1 2, 3 4)',
        expected: new MultiPoint([new Point(1, 2), new Point(3, 4)]),
      },
      {
        input: 'MULTIPOINT((1 2),(3 4))',
        expected: new MultiPoint([new Point(1, 2), new Point(3, 4)]),
      },
      {
        input: 'MULTIPOINT((1 2), (3 4))',
        expected: new MultiPoint([new Point(1, 2), new Point(3, 4)]),
      },
    ];

    it.each(multiPointCases)('parses multipoint $input', ({ input, expected }) => {
      expect(parse(input)).toEqual(expected);
    });
  });

  describe('parse error handling', () => {
    const errorCases = [
      {
        name: 'missing argument',
        // @ts-expect-error -- testing invalid call
        fn: () => parse(),
        error: /first argument must be a string or Buffer/,
      },
      {
        name: 'invalid geometry type',
        fn: () => parse('TEST'),
        error: /Expected geometry type/,
      },
      {
        name: 'missing group start',
        fn: () => parse('POINT)'),
        error: /Expected group start/,
      },
      {
        name: 'missing group end',
        fn: () => parse('POINT(1 2'),
        error: /Expected group end/,
      },
      {
        name: 'missing coordinates',
        fn: () => parse('POINT(1)'),
        error: /Expected coordinates/,
      },
      {
        name: 'unsupported WKB geometry type',
        fn: () => parse(Buffer.from('010800000000000000', 'hex')),
        error: /GeometryType 8 not supported/,
      },
      {
        name: 'unsupported TWKB geometry type',
        fn: () => parseTwkb(Buffer.from('a800c09a0c80b518', 'hex')),
        error: /GeometryType 8 not supported/,
      },
      {
        name: 'unsupported GeoJSON type',
        fn: () => parseGeoJSON({ type: 'TEST' }),
        error: /GeometryType TEST not supported/,
      },
    ];

    it.each(errorCases)('throws on $name', ({ fn, error }) => {
      expect(fn).toThrow(error);
    });
  });

  describe('Special issue tests', () => {
    it('handles issue #31 correctly', () => {
      const parsed = parse(issueTests['#31'].wkt);
      const expected = issueTests['#31'].geometry;
      expect(parsed).toEqual(expected);
    });
  });

  // Dynamically generate tests for each test dataset
  // First, we'll build a list of all test cases from all datasets
  const allTestCases: Array<{
    datasetName: DatasetName;
    testName: keyof TestDataset;
    data: TestData;
  }> = [];

  for (const datasetName in tests) {
    const dataset = tests[datasetName as DatasetName];
    for (const testName in dataset) {
      allTestCases.push({
        datasetName: datasetName as DatasetName,
        testName: testName as keyof TestDataset,
        data: dataset[testName] as TestData,
      });
    }
  }

  describe('Parsing formats', () => {
    describe('WKT', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const parsed = parse(data.wkt);
        const expected = data.geometry();
        expect(parsed).toEqual(expected);
      });
    });

    describe('WKB', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const expected = data.wkbGeometry?.() || data.geometry();
        expected.srid = undefined;
        const parsed = parse(Buffer.from(data.wkb, 'hex'));
        expect(parsed).toEqual(expected);
      });
    });

    describe('WKB XDR', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const expected = data.wkbGeometry?.() || data.geometry();
        expected.srid = undefined;
        const parsed = parse(Buffer.from(data.wkbXdr, 'hex'));
        expect(parsed).toEqual(expected);
      });
    });

    describe('EWKT', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const expected = data.geometry();
        expected.srid = 4326;
        const parsed = parse('SRID=4326;' + data.wkt);
        expect(parsed).toEqual(expected);
      });
    });

    describe('EWKB', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const expected = data.wkbGeometry?.() || data.geometry();
        expected.srid = 4326;
        const parsed = parse(Buffer.from(data.ewkb, 'hex'));
        expect(parsed).toEqual(expected);
      });
    });

    describe('EWKB XDR', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const expected = data.wkbGeometry?.() || data.geometry();
        expected.srid = 4326;
        const parsed = parse(Buffer.from(data.ewkbXdr, 'hex'));
        expect(parsed).toEqual(expected);
      });
    });

    describe('TWKB', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const expected = data.geometry();
        expected.srid = undefined;
        const parsed = parseTwkb(Buffer.from(data.twkb, 'hex'));
        expect(parsed).toEqual(expected);
      });
    });

    describe('GeoJSON', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const expected = data.geoJSONGeometry?.() || data.geometry();
        expected.srid = 4326;
        const parsed = parseGeoJSON(data.geoJSON);
        expect(parsed).toEqual(expected);
      });
    });
  });

  describe('Serialization formats', () => {
    describe('toWkt', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const geometry = data.geometry();
        expect(geometry).toMatchWkt(data.wkt);
      });
    });

    describe('toWkb', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data, datasetName, testName }) => {
        const geometry = data.geometry();
        expect(geometry).toMatchWkb(data.wkb);
      });
    });

    describe('toEwkt', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const geometry = data.geometry();
        geometry.srid = 4326;
        expect(geometry).toMatchEwkt(data.wkt);
      });
    });

    describe('toEwkb', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const geometry = data.geometry();
        geometry.srid = 4326;
        expect(geometry).toMatchEwkb(data.ewkb);
      });
    });

    describe('toTwkb', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const geometry = data.geometry();
        expect(geometry).toMatchTwkb(data.twkb);
      });
    });

    describe('toGeoJSON', () => {
      it.each(allTestCases)('$datasetName - $testName', ({ data }) => {
        const geometry = data.geometry();
        expect(geometry).toMatchGeoJSON(data.geoJSON);
      });
    });
  });
});
