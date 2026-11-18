// Testes da lógica central: node tools/test_logic.js
const assert = require('assert');
const B = require('../android/assets/www/core.js');

let n = 0;
const t = (name, fn) => { fn(); n++; };

t('datas', () => {
  assert.strictEqual(B.addMonths('2026-11', 3), '2027-02');
  assert.strictEqual(B.addMonths('2026-01', -1), '2025-12');
  assert.strictEqual(B.daysInMonth('2028-02'), 29);
  assert.strictEqual(B.addDays('2026-12-31', 1), '2027-01-01');
});

t('rapid logging', () => {
  assert.deepStrictEqual(B.parseQuick('o dentista 10h'), { type: 'event', signifier: '', text: 'dentista 10h' });
  assert.deepStrictEqual(B.parseQuick('* - ideia importante'), { type: 'note', signifier: 'priority', text: 'ideia importante' });
  assert.strictEqual(B.parseQuick('comprar pão').type, 'task');
  assert.strictEqual(B.parseQuick('ovo frito').text, 'ovo frito'); // "o" sem espaço não é evento
});

t('migração: amanhã, mês, futuro, coleção', () => {
  const s = B.defaultState();
  const d = B.today();
  const a = B.addEntry(s, { log: 'daily', date: d, text: 'Ligar banco' });
  const c1 = B.migrate(s, a.id, { to: 'tomorrow' });
  assert.strictEqual(a.status, 'migrated');
  assert.strictEqual(c1.date, B.addDays(d, 1));
  assert.strictEqual(B.bulletFor(a), '>');
  const c2 = B.migrate(s, c1.id, { to: 'monthly', month: B.currentMonth() });
  assert.strictEqual(c1.status, 'scheduled');
  assert.strictEqual(B.bulletFor(c1), '<');
  const c3 = B.migrate(s, c2.id, { to: 'future', month: B.addMonths(B.currentMonth(), 2), day: 5 });
  assert.strictEqual(c2.status, 'scheduled');
  assert.strictEqual(c3.log, 'future');
  const col = B.addCollection(s, 'Livros a ler');
  const c4 = B.migrate(s, c3.id, { to: 'collection', collectionId: col.id });
  assert.strictEqual(c3.status, 'migrated');
  assert.strictEqual(B.collectionEntries(s, col.id).length, 1);
  assert.strictEqual(c4.migratedFrom, c3.id);
});

t('pendências de migração', () => {
  const s = B.defaultState();
  const ontem = B.addDays(B.today(), -1);
  const x = B.addEntry(s, { log: 'daily', date: ontem, text: 'antiga' });
  B.addEntry(s, { log: 'daily', date: B.today(), text: 'hoje' });
  B.addEntry(s, { log: 'future', month: B.currentMonth(), text: 'do future log' });
  const done = B.addEntry(s, { log: 'daily', date: ontem, text: 'feita' });
  B.toggleDone(s, done.id);
  const p = B.pendingMigration(s);
  assert.deepStrictEqual(p.map(e => e.text).sort(), ['antiga', 'do future log']);
  assert.ok(p.includes(x));
});

t('índice numerado', () => {
  const s = B.defaultState();
  B.addEntry(s, { log: 'monthly', month: '2026-11', text: 'x' });
  B.addCollection(s, 'Filmes');
  B.addEntry(s, { log: 'daily', date: '2026-11-18', text: 'y' });
  B.addEntry(s, { log: 'daily', date: '2026-11-18', text: 'z' });
  const idx = B.buildIndex(s);
  assert.strictEqual(idx.length, 6);
  assert.deepStrictEqual(idx.map(i => i.page), [1, 2, 3, 4, 5, 6]);
  assert.ok(idx[5].title.includes('18/11/2026'));
});

t('trackers', () => {
  const s = B.defaultState();
  const tr = B.addTracker(s, { title: 'Hábitos', month: '2026-11', habits: ['Água', 'Leitura'] });
  B.toggleMark(tr, tr.habits[0].id, 1); B.toggleMark(tr, tr.habits[0].id, 2); B.toggleMark(tr, tr.habits[0].id, 2);
  assert.strictEqual(B.habitStats(tr)[0].done, 1);
});

t('exportações e backup', () => {
  const s = B.defaultState();
  B.addEntry(s, { log: 'daily', date: '2026-11-18', text: 'Texto, com "aspas"', signifier: 'priority' });
  B.addEntry(s, { log: 'future', month: '2026-12', day: 23, type: 'event', text: 'Aniversário' });
  const md = B.toMarkdown(s);
  assert.ok(md.includes('* • Texto, com "aspas"'));
  assert.ok(md.includes('23: ○ Aniversário'));
  const csv = B.toCSV(s);
  assert.ok(csv.includes('"Texto, com ""aspas"""'));
  assert.ok(B.toPrintableHTML(s).includes('<h2>Future log</h2>'));
  const json = B.toJSON(s);
  const back = B.importJSON(B.defaultState(), json, 'replace');
  assert.strictEqual(back.entries.length, 2);
  const merged = B.importJSON(back, json, 'merge');
  assert.strictEqual(merged.entries.length, 2);
  assert.throws(() => B.importJSON(s, '{"foo":1}', 'replace'));
  const ranged = B.toCSV(s, { scope: 'range', from: '2026-12-01', to: '2026-12-31' });
  assert.ok(!ranged.includes('aspas') && ranged.includes('Aniversário'));
});

t('busca sem acentos', () => {
  const s = B.defaultState();
  B.addEntry(s, { log: 'daily', date: '2026-11-18', text: 'Reunião de família' });
  assert.strictEqual(B.search(s, 'reuniao').length, 1);
});

console.log(`test_logic: ${n} grupos de testes OK`);
