#!/usr/bin/env python3
"""Static checks for baarsglasengevelwerken.nl. Run from anywhere: python tools/verify-site.py

Checks every *.html page in the repo root:
- <title> <= 60 and meta description <= 155 characters, exactly one <h1>
- every application/ld+json block parses; LocalBusiness @id/phone/address/KvK identical on all pages
- canonical is the clean URL of the file and (for indexable pages) listed in sitemap.xml, and vice versa
- every internal href/src resolves to an existing file (clean URL -> .html) and an existing #id
- FAQ accordion items == FAQPage questions; every "Wat kost..." FAQ answer links to /prijzen
- forbidden strings: /?go=, internal .html links, Noord-Holland, Keraliet, "Onze focus ligt op
  bedrijfspanden", unfilled placeholders [OWNER-CONFIRM / [€ / [X
Exit code 1 if anything fails.
"""
import glob, json, os, re, sys
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://baarsglasengevelwerken.nl"
FORBIDDEN = ["/?go=", "Noord-Holland", "Keraliet", "Onze focus ligt op bedrijfspanden", "[OWNER-CONFIRM", "[€", "[X"]

errors = []


def fail(page, msg):
    errors.append("%s: %s" % (page, msg))


class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.links, self.title, self.desc, self.canonical, self.robots = set(), [], "", None, None, ""
        self.h1, self.ld, self._in_title, self._in_ld, self._buf = 0, [], False, False, []
        self.faq_items = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "title":
            self._in_title = True
        if tag == "h1":
            self.h1 += 1
        if tag == "meta" and a.get("name") == "description":
            self.desc = a.get("content", "")
        if tag == "meta" and a.get("name") == "robots":
            self.robots = a.get("content", "")
        if tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")
        if tag == "script" and a.get("type") == "application/ld+json":
            self._in_ld, self._buf = True, []
        if tag == "div" and "accordion-item" in (a.get("class") or "").split():
            self.faq_items += 1
        for k in ("href", "src"):
            if a.get(k):
                self.links.append((tag, k, a[k]))
        if a.get("srcset"):
            for part in a["srcset"].split(","):
                self.links.append((tag, "srcset", part.strip().split(" ")[0]))

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag == "script" and self._in_ld:
            self._in_ld = False
            self.ld.append("".join(self._buf))

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_ld:
            self._buf.append(data)


def page_file_for(path):
    path = unquote(path)
    if path in ("", "/"):
        return "index.html"
    p = path.lstrip("/")
    if os.path.splitext(p)[1]:
        return p  # asset or file with extension
    return p + ".html"


def nodes_of(data):
    if isinstance(data, dict) and "@graph" in data:
        return data["@graph"]
    return data if isinstance(data, list) else [data]


pages = sorted(f for f in glob.glob(os.path.join(ROOT, "*.html")))
parsed, raw = {}, {}
for f in pages:
    name = os.path.basename(f)
    s = open(f, encoding="utf-8").read()
    p = Parser()
    p.feed(s)
    parsed[name], raw[name] = p, s

sitemap = open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8").read()
sitemap_urls = set(re.findall(r"<loc>([^<]+)</loc>", sitemap))
lb_signatures = {}
report = []

for name, p in parsed.items():
    s = raw[name]
    title = p.title.strip()
    desc = p.desc or ""
    report.append("%-36s title %2d  meta %3d" % (name, len(title), len(desc)))
    if len(title) > 60:
        fail(name, "title is %d chars: %s" % (len(title), title))
    if not desc:
        fail(name, "no meta description")
    elif len(desc) > 155:
        fail(name, "meta description is %d chars" % len(desc))
    if p.h1 != 1:
        fail(name, "%d <h1> elements" % p.h1)

    faq_q = 0
    for block in p.ld:
        try:
            data = json.loads(block)
        except Exception as e:
            fail(name, "JSON-LD parse error: %s" % e)
            continue
        for n in nodes_of(data):
            t = n.get("@type")
            types = t if isinstance(t, list) else [t]
            if "LocalBusiness" in types:
                ident = n.get("identifier", {})
                lb_signatures[name] = json.dumps([n.get("@id"), n.get("telephone"), n.get("address"), ident.get("value")], sort_keys=True)
            if "FAQPage" in types:
                faq_q += len(n.get("mainEntity", []))
    if faq_q != p.faq_items:
        fail(name, "FAQPage has %d questions, page shows %d accordion items" % (faq_q, p.faq_items))
    # every visible "Wat kost..." FAQ answer links to /prijzen
    for m in re.finditer(r'<button class="accordion-button[^>]*>.*?</span>\s*(.*?)\s*</button>.*?<div class="accordion-body">(.*?)</div>', s, re.S):
        q, a = m.group(1), m.group(2)
        if q.lower().startswith("wat kost") and name != "prijzen.html" and "/prijzen" not in a:
            fail(name, "FAQ '%s' does not link to /prijzen" % q)

    indexable = not p.robots.startswith("noindex")
    expected = SITE + ("/" if name == "index.html" else "/" + name[:-5])
    if indexable and name != "404.html":
        if p.canonical != expected:
            fail(name, "canonical %r, expected %r" % (p.canonical, expected))
        if expected not in sitemap_urls:
            fail(name, "canonical not in sitemap.xml")
    elif p.canonical and ".html" in p.canonical:
        fail(name, "canonical contains .html")

    for tag, attr, href in p.links:
        if href.startswith(("mailto:", "tel:", "data:", "javascript:")) or href == "#":
            continue
        u = urlsplit(href)
        if u.scheme in ("http", "https") or href.startswith("//"):
            if u.netloc.endswith("baarsglasengevelwerken.nl") and tag == "a":
                fail(name, "absolute internal link %s" % href)
            continue
        if not u.path:  # same-page anchor
            if u.fragment and u.fragment not in p.ids:
                fail(name, "missing anchor %s" % href)
            continue
        if tag == "a" and u.path.endswith(".html"):
            fail(name, "internal link to .html: %s" % href)
        if u.path.startswith("/"):
            target = page_file_for(u.path)
        else:
            target = os.path.normpath(os.path.join(os.path.dirname(name), unquote(u.path))).replace("\\", "/")
        if not os.path.exists(os.path.join(ROOT, target)):
            fail(name, "%s %s -> missing %s" % (attr, href, target))
            continue
        if u.fragment and target.endswith(".html"):
            tp = parsed.get(target)
            if tp and u.fragment not in tp.ids:
                fail(name, "link %s: no id '%s' in %s" % (href, u.fragment, target))

    for word in FORBIDDEN:
        if word in s:
            fail(name, "contains forbidden text %r" % word)

for url in sorted(sitemap_urls):
    path = urlsplit(url).path
    f = page_file_for(path)
    if f not in parsed:
        fail("sitemap.xml", "%s has no page %s" % (url, f))
    elif parsed[f].robots.startswith("noindex"):
        fail("sitemap.xml", "%s is noindex" % url)

if len(set(lb_signatures.values())) != 1:
    fail("LocalBusiness", "not identical on all pages: %s" % {k: v[:80] for k, v in lb_signatures.items()})
missing_lb = set(parsed) - set(lb_signatures)
if missing_lb:
    fail("LocalBusiness", "missing on %s" % sorted(missing_lb))

print("\n".join(report))
print()
print("pages: %d, sitemap URLs: %d, LocalBusiness blocks: %d (%d distinct)" % (len(parsed), len(sitemap_urls), len(lb_signatures), len(set(lb_signatures.values()))))
if errors:
    print("\nFAILED (%d):" % len(errors))
    print("\n".join("  - " + e for e in errors))
    sys.exit(1)
print("ALL CHECKS PASSED")
