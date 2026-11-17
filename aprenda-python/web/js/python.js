/* Carrega o Pyodide (Python 3.14 em WebAssembly, empacotado no app) e executa código. */
(function (root) {
  'use strict';
  let promessa = null;
  const ouvintes = [];
  let estado = 'parado';

  function avisar(novo, detalhe) {
    estado = novo;
    ouvintes.forEach(function (f) { f(novo, detalhe); });
  }

  function carregarScript(src) {
    return new Promise(function (ok, falha) {
      const s = document.createElement('script');
      s.src = src;
      s.onload = ok;
      s.onerror = function () { falha(new Error('Não foi possível carregar ' + src)); };
      document.head.appendChild(s);
    });
  }

  function carregar() {
    if (promessa) return promessa;
    avisar('carregando');
    promessa = (async function () {
      const base = new URL('pyodide/', location.href).href;
      if (!root.loadPyodide) await carregarScript(base + 'pyodide.js');
      const py = await root.loadPyodide({ indexURL: base, stdout: function () {}, stderr: function () {} });
      const harness = await (await fetch('js/harness.py')).text();
      py.runPython(harness);
      const api = {
        py: py,
        executar: py.globals.get('executar'),
        novoNs: py.globals.get('novo_ns'),
        versao: py.runPython('import sys; sys.version.split()[0]'),
      };
      avisar('pronto', api.versao);
      return api;
    })().catch(function (e) {
      promessa = null;
      avisar('erro', String(e && e.message || e));
      throw e;
    });
    return promessa;
  }

  /*
   * Executa `codigo`. opc:
   *   escrever(texto, tipo)  tipo: 'out' | 'err' | 'in'
   *   teste: código de teste a rodar depois, no mesmo namespace (com `saida` definida)
   * Resolve { erro, saida, erroTeste }.
   */
  async function executar(codigo, opc) {
    opc = opc || {};
    const api = await carregar();
    const py = api.py;
    const escrever = opc.escrever || function () {};
    const ler = function (prompt) {
      const v = root.prompt(prompt || 'Entrada do programa (input):', '');
      return v === null ? null : v;
    };
    const ns = api.novoNs();
    const guardar = py.toPy([]);
    function conv(r) {
      if (r === undefined || r === null) return null;
      const o = r.toJs({ dict_converter: Object.fromEntries });
      r.destroy && r.destroy();
      return o;
    }
    try {
      const erro = conv(api.executar(codigo, ns, escrever, ler, opc.limite || 10.0, guardar));
      const saida = guardar.toJs().join('');
      let erroTeste = null;
      if (!erro && opc.teste) {
        ns.set('saida', saida);
        erroTeste = conv(api.executar(opc.teste, ns, function () {}, function () { return ''; }, 10.0, null, '<teste>'));
      }
      return { erro: erro, saida: saida, erroTeste: erroTeste };
    } finally {
      guardar.destroy();
      ns.destroy();
    }
  }

  root.Python = {
    carregar: carregar,
    executar: executar,
    aoMudarEstado: function (f) { ouvintes.push(f); f(estado); },
    get estado() { return estado; },
  };
})(this);
