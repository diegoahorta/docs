/* Pongo Learns English - game controller.
 * Screens: start -> 3D map -> lesson (exercises) -> result -> map.
 * Scoring: XP per correct answer (+combo bonus), hearts, stars per lesson,
 * bones (stars collected) and a daily streak, saved in localStorage. */
(function () {
  'use strict';

  const { UNITS, MOTIVATION, MOTIVATION_SUB, OK_SHORT } = window.PongoContent;
  const Audio = window.PongoAudio;
  const FX = window.PongoFX;
  const Map3D = window.PongoMap || null;
  const $ = (id) => document.getElementById(id);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const ROLE_NAMES = { s: 'Sujeito', v: 'Verbo', c: 'Complemento', t: 'Tempo / lugar', e: 'Expressão' };
  const KIND = {
    choice: 'Escolha a resposta', fill: 'Complete a frase', build: 'Monte a frase em blocos',
    listen: 'Ouça e monte', match: 'Pares', type: 'Escreva',
  };
  const XP_BASE = { choice: 10, fill: 10, match: 10, type: 12, build: 15, listen: 15 };
  const MAX_HEARTS = 5;
  const SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  const TURTLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15c0-4 3-7 7-7s7 3 7 7H5Zm14-1h2.5a1.5 1.5 0 0 0 0-3H20M7 15l-1 3h3l.5-3m5 0l.5 3h3l-1-3"/></svg>';

  // ------------------------------------------------------------ save data
  const KEY = 'pongo-english-v1';
  const fresh = () => ({ xp: 0, bones: 0, streak: 0, lastDay: '', units: {}, music: true, sfx: true });
  let save = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) save = Object.assign(fresh(), JSON.parse(raw));
  } catch (e) { /* storage unavailable: play without saving */ }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }
  const unlockedCount = () => {
    let n = 1;
    UNITS.forEach((u, i) => { if (save.units[u.id] && save.units[u.id].stars > 0) n = Math.max(n, i + 2); });
    return Math.min(n, UNITS.length);
  };
  const allDone = () => UNITS.every((u) => save.units[u.id] && save.units[u.id].stars > 0);

  // ------------------------------------------------------------ HUD
  function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  function renderHud(animate) {
    $('hud-xp').textContent = save.xp;
    $('hud-bones').textContent = save.bones;
    $('hud-streak').textContent = save.streak;
    if (animate) ['hud-xp', 'hud-bones'].forEach((id) => bump($(id).parentElement));
  }
  function setToggle(btn, on) { btn.setAttribute('aria-pressed', String(on)); }
  $('btn-music').addEventListener('click', () => {
    save.music = !save.music;
    Audio.setMusic(save.music);
    if (save.music) Audio.startMusic();
    setToggle($('btn-music'), save.music);
    persist();
  });
  $('btn-sfx').addEventListener('click', () => {
    save.sfx = !save.sfx;
    Audio.setSfx(save.sfx);
    setToggle($('btn-sfx'), save.sfx);
    persist();
  });

  // ------------------------------------------------------------ map
  let mapOk = false;
  const markersEl = $('markers');

  function markerStates() {
    const open = unlockedCount();
    return UNITS.map((u, i) => {
      const rec = save.units[u.id];
      if (rec && rec.stars > 0) return { state: 'done', stars: rec.stars, text: 'concluída' };
      if (i < open) return { state: 'current', text: 'disponível' };
      return { state: 'locked', text: 'bloqueada' };
    });
  }

  function refreshMap() {
    const states = markerStates();
    if (mapOk) {
      Map3D.setMarkers(states, UNITS.map((u) => u.place));
      const cur = states.findIndex((s) => s.state === 'current');
      Map3D.current = cur >= 0 ? cur : null;
    } else {
      buildFallbackMarkers(states);
    }
  }

  function buildFallbackMarkers(states) {
    markersEl.classList.add('fallback');
    markersEl.innerHTML = '';
    UNITS.forEach((u, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'marker ' + states[i].state;
      b.dataset.stars = states[i].stars ? '★'.repeat(states[i].stars) + '☆'.repeat(3 - states[i].stars) : '';
      b.innerHTML = `<span class="marker-disc"><span class="marker-num">${i + 1}</span></span><span class="marker-label">${u.place}</span>`;
      b.addEventListener('click', () => selectLevel(i, b));
      markersEl.appendChild(b);
    });
  }

  let tipTimer = null;
  function pongoSays(en, pt, speak = true, ms = 6500) {
    $('tip-en').textContent = en;
    $('tip-pt').textContent = pt || '';
    const tip = $('map-tip');
    tip.hidden = false;
    tip.style.animation = 'none';
    void tip.offsetWidth;
    tip.style.animation = '';
    if (speak) Audio.speak(en);
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { tip.hidden = true; }, ms);
  }

  const PONGO_LINES = [
    ['Woof! Hello, friend!', 'Au! Olá, amigo!'],
    ['I am wagging my tail!', 'Estou abanando o rabo!'],
    ['Let\'s practice together!', 'Vamos praticar juntos!'],
    ['The sun is shining today!', 'O sol está brilhando hoje!'],
    ['I am getting hungry!', 'Estou ficando com fome!'],
    ['Are you ready? Here we go!', 'Você está pronto? Vamos lá!'],
    ['Nice to meet you!', 'Prazer em conhecer você!'],
  ];

  let selected = -1;
  function selectLevel(i, el) {
    const open = unlockedCount();
    if (i >= open) {
      if (el) { el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); }
      Audio.wrong();
      pongoSays('Not yet! Finish the lesson before.', 'Ainda não! Termine a lição anterior primeiro.', false, 3500);
      return;
    }
    Audio.tap();
    selected = i;
    const u = UNITS[i];
    const rec = save.units[u.id];
    $('pop-eyebrow').textContent = `Lição ${i + 1} · ${u.place}`;
    $('pop-title').textContent = u.title;
    $('pop-topic').textContent = u.topic;
    $('pop-meta').textContent = `${u.exercises.length} desafios` + (rec ? ` · melhor: ${'★'.repeat(rec.stars)}${'☆'.repeat(3 - rec.stars)}` : '');
    $('pop-start').textContent = rec ? 'Praticar de novo' : 'Começar';
    $('pop-start').style.background = '';
    $('level-pop').style.setProperty('--b', u.color);
    $('level-pop').style.background = u.color;
    $('level-pop').hidden = false;
    if (mapOk) Map3D.focus(i);
  }
  $('pop-close').addEventListener('click', () => { $('level-pop').hidden = true; });
  $('pop-start').addEventListener('click', () => {
    $('level-pop').hidden = true;
    startLesson(selected);
  });
  $('btn-home').addEventListener('click', () => {
    if (mapOk) Map3D.overview();
    pongoSays('Look! My big garden and my house!', 'Olha! Meu jardim grande e minha casa!');
  });

  // ------------------------------------------------------------ start
  const total = UNITS.reduce((n, u) => n + u.exercises.length, 0);
  $('feat-count').textContent = total;
  setToggle($('btn-music'), save.music);
  setToggle($('btn-sfx'), save.sfx);

  function ready(msg) {
    $('btn-play').disabled = false;
    $('btn-play').textContent = save.xp ? 'Continuar' : 'Jogar';
    $('load-status').textContent = msg;
  }

  if (Map3D) {
    Map3D.init({ canvas: $('world'), markers: markersEl, onSelect: selectLevel, onPongo: () => {
      Audio.woof();
      const [en, pt] = pick(PONGO_LINES);
      pongoSays(en, pt);
    } })
      .then(() => {
        mapOk = true;
        refreshMap();
        Map3D.placePongo(Math.min(unlockedCount() - 1, UNITS.length - 1));
        Map3D.setActive(false);
        ready('Jardim pronto! Toque em Jogar.');
      })
      .catch((err) => {
        console.warn('3D map unavailable, using 2D path', err);
        refreshMap();
        ready('Modo 2D (o 3D não está disponível neste navegador).');
      });
  } else {
    refreshMap();
    ready('Modo 2D (não foi possível carregar o 3D).');
  }

  $('btn-play').addEventListener('click', () => {
    Audio.init();
    Audio.setMusic(save.music);
    Audio.setSfx(save.sfx);
    if (save.music) Audio.startMusic();
    Audio.woof();
    updateStreakView();
    $('start').hidden = true;
    $('hud').hidden = false;
    markersEl.hidden = false;
    renderHud();
    if (mapOk) Map3D.setActive(true);
    const n = unlockedCount();
    setTimeout(() => {
      if (save.xp === 0) pongoSays('Woof! Hello! I am Pongo! Let\'s learn English!', 'Au! Olá! Eu sou o Pongo! Vamos aprender inglês! Toque no número 1.');
      else if (allDone()) pongoSays('I\'m home! You did it!', 'Cheguei em casa! Você conseguiu! Pratique de novo quando quiser.');
      else pongoSays('Welcome back! Here we go!', `Que bom te ver! Vamos para a lição ${n}: ${UNITS[n - 1].place}.`);
    }, 600);
  });

  // ------------------------------------------------------------ streak
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }
  function updateStreakView() {
    const y = new Date(Date.now() - 864e5);
    const yesterday = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
    if (save.lastDay && save.lastDay !== today() && save.lastDay !== yesterday) save.streak = 0;
  }
  function markStudiedToday() {
    const t = today();
    if (save.lastDay === t) return;
    updateStreakView();
    save.streak += 1;
    save.lastDay = t;
  }

  // ------------------------------------------------------------ lesson state
  let L = null;

  function startLesson(i) {
    const u = UNITS[i];
    L = {
      unit: u, index: i, queue: u.exercises.map((ex) => ({ ex, retry: false })),
      total: u.exercises.length, done: 0, hearts: MAX_HEARTS, xp: 0, combo: 0, bestCombo: 0,
      firstTry: 0, attempts: 0, current: null, answer: null, checked: false,
    };
    if (mapOk) Map3D.setActive(false);
    $('map-tip').hidden = true;
    $('hud').hidden = true;
    $('lesson').hidden = false;
    $('quit-sheet').hidden = true;
    Audio.whoosh();
    // intro bubble from Pongo before the first exercise
    showIntro();
  }

  function showIntro() {
    const u = L.unit;
    setFoot('idle');
    $('ex-kind').textContent = `Lição ${L.index + 1} · ${u.place}`;
    $('ex-title').textContent = u.title;
    $('ex-bubble').innerHTML = `<button class="speak" type="button" aria-label="Ouvir">${SPEAKER}</button><span>${esc(u.intro.en)}</span>`;
    $('ex-bubble').querySelector('.speak').onclick = () => Audio.speak(u.intro.en);
    $('ex-area').innerHTML = `<p class="fb-tip" style="font-size:1rem">${esc(u.intro.pt)}</p>
      <div class="legend" aria-label="Cores dos blocos">${legendHtml()}</div>
      <p class="fb-tip">As cores dos blocos mostram a função de cada parte da frase.</p>`;
    $('combo').hidden = true;
    updateProgress();
    $('lesson-hearts').textContent = L.hearts;
    const btn = $('btn-check');
    btn.disabled = false;
    btn.textContent = 'Vamos lá!';
    btn.onclick = () => next();
    L.checked = true;
    setTimeout(() => Audio.speak(u.intro.en), 300);
  }

  function legendHtml() {
    return Object.entries(ROLE_NAMES)
      .map(([r, n]) => `<span class="r-${r}" style="background:var(--rbg);color:var(--rc)">${n}</span>`)
      .join('');
  }

  function updateProgress() {
    const pct = Math.round((L.done / L.total) * 100);
    $('lesson-progress').style.width = pct + '%';
    document.querySelector('.progress').setAttribute('aria-valuenow', String(pct));
  }

  function isEnglish(s) {
    return /[a-z]/i.test(s) && !/[ãçéêíóúâõà+]/i.test(s) && !/\b(o|a|para|ou|de|não|sim|que|uma|um|com)\b/i.test(s);
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function norm(s) {
    return String(s).toLowerCase().replace(/[’`]/g, "'").replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function shuffle(a) {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  function setFoot(mode) {
    const foot = $('lesson-foot');
    foot.classList.remove('ok', 'bad');
    if (mode === 'ok') foot.classList.add('ok');
    if (mode === 'bad') foot.classList.add('bad');
    $('feedback').hidden = mode === 'idle';
  }

  function next() {
    if (L.hearts <= 0) return finishLesson(false);
    if (!L.queue.length) return finishLesson(true);
    L.current = L.queue.shift();
    L.answer = null;
    L.checked = false;
    setFoot('idle');
    const btn = $('btn-check');
    btn.textContent = 'Verificar';
    btn.disabled = true;
    btn.onclick = check;
    $('pongo-avatar').className = 'pongo-avatar';
    renderExercise(L.current.ex);
  }

  // ------------------------------------------------------------ exercise renderers
  function renderExercise(ex) {
    const area = $('ex-area');
    const bubble = $('ex-bubble');
    $('ex-kind').textContent = (L.current.retry ? 'Erro anterior · ' : '') + KIND[ex.type];
    area.innerHTML = '';

    if (ex.type === 'choice') {
      $('ex-title').textContent = 'Escolha a resposta certa';
      bubble.innerHTML = `${ex.pic ? `<span class="pic" aria-hidden="true">${ex.pic}</span>` : ''}${ex.clock ? `<span class="clock">${ex.clock}</span>` : ''}${esc(ex.prompt)}`;
      area.appendChild(choiceList(ex.options, false));
    } else if (ex.type === 'fill') {
      $('ex-title').textContent = 'Complete a frase';
      bubble.innerHTML = esc(ex.sentence).replace('___', '<span class="blank" id="blank">&nbsp;</span>');
      area.appendChild(choiceList(ex.options, true));
    } else if (ex.type === 'build' || ex.type === 'listen') {
      if (ex.type === 'build') {
        $('ex-title').textContent = 'Traduza: monte a frase em inglês';
        bubble.innerHTML = esc(ex.pt);
      } else {
        $('ex-title').textContent = 'Toque no que você ouvir';
        bubble.innerHTML = `<button class="speak" type="button" aria-label="Ouvir a frase">${SPEAKER}</button><button class="speak slow" type="button" aria-label="Ouvir devagar">${TURTLE}</button>`;
        const [b1, b2] = bubble.querySelectorAll('.speak');
        b1.onclick = () => Audio.speak(ex.say);
        b2.onclick = () => Audio.speak(ex.say, true);
        setTimeout(() => Audio.speak(ex.say), 350);
        if (!Audio.canSpeak()) bubble.insertAdjacentHTML('beforeend', `<span>${esc(ex.say)}</span>`);
      }
      area.appendChild(builder(ex));
    } else if (ex.type === 'match') {
      $('ex-title').textContent = ex.prompt;
      bubble.innerHTML = 'Inglês ↔ Português. Toque em um par de cada vez!';
      area.appendChild(matcher(ex));
      $('btn-check').disabled = true;
    } else if (ex.type === 'type') {
      $('ex-title').textContent = 'Escreva em inglês';
      bubble.innerHTML = esc(ex.prompt);
      const inp = document.createElement('input');
      inp.className = 'type-input';
      inp.id = 'type-input';
      inp.placeholder = ex.placeholder || '';
      inp.autocomplete = 'off';
      inp.autocapitalize = 'off';
      inp.spellcheck = false;
      inp.addEventListener('input', () => {
        L.answer = inp.value;
        $('btn-check').disabled = !inp.value.trim();
      });
      area.appendChild(inp);
      setTimeout(() => inp.focus(), 50);
    }
  }

  function choiceList(options, row) {
    const wrap = document.createElement('div');
    wrap.className = 'choices' + (row ? ' row' : '');
    options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.innerHTML = `<span class="key">${i + 1}</span><span>${esc(opt)}</span>`;
      b.addEventListener('click', () => {
        if (L.checked) return;
        Audio.tap();
        wrap.querySelectorAll('.choice').forEach((c) => c.classList.remove('sel'));
        b.classList.add('sel');
        L.answer = i;
        $('btn-check').disabled = false;
        const blank = document.getElementById('blank');
        if (blank) blank.textContent = opt;
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function builder(ex) {
    const wrap = document.createElement('div');
    wrap.className = 'build';
    const all = ex.blocks.concat(ex.extra || []).map(([t, r], i) => ({ t, r, i }));
    let order = shuffle(all);
    const correct = norm(ex.blocks.map((b) => b[0]).join(' '));
    for (let k = 0; k < 5 && norm(order.slice(0, ex.blocks.length).map((b) => b.t).join(' ')) === correct; k++) order = shuffle(all);

    wrap.innerHTML = `<div class="legend">${legendHtml()}</div><div class="answer-line" id="answer-line" aria-label="Sua resposta"></div><div class="bank" id="bank" aria-label="Blocos"></div>`;
    const line = wrap.querySelector('.answer-line');
    const bank = wrap.querySelector('.bank');
    const chosen = [];

    const sync = () => {
      L.answer = chosen.map((c) => c.t);
      $('btn-check').disabled = chosen.length === 0;
      line.querySelectorAll('.block').forEach((b, i) => b.style.setProperty('--i', i));
    };

    order.forEach((blk) => {
      const src = document.createElement('button');
      src.type = 'button';
      src.className = `block r-${blk.r}`;
      src.textContent = blk.t;
      src.title = ROLE_NAMES[blk.r];
      src.addEventListener('click', () => {
        if (L.checked || src.classList.contains('used')) return;
        Audio.tap();
        src.classList.add('used');
        const placed = document.createElement('button');
        placed.type = 'button';
        placed.className = `block r-${blk.r} fly`;
        placed.textContent = blk.t;
        placed.addEventListener('click', () => {
          if (L.checked) return;
          Audio.untap();
          placed.remove();
          src.classList.remove('used');
          chosen.splice(chosen.indexOf(blk), 1);
          sync();
        });
        line.appendChild(placed);
        chosen.push(blk);
        sync();
      });
      bank.appendChild(src);
    });
    return wrap;
  }

  function matcher(ex) {
    const wrap = document.createElement('div');
    wrap.className = 'match';
    const left = document.createElement('div');
    const right = document.createElement('div');
    left.className = right.className = 'col';
    wrap.append(left, right);
    let selL = null, selR = null, matched = 0;
    const mk = (text, key, side) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.textContent = text;
      b.dataset.key = key;
      b.addEventListener('click', () => {
        if (b.classList.contains('gone')) return;
        Audio.tap();
        if (side === 'L') {
          if (selL) selL.classList.remove('sel');
          selL = b;
          Audio.speak(text);
        } else {
          if (selR) selR.classList.remove('sel');
          selR = b;
        }
        b.classList.add('sel');
        if (selL && selR) {
          const a = selL, c = selR;
          selL = selR = null;
          if (a.dataset.key === c.dataset.key) {
            [a, c].forEach((x) => { x.classList.remove('sel'); x.classList.add('right'); });
            setTimeout(() => [a, c].forEach((x) => { x.classList.remove('right'); x.classList.add('gone'); }), 350);
            matched++;
            if (matched === ex.pairs.length) {
              L.answer = 'matched';
              setTimeout(check, 450);
            } else {
              Audio.correct();
            }
          } else {
            [a, c].forEach((x) => { x.classList.remove('sel'); x.classList.add('wrong'); });
            Audio.wrong();
            L.matchMistakes = (L.matchMistakes || 0) + 1;
            setTimeout(() => [a, c].forEach((x) => x.classList.remove('wrong')), 450);
          }
        }
      });
      return b;
    };
    L.matchMistakes = 0;
    shuffle(ex.pairs.map((p, i) => [p[0], i])).forEach(([t, k]) => left.appendChild(mk(t, k, 'L')));
    shuffle(ex.pairs.map((p, i) => [p[1], i])).forEach(([t, k]) => right.appendChild(mk(t, k, 'R')));
    return wrap;
  }

  // ------------------------------------------------------------ checking
  function evaluate(ex) {
    switch (ex.type) {
      case 'choice':
      case 'fill':
        return { ok: L.answer === ex.answer, right: ex.type === 'fill' ? ex.sentence.replace('___', ex.options[ex.answer]) : ex.options[ex.answer] };
      case 'build':
      case 'listen': {
        const right = ex.blocks.map((b) => b[0]).join(' ');
        return { ok: norm((L.answer || []).join(' ')) === norm(right), right };
      }
      case 'type': {
        const a = norm(L.answer || '').replace(/'/g, '');
        return { ok: ex.accept.some((x) => norm(x).replace(/'/g, '') === a), right: ex.accept[0] };
      }
      case 'match':
        return { ok: true, right: '' };
      default:
        return { ok: false, right: '' };
    }
  }

  function floatXp(amount) {
    const btn = $('btn-check').getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'xp-float';
    el.textContent = `+${amount} XP`;
    el.style.left = btn.left + btn.width / 2 - 40 + 'px';
    el.style.top = btn.top - 20 + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  function check() {
    if (L.checked) return;
    const ex = L.current.ex;
    const res = evaluate(ex);
    L.checked = true;
    L.attempts++;
    const btn = $('btn-check');
    btn.disabled = false;
    btn.textContent = 'Continuar';
    btn.onclick = next;
    const avatar = $('pongo-avatar');

    if (res.ok) {
      L.done++;
      L.combo++;
      L.bestCombo = Math.max(L.bestCombo, L.combo);
      if (!L.current.retry) L.firstTry++;
      let gain = XP_BASE[ex.type] || 10;
      if (L.combo >= 5) gain *= 2;
      else if (L.combo >= 3) gain += 5;
      L.xp += gain;
      save.xp += gain;
      renderHud(true);
      floatXp(gain);
      updateProgress();

      const comboEl = $('combo');
      if (L.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = `COMBO x${L.combo}${L.combo >= 5 ? ' · XP em dobro!' : L.combo >= 3 ? ' · +5 XP' : ''}`;
        bump(comboEl);
      }
      avatar.className = 'pongo-avatar happy';
      setFoot('ok');
      $('fb-title').textContent = pick(OK_SHORT);
      $('fb-text').textContent = ex.type === 'match' ? 'Todos os pares certos!' : ex.type === 'build' || ex.type === 'listen' ? res.right : '';
      $('fb-tip').textContent = ex.tip || '';

      const isSentence = ex.type === 'build' || ex.type === 'listen';
      if (isSentence) {
        const line = document.getElementById('answer-line');
        if (line) line.classList.add('right');
        Audio.fanfare();
        FX.explode(pick(MOTIVATION), pick(MOTIVATION_SUB));
        setTimeout(() => Audio.speak(res.right), 2300);
      } else {
        Audio.correct();
        const sel = document.querySelector('.choice.sel');
        if (sel) { sel.classList.remove('sel'); sel.classList.add('right'); }
        const r = (sel || btn).getBoundingClientRect();
        FX.pop(r.left + r.width / 2, r.top + r.height / 2);
        if (ex.type === 'fill' || ex.type === 'choice') {
          const say = ex.type === 'fill' ? res.right : ex.options[ex.answer];
          if (isEnglish(say)) setTimeout(() => Audio.speak(say), 400);
        }
      }
    } else {
      L.combo = 0;
      $('combo').hidden = true;
      L.hearts--;
      $('lesson-hearts').textContent = Math.max(0, L.hearts);
      const hearts = document.querySelector('.hearts');
      hearts.classList.remove('hit'); void hearts.offsetWidth; hearts.classList.add('hit');
      Audio.wrong();
      setTimeout(() => Audio.heartLost(), 250);
      avatar.className = 'pongo-avatar sad';
      setFoot('bad');
      $('fb-title').textContent = 'Quase! Resposta correta:';
      $('fb-text').textContent = res.right;
      $('fb-tip').textContent = ex.tip || '';
      const line = document.getElementById('answer-line');
      if (line) line.classList.add('wrong');
      const sel = document.querySelector('.choice.sel');
      if (sel) { sel.classList.remove('sel'); sel.classList.add('wrong'); }
      // Duolingo-style: the mistake comes back at the end of the lesson
      L.queue.push({ ex, retry: true });
      if (L.hearts <= 0) btn.textContent = 'Ver resultado';
    }
  }

  // ------------------------------------------------------------ finish
  function finishLesson(passed) {
    $('lesson').hidden = true;
    const card = $('result');
    card.hidden = false;
    const u = L.unit;
    const acc = Math.round((L.firstTry / L.total) * 100);
    $('res-xp').textContent = L.xp;
    $('res-acc').textContent = acc + '%';
    $('res-combo').textContent = L.bestCombo;
    $('res-retry').hidden = passed;
    const pongoImg = $('result-pongo');
    let unlockedNew = false;

    if (passed) {
      const mistakes = L.total - L.firstTry;
      const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      const prev = save.units[u.id];
      const before = unlockedCount();
      const bonus = stars * 5;
      save.xp += bonus;
      L.xp += bonus;
      $('res-xp').textContent = L.xp;
      if (!prev || stars > prev.stars) {
        save.bones += stars - (prev ? prev.stars : 0);
        save.units[u.id] = { stars, best: L.xp };
      }
      markStudiedToday();
      unlockedNew = unlockedCount() > before;
      persist();
      $('res-eyebrow').textContent = `Lição ${L.index + 1} concluída · +${bonus} XP bônus`;
      $('res-title').textContent = stars === 3 ? 'Perfect! Pawsome!' : stars === 2 ? 'Great job!' : 'You did it!';
      $('res-sub').textContent = L.index === UNITS.length - 1
        ? 'Pongo chegou em casa: “I’m home!” Você completou o jardim inteiro!'
        : `Pongo está pronto para ir até: ${UNITS[L.index + 1].place}.`;
      $('res-stars').innerHTML = [0, 1, 2].map((k) => `<span class="${k < stars ? 'on' : ''}">★</span>`).join('');
      pongoImg.className = 'result-pongo';
      Audio.lessonComplete();
      setTimeout(() => FX.party(), 200);
      setTimeout(() => Audio.speak(stars === 3 ? 'Perfect! Pawsome!' : 'Great job! You did it!'), 1500);
    } else {
      persist();
      $('res-eyebrow').textContent = 'Acabaram as vidas';
      $('res-title').textContent = 'Let\'s give it a try!';
      $('res-sub').textContent = 'Não tem problema! Errar faz parte. Vamos tentar de novo?';
      $('res-stars').innerHTML = '<span>★</span><span>★</span><span>★</span>';
      pongoImg.className = 'result-pongo sad';
      Audio.heartLost();
    }
    renderHud(true);

    $('res-retry').onclick = () => {
      card.hidden = true;
      startLesson(L.index);
    };
    $('res-continue').onclick = () => {
      card.hidden = true;
      backToMap(passed && unlockedNew ? L.index + 1 : null);
    };
  }

  function backToMap(walkTo) {
    $('hud').hidden = false;
    $('lesson').hidden = true;
    refreshMap();
    if (mapOk) {
      Map3D.setActive(true);
      if (walkTo != null && walkTo < UNITS.length) {
        Map3D.focus(walkTo - 1, true);
        setTimeout(() => {
          Audio.woof();
          Map3D.walkTo(walkTo).then(() => {
            Audio.correct();
            const u = UNITS[walkTo];
            pongoSays(`Here we go! Next stop: lesson ${walkTo + 1}!`, `Lá vamos nós! Próxima parada: ${u.place} — “${u.title}”`);
          });
        }, 500);
        return;
      }
    }
    if (allDone()) pongoSays('I\'m home! Thank you, my friend!', 'Cheguei! Obrigado, amigo! Você pode praticar qualquer lição de novo.');
    else pongoSays('Let\'s practice together!', 'Escolha uma lição no mapa.');
  }

  // ------------------------------------------------------------ quit + keyboard
  $('lesson-close').addEventListener('click', () => { $('quit-sheet').hidden = false; });
  $('quit-stay').addEventListener('click', () => { $('quit-sheet').hidden = true; });
  $('quit-leave').addEventListener('click', () => {
    $('quit-sheet').hidden = true;
    $('lesson').hidden = true;
    persist();
    backToMap(null);
  });

  document.addEventListener('keydown', (e) => {
    if ($('lesson').hidden || !$('quit-sheet').hidden) return;
    if (e.key === 'Enter') {
      const btn = $('btn-check');
      if (!btn.disabled) { e.preventDefault(); btn.click(); }
      return;
    }
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) {
      const c = document.querySelectorAll('.choices .choice')[n - 1];
      if (c) c.click();
    }
  });
})();
