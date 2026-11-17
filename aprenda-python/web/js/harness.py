# Harness de execução do Aprenda Python (roda dentro do Pyodide).
# - executa o código do aluno num namespace próprio
# - redireciona print/input para funções JavaScript
# - interrompe laços infinitos por tempo limite
# - formata erros em português, mostrando só as linhas do aluno
import sys
import time
import builtins
import traceback

ARQ = "<seu código>"

DICAS = {
    "SyntaxError": "Erro de sintaxe: o Python não entendeu a escrita do código. Confira parênteses, aspas, dois-pontos (:) no fim de if/for/def e a indentação.",
    "IndentationError": "Erro de indentação: os blocos (depois de if, for, while, def, class...) precisam estar recuados com o mesmo número de espaços (o padrão é 4).",
    "TabError": "Mistura de TAB e espaços na indentação. Use apenas espaços (4 por nível).",
    "NameError": "Você usou um nome (variável ou função) que ainda não existe. Verifique a grafia, maiúsculas/minúsculas e se ele foi definido ANTES de ser usado.",
    "TypeError": "Operação com um tipo de dado inadequado, por exemplo somar texto com número (\"5\" + 3) ou chamar uma função com argumentos errados. Use int(), float() ou str() para converter.",
    "ValueError": "O tipo está certo, mas o valor não serve. Ex.: int(\"abc\") não pode virar número.",
    "ZeroDivisionError": "Divisão por zero não é permitida. Verifique o divisor antes de dividir.",
    "IndexError": "Índice fora do intervalo. Lembre-se: os índices começam em 0 e vão até len(seq) - 1.",
    "KeyError": "A chave não existe no dicionário. Use `chave in dic` ou dic.get(chave) para verificar antes.",
    "AttributeError": "Esse objeto não possui o atributo/método usado. Confira o tipo do objeto com type() e a grafia do método.",
    "ModuleNotFoundError": "Módulo não encontrado. No app offline só a biblioteca padrão do Python está disponível (bibliotecas como pandas exigem instalação com pip no computador).",
    "ImportError": "Não foi possível importar esse nome do módulo. Confira a grafia.",
    "RecursionError": "Recursão profunda demais: a função chamou a si mesma vezes demais. Confira o caso base da recursão.",
    "TimeoutError": "O programa demorou demais e foi interrompido. Provavelmente há um laço infinito (um while cuja condição nunca fica falsa).",
    "UnboundLocalError": "Você usou uma variável local antes de atribuir valor a ela dentro da função. Para alterar uma variável global use `global nome` (ou, melhor, passe-a como parâmetro).",
    "AssertionError": "Uma verificação (assert) falhou.",
    "FileNotFoundError": "Arquivo não encontrado. Crie o arquivo antes (modo 'w') ou confira o nome.",
    "StopIteration": "O iterador acabou: não há mais itens para next().",
    "OverflowError": "Número grande demais para esta operação.",
    "KeyboardInterrupt": "Execução interrompida.",
}


class _Saida:
    def __init__(self, escrever, guardar, tipo):
        self._escrever = escrever
        self._guardar = guardar
        self._tipo = tipo

    def write(self, s):
        s = str(s)
        if s:
            if self._guardar is not None:
                self._guardar.append(s)
            self._escrever(s, self._tipo)
        return len(s)

    def flush(self):
        pass

    def isatty(self):
        return False


class _Tempo(Exception):
    pass


def _formatar(e):
    nome = type(e).__name__
    linhas = []
    if isinstance(e, SyntaxError) and getattr(e, "filename", None) == ARQ:
        linhas.append(f"  Linha {e.lineno}:")
        if e.text:
            linhas.append("    " + e.text.rstrip())
            if e.offset:
                linhas.append("    " + " " * (max(e.offset, 1) - 1) + "^")
        msg = e.msg
    else:
        tb = e.__traceback__
        while tb is not None:
            co = tb.tb_frame.f_code
            if co.co_filename == ARQ:
                onde = "" if co.co_name == "<module>" else f", na função {co.co_name}()"
                linhas.append(f"  Linha {tb.tb_lineno}{onde}")
            tb = tb.tb_next
        msg = str(e)
    if isinstance(e, _Tempo):
        nome = "TimeoutError"
    cab = "Traceback (chamadas mais recentes por último):"
    ultima = nome + (": " + msg if msg else "")
    if not isinstance(e, (SyntaxError, _Tempo)):
        try:
            # inclui as sugestões do Python ("Did you mean: 'nome'?")
            ultima = "".join(traceback.format_exception_only(e)).strip() or ultima
        except Exception:
            pass
    texto = cab + "\n" + "\n".join(linhas) + "\n" + ultima
    dica = DICAS.get(nome)
    if dica is None:
        for base in type(e).__mro__:
            if base.__name__ in DICAS:
                dica = DICAS[base.__name__]
                break
    linha_erro = None
    if isinstance(e, SyntaxError):
        linha_erro = e.lineno
    elif linhas:
        try:
            linha_erro = int(linhas[-1].split()[1].rstrip(","))
        except Exception:
            linha_erro = None
    return {"tipo": nome, "mensagem": msg, "texto": texto, "dica": dica or "", "linha": linha_erro}


def novo_ns():
    return {"__name__": "__main__", "__builtins__": builtins}


def executar(codigo, ns, escrever, ler, limite=10.0, guardar=None, arquivo=ARQ):
    """Executa `codigo` no dicionário `ns`.
    escrever(texto, tipo) -> recebe a saída ('out' ou 'err');
    ler(prompt) -> devolve uma linha digitada (para input()).
    Devolve None se tudo correu bem ou um dicionário descrevendo o erro."""
    saida = _Saida(escrever, guardar, "out")
    erro = _Saida(escrever, None, "err")

    def _input(prompt=""):
        prompt = str(prompt)
        if prompt:
            saida.write(prompt)
        v = ler(prompt)
        if v is None:
            raise EOFError("entrada cancelada")
        v = str(v)
        escrever(v + "\n", "in")
        return v

    ns["input"] = _input
    fim = time.monotonic() + limite
    cont = [0]

    def rastro(frame, evento, arg):
        cont[0] += 1
        if cont[0] % 4000 == 0 and time.monotonic() > fim:
            raise _Tempo(f"tempo limite de {limite:.0f}s excedido")
        return rastro

    try:
        obj = compile(codigo, arquivo, "exec")
    except SyntaxError as e:
        return _formatar(e)

    antigo = (sys.stdout, sys.stderr)
    sys.stdout, sys.stderr = saida, erro
    sys.settrace(rastro)
    try:
        exec(obj, ns)
        return None
    except SystemExit:
        return None
    except BaseException as e:  # noqa: B902 - queremos capturar tudo do aluno
        return _formatar(e)
    finally:
        sys.settrace(None)
        sys.stdout, sys.stderr = antigo
