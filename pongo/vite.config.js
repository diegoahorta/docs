import { defineConfig } from 'vite'

// base relativo: o build em dist/ funciona no Live Server, em subpastas
// e em qualquer hospedagem estática.
// Modo "single" (npm run build:html): um único bundle, depois embutido em
// um só arquivo HTML por tools/inline-html.js.
export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  return {
    base: './',
    server: { host: true, port: 5173 },
    preview: { host: true, port: 4173 },
    build: {
      target: 'es2022',
      outDir: single ? 'dist-single' : 'dist',
      chunkSizeWarningLimit: 1800,
      assetsInlineLimit: single ? Infinity : 4096,
      copyPublicDir: !single,
      rollupOptions: {
        output: single
          ? { inlineDynamicImports: true }
          : { manualChunks: { phaser: ['phaser'], gsap: ['gsap'] } }
      }
    }
  }
})
