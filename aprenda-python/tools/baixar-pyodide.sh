#!/usr/bin/env bash
# Baixa o núcleo do Pyodide (Python compilado para WebAssembly) do registro npm
# e copia para web/pyodide/, para que o app funcione 100% offline.
set -euo pipefail
VERSAO="${PYODIDE_VERSAO:-314.0.8}"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$RAIZ/web/pyodide"
if [ -f "$DEST/pyodide.asm.wasm" ] && grep -q "\"version\": \"$VERSAO\"" "$DEST/package.json" 2>/dev/null; then
  echo "Pyodide $VERSAO já presente em $DEST"; exit 0
fi
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
( cd "$TMP" && npm pack "pyodide@$VERSAO" --silent >/dev/null && tar xzf pyodide-*.tgz )
mkdir -p "$DEST"
for f in pyodide.js pyodide.mjs pyodide.asm.mjs pyodide.asm.wasm python_stdlib.zip pyodide-lock.json package.json; do
  cp "$TMP/package/$f" "$DEST/"
done
echo "Pyodide $VERSAO copiado para $DEST ($(du -sh "$DEST" | cut -f1))"
