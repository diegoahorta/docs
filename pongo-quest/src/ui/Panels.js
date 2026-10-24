// Painéis: inventário, diário de vocabulário, caderno gramatical,
// progresso e configurações.
import { state } from '../systems/GameState.js'
import { bus } from '../systems/EventBus.js'
import { saves } from '../systems/SaveSystem.js'
import { audio } from '../systems/AudioSystem.js'
import { VOCAB, VOCAB_BY_ID, SKILLS } from '../education/vocabulary.js'
import { GRAMMAR } from '../education/grammar.js'
import { learning } from '../education/LearningTracker.js'
import {
  recognitionItem,
  productionItem,
  reviewItems
} from '../education/questionBank.js'
import { ITEMS } from '../data/items.js'
import { PHASES } from '../data/phases.js'
import { toHTML, escapeHTML } from './ruby.js'
import { icon } from './icons.js'
import { ui } from './UIManager.js'
import { runPuzzles } from './puzzles/PuzzleRunner.js'

const CATS = {
  all: 'Todas',
  cardinal: '方角 Pontos cardeais',
  spatial: '位置 Posição',
  relative: '右左 Relativas',
  demonstrative: 'ここ・そこ',
  place: '町 Lugares',
  thing: '物 Coisas',
  grammar: '文法 Gramática'
}

function panel(title, bodyHTML = '') {
  const p = ui.el('div', 'card panel')
  p.setAttribute('role', 'dialog')
  p.setAttribute('aria-label', title.replace(/<[^>]+>/g, ''))
  p.innerHTML = `<header><h2>${title}</h2><button class="btn close" aria-label="Fechar">✕</button></header><div class="content">${bodyHTML}</div>`
  return p
}

function open(p) {
  const modal = ui.openModal(p)
  p.querySelector('.close').addEventListener('click', () => ui.closeModal(modal))
  return modal
}

// ── Inventário ──────────────────────────────────────────────
function inventory() {
  const inv = state.progress.inventory
  const pieces = state.progress.huntDone.length
  const items = inv.length
    ? inv
        .map((id) => ITEMS[id])
        .filter(Boolean)
        .map(
          (it) =>
            `<div class="inv"><div class="i">${it.icon}</div><div class="n">${it.name}</div><div class="d"><b>${it.pt}</b><br>${it.desc}</div></div>`
        )
        .join('')
    : '<p>A mochila está vazia. Converse com os moradores!</p>'
  const extra = pieces
    ? `<div class="inv"><div class="i">🧩</div><div class="n">地図のかけら ×${pieces}</div><div class="d">Pedaços do mapa misterioso (${pieces}/5)</div></div>`
    : ''
  open(panel('🎒 もちもの · Inventário', `<div class="inv-grid">${items}${extra}</div>`))
}

// ── Diário ──────────────────────────────────────────────────
function vocabCard(w) {
  const seen = learning.isSeen(w.id)
  if (!seen)
    return `<div class="vcard locked"><div class="top"><div class="icon">${icon('none')}</div><div><div class="word">？？？</div><div class="pt">Fase ${w.phase} · ainda não encontrada</div></div></div></div>`
  const v = state.learning.vocab[w.id] || { correct: 0, wrong: 0 }
  const total = v.correct + v.wrong
  const pct = total ? Math.round((v.correct / total) * 100) : 0
  const tag = learning.isLearned(w.id)
    ? '<span class="tagline">✔ aprendida</span>'
    : state.learning.review.includes(w.id)
      ? '<span class="tagline review">🔁 revisar</span>'
      : '<span class="tagline">nova</span>'
  return `<div class="vcard" data-id="${w.id}">
    <div class="top"><div class="icon">${icon(w.icon)}</div><div><div class="word">${toHTML(w.word)}</div><div class="pt">${escapeHTML(w.kana)} · ${escapeHTML(w.pt)}</div></div></div>
    ${tag}
    <div class="ex">${toHTML(w.ex)}<div class="tr">${escapeHTML(w.exPt)}</div></div>
    <div class="meter" title="Acertos ${v.correct} · Erros ${v.wrong}"><i style="width:${pct}%"></i></div>
    <div class="actions">
      <button class="btn" data-a="speak">🔊 Ouvir</button>
      <button class="btn" data-a="rec">👁 Reconhecer</button>
      <button class="btn" data-a="prod">✍ Produzir</button>
    </div></div>`
}

function diary(filter = 'all') {
  const list = VOCAB.filter((w) => filter === 'all' || w.cat === filter)
  const seenCount = VOCAB.filter((w) => learning.isSeen(w.id)).length
  const tabs = Object.entries(CATS)
    .map(
      ([k, l]) =>
        `<button data-f="${k}" class="${k === filter ? 'on' : ''}">${l}</button>`
    )
    .join('')
  const p = panel(
    `📖 ことばの日記 · Diário <small>(${seenCount}/${VOCAB.length})</small>`,
    `<div class="tabs">${tabs}</div><div class="legend" style="margin-bottom:8px"><span class="l-ref">referência</span><span class="l-no">の</span><span class="l-pos">posição</span><span class="l-part">に/で/へ</span><span class="l-pred">predicado</span></div><div class="vocab-grid">${list.map(vocabCard).join('')}</div>`
  )
  const modal = open(p)
  p.querySelectorAll('.tabs button').forEach((b) =>
    b.addEventListener('click', async () => {
      await ui.closeModal(modal)
      diary(b.dataset.f)
    })
  )
  p.querySelectorAll('.vcard[data-id]').forEach((card) => {
    const id = card.dataset.id
    card.addEventListener('click', async (e) => {
      const a = e.target.closest('button')?.dataset.a
      if (!a) return
      if (a === 'speak') return audio.speak(VOCAB_BY_ID[id].ex, true)
      const item = a === 'rec' ? recognitionItem(id) : productionItem(id)
      await runPuzzles({
        title: `${VOCAB_BY_ID[id].kanji || VOCAB_BY_ID[id].kana} — ${a === 'rec' ? 'Reconhecimento' : 'Produção'}`,
        stage: a === 'rec' ? 'intake' : 'output',
        items: [item],
        noReview: true
      })
      await ui.closeModal(modal)
      diary(filter)
    })
  })
}

// ── Caderno gramatical ──────────────────────────────────────
function grammar() {
  const maxPhase = Math.max(state.progress.phase, state.progress.unlocked)
  const html = GRAMMAR.map((g) => {
    const locked = g.phase > maxPhase
    return `<div class="gram ${locked ? 'locked' : ''}">
      <div class="pattern">${escapeHTML(g.pattern)}</div>
      <h3>${escapeHTML(g.title)}${locked ? ` · 🔒 Fase ${g.phase}` : ''}</h3>
      ${locked ? '' : `<p>${escapeHTML(g.explain)}</p>${g.examples.map((e) => `<div class="ex">${toHTML(e.jp)} <span class="tr" style="font-size:13px">— ${escapeHTML(e.pt)}</span></div>`).join('')}`}
    </div>`
  }).join('')
  const intro = `<p style="font-size:13px;margin-top:0">Cores do chunking (ative 🎨 para ver nas frases): <span class="legend" style="display:inline-flex"><span class="l-ref">referência</span><span class="l-no">の</span><span class="l-pos">posição</span><span class="l-part">に/で/へ</span><span class="l-pred">predicado</span></span></p>
    <button class="btn" data-a="analysis">${state.settings.analysis ? '🎨 Desativar' : '🎨 Ativar'} modo de análise</button><br><br>`
  const p = panel('📝 文法ノート · Caderno gramatical', intro + html)
  const modal = open(p)
  p.querySelector('[data-a="analysis"]').addEventListener('click', async () => {
    ui.toggleSetting('analysis')
    await ui.closeModal(modal)
    grammar()
  })
}

// ── Progresso ───────────────────────────────────────────────
function progress() {
  const s = learning.summary()
  const bars = Object.entries(SKILLS)
    .map(([k, label]) => {
      const r = learning.skillRatio(k)
      const sk = state.learning.skills[k] || { correct: 0, wrong: 0 }
      return `<div class="bar"><label><span>${escapeHTML(label)}</span><span>${r == null ? '—' : Math.round(r * 100) + '%'} <small>(${sk.correct}✓ ${sk.wrong}✗)</small></span></label><div class="track"><div class="fill" style="width:${r == null ? 0 : Math.round(r * 100)}%"></div></div></div>`
    })
    .join('')
  const rec = learning.recurring()
  const review = learning.reviewList()
  const phases = PHASES.map(
    (ph) =>
      `${state.progress.completed.includes(ph.id) ? '✅' : ph.id <= state.progress.unlocked ? '▶' : '🔒'} Fase ${ph.id}: ${ph.title}`
  ).join('<br>')
  const body = `
    <div class="stats">
      <div class="stat"><b>${s.seen}/${VOCAB.length}</b><span>palavras vistas</span></div>
      <div class="stat"><b>${s.learned}</b><span>palavras aprendidas</span></div>
      <div class="stat"><b>${s.attempts}</b><span>tentativas</span></div>
      <div class="stat"><b>${Math.round(s.accuracy * 100)}%</b><span>acertos (${s.correct}✓ ${s.wrong}✗)</span></div>
      <div class="stat"><b>${s.challenges}</b><span>desafios concluídos</span></div>
      <div class="stat"><b>${s.review}</b><span>para revisar</span></div>
    </div>
    <h3 style="font-weight:normal">Progresso por habilidade</h3><div class="bars">${bars}</div>
    <h3 style="font-weight:normal">Dificuldades recorrentes</h3>
    <p style="font-size:14px">${rec.length ? rec.map((r) => `• ${escapeHTML(r.label)} — ${r.count} erro(s)`).join('<br>') : 'Nenhuma ainda. Continue explorando!'}</p>
    <h3 style="font-weight:normal">Precisa de revisão</h3>
    <p style="font-size:16px">${review.length ? review.map((id) => toHTML(VOCAB_BY_ID[id].word)).join('、 ') : 'Nada pendente 🎉'}</p>
    ${review.length ? '<button class="btn primary" data-a="review">🔁 Revisar agora</button>' : ''}
    <h3 style="font-weight:normal">Fases</h3><p style="font-size:14px">${phases}</p>
    <div class="disclaimer">ℹ️ Estes números medem a sua prática dentro do jogo. A pontuação <b>não</b> é uma certificação de proficiência (como o JLPT). Use-a para decidir o que revisar.</div>`
  const p = panel('📊 Progresso de aprendizagem', body)
  const modal = open(p)
  p.querySelector('[data-a="review"]')?.addEventListener('click', async () => {
    await runPuzzles({
      title: 'ふくしゅう · Revisão',
      stage: 'intake',
      items: reviewItems(review, 4),
      noReview: true
    })
    await ui.closeModal(modal)
    progress()
  })
}

// ── Configurações ───────────────────────────────────────────
function settings() {
  const s = state.settings
  const sw = (key, label, sub) =>
    `<div class="setting"><div>${label}<small>${sub}</small></div><button class="switch ${s[key] ? 'on' : ''}" data-k="${key}" role="switch" aria-checked="${!!s[key]}" aria-label="${label}"></button></div>`
  const body = `<div class="settings">
    ${sw('furigana', 'Furigana', 'Leitura em hiragana sobre os kanji')}
    ${sw('translation', 'Tradução', 'Mostrar tradução em português')}
    ${sw('analysis', 'Modo de análise gramatical', 'Cores: referência, の, posição, partícula, predicado')}
    ${sw('voice', 'Voz japonesa', 'Lê as falas em voz alta (se o navegador tiver voz ja-JP)')}
    ${sw('reducedMotion', 'Reduzir movimento', 'Menos animações e transições')}
    ${sw('timer', 'Desafios cronometrados', 'Desligado = jogar sem limite de tempo')}
    ${sw('minimap', 'Minimapa', 'Mapa no canto da tela')}
    <div class="setting"><div>Volume geral</div><input type="range" min="0" max="1" step="0.05" value="${s.volume}" data-r="volume" aria-label="Volume geral"></div>
    <div class="setting"><div>Música</div><input type="range" min="0" max="1" step="0.05" value="${s.music}" data-r="music" aria-label="Volume da música"></div>
    <div class="setting"><div>Velocidade do texto</div><select data-s="textSpeed">${['slow', 'normal', 'fast', 'instant'].map((v) => `<option value="${v}" ${s.textSpeed === v ? 'selected' : ''}>${{ slow: 'Lenta', normal: 'Normal', fast: 'Rápida', instant: 'Instantânea' }[v]}</option>`).join('')}</select></div>
    <div class="setting"><div>Controles touch<small>Direcional e botão de ação na tela</small></div><select data-s="touch">${['auto', 'on', 'off'].map((v) => `<option value="${v}" ${s.touch === v ? 'selected' : ''}>${{ auto: 'Automático', on: 'Sempre', off: 'Nunca' }[v]}</option>`).join('')}</select></div>
    <div class="setting"><div>Atalhos<small>Setas/WASD andar · E/Espaço interagir · M mapa · F furigana · T tradução · X análise · I J K P painéis</small></div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" data-a="menu">🏠 Menu principal</button>
      <button class="btn" data-a="reset">🗑 Apagar progresso</button>
    </div></div>`
  const p = panel('⚙️ Configurações', body)
  const modal = open(p)
  p.querySelectorAll('.switch').forEach((b) =>
    b.addEventListener('click', () => {
      ui.setSetting(b.dataset.k, !state.settings[b.dataset.k])
      b.classList.toggle('on', state.settings[b.dataset.k])
      b.setAttribute('aria-checked', state.settings[b.dataset.k])
    })
  )
  p.querySelectorAll('input[type=range]').forEach((r) =>
    r.addEventListener('input', () => ui.setSetting(r.dataset.r, Number(r.value)))
  )
  p.querySelectorAll('select').forEach((sel) =>
    sel.addEventListener('change', () => ui.setSetting(sel.dataset.s, sel.value))
  )
  p.querySelector('[data-a="menu"]').addEventListener('click', async () => {
    saves.save()
    await ui.closeModal(modal)
    bus.emit('game:menu')
  })
  p.querySelector('[data-a="reset"]').addEventListener('click', async () => {
    if (!window.confirm('Apagar todo o progresso e o histórico de aprendizagem?')) return
    saves.reset()
    await ui.closeModal(modal)
    bus.emit('game:menu')
  })
}

const PANELS = { inventory, diary, grammar, progress, settings }

export const panels = {
  open(name, ...args) {
    PANELS[name]?.(...args)
  }
}
