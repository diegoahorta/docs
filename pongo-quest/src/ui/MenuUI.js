// Tela de abertura ODU Creative, menu principal, seleção de fases,
// história de abertura (cutscene GSAP) e créditos.
import { gsap } from 'gsap'
import { state } from '../systems/GameState.js'
import { saves } from '../systems/SaveSystem.js'
import { audio } from '../systems/AudioSystem.js'
import { PHASES } from '../data/phases.js'
import { BRAND } from '../config/gameConfig.js'
import { ui } from './UIManager.js'
import { panels } from './Panels.js'
import { toHTML, rubyHTML } from './ruby.js'
import { portrait } from './portraits.js'
import { motionOK } from '../animations/fx.js'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function screen(cls, html) {
  const el = ui.el('div', `screen ${cls}`, html)
  ui.root.appendChild(el)
  return el
}

/** Abertura cinematográfica com a marca. */
export async function brandSplash() {
  const el = screen(
    'splash',
    `<div><div class="logo">ODU <b>Creative</b></div><div class="tag">${BRAND.tagline.toUpperCase()}</div></div>`
  )
  if (!motionOK()) {
    await wait(900)
    el.remove()
    return
  }
  const letters = el.querySelector('.logo')
  await gsap
    .timeline()
    .from(letters, { scale: 0.6, autoAlpha: 0, duration: 0.7, ease: 'back.out(1.7)' })
    .from(
      el.querySelector('.tag'),
      { letterSpacing: '1em', autoAlpha: 0, duration: 0.8 },
      '-=0.2'
    )
    .to(el, { autoAlpha: 0, duration: 0.5, delay: 0.9 })
  el.remove()
}

/** Menu principal. Retorna a ação escolhida. */
export function mainMenu() {
  return new Promise((resolve) => {
    const hasSave = saves.hasSave()
    const el = screen(
      'title-screen',
      `<div class="title-box">
        <div class="brand">${BRAND.name} — ${BRAND.tagline}</div>
        <h1>PONGO<small>${rubyHTML('{方向|ほうこう}の{冒険|ぼうけん}')}</small></h1>
        <div style="font-size:15px;margin-top:6px">The Japanese Direction Quest · JLPT N5 (+N4)</div>
        <div class="menu">
          ${hasSave ? '<button class="btn primary" data-a="continue">▶ Continuar</button>' : ''}
          <button class="btn ${hasSave ? '' : 'primary'}" data-a="new">✨ Novo jogo</button>
          <button class="btn" data-a="phases">🗺️ Seleção de fases</button>
          <button class="btn" data-a="diary">📖 Diário de vocabulário</button>
          <button class="btn" data-a="settings">⚙️ Configurações</button>
          <button class="btn" data-a="credits">ℹ️ Créditos</button>
        </div>
      </div>`
    )
    if (motionOK()) {
      gsap.from(el.querySelector('h1'), {
        y: -40,
        autoAlpha: 0,
        duration: 0.8,
        ease: 'bounce.out'
      })
      gsap.from(el.querySelectorAll('.menu .btn'), {
        x: -30,
        autoAlpha: 0,
        stagger: 0.07,
        duration: 0.35,
        delay: 0.3
      })
    }
    el.querySelector('.menu .btn')?.focus()
    el.addEventListener('click', async (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a
      if (!a) return
      audio.ensure()
      audio.sfx('confirm')
      if (a === 'diary' || a === 'settings') return panels.open(a)
      if (a === 'credits') return credits()
      if (a === 'phases') {
        const ph = await phaseSelect()
        if (ph) {
          el.remove()
          resolve({ action: 'phase', phase: ph })
        }
        return
      }
      if (
        a === 'new' &&
        hasSave &&
        !window.confirm('Começar um novo jogo apaga o progresso salvo. Continuar?')
      )
        return
      el.remove()
      resolve({ action: a })
    })
  })
}

function phaseSelect() {
  return new Promise((resolve) => {
    const p = ui.el('div', 'card panel')
    const unlocked = state.progress.unlocked
    p.innerHTML = `<header><h2>🗺️ Seleção de fases</h2><button class="btn close">✕</button></header>
      <div class="content"><div class="phase-list">${PHASES.map(
        (
          ph
        ) => `<button class="btn phase-item ${ph.id > unlocked ? 'locked' : ''}" data-p="${ph.id}" ${ph.id > unlocked ? 'disabled' : ''}>
          <span class="n">${state.progress.completed.includes(ph.id) ? '✅' : ph.id > unlocked ? '🔒' : ph.id}</span>
          <span>FASE ${ph.id} — ${ph.title} <span lang="ja">${rubyHTML(ph.titleJp)}</span><small>${ph.goal}</small></span></button>`
      ).join(
        ''
      )}</div><p style="font-size:12px">Fases são desbloqueadas ao concluir a anterior.</p></div>`
    const modal = ui.openModal(p, { onClose: () => resolve(null) })
    p.querySelector('.close').addEventListener('click', () => ui.closeModal(modal))
    p.querySelectorAll('[data-p]').forEach((b) =>
      b.addEventListener('click', async () => {
        const id = Number(b.dataset.p)
        modal.onClose = null
        await ui.closeModal(modal)
        resolve(id)
      })
    )
  })
}

function credits() {
  const p = ui.el('div', 'card panel')
  p.innerHTML = `<header><h2>ℹ️ Créditos</h2><button class="btn close">✕</button></header><div class="content" style="font-size:14px;line-height:1.6">
    <p><b>PONGO: 方向の冒険</b> — um jogo da <b>${BRAND.name}</b>. <i>${BRAND.tagline}</i></p>
    <p>Conteúdo: direções (北・南・東・西), relativas (右・左・前・後ろ), localização (上・下・中・外・隣・近く・間・向こう・そば), ここ・そこ・あそこ・この辺, あります/います e partículas の・に・で・へ (JLPT N5, consolidação N4).</p>
    <p>Tecnologia: Phaser 3 (mundo 2D), GSAP (interface e cutscenes), Vite. Arte e sons gerados por código — substitua por assets finais em <code>public/assets</code>.</p>
    <p>Fonte: DotGothic16 (SIL Open Font License).</p></div>`
  const modal = ui.openModal(p)
  p.querySelector('.close').addEventListener('click', () => ui.closeModal(modal))
}

/** História de abertura (cutscene). */
export async function storyIntro() {
  const panelsData = [
    {
      art: '🚃',
      jp: 'ことばの{町|まち}へ ようこそ！',
      pt: 'Pongo chega de trem a ことばの町 — a Cidade das Palavras.'
    },
    {
      art: '😼🌀',
      jp: 'にゃはは！ {方向|ほうこう}を ぜんぶ まぜて やったにゃ！',
      pt: 'Mas まよいネコ, o Gato Desorientador, embaralhou placas, mapas e direções!'
    },
    {
      art: '🧭❓',
      jp: '{看板|かんばん}も コンパスも めちゃくちゃ…',
      pt: 'Ninguém sabe mais onde fica a estação, o parque ou a escola…'
    },
    {
      art: '🦧✨',
      jp: 'ポンゴ、{日本語|にほんご}で {町|まち}を たすけて！',
      pt: 'Aprenda japonês com os moradores e restaure a cidade!'
    }
  ]
  const el = screen(
    '',
    `<div class="card story"><div class="scene-art"></div><div class="jp-line"></div><p class="tr"></p><div style="display:flex;justify-content:space-between;align-items:center"><button class="btn ghost skip">Pular ⏭</button><button class="btn primary nx">▶</button></div></div>`
  )
  const card = el.querySelector('.story')
  let skip = false
  el.querySelector('.skip').onclick = () => (skip = true)
  for (const p of panelsData) {
    if (skip) break
    el.querySelector('.scene-art').innerHTML = p.art.includes('😼')
      ? `<img alt="" src="${portrait('mayoi')}" style="width:80px;image-rendering:pixelated"> 🌀`
      : p.art
    el.querySelector('.jp-line').innerHTML = toHTML(p.jp)
    el.querySelector('.tr').textContent = p.pt
    if (motionOK())
      gsap.fromTo(
        card.children,
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.35 }
      )
    audio.speak(p.jp)
    await new Promise((r) => {
      const go = () => {
        window.removeEventListener('keydown', onKey)
        r()
      }
      const onKey = (e) => ['Enter', 'Space', 'KeyE'].includes(e.code) && go()
      el.querySelector('.nx').onclick = go
      el.querySelector('.skip').onclick = () => {
        skip = true
        go()
      }
      window.addEventListener('keydown', onKey)
    })
  }
  el.remove()
}

/** Tela de conclusão / resultado. */
export function resultScreen({ stats, onMenu, onExplore }) {
  const el = screen(
    'overlay',
    `<div class="card result">
      <div style="font-size:56px">🏆</div>
      <h1>${rubyHTML('おめでとう！')}</h1>
      <p>Pongo restaurou ことばの町! まよいネコ agora é amigo da cidade.</p>
      <div class="diploma">
        <div style="font-size:13px;letter-spacing:.2em">${BRAND.name.toUpperCase()} · DIPLOMA DE EXPLORADOR</div>
        <div style="font-size:26px;margin:6px 0">${rubyHTML('{方向|ほうこう}マスター')}</div>
        <div class="stats">
          <div class="stat"><b>${stats.seen}</b><span>palavras vistas</span></div>
          <div class="stat"><b>${stats.learned}</b><span>aprendidas</span></div>
          <div class="stat"><b>${Math.round(stats.accuracy * 100)}%</b><span>acertos</span></div>
          <div class="stat"><b>${stats.challenges}</b><span>desafios</span></div>
        </div>
        <div class="disclaimer">Este diploma celebra a sua prática no jogo — não é uma certificação oficial de proficiência.</div>
      </div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="btn primary" data-a="explore">🚶 Explorar livremente</button>
        <button class="btn" data-a="menu">🏠 Menu</button>
      </div></div>`
  )
  if (motionOK())
    gsap.from(el.querySelector('.result'), {
      scale: 0.7,
      autoAlpha: 0,
      duration: 0.6,
      ease: 'back.out(1.6)'
    })
  el.querySelector('[data-a="explore"]').onclick = () => {
    el.remove()
    onExplore()
  }
  el.querySelector('[data-a="menu"]').onclick = () => {
    el.remove()
    onMenu()
  }
}
