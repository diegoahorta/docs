/**
 * MÓDULO 8 — DOCUMENT GENERATOR (apostila ODU CREATIVE em DOCX).
 *
 * Funciona no navegador (window.docx, vendor/docx.iife.js) e no Node (import 'docx').
 * buildApostila(docx, unit, { version: 'student' | 'teacher', audioBaseUrl, qr: { [trackId]: Uint8Array PNG } })
 *
 * O DOCX NÃO incorpora áudio: inclui links (e QR codes, quando gerados pelo script Node) para os
 * arquivos hospedados. Sem URL pública, indica onde o áudio está na plataforma.
 */

import { paren, romaji, plain } from './jp.js';

const BRAND = '5B3DF5';
const ACCENT = 'FF6B4A';
const GREY = '6C6884';
const W = 9000; // largura útil (twips) para A4 com margens de ~2,5 cm

export function buildApostila(docx, unit, opts = {}) {
  const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType,
    ExternalHyperlink, ImageRun, Header, Footer, PageNumber, BorderStyle, PageBreak, LevelFormat } = docx;
  const teacher = opts.version === 'teacher';
  const base = (opts.audioBaseUrl ?? unit.audioBaseUrl ?? '').trim();
  const lang = unit.language;
  const qs = (stage) => unit.questions.filter((q) => q.stage === stage);
  let sec = 0;
  const L = 'abcdefgh';

  /* ---------- helpers ---------- */
  const ja = lang.code === 'ja';
  // Japonês: o DOCX não usa ruby; o furigana vira leitura entre parênteses: 先生(せんせい)
  const fmtText = (x) => (ja ? paren(String(x ?? '')) : String(x ?? ''));
  const t = (text, o = {}) => new TextRun({ text: fmtText(text), ...o });
  const money = (v) => (unit.menu.currencySuffix ? `${Number(v).toFixed(unit.menu.decimals ?? 0)}${unit.menu.currencySuffix}` : `${unit.menu.currency ?? '$'}${Number(v).toFixed(unit.menu.decimals ?? 2)}`);
  const exText = (ex) => ex.text ?? ex.en;
  const join = ja ? '' : ' ';
  const p = (children, o = {}) => new Paragraph({ spacing: { after: 120 }, ...o, children: (Array.isArray(children) ? children : [children]).map((c) => (typeof c === 'string' ? t(c) : c)) });
  const h1 = (text) => { sec++; return new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: sec > 1, spacing: { before: 120, after: 200 }, children: [t(`${sec}. ${text}`)] }); };
  const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [t(text)] });
  const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 }, children: [t(text)] });
  const bullet = (children) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, children: (Array.isArray(children) ? children : [children]).map((c) => (typeof c === 'string' ? t(c) : c)) });
  const lines = (n) => Array.from({ length: n }, () => p(t('_'.repeat(78), { color: 'BBBBBB' }), { spacing: { after: 160 } }));
  const note = (text, color = BRAND) => new Paragraph({
    spacing: { before: 80, after: 160 }, shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F0EEF8' },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color, space: 8 } }, children: [t(text, { size: 20 })],
  });
  const teacherNote = (text) => (teacher ? [note(`👩‍🏫 Orientação ao professor: ${text}`, ACCENT)] : []);
  function table(headers, rows, widths) {
    const n = headers.length;
    const ws = widths || Array(n).fill(Math.floor(W / n));
    const cell = (text, i, head) => new TableCell({
      width: { size: ws[i], type: WidthType.DXA },
      shading: head ? { type: ShadingType.CLEAR, color: 'auto', fill: 'ECE8FF' } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: fmtText(text).split('\n').map((line) => new Paragraph({ children: [new TextRun({ text: line, bold: head, size: 20 })] })),
    });
    return new Table({
      width: { size: W, type: WidthType.DXA }, columnWidths: ws,
      rows: [new TableRow({ tableHeader: true, children: headers.map((x, i) => cell(x, i, true)) }), ...rows.map((r) => new TableRow({ children: r.map((x, i) => cell(x, i, false)) }))],
    });
  }
  const audioLink = (track) => {
    if (!base) return [p([t('🎧 Áudio: ', { bold: true }), t(`disponível na plataforma ODU CREATIVE (módulo Listening, faixa “${track.title}”, arquivo ${track.audio}).`)])];
    const url = base.replace(/\/?$/, '/') + track.audio;
    const out = [p([t('🎧 Áudio (link): ', { bold: true }), new ExternalHyperlink({ link: url, children: [t(url, { style: 'Hyperlink' })] })])];
    if (opts.qr?.[track.id]) out.push(new Paragraph({ children: [new ImageRun({ type: 'png', data: opts.qr[track.id], transformation: { width: 110, height: 110 } })] }), p(t('Aponte a câmera do celular para o QR code para ouvir.', { size: 18, color: GREY })));
    return out;
  };

  /* ---------- questões para impressão ---------- */
  function printQuestion(q, n) {
    const out = [p([t(`${n}. `, { bold: true }), ...String(q.prompt).split('\n').flatMap((line, i) => (i ? [t(line, { break: 1 })] : [t(line)]))], { spacing: { before: 120, after: 80 }, keepNext: true })];
    if (q.audio) {
      const track = unit.tracks.find((x) => x.id === q.audio.track);
      const segs = q.audio.segments.map((id) => track.segments.findIndex((s) => s.id === id) + 1).join(', ');
      out.push(p(t(`🎧 Ouça: “${track.title}”, fala(s) ${segs}.`, { italics: true, size: 18, color: GREY })));
    }
    switch (q.type) {
      case 'mcq': q.options.forEach((o, i) => out.push(p(`   ( ) ${L[i]}) ${o}`, { spacing: { after: 40 } }))); break;
      case 'tf': out.push(p('   ( ) Verdadeiro      ( ) Falso')); break;
      case 'gap': out.push(p(q.text.replace(/___/g, '__________'))); break;
      case 'order': out.push(p([t('Blocos: '), t(q.tiles.join('  /  '), { bold: true })]), ...lines(1)); break;
      case 'transform': out.push(p([t('Frase original: '), t(q.source, { bold: true })]), ...lines(1)); break;
      case 'match': {
        const rights = [...q.pairs.map((x) => x[1])].sort();
        out.push(table(['Pergunta', 'Letra', 'Respostas'], q.pairs.map((x, i) => [`${i + 1}. ${x[0]}`, '( )', `${L[i]}) ${rights[i]}`]), [3800, 900, 4300]));
        break;
      }
      case 'produce': out.push(...lines(q.multiline ? 6 : 2)); break;
    }
    return out;
  }
  function answerText(q) {
    switch (q.type) {
      case 'mcq': return `${L[q.answer]}) ${q.options[q.answer]}`;
      case 'tf': return q.answer ? 'Verdadeiro' : 'Falso';
      case 'gap': return q.answers.map((a) => a[0]).join(' / ');
      case 'order': case 'transform': return q.answers[0].replace(/^./, (c) => c.toUpperCase());
      case 'match': {
        const rights = [...q.pairs.map((x) => x[1])].sort();
        return q.pairs.map((x, i) => `${i + 1}-${L[rights.indexOf(x[1])]}`).join(', ');
      }
      case 'produce': return `Resposta pessoal. Modelo: ${q.model}`;
      default: return '';
    }
  }

  const children = [];
  const push = (...x) => children.push(...x.flat());

  /* 1. CAPA */
  sec++;
  push(
    new Paragraph({ spacing: { before: 1800 }, alignment: AlignmentType.CENTER, children: [t('ODU', { bold: true, size: 72, color: BRAND }), t(' CREATIVE', { size: 72, color: '1D1A2B' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [t('Universal Language Learning Engine', { size: 24, color: GREY })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [t(`${ja ? 'LIÇÃO' : 'UNIDADE'} ${unit.unitNumber || 1}`, { bold: true, size: 28, color: ACCENT })] }),
    ...(unit.titleNative ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [t(unit.titleNative, { bold: true, size: 56, color: BRAND })] })] : []),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [t(unit.title, { bold: true, size: unit.titleNative ? 44 : 64 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [t(unit.subtitle, { size: 28 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [t(`${lang.name} · Nível ${unit.level} (QECR) · ${unit.age} anos`, { size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 }, children: [t(teacher ? 'VERSÃO DO PROFESSOR — com gabarito e orientações' : 'VERSÃO DO ALUNO', { bold: true, size: 24, color: teacher ? ACCENT : BRAND })] }),
    ...(teacher ? [] : [p('Nome: ______________________________________   Turma: ________   Data: ___/___/_____')]),
  );

  /* 2. IDENTIFICAÇÃO */
  push(h1('Identificação da unidade'), table(['Campo', 'Informação'], [
    ['Marca', unit.brand], ['Idioma-alvo', `${lang.name} (${lang.bcp47})`], ['Nível', unit.level], ['Faixa etária', `${unit.age} anos`],
    ['Habilidades', unit.skills.join(', ')], ['Objetivo comunicativo', unit.communicativeGoal], ['Idioma das explicações', 'Português brasileiro'],
    ['Fluxo pedagógico', 'INPUT → INTAKE → OUTPUT → FEEDBACK → REVIEW'], ['Avaliação de referência', unit.assessment.reference],
    ...(unit.sourceNote ? [['Material de referência', unit.sourceNote]] : []),
    ...(ja ? [['Leitura do japonês', 'Kanji com leitura entre parênteses (furigana) e romaji no vocabulário, na transcrição e nos exemplos.']] : []),
  ], [2600, 6400]));
  push(...teacherNote('Carga sugerida: 4 a 5 aulas de 50 min — (1) escuta + Café Quest, (2) descoberta e Grammar Lab, (3) prática A–C, (4) prática D + speaking, (5) avaliação e revisão. A plataforma digital registra o progresso no dispositivo do aluno; peça a exportação do progresso (JSON) para consolidar resultados no Painel do Professor.'));

  /* 3. OBJETIVOS */
  push(h1('Objetivos de aprendizagem'), p('Ao final desta unidade, você será capaz de:'), unit.objectives.map((o) => bullet(o)));

  /* 4. VOCABULÁRIO */
  push(h1('Vocabulário contextualizado'), p('Leia as palavras e os exemplos. Na plataforma, toque em 🔊 para ouvir.'),
    table([lang.name, ja ? 'Leitura (romaji)' : 'Pronúncia', 'Português', 'Exemplo em contexto'], unit.vocabulary.map((v) => [v.article && !v.term.includes('/') && !/[?.]$/.test(v.term) ? `${v.article} ${v.term}` : v.term, ja ? romaji(v.term) : v.pron || '', v.pt, v.example || '']), [2000, 1900, 1800, 3300]),
    h2('Cardápio — ' + unit.menu.name),
    table(['Item', 'Preço'], unit.menu.sections.flatMap((s) => s.items.map((i) => [[i.article, i.name].filter(Boolean).join(' '), i.sizes ? Object.entries(i.sizes).map(([k, v]) => `${k} ${money(v)}`).join(' · ') : money(i.price)])), [5000, 4000]));

  /* 5. LISTENING */
  push(h1('Texto ou diálogo de listening'),
    note('Estratégia: 1ª escuta — ideia geral, sem texto. 2ª escuta — informações específicas. 3ª escuta — acompanhe a transcrição (seção 6). 4ª etapa — repita e faça shadowing.'));
  unit.tracks.forEach((tr, i) => {
    push(h2(`Faixa ${i + 1}: ${tr.title}`), p([t('Situação: ', { bold: true }), t(tr.situation)]), p([t('Objetivo: ', { bold: true }), t(tr.goal)]), audioLink(tr),
      h3('1ª escuta — ideia geral'), tr.gist.flatMap((id, k) => printQuestion(unit.questions.find((q) => q.id === id), k + 1)),
      h3('2ª escuta — informações específicas'), tr.detail.flatMap((id, k) => printQuestion(unit.questions.find((q) => q.id === id), k + 1)));
  });
  push(...teacherNote('Toque o áudio completo na 1ª escuta sem projetar o texto. Na 2ª, pause após cada informação-chave. Só mostre a transcrição na 3ª escuta.'));

  /* 6. TRANSCRIÇÃO E TRADUÇÃO */
  push(h1('Transcrição e tradução'));
  unit.tracks.forEach((tr, i) => push(h2(`Faixa ${i + 1}: ${tr.title}`),
    table(['#', 'Tempo', `Fala (${lang.name.toLowerCase()})`, 'Tradução'], tr.segments.map((s, k) => [String(k + 1), `${fmt(s.start)}–${fmt(s.end)}`, `${s.speaker}: ${s.text}${ja ? `\n${romaji(s.text)}` : ''}`, s.pt]), [500, 1300, 3800, 3400])));

  /* 7. GRAMÁTICA */
  push(h1('Explicação gramatical'), note('Sugestão: faça primeiro a Descoberta dos padrões (seção 8) e depois volte aqui para confirmar suas hipóteses.'));
  unit.grammar.forEach((g) => {
    push(h2(g.name), p([t('Função comunicativa: ', { bold: true }), t(g.function)]), p([t('Forma: ', { bold: true }), t(g.form, { bold: true, color: BRAND })]), p(g.explanation));
    if (g.table) push(table(g.table.headers, g.table.rows));
    push(h3('Exemplos'), g.examples.map((ex) => bullet([t(exText(ex), { bold: true }), ...(ja ? [t(`  [${romaji(exText(ex))}]`, { italics: true, color: GREY })] : []), t(` — ${ex.pt}`)])));
    if (g.comparison) push(note(`${g.comparison.title}: ${g.comparison.text}`));
    push(h3('Erros frequentes'), g.commonErrors.map((e) => bullet([t('✗ ' + e.wrong, { strike: true, color: 'C93A2B' }), t('  →  '), t('✓ ' + e.right, { bold: true, color: '12A586' }), t(`  (${e.why})`)])));
    push(p([t('Uso: ', { bold: true }), t(g.usage)]));
    if (g.pronunciation) push(p([t(ja ? 'Leitura e pronúncia: ' : 'Pronúncia: ', { bold: true }), t(g.pronunciation)]));
    push(h3('Verificação rápida'), ...printQuestion({ ...g.check, type: 'mcq' }, 1));
  });

  /* 8. DESCOBERTA */
  const d = unit.discover;
  push(h1('Descoberta dos padrões'), p(d.intro),
    h2('Observe'), d.sentences.map((s, i) => p(`${i + 1}. ${s.chunks.map((c) => c[0]).join(join).replace(/\s+([,?.])/g, '$1').replace(/ '/g, "'")}`)),
    h2('Compare e responda'), d.questions.flatMap((q, i) => printQuestion({ ...q, type: 'mcq' }, i + 1)),
    h2('Monte as frases'), d.reorder.flatMap((r, i) => [p([t(`${i + 1}. Blocos: `), t(r.tiles.slice().sort().join('  /  '), { bold: true })]), ...lines(1)]),
    h2('Minha hipótese'), p('Com suas palavras: como se faz um pedido? Quando usamos a e quando usamos an?'), ...lines(4),
    h2('A regra (confira depois de escrever sua hipótese)'),
    p(t([...d.pattern].join('  +  '), { bold: true, color: BRAND })),
    d.patternQuestion ? p(t(d.patternQuestion.join('  +  '), { bold: true, color: BRAND })) : [],
    d.ruleSteps.map((s, i) => bullet(`Passo ${i + 1}: ${s}`)));

  /* 9. CHUNKS */
  push(h1('Quadros de chunks'), p('Chunks são blocos de palavras que usamos juntos. Aprenda-os como unidades.'),
    table(['Parte do padrão', 'Função', 'Exemplos'], d.chunkLegend.map((c) => {
      const ex = [...new Set(d.sentences.flatMap((s) => s.chunks.filter((x) => x[1] === c.role).map((x) => x[0].replace(/^[,\s]+/, ''))))].join(' · ');
      return [c.label, c.pt, ex];
    }), [2200, 2600, 4200]),
    h2('Chunks da cafeteria'),
    table(['Chunk', 'Significado', 'Exemplo'], unit.vocabulary.filter((v) => v.category === 'chunks' || v.category === 'sizes').map((v) => [v.term, v.pt, v.example]), [2600, 2600, 3800]));

  /* 10. EXERCÍCIOS */
  push(h1('Exercícios progressivos'));
  const stageNames = { A: 'Etapa A — Reconhecimento', B: 'Etapa B — Compreensão', C: 'Etapa C — Manipulação', D: 'Etapa D — Produção' };
  for (const s of ['A', 'B', 'C', 'D']) push(h2(stageNames[s]), qs(s).flatMap((q, i) => printQuestion(q, i + 1)));

  /* 11. AVALIAÇÃO */
  push(h1('Questões no estilo da avaliação de referência'), note(`${unit.assessment.reference}. ${unit.assessment.note}`));
  qs('exam').forEach((q, i) => push(p(t(q.examPart || '', { size: 18, color: GREY, italics: true })), printQuestion(q, i + 1)));

  /* 12. CONVERSAÇÃO */
  const spk = unit.speaking;
  push(h1('Atividades de conversação'),
    h2('1. Listen e 2. Repeat'), p('Ouça e repita cada frase em voz alta:'), spk.repeatSegments.map((id) => { const s = unit.tracks.flatMap((x) => x.segments).find((x) => x.id === id); return bullet(s ? s.text : id); }),
    h2('3. Shadow'), p('Fale junto com o áudio da faixa 1, imitando ritmo e entonação.'),
    h2('4. Substitute'), p(t(spk.substitution.frame.replace(/\{(article|choice)\}/, (spk.substitution.choices || ['a', 'an']).map(plain).join(' / ')).replace('{item}', '______'), { bold: true })),
    table(['Item / situação', `${spk.substitution.choiceLabel || 'Artigo correto'} (escreva)`], spk.substitution.items.map((x) => [x.cue ? `${x.item} — ${x.cue}` : x.item, teacher ? (x.choice ?? x.article) : '______']), [5000, 4000]),
    h2('5. Respond'), spk.respond.map((r) => { const s = unit.tracks.flatMap((x) => x.segments).find((x) => x.id === r.segment); return bullet([t(`${s?.speaker || ''}: “${s?.text}” `, { bold: true }), t(`→ ${r.hint}`), ...(teacher ? [t(`  (ex.: ${r.model})`, { italics: true, color: GREY })] : [])]); }),
    h2('6. Create — role-play'), p(spk.create.prompt), h3('Autoavaliação'), spk.create.checklist.map((c) => p(`☐ ${c}`)));
  push(...teacherNote('Avalie a comunicação (a atendente entenderia o pedido?) e o uso das estruturas, não o sotaque. A transcrição automática da plataforma é apenas um apoio para o aluno e não deve ser usada como nota de pronúncia.'));

  /* 13. ESCRITA */
  push(h1('Produção escrita'), p(unit.writing.prompt), ...lines(8), h3('Checklist'), unit.writing.checklist.map((c) => p(`☐ ${c}`)));
  push(...teacherNote(unit.writing.teacherCriteria || 'Critérios sugeridos (0–2 cada): adequação à tarefa; uso de I\'d like / Can I have; a/an; vocabulário do cardápio; coerência do preço total; cortesia.'));

  /* 14–15. GABARITO E DISTRATORES */
  const allQs = [
    ...unit.tracks.flatMap((tr) => [...tr.gist, ...tr.detail].map((id) => ['Listening', unit.questions.find((q) => q.id === id)])),
    ...['A', 'B', 'C', 'D', 'exam'].flatMap((s) => qs(s).map((q) => [s === 'exam' ? 'Avaliação' : `Etapa ${s}`, q])),
  ];
  if (teacher) {
    push(h1('Gabarito comentado'));
    let lastGroup = '';
    let n = 0;
    for (const [group, q] of allQs) {
      if (group !== lastGroup) { push(h2(group)); lastGroup = group; n = 0; }
      n++;
      push(p([t(`${n}. `, { bold: true }), t(answerText(q), { bold: true, color: '12A586' })], { spacing: { after: 20 } }), p(t(q.explanation || '', { size: 20 }), { spacing: { after: 100 } }));
    }
    push(h2('Descoberta'), d.questions.map((q, i) => bullet(`${i + 1}. ${L[q.answer]}) ${q.options[q.answer]} — ${q.feedback}`)), d.reorder.map((r) => bullet(r.answer)));
    push(h2('Verificações do Grammar Lab'), unit.grammar.map((g) => bullet(`${g.name}: ${L[g.check.answer]}) ${g.check.options[g.check.answer]} — ${g.check.explanation}`)));
    push(h1('Justificativas dos distratores'), table(['Questão', 'Alternativa', 'Por que está incorreta'],
      allQs.filter(([, q]) => q.distractors).flatMap(([group, q]) => Object.entries(q.distractors).map(([i, why]) => [`${group} — ${q.prompt.split('\n')[0].slice(0, 60)}`, `${L[i]}) ${q.options[i]}`, why])), [3000, 2400, 3600]));
  } else {
    push(h1('Gabarito comentado'), note('O gabarito comentado está na versão do professor. Na plataforma digital, cada questão mostra a correção comentada depois que você responde.'));
    push(h1('Justificativas dos distratores'), note('Disponível na versão do professor e no feedback da plataforma.'));
  }

  /* 16. PLANO DE REVISÃO */
  const iv = unit.config?.srsIntervalsDays || [1, 2, 4, 7, 14];
  const skillsByReview = (unit.reviewItems || []);
  push(h1('Plano de revisão'), p('Revisar em intervalos crescentes ajuda a guardar o conteúdo na memória de longo prazo. Marque a data de cada revisão.'),
    table(['Revisão', 'Quando', 'O que revisar', 'Data / ✓'], iv.map((dd, i) => [`${i + 1}ª`, `${dd} dia(s) depois da anterior`, [
      ...(unit.revisionPlan || ['Vocabulário + escuta da faixa 1', unit.grammar.slice(0, 2).map((g) => plain(g.name)).join(' + '), unit.grammar.slice(2).map((g) => plain(g.name)).join(' + '), 'Role-play completo sem olhar o texto', 'Desafio de revisão em novos contextos'])][i] || 'Desafio de revisão', '']), [1200, 2400, 3800, 1600]),
    h2('Desafio de revisão — novos contextos'), skillsByReview.flatMap((q, i) => printQuestion(q, i + 1)),
    note('Na plataforma, o módulo Revisão espaçada reorganiza esse plano automaticamente conforme seus acertos e erros.'));
  if (teacher) push(h3('Gabarito — revisão'), skillsByReview.map((q, i) => bullet(`${i + 1}. ${answerText(q)} — ${q.explanation}`)));

  /* 17. REFERÊNCIAS */
  push(h1('Referências pedagógicas'), unit.references.map((r) => bullet(r)),
    p(t(`Textos, diálogos e exercícios originais produzidos para a ODU CREATIVE. Áudios gerados por síntese de voz (${unit.tracks.some((x) => x.audioSource === 'synthetic-openjtalk') ? 'Open JTalk' : 'espeak-ng + MBROLA'}) quando não houver gravação humana.`, { size: 18, color: GREY })));

  return new Document({
    creator: 'ODU CREATIVE', title: `${unit.title} — ${teacher ? 'Professor' : 'Aluno'}`, description: unit.subtitle,
    styles: {
      default: { document: { run: { font: { ascii: 'Calibri', hAnsi: 'Calibri', eastAsia: ja ? 'Yu Gothic' : 'Calibri' }, size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 36, bold: true, color: BRAND } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: '1D1A2B' } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, color: ACCENT } },
      ],
    },
    numbering: { config: [{ reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 260 } } } }] }] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1300, left: 1450, right: 1450 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [t('ODU CREATIVE · ', { bold: true, color: BRAND, size: 16 }), t(`${unit.title} · ${unit.level}${teacher ? ' · Professor' : ''}`, { size: 16, color: GREY })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [t('', { size: 16 }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY })] })] }) },
      children,
    }],
  });
}

function fmt(sec) {
  if (typeof sec !== 'number') return '—';
  const m = Math.floor(sec / 60);
  return `${m}:${(sec % 60).toFixed(1).padStart(4, '0')}`;
}
