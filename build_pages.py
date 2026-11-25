#!/usr/bin/env python3
"""Génère les pages statiques /case/<slug>.html et /modele/<slug>.html
à partir de assets/mb/site-data.js (source unique des projets et du casting).

Le contenu (titres, textes, visuels) est écrit en dur dans chaque page pour le
référencement et l'affichage sans JavaScript ; mb.js et pages.js ajoutent les
animations, la lightbox et la planche-contact.

Usage : python3 build_pages.py   (depuis la racine du repo)
"""
import html, json, re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = 'https://moltobene.ai'
V = '42'  # cache-busting des fichiers partagés (assets/mb/*)

raw = (ROOT / 'assets/mb/site-data.js').read_text()
DATA = json.loads(raw[raw.index('{'):raw.rindex('}') + 1])
CASES, MODELS = DATA['cases'], DATA['models']

e = lambda s: html.escape(str(s), quote=True)
IA = '<span class="ia-mark" aria-label="Visuel généré par IA">IA</span>'
CAT1 = {'femme': 'Femme', 'homme': 'Homme', 'enfant': 'Enfant', 'duo': 'Duo'}


def live_meta(path):
    """Titre et description de la page publiée (HEAD de main), s'ils existent."""
    try:
        s = subprocess.run(['git', 'show', f'main:{path}'], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    except subprocess.CalledProcessError:
        return None, None
    t = re.search(r'<title>(.*?)</title>', s)
    d = re.search(r'<meta name="description" content="(.*?)"', s)
    title = html.unescape(t.group(1)).replace(' — ', ' · ') if t else None
    desc = html.unescape(d.group(1)).replace(' — ', ' : ') if d else None
    return title, desc


def head(title, desc, path, img, og_type='article'):
    url = f'{SITE}/{path}'
    return f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>html{{background:#0A0A09}}html.mb-arrive{{background:#E5BA20}}</style>
<script>try{{var n=performance.getEntriesByType('navigation')[0];if(sessionStorage.getItem('mb-go')||!(n&&n.type==='back_forward'))document.documentElement.classList.add('mb-arrive')}}catch(e){{}}</script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#0A0A09">
<meta property="og:type" content="{og_type}">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{SITE}/assets/{e(img)}">
<meta property="og:site_name" content="Molto Bene">
<meta property="og:locale" content="fr_FR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(title)}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{SITE}/assets/{e(img)}">
<link rel="canonical" href="{url}">
<link rel="icon" type="image/x-icon" href="/assets/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/mb/mb.css?v={V}">
<link rel="stylesheet" href="/assets/mb/pages.css?v={V}">
</head>'''


def foot_scripts():
    return f'''<script src="https://unpkg.com/lenis@1.1.13/dist/lenis.min.js"></script>
<script src="/assets/mb/site-data.js?v={V}"></script>
<script src="/assets/mb/mb.js?v={V}"></script>
<script src="/assets/mb/pages.js?v={V}"></script>
<script>renderFooter();</script>
</body>
</html>
'''


def lightbox(name):
    return f'''<div class="lb" id="lb" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Visionneuse" data-name="{e(name)}">
  <div class="lb-top mono"><span id="lbn"></span><button id="lbx" type="button">Fermer ✕</button></div>
  <div class="lb-st" id="lbs"></div>
  <div class="lb-bot"><button id="lbp" type="button">← Préc.</button><span class="mono muted">Visuel généré par IA · Molto Bene</span><button id="lbnx" type="button">Suiv. →</button></div>
</div>'''


def split_title(name):
    p = name.split(' ')
    if len(p) == 1:
        return f'<span class="line-mask"><span>{e(name)}</span></span>'
    return f'<span class="line-mask"><span>{e(" ".join(p[:-1]))}</span></span><span class="line-mask"><span class="serif">{e(p[-1])}</span></span>'


def name_html(name):
    p = name.split(' ')
    return e(name) if len(p) == 1 else f'{e(" ".join(p[:-1]))} <span class="serif">{e(p[-1])}</span>'


# ───────────────────────── PAGES PROJET ─────────────────────────
PATTERN = [('r-hero', 1), ('r-2', 2), ('r-off', 2), ('quote', 0), ('r-3', 3), ('r-off2', 2)]


def case_page(i, c):
    client = c['meta'].get('Status') == 'Client'
    nx = CASES[(i + 1) % len(CASES)]
    path = f'case/{c["slug"]}.html'
    t_live, d_live = live_meta(path)
    title = t_live or f'Molto Bene × {c["name"]} · Molto Bene'
    desc = d_live or c['desc']
    total = len(c['media'])

    meta = [(k.replace('Season', 'Saison').replace('References', 'Références').replace('Status', 'Statut'), v) for k, v in c['meta'].items()]
    meta.append(('Visuels', f'{total:02d} images & films'))
    meta_html = ''.join(f'<div><span>{e(k)}</span><b>{e(v)}</b></div>' for k, v in meta)
    lede = re.sub(r'\s*Direction artistique Molto Bene\.?', '', c['desc']).strip() or c['title']

    med = [m for m in c['media'] if m[1] != c['cover']]
    # la première vidéo ouvre la planche ; les suivantes sont réparties dans les images
    vids = [m for m in med if m[0] == 'video']
    if vids:
        imgs = [m for m in med if m[0] != 'video']
        rest = vids[1:]
        med = [vids[0]] + imgs
        for j, v in enumerate(rest, 1):
            med.insert(1 + round(j * len(imgs) / (len(rest) + 1)) + (j - 1), v)

    def fig(m, k):
        src = f'/assets/{m[1]}'
        if m[0] == 'video':
            inner = f'<video src="{e(src)}" muted loop playsinline preload="metadata" data-autoplay aria-label="{e(c["name"])}, film {k+1}"></video>'
            cls = ' class="film"'
        else:
            inner = f'<img src="{e(src)}" alt="{e(c["name"])}, visuel {k+1}" loading="lazy" decoding="async" data-lb="{e(src)}">'
            cls = ''
        return (f'<figure{cls}><div class="media clip">{inner}{IA}</div>'
                f'<figcaption class="cap mono"><span>{k+1:02d} / {total:02d}</span><span>{e(c["name"])}</span></figcaption></figure>')

    rows, k, pi = [], 0, 0
    while k < len(med):
        cls, n = PATTERN[pi % len(PATTERN)]; pi += 1
        if cls == 'quote':
            rows.append(f'<p class="quote wide fade">{e(c["meta"].get("Mood") or c["tag"])}<br><span class="serif">{e(c["name"])}</span></p>')
            continue
        items = med[k:k + n]
        rows.append(f'<div class="r {"r-2" if len(items) < n else cls}">' + ''.join(fig(m, k + j) for j, m in enumerate(items)) + '</div>')
        k += n

    imgs = [m[1] for m in c['media'] if m[0] == 'img']
    strip = ''.join(f'<button class="fr" type="button" data-lb="/assets/{e(f)}" aria-label="Agrandir le visuel {j+1}"><img src="/assets/{e(f)}" alt="" loading="lazy" decoding="async"><span>{j+1:02d}A ▸</span></button>' for j, f in enumerate(imgs))
    rd = '' if client else ('<p class="rd-note mono">Exploration R&amp;D : création libre du studio, non commandée par la marque citée'
                            + (' ; co-branding fictif' if c['tag'] == 'Co-branding' else '') + '.</p>')

    body = f'''
<body data-page="cas">
<main id="main">
<section class="cov">
  <div class="cov-l">
    <a class="back" href="/clients.html">← Index des projets</a>
    <div>
      <div class="eyebrow">{"Client" if client else "Exploration R&amp;D"} · {e(c["tag"])}</div>
      <h1 class="wide" data-fit>{split_title(c["name"])}</h1>
      {rd}
    </div>
    <div class="meta mono">{meta_html}</div>
  </div>
  <div class="cov-r"><img src="/assets/{e(c["cover"])}" alt="{e(c["name"])}, visuel de couverture" fetchpriority="high" data-lb="/assets/{e(c["cover"])}">{IA}<span class="scroll" aria-hidden="true">Scroll ↓</span></div>
</section>

<section class="lede">
  <div class="eyebrow">Le brief</div>
  <p class="fade">{e(lede)}</p>
</section>

<section class="ed" aria-label="Visuels du projet">
{chr(10).join(rows)}
</section>

<section class="sheet" aria-label="Planche contact">
  <div class="sheet-h"><h2 class="wide">Planche <span class="serif mustard">contact.</span></h2><span class="mono muted">Glisser · cliquer pour agrandir</span></div>
  <div class="strip" id="strip">{strip}</div>
</section>

<a class="next" href="/case/{e(nx["slug"])}.html" data-cursor="Suivant"><img src="/assets/{e(nx["cover"])}" alt="" loading="lazy">{IA}<div class="t"><span class="eyebrow" style="justify-content:center">Projet suivant · {(i + 2 if i + 2 <= len(CASES) else 1):02d} / {len(CASES)}</span><span class="wide">{name_html(nx["name"])}</span></div></a>
</main>
{lightbox(c["name"])}
'''
    (ROOT / path).write_text(head(title, desc, path, c['cover']) + body + foot_scripts())


# ───────────────────────── PAGES MODÈLE ─────────────────────────
def model_page(i, m):
    path = f'modele/{m["slug"]}.html'
    t_live, d_live = live_meta(path)
    title = t_live or f'{m["name"]}, {"double" if m.get("droits") else "mannequin"} numérique · Molto Bene'
    droits = m.get('droits')  # renseigné quand le modèle est le double numérique d'une personne réelle
    desc = d_live or (f'{m["name"]}, double numérique du casting Molto Bene. Signature : {m["tag"]}. Même visage, cohérent d\'une campagne à l\'autre.' if droits else f'{m["name"]}, mannequin numérique du casting Molto Bene. Signature : {m["tag"]}. Visage fictif, cohérent d\'une campagne à l\'autre.')
    book = m['media']
    attrs = [('Catégorie', CAT1.get(m['cat'], m['cat'])), ('Type', m['type']), ('Signature', m['tag']), ('Statut', m['statut']),
             ('Book', f'{len(book):02d} images'), ('Droits à l\'image', droits or 'Aucun · visage fictif')]
    attrs_html = ''.join(f'<div><span>{e(k)}</span><b>{e(v)}</b></div>' for k, v in attrs)
    figs = ''.join(f'<figure><div class="media clip"><img src="/assets/{e(f)}" alt="{e(m["name"])}, mannequin numérique Molto Bene, image {j+1}" loading="lazy" decoding="async" data-lb="/assets/{e(f)}">{IA}</div><figcaption class="cap mono"><span>{j+1:02d} / {len(book):02d}</span><span>{e(m["name"])}</span></figcaption></figure>' for j, f in enumerate(book))
    others = [MODELS[(i + k) % len(MODELS)] for k in range(1, 6)]
    more = ''.join(f'<a href="/modele/{e(o["slug"])}.html" data-cursor="Book"><div class="media"><img src="/assets/{e(o["img"])}" alt="{e(o["name"])}, mannequin numérique Molto Bene" loading="lazy">{IA}</div><b>{e(o["name"])}</b><span class="mono muted">{e(o["tag"])}</span></a>' for o in others)
    nx = MODELS[(i + 1) % len(MODELS)]
    mail = 'mailto:hello@moltobene.ai?subject=' + re.sub(r'\s', '%20', f'Casting Molto Bene - {m["name"]}')

    body = f'''
<body data-page="modeles">
<main id="main">
<section class="cov mcov">
  <div class="cov-l">
    <a class="back" href="/modeles.html">← Tout le casting</a>
    <div>
      <div class="eyebrow">Casting · N° {i+1:02d} / {len(MODELS)}</div>
      <h1 class="wide" data-fit><span class="line-mask"><span>{e(m["name"])}<span class="mustard">.</span></span></span></h1>
      <span class="sig">{e(m["tag"])}</span>
    </div>
    <div class="meta mono">{attrs_html}</div>
  </div>
  <div class="cov-r"><img src="/assets/{e(m["img"])}" alt="{e(m["name"])}, mannequin numérique Molto Bene" fetchpriority="high" data-lb="/assets/{e(m["img"])}">{IA}<span class="scroll" aria-hidden="true">Le book ↓</span></div>
</section>

<section class="book" aria-label="Le book de {e(m["name"])}">{figs}</section>

<section class="bespoke-band">
  <div><div class="eyebrow" style="margin-bottom:20px">Caster {e(m["name"])}</div><h2 class="wide">Même visage, <span class="serif mustard">chaque saison.</span></h2></div>
  <div>
    <p>{e(m["name"])} porte vos pièces d'une campagne à l'autre : même visage, même lumière, c'est notre cast-lock. Ou créons votre égérie : un visage propriétaire, entraîné pour votre marque, qui devient un actif de votre marque.</p>
    <div class="btns"><a class="btn solid" href="{e(mail)}">Caster {e(m["name"])} →</a><a class="btn" href="mailto:hello@moltobene.ai?subject=Mod%C3%A8le%20sur-mesure%20-%20Molto%20Bene">Créer mon modèle →</a></div>
  </div>
</section>

<section class="more">
  <div class="more-h"><h2 class="wide">Continuer le <span class="serif mustard">casting.</span></h2><a class="btn" href="/modeles.html">Tout le casting →</a></div>
  <div class="more-g">{more}</div>
</section>

<a class="next" href="/modele/{e(nx["slug"])}.html" data-cursor="Suivant"><img src="/assets/{e(nx["img"])}" alt="" loading="lazy">{IA}<div class="t"><span class="eyebrow" style="justify-content:center">Visage suivant · {(i + 2 if i + 2 <= len(MODELS) else 1):02d} / {len(MODELS)}</span><span class="wide">{e(nx["name"])}</span></div></a>
</main>
{lightbox(m["name"])}
'''
    (ROOT / path).write_text(head(title, desc, path, m['img'], 'profile') + body + foot_scripts())


if __name__ == '__main__':
    for i, c in enumerate(CASES):
        case_page(i, c)
    for i, m in enumerate(MODELS):
        model_page(i, m)
    print(f'{len(CASES)} pages projet, {len(MODELS)} pages modèle générées.')
