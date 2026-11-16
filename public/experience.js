/* No build tools, external animation libraries or 3D downloads required. */
(() => {
'use strict';
const lang = document.documentElement.lang || 'sr';
const messages = {
 sr:{send:'Pošalji upit',sending:'Slanje…',success:'Hvala! Vaš upit je poslat — javljamo se u roku od 24h.',error:'Upit nije poslat. Pokušajte ponovo ili pišite na kompaktweb@gmail.com.',pause:'Pauziraj animacije',resume:'Pokreni animacije'},
 en:{send:'Send enquiry',sending:'Sending…',success:'Thank you! Your enquiry was sent. We will reply within 24 hours.',error:'Your enquiry could not be sent. Try again or email kompaktweb@gmail.com.',pause:'Pause animations',resume:'Resume animations'},
 ru:{send:'Отправить запрос',sending:'Отправка…',success:'Спасибо! Ваш запрос отправлен. Мы ответим в течение 24 часов.',error:'Не удалось отправить запрос. Попробуйте ещё раз или напишите на kompaktweb@gmail.com.',pause:'Приостановить анимацию',resume:'Включить анимацию'}
}[lang];
// Language is represented by actual translated static pages, so SEO and no-JS work.
const languageLinks=document.querySelectorAll('a[data-language]');
function updateLanguageLinks(){languageLinks.forEach(link=>{link.href=link.dataset.localeHref+location.hash;});}
updateLanguageLinks();window.addEventListener('hashchange',updateLanguageLinks);
const burger=document.querySelector('#burger'),links=document.querySelector('.nav-links'),navItem=document.querySelector('.nav-item'),dd=document.querySelector('.dropdown-trigger');
function close(){ links?.classList.remove('mobile-open');burger?.setAttribute('aria-expanded','false');navItem?.classList.remove('open');dd?.setAttribute('aria-expanded','false'); }
burger?.addEventListener('click',()=>{const open=burger.getAttribute('aria-expanded')!=='true';close();links?.classList.toggle('mobile-open',open);burger.setAttribute('aria-expanded',String(open));});
dd?.addEventListener('click',()=>{const open=!navItem.classList.contains('open');navItem.classList.toggle('open',open);dd.setAttribute('aria-expanded',String(open));});
document.addEventListener('click',e=>{if(!e.target.closest('header'))close();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();if(document.activeElement?.closest('header'))burger?.focus();}});
links?.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
window.matchMedia('(min-width:1101px)').addEventListener('change',close);
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const connection=navigator.connection || navigator.mozConnection || navigator.webkitConnection;
function constrainedDevice(){
 return (Number(navigator.hardwareConcurrency)>0&&navigator.hardwareConcurrency<=4)
  ||(Number(navigator.deviceMemory)>0&&navigator.deviceMemory<=4)
  ||Boolean(connection?.saveData)
  ||['slow-2g','2g'].includes(connection?.effectiveType);
}
let storedStatic=false;
try{storedStatic=sessionStorage.getItem('kompakt-static-mode')==='1';}catch{}
let performanceLimited=constrainedDevice()||storedStatic;
let userPaused=reduce.matches,paused=userPaused||performanceLimited,worldController=null;
let initScheduled=false,loaded=document.readyState==='complete';
const toggle=document.querySelector('.motion-toggle');
const staticLabels={sr:'Statičan prikaz radi boljih performansi',en:'Static view for better performance',ru:'Статичный режим для быстрой работы'};
function setMotion(){
 paused=userPaused||performanceLimited;
 document.documentElement.classList.toggle('motion-paused',paused);
 document.documentElement.classList.toggle('performance-static',performanceLimited);
 document.querySelectorAll('svg').forEach(svg=>{if(paused)svg.pauseAnimations?.();else svg.unpauseAnimations?.();});
 if(toggle){toggle.disabled=performanceLimited;toggle.textContent=performanceLimited?staticLabels[lang]:(paused?messages.resume:messages.pause);toggle.setAttribute('aria-pressed',String(paused));}
 worldController?.sync();
}
function lockStatic(reason){
 if(performanceLimited)return;
 performanceLimited=true;document.documentElement.dataset.motionFallback=reason;
 try{sessionStorage.setItem('kompakt-static-mode','1');}catch{}
 setMotion();worldController?.destroy();
}
setMotion();
toggle?.addEventListener('click',()=>{if(performanceLimited)return;userPaused=!userPaused;setMotion();startWhenIdle();});
reduce.addEventListener('change',()=>{userPaused=reduce.matches;setMotion();startWhenIdle();});
connection?.addEventListener?.('change',()=>{if(constrainedDevice())lockStatic('device-or-connection');});
document.documentElement.classList.add('scroll-reveals');
const reveals=document.querySelectorAll('.reveal');
if(!reduce.matches&&'IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:0,rootMargin:'0px 0px -32px 0px'});reveals.forEach(e=>io.observe(e));}else reveals.forEach(e=>e.classList.add('in'));
const progress=document.createElement('div');progress.className='scroll-progress';document.body.append(progress);
let scrollQueued=false;
function scrollUpdate(){const d=document.documentElement;progress.style.transform=`scaleX(${d.scrollHeight>d.clientHeight?d.scrollTop/(d.scrollHeight-d.clientHeight):0})`;document.querySelector('header')?.style.setProperty('border-bottom-color',scrollY>10?'#00d9a340':'#f2efe817');scrollQueued=false;}
window.addEventListener('scroll',()=>{if(!scrollQueued){requestAnimationFrame(scrollUpdate);scrollQueued=true;}},{passive:true});scrollUpdate();
// Animate once, on entering view. Keep the final value available to screen readers.
const counts=document.querySelectorAll('[data-count]');
const countFinals=new WeakMap();
counts.forEach(element=>{
 countFinals.set(element,element.textContent);
 if(!reduce.matches&&!userPaused&&'IntersectionObserver'in window){
  const decimals=Number(element.dataset.decimals||0);
  element.textContent=(element.dataset.prefix||'')+new Intl.NumberFormat(lang==='sr'?'sr-Latn-RS':lang==='ru'?'ru-RU':'en-GB',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(0)+(element.dataset.suffix||'');
 }
});
function countUp(element){
 const finalText=countFinals.get(element)||element.textContent;
 if(reduce.matches||userPaused){element.textContent=finalText;return;}
 const target=Number(element.dataset.count),decimals=Number(element.dataset.decimals||0);
 const format=new Intl.NumberFormat(lang==='sr'?'sr-Latn-RS':lang==='ru'?'ru-RU':'en-GB',{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
 const prefix=element.dataset.prefix||'',suffix=element.dataset.suffix||'';
 const display=value=>prefix+format.format(value)+suffix;
 element.textContent=display(0);
 let start=null,previous=0;
 function frame(t){
  if(reduce.matches||userPaused||document.hidden){element.textContent=finalText;return;}
  if(start===null)start=t;
  const progress=Math.min((t-start)/1400,1);
  // At most 30 updates per second; no ongoing work after reaching the target.
  if(t-previous>=32||progress===1){element.textContent=display(target*(1-Math.pow(1-progress,3)));previous=t;}
  if(progress<1)requestAnimationFrame(frame);else element.textContent=finalText;
 }
 requestAnimationFrame(frame);
}
if('IntersectionObserver'in window){
 const counter=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){counter.unobserve(entry.target);countUp(entry.target);}}),{threshold:.5});
 counts.forEach(element=>counter.observe(element));
}
document.querySelectorAll('[data-device]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('.demo-device').dataset.view=button.dataset.device;document.querySelectorAll('[data-device]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}));
document.querySelectorAll('[data-plan]').forEach(a=>a.addEventListener('click',()=>{const select=document.querySelector('#package');if(select)select.value=a.dataset.plan;}));

// One dismissible entry offer per tab session, across all language routes.
const urlParams=new URLSearchParams(window.location.search);
const dolaziSaReklame=urlParams.get('utm_campaign')==='kompaktweb_80eur';
const offerDialog=document.querySelector('#offerDialog');
if(offerDialog&&typeof offerDialog.showModal==='function'){
 const offerKey='kompakt-offer-80-v1';
 let seen=false,previousFocus=null,previousOverflow='';
 try{seen=sessionStorage.getItem(offerKey)==='1';}catch{}
 function dismissOffer(){offerDialog.close();}
 offerDialog.querySelector('[data-offer-close]')?.addEventListener('click',dismissOffer);
 offerDialog.querySelector('[data-offer-cta]')?.addEventListener('click',dismissOffer);
 offerDialog.addEventListener('click',e=>{
  const r=offerDialog.getBoundingClientRect();
  if(e.target===offerDialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dismissOffer();
 });
 offerDialog.addEventListener('close',()=>{
  offerDialog.classList.remove('visible');document.body.style.overflow=previousOverflow;
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
 });
 if(!seen&&!dolaziSaReklame)setTimeout(()=>{
  previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;
  offerDialog.showModal();document.body.style.overflow='hidden';
  offerDialog.querySelector('[data-offer-close]')?.focus({preventScroll:true});
  requestAnimationFrame(()=>offerDialog.classList.add('visible'));
  try{sessionStorage.setItem(offerKey,'1');}catch{}
 },800);
}

// Static SVG is the default. Only capable devices get a deferred 30 fps 3D layer.
// A rolling frame/cost budget permanently restores the SVG if animation is expensive.
function createWorld(){
 const canvas=document.querySelector('#world'),art=document.querySelector('.hero-art');
 if(!canvas||!art)return null;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 let width=0,height=0,angle=0,raf=0,visible=false,stopped=false;
 let lastFrame=0,lastDraw=0,windowStart=0,samples=0,slowFrames=0,expensiveDraws=0;
 const vertices=[],edges=[],rings=9,segments=18;
 for(let j=0;j<=rings;j++)for(let i=0;i<segments;i++){
  const a=j/rings*Math.PI,b=i/segments*Math.PI*2;
  vertices.push([Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)]);
  if(j<rings)edges.push([j*segments+i,(j+1)*segments+i]);
  if(j>0&&j<rings)edges.push([j*segments+i,j*segments+(i+1)%segments]);
 }
 const resetBudget=()=>{lastFrame=0;lastDraw=0;windowStart=0;samples=0;slowFrames=0;expensiveDraws=0;};
 function render(){
  ctx.clearRect(0,0,width,height);
  const size=Math.min(width*.48,height*.47),ca=Math.cos(angle),sa=Math.sin(angle),tilt=.35;
  const points=vertices.map(([x,y,z])=>{
   const xx=x*ca+z*sa,zz=z*ca-x*sa,yy=y*Math.cos(tilt)-zz*Math.sin(tilt),depth=y*Math.sin(tilt)+zz*Math.cos(tilt),p=3.5/(3.5-depth*.6);
   return[width/2+xx*size*p,height/2+yy*size*p,depth];
  });
  edges.forEach(([a,b])=>{const p=points[a],q=points[b],depth=(p[2]+q[2])/2;ctx.strokeStyle=`rgba(0,217,163,${.06+(depth+1)*.09})`;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();});
 }
 function tick(t){
  raf=0;if(stopped||paused||!visible||document.hidden)return;
  if(lastFrame){samples++;if(t-lastFrame>55)slowFrames++;}
  lastFrame=t;windowStart ||= t;
  if(t-windowStart>=1500){
   if(samples>=12&&slowFrames/samples>.4){lockStatic('sustained-slow-frames');return;}
   windowStart=t;samples=0;slowFrames=0;
  }
  if(!lastDraw||t-lastDraw>=32){
   const start=performance.now();angle+=Math.min(lastDraw?t-lastDraw:32,80)*.00008;render();lastDraw=t;
   expensiveDraws=performance.now()-start>8?expensiveDraws+1:0;
   if(expensiveDraws>=4){lockStatic('render-budget');return;}
  }
  raf=requestAnimationFrame(tick);
 }
 function sync(){
  cancelAnimationFrame(raf);raf=0;resetBudget();
  const active=!stopped&&!paused&&visible&&!document.hidden&&width>0;
  canvas.hidden=!active;art.classList.toggle('art-motion',active);
  if(active)raf=requestAnimationFrame(tick);
 }
 function resize(){
  if(stopped)return;
  const rect=art.getBoundingClientRect();width=rect.width;height=rect.height;
  // Cap both pixel density and backing-store size to keep decorative work bounded.
  const ratio=Math.min(window.devicePixelRatio||1,1.25,800/Math.max(width,height,1));
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);sync();
 }
 const resizeObserver='ResizeObserver'in window?new ResizeObserver(resize):null;
 resizeObserver?.observe(art);if(!resizeObserver)window.addEventListener('resize',resize,{passive:true});
 const observer='IntersectionObserver'in window?new IntersectionObserver(es=>{visible=es[0].isIntersecting;sync();},{threshold:.05}):null;
 observer?.observe(art);if(!observer){visible=true;}
 document.addEventListener('visibilitychange',sync);resize();
 return {sync,destroy(){stopped=true;cancelAnimationFrame(raf);canvas.hidden=true;art.classList.remove('art-motion');resizeObserver?.disconnect();observer?.disconnect();document.removeEventListener('visibilitychange',sync);window.removeEventListener('resize',resize);canvas.width=0;canvas.height=0;}};
}
function startWhenIdle(){
 if(!loaded||paused||performanceLimited||worldController||initScheduled||!document.querySelector('#world'))return;
 initScheduled=true;
 const initialise=()=>{initScheduled=false;if(paused||performanceLimited||worldController)return;try{worldController=createWorld();}catch{lockStatic('unsupported-renderer');}};
 if('requestIdleCallback'in window)window.requestIdleCallback(initialise);else setTimeout(initialise,500);
}
window.addEventListener('load',()=>{loaded=true;startWhenIdle();},{once:true});
startWhenIdle();

})();
