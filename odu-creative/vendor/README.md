# Bibliotecas de terceiros (vendor)

Os arquivos ficam no repositório para que a aplicação funcione offline (PWA) e sem build.

| Arquivo | Origem | Versão | Licença |
|---|---|---|---|
| `gsap.min.js` | npm `gsap` | 3.13.0 | GSAP Standard "no charge" license — https://gsap.com/standard-license |
| `docx.iife.js` | npm `docx` | 9.5.1 | MIT (texto em `LICENSE-docx.txt`) |
| `three/three.module.min.js`, `three/addons/…` (GLTFLoader, BufferGeometryUtils) | npm `three` | 0.170.0 | MIT (`three/LICENSE.txt`) |

Para atualizar: `npm install` e depois `npm run vendor` (dentro de `odu-creative/`).
