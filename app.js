const KEY='probIdleSave';const $=id=>document.getElementById(id);
let S=G.load(localStorage.getItem(KEY));let migrated=false;
if(!S){migrated=!!(localStorage.getItem(KEY)||localStorage.getItem('probIdleMvp1'));localStorage.removeItem('probIdleMvp1');S=G.newState();}
G.tickEnergy(S);
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const used=()=>S.alloc.reduce((a,b)=>a+b,0);const pct=x=>(x*100).toFixed(x<0.01&&x>0?2:1)+'%';
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':Math.round(n)+'';
const AFRU=Object.fromEntries(G.AFFIXES.map(a=>[a.k,a]));
function afText(it){return it.affixes.map(a=>`+${a.v}${AFRU[a.k].unit} ${AFRU[a.k].ru}`).join(' · ');}
function itemHtml(it,btns){const pw=it.slot==='charm'?'':` ${it.slot==='weapon'?'⚔️':'🛡️'}${G.itemPower(it)}${it.lvl?` (ур.${it.lvl})`:''}`;
 return `<div class="item ${it.rarity}">${ART.icon(it.slot,it.rarity)}<div class="txt"><span class="r-${it.rarity}">${it.name}</span> <small>${G.RAR_RU[it.rarity]}, я.${it.tier}, ${G.LOCS[it.loc].name}</small>${pw}<div class="af">${afText(it)||'без свойств'}</div></div><div class="btns">${btns||''}</div></div>`;}
function header(){G.tickEnergy(S);const me=G.maxEnergy(S);
 const left=S.energy>=me?'полна':Math.ceil(G.regenSec(S)-(Date.now()-S.energyT)/1000)+'с';
 $('stats').innerHTML=`<span>💰 ${fmt(S.gold)}</span><span>🔩 ${fmt(S.mats)}</span><span>💎 ${S.shards}/${G.SHARDS_FOR_PITY}</span>
 <span>⚡ ${S.energy}/${me} <span class="bar e"><i style="width:${S.energy/me*100}%"></i></span> <small>${left}</small></span>
 <span>Ур. ${S.lvl} <span class="bar"><i style="width:${S.lvl>=G.MAX_LVL?100:S.xp/G.xpNeed(S.lvl)*100}%"></i></span></span>`;}
function render(){header();const run=S.run;
 $('win').hidden=!S.won;
 const slot=(k,ru)=>{const it=S[k];if(!it)return `<div class="item"><div class="txt">${ru}: пусто</div></div>`;
  const c=G.upgradeCost(it);const can=it.slot!=='charm'&&it.lvl<10;
  return itemHtml(it,can?`<button class="small" data-up="${k}" ${S.gold>=c.gold&&S.mats>=c.mats?'':'disabled'}>⬆ ${fmt(c.gold)}💰 ${fmt(c.mats)}🔩</button>`:'');};
 $('hero').innerHTML=`<div class="herobox">${ART.hero()}<div><b>Ур. ${S.lvl}</b><br>⚔️ Урон ${G.heroDmg(S)}<br>❤️ HP ${G.heroHp(S)}<br>💪 Сила ${G.heroPower(S)}<br><small>Походов ${S.runs}, гибелей ${S.deaths}</small></div>
 <div class="slots">${slot('weapon','Оружие')}${slot('armor','Броня')}${slot('charm','Амулет')}</div></div>`+
 (S.shards>=G.SHARDS_FOR_PITY?`<div class="row"><button id="pity" class="big">💎 Создать легендарку (${G.SHARDS_FOR_PITY} осколков)</button></div>`:'');
 $('locs').innerHTML=G.LOCS.map((l,i)=>{const u=G.unlocked(S,i);const why=!S.cleared.includes(i-1)?'пройдите предыдущую':`сила ${l.req}`;
  return `<button class="loc ${S.loc===i?'sel':''}" data-loc="${i}" ${u&&!run?'':'disabled'}>${G.LOCS[i]&&ART.loc(i)}<span><b>${u?'':'🔒 '}${l.name}</b>${S.cleared.includes(i)?' ✅':''}<br><small>${l.stages} этапа · угроза ${l.threat}${u?'':' · '+why}</small></span></button>`}).join('');
 $('runCard').hidden=!run;$('planCard').hidden=!!run;
 if(run){const L=G.LOCS[run.loc];const dc=G.deathChance(S,run.loc,run.alloc,run.stage);
  $('run').innerHTML=`<b>${L.name}</b>: пройдено этапов ${run.stage}/${L.stages}<div class="stage">${Array.from({length:L.stages},(_,i)=>`<i class="${i<run.stage?'d':''}"></i>`).join('')}</div>
  <div>Несохранённая добыча: <b>${run.loot.length}</b> предм. на ${fmt(run.loot.reduce((a,b)=>a+b.value,0))}💰 — при гибели будет потеряна.</div>
  <div>Следующий этап: шанс гибели <b class="bad">${pct(dc)}</b>, ожидаемая добыча ≈ ${fmt(G.stageEV(S,run.loc,run.alloc,run.stage))}💰</div>
  <div class="row"><button id="cont" class="big">➡️ Этап ${run.stage+1}</button><button id="ret" class="ok" ${run.stage?'':'disabled'}>🏠 Вернуться и сохранить</button></div>
  ${run.loot.slice(-8).map(x=>itemHtml(x)).join('')}`;}
 else renderPlan();
 const inv=S.inv.slice().sort((a,b)=>b.tier-a.tier||G.score(b)-G.score(a));
 $('inv').innerHTML=inv.length?inv.map(it=>itemHtml(it,`<button class="small" data-eq="${it.id}">Надеть</button><button class="small" data-dis="${it.id}">Разобрать +${fmt(it.value)}💰</button>`)).join(''):'<div class="hint">Пусто</div>';
 const sh=[['chips','🎲','+1 фишка',`сейчас ${S.chips}`],['hp','❤️','+12 HP',`ур. ${S.hpUp}`],['dmg','⚔️','+3 урона',`ур. ${S.dmgUp}`],
  ['maxE','⚡','+10 макс. энергии',`${G.maxEnergy(S)}`],['regen','⏱️','Быстрее энергия',`${G.regenSec(S).toFixed(1)}с/ед.`],
  ['guide','G','Проводник: −3% риска',`ур. ${S.guideUp}`],['lens','🔍','Линза: +4% шанс ярусов 6–10',`ур. ${S.lensUp}`],['chest','C','+1 сундук за полный поход',`${S.chestUp}`]];
 $('shop').innerHTML=sh.map(([k,ic,n,cur])=>{const c=G.SHOP[k](S);const icon=ic==='G'?ART.guide():ic==='C'?ART.chest():`<span style="font-size:1.5rem">${ic}</span>`;
  return `<button data-buy="${k}" ${S.gold>=c?'':'disabled'}>${icon}<span>${n}<br><small>${cur} · ${c===Infinity?'макс.':fmt(c)+'💰'}</small></span></button>`}).join('');
 save();}
function renderPlan(){const n=G.totalChips(S);while(used()>n){const i=S.alloc.findIndex(x=>x>0);S.alloc[i]--;}
 $('chipinfo').textContent=`(${used()}/${n})`;
 $('presets').innerHTML='<small>Готовые:</small>'+G.strategies(n).map((st,i)=>`<button class="small" data-pre="${i}">${st.name}</button>`).join('');
 $('tiers').innerHTML=S.alloc.map((k,t)=>{const p=G.chance(S,S.loc,t),th=G.THRESH[t];
  return `<div class="tier"><b class="r-${G.RAR[t]}">Ярус ${t+1}${th>1?' ≥'+th:''}</b><div class="m">шанс ${pct(p)} · ценность ${fmt(G.value(S,S.loc,t))} · ожид. успехов ${(k*p).toFixed(2)} · P(≥${th}) ${pct(G.pAtLeast(k,th,p))}</div>
  <div class="ctl"><button data-m="${t}">−</button><span class="n">${k}</span><button data-p="${t}">+</button></div></div>`}).join('');
 const L=G.LOCS[S.loc],cost=G.foodCost(S.loc,S.alloc);
 const risks=Array.from({length:L.stages},(_,i)=>pct(G.deathChance(S,S.loc,S.alloc,i))).join(' → ');
 $('plansum').innerHTML=`<div class="hint">EV за 1-й этап: <b>${fmt(G.stageEV(S,S.loc,S.alloc,0))}💰</b> · риск по этапам: <span class="bad">${risks}</span> · стоимость: <b>⚡${cost}</b></div>`;
 $('go').disabled=!used()||S.energy<cost;$('go').textContent=S.energy<cost?`Нужно ⚡${cost}`:'⚔️ В поход';}
function showReport(h){$('reportCard').hidden=false;$('report').innerHTML=h;}
function runEval(){const n=G.totalChips(S);const rows=[{name:'Ваше',a:S.alloc.slice(),you:1},...G.strategies(n)];
 let h='<table><tr><th>Стратегия</th><th>Возврат</th><th>Среднее</th><th>P10</th><th>P50</th><th>P90</th><th>Гибель</th></tr>';let yours=null;
 for(const r of rows)for(const [stop,sn] of [[1,'до конца'],[0.1,'риск>10%']]){const m=G.monteCarlo(S,S.loc,r.a,stop,2000);if(r.you&&stop===1)yours=m;
  h+=`<tr class="${r.you?'you':''}"><td>${r.name}</td><td>${sn}</td><td>${fmt(m.mean)}</td><td>${fmt(m.p10)}</td><td>${fmt(m.p50)}</td><td>${fmt(m.p90)}</td><td>${pct(m.death)}</td></tr>`;}
 h+='</table>';const mx=Math.max(...yours.bins);
 h=`<div class="hint">Ваше распределение, «до конца»: распределение банка золота (0…${fmt(yours.max)})</div><div class="hist">${yours.bins.map((b,i)=>`<i class="${i?'':'z'}" style="height:${b/mx*100}%" title="${b}"></i>`).join('')}</div>`+h+
 '<div class="hint">Энергия не учтена; осколки и опыт не входят в золото. Красный столбец — ноль (гибель или пустой поход).</div>';
 $('eval').innerHTML=h;}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.loc!==undefined){S.loc=+d.loc;$('eval').innerHTML='';}
 else if(d.p!==undefined){if(used()<G.totalChips(S))S.alloc[+d.p]++;}
 else if(d.m!==undefined){if(S.alloc[+d.m]>0)S.alloc[+d.m]--;}
 else if(d.pre!==undefined){S.alloc=G.strategies(G.totalChips(S))[+d.pre].a;}
 else if(d.eq)G.equip(S,+d.eq);else if(d.dis)G.dismantle(S,+d.dis);
 else if(d.buy)G.buy(S,d.buy);else if(d.up)G.upgradeItem(S,d.up);
 else if(b.id==='pity'){const it=G.craftPity(S);if(it)showReport('<p>Создано:</p>'+itemHtml(it));}
 else if(b.id==='go'){const err=G.startRun(S);if(!err){stage();return;}}
 else if(b.id==='cont'){stage();return;}
 else if(b.id==='ret'){const r=G.bank(S);showReport(`<p class="good">🏠 Вернулись. Сохранено ${r.items.length} предм. на ${fmt(r.gold)}💰.</p>`);}
 else if(b.id==='clear')S.alloc.fill(0);
 else if(b.id==='evalb'){runEval();return;}
 else if(b.id==='autoeq')G.equipBest(S);
 else if(b.id==='disAll'){S.inv.filter(i=>!S[i.slot]||G.score(i)<=G.score(S[i.slot])).map(i=>i.id).forEach(id=>G.dismantle(S,id));}
 else if(b.id==='reset'){if(confirm('Сбросить весь прогресс?')){S=G.newState();$('reportCard').hidden=true;$('eval').innerHTML='';}}
 else return;render();});
function stage(){const lvl0=S.lvl;const r=G.rollStage(S);if(!r)return render();
 let h=`<p><b>Этап ${r.stage}</b>: `+r.tiers.map(x=>`<span class="r-${G.RAR[x.t]}">я${x.t+1}: ${x.k}/${x.n}${x.k&&!x.paid?' (порог!)':''}</span>`).join(', ')+'</p>';
 if(r.died)h+=`<p class="bad">☠️ Герой пал (риск ${pct(r.dc)}). Потеряно предметов: ${r.lost}. Осколки сохранены.</p>`;
 h+=r.drops.length?r.drops.map(x=>itemHtml(x)).join(''):'<p class="hint">Ничего на этом этапе.</p>';
 if(r.shards)h+=`<p>💎 +${r.shards} осколков</p>`;if(S.lvl>lvl0)h+=`<p class="good">⭐ Новый уровень: ${S.lvl}!</p>`;
 if(r.finished)h+=`<p class="good">✅ Локация пройдена полностью! Добыча сохранена (${fmt(r.bank.gold)}💰)${S.chestUp?', сундуки открыты':''}.</p>`;
 showReport(h);render();}
setInterval(()=>{const e=S.energy;header();if(S.energy!==e)render();},1000);
render();if(migrated)showReport('<p>Вышла новая версия игры — старое сохранение несовместимо, прогресс начат заново.</p>');
