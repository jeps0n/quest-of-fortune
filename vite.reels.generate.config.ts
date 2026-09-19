import { defineConfig } from 'vite'
export default defineConfig({
  build: {
    outDir: '.reel-dist',
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: 'src/tools/ReelSequenceOptimizer.ts',
      formats: ['es'],
      fileName: () => 'reel-sequence-optimizer.mjs',
    },
  },
})
