# WKX Modernization Plan

This document outlines the plan to modernize the WKX library according to current JavaScript ecosystem standards.

## Areas for Modernization

### 1. Dependencies and DevDependencies
- **Current**: Outdated dependencies from 2020 (package.json last updated for v0.5.0)
- **Options**:
  - Option A: Update all dependencies to latest versions
  - Option B: Evaluate each dependency to determine if it's still needed
- **Decision**: Option A - Update all dependencies to latest versions

### 2. Module System
- **Current**: Using CommonJS (require/module.exports)
- **Options**:
  - Option A: Convert to ES Modules (import/export) with .mjs extension
  - Option B: Dual package with CommonJS and ESM support
  - Option C: Keep CommonJS but use modern bundlers for browser distribution
- **Decision**: Option B - Implement dual package with ESM as primary format but provide CommonJS compatibility through build process

### 3. TypeScript Support
- **Current**: TypeScript declaration file (wkx.d.ts) but JavaScript implementation
- **Options**:
  - Option A: Convert all source code to TypeScript
  - Option B: Keep JavaScript implementation but improve TypeScript definitions
  - Option C: Use JSDoc to enhance TypeScript support without switching language
- **Decision**: Option A - Convert all source code to TypeScript

### 4. Testing and Code Quality
- **Current**: Using jshint and mocha with nyc for coverage
- **Options**:
  - Option A: Replace jshint with ESLint
  - Option B: Add Prettier for consistent formatting
  - Option C: Update testing tools while keeping mocha
  - Option D: Replace mocha with Jest or Vitest
- **Decision**: Options A, B, and D - Replace jshint with ESLint, add Prettier, and replace mocha with Vitest

### 5. Build System
- **Current**: Using browserify and uglify-js for browser builds
- **Options**:
  - Option A: Replace with Webpack
  - Option B: Replace with Rollup
  - Option C: Replace with esbuild
  - Option D: Replace with Vite
- **Decision**: Option D - Replace with Vite for development and building multiple distribution formats

### 6. CI/CD
- **Current**: Using Travis CI
- **Options**:
  - Option A: Replace with GitHub Actions
  - Option B: Replace with CircleCI
- **Decision**: Option A - Replace with GitHub Actions

### 7. Package.json Configuration
- **Current**: Basic configuration without modern fields
- **Options**:
  - Option A: Add "exports" field for better module resolution
  - Option B: Configure "type" field for module system
  - Option C: Add more package metadata and configuration
- **Decision**: Options A, B, and C - Comprehensive update to package.json

## Revised Implementation Steps

1. **Update Dependencies**: Update all dependencies to current versions
2. **Build & Testing Infrastructure**: Set up Vite and Vitest before making major code changes
3. **ESLint & Prettier**: Configure code quality tools
4. **Module System & TypeScript**: Convert code to TypeScript with ESM syntax
5. **Build Configuration**: Configure Vite to produce multiple build formats (ESM, CommonJS, UMD)
6. **CI/CD**: Set up GitHub Actions workflows
7. **Package Configuration**: Update package.json with modern fields including exports map

## Progress Tracking

Each step will be marked as:
- ⏱️ Pending
- 🔄 In Progress
- ✅ Completed

Current Status: 🔄 Planning Phase

## Compatibility Considerations

- Maintain API compatibility with original implementation
- Provide multiple build formats for wide compatibility
- As this is a fork, we have flexibility to make more substantial changes while keeping the API relatively close to the original

## TODO
* [ ] Clean up remaining lint errors
* [ ] Clean up vite config
* [ ] Ci and release
* [ ] Update readme
