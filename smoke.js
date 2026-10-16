const {JSDOM}=require('jsdom');const fs=require('fs');
const h=fs.readFileSync('index.html','utf8').replace(/<script src=.*<\/script>/g,'');
const d=new JSDOM(h,{runScripts:'outside-only',url:'http://x/'});const W=d.window;const errs=[];
W.addEventListener('error',e=>errs.push(e.message));W.confirm=()=>true;W.scrollTo=()=>{};W.localStorage.setItem('probIdleMvp1','{"x":1}');
let T=Date.now();W.Date.now=()=>T; // controllable clock
for(const f of['art.js','help.js','logic.js','app.js'])W.eval(fs.readFileSync(f,'utf8').replace('})(this);','})(window);').replace('const ART=','window.ART=').replace('const HELP=','window.HELP=').replace('const TIPS=','window.TIPS=')+(f==='app.js'?';'+fs.readFileSync('debug.js','utf8')+';window.__S=()=>S;window.__tick=tick;window.__R=render;window.__off=()=>{offlineReport(G.offline(S));render();};window.__unl=()=>{unlocks();render();};':''));
const D=W.document,c=sel=>{const b=D.querySelector(sel);if(b&&!b.disabled)b.click();return b;},vis=id=>!D.getElementById(id).hidden;
const firstView=['shopCard','chipCard','locCard','montyCard','guidesCard'].filter(vis);if(firstView.length)throw 'too much at start: '+firstView;
const log=[];
for(let i=0;i<900;i++){c('#mok');c('#mok');c('#mok');if(vis('diveCard')){c('#dstart');c('[data-dpol=norm]');c('[data-dbuy=rope]');c('[data-dbuy=torch]');c('[data-dpol=bold]');c('[data-dpol=safe]');c('#dcash');}D.querySelectorAll('h2.coll')[1]&&i==5&&D.querySelectorAll('h2.coll')[1].click();if(vis('secCard')){c(i%3?'#secPass':'#secTake');}if(vis('shrineCard')){c('[data-shr="0.2"]');}if(vis('mimicCard')){c('#knock');c(i%2?'#mopen':'#mleave');}c('#autosell');c('[data-keep]');c('[data-up="weapon"]');
 if(vis('montyCard')){c('[data-door="0"]');c('[data-door="1"]');c('[data-door="2"]');c('#mclose');}
 if(D.querySelector('[data-node]'))(S=>S.run.stage<5?c('[data-node]'):c('#ret'))(W.__S());
 c('#heal');if(W.__S().hurtMs>0)W.__S().gold+=5000;c('#heal');c('#go');T+=6000;W.__tick();W.__tick();
 if(i%3==0){c('#autoeq');c('#disAll');c('[data-buy="hp"]');c('[data-buy="dmg"]');c('[data-buy="maxE"]');c('[data-p="0"]');}
 const u=Object.keys(W.__S().unl).join();if(log[log.length-1]!==u)log.push(u);}
W.__S().won=true;W.__S().kelly.tokens=3;['run','hero','shop','games'].forEach(t=>c(`#tabs [data-tab="${t}"]`));c('#menu');c('#kopt');c('#kbet');c('#snd');c('#summary');c('#mok');
W.__S().lastSeen=T-3*3600e3;W.__S().unl.offline=1;W.__off();c('#mok');unlocks:{W.__unl();c('#mok');c('#mok');}
W.__S().tab='stats';W.__R();c('[data-perk="luck"]');if(W.__S().rebirths!==1)throw 'rebirth '+W.__S().won+' '+W.__S().unl.rebirth+' '+W.__S().runs+' '+Object.keys(W.__S().unl).join();
console.log('unlock progression:',log.slice(-1)[0],'runs',W.__S().runs,'monty',W.__S().monty.plays);
c('#evalb');if(W.__S().unl.eval&&!D.querySelector('.hist'))throw 'no eval';
c('.tip');c('#mok');c('[data-guess="0"][data-gt="honest"]');D.querySelector('footer button:last-child').click();if(!W.__S().unl.rebirth||W.__S().gold<1e6)throw 'debug';c('#reset');
if(errs.length)throw errs;console.log('SMOKE OK');W.close();
