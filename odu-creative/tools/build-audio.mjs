#!/usr/bin/env node
/**
 * ODU CREATIVE — gerador de áudio + trilha de temporização.
 *
 * Gera, para cada faixa (track) da unidade, um MP3 único e grava em unit.json
 * os timestamps exatos (start/end) de cada segmento. Os tempos vêm da duração
 * real de cada arquivo WAV gerado (não de estimativas nem de eventos do navegador).
 *
 * Também gera arquivos curtos para falas isoladas (jogo, vocabulário, speaking)
 * e registra o mapa em unit.lines.
 *
 * Requisitos: ffmpeg/ffprobe e um motor de voz por idioma:
 *   - espeak-ng (+ vozes MBROLA) — inglês etc.:  sudo apt-get install espeak-ng mbrola mbrola-us1 mbrola-us2 ffmpeg
 *   - Open JTalk — japonês (voz "engine": "openjtalk"):
 *       sudo apt-get install open-jtalk open-jtalk-mecab-naist-jdic hts-voice-nitech-jp-atr503-m001
 *     Para japonês, o script compara a leitura feita pelo Open JTalk com o furigana da unidade
 *     e lista as diferenças (ajuda a achar furigana errado ou leituras que o sintetizador erra).
 *
 * Uso: node tools/build-audio.mjs units/en-a1-cafe [--lines-only] [--tracks-only]
 *
 * As vozes sintéticas são um recurso provisório. Para gravações humanas, use o
 * Painel do Professor (importar áudio + ferramenta de marcação de tempos) ou
 * substitua os MP3 e ajuste start/end no unit.json.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { plain, reading, toHiragana } from '../js/core/jp.js';

const unitDir = resolve(process.argv[2] || 'units/en-a1-cafe');
const flags = new Set(process.argv.slice(3));
const unitPath = join(unitDir, 'unit.json');
const unit = JSON.parse(readFileSync(unitPath, 'utf8'));

const LEAD = 0.4; // silêncio inicial (s)
const GAP = 0.6; // silêncio entre falas (s)
const RATE = 22050;
const tmp = mkdtempSync(join(tmpdir(), 'odu-audio-'));

function hasVoice(v) {
  try {
    execFileSync('espeak-ng', ['-v', v, '-q', 'test'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Ajustes de pronúncia apenas para o sintetizador (o texto exibido não muda). */
function sayable(text) {
  return text.replace(/Café/g, 'Cafe').replace(/\$(\d+)\.(\d\d)/g, '$1 dollars and $2 cents');
}

/** Junta chunks do Discover em uma frase ("I" + "'d like" → "I'd like"). Igual ao front-end. */
export function chunksToText(chunks, join = ' ') {
  return chunks.map((c) => c[0]).join(join).replace(/\s+([,?.!])/g, '$1').replace(/ '/g, "'");
}

const voiceCache = {};
function voiceFor(speaker) {
  const cfg = unit.voices?.[speaker] || unit.voices?.Narrator || { espeak: 'en-us' };
  if (cfg.engine === 'openjtalk') return cfg;
  const key = cfg.espeak;
  if (!(key in voiceCache)) voiceCache[key] = hasVoice(key) ? key : 'en-us';
  return { ...cfg, espeak: voiceCache[key] };
}

const JTALK_DIC = '/var/lib/mecab/dic/open-jtalk/naist-jdic';
const JTALK_VOICE = '/usr/share/hts-voice/nitech-jp-atr503-m001/nitech_jp_atr503_m001.htsvoice';
export const readingWarnings = [];

/** Normaliza kana para comparar leituras (hiragana, sem espaços, pontuação nem letras latinas). */
const LATIN = { A: 'えー', B: 'びー', C: 'しー', L: 'える', M: 'えむ', S: 'えす', T: 'てぃー' };
const kanaKey = (s) => toHiragana(String(s).replace(/[A-Z]/g, (c) => LATIN[c] || ''))
  .replace(/[^\u3041-\u3096ー]/g, '').replace(/ー/g, '');

/** Open JTalk: sintetiza e devolve a leitura (katakana) que o analisador usou. */
function openJtalk(text, v, raw) {
  const trace = raw + '.trace';
  execFileSync('open_jtalk', ['-x', JTALK_DIC, '-m', JTALK_VOICE, '-fm', String(v.fm ?? 0), '-r', String(v.r ?? 1), '-ow', raw, '-ot', trace],
    // O texto com furigana é enviado com a LEITURA nos trechos marcados ({八百|はっぴゃく} → はっぴゃく):
    // assim o áudio fala exatamente o que o aluno lê, mesmo onde o dicionário do Open JTalk erraria.
    { input: reading(text).replace(/ /g, '') + '\n' });
  const out = readFileSync(trace, 'utf8');
  const block = out.split('[Text analysis result]')[1]?.split('[')[0] || '';
  return block.split('\n').filter(Boolean).map((l) => l.split(',')).map((f) => (f[8] && f[8] !== '*' ? f[8] : f[0])).join('');
}

/** Sintetiza texto em WAV normalizado (mono, RATE Hz) e retorna {file, duration}. */
function synth(text, speaker, name) {
  const v = voiceFor(speaker);
  const raw = join(tmp, `${name}.raw.wav`);
  const out = join(tmp, `${name}.wav`);
  if (v.engine === 'openjtalk') {
    const heard = openJtalk(text, v, raw);
    if (kanaKey(heard) !== kanaKey(reading(text))) readingWarnings.push({ text: plain(text), furigana: reading(text), openjtalk: toHiragana(heard) });
  } else {
    execFileSync('espeak-ng', ['-v', v.espeak, '-p', String(v.pitch ?? 50), '-s', String(v.speed ?? 140), '-w', raw, sayable(text)]);
  }
  // remove silêncios das bordas para que start/end reflitam a fala real
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw,
    '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse',
    '-ar', String(RATE), '-ac', '1', out]);
  return { file: out, duration: probe(out) };
}

function probe(file) {
  return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());
}

function silence(sec, name) {
  const f = join(tmp, `${name}.wav`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `anullsrc=r=${RATE}:cl=mono`, '-t', sec.toFixed(3), f]);
  return f;
}

function concatToMp3(files, outFile) {
  const list = join(tmp, `list-${Date.now()}.txt`);
  writeFileSync(list, files.map((f) => `file '${f}'`).join('\n'));
  const wav = join(tmp, `concat-${Date.now()}.wav`);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'pcm_s16le', wav]);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '64k', '-ar', String(RATE), outFile]);
}

const audioDir = join(unitDir, 'audio');
mkdirSync(audioDir, { recursive: true });

// ---------- Faixas com timestamps ----------
if (!flags.has('--lines-only')) {
  const lead = silence(LEAD, 'lead');
  const gap = silence(GAP, 'gap');
  for (const track of unit.tracks) {
    const files = [lead];
    let t = LEAD;
    for (const seg of track.segments) {
      const { file, duration } = synth(seg.text, seg.speaker, seg.id);
      seg.start = +t.toFixed(3);
      t += duration;
      seg.end = +t.toFixed(3);
      files.push(file, gap);
      t += GAP;
    }
    const out = join(unitDir, track.audio);
    concatToMp3(files, out);
    track.duration = +probe(out).toFixed(3);
    track.audioSource = track.segments.some((x) => voiceFor(x.speaker).engine === 'openjtalk') ? 'synthetic-openjtalk' : 'synthetic-espeak-mbrola';
    console.log(`✔ ${track.id}: ${track.segments.length} segmentos, ${track.duration}s → ${track.audio}`);
  }
}

// ---------- Falas isoladas (jogo, vocabulário, speaking) ----------
if (!flags.has('--tracks-only')) {
  const lines = {};
  const add = (text, speaker) => {
    const id = createHash('sha1').update(`${speaker}|${text}`).digest('hex').slice(0, 10);
    if (lines[id]) return;
    const rel = `audio/lines/${id}.mp3`;
    const out = join(unitDir, rel);
    mkdirSync(join(audioDir, 'lines'), { recursive: true });
    if (!existsSync(out) || flags.has('--force')) {
      const { file } = synth(text, speaker, `line-${id}`);
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', file, '-codec:a', 'libmp3lame', '-b:a', '64k', out]);
    }
    lines[id] = { text, speaker, src: rel };
  };
  for (const v of unit.vocabulary) {
    if (v.audioText) add(v.audioText, 'Narrator');
    add(v.term.split(' / ')[0].replace(/[?.]$/, ''), 'Narrator');
    if (v.term.includes(' / ')) add(v.term.replace(/ \/ /g, ', '), 'Narrator');
    if (v.example) add(v.example, 'Narrator');
  }
  for (const m of unit.game.missions) {
    for (const s of m.steps) {
      add(s.npc, unit.game.npcVoice || 'Mia');
      for (const c of s.choices || []) if (c.ok) add(c.text, unit.game.playerVoice || 'Leo');
    }
  }
  const sub = unit.speaking.substitution;
  const playerVoice = unit.game.playerVoice || 'Leo';
  for (const it of sub.items) add(sub.frame.replace(/\{(article|choice)\}/, it.choice ?? it.article).replace('{item}', it.item), playerVoice);
  for (const r of unit.speaking.respond) add(r.model, playerVoice);
  for (const g of unit.grammar) for (const ex of g.examples) add(ex.text ?? ex.en, 'Narrator');
  for (const s of unit.discover?.sentences || []) add(chunksToText(s.chunks, unit.language.code === 'ja' ? '' : ' '), 'Narrator');
  for (const c of unit.flashcards?.cards || []) {
    if (c.order) add(c.order, unit.flashcards.orderVoice || 'Ana');
    const v = unit.vocabulary.find((x) => x.id === c.vocab);
    if (v?.article) add(`${v.article} ${v.term}`, 'Narrator'); // ex.: "an orange juice" (cartas de palavra)
  }
  unit.lines = lines;
  console.log(`✔ ${Object.keys(lines).length} falas isoladas em audio/lines/`);
}

writeFileSync(unitPath, JSON.stringify(unit, null, 2) + '\n');
if (readingWarnings.length) {
  console.log(`⚠ ${readingWarnings.length} frase(s) em que a leitura do Open JTalk difere do furigana (confira):`);
  for (const w of readingWarnings) console.log(`  · ${w.text}\n      furigana: ${kanaKey(w.furigana)}\n      openjtalk: ${kanaKey(w.openjtalk)}`);
}
rmSync(tmp, { recursive: true, force: true });
console.log('✔ unit.json atualizado com a trilha de temporização.');
