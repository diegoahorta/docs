#!/usr/bin/env bash
# Gera o pacote Debian (.deb) do Aprenda Python: build/aprenda-python_<versão>_all.deb
# Requer: dpkg-deb, node/npm (para baixar o Pyodide e validar o conteúdo).
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
VERSAO="${VERSAO_NOME:-$(sed -n 's/^VERSAO = "\(.*\)"/\1/p' "$RAIZ/linux/aprenda-python")}"
PKG="$RAIZ/build/deb/aprenda-python_${VERSAO}_all"

bash "$RAIZ/tools/baixar-pyodide.sh"
if [ "${PULAR_VALIDACAO:-0}" != "1" ]; then node "$RAIZ/tools/validar.js"; fi

rm -rf "$PKG"
mkdir -p "$PKG/DEBIAN" "$PKG/usr/bin" "$PKG/usr/share/aprenda-python/web" \
  "$PKG/usr/share/applications" "$PKG/usr/share/icons/hicolor/scalable/apps" \
  "$PKG/usr/share/icons/hicolor/512x512/apps" "$PKG/usr/share/doc/aprenda-python"

( cd "$RAIZ/web" && tar cf - --exclude='conteudo/FORMATO.md' --exclude='*.map' . ) | ( cd "$PKG/usr/share/aprenda-python/web" && tar xf - )
install -m 0755 "$RAIZ/linux/aprenda-python" "$PKG/usr/bin/aprenda-python"
sed -i "s/^VERSAO = \".*\"/VERSAO = \"$VERSAO\"/" "$PKG/usr/bin/aprenda-python"
install -m 0644 "$RAIZ/linux/aprenda-python.desktop" "$PKG/usr/share/applications/aprenda-python.desktop"
install -m 0644 "$RAIZ/web/img/icone.svg" "$PKG/usr/share/icons/hicolor/scalable/apps/aprenda-python.svg"
install -m 0644 "$RAIZ/web/img/icone-512.png" "$PKG/usr/share/icons/hicolor/512x512/apps/aprenda-python.png"
cat > "$PKG/usr/share/doc/aprenda-python/copyright" <<'TXT'
Format: https://www.debian.org/doc/packaging-manuals/copyright-format/1.0/
Upstream-Name: aprenda-python

Files: *
License: MIT (código do app). Conteúdo educacional baseado em "Pense em Python"
 (Allen B. Downey, trad. Sheila Gomes, CC BY-NC 3.0) e "Como programar em Python
 do zero" (Augusto Patsch).

Files: usr/share/aprenda-python/web/pyodide/*
License: MPL-2.0 (Pyodide, https://pyodide.org) — inclui CPython (PSF License).
TXT
find "$PKG" -type d -exec chmod 0755 {} +
find "$PKG/usr/share" -type f -exec chmod 0644 {} +

TAMANHO=$(du -sk "$PKG/usr" | cut -f1)
cat > "$PKG/DEBIAN/control" <<CTL
Package: aprenda-python
Version: $VERSAO
Section: education
Priority: optional
Architecture: all
Depends: python3 (>= 3.7)
Recommends: chromium | firefox-esr | firefox | www-browser
Installed-Size: $TAMANHO
Maintainer: Aprenda Python <aprenda-python@users.noreply.github.com>
Homepage: https://github.com/diegoahorta/docs/tree/main/aprenda-python
Description: curso de Python do zero ao avançado, 100% offline
 14 módulos e 131 lições com exemplos executáveis, exercícios corrigidos
 automaticamente, quizzes, editor livre, plano de estudos, referência
 rápida e glossário. Os códigos rodam num interpretador Python 3.14 real
 (CPython em WebAssembly, projeto Pyodide) embutido no pacote; não é
 preciso internet nem instalar mais nada.
CTL
cat > "$PKG/DEBIAN/postinst" <<'SH'
#!/bin/sh
set -e
if [ "$1" = "configure" ]; then
  command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q /usr/share/applications || true
  command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
fi
exit 0
SH
cp "$PKG/DEBIAN/postinst" "$PKG/DEBIAN/postrm"
sed -i 's/if \[ "$1" = "configure" \]; then/if [ "$1" = "remove" ] || [ "$1" = "purge" ]; then/' "$PKG/DEBIAN/postrm"
chmod 0755 "$PKG/DEBIAN/postinst" "$PKG/DEBIAN/postrm"

dpkg-deb --root-owner-group -Zxz --build "$PKG" "$RAIZ/build/aprenda-python_${VERSAO}_all.deb" >/dev/null
echo "Pacote pronto: $RAIZ/build/aprenda-python_${VERSAO}_all.deb ($(du -h "$RAIZ/build/aprenda-python_${VERSAO}_all.deb" | cut -f1))"
