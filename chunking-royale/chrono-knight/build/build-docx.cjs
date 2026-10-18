// Gera o material DOCX "Chrono Knight" no estilo ODU Creative.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType, PageNumber,
  PageBreak, VerticalAlign, TableLayoutType,
} = require('docx');

const ROOT = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'content.json'), 'utf8'));

const C = {
  blue: '2E5FD0', navy: '1E2A5E', red: 'C62828', green: '2E7D32', greenBg: 'EDF7EE',
  gray: '8A8F9C', line: 'B9BFCC', gold: 'D4A83A', cyan: '1FB6D9',
  ADV: 'C8476B', S: '1E2A5E', AUX: 'D4A83A', V: '2E8B8B', O: 'E8735A',
};
const FONT = 'Arial';
const PAGE_W = 11906, MARGIN = 1134; // A4, margens de 2 cm
const CONTENT_W = PAGE_W - 2 * MARGIN;

const t = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || 20, ...o });
const p = (children, o = {}) => new Paragraph({ children: Array.isArray(children) ? children : [children], spacing: { after: 80 }, ...o });
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };

// "1. MONTE A FRASE" — número azul-marinho + rótulo vermelho espaçado
function sectionLabel(n, label) {
  return p([t(`${n}. `, { bold: true, color: C.navy, size: 22 }), t(label.toUpperCase(), { bold: true, color: C.red, size: 16, characterSpacing: 40 })],
    { spacing: { before: 240, after: 60 }, keepNext: true });
}

// Caixa de resposta: borda verde à esquerda, fundo verde claro, contorno tracejado
function answerBox(lines) {
  const dashed = { style: BorderStyle.DASHED, size: 4, color: C.line };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: C.greenBg, color: 'auto' },
      margins: { top: 100, bottom: 100, left: 180, right: 140 },
      borders: { top: dashed, bottom: dashed, right: dashed, left: { style: BorderStyle.SINGLE, size: 24, color: C.green } },
      children: lines,
    })] })],
  });
}
const spacer = (after = 120) => new Paragraph({ children: [], spacing: { after } });

function labelLine(label, color, text) {
  return p([t(label + ' ', { bold: true, color, size: 18 }), t(text, { size: 18 })], { spacing: { after: 40 } });
}

// Blocos coloridos (rótulo de função + chunk)
function blockTable(blocks) {
  const weights = blocks.map(([, txt]) => Math.max(txt.length, 5) + 4);
  const sum = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => Math.floor((w / sum) * CONTENT_W));
  widths[widths.length - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);
  const white = { style: BorderStyle.SINGLE, size: 12, color: 'FFFFFF' };
  const cell = (fill, txt, w, o) => new TableCell({
    width: { size: w, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
    shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
    margins: { top: 50, bottom: 50, left: 60, right: 60 },
    borders: { top: white, bottom: white, left: white, right: white },
    children: [p(t(txt, { color: 'FFFFFF', bold: true, ...o }), { alignment: AlignmentType.CENTER, spacing: { after: 0 } })],
  });
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({ children: blocks.map(([k], i) => cell(C[k], k, widths[i], { size: 14 })) }),
      new TableRow({ children: blocks.map(([k, v], i) => cell(C[k], v, widths[i], { size: 18 })) }),
    ],
  });
}

function option(letter, text, correct) {
  return p([t(`${letter}) `, { bold: correct, color: correct ? C.green : '333333', size: 19 }), t(text, { bold: correct, color: correct ? C.green : '333333', size: 19 }),
    ...(correct ? [t('  ✓', { bold: true, color: C.green, size: 19 })] : [])], { indent: { left: 280 }, spacing: { after: 30 }, keepNext: true, keepLines: true });
}

function img(file, w, h) {
  return new ImageRun({ type: 'png', data: fs.readFileSync(path.join(ROOT, 'assets', file)), transformation: { width: w, height: h } });
}

// ---------- Capa / carta do personagem ----------
const children = [];
children.push(p(t('Chrono Knight', { bold: true, color: C.blue, size: 56 }), { spacing: { after: 40 } }));
children.push(p([t('Future Continuous × Future Perfect', { bold: true, color: C.blue, size: 20 }), t('     Fonte: Unit 21     Custo: 3 elixir', { color: C.gray, size: 18 })],
  { border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.blue, space: 6 } }, spacing: { after: 240 } }));

const cardW = 3400, infoW = CONTENT_W - cardW;
const stat = (k, v) => p([t(k + ': ', { bold: true, color: C.navy, size: 19 }), t(v, { size: 19 })], { spacing: { after: 60 } });
children.push(new Table({
  width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [cardW, infoW], borders: noBorders,
  rows: [new TableRow({ children: [
    new TableCell({ width: { size: cardW, type: WidthType.DXA }, borders: noBorders, verticalAlign: VerticalAlign.CENTER,
      children: [p(img('chrono-knight.png', 200, 225), { alignment: AlignmentType.CENTER })] }),
    new TableCell({ width: { size: infoW, type: WidthType.DXA }, borders: noBorders, verticalAlign: VerticalAlign.CENTER, margins: { left: 200 },
      children: [
        p(t('CARTA DO PERSONAGEM', { bold: true, color: C.red, size: 16, characterSpacing: 40 })),
        stat('Raridade', 'Épica · Tropa terrestre'),
        stat('Custo', '3 elixir'),
        stat('Poder', 'domina o tempo: enxerga uma ação EM ANDAMENTO no futuro (fotografia) ou JÁ CONCLUÍDA antes de um prazo (linha de chegada).'),
        stat('Habilidade especial', 'Time Freeze — 3 acertos seguidos congelam as tropas inimigas.'),
        stat('Fraqueza', 'misturar os dois tempos (“will have be…”, “will be finished” no lugar de “will have finished”).'),
      ] }),
  ] })],
}));
children.push(spacer(200));

children.push(p(t('MISSÃO DE HOJE', { bold: true, color: C.red, size: 16, characterSpacing: 40 })));
[
  'Reconhecer quando o futuro é uma FOTOGRAFIA (ação em andamento) ou uma LINHA DE CHEGADA (ação concluída).',
  'Montar frases com os blocos ADV · S · AUX · V · O sem cair no bloco-armadilha.',
  'Corrigir os erros clássicos: o BE que some, o particípio esquecido, a mistura dos dois tempos.',
].forEach((s, i) => children.push(p([t(`${i + 1}  `, { bold: true, color: C.blue }), t(s, { size: 19 })], { indent: { left: 200 } })));

// ---------- Teoria ----------
children.push(spacer(120));
children.push(p(t('O PODER DO CHRONO KNIGHT', { bold: true, color: C.red, size: 16, characterSpacing: 40 }), { keepNext: true }));
const colW = Math.floor(CONTENT_W / 2);
const thin = { style: BorderStyle.SINGLE, size: 4, color: C.line };
const thinB = { top: thin, bottom: thin, left: thin, right: thin };
const head = (fill, title, sub) => new TableCell({
  width: { size: colW, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill, color: 'auto' }, borders: thinB,
  margins: { top: 100, bottom: 100, left: 140, right: 140 },
  children: [p(t(title, { bold: true, color: 'FFFFFF', size: 24 }), { spacing: { after: 20 } }), p(t(sub, { color: 'FFFFFF', size: 17 }), { spacing: { after: 0 } })],
});
const body = (rows) => new TableCell({
  width: { size: colW, type: WidthType.DXA }, borders: thinB, margins: { top: 100, bottom: 100, left: 140, right: 140 },
  children: rows.map(([k, v]) => p([t(k + ' ', { bold: true, color: C.navy, size: 18 }), t(v, { size: 18 })], { spacing: { after: 70 } })),
});
children.push(new Table({
  width: { size: colW * 2, type: WidthType.DXA }, columnWidths: [colW, colW],
  rows: [
    new TableRow({ tableHeader: true, children: [head(C.V, 'Future Continuous', '📸 fotografia de um momento futuro'), head(C.blue, 'Future Perfect', '🏁 linha de chegada antes de um prazo')] }),
    new TableRow({ cantSplit: true, children: [
      body([['Forma:', 'S + will be + verbo-ing'], ['Uso:', 'ação EM ANDAMENTO num ponto exato do futuro; pergunta educada sobre planos.'],
        ['Sinais:', 'at 8 p.m. · this time tomorrow · this time next week · at noon'],
        ['(+)', 'At 9 tomorrow I will be working.'], ['(–)', "I won't be sleeping when you arrive."], ['(?)', 'Will you be using your laptop this afternoon?']]),
      body([['Forma:', 'S + will have + particípio'], ['Uso:', 'ação JÁ CONCLUÍDA antes de um momento futuro.'],
        ['Sinais:', 'by June · by the end of the year · by the time… · by midnight'],
        ['(+)', 'By June we will have finished the course.'], ['(–)', "He won't have arrived by the time the party starts."], ['(?)', 'Will they have arrived by 6?']]),
    ] }),
  ],
}));
children.push(spacer(160));
children.push(answerBox([
  p(t('⚔ Truque ODU', { bold: true, color: C.green, size: 19 }), { spacing: { after: 40 } }),
  labelLine('AT / THIS TIME →', C.navy, 'continuous (will be + -ing).  BY / BY THE TIME → perfect (will have + particípio).'),
  labelLine('Nunca misture:', C.red, 'escolha be + -ing OU have + particípio. “Will have be working” não existe.'),
]));
children.push(spacer(120));

// Legenda dos blocos
children.push(p(t('LEGENDA DOS BLOCOS', { bold: true, color: C.red, size: 16, characterSpacing: 40 }), { keepNext: true }));
children.push(blockTable([['ADV', 'advérbio / tempo'], ['S', 'sujeito'], ['AUX', 'auxiliar'], ['V', 'verbo principal'], ['O', 'objeto / complemento']]));
children.push(p(t('Bloco-armadilha = o auxiliar do OUTRO tempo. Ele parece certo, mas quebra a frase.', { italics: true, color: C.gray, size: 17 }), { spacing: { before: 80 } }));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ---------- 1–4 Monte a frase ----------
let n = 1;
data.monte.forEach((e) => {
  children.push(sectionLabel(n++, 'Monte a frase'));
  children.push(p([t('Frase em português: ', { bold: true, size: 19 }), t(`“${e.pt}”`, { size: 19 })], { keepNext: true }));
  children.push(p(t('Resposta em blocos:', { bold: true, color: C.navy, size: 18 }), { keepNext: true, spacing: { after: 40 } }));
  children.push(blockTable(e.blocks));
  children.push(spacer(80));
  const lines = [p(t('✓ ' + e.answer, { bold: true, color: C.green, size: 19 }), { spacing: { after: 40 } })];
  if (e.also) lines.push(labelLine('Também aceita:', C.navy, e.also));
  lines.push(labelLine('Bloco-armadilha:', C.red, e.trap));
  lines.push(labelLine('Por quê?', C.navy, e.why));
  children.push(answerBox(lines));
});

// ---------- 5–8 Complete a lacuna ----------
data.lacuna.forEach((e) => {
  children.push(sectionLabel(n++, 'Complete a lacuna'));
  children.push(p(t(e.q, { bold: true, size: 21 }), { keepNext: true }));
  e.opts.forEach((o, i) => children.push(option('ABCD'[i], o, i === e.ok)));
  children.push(new Paragraph({ children: [], spacing: { after: 60 }, keepNext: true }));
  children.push(answerBox([
    p(t(`✓ Resposta: ${'ABCD'[e.ok]}) ${e.opts[e.ok]}`, { bold: true, color: C.green, size: 19 }), { spacing: { after: 40 } }),
    labelLine('Por quê?', C.navy, e.why),
  ]));
});

// ---------- 9–12 Corrija o erro ----------
data.corrija.forEach((e) => {
  children.push(sectionLabel(n++, 'Corrija o erro'));
  children.push(p([t('Frase com erro: ', { bold: true, size: 19 }), t(e.wrong, { bold: true, color: C.red, size: 21 })], { keepNext: true }));
  e.opts.forEach((o, i) => children.push(option('ABC'[i], o, i === e.ok)));
  children.push(new Paragraph({ children: [], spacing: { after: 60 }, keepNext: true }));
  children.push(answerBox([
    p(t(`✓ Resposta: ${'ABC'[e.ok]}) ${e.opts[e.ok]}`, { bold: true, color: C.green, size: 19 }), { spacing: { after: 40 } }),
    labelLine('Por quê?', C.navy, e.why),
  ]));
});

// ---------- 13–20 Desafio extra (para o aluno) ----------
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(p(t('Desafio extra · Arena livre', { bold: true, color: C.blue, size: 36 }), { spacing: { after: 40 } }));
children.push(p(t('Agora sem alternativas: escreva a forma correta do verbo. Cada acerto vale 1 elixir.', { color: C.gray, size: 19 }), { spacing: { after: 160 } }));
data.extra.forEach((e) => {
  children.push(sectionLabel(n++, 'Lacuna aberta'));
  children.push(p(t(e.q, { bold: true, size: 21 })));
  children.push(p(t(' ', { size: 19 }), { border: { bottom: { style: BorderStyle.DOTTED, size: 6, color: C.line, space: 2 } }, spacing: { after: 100 } }));
});

children.push(sectionLabel(n++, 'Missão final · Produção'));
children.push(p(t('Escreva 3 frases sobre a SUA semana que vem: 1 com THIS TIME (continuous), 1 com BY (perfect) e 1 pergunta educada com “Will you be…?”.', { size: 19 })));
for (let i = 0; i < 3; i++) children.push(spacer(0), p(t(`${i + 1}. `, { bold: true, color: C.blue }), { border: { bottom: { style: BorderStyle.DOTTED, size: 6, color: C.line, space: 2 } }, spacing: { before: 200, after: 60 } }));

// ---------- Gabarito ----------
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(p(t('Gabarito · Desafio extra', { bold: true, color: C.blue, size: 36 }), { spacing: { after: 160 } }));
data.extra.forEach((e, i) => {
  children.push(answerBox([
    p([t(`${13 + i}. `, { bold: true, color: C.navy, size: 19 }), t('✓ ' + e.full, { bold: true, color: C.green, size: 19 }), t('   (' + e.ok + ')', { color: C.gray, size: 17 })], { spacing: { after: 40 } }),
    labelLine('Por quê?', C.navy, e.why),
  ]));
  children.push(spacer(100));
});
children.push(p(t('Pronto para a arena? Abra os flashcards e o jogo “Chrono Knight Arena” e aplique o que você treinou.', { italics: true, color: C.gray, size: 18 }), { spacing: { before: 120 } }));

// ---------- Documento ----------
const header = new Header({ children: [p([t('Chunking Royale · Banco de frases e respostas · ', { color: C.gray, size: 14 }), t('ODU', { color: C.red, bold: true, size: 14 })], { alignment: AlignmentType.RIGHT })] });
const footer = new Footer({ children: [p([t('Material autoral ODU · Professor Diego Horta · página ', { color: C.gray, size: 14 }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 14, color: C.gray })], { alignment: AlignmentType.CENTER })] });

const doc = new Document({
  creator: 'Professor Diego Horta · ODU', title: 'Chrono Knight · Future Continuous × Future Perfect',
  styles: { default: { document: { run: { font: FONT, size: 20 } } } },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    headers: { default: header }, footers: { default: footer }, children,
  }],
});
Packer.toBuffer(doc).then((buf) => {
  const out = path.join(ROOT, 'Chrono_Knight_Future_Continuous_x_Future_Perfect.docx');
  fs.writeFileSync(out, buf);
  console.log('wrote', out);
});
