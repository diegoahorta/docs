#!/usr/bin/env python3
"""Servidor do Pongo Past Quest (só biblioteca padrão: http.server + sqlite3).

Serve o jogo (pasta web/) e uma API JSON pequena para a turma:

    GET  /api/health                 -> {"ok": true, "app": "pongo-past-quest"}
    POST /api/score                  -> grava/atualiza o placar do aluno
    GET  /api/leaderboard?week=AAAA-MM-DD  -> ranking da semana e geral
    GET  /api/progress/<id>          -> progresso salvo na nuvem
    PUT  /api/progress/<id>          -> salva o progresso (troca de aparelho)

Uso:
    python3 server/server.py                 # http://localhost:8000
    python3 server/server.py --port 8080 --host 0.0.0.0   # para a turma na mesma rede
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import threading
import time
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"
DB_PATH = Path(__file__).resolve().parent / "pongo.sqlite3"
MAX_BODY = 256 * 1024
ID_RE = re.compile(r"^[a-z0-9]{6,32}$")
WEEK_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

_lock = threading.Lock()


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with db() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS scores (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, xp INTEGER NOT NULL DEFAULT 0,
                week TEXT NOT NULL, week_xp INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0,
                level INTEGER NOT NULL DEFAULT 1, crowns INTEGER NOT NULL DEFAULT 0, updated REAL NOT NULL
            );
            CREATE TABLE IF NOT EXISTS progress (id TEXT PRIMARY KEY, state TEXT NOT NULL, updated REAL NOT NULL);
            """
        )


def clean_name(s: object) -> str:
    name = re.sub(r"[\x00-\x1f<>]", "", str(s or "")).strip()[:24]
    return name or "Aluno"


def to_int(v: object, lo: int = 0, hi: int = 10_000_000) -> int:
    try:
        return max(lo, min(hi, int(v)))
    except (TypeError, ValueError):
        return lo


class Handler(SimpleHTTPRequestHandler):
    server_version = "PongoPastQuest/1.0"

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(WEB), **kw)

    # ---------- helpers ----------
    def send_json(self, obj: object, status: int = 200) -> None:
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self) -> dict | None:
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > MAX_BODY:
            return None
        try:
            data = json.loads(self.rfile.read(n).decode("utf-8"))
            return data if isinstance(data, dict) else None
        except (ValueError, UnicodeDecodeError):
            return None

    def log_message(self, fmt: str, *args) -> None:  # menos barulho no terminal
        if "/api/" in (args[0] if args else ""):
            super().log_message(fmt, *args)

    # ---------- rotas ----------
    def do_GET(self) -> None:
        url = urlparse(self.path)
        if url.path == "/api/health":
            return self.send_json({"ok": True, "app": "pongo-past-quest", "time": time.time()})
        if url.path == "/api/leaderboard":
            week = (parse_qs(url.query).get("week") or [""])[0]
            with db() as c:
                rows_w = []
                if WEEK_RE.match(week):
                    rows_w = c.execute(
                        "SELECT id,name,week_xp,streak,level FROM scores WHERE week=? AND week_xp>0 ORDER BY week_xp DESC LIMIT 30",
                        (week,),
                    ).fetchall()
                rows_a = c.execute("SELECT id,name,xp,streak,level,crowns FROM scores ORDER BY xp DESC LIMIT 30").fetchall()
            return self.send_json({"week": [dict(r) for r in rows_w], "all": [dict(r) for r in rows_a]})
        m = re.match(r"^/api/progress/([a-z0-9]+)$", url.path)
        if m:
            pid = m.group(1)
            if not ID_RE.match(pid):
                return self.send_json({"error": "id inválido"}, HTTPStatus.BAD_REQUEST)
            with db() as c:
                row = c.execute("SELECT state FROM progress WHERE id=?", (pid,)).fetchone()
            return self.send_json({"state": json.loads(row["state"]) if row else None})
        if url.path.startswith("/api/"):
            return self.send_json({"error": "rota não encontrada"}, HTTPStatus.NOT_FOUND)
        return super().do_GET()

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/score":
            return self.send_json({"error": "rota não encontrada"}, HTTPStatus.NOT_FOUND)
        d = self.read_json()
        if not d or not ID_RE.match(str(d.get("id", ""))) or not WEEK_RE.match(str(d.get("week", ""))):
            return self.send_json({"error": "placar inválido"}, HTTPStatus.BAD_REQUEST)
        row = (
            d["id"], clean_name(d.get("name")), to_int(d.get("xp")), d["week"], to_int(d.get("week_xp")),
            to_int(d.get("streak"), hi=10_000), to_int(d.get("level"), 1, 999), to_int(d.get("crowns"), hi=999), time.time(),
        )
        with _lock, db() as c:
            c.execute(
                """INSERT INTO scores (id,name,xp,week,week_xp,streak,level,crowns,updated) VALUES (?,?,?,?,?,?,?,?,?)
                   ON CONFLICT(id) DO UPDATE SET name=excluded.name, xp=excluded.xp, week=excluded.week, week_xp=excluded.week_xp,
                   streak=excluded.streak, level=excluded.level, crowns=excluded.crowns, updated=excluded.updated""",
                row,
            )
        return self.send_json({"ok": True})

    def do_PUT(self) -> None:
        m = re.match(r"^/api/progress/([a-z0-9]+)$", urlparse(self.path).path)
        if not m or not ID_RE.match(m.group(1)):
            return self.send_json({"error": "rota não encontrada"}, HTTPStatus.NOT_FOUND)
        d = self.read_json()
        state = d.get("state") if d else None
        if not isinstance(state, dict) or state.get("id") != m.group(1):
            return self.send_json({"error": "progresso inválido"}, HTTPStatus.BAD_REQUEST)
        with _lock, db() as c:
            c.execute(
                "INSERT INTO progress (id,state,updated) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state, updated=excluded.updated",
                (m.group(1), json.dumps(state, ensure_ascii=False), time.time()),
            )
        return self.send_json({"ok": True})


def main() -> None:
    ap = argparse.ArgumentParser(description="Servidor do Pongo Past Quest")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8000)
    args = ap.parse_args()
    if not (WEB / "js" / "data.js").exists():
        raise SystemExit("Falta web/js/data.js. Rode antes: python3 tools/build.py")
    init_db()
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"Pongo Past Quest em http://{args.host}:{args.port}  (Ctrl+C para sair)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
