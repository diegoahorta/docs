import { defineConfig } from 'vite'

// base './' permite abrir o build em qualquer subpasta (Live Server,
// GitHub Pages, Netlify...) como site estático.
export default defineConfig({
  base: './',
  server: { port: 5173, open: true },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'], gsap: ['gsap'] }
      }
    }
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js']
  }
})
