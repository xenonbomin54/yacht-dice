#!/bin/bash

set -e

echo "==> Vite build"
npm run build

echo "==> Inline JS/CSS into index.html"

python3 <<'PY'
from pathlib import Path
import re

dist = Path("dist")
html_path = dist / "index.html"

html = html_path.read_text(encoding="utf-8")

# JS 파일 inline
for src in re.findall(r'<script[^>]+src="([^"]+)"[^>]*></script>', html):
    js_path = dist / src.lstrip("./")
    if js_path.exists():
        js = js_path.read_text(encoding="utf-8")
        html = html.replace(
            f'<script type="module" crossorigin src="{src}"></script>',
            f'<script type="module">\n{js}\n</script>'
        )

# CSS 파일 inline
for href in re.findall(r'<link[^>]+href="([^"]+\.css)"[^>]*>', html):
    css_path = dist / href.lstrip("./")
    if css_path.exists():
        css = css_path.read_text(encoding="utf-8")
        html = html.replace(
            re.search(
                rf'<link[^>]+href="{re.escape(href)}"[^>]*>',
                html
            ).group(0),
            f'<style>\n{css}\n</style>'
        )

# 남아있는 JS/CSS 파일 링크 제거
html = re.sub(
    r'<script[^>]+src="[^"]+"[^>]*></script>',
    '',
    html
)

html = re.sub(
    r'<link[^>]+href="[^"]+\.css"[^>]*>',
    '',
    html
)

html_path.write_text(html, encoding="utf-8")

# index.html을 제외한 파일 삭제
for path in dist.rglob("*"):
    if path.is_file() and path != html_path:
        path.unlink()

for path in sorted(dist.rglob("*"), reverse=True):
    if path.is_dir():
        try:
            path.rmdir()
        except OSError:
            pass

print("==> Done!")
print(f"Output: {html_path}")
PY

echo "==> Build complete: dist/index.html"