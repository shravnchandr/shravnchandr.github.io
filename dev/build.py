#!/usr/bin/env python3
"""Build the deployed site: index.html with every html/*.html section written in.

The repo's index.html keeps empty <div id="frag-…"> placeholders, and js/loader.js
fills them at runtime — that's what you get locally with `python3 -m http.server`,
so editing a partial and refreshing still works with no build. For deployment,
this script does the same replacement ahead of time, so the served page is fully
static: readers that don't run JavaScript (AI summarisers, ATS scrapers, older
crawlers) get the whole content. loader.js sees no placeholders and does nothing.

    python3 dev/build.py            # writes _site/
    python3 -m http.server -d _site # preview the built site

Run by .github/workflows/pages.yml on every push to master. Standard library only.
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / '_site'

# Not deployed: sources, docs, local-only material
EXCLUDE = {'.git', '.github', '_site', 'dev', 'html', 'LinkedIn', 'README.md',
           'CLAUDE.md', '.gitignore', 'resume.tex', '.DS_Store'}


def fragments():
    """The section list, read from js/loader.js so there's one source of truth."""
    src = (ROOT / 'js' / 'loader.js').read_text()
    pairs = re.findall(r"id:\s*'(frag-[a-z]+)',\s*src:\s*'(html/[a-z]+\.html)'", src)
    if not pairs:
        sys.exit('build: no FRAGMENTS found in js/loader.js')
    return pairs


def replace_placeholder(page, frag_id, html):
    """Replace <div id="frag-…">…</div> (skeleton included) with the section HTML."""
    start = page.find(f'<div id="{frag_id}">')
    if start < 0:
        sys.exit(f'build: placeholder #{frag_id} not found in index.html')
    # Walk the nested <div>s to find the placeholder's own closing tag
    depth, pos = 0, start
    for tag in re.finditer(r'<div\b|</div>', page[start:]):
        depth += 1 if tag.group() != '</div>' else -1
        if depth == 0:
            end = start + tag.end()
            return page[:start] + html.strip() + page[end:]
    sys.exit(f'build: unbalanced <div> in placeholder #{frag_id}')


def main():
    page = (ROOT / 'index.html').read_text()
    for frag_id, src in fragments():
        page = replace_placeholder(page, frag_id, (ROOT / src).read_text())
    if 'id="frag-' in page:
        sys.exit('build: a placeholder was left unfilled')

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    for item in ROOT.iterdir():
        if item.name in EXCLUDE:
            continue
        dest = OUT / item.name
        if item.is_dir():
            shutil.copytree(item, dest, ignore=shutil.ignore_patterns('.DS_Store'))
        else:
            shutil.copy2(item, dest)
    (OUT / 'index.html').write_text(page)
    (OUT / '.nojekyll').write_text('')   # serve files as-is (no Jekyll processing)
    print(f'build: wrote {OUT.relative_to(ROOT)}/ — {len(fragments())} sections inlined')


if __name__ == '__main__':
    main()
