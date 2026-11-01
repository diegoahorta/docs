#!/usr/bin/env node
/** Copia as bibliotecas de node_modules para vendor/ (rode após npm install para atualizar). */
import { copyFileSync } from 'node:fs';
copyFileSync('node_modules/gsap/dist/gsap.min.js', 'vendor/gsap.min.js');
copyFileSync('node_modules/docx/dist/index.iife.js', 'vendor/docx.iife.js');
copyFileSync('node_modules/three/build/three.module.min.js', 'vendor/three/three.module.min.js');
copyFileSync('node_modules/three/examples/jsm/loaders/GLTFLoader.js', 'vendor/three/addons/loaders/GLTFLoader.js');
copyFileSync('node_modules/three/examples/jsm/utils/BufferGeometryUtils.js', 'vendor/three/addons/utils/BufferGeometryUtils.js');
console.log('✔ vendor/ atualizado');
