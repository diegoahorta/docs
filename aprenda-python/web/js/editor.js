/* Editor de código leve: textarea transparente sobre um <pre> com realce de sintaxe. */
(function (root) {
  'use strict';
  const KW = new Set(('False None True and as assert async await break case class continue def del elif else except finally for from global if import in is lambda match nonlocal not or pass raise return try type while with yield').split(' '));
  const BI = new Set(('print input len range int float str bool list dict set tuple type isinstance sum min max abs round sorted reversed enumerate zip map filter open any all iter next super object id hash help dir vars format repr chr ord divmod pow callable getattr setattr hasattr frozenset bytes self cls Exception ValueError TypeError KeyError IndexError ZeroDivisionError NameError').split(' '));

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  const RE = /(#[^\n]*)|([rRbBfFtTuU]{0,2}(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?))|(\b\d[\d_]*(?:\.\d*)?(?:[eE][+-]?\d+)?j?\b|\b0[xXoObB][\da-fA-F_]+\b)|([A-Za-z_][A-Za-z0-9_]*)/g;

  function realcar(cod) {
    let out = '', ult = 0, m, anterior = '';
    RE.lastIndex = 0;
    while ((m = RE.exec(cod))) {
      out += esc(cod.slice(ult, m.index));
      ult = RE.lastIndex;
      if (m[1]) out += '<span class="tk-com">' + esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="tk-str">' + esc(m[2]) + '</span>';
      else if (m[3]) out += '<span class="tk-num">' + esc(m[3]) + '</span>';
      else {
        const w = m[4];
        if (KW.has(w)) out += '<span class="tk-kw">' + w + '</span>';
        else if (anterior === 'def' || anterior === 'class') out += '<span class="tk-fn">' + w + '</span>';
        else if (BI.has(w)) out += '<span class="tk-bi">' + w + '</span>';
        else out += w;
        anterior = w;
        continue;
      }
      anterior = '';
    }
    return out + esc(cod.slice(ult));
  }

  const TECLAS = ['⇥', ':', '(', ')', '[', ']', '{', '}', '"', "'", '=', '+', '-', '*', '/', '<', '>', '#', '_', ',', '.', '↶'];

  function criar(el, opc) {
    opc = opc || {};
    el.classList.add('editor');
    el.innerHTML = '<div class="nums"></div><pre aria-hidden="true"></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="Editor de código Python"></textarea>';
    const ta = el.querySelector('textarea');
    const pre = el.querySelector('pre');
    const nums = el.querySelector('.nums');
    const historico = [];
    let linhaErro = null;
    ta.value = opc.codigo || '';

    function atualizar() {
      // o \n extra garante que a última linha vazia tenha altura no <pre>
      pre.innerHTML = realcar(ta.value) + '\n';
      // números de linha: medimos cada linha lógica (pode quebrar em várias visuais)
      const linhas = ta.value.split('\n');
      let html = '';
      for (let i = 0; i < linhas.length; i++) html += '<div' + (linhaErro === i + 1 ? ' class="erro-linha"' : '') + '>' + (i + 1) + '</div>';
      nums.innerHTML = html;
      ajustarNumeros(linhas);
      if (opc.aoMudar) opc.aoMudar(ta.value);
    }

    // mede a altura de cada linha lógica com um espelho invisível para alinhar os números
    let espelho = null;
    function ajustarNumeros(linhas) {
      if (!espelho) {
        espelho = document.createElement('pre');
        espelho.style.cssText = 'position:absolute;visibility:hidden;left:0;top:0;margin:0;';
        el.appendChild(espelho);
      }
      const cs = getComputedStyle(pre);
      espelho.style.width = pre.clientWidth + 'px';
      espelho.style.padding = cs.padding;
      espelho.style.font = cs.font;
      espelho.style.whiteSpace = 'pre-wrap';
      espelho.style.overflowWrap = 'anywhere';
      espelho.innerHTML = linhas.map(function (l) { return '<div>' + (esc(l) || ' ') + '</div>'; }).join('');
      const filhos = espelho.children;
      for (let i = 0; i < filhos.length; i++) {
        if (nums.children[i]) nums.children[i].style.height = filhos[i].getBoundingClientRect().height + 'px';
      }
    }

    function guardar() {
      historico.push([ta.value, ta.selectionStart, ta.selectionEnd]);
      if (historico.length > 200) historico.shift();
    }

    function inserir(txt, recuo) {
      guardar();
      const ini = ta.selectionStart, fim = ta.selectionEnd;
      ta.value = ta.value.slice(0, ini) + txt + ta.value.slice(fim);
      const pos = ini + txt.length - (recuo || 0);
      ta.selectionStart = ta.selectionEnd = pos;
      atualizar();
    }

    function desfazer() {
      const h = historico.pop();
      if (!h) return;
      ta.value = h[0];
      ta.selectionStart = h[1]; ta.selectionEnd = h[2];
      atualizar();
    }

    ta.addEventListener('beforeinput', function (e) {
      if (e.inputType === 'insertText' || e.inputType === 'deleteContentBackward') {
        if (!historico.length || historico[historico.length - 1][0] !== ta.value) guardar();
      }
    });
    ta.addEventListener('input', atualizar);
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) desindentar(); else inserir('    ');
      } else if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        novaLinha();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (opc.aoExecutar) opc.aoExecutar();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault(); desfazer();
      }
    });
    // Teclados Android às vezes não emitem keydown para Enter: tratamos via input
    ta.addEventListener('beforeinput', function (e) {
      if (e.inputType === 'insertLineBreak' || (e.inputType === 'insertText' && e.data === '\n')) {
        e.preventDefault();
        novaLinha();
      }
    });

    function novaLinha() {
      const ini = ta.selectionStart;
      const antes = ta.value.slice(0, ini);
      const linha = antes.slice(antes.lastIndexOf('\n') + 1);
      let recuo = (linha.match(/^ */) || [''])[0];
      if (/:\s*(#.*)?$/.test(linha)) recuo += '    ';
      inserir('\n' + recuo);
    }

    function desindentar() {
      guardar();
      const ini = ta.selectionStart;
      const comeco = ta.value.lastIndexOf('\n', ini - 1) + 1;
      const n = (ta.value.slice(comeco).match(/^ {1,4}/) || [''])[0].length;
      if (!n) return;
      ta.value = ta.value.slice(0, comeco) + ta.value.slice(comeco + n);
      ta.selectionStart = ta.selectionEnd = Math.max(comeco, ini - n);
      atualizar();
    }

    // barra de teclas para celular
    if (opc.teclas !== false) {
      const barra = document.createElement('div');
      barra.className = 'teclas';
      TECLAS.forEach(function (t) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = t;
        b.addEventListener('mousedown', function (e) { e.preventDefault(); });
        b.addEventListener('click', function () {
          ta.focus();
          if (t === '⇥') inserir('    ');
          else if (t === '↶') desfazer();
          else if (t === '(') inserir('()', 1);
          else if (t === '[') inserir('[]', 1);
          else if (t === '{') inserir('{}', 1);
          else if (t === '"') inserir('""', 1);
          else if (t === "'") inserir("''", 1);
          else inserir(t);
        });
        barra.appendChild(b);
      });
      barra.hidden = true;
      el.after(barra);
      ta.addEventListener('focus', function () { barra.hidden = false; });
      ta.addEventListener('blur', function () { setTimeout(function () { if (document.activeElement !== ta) barra.hidden = true; }, 150); });
    }

    let redimensionar = null;
    window.addEventListener('resize', function () { clearTimeout(redimensionar); redimensionar = setTimeout(atualizar, 120); });
    requestAnimationFrame(atualizar);

    return {
      valor: function () { return ta.value; },
      definir: function (v) { guardar(); ta.value = v; linhaErro = null; atualizar(); },
      marcarErro: function (n) { linhaErro = n || null; atualizar(); },
      focar: function () { ta.focus(); },
      atualizar: atualizar,
    };
  }

  root.Editor = { criar: criar, realcar: realcar };
})(this);
