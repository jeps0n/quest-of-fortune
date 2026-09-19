import { defineConfig } from 'vite'
export default defineConfig({
  build: {
    outDir: '.reel-audit-dist',
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: 'src/tools/ReelAudit.ts',
      formats: ['es'],
      fileName: () => 'reel-audit.mjs',
    },
  },
})
