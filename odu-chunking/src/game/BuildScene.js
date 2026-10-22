import * as Phaser from 'phaser';
import { sentenceText } from '../core/blocks.js';
import { hexToInt, tokens } from '../core/theme.js';

const TILE_H = 46;
const GAP = 10;
const FONT = '"Atkinson Hyperlegible", "Segoe UI", system-ui, sans-serif';
const RES = Math.min(window.devicePixelRatio || 1, 2);
const DISPLAY = '"Bricolage Grotesque", "Atkinson Hyperlegible", system-ui, sans-serif';

/**
 * Cena de "Organização sintática": os blocos embaralhados ficam embaixo e o
 * aluno toca ou arrasta cada um para a linha da frase, na ordem do idioma.
 */
export class BuildScene extends Phaser.Scene {
  constructor() {
    super('build');
    this.round = null;
    this.tiles = [];
    this.answer = [];
    this.locked = false;
  }

  create() {
    this.theme = tokens();
    this.cameras.main.setBackgroundColor(this.theme.surface);

    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1).fillRoundedRect(0, 0, 10, 10, 3);
    g.generateTexture('spark', 10, 10);
    g.destroy();

    this.zoneG = this.add.graphics();
    this.langText = this.add.text(0, 0, '', {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '14px',
      resolution: RES,
    });
    this.promptText = this.add.text(0, 0, '', {
      fontFamily: DISPLAY,
      fontSize: '26px',
      fontStyle: 'bold',
      align: 'center',
      resolution: RES,
    });
    this.hintText = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '15px', align: 'center', resolution: RES });
    this.resultText = this.add.text(0, 0, '', {
      fontFamily: FONT,
      fontSize: '18px',
      fontStyle: 'bold',
      align: 'center',
      resolution: RES,
    });
    [this.langText, this.promptText, this.hintText, this.resultText].forEach((t) => t.setOrigin(0.5, 0));

    this.input.on('dragstart', (_p, tile) => {
      if (this.locked) return;
      tile.moved = false;
      tile.setDepth(10);
      this.tweens.add({ targets: tile, scale: 1.06, duration: 120 });
    });
    this.input.on('drag', (_p, tile, x, y) => {
      if (this.locked) return;
      if (Phaser.Math.Distance.Between(x, y, tile.x, tile.y) > 2) tile.moved = true;
      tile.x = x;
      tile.y = y;
    });
    this.input.on('dragend', (pointer, tile) => {
      tile.setDepth(1);
      this.tweens.add({ targets: tile, scale: 1, duration: 120 });
      if (this.locked || !tile.moved) return;
      this.drop(tile, pointer.x, pointer.y);
    });

    this.scale.on('resize', () => this.layout(false));
    this.events.emit('ready');
    this.game.events.emit('scene-ready', this);
  }

  /* ---------- Rodada ---------- */

  startRound(round, index, total) {
    this.tiles.forEach((t) => t.destroy());
    this.tiles = [];
    this.answer = [];
    this.locked = false;
    this.round = round;
    this.resultText.setText('');
    this.langText.setText(`${round.lang.toUpperCase()} · RODADA ${index + 1} DE ${total}`);
    this.promptText.setText(round.sentence.pt);
    this.hintText.setText('Toque nos blocos na ordem certa ou arraste para a linha. Um bloco sobra.');
    if (round.tiles.length === round.answer.length)
      this.hintText.setText('Toque nos blocos na ordem certa ou arraste para a linha.');

    for (const data of round.tiles) this.tiles.push(this.makeTile(data));
    this.layout(false);
    this.tiles.forEach((t, i) => {
      const y = t.y;
      t.y = y + 40;
      t.alpha = 0;
      this.tweens.add({ targets: t, y, alpha: 1, duration: 320, delay: i * 45, ease: 'Back.out' });
    });
    this.emitChange();
  }

  makeTile(data) {
    const text = this.add
      .text(0, 0, data.label, { fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', resolution: RES })
      .setOrigin(0.5);
    const w = Math.max(56, text.width + 30);
    const bg = this.add.graphics();
    const tile = this.add.container(0, 0, [bg, text]);
    tile.setSize(w, TILE_H);
    tile.data_ = data;
    tile.tileW = w;
    tile.bg = bg;
    tile.label = text;
    tile.state = 'pool';
    this.paintTile(tile);
    tile.setInteractive({ useHandCursor: true, draggable: true });
    tile.on('pointerup', () => {
      if (this.locked || tile.moved) {
        tile.moved = false;
        return;
      }
      this.toggle(tile);
    });
    return tile;
  }

  paintTile(tile, outline = null) {
    const color = hexToInt(this.theme.blocks[tile.data_.b]);
    const w = tile.tileW;
    const g = tile.bg;
    g.clear();
    g.fillStyle(0x000000, 0.18).fillRoundedRect(-w / 2, -TILE_H / 2 + 3, w, TILE_H, 8);
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -TILE_H / 2, w, TILE_H - 3, 8);
    if (outline)
      g.lineStyle(3, hexToInt(outline), 1).strokeRoundedRect(-w / 2 - 3, -TILE_H / 2 - 3, w + 6, TILE_H + 6, 10);
    tile.label.setColor(this.theme.onBlock);
    tile.label.setY(-1.5);
  }

  toggle(tile) {
    if (tile.state === 'pool') {
      tile.state = 'answer';
      this.answer.push(tile);
    } else {
      tile.state = 'pool';
      this.answer = this.answer.filter((t) => t !== tile);
    }
    this.layout(true);
    this.emitChange();
  }

  drop(tile, x, y) {
    const inAnswer = y < this.zone.y + this.zone.h + 10;
    this.answer = this.answer.filter((t) => t !== tile);
    if (inAnswer) {
      // Posição de inserção: antes do primeiro bloco que está depois do ponteiro.
      const idx = this.answer.findIndex(
        (t) => t.y > y + TILE_H / 2 || (Math.abs(t.y - y) <= TILE_H / 2 + 4 && t.x > x),
      );
      tile.state = 'answer';
      this.answer.splice(idx < 0 ? this.answer.length : idx, 0, tile);
    } else {
      tile.state = 'pool';
    }
    this.layout(true);
    this.emitChange();
  }

  clearAnswer() {
    if (this.locked) return;
    this.answer.forEach((t) => (t.state = 'pool'));
    this.answer = [];
    this.layout(true);
    this.emitChange();
  }

  emitChange() {
    this.game.events.emit('answer-changed', this.answer.length);
  }

  chosen() {
    return this.answer.map((t) => t.data_);
  }

  /* ---------- Resultado ---------- */

  showResult(ok) {
    this.locked = true;
    const { lang, sentence } = this.round;
    const full = sentenceText(lang, sentence.blocks[lang], sentence.p);
    if (ok) {
      this.resultText.setColor(this.theme.ink).setText(full);
      this.answer.forEach((t, i) =>
        this.tweens.add({ targets: t, y: t.y - 10, duration: 160, yoyo: true, delay: i * 50, ease: 'Sine.out' }),
      );
      this.burst();
    } else {
      this.cameras.main.shake(220, 0.006);
      // Reorganiza mostrando a ordem correta e destaca o bloco que sobra.
      const right = sentence.blocks[lang].map((b) => b.t);
      const pool = [...this.tiles];
      const ordered = right.map((txt) => {
        const i = pool.findIndex((t) => t.data_.t === txt);
        return pool.splice(i, 1)[0];
      });
      this.answer.forEach((t) => (t.state = 'pool'));
      ordered.forEach((t) => (t.state = 'answer'));
      this.answer = ordered;
      pool.forEach((t) => {
        t.state = 'pool';
        t.alpha = 0.35;
      });
      this.time.delayedCall(260, () => this.layout(true));
      this.resultText.setColor(this.theme.ink).setText(`Ordem correta: ${full}`);
    }
  }

  burst() {
    const colors = this.theme.blocks.slice(1).map(hexToInt);
    const z = this.zone;
    const emitter = this.add.particles(z.x + z.w / 2, z.y + z.h / 2, 'spark', {
      speed: { min: 140, max: 420 },
      angle: { min: 0, max: 360 },
      lifespan: 900,
      scale: { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
      gravityY: 380,
      tint: colors,
      quantity: 36,
      emitting: false,
    });
    emitter.setDepth(20);
    emitter.explode(36);
    this.time.delayedCall(1200, () => emitter.destroy());
  }

  /* ---------- Layout ---------- */

  rows(list, maxW) {
    const rows = [[]];
    let w = 0;
    for (const t of list) {
      if (w + t.tileW > maxW && rows[rows.length - 1].length) {
        rows.push([]);
        w = 0;
      }
      rows[rows.length - 1].push(t);
      w += t.tileW + GAP;
    }
    return rows;
  }

  place(list, top, width, animate) {
    const rows = this.rows(list, width - 32);
    rows.forEach((row, r) => {
      const rowW = row.reduce((s, t) => s + t.tileW, 0) + GAP * (row.length - 1);
      let x = (width - rowW) / 2;
      for (const t of row) {
        const tx = x + t.tileW / 2;
        const ty = top + r * (TILE_H + GAP) + TILE_H / 2;
        if (animate) this.tweens.add({ targets: t, x: tx, y: ty, duration: 260, ease: 'Cubic.out' });
        else t.setPosition(tx, ty);
        x += t.tileW + GAP;
      }
    });
    return rows.length * (TILE_H + GAP);
  }

  layout(animate) {
    const { width, height } = this.scale;
    const narrow = width < 520;
    this.promptText.setFontSize(narrow ? 21 : 26).setWordWrapWidth(width - 40);
    this.hintText.setWordWrapWidth(width - 40);
    this.resultText.setWordWrapWidth(width - 40);
    this.langText.setColor(this.theme.muted).setPosition(width / 2, 18);
    this.promptText.setColor(this.theme.ink).setPosition(width / 2, 42);
    const zoneTop = this.promptText.y + this.promptText.height + 22;

    const answerRows = Math.max(1, this.rows(this.answer, width - 32).length);
    const zoneH = Math.max(TILE_H + 24, answerRows * (TILE_H + GAP) + 14);
    this.zone = { x: 12, y: zoneTop, w: width - 24, h: zoneH };

    const g = this.zoneG;
    g.clear();
    g.fillStyle(hexToInt(this.theme.bg), 1).fillRoundedRect(this.zone.x, this.zone.y, this.zone.w, this.zone.h, 12);
    g.lineStyle(2, hexToInt(this.theme.line), 1);
    g.strokeRoundedRect(this.zone.x, this.zone.y, this.zone.w, this.zone.h, 12);
    if (!this.answer.length) {
      // Linha tracejada indicando onde a frase será montada.
      const y = this.zone.y + this.zone.h / 2;
      for (let x = this.zone.x + 24; x < this.zone.x + this.zone.w - 24; x += 14) g.lineBetween(x, y, x + 7, y);
    }

    this.place(this.answer, zoneTop + 12, width, animate);
    const poolTop = zoneTop + zoneH + 26;
    const pool = this.tiles.filter((t) => t.state === 'pool');
    const used = this.place(pool, poolTop, width, animate);
    this.resultText.setPosition(width / 2, Math.min(height - 70, poolTop + used + 6));
    this.hintText
      .setColor(this.theme.muted)
      .setPosition(width / 2, height - 34)
      .setVisible(!this.locked && height > 360);
  }

  applyTheme() {
    this.theme = tokens();
    this.cameras.main.setBackgroundColor(this.theme.surface);
    this.tiles.forEach((t) => this.paintTile(t));
    this.layout(false);
  }
}
