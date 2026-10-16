// TEST-ONLY cheat button. Remove this file + its <script> tag to disable.
(function(){const f=document.querySelector('footer');if(!f)return;const b=document.createElement('button');
 b.className='danger small';b.style.marginLeft='8px';b.style.fontSize='.7rem';b.textContent='ТЕСТ: не нажимать, только для теста';
 b.onclick=()=>{if(!confirm('Тестовый режим: открыть всё и выдать ресурсы? Это изменит ваш прогресс.'))return;
  G.UNLOCKS.forEach(u=>S.unl[u.k]=1);G.initGuides(S);S.cleared=G.LOCS.map((_,i)=>i);S.won=true;S.summarySeen=1;S.slotsN=6;S.gsSeen=1;
  S.gold+=1e6;S.mats+=1e5;S.shards+=200;S.energy=G.maxEnergy(S)+500;S.scrolls+=20;S.kelly.tokens=10;S.chips=Math.max(S.chips,6);S.lvl=Math.max(S.lvl,20);S.hpUp=Math.max(S.hpUp,80);S.dmgUp=Math.max(S.dmgUp,80);
  for(let i=0;i<9;i++)S.inv.push(G.makeItem(S,5,i<6?4:3));const gs=G.GSETS[3];G.SLOTS.forEach(sl=>S.inv.push(G.makeSetItem(S,5,4,gs,sl)));G.SLOTS.forEach(sl=>S.inv.push(G.makeSetItem(S,5,4,G.GSETS[0],sl)));G.equipBest(S,'best');G.SLOTS.forEach(sl=>{const it=S.inv.find(i=>i.set==='monty'&&i.slot===sl);if(it)G.equip(S,it.id);});S.loc=5;MQ.length=0;render();};
 f.appendChild(b);})();
