import { defineConfig } from 'vite'

// base relativo: o build em dist/ funciona no Live Server, em subpastas
// e em qualquer hospedagem estática.
export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  build: {
    target: 'es2022',
    outDir: 'dist',
    chunkSizeWarningLimit: 1800,
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'], gsap: ['gsap'] }
      }
    }
  }
})
