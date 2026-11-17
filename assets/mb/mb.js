/* MOLTO BENE — comportements partagés (nav, scroll fluide, curseur, reveals,
   rideau entre les pages, pied de page). Chargé par toutes les pages. */
(function(){
const A = '/assets/';
window.A = A;
const page = document.body.dataset.page || '';
const IA = '<span class="ia-mark" aria-label="Visuel généré par IA">IA</span>';
window.IA = IA;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* signature Molto Bene : l'étoile jaillit dans le B, le logotype se dévoile depuis elle */
window.mbSig = (tone='white') => `<span class="sig" role="img" aria-label="Molto Bene"><img class="l" src="${A}mb/brand/wm-${tone}.png" alt="" width="1006" height="136"><span class="s"></span><span class="g"></span></span>`;

/* ── NAV ── */
const nCases = (window.MB && MB.cases.length) || '', nModels = (window.MB && MB.models.length) || '';
const links = [
  ['/studio.html','Studio','studio',''],
  ['/clients.html','Clients','clients',nCases],
  ['/modeles.html','Modèles','modeles',nModels],
  ['/#comparatif','Tarifs','tarifs',''],
  ['/#manifeste','Manifeste','manifeste',''],
];
const nav = document.createElement('header');
nav.className = 'nav';
nav.innerHTML = `<a class="brand" href="/" aria-label="Molto Bene, accueil"><img src="${A}logo-molto-bene.png" alt="Molto Bene" width="120" height="17"></a>
  <div class="spacer"></div>
  ${links.map(([h,t,k,n])=>`<a class="lnk ${page===k?'on':''}" href="${h}"><span data-t="${t}">${t}</span>${n?`<sup>${n}</sup>`:''}</a>`).join('')}
  <button class="burger" type="button" aria-label="Ouvrir le menu" aria-expanded="false">Menu</button>
  <a class="cta" href="https://meet.moltobene.ai" target="_blank" rel="noopener">On se parle →</a>`;
document.body.prepend(nav);
document.body.insertAdjacentHTML('afterbegin','<a class="skip" href="#main">Aller au contenu</a>');
const mm = document.createElement('nav');
mm.className = 'menu-m';
mm.setAttribute('aria-label','Menu');
mm.innerHTML = [['/','Accueil'],...links].map(([h,t])=>`<a class="wide" href="${h}">${t}</a>`).join('') + `<a class="wide mustard" href="https://meet.moltobene.ai" target="_blank" rel="noopener">On se parle →</a>`;
document.body.append(mm);
const burger = nav.querySelector('.burger');
burger.onclick = () => { const o = mm.classList.toggle('open'); document.body.classList.toggle('menu-open', o); burger.setAttribute('aria-expanded', o); burger.textContent = o ? 'Fermer' : 'Menu'; };

/* grain + curseur + rideau */
document.body.insertAdjacentHTML('beforeend',`<div class="grain" aria-hidden="true"></div>
  <div class="cur" aria-hidden="true"><b>Voir</b></div>
  <div class="curtain" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><div class="lbl">${mbSig('white')}</div></div>`);

/* ── scroll fluide (Lenis) ── */
let lenis = null;
if (window.Lenis && !reduce){
  lenis = new Lenis({lerp:.09, smoothWheel:true});
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
window.lenis = lenis;
const scrollToHash = (hash, instant) => {
  const el = hash && document.querySelector(hash); if(!el) return false;
  if (lenis) lenis.scrollTo(el, {offset:-20, immediate:!!instant}); else el.scrollIntoView({behavior: instant?'auto':'smooth'});
  return true;
};
if (location.hash) addEventListener('load', ()=>setTimeout(()=>scrollToHash(location.hash, true), 80));

/* nav qui se cache à la descente */
let lastY = 0;
addEventListener('scroll', () => {
  const y = scrollY;
  nav.classList.toggle('hide', y > 300 && y > lastY && !mm.classList.contains('open'));
  lastY = y;
}, {passive:true});

/* ── curseur ── */
const cur = document.querySelector('.cur');
let cx=innerWidth/2, cy=innerHeight/2, tx=cx, ty=cy;
addEventListener('mousemove', e=>{ tx=e.clientX; ty=e.clientY; if(!cur.classList.contains('on')){ cx=tx; cy=ty; cur.classList.add('on'); } }, {passive:true});
(function loop(){ cx+=(tx-cx)*.22; cy+=(ty-cy)*.22; cur.style.transform=`translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
document.addEventListener('mouseover', e=>{
  const t = e.target.closest('[data-cursor]');
  cur.classList.toggle('big', !!t);
  if (t) cur.querySelector('b').textContent = t.dataset.cursor;
});

/* ── reveals ── */
const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target);} }), {threshold:.15, rootMargin:'0px 0px -5% 0px'});
/* un élément .clip est masqué par son propre clip-path : le navigateur le considère
   invisible et ne signale jamais son entrée à l'écran. On observe donc son parent. */
const clipIo = new IntersectionObserver(es=>es.forEach(e=>{ if(!e.isIntersecting) return;
  (e.target._clips||[]).forEach(c=>c.classList.add('in-view')); clipIo.unobserve(e.target); }), {threshold:.1, rootMargin:'0px 0px -5% 0px'});
window.observeReveals = root => {
  (root||document).querySelectorAll('.fade,.reveal,.line-mask,.foot').forEach(el=>io.observe(el));
  (root||document).querySelectorAll('.clip:not(.in-view)').forEach(el=>{ const p=el.parentElement; (p._clips=p._clips||[]).includes(el)||p._clips.push(el); clipIo.observe(p); });
};

/* ── transitions de page ── */
const curtain = document.querySelector('.curtain');
document.addEventListener('click', e=>{
  const a = e.target.closest('a');
  if (!a || a.target==='_blank' || e.metaKey || e.ctrlKey || e.shiftKey || a.hasAttribute('download')) return;
  const href = a.getAttribute('href');
  if (!href || /^(mailto|tel|https?):/.test(href)) return;
  const url = new URL(href, location.href);
  if (url.origin !== location.origin) return;
  // ancre sur la page courante : défilement fluide, pas de rideau
  if (url.pathname.replace(/index\.html$/,'') === location.pathname.replace(/index\.html$/,'') && url.hash){
    e.preventDefault(); mm.classList.remove('open'); document.body.classList.remove('menu-open'); burger.textContent='Menu';
    if (scrollToHash(url.hash)) history.replaceState(null,'',url.hash);
    return;
  }
  if (reduce) return;
  e.preventDefault();
  const sig = curtain.querySelector('.sig');
  curtain.classList.remove('out','arrive'); sig.classList.remove('play'); void curtain.offsetWidth;
  curtain.classList.add('in'); sig.classList.add('play');
  setTimeout(()=>location.href=url.href, 1100);   // l'étoile révèle le logotype puis s'efface dans sa découpe
});
// arrivée : le rideau se lève (setTimeout, pas rAF : continue même en arrière-plan)
if (sessionStorage.getItem('mb-nav') && !reduce){
  curtain.classList.add('in','arrive');
  curtain.querySelectorAll('i').forEach(i=>i.style.transition='none');
  document.documentElement.classList.remove('mb-arrive');   // le rideau a pris le relais du jaune posé dès le chargement
  setTimeout(()=>{
    void curtain.offsetWidth;
    curtain.querySelectorAll('i').forEach(i=>i.style.transition='');
    curtain.classList.add('out'); curtain.classList.remove('in');
    setTimeout(()=>curtain.classList.remove('arrive'), 1200);
  }, 380);   // la signature reste un instant avant que le rideau se lève
}
if (!sessionStorage.getItem('mb-nav') || reduce) document.documentElement.classList.remove('mb-arrive');
addEventListener('pagehide', ()=>sessionStorage.setItem('mb-nav','1'));
addEventListener('pageshow', e=>{ if(e.persisted){ curtain.classList.remove('in','arrive'); curtain.classList.add('out'); }});

/* ── pied de page partagé ── */
window.renderFooter = (target) => {
  const f = document.createElement('footer');
  f.className = 'foot';
  f.id = 'contact';
  f.innerHTML = `
    <div class="ask">
      <div>
        <div class="eyebrow" style="margin-bottom:22px">Allora ?</div>
        <p>Envoyez un packshot, un brief, ou même une idée… On vous le fait porter, on construit votre book, votre univers, votre campagne…</p>
      </div>
      <div class="btns">
        <a class="btn solid" href="mailto:hello@moltobene.ai?subject=Audit%20gratuit%20Molto%20Bene">Audit gratuit →</a>
        <a class="btn" href="https://meet.moltobene.ai" target="_blank" rel="noopener">On se parle →</a>
      </div>
    </div>
    <div class="giant-mask" aria-hidden="true"><div class="giant wide">${'ALLORA'.split('').map(c=>`<span>${c}</span>`).join('')}<span class="serif mustard" style="font-size:.5em;align-self:flex-start">?</span></div></div>
    <div class="meta mono">
      <span><span class="mb-star" style="width:34px;height:11px;display:block;margin-bottom:10px"></span>Molto Bene Studio<br><span class="muted">Studio IA × Direction artistique</span></span>
      <span>Marseille, FR<br><span class="muted">Based in Marseille</span></span>
      <span><a href="mailto:hello@moltobene.ai">hello@moltobene.ai</a><br><a class="muted" href="tel:+33661685841">+33 6 61 68 58 41</a></span>
      <span><a href="https://www.linkedin.com/company/moltobenestudio" target="_blank" rel="noopener noreferrer">LinkedIn</a> · <a href="https://www.instagram.com/studiomoltobene" target="_blank" rel="noopener noreferrer">Instagram</a><br><span class="muted">© 2026 · Visuels IA signés (AI Act, art. 50)</span></span>
    </div>`;
  (target||document.body).append(f);
  io.observe(f);
};

/* très grands titres [data-fit] : la taille CSS est un plafond ; si le mot dépasse
   la largeur disponible, on réduit juste ce qu'il faut pour qu'il tienne en entier */
const fitAll = () => document.querySelectorAll('[data-fit]').forEach(el => {
  el.style.fontSize = '';
  const max = parseFloat(getComputedStyle(el).fontSize);
  // largeur réelle des lettres : on mesure les nœuds texte, pas les blocs qui les contiennent
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, L = Infinity, R = -Infinity;
  while ((n = tw.nextNode())) { if (!n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n);
    for (const b of r.getClientRects()) { L = Math.min(L, b.left); R = Math.max(R, b.right); } }
  const box = el.getBoundingClientRect(), cs = getComputedStyle(el);
  const w = R - Math.min(L, box.left + parseFloat(cs.paddingLeft)), avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  if (w > avail) el.style.fontSize = Math.floor(max * avail / w * 0.985) + 'px';
});
window.fitAll = fitAll;
fitAll();
(document.fonts ? document.fonts.ready : Promise.resolve()).then(fitAll);
addEventListener('resize', fitAll);

/* split util : mots → spans */
window.splitWords = el => {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(w=>`<span class="w">${w}</span>`).join(' ');
  return el.querySelectorAll('.w');
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ()=>observeReveals());
else observeReveals();
})();
