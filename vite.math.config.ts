import { defineConfig } from 'vite'
export default defineConfig({
  build: {
    outDir: '.math-dist',
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: 'src/tools/MathSimulator.ts',
      formats: ['es'],
      fileName: () => 'math-simulator.mjs',
    },
  },
})
