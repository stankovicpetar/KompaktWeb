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
let userPaused=reduce.matches,paused=userPaused||performanceLimited,worldController=null,buildSync=null;
let initScheduled=false,loaded=document.readyState==='complete';
const toggle=document.querySelector('.motion-toggle');
const staticLabels={sr:'Statičan prikaz radi boljih performansi',en:'Static view for better performance',ru:'Статичный режим для быстрой работы'};
function setMotion(){
 paused=userPaused||performanceLimited;
 document.documentElement.classList.toggle('motion-paused',paused);
 document.documentElement.classList.toggle('performance-static',performanceLimited);
 document.querySelectorAll('svg').forEach(svg=>{if(paused)svg.pauseAnimations?.();else svg.unpauseAnimations?.();});
 // The hero scene can still play in static mode, so the toggle always stays usable.
 if(toggle){toggle.disabled=false;toggle.textContent=userPaused?messages.resume:messages.pause;toggle.setAttribute('aria-pressed',String(userPaused));}
 worldController?.sync();
 buildSync?.();
}
function lockStatic(reason){
 if(performanceLimited)return;
 performanceLimited=true;document.documentElement.dataset.motionFallback=reason;
 try{sessionStorage.setItem('kompakt-static-mode','1');}catch{}
 setMotion();worldController?.destroy();
}
setMotion();
toggle?.addEventListener('click',()=>{userPaused=!userPaused;setMotion();startWhenIdle();});
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
  edges.forEach(([a,b])=>{const p=points[a],q=points[b],depth=(p[2]+q[2])/2;ctx.strokeStyle=`rgba(0,217,163,${.08+(depth+1)*.15})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();});
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
   const start=performance.now();angle+=Math.min(lastDraw?t-lastDraw:32,80)*.00022;render();lastDraw=t;
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

// Hero scene: the page builds itself, holds, fades out quietly and rebuilds.
// It only runs while visible and animated; otherwise the finished page shows.
const build=document.querySelector('[data-build]');
if(build){
 const cycle=9000,fade=420;let timer=0,running=false,inView=false;
 // Light CSS only: runs on low-power devices too, but not when paused, reduced, saving data or after a slow-frame fallback.
 const canRun=()=>inView&&!userPaused&&!reduce.matches&&!document.hidden&&!connection?.saveData&&!document.documentElement.dataset.motionFallback;
 function stop(){clearTimeout(timer);running=false;build.classList.remove('run','reset');}
 function play(){
  clearTimeout(timer);if(!canRun()){stop();return;}
  running=true;build.classList.remove('run','reset');void build.offsetWidth;build.classList.add('run');
  timer=setTimeout(()=>{if(!canRun()){stop();return;}build.classList.add('reset');timer=setTimeout(play,fade);},cycle-fade);
 }
 buildSync=()=>{if(canRun()){if(!running)play();}else if(running)stop();};
 if('IntersectionObserver'in window)new IntersectionObserver(e=>{inView=e[0].isIntersecting;buildSync();},{threshold:.25}).observe(build);
 else{inView=true;buildSync();}
 document.addEventListener('visibilitychange',buildSync);
}

// "Niste sigurni" callout: its only light follows the pointer wherever it is on
// the page while the box is in view, with a little lag so it glides. Real
// pointers only; off for reduced motion and when animations are paused.
const callout=document.querySelector('[data-page="index.html"] #projekti .wrap');
const finePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
if(callout){
 let px=null,py=null,x=null,y=null,raf=0,inView=false;
 const enabled=()=>inView&&finePointer.matches&&!reduce.matches&&!userPaused;
 const step=()=>{
  raf=0;if(!enabled()){callout.classList.remove('glow-on');return;}
  const box=getComputedStyle(callout,'::after'),r=callout.getBoundingClientRect();
  const left=r.left+(parseFloat(box.left)||0),w=r.width-(parseFloat(box.left)||0)-(parseFloat(box.right)||0);
  // Before the first pointer move, rest the light near the top right of the box.
  const tx=px===null?w*.82:px-left,ty=py===null?r.height*.15:py-r.top;
  if(x===null){x=tx;y=ty;}
  x+=(tx-x)*.12;y+=(ty-y)*.12;
  callout.style.setProperty('--mx',x.toFixed(1)+'px');callout.style.setProperty('--my',y.toFixed(1)+'px');
  callout.classList.add('glow-on');
  if(Math.abs(tx-x)+Math.abs(ty-y)>.3)raf=requestAnimationFrame(step);
 };
 const kick=()=>{if(!raf)raf=requestAnimationFrame(step);};
 window.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'&&e.pointerType!=='pen')return;px=e.clientX;py=e.clientY;if(inView)kick();},{passive:true});
 window.addEventListener('scroll',()=>{if(inView)kick();},{passive:true});
 if('IntersectionObserver'in window)new IntersectionObserver(e=>{inView=e[0].isIntersecting;kick();},{rootMargin:'200px 0px'}).observe(callout);
 else{inView=true;kick();}
 finePointer.addEventListener?.('change',kick);reduce.addEventListener('change',kick);toggle?.addEventListener('click',kick);
}

// 80 € offer: one entrance when the card comes into view (strike, price, sheen).
// Light CSS, so it also plays in static mode; skipped when paused or reduced.
const offerCard=document.querySelector('.launch-offer');
if(offerCard&&'IntersectionObserver'in window){
 const offerIo=new IntersectionObserver(entries=>{
  if(!entries[0].isIntersecting)return;offerIo.disconnect();
  if(!userPaused&&!reduce.matches)offerCard.classList.add('offer-play');
 },{threshold:.35});
 offerIo.observe(offerCard);
}

// Packages and offer: the border lights up where the pointer is (mouse only).
// --px/--py are registered in CSS, so the light glides between positions.
document.querySelectorAll('.plan,.launch-offer,.responsive-lab').forEach(card=>{
 card.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||reduce.matches)return;
  const r=card.getBoundingClientRect();
  card.style.setProperty('--px',(e.clientX-r.left).toFixed(0)+'px');card.style.setProperty('--py',(e.clientY-r.top).toFixed(0)+'px');
 },{passive:true});
});

// Responsive lab: on hover the demo device tilts gently toward the pointer.
// The transform is set on the device itself and eased each frame.
const lab=document.querySelector('.responsive-lab'),labDevice=lab?.querySelector('.demo-device');
if(lab&&labDevice){
 let tx=0,ty=0,x=0,y=0,raf=0;
 const step=()=>{
  x+=(tx-x)*.1;y+=(ty-y)*.1;
  labDevice.style.transform=Math.abs(x)+Math.abs(y)<.01&&!tx&&!ty?'':`rotateX(${y.toFixed(2)}deg) rotateY(${x.toFixed(2)}deg) translateZ(0)`;
  raf=Math.abs(tx-x)+Math.abs(ty-y)>.01?requestAnimationFrame(step):0;
 };
 lab.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||reduce.matches||userPaused)return;
  const r=lab.getBoundingClientRect();
  tx=((e.clientX-r.left)/r.width-.5)*14;ty=-((e.clientY-r.top)/r.height-.5)*10;
  if(!raf)raf=requestAnimationFrame(step);
 },{passive:true});
 lab.addEventListener('pointerleave',()=>{tx=0;ty=0;if(!raf)raf=requestAnimationFrame(step);});
}

// FAQ accordion: animate height on open and close; interruptible mid-way.
const faqEase='cubic-bezier(.23,1,.32,1)';
document.querySelectorAll('.faq-list details').forEach(details=>{
 const summary=details.querySelector('summary');if(!summary||!details.animate)return;
 let anim=null;
 const closedHeight=()=>{const cs=getComputedStyle(details);return summary.getBoundingClientRect().height+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom)+parseFloat(cs.borderTopWidth)+parseFloat(cs.borderBottomWidth);};
 const finish=()=>{anim=null;details.style.overflow='';details.classList.remove('closing');};
 summary.addEventListener('click',event=>{
  if(reduce.matches)return;
  event.preventDefault();
  const start=details.getBoundingClientRect().height;
  const closing=details.open&&!details.classList.contains('closing');
  anim?.cancel();details.style.overflow='hidden';
  if(closing){
   details.classList.add('closing');
   anim=details.animate({height:[start+'px',closedHeight()+'px']},{duration:240,easing:faqEase});
   anim.onfinish=()=>{details.open=false;finish();};
  }else{
   details.classList.remove('closing');details.open=true;
   const end=details.getBoundingClientRect().height;
   anim=details.animate({height:[start+'px',end+'px']},{duration:340,easing:faqEase});
   anim.onfinish=finish;
  }
 });
});

})();
