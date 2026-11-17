#!/usr/bin/env node
/*
 * Validador de conteúdo do Aprenda Python.
 * Para cada arquivo .md em web/conteudo/:
 *  - faz o parse (estrutura, quiz, exercícios)
 *  - executa TODOS os blocos ```python no Python real (Pyodide) e falha se der erro
 *    (blocos marcados ```python erro DEVEM dar erro; ```python nao-executar são pulados)
 *  - roda a solução de cada exercício + o teste (deve passar)
 *  - roda o código inicial + o teste (deve FALHAR, para garantir que o teste testa algo)
 * Uso: node tools/validar.js [arquivo.md ...]
 */
const fs = require('fs');
const path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const WEB = path.join(RAIZ, 'web');
const { parseModulo } = require(path.join(WEB, 'js', 'parser.js'));

async function main() {
  const indice = JSON.parse(fs.readFileSync(path.join(WEB, 'conteudo', 'indice.json'), 'utf8'));
  let arquivos = process.argv.slice(2);
  if (!arquivos.length) arquivos = indice.modulos.map((m) => path.join(WEB, 'conteudo', m));
  const { loadPyodide } = require(path.join(WEB, 'pyodide', 'pyodide.js'));
  const py = await loadPyodide({ indexURL: path.join(WEB, 'pyodide') + '/' });
  py.runPython(fs.readFileSync(path.join(WEB, 'js', 'harness.py'), 'utf8'), { globals: py.globals });
  const executar = py.globals.get('executar');
  const novoNs = py.globals.get('novo_ns');

  function rodar(codigo, ns) {
    const saidas = [];
    const guardar = py.toPy([]);
    const r = executar(codigo, ns, (t) => saidas.push(t), () => '5', 10.0, guardar);
    const res = r === undefined || r === null ? null : r.toJs({ dict_converter: Object.fromEntries });
    const texto = guardar.toJs().join('');
    guardar.destroy();
    return { erro: res, saida: texto };
  }

  let falhas = 0, blocos = 0, exs = 0, licoes = 0, quizzes = 0;
  const ids = new Set();
  for (const arq of arquivos) {
    const nome = path.basename(arq);
    let mod;
    try {
      mod = parseModulo(fs.readFileSync(arq, 'utf8'), nome);
    } catch (e) {
      console.log('✗ PARSE ' + e.message); falhas++; continue;
    }
    licoes += mod.licoes.length; quizzes += mod.quiz.length;
    if (!mod.meta.id) { console.log(`✗ ${nome}: falta "id:" no cabeçalho`); falhas++; }
    if (ids.has(mod.meta.id)) { console.log(`✗ ${nome}: id repetido ${mod.meta.id}`); falhas++; }
    ids.add(mod.meta.id);
    if (mod.quiz.length < 3) { console.log(`✗ ${nome}: quiz com menos de 3 perguntas`); falhas++; }
    for (const li of mod.licoes) {
      const { blocos: bl } = require(path.join(WEB, 'js', 'parser.js')).markdown(li.texto + '\n' + (li.exercicio ? li.exercicio.enunciado : ''));
      for (const b of bl) {
        if (b.flags.includes('nao-executar')) continue;
        blocos++;
        const ns = novoNs();
        const r = rodar(b.codigo, ns);
        ns.destroy();
        const esperaErro = b.flags.includes('erro');
        if (esperaErro && !r.erro) { falhas++; console.log(`✗ ${nome} › ${li.titulo}: bloco marcado "erro" não deu erro:\n${b.codigo}\n`); }
        if (!esperaErro && r.erro) { falhas++; console.log(`✗ ${nome} › ${li.titulo}: bloco falhou:\n${b.codigo}\n--> ${r.erro.texto}\n`); }
      }
      if (li.exercicio) {
        exs++;
        const ex = li.exercicio;
        for (const [rotulo, cod, deveDar] of [['solução', ex.solucao, true], ['inicial', ex.inicial, false]]) {
          const ns = novoNs();
          const r1 = rodar(cod, ns);
          let ok = !r1.erro;
          let msg = r1.erro ? r1.erro.texto : '';
          if (ok) {
            ns.set('saida', r1.saida);
            const r2 = rodar(ex.teste, ns);
            ok = !r2.erro;
            msg = r2.erro ? r2.erro.texto : '';
          }
          ns.destroy();
          if (deveDar && !ok) { falhas++; console.log(`✗ ${nome} › ${li.titulo}: a SOLUÇÃO não passa no teste:\n--> ${msg}\n`); }
          if (!deveDar && ok) { falhas++; console.log(`✗ ${nome} › ${li.titulo}: o código INICIAL já passa no teste (teste fraco)\n`); }
        }
      }
    }
    console.log(`✓ ${nome}: ${mod.licoes.length} lições, ${mod.quiz.length} perguntas`);
  }
  console.log(`\nTotal: ${arquivos.length} módulos, ${licoes} lições, ${blocos} blocos executados, ${exs} exercícios, ${quizzes} perguntas de quiz.`);
  if (falhas) { console.log(`\n${falhas} FALHA(S)`); process.exit(1); }
  console.log('Tudo certo ✔');
}
main().catch((e) => { console.error(e); process.exit(1); });
