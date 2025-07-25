import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'wkx',
      fileName: (format) => `well-known-parser.${format === "cjs" ? "cjs" : "js"}`,
      formats: ['es', 'cjs']
    },
    outDir: 'dist',
    rollupOptions: {
      // External dependencies that shouldn't be bundled
      external: ['buffer'],
      output: {
        // Provide globals for UMD build
        globals: {
          buffer: 'Buffer'
        },
        // Ensure clean exports
        exports: 'named',
        // Preserve modules structure for tree-shaking
        preserveModules: true,
      }
    },
    // Generate source maps
    sourcemap: true,
    // Minify with esbuild
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2020',
  },
  plugins: [
    // Generate TypeScript declaration files
    dts({
      entryRoot: 'src',
      outDir: 'dist/types',
      insertTypesEntry: true,
    })
  ],
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/test/**']
    },
  }
});
