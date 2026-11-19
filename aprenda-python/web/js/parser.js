/*
 * Parser do formato de conteúdo (.md) do Aprenda Python.
 * Usado pelo app (navegador/WebView) e pelo validador (Node).
 * O formato está documentado em conteudo/FORMATO.md.
 */
(function (root) {
  'use strict';

  function parseModulo(src, arquivo) {
    const linhas = src.replace(/\r\n/g, '\n').split('\n');
    const mod = { arquivo: arquivo || '', titulo: '', meta: {}, licoes: [], quiz: [] };
    let i = 0;
    let licao = null;
    let modo = 'cabecalho'; // cabecalho | licao | exercicio | quiz
    let buf = [];
    let pergunta = null;

    function fecharTexto() {
      if (!licao) { buf = []; return; }
      const texto = buf.join('\n').trim();
      if (modo === 'licao') licao.texto = texto;
      else if (modo === 'exercicio') licao.exercicio.enunciado = texto;
      buf = [];
    }

    function erro(msg) {
      throw new Error((arquivo || 'conteúdo') + ':' + (i + 1) + ': ' + msg);
    }

    while (i < linhas.length) {
      const l = linhas[i];

      // Blocos de código cercados: copiados integralmente
      const cerca = l.match(/^(```+)\s*(.*)$/);
      if (cerca) {
        const marca = cerca[1];
        const info = cerca[2].trim();
        const corpo = [];
        i++;
        while (i < linhas.length && !linhas[i].startsWith(marca)) { corpo.push(linhas[i]); i++; }
        if (i >= linhas.length) erro('bloco de código não fechado');
        i++;
        const partes = info.split(/\s+/);
        if (modo === 'exercicio' && partes[0] === 'python' && ['inicial', 'solucao', 'teste'].includes(partes[1])) {
          licao.exercicio[partes[1]] = corpo.join('\n');
        } else {
          buf.push(marca + info, ...corpo, marca);
        }
        continue;
      }

      if (modo === 'cabecalho') {
        if (l.startsWith('# ')) { mod.titulo = l.slice(2).trim(); i++; continue; }
        const kv = l.match(/^([a-z_]+):\s*(.*)$/);
        if (kv && !l.startsWith('## ')) { mod.meta[kv[1]] = kv[2].trim(); i++; continue; }
        if (l.trim() === '') { i++; continue; }
      }

      if (l.startsWith('## ')) {
        fecharTexto();
        const titulo = l.slice(3).trim();
        if (titulo === 'Quiz') { modo = 'quiz'; licao = null; i++; continue; }
        licao = { titulo, fonte: '', texto: '', exercicio: null };
        mod.licoes.push(licao);
        modo = 'licao';
        i++;
        const f = (linhas[i] || '').match(/^fonte:\s*(.*)$/);
        if (f) { licao.fonte = f[1].trim(); i++; }
        continue;
      }

      if (modo === 'licao' && /^###\s+Exerc[ií]cio\s*$/.test(l)) {
        fecharTexto();
        licao.exercicio = { enunciado: '', inicial: '', solucao: '', teste: '' };
        modo = 'exercicio';
        i++;
        continue;
      }

      if (modo === 'quiz') {
        if (l.startsWith('? ')) {
          pergunta = { p: l.slice(2).trim(), o: [], c: -1, e: '' };
          mod.quiz.push(pergunta);
        } else if (/^- \[( |x)\] /.test(l)) {
          if (!pergunta) erro('opção sem pergunta');
          if (l[3] === 'x') pergunta.c = pergunta.o.length;
          pergunta.o.push(l.slice(6).trim());
        } else if (l.startsWith('> ')) {
          if (!pergunta) erro('explicação sem pergunta');
          pergunta.e += (pergunta.e ? ' ' : '') + l.slice(2).trim();
        } else if (l.trim() !== '') {
          erro('linha inesperada no quiz: ' + l);
        }
        i++;
        continue;
      }

      buf.push(l);
      i++;
    }
    fecharTexto();

    // Checagens de consistência
    if (!mod.titulo) erro('módulo sem título (# ...)');
    mod.licoes.forEach(function (li) {
      if (li.exercicio) {
        ['enunciado', 'solucao', 'teste'].forEach(function (k) {
          if (!li.exercicio[k] || !li.exercicio[k].trim()) {
            throw new Error(arquivo + ': lição "' + li.titulo + '" — exercício sem ' + k);
          }
        });
      }
    });
    mod.quiz.forEach(function (q) {
      if (q.o.length < 2 || q.c < 0) throw new Error(arquivo + ': pergunta de quiz inválida: ' + q.p);
    });
    return mod;
  }

  /* ---------------- Markdown mínimo -> HTML ---------------- */

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function inline(s) {
    // Protege trechos de código inline primeiro
    const codigos = [];
    s = s.replace(/`([^`]+)`/g, function (_, c) { codigos.push(c); return '\u0000' + (codigos.length - 1) + '\u0000'; });
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/\[([^\]]+)\]\((#[^)\s]*)\)/g, '<a href="$2">$1</a>');
    s = s.replace(/\u0000(\d+)\u0000/g, function (_, n) { return '<code>' + esc(codigos[+n]) + '</code>'; });
    return s;
  }

  // Devolve HTML; blocos ```python viram marcadores <div class="py-bloco" data-i="N"> e
  // o código fica em `blocos` para o app montar os editores executáveis.
  function markdown(md) {
    const linhas = md.split('\n');
    const out = [];
    const blocos = [];
    let i = 0;
    while (i < linhas.length) {
      const l = linhas[i];
      const cerca = l.match(/^(```+)\s*(.*)$/);
      if (cerca) {
        const info = cerca[2].trim().split(/\s+/);
        const corpo = [];
        i++;
        while (i < linhas.length && !linhas[i].startsWith(cerca[1])) { corpo.push(linhas[i]); i++; }
        i++;
        const lang = info[0] || 'text';
        if (lang === 'python') {
          blocos.push({ codigo: corpo.join('\n'), flags: info.slice(1) });
          out.push('<div class="py-bloco" data-i="' + (blocos.length - 1) + '"></div>');
        } else {
          out.push('<pre class="estatico lang-' + esc(lang) + '"><code>' + esc(corpo.join('\n')) + '</code></pre>');
        }
        continue;
      }
      if (/^#{3,4} /.test(l)) {
        const n = l.startsWith('#### ') ? 4 : 3;
        out.push('<h' + n + '>' + inline(l.slice(n + 1)) + '</h' + n + '>');
        i++; continue;
      }
      if (l.startsWith('> ')) {
        const q = [];
        while (i < linhas.length && linhas[i].startsWith('> ')) { q.push(linhas[i].slice(2)); i++; }
        let cls = 'dica';
        if (/^(⚠️|❗)/.test(q[0])) cls = 'alerta';
        out.push('<blockquote class="' + cls + '">' + inline(q.join(' ')) + '</blockquote>');
        continue;
      }
      if (/^\s*[-*] /.test(l)) {
        const itens = [];
        while (i < linhas.length && /^\s*[-*] /.test(linhas[i])) { itens.push(linhas[i].replace(/^\s*[-*] /, '')); i++; }
        out.push('<ul>' + itens.map(function (t) { return '<li>' + inline(t) + '</li>'; }).join('') + '</ul>');
        continue;
      }
      if (/^\s*\d+\. /.test(l)) {
        const itens = [];
        while (i < linhas.length && /^\s*\d+\. /.test(linhas[i])) { itens.push(linhas[i].replace(/^\s*\d+\. /, '')); i++; }
        out.push('<ol>' + itens.map(function (t) { return '<li>' + inline(t) + '</li>'; }).join('') + '</ol>');
        continue;
      }
      if (l.startsWith('|')) {
        const rows = [];
        while (i < linhas.length && linhas[i].startsWith('|')) { rows.push(linhas[i]); i++; }
        const cel = function (r) { return r.replace(/^\||\|$/g, '').replace(/\\\|/g, '\u0001').split('|').map(function (c) { return c.replace(/\u0001/g, '|').trim(); }); };
        let html = '<div class="tabela"><table>';
        const cab = cel(rows[0]);
        let inicio = 1;
        if (rows[1] && /^\|[\s:|-]+\|?$/.test(rows[1])) {
          html += '<thead><tr>' + cab.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') + '</tr></thead>';
          inicio = 2;
        } else inicio = 0;
        html += '<tbody>';
        for (let r = inicio; r < rows.length; r++) {
          html += '<tr>' + cel(rows[r]).map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
        }
        out.push(html + '</tbody></table></div>');
        continue;
      }
      if (l.trim() === '') { i++; continue; }
      const p = [];
      while (i < linhas.length && linhas[i].trim() !== '' && !/^(```|#{3,4} |> |\s*[-*] |\s*\d+\. |\|)/.test(linhas[i])) { p.push(linhas[i]); i++; }
      out.push('<p>' + inline(p.join(' ')) + '</p>');
    }
    return { html: out.join('\n'), blocos: blocos };
  }

  const api = { parseModulo: parseModulo, markdown: markdown, inline: inline, esc: esc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Conteudo = api;
})(this);
