import { expect } from 'vitest';

// Add custom matchers for geometry objects
expect.extend({
  toMatchWkt(received: any, expected: string) {
    if (typeof received.toWkt !== 'function') {
      return {
        pass: false,
        message: () => `Expected object to have a toWkt method, but it doesn't`
      };
    }

    const actual = received.toWkt();
    const pass = actual === expected;

    if (pass) {
      return {
        pass: true,
        message: () => `Expected WKT not to be "${expected}" but was`
      };
    } else {
      return {
        pass: false,
        message: () => `Expected WKT to be "${expected}" but got "${actual}"`
      };
    }
  },

  toMatchWkb(received: any, expected: string) {
    if (typeof received.toWkb !== 'function') {
      return {
        pass: false,
        message: () => `Expected object to have a toWkb method, but it doesn't`
      };
    }

    const buffer = received.toWkb();
    if (!Buffer.isBuffer(buffer)) {
      return {
        pass: false,
        message: () => `Expected toWkb() to return a Buffer, but got ${typeof buffer}`
      };
    }

    const actual = buffer.toString('hex');
    const pass = actual === expected;

    if (pass) {
      return {
        pass: true,
        message: () => `Expected WKB not to be "${expected}" but was`
      };
    } else {
      return {
        pass: false,
        message: () => `Expected WKB to be "${expected}" but got "${actual}"`
      };
    }
  },

  toMatchEwkt(received: any, wkt: string, srid: number = 4326) {
    if (typeof received.toEwkt !== 'function') {
      return {
        pass: false,
        message: () => `Expected object to have a toEwkt method, but it doesn't`
      };
    }

    const expected = `SRID=${srid};${wkt}`;
    const actual = received.toEwkt();
    const pass = actual === expected;

    if (pass) {
      return {
        pass: true,
        message: () => `Expected EWKT not to be "${expected}" but was`
      };
    } else {
      return {
        pass: false,
        message: () => `Expected EWKT to be "${expected}" but got "${actual}"`
      };
    }
  },

  toMatchEwkb(received: any, expected: string) {
    if (typeof received.toEwkb !== 'function') {
      return {
        pass: false,
        message: () => `Expected object to have a toEwkb method, but it doesn't`
      };
    }

    const buffer = received.toEwkb();
    if (!Buffer.isBuffer(buffer)) {
      return {
        pass: false,
        message: () => `Expected toEwkb() to return a Buffer, but got ${typeof buffer}`
      };
    }

    const actual = buffer.toString('hex');
    const pass = actual === expected;

    if (pass) {
      return {
        pass: true,
        message: () => `Expected EWKB not to be "${expected}" but was`
      };
    } else {
      return {
        pass: false,
        message: () => `Expected EWKB to be "${expected}" but got "${actual}"`
      };
    }
  },

  toMatchTwkb(received: any, expected: string) {
    if (typeof received.toTwkb !== 'function') {
      return {
        pass: false,
        message: () => `Expected object to have a toTwkb method, but it doesn't`
      };
    }

    const buffer = received.toTwkb();
    if (!Buffer.isBuffer(buffer)) {
      return {
        pass: false,
        message: () => `Expected toTwkb() to return a Buffer, but got ${typeof buffer}`
      };
    }

    const actual = buffer.toString('hex');
    const pass = actual === expected;

    if (pass) {
      return {
        pass: true,
        message: () => `Expected TWKB not to be "${expected}" but was`
      };
    } else {
      return {
        pass: false,
        message: () => `Expected TWKB to be "${expected}" but got "${actual}"`
      };
    }
  },

  toMatchGeoJSON(received: any, expected: any) {
    if (typeof received.toGeoJSON !== 'function') {
      return {
        pass: false,
        message: () => `Expected object to have a toGeoJSON method, but it doesn't`
      };
    }

    const actual = received.toGeoJSON();
    const pass = this.equals(actual, expected);

    if (pass) {
      return {
        pass: true,
        message: () => `Expected GeoJSON not to match the expected value`
      };
    } else {
      return {
        pass: false,
        message: () => `Expected GeoJSON to match\nActual: ${JSON.stringify(actual)}\nExpected: ${JSON.stringify(expected)}`
      };
    }
  }
});

interface CustomMatchers {
    toMatchWkt(expected: string): void;
    toMatchWkb(expected: string): void;
    toMatchEwkt(wkt: string, srid?: number): void;
    toMatchEwkb(expected: string): void;
    toMatchTwkb(expected: string): void;
    toMatchGeoJSON(expected: any): void;
}

declare module 'vitest' {
    interface Assertion<T = any> extends CustomMatchers {}
}
