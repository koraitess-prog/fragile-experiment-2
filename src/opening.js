export const OPENING_FACT={
 total:49505,
 date:'9 July 2026',
 source:'https://iucn.org/press-release/202607/desert-frog-deep-sea-molluscs-remarkable-species-risk-iucn-red-list',
 lines:['Species are threatened with extinction.','FRAGILE reveals just 10 of them.'],
};
export const COUNT_MS=2600,TYPE_START_MS=2900,CHAR_MS=28;
const sessionKey='fragile-experiment-2-opening-v1';

export function openingFrame(milliseconds,reduced=false){
 const t=Math.max(0,Math.min(1,milliseconds/COUNT_MS));
 const count=reduced?OPENING_FACT.total:Math.round(OPENING_FACT.total*(1-(1-t)**3));
 let characters=reduced?Infinity:Math.max(0,Math.floor((milliseconds-TYPE_START_MS)/CHAR_MS));
 const lines=OPENING_FACT.lines.map(line=>{const text=line.slice(0,characters);characters=Math.max(0,characters-line.length);return text;});
 return {count,lines,complete:lines.every((line,i)=>line===OPENING_FACT.lines[i])};
}

export function createOpening(root,{force=false,skip=false}={}){
 let seen=false;try{seen=sessionStorage.getItem(sessionKey)==='seen';}catch{}
 if(skip||seen&&!force){root.hidden=true;return {setReady(){}};}
 const number=root.querySelector('[data-opening-count]'),copy=[...root.querySelectorAll('[data-opening-line]')];
 const enter=root.querySelector('[data-opening-enter]'),skipButton=root.querySelector('[data-opening-skip]');
 const app=[...document.querySelectorAll('body > header,body > main,body > footer,body > #announcer')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let ready=false,complete=false,closed=false,raf=0,last=null,elapsed=0,exitTimer;
 root.hidden=false;document.body.dataset.opening='true';app.forEach(el=>el.inert=true);
 function updateAction(){enter.disabled=!complete||!ready;enter.textContent=complete&&!ready?'ASSEMBLING LIFE…':'ENTER FRAGILE';root.dataset.typed=String(complete);}
 function paint(elapsed){const frame=openingFrame(elapsed,reduced);number.textContent=frame.count.toLocaleString('en-US');copy.forEach((el,i)=>el.textContent=frame.lines[i]);complete=frame.complete;updateAction();}
 function tick(now){if(closed)return;if(document.hidden){last=null;raf=requestAnimationFrame(tick);return;}if(last!==null)elapsed+=now-last;last=now;paint(elapsed);if(!complete)raf=requestAnimationFrame(tick);}
 function close(){if(closed)return;closed=true;cancelAnimationFrame(raf);try{sessionStorage.setItem(sessionKey,'seen');}catch{}
  root.classList.add('is-leaving');delete document.body.dataset.opening;app.forEach(el=>el.inert=false);
  exitTimer=setTimeout(()=>{root.hidden=true;document.querySelector('#sculpture')?.focus({preventScroll:true});},reduced?0:550);
 }
 enter.addEventListener('click',close);skipButton.addEventListener('click',close);
 paint(0);raf=requestAnimationFrame(tick);
 addEventListener('pagehide',event=>{if(!event.persisted){closed=true;cancelAnimationFrame(raf);clearTimeout(exitTimer);}});
 return {setReady(){ready=true;updateAction();}};
}
