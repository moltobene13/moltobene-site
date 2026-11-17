/* MOLTO BENE — interactions des pages projet et modèle :
   lightbox, planche-contact à glisser, films au format d'origine. */
(function(){
const $ = s => document.querySelector(s);
const lb = $('#lb'); if (!lb) return;
const all = [...document.querySelectorAll('[data-lb]')].map(el => el.getAttribute('data-lb'));
const uniq = [...new Set(all)];
const label = lb.dataset.name || '';
let cur = 0, opener = null;

function openLb(j){
  cur = (j + uniq.length) % uniq.length;
  $('#lbs').innerHTML = `<img src="${uniq[cur]}" alt="${label}, visuel ${cur+1} sur ${uniq.length}">`;
  $('#lbn').textContent = `${String(cur+1).padStart(2,'0')} / ${String(uniq.length).padStart(2,'0')} · ${label}`;
  if (!lb.classList.contains('on')) { opener = document.activeElement; lb.classList.add('on'); lb.setAttribute('aria-hidden','false'); window.lenis && lenis.stop(); $('#lbx').focus(); }
  $('#lbs img').animate([{opacity:0,transform:'scale(.97)'},{opacity:1,transform:'none'}],{duration:450,easing:'cubic-bezier(.16,1,.3,1)'});
}
function closeLb(){ lb.classList.remove('on'); lb.setAttribute('aria-hidden','true'); window.lenis && lenis.start(); opener && opener.focus && opener.focus(); }
$('#lbx').onclick = closeLb; $('#lbp').onclick = () => openLb(cur-1); $('#lbnx').onclick = () => openLb(cur+1);
addEventListener('keydown', e => { if (!lb.classList.contains('on')) return;
  if (e.key==='Escape') closeLb(); if (e.key==='ArrowRight') openLb(cur+1); if (e.key==='ArrowLeft') openLb(cur-1); });

/* clic sur un visuel de la planche ou du book */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-lb]'); if (!t || t.closest('.strip')) return;
  e.preventDefault(); openLb(uniq.indexOf(t.getAttribute('data-lb')));
});

/* planche-contact : glisser pour défiler, cliquer pour agrandir */
const s = $('#strip');
if (s){
  let down=false, sx=0, sl=0, moved=0;
  s.addEventListener('mousedown', e => { down=true; moved=0; sx=e.pageX; sl=s.scrollLeft; s.classList.add('drag'); });
  addEventListener('mouseup', () => { down=false; s.classList.remove('drag'); });
  s.addEventListener('mousemove', e => { if(!down) return; moved=Math.abs(e.pageX-sx); s.scrollLeft = sl-(e.pageX-sx); });
  s.addEventListener('click', e => { const f=e.target.closest('[data-lb]'); if (f && moved<5) openLb(uniq.indexOf(f.getAttribute('data-lb'))); });
}

/* films : jamais plus hauts que l'écran, format d'origine conservé */
document.querySelectorAll('.ed video').forEach(v => {
  const fit = () => { if(!v.videoWidth) return; const f=v.closest('figure'); f.style.maxWidth=`calc(86vh * ${v.videoWidth/v.videoHeight})`; };
  v.readyState > 0 ? fit() : v.addEventListener('loadedmetadata', fit, {once:true});
});
/* films : lecture seulement à l'écran */
const vio = new IntersectionObserver(es => es.forEach(e => { const v=e.target; if (e.isIntersecting){ v.play().catch(()=>{}); } else v.pause(); }), {threshold:.2});
document.querySelectorAll('video[data-autoplay]').forEach(v => vio.observe(v));
})();
