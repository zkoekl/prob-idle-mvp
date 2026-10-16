const KEY='probIdleMvp1';let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!S)S=G.newState();
const $=id=>document.getElementById(id);const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const used=()=>S.alloc.reduce((a,b)=>a+b,0);const pct=x=>(x*100).toFixed(x<0.01?2:1)+'%';
function itemHtml(it,btns){return `<div class="item ${it.rarity}"><span class="r-${it.rarity}">${it.name} · ${G.RAR_RU[it.rarity]} (я.${it.tier}) ${it.slot==='weapon'?'⚔️':'🛡️'}${it.power}</span><span>${btns||''}</span></div>`;}
function render(){
 $('stats').innerHTML=`💰 ${S.gold} · 🔩 ${S.mats} · 💎 осколки ${S.shards}/${G.SHARDS_FOR_PITY} · ⚔️ ${G.heroDmg(S)} · ❤️ ${G.heroHp(S)} · походов ${S.runs}`;
 $('locs').innerHTML=G.LOCS.map(l=>{const u=G.unlocked(S,l.id);return `<button data-loc="${l.id}" class="${S.loc===l.id?'sel':''}" ${u?'':'disabled'}>${u?'':'🔒 '}${l.name}${u?'':' (сила '+l.req+')'}</button>`}).join('');
 $('risk').innerHTML=`<div class="hint">Сила героя: ${G.heroPower(S).toFixed(0)}. Шанс гибели: <b class="bad">${pct(G.deathChance(S,S.loc))}</b> (при гибели теряется половина добычи). Сложнее локация → выше шансы на верхних ярусах и ценнее лут.</div>`;
 $('chipinfo').textContent=`(${used()}/${S.chips})`;
 $('tiers').innerHTML=S.alloc.map((n,t)=>{const p=G.chance(S.loc,t),r=G.RAR[t];
  return `<div class="tier"><b class="r-${r}">Ярус ${t+1}</b><div class="m">шанс ${pct(p)} · ценность ${G.value(S.loc,t)} · ожид. успехов ${(n*p).toFixed(2)} · P(≥1) ${pct(G.pAtLeastOne(n,p))}</div>
  <div class="ctl"><button data-m="${t}">−</button><span class="n">${n}</span><button data-p="${t}">+</button></div></div>`}).join('')+
  `<div class="hint">EV золота: <b>${G.ev(S.loc,S.alloc).toFixed(1)}</b> · жадный оптимум: ${G.ev(S.loc,G.greedyAlloc(S.loc,S.chips)).toFixed(1)}</div>`;
 $('go').disabled=used()===0;
 $('hero').innerHTML=`Оружие: ${S.weapon?itemHtml(S.weapon):'—'} Броня: ${S.armor?itemHtml(S.armor):'—'}`+
  (S.shards>=G.SHARDS_FOR_PITY?`<button id="pity" class="big">💎 Создать легендарку</button>`:'');
 const inv=S.inv.slice().sort((a,b)=>b.tier-a.tier||b.power-a.power);
 $('inv').innerHTML=inv.length?inv.map(it=>itemHtml(it,`<button data-eq="${it.id}">Надеть</button> <button data-dis="${it.id}">Разобрать +${it.value}</button>`)).join(''):'<div class="hint">Пусто</div>';
 const sh=[['chips','+1 фишка'],['hp','+15 HP'],['dmg','+4 урон']];
 $('shop').innerHTML=sh.map(([k,n])=>{const c=G.SHOP[k](S);return `<button data-buy="${k}" ${S.gold>=c?'':'disabled'}>${n} — ${c===Infinity?'макс':c+'💰'}</button>`}).join('');
 save();}
document.addEventListener('click',e=>{const d=e.target.dataset;if(!d)return;
 if(d.loc!==undefined){S.loc=+d.loc;}
 else if(d.p!==undefined){if(used()<S.chips)S.alloc[+d.p]++;}
 else if(d.m!==undefined){if(S.alloc[+d.m]>0)S.alloc[+d.m]--;}
 else if(d.eq)G.equip(S,+d.eq);else if(d.dis)G.dismantle(S,+d.dis);
 else if(d.buy)G.buy(S,d.buy);
 else if(e.target.id==='pity'){const it=G.craftPity(S);if(it)showReport(`<p>Создано: </p>${itemHtml(it)}`);}
 else return;render();});
function showReport(h){$('reportCard').hidden=false;$('report').innerHTML=h;$('reportCard').scrollIntoView({behavior:'smooth',block:'nearest'});}
$('go').onclick=()=>{const r=G.runExpedition(S);
 let h=r.died?`<p class="bad">☠️ Герой пал (шанс был ${pct(r.dc)}). Потеряно предметов: ${r.lost.length}.</p>`:`<p class="good">Герой вернулся живым.</p>`;
 h+=r.drops.length?r.drops.map(x=>itemHtml(x)).join(''):'<p>Ничего не найдено.</p>';
 if(r.shardGain)h+=`<p>💎 +${r.shardGain} осколков (провалы на ярусе 10)</p>`;
 const g=r.greedy.findIndex(x=>x>0)+1;
 h+=`<p class="hint">Ваше распределение EV ${r.myEV.toFixed(1)} vs жадный оптимум EV ${r.gEV.toFixed(1)} (все фишки на ярус ${g}). Фактически: ${r.gold}💰 предметами.</p>`;
 showReport(h);render();};
$('clear').onclick=()=>{S.alloc.fill(0);render();};
$('opt').onclick=()=>{S.alloc=G.greedyAlloc(S.loc,S.chips);render();};
$('autoeq').onclick=()=>{G.equipBest(S);render();};
$('disAll').onclick=()=>{S.inv.map(i=>i.id).forEach(id=>G.dismantle(S,id));render();};
$('reset').onclick=()=>{if(confirm('Сбросить весь прогресс?')){S=G.newState();$('reportCard').hidden=true;render();}};
render();
