"""Servidor local do Kotobana Dojo.

Serve o site e guarda o progresso do aluno em kotobana/progresso/<aluno>.json,
para que ele não dependa só do navegador.

Uso: python3 kotobana/tools/servidor.py [--porta 8000] [--aluno nome]
Depois abra http://localhost:8000
"""
import argparse
import json
import re
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
DATA = ROOT / "progresso"
MAX_BODY = 5 * 1024 * 1024


class Handler(SimpleHTTPRequestHandler):
    aluno = "aluno"

    def _progress_file(self):
        return DATA / f"{self.aluno}.json"

    def _json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?")[0] == "/api/progresso":
            f = self._progress_file()
            return self._json(200, json.loads(f.read_text(encoding="utf-8")) if f.exists() else {})
        return super().do_GET()

    def do_PUT(self):
        if self.path.split("?")[0] != "/api/progresso":
            return self._json(404, {"erro": "rota desconhecida"})
        size = int(self.headers.get("Content-Length") or 0)
        if size <= 0 or size > MAX_BODY:
            return self._json(413, {"erro": "corpo vazio ou grande demais"})
        try:
            state = json.loads(self.rfile.read(size))
            assert isinstance(state, dict)
        except (ValueError, AssertionError):
            return self._json(400, {"erro": "JSON inválido"})
        DATA.mkdir(exist_ok=True)
        tmp = self._progress_file().with_suffix(".tmp")
        tmp.write_text(json.dumps(state, ensure_ascii=False), encoding="utf-8")
        tmp.replace(self._progress_file())
        return self._json(200, {"ok": True, "xp": state.get("xp", 0)})


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--porta", type=int, default=8000)
    ap.add_argument("--aluno", default="aluno", help="nome do arquivo de progresso (letras, números, - e _)")
    args = ap.parse_args()
    if not re.fullmatch(r"[\w-]{1,40}", args.aluno):
        ap.error("nome de aluno inválido")
    Handler.aluno = args.aluno
    server = ThreadingHTTPServer(("127.0.0.1", args.porta), partial(Handler, directory=str(SITE)))
    print(f"Kotobana Dojo em http://localhost:{args.porta}  (progresso: {DATA / (args.aluno + '.json')})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
