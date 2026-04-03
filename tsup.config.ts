import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    splitting: false,
  },
  {
    entry: ['src/pdf-lib.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
  },
]);
