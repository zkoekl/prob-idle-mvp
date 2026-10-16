const KEY='probIdleSave';const $=id=>document.getElementById(id);
let S=G.load(localStorage.getItem(KEY));let migrated=false;
if(!S){migrated=!!(localStorage.getItem(KEY)||localStorage.getItem('probIdleMvp1'));localStorage.removeItem('probIdleMvp1');S=G.newState();}
G.tickEnergy(S);
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const pct=x=>(x*100).toFixed(x<0.01&&x>0?2:1)+'%';
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':Math.round(n)+'';
const AFRU=Object.fromEntries(G.AFFIXES.map(a=>[a.k,a]));
const usedChips=()=>S.alloc.reduce((a,b)=>a+b,0);
// --- popups
const MQ=[];function popup(k){const t=HELP[k];if(t)MQ.push(t);showModal();}
function showModal(){if(!$('modal').hidden||!MQ.length)return;const [ti,tx]=MQ.shift();$('mtext').innerHTML=`<h3>${ti}</h3><p>${tx}</p>`;$('modal').hidden=false;}
$('mok').onclick=()=>{$('modal').hidden=true;showModal();};
function unlocks(){G.checkUnlocks(S).forEach(popup);}
// --- pieces
function afText(it){return it.affixes.map(a=>`+${a.v}${AFRU[a.k].unit} ${AFRU[a.k].ru}`).join(' · ');}
function itemHtml(it,btns){const pw=it.slot==='charm'?'':` ${it.slot==='weapon'?'⚔️':'🛡️'}${G.itemPower(it)}${it.lvl?` (+${it.lvl})`:''}`;
 return `<div class="item ${it.rarity}">${ART.icon(it.slot,it.rarity)}<div class="txt"><span class="r-${it.rarity}">${it.name}</span> <small>${G.RAR_RU[it.rarity]}</small>${pw}<div class="af">${afText(it)||'без свойств'}</div></div><div class="btns">${btns||''}</div></div>`;}
function cmp(it){const c=S[it.slot];if(!c)return '<span class="delta good">слот пуст</span>';const d=Math.round(G.score(it)-G.score(c));
 return `<span class="delta ${d>0?'good':'bad'}" title="Сравнение с надетым">${d>0?'▲ лучше':'▼ хуже'} ${d>=0?'+':''}${d}</span>`;}
function chancesBar(c){return `<div class="chances" title="Шанс редкости каждого предмета">${c.map((p,r)=>`<i class="c-${G.RARS[r]}" style="width:${Math.max(p*100,1.5)}%">${p>0.07?pct(p):''}</i>`).join('')}</div>
 <div class="legend">${c.map((p,r)=>`<span class="r-${G.RARS[r]}">${G.RAR_RU[G.RARS[r]]} ${pct(p)}</span>`).join('')}</div>`;}
function header(){G.tickEnergy(S);const me=G.maxEnergy(S);const U=S.unl;
 const left=S.energy>=me?'полна':'+1 через '+Math.ceil(G.regenSec(S)-(Date.now()-S.energyT)/1000)+'с';
 $('stats').innerHTML=`<span>💰 ${fmt(S.gold)}</span>${U.shop?`<span title="Материалы: для улучшения снаряжения">🔩 ${fmt(S.mats)}</span>`:''}${U.pity?`<span title="Осколки: 40 = легендарка">💎 ${S.shards}/${G.SHARDS_FOR_PITY}</span>`:''}
 <span title="Энергия: тратится на поход, восстанавливается со временем">⚡ ${S.energy}/${me} <span class="bar e"><i style="width:${S.energy/me*100}%"></i></span> <small>${left}</small></span>
 <span title="Уровень героя">Ур. ${S.lvl} <span class="bar"><i style="width:${S.lvl>=G.MAX_LVL?100:S.xp/G.xpNeed(S.lvl)*100}%"></i></span></span>`;}
function renderRun(){const r=S.run;const L=G.LOCS[r?r.loc:S.loc];let h;
 if(!r){const cost=G.runCost(S,S.loc);const c=G.rarChances(S,S.loc);
  h=`<div class="runmain"><b>${L.name}</b> · ${G.rolls(S)} предмета за ${S.unl.stages?'этап':'поход'} · ⏱ ${(G.stageMs(S,S.loc)/1000).toFixed(1)}с<br>
  <button id="go" class="big" ${S.energy<cost?'disabled':''}>${S.energy<cost?`Нужно ⚡${cost}`:`⚔️ В поход (⚡${cost})`}</button></div>${chancesBar(c)}`;
  if(S.unl.stages){const a=S.unl.chips?S.alloc:[0,0,0];h+=`<div class="hint">Этапов: ${L.stages}. Риск гибели по этапам: <span class="bad">${Array.from({length:L.stages},(_,i)=>pct(G.deathChance(S,S.loc,a,i))).join(' → ')}</span></div>`;}}
 else if(!r.waiting){h=`<div class="runmain"><b>${L.name}</b> — ${S.unl.stages?`этап ${r.stage+1}/${L.stages}`:'герой в походе…'}</div><div class="prog"><i id="progbar" style="width:0%"></i></div><div class="hint" id="progtxt"></div>`;}
 else{const dc=G.deathChance(S,r.loc,r.alloc,r.stage);
  h=`<b>${L.name}</b>: пройдено ${r.stage}/${L.stages}<div class="stage">${Array.from({length:L.stages},(_,i)=>`<i class="${i<r.stage?'d':''}"></i>`).join('')}</div>
  <div>С собой: <b>${r.loot.length}</b> предм. (${fmt(r.loot.reduce((a,b)=>a+b.value,0))}💰) — пропадут при гибели.</div>
  <div>Следующий этап: риск гибели <b class="bad">${pct(dc)}</b>, ожидаемая добыча ≈ ${fmt(G.stageEV(S,r.loc,r.alloc,r.stage))}💰</div>
  ${chancesBar(G.rarChances(S,r.loc,r.stage))}
  <div class="row"><button id="cont" class="big">➡️ Дальше</button><button id="ret" class="ok">🏠 Домой с добычей</button></div>`;}
 $('run').innerHTML=h;tickProg();}
function tickProg(){const r=S.run;if(!r||r.waiting||!$('progbar'))return;const tot=G.stageMs(S,r.loc);const left=Math.max(0,r.endAt-Date.now());
 $('progbar').style.width=(100-left/tot*100)+'%';$('progtxt').textContent=`осталось ${(left/1000).toFixed(1)}с`;}
function renderChips(){const U=S.unl;$('chipCard').hidden=!U.chips;if(!U.chips)return;const n=S.chips;
 while(usedChips()>n){const i=S.alloc.findIndex(x=>x>0);S.alloc[i]--;}$('chipinfo').textContent=`(${usedChips()}/${n})`;
 const lock=!!S.run;
 $('chips').innerHTML=G.CHIP_T.map((t,i)=>{const p=G.chipChance(S,S.loc,i),k=S.alloc[i],th=G.thr(S,i);const rar=G.RARS[t.r];
  return `<div class="chip"><b class="r-${rar}">${t.ru}${th>1?` (≥${th})`:''}</b><div class="m">шанс ${pct(p)} за фишку · ожид. ${(k*p).toFixed(2)} · P(≥${th}) = ${pct(G.pAtLeast(k,th,p))}</div>
  <div class="ctl"><button data-m="${i}" ${lock?'disabled':''}>−</button><span class="n">${k}</span><button data-p="${i}" ${lock?'disabled':''}>+</button></div></div>`}).join('')+
  `<div class="hint">Каждая фишка — отдельный бросок за ${U.stages?'этап':'поход'}, сверх обычной добычи.${U.stages?' Риск: редкий +5%, эпик +15%, легендарный +30% к базовой опасности за фишку.':''}</div>`;
 $('evalBox').hidden=!U.eval;}
function runEval(){const rows=[{name:'Ваш расклад',a:S.alloc.slice(),you:1},...G.strategies(S.chips)];
 let h='<table><tr><th>Расклад</th><th>Возврат</th><th>Среднее</th><th>P10</th><th>P50</th><th>P90</th><th>Гибель</th></tr>';let y=null;
 const pol=S.unl.stages?[[1,'до конца'],[0.1,'риск>10%']]:[[1,'—']];
 for(const r of rows)for(const [st,sn] of pol){const m=G.monteCarlo(S,S.loc,r.a,st,2000);if(r.you&&!y)y=m;
  h+=`<tr class="${r.you?'you':''}"><td>${r.name}</td><td>${sn}</td><td>${fmt(m.mean)}</td><td>${fmt(m.p10)}</td><td>${fmt(m.p50)}</td><td>${fmt(m.p90)}</td><td>${pct(m.death)}</td></tr>`;}
 const mx=Math.max(...y.bins);
 $('eval').innerHTML=`<div class="hint">Ваш расклад: распределение золота за поход (0…${fmt(y.max)}), красный — ноль</div><div class="hist">${y.bins.map((b,i)=>`<i class="${i?'':'z'}" style="height:${b/mx*100}%"></i>`).join('')}</div>${h}</table>`;}
function render(){header();const U=S.unl;$('win').hidden=!S.won;
 const slot=(k,ru)=>{const it=S[k];if(!it)return `<div class="item"><div class="txt">${ru}: пусто</div></div>`;const c=G.upgradeCost(it);
  const can=U.shop&&it.slot!=='charm'&&it.lvl<10;return itemHtml(it,can?`<button class="small" data-up="${k}" ${S.gold>=c.gold&&S.mats>=c.mats?'':'disabled'} title="Улучшить снаряжение">⬆ ${fmt(c.gold)}💰 ${fmt(c.mats)}🔩</button>`:'');};
 $('hero').innerHTML=`<div class="herobox">${ART.hero()}<div><b>Герой, ур. ${S.lvl}</b><br>⚔️ ${G.heroDmg(S)} · ❤️ ${G.heroHp(S)}<br><span title="Сила = урон + HP/4; открывает локации">💪 Сила ${G.heroPower(S)}</span><br><small>Походов ${S.runs}${S.deaths?`, гибелей ${S.deaths}`:''}</small></div>
 <div class="slots">${slot('weapon','Оружие')}${slot('armor','Броня')}${slot('charm','Амулет')}</div></div>`+
 (U.pity&&S.shards>=G.SHARDS_FOR_PITY?`<div class="row"><button id="pity" class="big">💎 Создать легендарку</button></div>`:'');
 renderRun();renderChips();renderMonty();renderGuides();renderHowto();
 $('locCard').hidden=!U.locs;
 if(U.locs)$('locs').innerHTML=G.LOCS.map((l,i)=>{const u=G.unlocked(S,i);const why=!S.cleared.includes(i-1)?'пройдите предыдущую до конца':`нужна сила ${l.req}`;
  return `<button class="loc ${S.loc===i?'sel':''}" data-loc="${i}" ${u&&!S.run?'':'disabled'}>${ART.loc(i)}<span><b>${u?'':'🔒 '}${l.name}</b>${S.cleared.includes(i)?' ✅':''}<br><small>${l.stages} этапа · угроза ${l.threat}${u?'':' · '+why}</small></span></button>`}).join('');
 const inv=S.inv.slice().sort((a,b)=>b.r-a.r||G.score(b)-G.score(a));$('disAll').hidden=!U.shop;
 $('inv').innerHTML=(inv.length>40?`<div class="hint">Показаны 40 лучших из ${inv.length}.</div>`:'')+(inv.length?inv.slice(0,40).map(it=>itemHtml(it,cmp(it)+`<button class="small" data-eq="${it.id}">Надеть</button>${U.shop?`<button class="small" data-dis="${it.id}">Продать ${fmt(it.value)}💰</button>`:''}`)).join(''):'<div class="hint">Пусто — сходите в поход!</div>');
 $('shopCard').hidden=!U.shop;
 if(U.shop){const sh=[['hp','❤️','+12 HP',`ур. ${S.hpUp}`],['dmg','⚔️','+3 урона',`ур. ${S.dmgUp}`],['maxE','⚡','+10 макс. энергии',`${G.maxEnergy(S)}`],
  ['regen','⏱️','Быстрее энергия',`${G.regenSec(S).toFixed(1)}с за ед.`],['boots','👢','Сапоги: походы быстрее',`ур. ${S.bootsUp}`],['bag','🎒','Сумка: +1 предмет за этап',`${G.rolls(S)} предм.`],
  ['chips','🎲','+1 фишка удачи',`${S.chips}`],['guide','G','Проводник: −3% риска',`ур. ${S.guideUp}`],['lens','🔍','Линза: +5% к редким',`ур. ${S.lensUp}`],['doors','C','+1 сундук у проводника',`${G.doors(S)}`]];
  $('shop').innerHTML=sh.filter(x=>G.shopAvail(S,x[0])).map(([k,ic,n,cur])=>{const c=G.SHOP[k](S);const icon=ic==='G'?ART.guide():ic==='C'?ART.chest():`<span style="font-size:1.5rem">${ic}</span>`;
   return `<button data-buy="${k}" ${S.gold>=c?'':'disabled'}>${icon}<span>${n}<br><small>${cur} · ${c===Infinity?'макс.':fmt(c)+'💰'}</small></span></button>`}).join('');}
 save();}
function renderMonty(){const p=S.monty.pending;$('montyCard').hidden=!p;if(!p)return;const g=p.guide>=0?S.monty.guides[p.guide].name:'Проводник';
 const doors=[...Array(p.n).keys()].map(i=>{const open=p.opened.includes(i)||p.done;const isP=i===p.prize;
  const cls='door'+(i===p.pick?' pick':'')+(open?(isP?' prize':' empty'):'');const lab=open?(isP?'💰 приз':'пусто'):(i===p.pick?'ваш':'?');
  return `<button class="${cls}" data-door="${i}" ${p.done?'disabled':''}>${ART.chest()}<span>${i+1}: ${lab}</span></button>`}).join('');
 let msg;if(p.pick===null)msg=`Найдено сундуков: ${p.n}. В одном — сокровище. Выберите сундук.${p.guide>=0?` С вами ${g}.`:''}`;
 else if(!p.done)msg=p.revealed?`${g} нечаянно открыл сундук с призом! Забирайте.`:`${g} открыл пуст${p.opened.length>1?'ые':'ой'}. Остаться при своём (№${p.pick+1}) или поменять?`;
 else msg=p.win?`🎉 Сокровище: ${itemHtml(p.reward)}`:`Пусто. Утешительные ${p.reward}💰.`;
 const st=S.monty.stats,r=x=>x[1]?`${x[0]}/${x[1]} (${pct(x[0]/x[1])})`:'—';
 $('monty').innerHTML=`<div>${msg}</div><div class="doors">${doors}</div>${p.done?'<button id="mclose" class="big">Дальше</button>':''}
 <div class="hint">Ваша статистика побед: остаться — ${r(st.stay)}, поменять — ${r(st.switch)}</div>`;}
function renderGuides(){const gs=S.monty.guides;$('guidesCard').hidden=!gs;if(!gs)return;const r=x=>x[1]?`${x[0]}/${x[1]} (${pct(x[0]/x[1])})`:'—';
 $('guides').innerHTML=gs.map((g,i)=>`<div class="item"><div class="txt"><b>${g.name}</b> — остаться: ${r(g.stats.stay)}, поменять: ${r(g.stats.switch)}
 ${S.monty.guess[i]==='ok'?`<br><span class="good">Разгадан: ${{honest:'честный',unreliable:'ненадёжный',random:'случайный'}[g.type]}</span>`:''}</div>
 ${S.monty.guess[i]==='ok'?'':`<div class="btns"><button class="small" data-guess="${i}" data-gt="honest">Честный</button><button class="small" data-guess="${i}" data-gt="unreliable">Ненадёжный</button><button class="small" data-guess="${i}" data-gt="random">Случайный</button></div>`}</div>`).join('')+
 '<div class="hint">Подсказка (3 сундука): у честного смена выигрывает ~67%, у случайного ~50% (раунды, где он открыл приз, не считаются), ненадёжный — между. Ошибка сбрасывает статистику проводника.</div>';}
function renderHowto(){$('howto').innerHTML=['start',...G.UNLOCKS.map(u=>u.k).filter(k=>S.unl[k])].map(k=>`<p><b>${HELP[k][0]}.</b> ${HELP[k][1]}</p>`).join('')+'<p class="hint">Остальное откроется по мере игры.</p>';}
function showReport(h){$('reportCard').hidden=false;$('report').innerHTML=h;}
function stage(){const lvl0=S.lvl;const r=G.rollStage(S);if(!r)return;
 let h=S.unl.stages?`<p><b>Этап ${r.stage}</b></p>`:'';
 if(r.chips.length)h+=`<p class="hint">Фишки: ${r.chips.map(x=>`<span class="r-${G.RARS[G.CHIP_T[x.t].r]}">${G.CHIP_T[x.t].ru} ${x.k}/${x.n}${x.k&&!x.paid?' — ниже порога':''}</span>`).join(', ')}</p>`;
 if(r.died)h+=`<p class="bad">☠️ Герой пал (риск был ${pct(r.dc)}). Потеряно предметов: ${r.lost}.</p>`;
 h+=r.drops.map(x=>itemHtml(x)).join('');
 if(r.shards)h+=`<p>💎 +${r.shards} оск.</p>`;if(S.lvl>lvl0)h+=`<p class="good">⭐ Новый уровень: ${S.lvl}!</p>`;
 if(r.bank){h+=`<p class="good">🏠 ${r.finished&&S.unl.stages?'Локация пройдена до конца! ':''}Добыча сохранена: ${r.bank.items.length} предм. (${fmt(r.bank.gold)}💰).</p>`;G.maybeMonty(S);}
 showReport(h);unlocks();render();}
document.addEventListener('click',e=>{const tp=e.target.closest('.tip');if(tp){MQ.push(TIPS[tp.dataset.tip]);showModal();return;}
 const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
 if(d.loc!==undefined){S.loc=+d.loc;$('eval').innerHTML='';}
 else if(d.p!==undefined){if(usedChips()<S.chips)S.alloc[+d.p]++;$('eval').innerHTML='';}
 else if(d.m!==undefined){if(S.alloc[+d.m]>0)S.alloc[+d.m]--;$('eval').innerHTML='';}
 else if(d.door!==undefined){const p=S.monty.pending;const i=+d.door;if(p.pick===null)G.montyPick(S,i);else if(!p.done&&(i===p.pick||G.montyClosed(p).includes(i)||(p.revealed&&i===p.prize)))G.montyFinal(S,i);}
 else if(b.id==='mclose')G.montyClear(S);
 else if(d.guess!==undefined){const r=G.guessGuide(S,+d.guess,d.gt);showReport(r==='ok'?'<p class="good">Верно! +15 💎</p>':r==='few'?'<p>Мало данных: нужно хотя бы 5 раундов с этим проводником.</p>':'<p class="bad">Неверно. Статистика проводника сброшена.</p>');}
 else if(d.eq)G.equip(S,+d.eq);else if(d.dis)G.dismantle(S,+d.dis);else if(d.buy)G.buy(S,d.buy);else if(d.up)G.upgradeItem(S,d.up);
 else if(b.id==='pity'){const it=G.craftPity(S);if(it)showReport('<p>Создано:</p>'+itemHtml(it));}
 else if(b.id==='go'){G.startRun(S);}
 else if(b.id==='cont'){G.continueRun(S);}
 else if(b.id==='ret'){if(!S.run)return;const r=G.bank(S);showReport(`<p class="good">🏠 Вернулись. Сохранено ${r.items.length} предм. (${fmt(r.gold)}💰).</p>`+r.items.slice(-6).map(x=>itemHtml(x)).join(''));G.maybeMonty(S);}
 else if(b.id==='evalb'){runEval();return;}
 else if(b.id==='autoeq')G.equipBest(S);
 else if(b.id==='disAll'){S.inv.filter(i=>S[i.slot]&&G.score(i)<=G.score(S[i.slot])).map(i=>i.id).forEach(id=>G.dismantle(S,id));}
 else if(b.id==='reset'){if(confirm('Сбросить весь прогресс?')){S=G.newState();G.tickEnergy(S);$('reportCard').hidden=true;$('eval').innerHTML='';popup('start');}}
 else return;unlocks();render();});
function tick(){if(S.run&&!S.run.waiting&&Date.now()>=S.run.endAt){stage();return;}const e=S.energy;header();if(S.energy!==e&&!S.run)render();else tickProg();}
setInterval(tick,250);
render();if(!S.runs&&!S.run)popup('start');if(migrated)showReport('<p>Игра сильно обновилась — старое сохранение несовместимо, начинаем заново.</p>');
