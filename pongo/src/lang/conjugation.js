// Motor de conjugação japonesa (Grupos I, II e III).
// Trabalha em paralelo na forma com kanji e na leitura em kana,
// para que o furigana possa ser alinhado com autoRuby().

const I_ROW = {
  う: 'い',
  く: 'き',
  ぐ: 'ぎ',
  す: 'し',
  つ: 'ち',
  ぬ: 'に',
  ぶ: 'び',
  む: 'み',
  る: 'り'
}
const A_ROW = {
  う: 'わ',
  く: 'か',
  ぐ: 'が',
  す: 'さ',
  つ: 'た',
  ぬ: 'な',
  ぶ: 'ば',
  む: 'ま',
  る: 'ら'
}
const E_ROW = {
  う: 'え',
  く: 'け',
  ぐ: 'げ',
  す: 'せ',
  つ: 'て',
  ぬ: 'ね',
  ぶ: 'べ',
  む: 'め',
  る: 'れ'
}
const TE = {
  う: 'って',
  つ: 'って',
  る: 'って',
  む: 'んで',
  ぶ: 'んで',
  ぬ: 'んで',
  く: 'いて',
  ぐ: 'いで',
  す: 'して'
}

export const FORMS = [
  'dict',
  'masu',
  'masen',
  'mashita',
  'masendeshita',
  'te',
  'teimasu',
  'nai',
  'tai'
]

export const FORM_INFO = {
  dict: { label: 'Forma de dicionário', jp: '辞書形', pt: 'forma básica / informal' },
  masu: { label: 'Forma ます', jp: 'ます形', pt: 'presente ou futuro polido afirmativo' },
  masen: {
    label: 'Forma ません',
    jp: 'ません',
    pt: 'presente ou futuro polido negativo'
  },
  mashita: { label: 'Forma ました', jp: 'ました', pt: 'passado polido afirmativo' },
  masendeshita: {
    label: 'Forma ませんでした',
    jp: 'ませんでした',
    pt: 'passado polido negativo'
  },
  te: {
    label: 'Forma て',
    jp: 'て形',
    pt: 'forma de ligação (sequência, pedidos, ～ています)'
  },
  teimasu: {
    label: 'Forma ています',
    jp: 'ています',
    pt: 'ação em andamento, estado resultante ou hábito'
  },
  nai: { label: 'Forma ない', jp: 'ない形', pt: 'negativo informal' },
  tai: { label: 'Forma たい', jp: 'たい形', pt: 'desejo: "quero ~"' }
}

const POLITE_ENDING = {
  masu: 'ます',
  masen: 'ません',
  mashita: 'ました',
  masendeshita: 'ませんでした'
}

export const GROUP_LABEL = {
  1: 'Grupo I (godan · う-verbo)',
  2: 'Grupo II (ichidan · る-verbo)',
  3: 'Grupo III (irregular)'
}

const last = (s) => s.slice(-1)
const init = (s, n = 1) => s.slice(0, -n)
const isKuru = (v) => v.group === 3 && v.kana.endsWith('くる')
const isSuru = (v) => v.group === 3 && v.kana.endsWith('する')
const isIku = (v) => v.kanji.endsWith('行く')

function irregularStem(v, kind) {
  if (isKuru(v)) {
    const k = { i: 'き', a: 'こ' }[kind]
    return { kanji: init(v.kanji), kana: init(v.kana, 2) + k }
  }
  if (isSuru(v)) {
    return { kanji: init(v.kanji, 2) + 'し', kana: init(v.kana, 2) + 'し' }
  }
  throw new Error(`Verbo irregular desconhecido: ${v.kanji}`)
}

/** Radical da forma ます (連用形). */
export function masuStem(v) {
  if (v.group === 1) {
    const e = I_ROW[last(v.kana)]
    return { kanji: init(v.kanji) + e, kana: init(v.kana) + e }
  }
  if (v.group === 2) return { kanji: init(v.kanji), kana: init(v.kana) }
  return irregularStem(v, 'i')
}

/** Radical da forma ない (未然形). */
export function naiStem(v) {
  if (v.group === 1) {
    const a = A_ROW[last(v.kana)]
    return { kanji: init(v.kanji) + a, kana: init(v.kana) + a }
  }
  if (v.group === 2) return { kanji: init(v.kanji), kana: init(v.kana) }
  return irregularStem(v, 'a')
}

export function teForm(v) {
  if (v.group === 1) {
    const end = isIku(v) ? 'って' : TE[last(v.kana)]
    return { kanji: init(v.kanji) + end, kana: init(v.kana) + end }
  }
  if (v.group === 2) return { kanji: init(v.kanji) + 'て', kana: init(v.kana) + 'て' }
  const s = irregularStem(v, 'i')
  return { kanji: s.kanji + 'て', kana: s.kana + 'て' }
}

const add = (f, suffix) => ({ kanji: f.kanji + suffix, kana: f.kana + suffix })

/** Conjuga um verbo. Retorna { kanji, kana }. */
export function conjugate(v, form) {
  switch (form) {
    case 'dict':
      return { kanji: v.kanji, kana: v.kana }
    case 'masu':
    case 'masen':
    case 'mashita':
    case 'masendeshita':
      return add(masuStem(v), POLITE_ENDING[form])
    case 'te':
      return teForm(v)
    case 'teimasu':
      return add(teForm(v), 'います')
    case 'nai':
      return add(naiStem(v), 'ない')
    case 'tai':
      return add(masuStem(v), 'たい')
    default:
      throw new Error(`Forma desconhecida: ${form}`)
  }
}

function teRule(v) {
  if (isIku(v)) return '行く é a grande exceção: termina em く, mas a forma て é 行って.'
  const end = last(v.kana)
  const rules = {
    う: 'う・つ・る → って',
    つ: 'う・つ・る → って',
    る: 'う・つ・る → って',
    む: 'む・ぶ・ぬ → んで',
    ぶ: 'む・ぶ・ぬ → んで',
    ぬ: 'む・ぶ・ぬ → んで',
    く: 'く → いて',
    ぐ: 'ぐ → いで',
    す: 'す → して'
  }
  return `No Grupo I a forma て depende da última sílaba: ${rules[end]}.`
}

/** Explicação em português de como a forma é construída. */
export function explain(v, form) {
  const r = conjugate(v, form).kanji
  const g = v.group
  const exc = v.exception
    ? ` Atenção: ${v.kanji} parece Grupo II (termina em -iru/-eru), mas é uma exceção do Grupo I.`
    : ''
  if (form === 'dict') return `${v.kanji} é a forma de dicionário (${GROUP_LABEL[g]}).`
  if (g === 3) {
    return `${v.kanji} é irregular (Grupo III): a forma precisa ser memorizada → ${r}.`
  }
  const lastK = last(v.kana)
  switch (form) {
    case 'masu':
    case 'masen':
    case 'mashita':
    case 'masendeshita': {
      const end = POLITE_ENDING[form]
      return g === 1
        ? `${v.kanji} é do Grupo I: a última sílaba ${lastK} passa para a linha -i (${I_ROW[lastK]}) e acrescentamos ${end} → ${r}.${exc}`
        : `${v.kanji} é do Grupo II: tiramos o る e acrescentamos ${end} → ${r}.`
    }
    case 'te':
    case 'teimasu': {
      const base =
        g === 1
          ? `${teRule(v)}${exc}`
          : `${v.kanji} é do Grupo II: tiramos o る e acrescentamos て.`
      return form === 'te'
        ? `${base} → ${r}.`
        : `${base} Depois acrescentamos います → ${r}.`
    }
    case 'nai':
      return g === 1
        ? `${v.kanji} é do Grupo I: a última sílaba ${lastK} passa para a linha -a (${A_ROW[lastK]})${lastK === 'う' ? ' — cuidado: う vira わ, não あ' : ''} + ない → ${r}.${exc}`
        : `${v.kanji} é do Grupo II: tiramos o る e acrescentamos ない → ${r}.`
    case 'tai':
      return `Usamos o radical da forma ます (${masuStem(v).kanji}) + たい → ${r}. Expressa o desejo de quem fala.`
    default:
      return r
  }
}

function suffixFor(form) {
  if (POLITE_ENDING[form]) return POLITE_ENDING[form]
  return { nai: 'ない', tai: 'たい', te: 'て', teimasu: 'ています' }[form] ?? ''
}

/**
 * Formas erradas plausíveis, cada uma com o motivo do erro.
 * Usadas como alternativas no Verb Transformer e no feedback corretivo.
 */
export function wrongOptions(v, form) {
  const correct = conjugate(v, form)
  const out = []
  const push = (kanji, kana, why, tag) => {
    if (kanji === correct.kanji || out.some((o) => o.kanji === kanji)) return
    out.push({ kanji, kana, why, tag })
  }
  const suffix = suffixFor(form)
  const isTe = form === 'te' || form === 'teimasu'
  const tail = form === 'teimasu' ? 'います' : ''

  // 1. Colar a terminação direto na forma de dicionário.
  if (form !== 'dict') {
    push(
      v.kanji + suffix,
      v.kana + suffix,
      'A terminação não se cola na forma de dicionário: primeiro formamos o radical do verbo.',
      'dict-plus'
    )
  }

  if (v.group === 1) {
    // 2. Tratar como Grupo II (apenas tirar a última sílaba).
    const s = { kanji: init(v.kanji), kana: init(v.kana) }
    const why = v.exception
      ? `${v.kanji} parece Grupo II, mas é exceção do Grupo I: a última sílaba muda de linha, não desaparece.`
      : `${v.kanji} é do Grupo I: não basta tirar a última sílaba; ela muda de linha.`
    push(s.kanji + suffix, s.kana + suffix, why, 'as-ichidan')
    if (isTe) {
      const stem = masuStem(v)
      push(
        stem.kanji + 'て' + tail,
        stem.kana + 'て' + tail,
        'Radical da forma ます + て só funciona no Grupo II. No Grupo I a forma て tem regras próprias (って, んで, いて, いで, して).',
        'stem-te'
      )
      for (const alt of ['って', 'んで', 'いて']) {
        push(init(v.kanji) + alt + tail, init(v.kana) + alt + tail, teRule(v), 'wrong-te')
      }
    } else if (form !== 'dict') {
      const e = E_ROW[last(v.kana)]
      if (e && POLITE_ENDING[form]) {
        push(
          init(v.kanji) + e + suffix,
          init(v.kana) + e + suffix,
          'A linha -e + ます forma o potencial ("conseguir fazer"), não a forma polida simples.',
          'potential'
        )
      }
      const i = I_ROW[last(v.kana)]
      if (form === 'nai') {
        push(
          init(v.kanji) + i + 'ない',
          init(v.kana) + i + 'ない',
          'Na forma ない do Grupo I usamos a linha -a, não a linha -i.',
          'wrong-row'
        )
      }
    }
  } else if (v.group === 2) {
    // 3. Tratar como Grupo I (る → り / ら / って).
    const fake = { ...v, group: 1 }
    const f = conjugate(fake, form)
    push(
      f.kanji,
      f.kana,
      `${v.kanji} é do Grupo II (ichidan): basta tirar o る e acrescentar a terminação.`,
      'as-godan'
    )
    if (isTe) {
      push(
        init(v.kanji) + 'んで' + tail,
        init(v.kana) + 'んで' + tail,
        `No Grupo II a forma て é simples: tire o る e coloque て (${teForm(v).kanji}).`,
        'wrong-te'
      )
    }
  } else if (isKuru(v)) {
    const k = init(v.kanji)
    const wrongKana =
      {
        masu: 'こ',
        masen: 'こ',
        mashita: 'こ',
        masendeshita: 'こ',
        te: 'こ',
        teimasu: 'こ',
        tai: 'こ',
        nai: 'き'
      }[form] ?? 'こ'
    push(
      k + suffix,
      wrongKana + suffix,
      `来る é irregular: ${form === 'nai' ? 'na forma ない a leitura é こ (こない)' : 'nesta forma a leitura do radical é き'}.`,
      'irregular'
    )
    push(
      k + 'り' + suffix,
      'くり' + suffix,
      '来る é irregular (Grupo III), não segue o padrão do Grupo I.',
      'irregular'
    )
  } else if (isSuru(v)) {
    push(
      init(v.kanji, 2) + 'すり' + suffix,
      init(v.kana, 2) + 'すり' + suffix,
      'する é irregular: o radical é し.',
      'irregular'
    )
  }

  // 4. Outras formas polidas do mesmo verbo (erro de tempo ou polaridade).
  if (POLITE_ENDING[form]) {
    for (const other of ['masu', 'masen', 'mashita', 'masendeshita']) {
      if (other === form) continue
      const f = conjugate(v, other)
      push(
        f.kanji,
        f.kana,
        `${f.kanji} é a ${FORM_INFO[other].label}: ${FORM_INFO[other].pt}.`,
        'tense'
      )
    }
  }
  return out
}
