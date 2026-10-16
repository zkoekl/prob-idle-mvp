const {JSDOM}=require('jsdom');const fs=require('fs');
const h=fs.readFileSync('index.html','utf8').replace(/<script src=.*<\/script>/,'');
const d=new JSDOM(h,{runScripts:'outside-only',url:'http://x/'});const W=d.window;const errs=[];
W.addEventListener('error',e=>errs.push(e.message));W.confirm=()=>true;W.localStorage.setItem('probIdleMvp1','{"x":1}');
for(const f of['art.js','logic.js','app.js'])W.eval(fs.readFileSync(f,'utf8').replace('})(this);','})(window);').replace('const ART=','window.ART=').replace(/^const G/,'')+(f==='app.js'?';window.__S=()=>S;':''));
const D=W.document,c=sel=>{const b=D.querySelector(sel);if(b&&!b.disabled)b.click();return b;};
c('[data-pre="1"]');c('#evalb');if(!D.querySelector('.hist'))throw 'no eval';
for(let i=0;i<40;i++){if(c('#go')&&!D.getElementById('runCard').hidden){c('#cont');c('#ret')}else{W.__S().energy=50;} }
console.log('runs',W.__S().runs,'inv',W.__S().inv.length,'gold',W.__S().gold);c('#autoeq');c('[data-buy="hp"]');c('#disAll');c('[data-loc="1"]');c('#reset');
if(errs.length)throw errs;console.log('SMOKE OK',D.getElementById('stats').textContent.replace(/\s+/g,' '));W.close();
