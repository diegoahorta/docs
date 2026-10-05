/* =====================================================================
   LIÇÃO
   ===================================================================== */
let L = null;
const FAKE_WHY = {
  'の': 'の liga dois nomes (たなかさんの おすまい) ou marca o hífen do telefone. Para marcar o tópico da pergunta, use は.',
  'は': 'は marca o tópico (おなまえは…). Entre dois nomes ou entre as partes do número, use の.',
  'を': 'を marca o objeto de verbos de ação (Lição 6). Esta estrutura não usa を.',
  'ですか。': 'ですか transforma a frase em pergunta. A resposta termina com です。',
  'なんばんですか。': 'なんばんですか pergunta um número. Para nome, trabalho, origem e residência, use どちらですか。',
  'どちらですか。': 'どちらですか pergunta “qual/onde”. Para o número de telefone, use なんばんですか。',
  'いいえ。': 'いいえ responde a um agradecimento (“de nada”). Aqui não cabe.'
};

function prepare(it) {
  if (it.t === 'm') return Object.assign({}, it, { chunks: parse(it.jp) });
  if (it.t === 'n') {
    const num = it.num || randomPhone();
    const used = new Set(num.replace('-', '').split('').map(d => READ[d]));
    const extra = shuffle(READ.filter(r => !used.has(r))).slice(0, 1);
    return Object.assign({}, it, { num, chunks: phoneChunks(num), fakes: [...extra.map(t => t + ':O'), 'は'] });
  }
  return it;
}
function buildExercises(level) {
  let items = level.gen ? level.gen() : level.pool.slice();
  if (!level.ordered) items = shuffle(items).slice(0, level.count || 6);
  return items.map(prepare);
}
function startLevel(level) {
  Sound.init(); maybeStartMusic();
  L = { level, queue: buildExercises(level), hearts: 3, score: 0, streak: 0, maxStreak: 0, errors: 0, done: 0, answered: false };
  L.total = L.queue.length;
  $('#lesson').hidden = false; document.body.style.overflow = 'hidden';
  $('#heartsN').textContent = L.hearts; $('#lessonScore').textContent = 0; $('#bar').style.width = '0%';
  next();
}
function kindOf(it) {
  if (it.t === 'm') return ['Monte a frase', 'Toque nos blocos na ordem certa'];
  if (it.t === 'n') return ['Dite o número', 'Números, の no hífen e です。 no final'];
  if (it.dlg) return ['Complete o diálogo', 'Escolha a próxima fala'];
  if (it.ctx) return ['Complete o bloco', 'Escolha o pedaço que falta'];
  return ['Escolha a resposta', 'Toque na opção certa'];
}
function next() {
  hideSheet();
  if (!L.queue.length) return finishLevel(true);
  const it = L.cur = L.queue.shift();
  L.answered = false; L.choice = null;
  const [title, sub] = kindOf(it);
  const combo = L.streak >= 2 ? `<span class="combo-tag">COMBO x${L.streak}</span>` : '';
  let say;
  if (it.t === 'm') say = `${esc(it.pt)}<span class="hint">${it.stage ? 'Monte em japonês' : 'Traduza montando os blocos'}</span>`;
  else if (it.t === 'n') say = `${esc(it.q || 'Dite este número de telefone:')}<span class="num">${it.num}</span>`;
  else say = `${esc(it.q)}${it.pt ? `<span class="hint">${esc(it.pt)}</span>` : ''}`;
  $('#exercise').innerHTML = `${it.stage ? `<span class="stage-tag">Final Challenge · ${esc(it.stage)}</span>` : ''}
    <h2 class="ex-kind">${title}${combo}<small>${sub}</small></h2>
    <div class="prompt-row"><div class="mascot-box" id="mascotBox"></div><div class="say">${say}</div></div>
    <div id="area"></div>`;
  if (window.__lessonMascot) $('#mascotBox').appendChild(window.__lessonMascot);
  if (it.t === 'e') setupEscolha(it); else setupMontar(it);
  $('#btnCheck').disabled = true; $('#btnCheck').textContent = 'Verificar';
  $('.lesson-body').scrollTop = 0;
}

/* --- montar a frase / ditar o número com blocos (chunking) --- */
function setupMontar(it) {
  const nf = L.level.distract || 1;
  const fakes = it.fakes.slice(0, it.t === 'n' ? 2 : nf).map(f => Object.assign(parse(f)[0], { fake: true }));
  L.tiles = shuffle([...it.chunks.map(c => Object.assign({}, c)), ...fakes]).map((c, i) => Object.assign(c, { key: i }));
  L.placed = [];
  $('#area').innerHTML = `<div class="answer" id="answer" aria-label="Sua frase"></div><div class="bank" id="bank" aria-label="Blocos disponíveis"></div>`;
  drawMontar();
  $('#area').onclick = ev => {
    if (L.answered) return;
    const b = ev.target.closest('button.chunk'); if (!b) return;
    const k = +b.dataset.key;
    if (b.dataset.where === 'bank') L.placed.push(k); else L.placed = L.placed.filter(x => x !== k);
    Sound.tap(); drawMontar();
  };
}
function drawMontar() {
  const tileBtn = (c, where) => `<button class="chunk r-${c.r}" data-key="${c.key}" data-where="${where}"><span class="tag">${ROLE_TAG[c.r]}</span>${esc(c.t)}</button>`;
  $('#answer').innerHTML = L.placed.map(k => tileBtn(L.tiles[k], 'answer')).join('');
  $('#bank').innerHTML = L.tiles.map(c => L.placed.includes(c.key) ? `<span class="chunk ghost r-${c.r}"><span class="tag">${ROLE_TAG[c.r]}</span>${esc(c.t)}</span>` : tileBtn(c, 'bank')).join('');
  $('#btnCheck').disabled = L.placed.length === 0;
}
function judgeMontar(it) {
  const ans = L.placed.map(k => L.tiles[k]);
  const fake = ans.find(c => c.fake);
  if (fake) return { ok: false, why: 'fake', p: fake.t, ans };
  if (ans.length !== it.chunks.length) return { ok: false, why: 'missing', ans };
  const ok = ans.map(c => c.t).join('|') === it.chunks.map(c => c.t).join('|');
  return ok ? { ok: true, ans } : { ok: false, why: 'order', ans };
}

/* --- escolha: palavra, partícula, resposta, fala do diálogo --- */
function slotHTML(r) { return `<span class="chunk static r-${r} slot" id="slot"><span class="tag">${ROLE_TAG[r]}</span>？</span>`; }
function setupEscolha(it) {
  let html = '';
  if (it.big) html += `<div class="bigword ${isJP(it.big) ? 'jp' : ''}">${esc(it.big)}</div>`;
  if (it.dlg) {
    html += `<div class="dialog">${it.dlg.map(([who, jp]) => `<div class="line ${who === 'A' ? 'a' : 'b'}"><b>${who}</b><span>${esc(jp)}</span></div>`).join('')}
      <div class="line ${it.who === 'A' ? 'a' : 'b'} you"><b>${it.who}</b><span id="slot">？</span></div></div>`;
  }
  if (it.ctx) html += `<div class="sentence">${parse(it.ctx).map(c => c.t === '＿' ? slotHTML(c.r) : chunkHTML(c)).join('')}</div>`;
  const opts = shuffle(it.opts), long = opts.some(o => o.length > 9);
  html += `<div class="options ${long ? 'long' : ''}" id="opts">${opts.map((o, i) => `<button class="opt ${isJP(o) ? '' : 'pt'}" data-v="${esc(o)}"><span class="k">${i + 1}</span><span class="jp">${esc(o)}</span></button>`).join('')}</div>`;
  $('#area').innerHTML = html;
  $('#opts').onclick = ev => { const b = ev.target.closest('.opt'); if (b) choose(b.dataset.v); };
}
function choose(v) {
  if (L.answered) return;
  L.choice = v; Sound.tap();
  document.querySelectorAll('.opt').forEach(o => o.classList.toggle('sel', o.dataset.v === v));
  const slot = $('#slot');
  if (slot) {
    slot.classList.add('filled');
    if (slot.classList.contains('chunk')) slot.innerHTML = `<span class="tag">${slot.querySelector('.tag').textContent}</span>${esc(v)}`;
    else slot.textContent = v;
  }
  $('#btnCheck').disabled = false;
}

/* --- verificação e feedback --- */
function check() {
  if (!L || L.answered) return;
  const it = L.cur;
  const res = it.t === 'e' ? (L.choice === it.ans ? { ok: true } : { ok: false, why: 'choice' }) : judgeMontar(it);
  L.answered = true;
  if (res.ok) onCorrect(it); else onWrong(it, res);
}
function onCorrect(it) {
  L.streak++; L.maxStreak = Math.max(L.maxStreak, L.streak); L.done++;
  const mult = 1 + Math.min(L.streak - 1, 8) * 0.25;
  const pts = Math.round(100 * mult);
  L.score += pts;
  $('#lessonScore').textContent = L.score;
  $('#bar').style.width = (L.done / L.total * 100) + '%';
  // explosão sonora + "poluição visual"
  const area = $('#area').getBoundingClientRect();
  const x = area.left + area.width / 2, y = area.top + Math.min(area.height, 200) / 2;
  const power = Math.min(1 + (L.streak - 1) * 0.35, 3);
  Sound.explosion(power);
  FX.burst(x, y, power, L.streak >= 3 ? `COMBO x${L.streak}！` : null);
  burst3D(x, y, Math.round(6 + power * 5));
  flash(pick(['#fff2cc', '#e2f0d9', '#d9eaf7', '#e4d5f3', '#fce4d6']));
  shake($('#lesson'), power > 1.8);
  if (lessonRig) lessonRig.bow();
  showSheet(true, it, pts, mult);
}
function onWrong(it, res) {
  L.streak = 0; L.errors++; L.hearts--;
  $('#heartsN').textContent = Math.max(0, L.hearts);
  const h = $('#hearts'); h.classList.remove('hit'); void h.offsetWidth; h.classList.add('hit');
  L.queue.push(it); // o exercício volta no fim da lição
  Sound.wrong(); flash('#ff5a5f');
  const a = $('#area'); a.classList.remove('wrong-shake'); void a.offsetWidth; a.classList.add('wrong-shake');
  if (lessonRig) lessonRig.no();
  showSheet(false, it, 0, 1, res);
}
function explain(it, res) {
  if (it.t === 'e') return it.why;
  if (res.why === 'fake') return FAKE_WHY[res.p] || (it.t === 'n' ? `${res.p} não está neste número. Leia dígito por dígito.` : 'Esse bloco não faz parte desta frase.');
  if (res.why === 'missing') return 'Faltou bloco. Use todos os blocos da frase (só sobram os que não servem).';
  if (it.t === 'n') return 'Leia os dígitos na ordem, coloque の no lugar do hífen e feche com です。';
  return 'Ordem do bloco ODU: [cortesia しつれいですが、] + informação (O) + は + pergunta (どちらですか。). Resposta: informação + です。';
}
function correctText(it) { return it.t === 'n' ? phoneReading(it.num) : it.t === 'm' ? sentenceText(it.chunks) : it.ans; }
function showSheet(ok, it, pts, mult, res) {
  const correct = it.t === 'e'
    ? `<div class="sentence"><span class="answer-pill">${esc(it.ans)}</span></div>`
    : `<div class="sentence">${it.chunks.map(c => chunkHTML(c)).join('')}</div>`;
  const reply = it.reply ? `<div class="reply"><b>たなかさん:</b> <span>${esc(it.reply)}</span></div>` : '';
  let body;
  if (ok) {
    const extra = it.t === 'e' ? (it.why ? `<p>${esc(it.why)}</p>` : '') : `<div class="row"><span class="lbl">Sentido</span><span>${esc(it.t === 'n' ? it.num : it.pt)}</span></div>`;
    body = `<div class="odu"><div class="row"><span class="lbl">Bloco</span>${correct}</div>${extra}${reply}</div>`;
  } else {
    const mine = it.t === 'e' ? `<span class="answer-pill bad">${esc(L.choice)}</span>` : res.ans.map(c => chunkHTML(c)).join('');
    body = `<div class="odu">
      <div class="row"><span class="lbl x">✗ Errado</span><div class="sentence">${mine}</div></div>
      <div class="row"><span class="lbl v">✓ Correto</span>${correct}</div>
      <p><b>Erro comum:</b> ${esc(explain(it, res))}</p></div>`;
  }
  const title = ok ? pick(['Excelente!', 'Mandou bem!', 'Perfeito!', 'すごい！']) : 'Quase lá!';
  const say = correctText(it);
  $('#sheetIn').innerHTML = `<div class="sheet-head"><span class="badge">${ok ? '✓' : '✗'}</span><h3>${title}</h3>${ok ? `<span class="pts">+${pts}${mult > 1 ? ` <small>x${mult}</small>` : ''}</span>` : ''}</div>
    ${body}
    <div class="actions">${isJP(say) ? '<button class="listen" id="btnListen">Ouvir</button>' : ''}<button class="btn" id="btnNext">Continuar</button></div>`;
  const sh = $('#sheet'); sh.className = 'sheet ' + (ok ? 'ok' : 'bad');
  requestAnimationFrame(() => sh.classList.add('show'));
  if ($('#btnListen')) $('#btnListen').onclick = () => speak(ok && it.reply ? say + '。' + it.reply : say);
  $('#btnNext').onclick = afterFeedback;
  setTimeout(() => $('#btnNext') && $('#btnNext').focus(), 300);
}
function hideSheet() { $('#sheet').classList.remove('show'); }
function afterFeedback() {
  if (L.hearts <= 0) return finishLevel(false);
  next();
}
$('#btnCheck').onclick = check;
$('#btnQuit').onclick = () => { quitLesson(); };
function quitLesson() { L = null; hideSheet(); $('#lesson').hidden = true; document.body.style.overflow = ''; renderHome(); }

document.addEventListener('keydown', ev => {
  if (!$('#modal').hidden && ev.key === 'Escape') { $('#modal').hidden = true; return; }
  if (!L || $('#lesson').hidden) return;
  if (ev.key === 'Enter') {
    ev.preventDefault();
    if (L.answered) afterFeedback(); else if (!$('#btnCheck').disabled) check();
  } else if (/^[1-4]$/.test(ev.key) && !L.answered) {
    const o = document.querySelectorAll('.opt')[+ev.key - 1]; if (o) choose(o.dataset.v);
  } else if (ev.key === 'Escape') quitLesson();
});

