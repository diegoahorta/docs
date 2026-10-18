// Gera o PPTX de apoio "Chrono Knight" (Chunking Royale · ODU).
const path = require('path');
const pptxgen = require('pptxgenjs');
// apply_theme.js grava as cores do tema no arquivo; sem ele o deck sai com a paleta padrão do Office.
let applyTheme = async () => console.warn('apply_theme.js não encontrado: tema não aplicado');
try { ({ applyTheme } = require(process.env.APPLY_THEME || '/root/.claude/skills/synced/d62aaa32-27dc-4079-9092-6f14a2b80b97_1897fb29-b16b-4b2f-9e6b-b244a0fd0d0a/pptx/scripts/apply_theme.js')); } catch (e) { /* opcional */ }

const ROOT = path.join(__dirname, '..');
const A = (f) => path.join(ROOT, 'assets', f);
const OUT = path.join(ROOT, 'Chrono_Knight_Apoio.pptx');

const THEME = {
  name: 'Chunking Royale',
  headFontFace: 'Arial',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '1B2240', lt1: 'FFFFFF', dk2: '0B1440', lt2: 'EEF2FB',
    accent1: '2E5FD0', accent2: 'E0A92E', accent3: '2E8B8B', accent4: 'C8476B', accent5: 'E8735A', accent6: '2E7D32',
    hlink: '2E5FD0', folHlink: '6D2E8C',
  },
};
// Cores fixas dos blocos (identidade Chunking Royale)
const BLK = { ADV: 'C8476B', S: '1E2A5E', AUX: 'D4A83A', V: '2E8B8B', O: 'E8735A' };

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'Chrono Knight · Future Continuous × Future Perfect';
pres.author = 'Professor Diego Horta · ODU';
const C = pres.SchemeColor;

const footer = (color) => ([
  { text: { text: 'Chunking Royale · Material autoral ODU · Professor Diego Horta', options: { x: 0.5, y: 5.2, w: 6.5, h: 0.3, fontSize: 10, color, margin: 0 } } },
]);
pres.defineSlideMaster({
  title: 'DARK_TITLE',
  background: { path: A('arena-bg.png') },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 1.5, w: 5.6, h: 1.2, fontSize: 48, bold: true, color: C.background1, valign: 'bottom', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.5, y: 2.8, w: 5.6, h: 1.4, fontSize: 20, color: C.accent2, valign: 'top', align: 'left', margin: 0 }, text: '' } },
    ...footer('C9D3F2'),
  ],
});
pres.defineSlideMaster({
  title: 'LIGHT_CONTENT',
  background: { color: 'FFFFFF' },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.35, w: 9, h: 0.75, fontSize: 32, bold: true, color: C.accent1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    ...footer('8A8F9C'),
  ],
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: '8A8F9C', align: 'right' },
});
pres.defineSlideMaster({
  title: 'DARK_CONTENT',
  background: { color: '0B1440' },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.35, w: 9, h: 0.75, fontSize: 32, bold: true, color: C.background1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    ...footer('9AA6D6'),
  ],
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: '9AA6D6', align: 'right' },
});

const shadow = () => ({ type: 'outer', color: '000000', opacity: 0.18, blur: 6, offset: 2, angle: 90 });
const kicker = (s, text, y, color) => s.addText(text.toUpperCase(), { x: 0.5, y, w: 9, h: 0.3, fontSize: 12, bold: true, color: color || C.accent4, charSpacing: 3, margin: 0, isTextBox: true, objectName: 'kicker' });

// Linha de blocos coloridos (rótulo + chunk), centrada em largura w
function blocks(s, list, x, y, w, h = 0.8) {
  const weights = list.map(([, t]) => Math.max(t.length, 4) + 3);
  const sum = weights.reduce((a, b) => a + b, 0);
  const gap = 0.06;
  let cx = x;
  list.forEach(([k, t], i) => {
    const bw = (w - gap * (list.length - 1)) * (weights[i] / sum);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y, w: bw, h, fill: { color: BLK[k] }, rectRadius: 0.08, line: { color: BLK[k] }, objectName: `block-${k}-${i}` });
    s.addText([{ text: k, options: { fontSize: 10, bold: true, color: 'FFFFFF', breakLine: true } }, { text: t, options: { fontSize: 15, bold: true, color: 'FFFFFF' } }],
      { x: cx, y, w: bw, h, align: 'center', valign: 'middle', margin: 2, isTextBox: true, objectName: `block-text-${i}` });
    cx += bw + gap;
  });
}

// ---------- 1. Capa ----------
pres.addSection({ title: 'Abertura' });
let s = pres.addSlide({ masterName: 'DARK_TITLE', sectionTitle: 'Abertura' });
s.addText('CHUNKING ROYALE · NOVA CARTA', { x: 0.5, y: 1.05, w: 5.6, h: 0.35, fontSize: 13, bold: true, color: 'E85A9B', charSpacing: 4, margin: 0, isTextBox: true, objectName: 'kicker' });
s.addText('Chrono Knight', { placeholder: 'title' });
s.addText([{ text: 'Future Continuous × Future Perfect', options: { breakLine: true } }, { text: 'Fonte: Unit 21 · Custo: 3 elixir', options: { fontSize: 14, color: 'C9D3F2' } }], { placeholder: 'body' });
s.addShape(pres.shapes.OVAL, { x: 6.35, y: 0.75, w: 3.3, h: 3.3, fill: { color: '4FE3FF', transparency: 80 }, line: { color: '4FE3FF', width: 2 }, objectName: 'glow' });
s.addImage({ path: A('chrono-knight.png'), x: 6.55, y: 0.85, w: 2.9, h: 3.26, objectName: 'chrono-knight' });
s.addNotes('Apresente a nova carta do deck: Chrono Knight. Ele domina o tempo e tem dois poderes — ver uma ação em andamento no futuro (fotografia) e ver uma ação já concluída antes de um prazo (linha de chegada). Custa 3 elixir: 3 acertos para colocá-lo na arena.');

// ---------- 2. Missão ----------
pres.addSection({ title: 'Teoria' });
s = pres.addSlide({ masterName: 'LIGHT_CONTENT', sectionTitle: 'Teoria' });
s.addText('Missão de hoje', { placeholder: 'title' });
[
  ['1', 'Fotografia ou linha de chegada?', 'Decidir se a ação futura estará EM ANDAMENTO ou JÁ CONCLUÍDA.', C.accent3],
  ['2', 'Montar com blocos', 'Encaixar ADV · S · AUX · V · O sem cair no bloco-armadilha.', C.accent2],
  ['3', 'Corrigir os erros clássicos', 'O BE que some, o particípio esquecido, a mistura dos tempos.', C.accent4],
].forEach(([n, h, d, col], i) => {
  const y = 1.35 + i * 1.2;
  s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.08, w: 0.75, h: 0.75, fill: { color: col }, line: { color: col }, objectName: `step-${n}` });
  s.addText(n, { x: 0.6, y: y + 0.08, w: 0.75, h: 0.75, fontSize: 26, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: `step-num-${n}` });
  s.addText([{ text: h, options: { fontSize: 20, bold: true, color: C.text1, breakLine: true } }, { text: d, options: { fontSize: 15, color: '4A5170' } }],
    { x: 1.6, y, w: 5.2, h: 0.95, valign: 'middle', margin: 0, isTextBox: true, objectName: `step-text-${n}` });
});
s.addImage({ path: A('chrono-knight.png'), x: 7.2, y: 1.3, w: 2.3, h: 2.59, objectName: 'chrono-knight' });
s.addText('3 acertos = 3 elixir = 1 Chrono Knight na arena', { x: 6.9, y: 4.05, w: 2.9, h: 0.6, fontSize: 13, italic: true, color: C.accent1, align: 'center', margin: 0, isTextBox: true, objectName: 'tagline' });
s.addNotes('Leia as três metas. Diga que no fim da aula eles vão jogar a Chrono Knight Arena: cada acerto gera elixir.');

// ---------- 3. Dois poderes ----------
s = pres.addSlide({ masterName: 'LIGHT_CONTENT', sectionTitle: 'Teoria' });
s.addText('Os dois poderes do Chrono Knight', { placeholder: 'title' });
const card = (x, col, icon, title, form, use, ex) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.3, w: 4.3, h: 3.1, fill: { color: 'F4F6FC' }, line: { color: 'DDE3F2', width: 1 }, rectRadius: 0.12, shadow: shadow(), objectName: `card-${title}` });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.25, y: 1.5, w: 3.8, h: 0.95, fill: { color: col }, line: { color: col }, rectRadius: 0.1, objectName: `card-head-${title}` });
  s.addText([{ text: `${icon}  ${title}`, options: { fontSize: 22, bold: true, color: 'FFFFFF', breakLine: true } }, { text: form, options: { fontSize: 15, color: 'FFFFFF' } }],
    { x: x + 0.4, y: 1.5, w: 3.6, h: 0.95, valign: 'middle', margin: 0, isTextBox: true, objectName: `card-head-text-${title}` });
  s.addText([{ text: 'Uso', options: { bold: true, color: C.text1, fontSize: 14, breakLine: true } }, { text: use, options: { color: '4A5170', fontSize: 16, breakLine: true } },
    { text: ' ', options: { fontSize: 8, breakLine: true } }, { text: 'Exemplo', options: { bold: true, color: C.text1, fontSize: 14, breakLine: true } }, { text: ex, options: { color: col, fontSize: 18, bold: true, italic: true } }],
    { x: x + 0.3, y: 2.6, w: 3.7, h: 2.2, valign: 'top', margin: 0, isTextBox: true, objectName: `card-body-${title}` });
};
card(0.5, BLK.V, '📸', 'Future Continuous', 'will be + verbo-ing', 'Ação EM ANDAMENTO num momento exato do futuro — uma fotografia.', '“At 9 tomorrow I will be working.”');
card(5.2, '2E5FD0', '🏁', 'Future Perfect', 'will have + particípio', 'Ação JÁ CONCLUÍDA antes de um prazo futuro — a linha de chegada.', '“By June we will have finished the course.”');
s.addNotes('Fotografia: congela um momento e mostra a ação acontecendo. Linha de chegada: olha para trás a partir do prazo e vê a ação já terminada.');

// ---------- 4. Linha do tempo ----------
s = pres.addSlide({ masterName: 'DARK_CONTENT', sectionTitle: 'Teoria' });
s.addText('Na linha do tempo', { placeholder: 'title' });
s.addShape(pres.shapes.LINE, { x: 0.7, y: 3.0, w: 8.6, h: 0, line: { color: 'C9D3F2', width: 3, endArrowType: 'triangle' }, objectName: 'timeline' });
s.addShape(pres.shapes.OVAL, { x: 0.85, y: 2.85, w: 0.3, h: 0.3, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF' }, objectName: 'now-dot' });
s.addText('AGORA', { x: 0.5, y: 3.25, w: 1.0, h: 0.35, fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', margin: 0, isTextBox: true, objectName: 'now-label' });
// barra da ação em andamento
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 2.6, y: 2.7, w: 2.8, h: 0.6, fill: { color: BLK.V }, line: { color: '4FE3FF', width: 2 }, rectRadius: 0.1, objectName: 'cont-bar' });
s.addText('dinner…', { x: 2.6, y: 2.7, w: 2.8, h: 0.6, fontSize: 16, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'cont-bar-text' });
s.addShape(pres.shapes.LINE, { x: 4.0, y: 1.55, w: 0, h: 2.3, line: { color: '4FE3FF', width: 2, dashType: 'dash' }, objectName: 'at8-line' });
s.addText('📸 AT 8', { x: 3.1, y: 1.2, w: 1.8, h: 0.35, fontSize: 16, bold: true, color: '4FE3FF', align: 'center', margin: 0, isTextBox: true, objectName: 'at8-label' });
s.addText('“At 8 we will be having dinner.”', { x: 1.9, y: 3.95, w: 4.2, h: 0.4, fontSize: 15, italic: true, color: 'FFFFFF', align: 'center', margin: 0, isTextBox: true, objectName: 'cont-ex' });
// ação concluída antes do prazo
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.9, y: 2.7, w: 1.6, h: 0.6, fill: { color: '2E5FD0' }, line: { color: '2E5FD0' }, rectRadius: 0.1, objectName: 'perf-bar' });
s.addText('cake ✓', { x: 5.9, y: 2.7, w: 1.6, h: 0.6, fontSize: 16, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'perf-bar-text' });
s.addShape(pres.shapes.LINE, { x: 8.1, y: 1.55, w: 0, h: 2.3, line: { color: 'E0A92E', width: 2, dashType: 'dash' }, objectName: 'by11-line' });
s.addText('🏁 BY 11', { x: 7.2, y: 1.2, w: 1.8, h: 0.35, fontSize: 16, bold: true, color: 'E0A92E', align: 'center', margin: 0, isTextBox: true, objectName: 'by11-label' });
s.addText('“By 11 they will have eaten the cake.”', { x: 5.6, y: 3.95, w: 3.9, h: 0.4, fontSize: 15, italic: true, color: 'FFFFFF', align: 'center', margin: 0, isTextBox: true, objectName: 'perf-ex' });
s.addNotes('Mostre o ponto AT 8: a ação atravessa o ponto, então está em andamento. No ponto BY 11, a ação já terminou antes — perfect.');

// ---------- 5. Fórmulas em blocos ----------
pres.addSection({ title: 'Blocos' });
s = pres.addSlide({ masterName: 'LIGHT_CONTENT', sectionTitle: 'Blocos' });
s.addText('As fórmulas em blocos', { placeholder: 'title' });
kicker(s, 'Future Continuous · fotografia', 1.2, BLK.V);
blocks(s, [['ADV', 'at 9 tomorrow'], ['S', 'I'], ['AUX', 'will be'], ['V', 'working']], 0.5, 1.55, 9);
kicker(s, 'Future Perfect · linha de chegada', 2.6, '2E5FD0');
blocks(s, [['ADV', 'by June'], ['S', 'we'], ['AUX', 'will have'], ['V', 'finished'], ['O', 'the course']], 0.5, 2.95, 9);
s.addText([{ text: 'Negativa  ', options: { bold: true, color: C.text1 } }, { text: "won't be + -ing  ·  won't have + particípio", options: { color: '4A5170', breakLine: true } },
  { text: 'Pergunta  ', options: { bold: true, color: C.text1 } }, { text: 'Will + S + be + -ing?  ·  Will + S + have + particípio?', options: { color: '4A5170' } }],
  { x: 0.5, y: 4.05, w: 9, h: 0.85, fontSize: 15, valign: 'middle', margin: 0, isTextBox: true, objectName: 'neg-q' });
s.addNotes('Cada cor é uma função: ADV rosa, S azul-marinho, AUX dourado, V verde-azulado, O coral. O AUX dourado é onde mora a diferença entre os dois tempos.');

// ---------- 6. Truque ODU ----------
s = pres.addSlide({ masterName: 'DARK_CONTENT', sectionTitle: 'Blocos' });
s.addText('Truque ODU: olhe o sinal', { placeholder: 'title' });
const trick = (x, col, big, sub, list) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.35, w: 4.3, h: 3.5, fill: { color: '17225C' }, line: { color: col, width: 2 }, rectRadius: 0.12, objectName: `trick-${big}` });
  s.addText(big, { x: x + 0.3, y: 1.55, w: 3.8, h: 0.9, fontSize: 32, bold: true, color: col, margin: 0, isTextBox: true, objectName: `trick-big-${big}` });
  s.addText(sub, { x: x + 0.3, y: 2.45, w: 3.7, h: 0.45, fontSize: 18, bold: true, color: 'FFFFFF', margin: 0, isTextBox: true, objectName: `trick-sub-${big}` });
  s.addText(list.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < list.length - 1 } })),
    { x: x + 0.3, y: 3.0, w: 3.7, h: 1.6, fontSize: 15, color: 'C9D3F2', paraSpaceAfter: 4, valign: 'top', margin: 0, isTextBox: true, objectName: `trick-list-${big}` });
};
trick(0.5, '4FE3FF', 'AT · THIS TIME', '→ will be + -ing', ['at 8 p.m. / at noon', 'this time tomorrow', 'this time next week']);
trick(5.2, 'E0A92E', 'BY · BY THE TIME', '→ will have + particípio', ['by June / by midnight', 'by the end of the year', 'by the time the party starts']);
s.addNotes('Regra prática: AT/THIS TIME pede continuous; BY/BY THE TIME pede perfect. E nunca misture: “will have be working” não existe.');

// ---------- 7. Monte a frase ----------
pres.addSection({ title: 'Prática' });
s = pres.addSlide({ masterName: 'LIGHT_CONTENT', sectionTitle: 'Prática' });
s.addText('Monte a frase', { placeholder: 'title' });
s.addText('“Até o fim do ano, ela já terá economizado dinheiro suficiente para a viagem.”', { x: 0.5, y: 1.2, w: 9, h: 0.6, fontSize: 18, italic: true, color: C.text1, margin: 0, isTextBox: true, objectName: 'pt-sentence' });
blocks(s, [['ADV', 'by the end of the year'], ['S', 'she'], ['AUX', 'will have'], ['V', 'saved'], ['O', 'enough money for the trip']], 0.5, 2.0, 9);
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 3.1, w: 2.6, h: 1.3, fill: { color: 'FDECEF' }, line: { color: BLK.ADV, width: 1.5, dashType: 'dash' }, rectRadius: 0.1, objectName: 'trap' });
s.addText([{ text: 'Bloco-armadilha', options: { fontSize: 13, bold: true, color: 'C62828', breakLine: true } }, { text: '“will be”', options: { fontSize: 22, bold: true, color: BLK.AUX } }],
  { x: 0.6, y: 3.1, w: 2.4, h: 1.3, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: 'trap-text' });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 3.4, y: 3.1, w: 6.1, h: 1.3, fill: { color: 'EDF7EE' }, line: { color: 'CFE6D1', width: 1 }, rectRadius: 0.1, objectName: 'answer' });
s.addText([{ text: '✓ By the end of the year she will have saved enough money for the trip.', options: { fontSize: 15, bold: true, color: '2E7D32', breakLine: true } },
  { text: 'Por quê? Ação concluída antes de um momento futuro → will have + particípio. BY = prazo final.', options: { fontSize: 13, color: '1B2240' } }],
  { x: 3.6, y: 3.1, w: 5.8, h: 1.3, valign: 'middle', margin: 0, isTextBox: true, objectName: 'answer-text' });
s.addNotes('Peça que montem a frase antes de mostrar os blocos. Destaque o bloco-armadilha: “will be” é do outro tempo.');

// ---------- 8. Complete (pergunta) ----------
const lacunas = [
  ['Don\'t call me at 8 — we ______ dinner then.', ['had had', 'are going to have had', 'will be having', 'will have had'], 2, 'No momento exato (at 8) a ação estará EM ANDAMENTO → Future Continuous.'],
  ['By the time you arrive, the film ______ (start).', ['will be starting', 'will start', 'has been starting', 'will have started'], 3, 'BY THE TIME → prazo final → Future Perfect: a ação já estará concluída.'],
];
lacunas.forEach(([q, opts, ok, why], qi) => {
  [false, true].forEach((reveal) => {
    s = pres.addSlide({ masterName: 'LIGHT_CONTENT', sectionTitle: 'Prática' });
    s.addText(reveal ? 'Complete a lacuna · resposta' : 'Complete a lacuna', { placeholder: 'title' });
    s.addText(q, { x: 0.5, y: 1.2, w: 9, h: 0.6, fontSize: 22, bold: true, color: C.text1, margin: 0, isTextBox: true, objectName: 'question' });
    opts.forEach((o, i) => {
      const x = 0.5 + (i % 2) * 4.6, y = 2.0 + Math.floor(i / 2) * 0.95;
      const good = reveal && i === ok;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 4.4, h: 0.75, fill: { color: good ? '2E7D32' : 'F4F6FC' }, line: { color: good ? '2E7D32' : 'DDE3F2' }, rectRadius: 0.1, objectName: `opt-${i}` });
      s.addText(`${'ABCD'[i]})  ${o}${good ? '  ✓' : ''}`, { x: x + 0.2, y, w: 4.0, h: 0.75, fontSize: 17, bold: good, color: good ? 'FFFFFF' : C.text1, valign: 'middle', margin: 0, isTextBox: true, objectName: `opt-text-${i}` });
    });
    if (reveal) s.addText([{ text: 'Por quê? ', options: { bold: true, color: C.accent1 } }, { text: why, options: { color: C.text1 } }], { x: 0.5, y: 4.1, w: 9, h: 0.6, fontSize: 15, margin: 0, isTextBox: true, objectName: 'why' });
    else s.addText('⏳ 20 segundos · vale 1 elixir', { x: 0.5, y: 4.1, w: 9, h: 0.6, fontSize: 15, italic: true, color: '8A8F9C', margin: 0, isTextBox: true, objectName: 'timer' });
    s.addNotes(reveal ? `Resposta: ${'ABCD'[ok]}) ${opts[ok]}. ${why}` : 'Dê 20 segundos. Os alunos levantam A, B, C ou D.');
  });
});

// ---------- Corrija o erro ----------
s = pres.addSlide({ masterName: 'LIGHT_CONTENT', sectionTitle: 'Prática' });
s.addText('Corrija o erro: os 3 vilões', { placeholder: 'title' });
[
  ['O BE que some', 'At 9 tomorrow I will working.', 'At 9 tomorrow I will be working.'],
  ['O particípio esquecido', 'By June we will have finish the course.', 'By June we will have finished the course.'],
  ['A mistura dos tempos', 'Will you have be working tomorrow?', 'Will you be working tomorrow?'],
].forEach(([h, bad, good], i) => {
  const x = 0.5 + i * 3.07;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.3, w: 2.85, h: 3.55, fill: { color: 'F4F6FC' }, line: { color: 'DDE3F2' }, rectRadius: 0.12, shadow: shadow(), objectName: `villain-${i}` });
  s.addText(h, { x: x + 0.2, y: 1.45, w: 2.45, h: 0.5, fontSize: 17, bold: true, color: C.accent1, margin: 0, isTextBox: true, objectName: `villain-head-${i}` });
  s.addText([{ text: '✗ ', options: { bold: true } }, { text: bad, options: { strike: 'sngStrike' } }], { x: x + 0.2, y: 2.05, w: 2.45, h: 1.2, fontSize: 15, color: 'C62828', valign: 'top', margin: 0, isTextBox: true, objectName: `villain-bad-${i}` });
  s.addText('✓ ' + good, { x: x + 0.2, y: 3.35, w: 2.45, h: 1.3, fontSize: 15, bold: true, color: '2E7D32', valign: 'top', margin: 0, isTextBox: true, objectName: `villain-good-${i}` });
});
s.addNotes('Três erros clássicos. Escolha be + -ing OU have + particípio — nunca os dois.');

// ---------- Rodada relâmpago ----------
s = pres.addSlide({ masterName: 'DARK_CONTENT', sectionTitle: 'Prática' });
s.addText('Rodada relâmpago: 📸 ou 🏁?', { placeholder: 'title' });
[
  ['This time tomorrow I ______ (fly) to Lisbon.', '📸 will be flying'],
  ['By Friday she ______ (finish) the report.', '🏁 will have finished'],
  ['At noon we ______ (have) lunch with the director.', '📸 will be having'],
  ['By the time you read this, I ______ (leave).', '🏁 will have left'],
].forEach(([q, a], i) => {
  const y = 1.3 + i * 0.9;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y, w: 9, h: 0.75, fill: { color: '17225C' }, line: { color: '2A3A86' }, rectRadius: 0.1, objectName: `rapid-${i}` });
  s.addText(q, { x: 0.75, y, w: 5.6, h: 0.75, fontSize: 17, color: 'FFFFFF', valign: 'middle', margin: 0, isTextBox: true, objectName: `rapid-q-${i}` });
  s.addText(a, { x: 6.4, y, w: 2.9, h: 0.75, fontSize: 17, bold: true, color: a.startsWith('📸') ? '4FE3FF' : 'E0A92E', align: 'right', valign: 'middle', margin: 0, isTextBox: true, objectName: `rapid-a-${i}` });
});
s.addNotes('Leia cada frase e peça que a turma grite “fotografia” ou “linha de chegada” antes de dizer o verbo. As respostas estão à direita (pode cobri-las ou revelar uma por vez com animação).');

// ---------- Encerramento ----------
pres.addSection({ title: 'Arena' });
s = pres.addSlide({ masterName: 'DARK_TITLE', sectionTitle: 'Arena' });
s.addText('ARENA LIBERADA', { x: 0.5, y: 1.05, w: 5.6, h: 0.35, fontSize: 13, bold: true, color: 'E85A9B', charSpacing: 4, margin: 0, isTextBox: true, objectName: 'kicker' });
s.addText('Hora da batalha', { placeholder: 'title' });
s.addText([
  { text: '1. Flashcards 3D: revise os 2 poderes', options: { breakLine: true } },
  { text: '2. Chrono Knight Arena: cada acerto = elixir', options: { breakLine: true } },
  { text: '3. Material ODU: desafio extra + missão final', options: {} },
], { placeholder: 'body' });
s.addShape(pres.shapes.OVAL, { x: 6.35, y: 0.75, w: 3.3, h: 3.3, fill: { color: 'E0A92E', transparency: 80 }, line: { color: 'E0A92E', width: 2 }, objectName: 'glow' });
s.addImage({ path: A('chrono-knight.png'), x: 6.55, y: 0.85, w: 2.9, h: 3.26, objectName: 'chrono-knight' });
s.addNotes('Abra flashcards/index.html para revisão rápida e depois game/index.html para a batalha. Para casa: Desafio extra (13–20) e Missão final do material DOCX.');

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log('wrote', OUT);
})();
