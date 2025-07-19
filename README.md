well-known-parser
========

A WKT/WKB/EWKT/EWKB/TWKB/GeoJSON parser and serializer with support for

- Point
- LineString
- Polygon
- MultiPoint
- MultiLineString
- MultiPolygon
- GeometryCollection

Based upon [wkx](https://github.com/cschwarz/wkx)

Examples
--------

The following examples show you how to work with wkx.

```javascript
import { Point, parse, parseTwkb, parseGeoJSON } from "well-known-parser";

//Parsing a WKT string
var geometry = parse('POINT(1 2)');

//Parsing an EWKT string
var geometry = parse('SRID=4326;POINT(1 2)');

//Parsing a node Buffer containing a WKB object
var geometry = parse(wkbBuffer);

//Parsing a node Buffer containing an EWKB object
var geometry = parse(ewkbBuffer);

//Parsing a node Buffer containing a TWKB object
var geometry = parseTwkb(twkbBuffer);

//Parsing a GeoJSON object
var geometry = parseGeoJSON({ type: 'Point', coordinates: [1, 2] });

//Serializing a Point geometry to WKT
var wktString = new Point(1, 2).toWkt();

//Serializing a Point geometry to WKB
var wkbBuffer = new Point(1, 2).toWkb();

//Serializing a Point geometry to EWKT
var ewktString = new Point(1, 2, undefined, undefined, 4326).toEwkt();

//Serializing a Point geometry to EWKB
var ewkbBuffer = new Point(1, 2, undefined, undefined, 4326).toEwkb();

//Serializing a Point geometry to TWKB
var twkbBuffer = new Point(1, 2).toTwkb();

//Serializing a Point geometry to GeoJSON
var geoJSONObject = new Point(1, 2).toGeoJSON();
```
