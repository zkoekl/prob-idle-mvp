const {JSDOM}=require('jsdom');const fs=require('fs');
const h=fs.readFileSync('index.html','utf8').replace(/<script src=.*<\/script>/g,'');
const d=new JSDOM(h,{runScripts:'outside-only',url:'http://x/'});const W=d.window;const errs=[];
W.addEventListener('error',e=>errs.push(e.message));W.confirm=()=>true;W.localStorage.setItem('probIdleMvp1','{"x":1}');
let T=Date.now();W.Date.now=()=>T; // controllable clock
for(const f of['art.js','help.js','logic.js','app.js'])W.eval(fs.readFileSync(f,'utf8').replace('})(this);','})(window);').replace('const ART=','window.ART=').replace('const HELP=','window.HELP=').replace('const TIPS=','window.TIPS=')+(f==='app.js'?';window.__S=()=>S;window.__tick=tick;window.__R=render;':''));
const D=W.document,c=sel=>{const b=D.querySelector(sel);if(b&&!b.disabled)b.click();return b;},vis=id=>!D.getElementById(id).hidden;
const firstView=['shopCard','chipCard','locCard','montyCard','guidesCard'].filter(vis);if(firstView.length)throw 'too much at start: '+firstView;
const log=[];
for(let i=0;i<900;i++){c('#mok');c('#mok');c('#mok');
 if(vis('montyCard')){c('[data-door="0"]');c('[data-door="1"]');c('[data-door="2"]');c('#mclose');}
 if(D.getElementById('cont'))(S=>S.run.stage<5?c('#cont'):c('#ret'))(W.__S());
 c('#go');T+=6000;W.__tick();W.__tick();
 if(i%3==0){c('#autoeq');c('#disAll');c('[data-buy="hp"]');c('[data-buy="dmg"]');c('[data-buy="maxE"]');c('[data-p="0"]');}
 const u=Object.keys(W.__S().unl).join();if(log[log.length-1]!==u)log.push(u);}
console.log('unlock progression:',log.slice(-1)[0],'runs',W.__S().runs,'monty',W.__S().monty.plays);
c('#evalb');if(W.__S().unl.eval&&!D.querySelector('.hist'))throw 'no eval';
c('.tip');c('#mok');c('[data-guess="0"][data-gt="honest"]');c('#reset');
if(errs.length)throw errs;console.log('SMOKE OK');W.close();
