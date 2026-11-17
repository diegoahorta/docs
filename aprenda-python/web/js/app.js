/* Aprenda Python — aplicação principal (roteamento, telas, progresso). */
(function () {
  'use strict';
  const $ = function (s, el) { return (el || document).querySelector(s); };
  const esc = Conteudo.esc;
  const app = $('#app');
  const NIVEIS = ['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Projetos'];
  const EXTRAS = {
    plano: { arquivo: 'extras/plano-de-estudos.md', icone: '📅', titulo: 'Plano de estudos', desc: 'Cronograma de 16 semanas e método' },
    referencia: { arquivo: 'extras/referencia.md', icone: '📒', titulo: 'Referência rápida', desc: 'Cola de sintaxe e funções' },
    glossario: { arquivo: 'extras/glossario.md', icone: '📖', titulo: 'Glossário', desc: 'Termos de programação' },
  };

  let CURSO = { modulos: [] };
  const extrasCache = {};

  /* ---------------- Progresso (salvo no aparelho) ---------------- */
  const CHAVE = 'aprenda-python.v1';
  let P = carregarProgresso();
  function carregarProgresso() {
    try {
      const p = JSON.parse(localStorage.getItem(CHAVE) || '{}');
      return Object.assign({ licoes: {}, exercicios: {}, quiz: {}, codigo: {}, dias: [], ultima: null, playground: null, tema: null }, p);
    } catch (e) {
      return { licoes: {}, exercicios: {}, quiz: {}, codigo: {}, dias: [], ultima: null, playground: null, tema: null };
    }
  }
  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(P)); } catch (e) { /* armazenamento indisponível */ }
  }
  function hoje() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function registrarDia() {
    const h = hoje();
    if (P.dias[P.dias.length - 1] !== h) { P.dias.push(h); if (P.dias.length > 400) P.dias.shift(); salvar(); }
  }
  function sequencia() {
    // dias consecutivos de estudo até hoje (ou ontem)
    const set = new Set(P.dias);
    let n = 0;
    const d = new Date();
    if (!set.has(hoje())) d.setDate(d.getDate() - 1);
    for (;;) {
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (!set.has(k)) break;
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
  }
  function chave(mod, i) { return mod.meta.id + '/' + i; }
  function progressoModulo(mod) {
    const total = mod.licoes.length;
    let feitas = 0;
    mod.licoes.forEach(function (_, i) { if (P.licoes[chave(mod, i)]) feitas++; });
    return { feitas: feitas, total: total, pct: total ? Math.round(100 * feitas / total) : 0 };
  }
  function progressoGeral() {
    let feitas = 0, total = 0, exs = 0, exsTotal = 0;
    CURSO.modulos.forEach(function (m) {
      const p = progressoModulo(m); feitas += p.feitas; total += p.total;
      m.licoes.forEach(function (l, i) { if (l.exercicio) { exsTotal++; if (P.exercicios[chave(m, i)]) exs++; } });
    });
    return { feitas: feitas, total: total, pct: total ? Math.round(100 * feitas / total) : 0, exs: exs, exsTotal: exsTotal };
  }
  function pontos() {
    let xp = Object.keys(P.licoes).length * 10 + Object.keys(P.exercicios).length * 20;
    Object.keys(P.quiz).forEach(function (k) { xp += (P.quiz[k].melhor || 0) * 5; });
    return xp;
  }

  /* ---------------- Utilidades de interface ---------------- */
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  function barra(pct) { return '<div class="barra"><i style="width:' + pct + '%"></i></div>'; }
  function definirAba(nome) {
    document.querySelectorAll('.abas a').forEach(function (a) { a.classList.toggle('ativa', a.dataset.aba === nome); });
    $('#btn-voltar').hidden = nome === 'inicio';
  }
  function moduloPorId(id) { return CURSO.modulos.find(function (m) { return m.meta.id === id; }); }

  /* ---------------- Execução de código: componente reutilizável ---------------- */
  function criarExecutor(caixa, codigo, opc) {
    opc = opc || {};
    caixa.classList.add('editor-caixa');
    caixa.innerHTML = '<div class="ed"></div><div class="barra-editor">' +
      '<button class="btn btn-pri b-exec" type="button">▶ Executar</button>' +
      (opc.botoesExtra || '') +
      '<span class="espaco"></span>' +
      '<button class="btn btn-escuro b-copiar" type="button" title="Abrir no Praticar">⧉</button>' +
      '<button class="btn btn-escuro b-reset" type="button" title="Restaurar código original">↺</button>' +
      '</div><pre class="saida" aria-live="polite"></pre>';
    const saida = $('.saida', caixa);
    const ed = Editor.criar($('.ed', caixa), { codigo: codigo, aoMudar: opc.aoMudar, aoExecutar: function () { rodar(); } });
    const original = opc.original !== undefined ? opc.original : codigo;

    function escrever(txt, tipo) {
      const s = document.createElement('span');
      if (tipo === 'err') s.className = 'err';
      else if (tipo === 'in') s.className = 'in';
      s.textContent = txt;
      saida.appendChild(s);
    }
    function info(txt) { saida.innerHTML = '<span class="info">' + esc(txt) + '</span>'; }
    function mostrarErro(erro) {
      ed.marcarErro(erro.linha);
      const d = document.createElement('div');
      d.className = 'erro-caixa'; d.textContent = erro.texto;
      saida.appendChild(d);
      if (erro.dica) {
        const h = document.createElement('div');
        h.className = 'dica-caixa'; h.textContent = '💡 ' + erro.dica;
        saida.appendChild(h);
      }
    }

    async function rodar(teste) {
      const botoes = caixa.querySelectorAll('.barra-editor .btn');
      botoes.forEach(function (b) { b.disabled = true; });
      ed.marcarErro(null);
      info(Python.estado === 'pronto' ? 'Executando…' : 'Preparando o Python (só na primeira vez)…');
      await new Promise(function (r) { setTimeout(r, 30); });
      let r;
      try {
        saida.innerHTML = '';
        r = await Python.executar(ed.valor(), { escrever: escrever, teste: teste });
        if (r.erro) mostrarErro(r.erro);
        else if (!saida.textContent) info(teste ? '(o programa não imprimiu nada)' : '✓ Executado sem erros (nada foi impresso — use print() para ver valores)');
        registrarDia();
      } catch (e) {
        info('Não foi possível iniciar o Python: ' + (e && e.message || e));
      } finally {
        botoes.forEach(function (b) { b.disabled = false; });
      }
      return r;
    }

    $('.b-exec', caixa).addEventListener('click', function () { rodar(); });
    $('.b-reset', caixa).addEventListener('click', function () {
      if (ed.valor() === original || confirm('Restaurar o código original? Suas alterações serão perdidas.')) {
        ed.definir(original); saida.innerHTML = '';
      }
    });
    $('.b-copiar', caixa).addEventListener('click', function () {
      P.playground = ed.valor(); salvar();
      location.hash = '#/playground';
    });
    return { editor: ed, rodar: rodar, saida: saida, caixa: caixa };
  }

  function montarBlocos(container, blocos) {
    container.querySelectorAll('.py-bloco').forEach(function (div) {
      const b = blocos[+div.dataset.i];
      criarExecutor(div, b.codigo);
    });
  }

  /* ---------------- Telas ---------------- */
  function telaInicio() {
    definirAba('inicio');
    const g = progressoGeral();
    let continuar = '';
    let alvo = null;
    if (P.ultima) {
      const [mid, i] = P.ultima.split('/');
      const m = moduloPorId(mid);
      if (m && m.licoes[+i]) alvo = { m: m, i: +i };
    }
    if (!alvo) {
      for (const m of CURSO.modulos) {
        const i = m.licoes.findIndex(function (_, k) { return !P.licoes[chave(m, k)]; });
        if (i >= 0) { alvo = { m: m, i: i }; break; }
      }
    }
    if (alvo) {
      continuar = '<a class="cartao modulo" href="#/l/' + alvo.m.meta.id + '/' + alvo.i + '">' +
        '<span class="ic">' + (alvo.m.meta.icone || '📘') + '</span><span class="info"><small>' + (g.feitas ? 'Continuar de onde parou' : 'Comece por aqui') + '</small>' +
        '<b>' + esc(alvo.m.licoes[alvo.i].titulo) + '</b><small>' + esc(alvo.m.titulo) + '</small></span><span>›</span></a>';
    }
    const atalhos = Object.keys(EXTRAS).map(function (k) {
      const e = EXTRAS[k];
      return '<a class="atalho" href="#/pagina/' + k + '"><b>' + e.icone + '</b><span>' + e.titulo + '</span><small>' + e.desc + '</small></a>';
    }).join('');
    app.innerHTML =
      '<section class="cartao heroi"><h1>Python do zero ao avançado</h1>' +
      '<p>' + CURSO.modulos.length + ' módulos, ' + g.total + ' lições, ' + g.exsTotal + ' exercícios corrigidos automaticamente. Tudo offline.</p>' +
      '<div class="metricas"><div class="metrica"><b>' + g.pct + '%</b><small>do curso</small></div>' +
      '<div class="metrica"><b>' + sequencia() + '🔥</b><small>dias seguidos</small></div>' +
      '<div class="metrica"><b>' + pontos() + '</b><small>pontos (XP)</small></div></div>' +
      '<div style="margin-top:12px">' + barra(g.pct) + '</div></section>' +
      continuar +
      '<div class="grade">' +
      '<a class="atalho" href="#/trilha"><b>🗺️</b><span>Trilha completa</span><small>Todos os módulos</small></a>' +
      '<a class="atalho" href="#/playground"><b>▶</b><span>Praticar</span><small>Editor Python livre</small></a>' +
      atalhos + '</div>' +
      '<p class="rodape">Seu progresso fica salvo neste aparelho.</p>';
  }

  function telaTrilha() {
    definirAba('trilha');
    let html = '<h1>Trilha de aprendizagem</h1><p>Siga os módulos na ordem: cada um usa o que veio antes.</p>';
    NIVEIS.forEach(function (nivel) {
      const mods = CURSO.modulos.filter(function (m) { return (m.meta.nivel || 'Iniciante') === nivel; });
      if (!mods.length) return;
      html += '<div class="nivel-titulo">' + nivel + '</div>';
      mods.forEach(function (m) {
        const p = progressoModulo(m);
        const q = P.quiz[m.meta.id];
        html += '<a class="cartao modulo" href="#/m/' + m.meta.id + '"><span class="ic">' + (m.meta.icone || '📘') + '</span>' +
          '<span class="info"><b>' + esc(m.titulo) + '</b><small>' + p.feitas + '/' + p.total + ' lições' +
          (q ? ' · quiz ' + q.melhor + '/' + q.total : '') + '</small>' + barra(p.pct) + '</span></a>';
      });
    });
    app.innerHTML = html;
  }

  function telaModulo(id) {
    definirAba('trilha');
    const m = moduloPorId(id);
    if (!m) return telaNaoEncontrada();
    const p = progressoModulo(m);
    const q = P.quiz[m.meta.id];
    let html = '<div class="migalha"><a href="#/trilha">Trilha</a> › ' + esc(m.meta.nivel || '') + '</div>' +
      '<h1>' + (m.meta.icone || '') + ' ' + esc(m.titulo) + '</h1><p>' + esc(m.meta.descricao || '') + '</p>' +
      '<div class="cartao"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>' + p.feitas + ' de ' + p.total + ' lições</span><b>' + p.pct + '%</b></div>' + barra(p.pct) + '</div>' +
      '<div class="cartao"><ul class="lista-licoes">';
    m.licoes.forEach(function (l, i) {
      const feito = P.licoes[chave(m, i)];
      const tags = l.exercicio ? (P.exercicios[chave(m, i)] ? '✔ exercício' : '✎ exercício') : '';
      html += '<li class="' + (feito ? 'feito' : '') + '"><a href="#/l/' + m.meta.id + '/' + i + '"><span class="num">' + (feito ? '✓' : i + 1) + '</span>' +
        '<span class="tit">' + esc(l.titulo) + '</span><span class="tags">' + tags + '</span></a></li>';
    });
    html += '</ul></div>';
    if (m.quiz.length) {
      html += '<a class="cartao modulo" href="#/quiz/' + m.meta.id + '"><span class="ic">❓</span><span class="info"><b>Quiz do módulo</b><small>' +
        m.quiz.length + ' perguntas' + (q ? ' · melhor resultado: ' + q.melhor + '/' + q.total : '') + '</small></span><span>›</span></a>';
    }
    app.innerHTML = html;
  }

  function telaLicao(id, idx) {
    definirAba('trilha');
    const m = moduloPorId(id);
    const i = +idx;
    if (!m || !m.licoes[i]) return telaNaoEncontrada();
    const l = m.licoes[i];
    const k = chave(m, i);
    P.ultima = k; salvar();
    const md = Conteudo.markdown(l.texto);
    let html = '<div class="migalha"><a href="#/m/' + m.meta.id + '">' + (m.meta.icone || '') + ' ' + esc(m.titulo) + '</a> › lição ' + (i + 1) + ' de ' + m.licoes.length + '</div>' +
      '<h1>' + esc(l.titulo) + '</h1>' + (l.fonte ? '<div class="fonte">📚 ' + esc(l.fonte) + '</div>' : '') +
      '<article class="texto" id="texto">' + md.html + '</article>';
    if (l.exercicio) {
      const en = Conteudo.markdown(l.exercicio.enunciado);
      html += '<section class="cartao exercicio' + (P.exercicios[k] ? ' resolvido' : '') + '" id="exercicio"><span class="rotulo">' + (P.exercicios[k] ? '✓ Exercício resolvido' : 'Exercício') + '</span>' +
        '<div class="texto" id="enunciado">' + en.html + '</div><div id="ex-editor"></div><div id="ex-resultado"></div></section>';
      l._en = en;
    }
    const ant = i > 0 ? '#/l/' + m.meta.id + '/' + (i - 1) : null;
    const prox = i < m.licoes.length - 1 ? '#/l/' + m.meta.id + '/' + (i + 1) : (m.quiz.length ? '#/quiz/' + m.meta.id : '#/m/' + m.meta.id);
    html += '<div class="navegacao">' + (ant ? '<a class="btn" href="' + ant + '">‹ Anterior</a>' : '') +
      '<button class="btn btn-ok" id="btn-concluir" type="button">' + (P.licoes[k] ? '✓ Concluída — próxima ›' : 'Concluir e avançar ›') + '</button></div>';
    app.innerHTML = html;
    montarBlocos($('#texto'), md.blocos);
    if (l.exercicio) {
      montarBlocos($('#enunciado'), l._en.blocos);
      montarExercicio(m, i, l.exercicio);
    }
    $('#btn-concluir').addEventListener('click', function () {
      if (!P.licoes[k]) { P.licoes[k] = Date.now(); registrarDia(); salvar(); toast('+10 XP · lição concluída'); }
      location.hash = prox;
    });
    window.scrollTo(0, 0);
  }

  function montarExercicio(m, i, ex) {
    const k = chave(m, i);
    const sec = $('#exercicio');
    const res = $('#ex-resultado');
    const inicial = ex.inicial || '';
    const exe = criarExecutor($('#ex-editor'), P.codigo[k] !== undefined ? P.codigo[k] : inicial, {
      original: inicial,
      botoesExtra: '<button class="btn btn-ok b-verificar" type="button">✔ Verificar</button><button class="btn btn-escuro b-solucao" type="button">Solução</button>',
      aoMudar: function (v) { P.codigo[k] = v; salvarDepois(); },
    });
    $('.b-verificar', exe.caixa).addEventListener('click', async function () {
      res.innerHTML = '';
      const r = await exe.rodar(ex.teste);
      if (!r) return;
      if (r.erro) {
        res.innerHTML = '<div class="resultado falha">✗ Seu código gerou um erro. Veja a mensagem acima e corrija.</div>';
      } else if (r.erroTeste) {
        const e = r.erroTeste;
        let msg = e.tipo === 'AssertionError' ? (e.mensagem || 'Uma verificação falhou.') : e.tipo + ': ' + e.mensagem;
        if (e.tipo === 'NameError') msg += '\n(Você definiu a função/variável pedida com o nome exato do enunciado?)';
        res.innerHTML = '<div class="resultado falha">✗ Ainda não está certo.<small>' + esc(msg) + '</small></div>';
      } else {
        const novo = !P.exercicios[k];
        P.exercicios[k] = Date.now();
        if (!P.licoes[k]) P.licoes[k] = Date.now();
        salvar();
        sec.classList.add('resolvido');
        $('.rotulo', sec).textContent = '✓ Exercício resolvido';
        res.innerHTML = '<div class="resultado ok">✓ Parabéns! Todos os testes passaram.' + (novo ? ' +20 XP' : '') + '</div>';
        $('#btn-concluir').textContent = '✓ Concluída — próxima ›';
      }
    });
    $('.b-solucao', exe.caixa).addEventListener('click', function () {
      if (confirm('Ver a solução? Tente mais um pouco antes — errar faz parte do aprendizado!')) {
        exe.editor.definir(ex.solucao);
        P.codigo[k] = ex.solucao; salvar();
      }
    });
  }
  let tSalvar = null;
  function salvarDepois() { clearTimeout(tSalvar); tSalvar = setTimeout(salvar, 400); }

  function telaQuiz(id) {
    definirAba('trilha');
    const m = moduloPorId(id);
    if (!m || !m.quiz.length) return telaNaoEncontrada();
    let acertos = 0, respondidas = 0;
    let html = '<div class="migalha"><a href="#/m/' + m.meta.id + '">' + (m.meta.icone || '') + ' ' + esc(m.titulo) + '</a> › quiz</div><h1>Quiz: ' + esc(m.titulo) + '</h1>';
    m.quiz.forEach(function (q, n) {
      html += '<div class="cartao pergunta" data-n="' + n + '"><p class="enun">' + (n + 1) + '. ' + Conteudo.inline(q.p) + '</p>' +
        q.o.map(function (o, j) { return '<button class="opcao" type="button" data-j="' + j + '">' + Conteudo.inline(o) + '</button>'; }).join('') +
        '<div class="explica" hidden></div></div>';
    });
    html += '<div class="cartao" id="placar" hidden></div>';
    app.innerHTML = html;
    app.querySelectorAll('.pergunta').forEach(function (div) {
      const q = m.quiz[+div.dataset.n];
      div.querySelectorAll('.opcao').forEach(function (b) {
        b.addEventListener('click', function () {
          const j = +b.dataset.j;
          div.querySelectorAll('.opcao').forEach(function (x) { x.disabled = true; });
          div.querySelector('[data-j="' + q.c + '"]').classList.add('certa');
          if (j === q.c) acertos++; else b.classList.add('errada');
          respondidas++;
          const ex = div.querySelector('.explica');
          ex.hidden = false;
          ex.innerHTML = (j === q.c ? '✅ Correto! ' : '❌ Resposta certa destacada. ') + Conteudo.inline(q.e || '');
          if (respondidas === m.quiz.length) fimQuiz();
        });
      });
    });
    function fimQuiz() {
      const ant = P.quiz[m.meta.id];
      if (!ant || acertos > ant.melhor) P.quiz[m.meta.id] = { melhor: acertos, total: m.quiz.length, quando: Date.now() };
      registrarDia(); salvar();
      const pct = Math.round(100 * acertos / m.quiz.length);
      const msg = pct === 100 ? '🏆 Perfeito!' : pct >= 70 ? '🎉 Muito bem!' : '📚 Revise as lições e tente de novo.';
      const idx = CURSO.modulos.indexOf(m);
      const prox = CURSO.modulos[idx + 1];
      const pl = $('#placar');
      pl.hidden = false;
      pl.innerHTML = '<h2>' + acertos + ' de ' + m.quiz.length + ' (' + pct + '%)</h2><p>' + msg + '</p>' + barra(pct) +
        '<div class="navegacao"><a class="btn" href="#/quiz/' + m.meta.id + '" onclick="setTimeout(function(){location.reload()},0)">Refazer</a>' +
        (prox ? '<a class="btn btn-pri" href="#/m/' + prox.meta.id + '">Próximo módulo ›</a>' : '<a class="btn btn-pri" href="#/trilha">Trilha</a>') + '</div>';
      pl.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const EXEMPLO_PLAYGROUND = '# Área livre: escreva e execute qualquer código Python.\n# Dica: Ctrl+Enter executa (com teclado físico).\n\nnome = input("Qual é o seu nome? ")\nprint(f"Olá, {nome}! Bem-vindo(a) ao Python.")\n\nfor i in range(1, 6):\n    print(i, "ao quadrado é", i ** 2)\n';
  function telaPlayground() {
    definirAba('playground');
    app.innerHTML = '<h1>Praticar</h1><p>Editor Python 3 completo, offline. O código fica salvo automaticamente.</p><div id="pg"></div>' +
      '<p style="font-size:.9rem;color:var(--txt2)">Disponível: toda a biblioteca padrão (math, random, datetime, json, re, collections, itertools…). ' +
      '<code>input()</code> abre uma caixa de diálogo. Arquivos criados com <code>open()</code> ficam na memória até fechar o app.</p>';
    criarExecutor($('#pg'), P.playground || EXEMPLO_PLAYGROUND, {
      original: EXEMPLO_PLAYGROUND,
      aoMudar: function (v) { P.playground = v; salvarDepois(); },
    });
  }

  function telaMais() {
    definirAba('mais');
    const g = progressoGeral();
    const linhas = Object.keys(EXTRAS).map(function (k) {
      const e = EXTRAS[k];
      return '<li><a href="#/pagina/' + k + '"><span class="num">' + e.icone + '</span><span class="tit">' + e.titulo + '</span><span class="tags">' + e.desc + '</span></a></li>';
    }).join('');
    app.innerHTML = '<h1>Mais</h1><div class="cartao"><ul class="lista-licoes">' + linhas +
      '<li><a href="#/busca"><span class="num">⌕</span><span class="tit">Buscar no conteúdo</span></a></li>' +
      '<li><a href="#/sobre"><span class="num">ℹ️</span><span class="tit">Sobre, fontes e bibliografia</span></a></li></ul></div>' +
      '<div class="cartao"><h3>Seu progresso</h3><p>' + g.feitas + ' de ' + g.total + ' lições · ' + g.exs + ' de ' + g.exsTotal + ' exercícios · ' + pontos() + ' XP · ' + P.dias.length + ' dias de estudo</p>' +
      '<div class="navegacao"><button class="btn" id="exportar" type="button">Exportar progresso</button><button class="btn" id="importar" type="button">Importar</button></div>' +
      '<button class="btn" id="zerar" type="button" style="width:100%;color:var(--erro)">Apagar todo o progresso</button></div>';
    $('#zerar').addEventListener('click', function () {
      if (confirm('Apagar TODO o progresso, códigos salvos e resultados de quiz? Isso não pode ser desfeito.')) {
        const tema = P.tema;
        P = carregarProgresso(); P.licoes = {}; P.exercicios = {}; P.quiz = {}; P.codigo = {}; P.dias = []; P.ultima = null; P.playground = null; P.tema = tema;
        salvar(); toast('Progresso apagado'); telaMais();
      }
    });
    $('#exportar').addEventListener('click', function () {
      const txt = btoa(unescape(encodeURIComponent(JSON.stringify(P))));
      prompt('Copie este código e guarde-o (para restaurar use "Importar"):', txt);
    });
    $('#importar').addEventListener('click', function () {
      const txt = prompt('Cole o código de progresso exportado:');
      if (!txt) return;
      try {
        const novo = JSON.parse(decodeURIComponent(escape(atob(txt.trim()))));
        P = Object.assign(carregarProgresso(), novo); salvar(); toast('Progresso importado ✔'); telaMais();
      } catch (e) { alert('Código inválido.'); }
    });
  }

  async function telaPagina(nome) {
    definirAba('mais');
    const e = EXTRAS[nome];
    if (!e) return telaNaoEncontrada();
    app.innerHTML = '<div class="carregando">Carregando…</div>';
    try {
      if (!extrasCache[nome]) extrasCache[nome] = await (await fetch('conteudo/' + e.arquivo)).text();
    } catch (err) {
      app.innerHTML = '<p class="vazio">Não foi possível abrir esta página.</p>'; return;
    }
    let src = extrasCache[nome].replace(/^# .*\n/, '');
    const md = Conteudo.markdown(src);
    app.innerHTML = '<h1>' + e.icone + ' ' + e.titulo + '</h1>' +
      (nome === 'glossario' ? '<input class="campo" id="filtro" placeholder="Filtrar termos…" style="margin-bottom:12px">' : '') +
      '<article class="texto" id="texto">' + md.html + '</article>';
    montarBlocos($('#texto'), md.blocos);
    const f = $('#filtro');
    if (f) f.addEventListener('input', function () {
      const t = f.value.toLowerCase();
      app.querySelectorAll('#texto li').forEach(function (li) { li.hidden = t && li.textContent.toLowerCase().indexOf(t) < 0; });
    });
  }

  function normalizar(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function telaBusca(q) {
    definirAba('mais');
    app.innerHTML = '<h1>Buscar</h1><input class="campo" id="q" type="search" placeholder="Ex.: dicionário, for, f-string, herança…" value="' + esc(q || '') + '"><div id="res"></div>';
    const campo = $('#q');
    function buscar() {
      const termo = normalizar(campo.value.trim());
      const res = $('#res');
      if (termo.length < 2) { res.innerHTML = ''; return; }
      const achados = [];
      CURSO.modulos.forEach(function (m) {
        m.licoes.forEach(function (l, i) {
          const t = normalizar(l.titulo), c = normalizar(l.texto);
          const pt = t.indexOf(termo), pc = c.indexOf(termo);
          if (pt >= 0 || pc >= 0) {
            let trecho = '';
            if (pc >= 0) {
              const ini = Math.max(0, pc - 50);
              trecho = l.texto.slice(ini, pc + termo.length + 70).replace(/[`*#>|]/g, '').replace(/\s+/g, ' ');
            }
            achados.push({ m: m, i: i, l: l, peso: pt >= 0 ? 0 : 1, trecho: trecho });
          }
        });
      });
      achados.sort(function (a, b) { return a.peso - b.peso; });
      res.innerHTML = achados.length ? achados.slice(0, 60).map(function (a) {
        return '<a class="resultado-busca" href="#/l/' + a.m.meta.id + '/' + a.i + '"><b>' + esc(a.l.titulo) + '</b><small>' + (a.m.meta.icone || '') + ' ' + esc(a.m.titulo) +
          (a.trecho ? ' — …' + esc(a.trecho) + '…' : '') + '</small></a>';
      }).join('') : '<p class="vazio">Nada encontrado.</p>';
    }
    campo.addEventListener('input', buscar);
    buscar();
    setTimeout(function () { campo.focus(); }, 50);
  }

  function telaSobre() {
    definirAba('mais');
    app.innerHTML = '<h1>Sobre</h1><div class="cartao texto">' +
      '<p><b>Aprenda Python</b> é um sistema de estudo de Python do zero ao avançado que funciona <b>100% offline</b>. ' +
      'O código roda num interpretador Python 3 real (CPython compilado para WebAssembly pelo projeto Pyodide) embutido no app.</p>' +
      '<h3>Bibliografia e fontes</h3><ul>' +
      '<li>PATSCH, Augusto. <i>Como programar em Python do zero</i>. E-book (@imperio_do_programador).</li>' +
      '<li>DOWNEY, Allen B. <i>Pense em Python</i>. 2ª ed. Trad. Sheila Gomes. São Paulo: Novatec, 2016. Disponível sob licença Creative Commons BY-NC 3.0.</li>' +
      '<li>PYTHON SOFTWARE FOUNDATION. <i>Documentação do Python 3</i> (tutorial, referência da linguagem e da biblioteca padrão; "What\'s new in Python 3.14"). docs.python.org/pt-br/3/</li>' +
      '<li>PEP 8 — Guia de estilo para código Python; PEP 20 — O Zen do Python.</li>' +
      '<li>Projeto Pyodide — pyodide.org (licença MPL-2.0).</li></ul>' +
      '<p>As lições são textos originais, escritos a partir dessas fontes. Cada lição indica as páginas/capítulos de referência para aprofundamento.</p>' +
      '<h3>Interpretador</h3><p id="versao-py">' + esc(Python.estado === 'pronto' ? 'Python carregado.' : 'O Python é carregado em segundo plano ao abrir o app.') + '</p></div>';
    Python.carregar().then(function (api) { const p = $('#versao-py'); if (p) p.textContent = 'Python ' + api.versao + ' (Pyodide), biblioteca padrão completa.'; }).catch(function () {});
  }

  function telaNaoEncontrada() {
    app.innerHTML = '<p class="vazio">Página não encontrada. <a href="#/">Voltar ao início</a></p>';
  }

  /* ---------------- Roteador ---------------- */
  function rotear() {
    const h = location.hash.replace(/^#\/?/, '');
    const [rota, ...args] = h.split('/');
    const partes = args.map(decodeURIComponent);
    switch (rota) {
      case '': telaInicio(); break;
      case 'trilha': telaTrilha(); break;
      case 'm': telaModulo(partes[0]); break;
      case 'l': telaLicao(partes[0], partes[1]); break;
      case 'quiz': telaQuiz(partes[0]); break;
      case 'playground': telaPlayground(); break;
      case 'mais': telaMais(); break;
      case 'pagina': telaPagina(partes[0]); break;
      case 'busca': telaBusca(partes[0]); break;
      case 'sobre': telaSobre(); break;
      default: telaNaoEncontrada();
    }
    if (rota !== 'l') window.scrollTo(0, 0);
  }

  /* ---------------- Tema ---------------- */
  function aplicarTema() {
    if (P.tema) document.documentElement.setAttribute('data-tema', P.tema);
    else document.documentElement.removeAttribute('data-tema');
  }
  $('#btn-tema').addEventListener('click', function () {
    const escuroAgora = P.tema ? P.tema === 'escuro' : matchMedia('(prefers-color-scheme: dark)').matches;
    P.tema = escuroAgora ? 'claro' : 'escuro';
    salvar(); aplicarTema();
  });
  $('#btn-busca').addEventListener('click', function () { location.hash = '#/busca'; });
  $('#btn-voltar').addEventListener('click', function () { history.length > 1 ? history.back() : (location.hash = '#/'); });
  aplicarTema();

  Python.aoMudarEstado(function (estado, det) {
    const s = $('#status-py');
    s.className = 'status-py' + (estado === 'pronto' ? ' pronto' : estado === 'erro' ? ' erro' : '');
    s.textContent = estado === 'pronto' ? 'Python ' + det + ' ✓' : estado === 'erro' ? 'Python: erro' : 'Python…';
    if (estado === 'erro') s.title = det;
  });

  // Integração com o botão "voltar" do Android (chamado pela Activity)
  window.aoVoltarAndroid = function () {
    if (location.hash && location.hash !== '#/' && location.hash !== '#') { history.back(); return true; }
    return false;
  };

  /* ---------------- Inicialização ---------------- */
  async function iniciar() {
    try {
      const indice = await (await fetch('conteudo/indice.json')).json();
      const textos = await Promise.all(indice.modulos.map(function (a) {
        return fetch('conteudo/' + a).then(function (r) { return r.text(); }).then(function (t) { return [a, t]; });
      }));
      CURSO.modulos = textos.map(function (par) { return Conteudo.parseModulo(par[1], par[0]); });
    } catch (e) {
      app.innerHTML = '<p class="vazio">Erro ao carregar o conteúdo: ' + esc(String(e.message || e)) + '</p>';
      return;
    }
    window.addEventListener('hashchange', rotear);
    rotear();
    // pré-carrega o Python em segundo plano para a primeira execução ser rápida
    setTimeout(function () { Python.carregar().catch(function () {}); }, 600);
  }
  iniciar();
})();
