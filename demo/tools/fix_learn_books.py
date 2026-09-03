# -*- coding: utf-8 -*-
import io, re
path = "demo/learn.html"
html = io.open(path, "r", encoding="utf-8").read()
new_style = {
    "market": "--cover-color:#FFFFFF; --cover-ink:#18202A",
    "quiz": "--cover-color:#EAF6FF; --cover-ink:#0E5FA8",
    "roadmap": "--cover-color:#FFF3C9; --cover-ink:#6B4E00",
    "pipeline": "--cover-color:#FFEDE6; --cover-ink:#A63D1F",
    "readiness": "--cover-color:#EDF9F2; --cover-ink:#1E7A4F",
}
for book, style in new_style.items():
    pat = re.compile(r'(<button\s+class="book-card"\s+type="button"\s+data-book="' + book + r'")([^>]*?)(>)')
    m = pat.search(html)
    assert m, book
    attrs = m.group(2)
    attrs = re.sub(r'\sstyle="[^"]*"', "", attrs)
    attrs = re.sub(r'\n\s*\n', "\n", attrs).rstrip()
    if "style=" not in attrs:
        attrs += "\n        style=\"" + style + "\""
    html = html[:m.start()] + m.group(1) + attrs + m.group(3) + html[m.end():]
    print(book, "done")
io.open(path, "w", encoding="utf-8").write(html)
print("OK")
