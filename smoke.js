const {JSDOM}=require('jsdom');const fs=require('fs');
const h=fs.readFileSync('index.html','utf8').replace(/<script src=.*<\/script>/,'');
const d=new JSDOM(h,{runScripts:'outside-only',url:'http://x/'});const W=d.window;const errs=[];
W.addEventListener('error',e=>errs.push(e.message));W.confirm=()=>true;W.localStorage.setItem('probIdleMvp1','{"x":1}');
for(const f of['art.js','help.js','logic.js','app.js'])W.eval(fs.readFileSync(f,'utf8').replace('})(this);','})(window);').replace('const ART=','window.ART=').replace('const HELP=','window.HELP=').replace('const TIPS=','window.TIPS=').replace(/^const G/,'')+(f==='app.js'?';window.__S=()=>S;window.__R=render;':''));
const D=W.document,c=sel=>{const b=D.querySelector(sel);if(b&&!b.disabled)b.click();return b;};
const loop=k=>{for(let i=0;i<k;i++){c('#mok');c('#mok');if(!D.getElementById('montyCard').hidden){c('[data-door="0"]');c('[data-door="1"]');c('[data-door="2"]');c('#mclose');}
 if(c('#go')&&!D.getElementById('runCard').hidden){c('#cont');c('#ret')}else{W.__S().energy=50;W.__R();}c('[data-buy="dmg"]');}};
loop(50);Object.assign(W.__S().unl,{locs:1,eval:1,pity:1,monty:1});W.__S().monty.plays=7;loop(40);console.log('pend',JSON.stringify(W.__S().monty.pending),W.__S().monty.since,W.__S().runs);console.log('unl',Object.keys(W.__S().unl).join(),'monty',W.__S().monty.plays);c('[data-pre="1"]');c('#evalb');if(!D.querySelector('.hist'))throw 'no eval';
c('[data-guess="0"][data-gt="honest"]');c('.tip');c('#mok');
for(let i=0;i<40;i++){if(c('#go')&&!D.getElementById('runCard').hidden){c('#cont');c('#ret')}else{W.__S().energy=50;W.__R();} }
console.log('runs',W.__S().runs,'inv',W.__S().inv.length,'gold',W.__S().gold);c('#autoeq');c('[data-buy="hp"]');c('#disAll');c('[data-loc="1"]');c('#reset');
if(errs.length)throw errs;console.log('SMOKE OK',D.getElementById('stats').textContent.replace(/\s+/g,' '));W.close();
