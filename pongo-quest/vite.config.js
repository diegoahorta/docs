import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// base './' permite abrir o build em qualquer subpasta (Live Server,
// GitHub Pages, Netlify...) como site estático.
// `npm run build:single` gera um único HTML autocontido (abre com duplo clique).
export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  const favicon = readFileSync(
    new URL('./public/assets/icons/favicon.svg', import.meta.url),
    'utf8'
  )
  return {
    base: './',
    server: { port: 5173, open: true },
    resolve: single
      ? {
          alias: {
            '@fontsource/dotgothic16/400.css': fileURLToPath(
              new URL('./src/styles/font-cdn.css', import.meta.url)
            )
          }
        }
      : {},
    plugins: single
      ? [
          viteSingleFile(),
          {
            name: 'inline-favicon',
            transformIndexHtml: (html) =>
              html.replace(
                './assets/icons/favicon.svg',
                `data:image/svg+xml,${encodeURIComponent(favicon)}`
              )
          }
        ]
      : [],
    build: single
      ? { outDir: 'dist-single', copyPublicDir: false, chunkSizeWarningLimit: 4000 }
      : {
          outDir: 'dist',
          assetsInlineLimit: 0,
          chunkSizeWarningLimit: 1600,
          rollupOptions: {
            output: { manualChunks: { phaser: ['phaser'], gsap: ['gsap'] } }
          }
        },
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.js']
    }
  }
})
