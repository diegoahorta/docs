// Vocabulário do Katakana Show: palavras do dia a dia escritas em katakana
// (a maioria vem de outras línguas, inclusive do português!).
// Cada palavra: kana, significado em português, emoji, categoria e, às vezes,
// uma curiosidade. O romaji é calculado a partir do kana (vogal longa dobrada: "keeki").

import { lerEmRomaji, nivelDaPalavra } from './katakana.js';

export const CATEGORIAS = Object.freeze({
  comida: { nome: 'Comida', emoji: '🍔' },
  esportes: { nome: 'Esportes', emoji: '⚽' },
  tecnologia: { nome: 'Tecnologia', emoji: '📱' },
  arte: { nome: 'Música e arte', emoji: '🎸' },
  escola: { nome: 'Escola e casa', emoji: '🎒' },
  roupas: { nome: 'Roupas', emoji: '👕' },
  lugares: { nome: 'Lugares', emoji: '🏙️' },
  transporte: { nome: 'Transporte', emoji: '🚌' },
  animais: { nome: 'Animais', emoji: '🦁' },
});

const PALAVRAS = [
  // Comida
  [
    'パン',
    'pão',
    '🍞',
    'comida',
    'Veio do português "pão", trazido pelos portugueses no século XVI!',
  ],
  ['ケーキ', 'bolo', '🎂', 'comida', 'Do inglês "cake".'],
  ['コーヒー', 'café', '☕', 'comida', 'Do holandês "koffie".'],
  ['ピザ', 'pizza', '🍕', 'comida'],
  ['バナナ', 'banana', '🍌', 'comida'],
  ['トマト', 'tomate', '🍅', 'comida'],
  ['メロン', 'melão', '🍈', 'comida'],
  ['レモン', 'limão', '🍋', 'comida'],
  ['アイス', 'sorvete', '🍦', 'comida', 'Do inglês "ice (cream)".'],
  ['ラーメン', 'lámen', '🍜', 'comida'],
  ['ハンバーガー', 'hambúrguer', '🍔', 'comida'],
  ['ジュース', 'suco', '🧃', 'comida', 'Do inglês "juice".'],
  ['チョコレート', 'chocolate', '🍫', 'comida'],
  ['クッキー', 'biscoito', '🍪', 'comida', 'Do inglês "cookie".'],
  ['サラダ', 'salada', '🥗', 'comida'],
  ['ドーナツ', 'rosquinha (donut)', '🍩', 'comida'],
  ['ポテト', 'batata frita', '🍟', 'comida', 'Do inglês "potato".'],
  ['カステラ', 'pão de ló', '🍰', 'comida', 'Vem do português "pão de Castela"!'],
  ['ミルク', 'leite', '🥛', 'comida', 'Do inglês "milk".'],
  ['オレンジ', 'laranja', '🍊', 'comida'],
  ['チーズ', 'queijo', '🧀', 'comida', 'Do inglês "cheese".'],
  ['ホットドッグ', 'cachorro-quente', '🌭', 'comida', 'Do inglês "hot dog".'],
  // Esportes
  ['サッカー', 'futebol', '⚽', 'esportes', 'Do inglês "soccer".'],
  ['テニス', 'tênis', '🎾', 'esportes'],
  ['バスケ', 'basquete', '🏀', 'esportes', 'Abreviação de バスケットボール (basketball).'],
  ['バレー', 'vôlei', '🏐', 'esportes', 'Abreviação de バレーボール (volleyball).'],
  ['ゴルフ', 'golfe', '⛳', 'esportes'],
  ['スキー', 'esqui', '⛷️', 'esportes'],
  ['ボクシング', 'boxe', '🥊', 'esportes'],
  ['ダンス', 'dança', '💃', 'esportes'],
  // Tecnologia
  ['スマホ', 'celular', '📱', 'tecnologia', 'Abreviação de "smartphone" (スマートフォン).'],
  ['パソコン', 'computador', '💻', 'tecnologia', 'Abreviação de "personal computer".'],
  ['テレビ', 'televisão', '📺', 'tecnologia'],
  ['カメラ', 'câmera', '📷', 'tecnologia'],
  ['ゲーム', 'videogame', '🎮', 'tecnologia', 'Do inglês "game".'],
  ['ロボット', 'robô', '🤖', 'tecnologia'],
  ['メール', 'e-mail', '📧', 'tecnologia', 'Do inglês "mail".'],
  ['インターネット', 'internet', '🌐', 'tecnologia'],
  // Música e arte
  ['ピアノ', 'piano', '🎹', 'arte'],
  ['ギター', 'violão / guitarra', '🎸', 'arte'],
  ['ドラム', 'bateria', '🥁', 'arte', 'Do inglês "drum".'],
  ['アニメ', 'anime (desenho animado)', '🎞️', 'arte', 'Abreviação de アニメーション (animation).'],
  [
    'マンガ',
    'mangá (quadrinhos)',
    '📚',
    'arte',
    'É japonesa, mas costuma ser escrita em katakana.',
  ],
  ['カラオケ', 'karaokê', '🎤', 'arte', 'Japonês "kara" (vazio) + "oke" (de orquestra).'],
  // Escola e casa
  ['ペン', 'caneta', '🖊️', 'escola'],
  ['ノート', 'caderno', '📓', 'escola', 'Do inglês "notebook".'],
  ['テスト', 'prova', '📝', 'escola', 'Do inglês "test".'],
  ['コップ', 'copo', '🥤', 'escola', 'Do holandês "kop" (parecido com o nosso "copo").'],
  ['ベッド', 'cama', '🛏️', 'escola', 'Do inglês "bed".'],
  ['テーブル', 'mesa', '🪑', 'escola', 'Do inglês "table".'],
  // Roupas
  ['シャツ', 'camisa', '👕', 'roupas', 'Do inglês "shirt".'],
  ['スカート', 'saia', '👗', 'roupas'],
  ['コート', 'casaco', '🧥', 'roupas'],
  ['マフラー', 'cachecol', '🧣', 'roupas'],
  ['ボタン', 'botão', '🔘', 'roupas', 'Veio do português "botão"!'],
  ['キャップ', 'boné', '🧢', 'roupas', 'Do inglês "cap".'],
  // Lugares
  ['ホテル', 'hotel', '🏨', 'lugares'],
  ['トイレ', 'banheiro', '🚻', 'lugares', 'Do inglês "toilet".'],
  ['レストラン', 'restaurante', '🍽️', 'lugares'],
  ['コンビニ', 'loja de conveniência', '🏪', 'lugares', 'Abreviação de "convenience store".'],
  ['ビル', 'prédio', '🏢', 'lugares', 'Do inglês "building".'],
  ['スーパー', 'supermercado', '🛒', 'lugares'],
  ['プール', 'piscina', '🏊', 'lugares', 'Do inglês "pool".'],
  ['ブラジル', 'Brasil', '🇧🇷', 'lugares'],
  // Transporte
  ['バス', 'ônibus', '🚌', 'transporte', 'Do inglês "bus".'],
  ['タクシー', 'táxi', '🚕', 'transporte'],
  ['ヘリコプター', 'helicóptero', '🚁', 'transporte'],
  ['ボート', 'barco', '🚤', 'transporte', 'Do inglês "boat".'],
  ['バイク', 'moto', '🏍️', 'transporte', 'Do inglês "bike".'],
  ['ロケット', 'foguete', '🚀', 'transporte', 'Do inglês "rocket".'],
  // Animais
  ['ライオン', 'leão', '🦁', 'animais', 'Do inglês "lion".'],
  ['パンダ', 'panda', '🐼', 'animais'],
  ['コアラ', 'coala', '🐨', 'animais'],
  ['ペンギン', 'pinguim', '🐧', 'animais'],
  ['ゴリラ', 'gorila', '🦍', 'animais'],
  ['キリン', 'girafa', '🦒', 'animais', 'É japonesa, mas costuma ser escrita em katakana.'],
  ['カンガルー', 'canguru', '🦘', 'animais'],
  ['イルカ', 'golfinho', '🐬', 'animais', 'É japonesa, mas costuma ser escrita em katakana.'],
];

export const PALAVRAS_KATAKANA = Object.freeze(
  PALAVRAS.map(([kana, pt, emoji, categoria, curiosidade]) =>
    Object.freeze({
      id: `p:${kana}`,
      kana,
      romaji: lerEmRomaji(kana),
      pt,
      emoji,
      categoria,
      curiosidade: curiosidade ?? null,
      nivel: nivelDaPalavra(kana),
    }),
  ),
);

/** Palavras até um nível de dificuldade (1, 2 ou 3). */
export function palavrasAteNivel(nivel) {
  return PALAVRAS_KATAKANA.filter((palavra) => palavra.nivel <= nivel);
}
