/** Flashcards 3D: o GLB do Blender tem tudo o que o jogo usa, e os dados do baralho são coerentes. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { articleErrors } from '../js/core/evaluate.js';

const dir = new URL('../units/en-a1-cafe/', import.meta.url).pathname;
const unit = JSON.parse(readFileSync(dir + 'unit.json', 'utf8'));
const fc = unit.flashcards;

/** Lê o bloco JSON de um arquivo .glb (glTF binário). */
function readGlbJson(file) {
  const buf = readFileSync(file);
  assert.equal(buf.toString('ascii', 0, 4), 'glTF', 'cabeçalho glTF');
  assert.equal(buf.readUInt32LE(4), 2, 'glTF versão 2');
  const len = buf.readUInt32LE(12);
  assert.equal(buf.toString('ascii', 16, 20), 'JSON');
  return JSON.parse(buf.toString('utf8', 20, 20 + len));
}

const glb = readGlbJson(dir + fc.model);
const nodeNames = new Set(glb.nodes.map((n) => n.name));

test('GLB contém carta, itens de todas as cartas, cliente e cenário', () => {
  for (const name of ['Card', 'Customer', 'env-counter', 'env-wall', 'env-floor']) assert.ok(nodeNames.has(name), name);
  for (const c of fc.cards) assert.ok(nodeNames.has(c.model), `modelo ausente: ${c.model}`);
});

test('a carta tem materiais de frente/verso/borda e coordenadas UV', () => {
  const card = glb.nodes.find((n) => n.name === 'Card');
  const mesh = glb.meshes[card.mesh];
  const mats = mesh.primitives.map((p) => glb.materials[p.material].name).sort();
  assert.deepEqual(mats, ['CardBack', 'CardEdge', 'CardFront']);
  for (const p of mesh.primitives) assert.ok('TEXCOORD_0' in p.attributes, 'UV ausente');
});

test('cada carta aponta para um vocábulo existente, sem repetição', () => {
  const ids = fc.cards.map((c) => c.vocab);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(unit.vocabulary.some((v) => v.id === id), id);
});

test('pedidos do Café Rush citam o item com o artigo correto e têm áudio', () => {
  const orders = fc.cards.filter((c) => c.order);
  assert.ok(orders.length >= fc.rushOrders, 'pedidos suficientes para uma rodada');
  for (const c of orders) {
    const v = unit.vocabulary.find((x) => x.id === c.vocab);
    assert.ok(c.order.toLowerCase().includes(`${v.article} ${v.term}`.toLowerCase()), `${c.order} ≠ ${v.article} ${v.term}`);
    assert.equal(articleErrors(c.order).length, 0, c.order);
    const line = Object.values(unit.lines).find((l) => l.text === c.order);
    assert.ok(line && existsSync(dir + line.src), `áudio do pedido: ${c.order}`);
  }
});
