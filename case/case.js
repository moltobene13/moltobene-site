/* ══ MOLTO BENE — CASE DETAIL PAGE JS ══
   Lazy-load des vidéos + lightbox + reveal scroll. */

/* Reveal sections on scroll */
const io=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});},{threshold:.06});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

/* Lazy-load videos via IntersectionObserver */
const vidObs=new IntersectionObserver((entries,obs)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const v=e.target;
      const src=v.getAttribute('data-src');
      if(src && !v.src){
        v.src=src;
        v.load();
        v.play().catch(()=>{});
        v.removeAttribute('data-src');
      }
      obs.unobserve(v);
    }
  });
},{rootMargin:'200px'});
document.querySelectorAll('video[data-src]').forEach(v=>vidObs.observe(v));

/* ══ LIGHTBOX — identique à l'index ══ */
const lb=document.getElementById('lightbox');
const lbImg=document.getElementById('lb-img');
const lbVid=document.getElementById('lb-vid');
let lbIdx=-1;

function lbAllElements(){
  return Array.from(document.querySelectorAll('[data-lightbox="true"]'));
}

function showLB(idx){
  const list=lbAllElements();
  if(!list.length)return;
  const total=list.length;
  lbIdx=((idx%total)+total)%total;
  const el=list[lbIdx];
  const src=el.currentSrc||el.src||el.getAttribute('data-src');
  if(!src)return;
  const isVideo=el.tagName==='VIDEO';
  if(isVideo){
    lbImg.style.display='none';
    lbVid.style.display='block';
    lbVid.src=src;
    lbVid.load();
  }else{
    lbVid.pause();lbVid.src='';
    lbVid.style.display='none';
    lbImg.style.display='block';
    lbImg.src=src;
  }
  lb.classList.add('open');
  document.body.style.overflow='hidden';
}

function closeLB(){
  lb.classList.remove('open');
  lbImg.src='';
  lbVid.pause();lbVid.src='';
  lbImg.style.display='block';
  lbVid.style.display='none';
  document.body.style.overflow='';
  lbIdx=-1;
}

document.addEventListener('click',e=>{
  if(e.target.dataset.lightbox==='true'&&(e.target.tagName==='IMG'||e.target.tagName==='VIDEO')){
    e.preventDefault();e.stopPropagation();
    const list=lbAllElements();
    const idx=list.indexOf(e.target);
    showLB(idx>=0?idx:0);
  }
});

lb.addEventListener('click',e=>{
  if(e.target.tagName==='VIDEO')return;
  if(e.target.closest('.lb-nav,.lb-close'))return;
  closeLB();
});

document.getElementById('lb-close').addEventListener('click',e=>{e.stopPropagation();closeLB();});
document.getElementById('lb-prev').addEventListener('click',e=>{e.stopPropagation();showLB(lbIdx-1);});
document.getElementById('lb-next').addEventListener('click',e=>{e.stopPropagation();showLB(lbIdx+1);});

document.addEventListener('keydown',e=>{
  if(!lb.classList.contains('open'))return;
  if(e.key==='Escape')closeLB();
  else if(e.key==='ArrowLeft')showLB(lbIdx-1);
  else if(e.key==='ArrowRight')showLB(lbIdx+1);
});

let lbTouchX=0,lbTouchY=0,lbSwiped=false;
lb.addEventListener('touchstart',e=>{
  lbTouchX=e.touches[0].clientX;
  lbTouchY=e.touches[0].clientY;
  lbSwiped=false;
},{passive:true});
lb.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-lbTouchX;
  const dy=e.changedTouches[0].clientY-lbTouchY;
  if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)){
    lbSwiped=true;
    e.preventDefault();
    showLB(lbIdx+(dx<0?1:-1));
  }
},{passive:false});
lb.addEventListener('click',e=>{
  if(lbSwiped){lbSwiped=false;e.stopPropagation();}
},true);
