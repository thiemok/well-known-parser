import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'wkx',
      fileName: (format) => `wkx.${format}.js`,
      formats: ['es', 'cjs', 'umd']
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
        preserveModules: false,
        // Create separate minified versions
        assetFileNames: (assetInfo) => {
          return assetInfo.name === 'style.css' ? 'css/[name][extname]' : 'assets/[name][extname]';
        }
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