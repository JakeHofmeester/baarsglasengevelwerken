#!/usr/bin/env python3
"""Rebuild the FAQPage mainEntity in each page's JSON-LD from the visible FAQ accordion.

Run from anywhere: python tools/sync-faq-jsonld.py [page.html ...]
Question = text of the .accordion-button, answer = text of the .accordion-body (tags stripped).
Only pages that have both an accordion and a FAQPage node are touched.
"""
import glob, html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ITEM = re.compile(r'<button class="accordion-button[^>]*>(.*?)</button>.*?<div class="accordion-body">(.*?)</div>', re.S)
LD = re.compile(r'(<script type="application/ld\+json">\n)(.*?)(\n\s*</script>)', re.S)


def text(fragment):
    fragment = re.sub(r"<span[^>]*>\s*<svg.*?</svg>\s*</span>", "", fragment, flags=re.S)
    fragment = re.sub(r"<[^>]+>", "", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).strip()


def sync(path):
    src = open(path, encoding="utf-8").read()
    items = [(text(q), text(a)) for q, a in ITEM.findall(src)]
    m = LD.search(src)
    if not items or not m:
        return False
    raw = m.group(2)
    data = json.loads(raw)
    nodes = data.get("@graph", [data])
    faq = [n for n in nodes if "FAQPage" in (n.get("@type") if isinstance(n.get("@type"), list) else [n.get("@type")])]
    if not faq:
        return False
    faq[0]["mainEntity"] = [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items
    ]
    indent = re.match(r"\s*", raw).group(0)
    out = "\n".join(indent + line for line in json.dumps(data, indent=2, ensure_ascii=False).split("\n"))
    if out == raw:
        return False
    open(path, "w", encoding="utf-8").write(src[: m.start(2)] + out + src[m.end(2):])
    return True


pages = sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, "*.html")))
for p in pages:
    if sync(p):
        print("updated", os.path.basename(p))
