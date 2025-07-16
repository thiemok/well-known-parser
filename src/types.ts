export interface GeometryOptions {
  srid?: number;
  hasZ?: boolean;
  hasM?: boolean;
  hasSrid?: boolean;
  isEwkb?: boolean;
  isEmpty?: boolean;
  // TWKB specific options
  precision?: number;
  precisionFactor?: number;
  hasBoundingBox?: boolean;
  hasSizeAttribute?: boolean;
  hasIdList?: boolean;
  hasExtendedPrecision?: boolean;
  zPrecision?: number;
  zPrecisionFactor?: number;
  mPrecision?: number;
  mPrecisionFactor?: number;
}

export interface GeoJSONOptions {
  shortCrs?: boolean;
  longCrs?: boolean;
}

export interface TwkbPrecision {
  xy: number;
  z: number;
  m: number;
  xyFactor: number;
  zFactor: number;
  mFactor: number;
}

