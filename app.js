const KEY='probIdleSave';const $=id=>document.getElementById(id);
let S=G.load(localStorage.getItem(KEY));let migrated=false;
if(!S){migrated=!!(localStorage.getItem(KEY)||localStorage.getItem('probIdleMvp1'));localStorage.removeItem('probIdleMvp1');S=G.newState();}
G.tickEnergy(S);
const save=()=>{S.lastSeen=Date.now();localStorage.setItem(KEY,JSON.stringify(S));};
const pct=x=>(x*100).toFixed(x<0.01&&x>0?2:1)+'%';
const fmt=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':Math.round(n)+'';
const AFRU=Object.fromEntries(G.AFFIXES.map(a=>[a.k,a]));
const usedChips=()=>S.alloc.reduce((a,b)=>a+b,0);
// --- popups
const MQ=[];function popup(k){const t=HELP[k];if(t)MQ.push(t);showModal();}
function showModal(){if(!$('modal').hidden||!MQ.length)return;const [ti,tx]=MQ.shift();$('mtext').innerHTML=`<h3>${ti}</h3><p>${tx}</p>`;$('modal').hidden=false;}
$('mok').onclick=()=>{$('modal').hidden=true;showModal();};
function unlocks(){G.checkUnlocks(S).forEach(popup);G.checkAch(S).forEach(x=>toast('🏅 '+x.ru));}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),3500);beep(990,0.2);}
// --- pieces
function afText(it){return it.affixes.map(a=>`+${a.v}${AFRU[a.k].unit} ${AFRU[a.k].ru}`).join(' · ');}
function itemHtml(it,btns,pop){const pw=it.slot==='charm'?'':` ${it.slot==='weapon'?'⚔️':'🛡️'}${G.itemPower(it)}${it.lvl?` (+${it.lvl})`:''}`;
 return `<div class="item ${it.rarity}${pop?' pop':''}" ${pop?`style="animation-delay:${pop*0.12}s"`:''}>${ART.icon(it.slot,it.rarity,it.id)}<div class="txt">${it.fresh&&!pop?'<span class="badge">NEW</span> ':''}<span class="r-${it.rarity}">${it.name}</span> <small>${G.RAR_RU[it.rarity]}</small>${pw}<div class="af">${afText(it)||'без свойств'}</div></div><div class="btns">${btns||''}</div></div>`;}
function cmp(it){const c=S[it.slot];if(!c)return '<span class="delta good">слот пуст</span>';const d=Math.round(G.score(it)-G.score(c));
 return d>0?`<span class="badge better" title="Сравнение с надетым">▲ лучше +${d}</span>`:`<span class="delta bad" title="Сравнение с надетым">▼ ${d}</span>`;}
function chancesBar(c){return `<div class="chances" title="Шанс редкости каждого предмета">${c.map((p,r)=>`<i class="c-${G.RARS[r]}" style="width:${Math.max(p*100,1.5)}%">${p>0.07?pct(p):''}</i>`).join('')}</div>
 <div class="legend">${c.map((p,r)=>r?`<span class="r-${G.RARS[r]}">● ${G.RAR_RU[G.RARS[r]]} ${pct(p)}</span>`:'').join('')}</div>`;}
function header(){G.tickEnergy(S);const me=G.maxEnergy(S);const U=S.unl;
 const left=S.energy>=me?'полна':'+1 через '+Math.ceil(G.regenSec(S)-(Date.now()-S.energyT)/1000)+'с';
 $('stats').innerHTML=`<span>💰 ${fmt(S.gold)}</span>${U.shop?`<span title="Материалы: для улучшения снаряжения">🔩 ${fmt(S.mats)}</span>`:''}${U.pity?`<span title="Осколки: 40 = легендарка">💎 ${S.shards}/${G.SHARDS_FOR_PITY}</span>`:''}
 <span title="Энергия: тратится на поход, восстанавливается со временем">⚡ ${S.energy}/${me} <span class="bar e"><i style="width:${S.energy/me*100}%"></i></span> <small>${left}</small></span>
 ${G.daily(S)?`<span class="daily" title="Модификатор дня — меняется каждый день">☀️ ${G.daily(S).ru}</span>`:''}<span title="Уровень героя">Ур. ${S.lvl} <span class="bar"><i style="width:${S.lvl>=G.MAX_LVL?100:S.xp/G.xpNeed(S.lvl)*100}%"></i></span></span>`;}
function renderRun(){const r=S.run;const L=G.LOCS[r?r.loc:S.loc];let h;
 if(!r){const cost=G.runCost(S,S.loc);const c=G.rarChances(S,S.loc);
  h=`<div class="runmain"><b>${L.name}</b><div class="pills"><span>🎁 ${G.rolls(S)} предм.${S.unl.stages?'/этап':''}</span><span>⏱ ${(G.stageMs(S,S.loc)/1000).toFixed(1)} с</span><span>⚡ ${cost}</span></div>
  <button id="go" class="big" ${S.energy<cost?'disabled':''}>${S.energy<cost?`Ждём энергию (${S.energy}/${cost})`:'⚔️ В поход'}</button></div>${chancesBar(c)}`;
  if(S.unl.stages){const a=S.unl.chips?S.alloc:[0,0,0];h+=`<div class="hint">${!S.cleared.includes(S.loc)?'🎯 Пройдите все этапы до конца — откроется новое. ':''}Этапов: ${L.stages}. Риск гибели по этапам: <span class="bad">${Array.from({length:L.stages},(_,i)=>pct(G.deathChance(S,S.loc,a,i))).join(' → ')}</span></div>`;}}
 else if(!r.waiting){h=`<div class="runmain"><b>${L.name}</b> — ${S.unl.stages?`этап ${r.stage+1}/${L.stages}`:'герой в походе…'}</div><div class="prog"><i id="progbar" style="width:0%"></i><b id="walker">🚶</b></div><div class="hint" id="progtxt"></div>`;}
 else{const dc=G.deathChance(S,r.loc,r.alloc,r.stage);
  h=`<b>${L.name}</b>: пройдено ${r.stage}/${L.stages}<div class="stage">${Array.from({length:L.stages},(_,i)=>`<i class="${i<r.stage?'d':''}"></i>`).join('')}</div>
  <div>С собой: <b>${r.loot.length}</b> предм. (${fmt(r.loot.reduce((a,b)=>a+b.value,0))}💰) — пропадут при гибели.</div>
  <div>Следующий этап: риск гибели <b class="bad">${pct(dc)}</b>, ожидаемая добыча ≈ ${fmt(G.stageEV(S,r.loc,r.alloc,r.stage))}💰</div>
  ${chancesBar(G.rarChances(S,r.loc,r.stage))}
  <div class="row"><button id="cont" class="big">➡️ Дальше</button><button id="ret" class="ok">🏠 Домой с добычей</button></div>`;}
 $('run').innerHTML=h;tickProg();}
function tickProg(){const r=S.run;if(!r||r.waiting||!$('progbar'))return;const tot=G.stageMs(S,r.loc);const left=Math.max(0,r.endAt-Date.now());
 const w=(100-left/tot*100);$('progbar').style.width=w+'%';$('walker').style.left=`calc(${w}% - 10px)`;$('progtxt').textContent=`осталось ${(left/1000).toFixed(1)}с`;}
function renderChips(){const U=S.unl;$('chipCard').hidden=!U.chips;if(!U.chips)return;const n=S.chips;
 while(usedChips()>n){const i=S.alloc.findIndex(x=>x>0);S.alloc[i]--;}$('chipinfo').textContent=`(${usedChips()}/${n})`;
 const lock=!!S.run;
 $('chips').innerHTML=G.CHIP_T.map((t,i)=>{const p=G.chipChance(S,S.loc,i),k=S.alloc[i],th=G.thr(S,i);const rar=G.RARS[t.r];
  return `<div class="chip"><b class="r-${rar}">${t.ru}${th>1?` (≥${th})`:''}</b><div class="m">шанс ${pct(p)} за фишку · ожид. ${(k*p).toFixed(2)} · P(≥${th}) = ${pct(G.pAtLeast(k,th,p))}</div>
  <div class="ctl"><button data-m="${i}" ${lock?'disabled':''}>−</button><span class="n">${k}</span><button data-p="${i}" ${lock?'disabled':''}>+</button></div></div>`}).join('')+
  `<div class="hint">Фишка — лишний бросок за ${U.stages?'этап':'поход'}.${U.stages?' Фишки на высоких ярусах повышают риск.':''}</div>`;
 $('evalBox').hidden=!U.eval;}
function runEval(){const rows=[{name:'Ваш расклад',a:S.alloc.slice(),you:1},...G.strategies(S.chips)];
 let h='<table><tr><th>Расклад</th><th>Возврат</th><th>Среднее</th><th>P10</th><th>P50</th><th>P90</th><th>Гибель</th></tr>';let y=null;
 const pol=S.unl.stages?[[1,'до конца'],[0.1,'риск>10%']]:[[1,'—']];
 for(const r of rows)for(const [st,sn] of pol){const m=G.monteCarlo(S,S.loc,r.a,st,2000);if(r.you&&!y)y=m;
  h+=`<tr class="${r.you?'you':''}"><td>${r.name}</td><td>${sn}</td><td>${fmt(m.mean)}</td><td>${fmt(m.p10)}</td><td>${fmt(m.p50)}</td><td>${fmt(m.p90)}</td><td>${pct(m.death)}</td></tr>`;}
 const mx=Math.max(...y.bins);
 $('eval').innerHTML=`<div class="hint">Ваш расклад: распределение золота за поход (0…${fmt(y.max)}), красный — ноль</div><div class="hist">${y.bins.map((b,i)=>`<i class="${i?'':'z'}" style="height:${b/mx*100}%"></i>`).join('')}</div>${h}</table>`;}
function render(){header();const U=S.unl;$('win').hidden=!S.won;
 const slot=(k)=>{const it=S[k];if(!it)return '';const c=G.upgradeCost(it);const p=G.enhP(it.lvl);
  const can=U.shop&&it.slot!=='charm'&&it.lvl<10;
  const info=p<1?`<br><small>шанс ${pct(p)}${G.enhDown(it.lvl)?' · провал: −1 ур.':''} · ≈${G.expTries(it.lvl,S.useScroll&&S.scrolls>0).toFixed(1)} попыт.</small>`:'';
  return itemHtml(it,can?`<button class="small" data-up="${k}" ${S.gold>=c.gold&&S.mats>=c.mats?'':'disabled'} title="Улучшить снаряжение">⬆ +${it.lvl+1}: ${fmt(c.gold)}💰 ${fmt(c.mats)}🔩${info}</button>`:'');};
 $('hero').innerHTML=`<div class="herobox ${S.run&&!S.run.waiting?'walking':''}">${ART.hero()}<div><b>Герой, ур. ${S.lvl}</b><br>⚔️ ${G.heroDmg(S)} · ❤️ ${G.heroHp(S)}<br><span title="Сила = урон + HP/4; открывает локации">💪 Сила ${G.heroPower(S)}</span><br><small>Походов ${S.runs}${S.deaths?`, гибелей ${S.deaths}`:''}</small></div>
 ${(S.weapon||S.armor||S.charm)?`<div class="slots">${slot('weapon')}${slot('armor')}${slot('charm')}</div>`:''}</div>`+(U.enhance?`<div class="row"><label class="hint"><input type="checkbox" id="useScroll" ${S.useScroll?'checked':''}> тратить свиток защиты при риске понижения (свитков: ${S.scrolls})</label></div>`:'')+
 (U.pity&&S.shards>=G.SHARDS_FOR_PITY?`<div class="row"><button id="pity" class="big">💎 Создать легендарку</button></div>`:'');
 renderTabs();renderKelly();renderRebirth();$('snd').textContent=S.sound?'🔊':'🔇';
 renderRun();renderChips();renderMonty();renderMimic();renderStats();renderSets();
 $('autosell').hidden=!U.shop;$('autosell').textContent='Автопродажа: '+['выкл','обычные','≤ необычные','≤ редкие'][S.autoSell];renderGuides();renderHowto();
 $('locCard').hidden=!U.locs;
 if(U.locs)$('locs').innerHTML=G.LOCS.map((l,i)=>{const u=G.unlocked(S,i);const why=!S.cleared.includes(i-1)?'пройдите предыдущую до конца':`нужна сила ${G.locReq(S,i)}`;
  return `<button class="loc ${S.loc===i?'sel':''}" data-loc="${i}" ${u&&!S.run?'':'disabled'}>${ART.loc(i)}<span><b>${u?'':'🔒 '}${l.name}</b>${S.cleared.includes(i)?' ✅':''}<br><small>${l.stages} этапа · угроза ${G.locThreat(S,i)}${u?'':' · '+why}</small></span></button>`}).join('');
 $('autoeq').classList.toggle('nudge',S.inv.some(i=>!S[i.slot]||G.score(i)>G.score(S[i.slot])));
 const inv=S.inv.slice().sort((a,b)=>b.r-a.r||G.score(b)-G.score(a));$('disAll').hidden=!U.shop;
 $('inv').innerHTML=(inv.length>40?`<div class="hint">Показаны 40 лучших из ${inv.length}.</div>`:'')+(inv.length?inv.slice(0,40).map(it=>itemHtml(it,cmp(it)+`<button class="small" data-eq="${it.id}">Надеть</button>${U.shop?`<button class="small" data-dis="${it.id}">Продать ${fmt(it.value)}💰</button>`:''}`)).join(''):'<div class="hint">Пусто — сходите в поход!</div>');
 $('shopCard').hidden=!U.shop;
 if(U.shop){const sh=[['hp','❤️','+12 HP',`ур. ${S.hpUp}`],['dmg','⚔️','+3 урона',`ур. ${S.dmgUp}`],['maxE','⚡','+10 макс. энергии',`${G.maxEnergy(S)}`],
  ['regen','⏱️','Быстрее энергия',`${G.regenSec(S).toFixed(1)}с за ед.`],['boots','👢','Сапоги: походы быстрее',`ур. ${S.bootsUp}`],['bag','🎒','Сумка: +1 предмет за этап',`${G.rolls(S)} предм.`],
  ['chips','🎲','+1 фишка удачи',`${S.chips}`],['guide','G','Проводник: −3% риска',`ур. ${S.guideUp}`],['lens','🔍','Линза: +5% к редким',`ур. ${S.lensUp}`],['doors','C','+1 сундук у проводника',`${G.doors(S)}`],['scroll','📜','Свиток защиты (от понижения)',`есть ${S.scrolls}`],['bayes','📘','Книга Байеса: показывает вероятность мимика',S.bayesUp?'куплено':'']];
  $('shop').innerHTML=sh.filter(x=>G.shopAvail(S,x[0])).map(([k,ic,n,cur])=>{const c=G.SHOP[k](S);const icon=ic==='G'?ART.compass():ic==='C'?ART.chest():`<span style="font-size:1.5rem">${ic}</span>`;
   return `<button data-buy="${k}" ${S.gold>=c?'':'disabled'}>${icon}<span>${n}<br><small>${cur} · ${c===Infinity?'макс.':fmt(c)+'💰'}</small></span></button>`}).join('');}
 save();}
function renderMonty(){const p=S.monty.pending;$('montyCard').hidden=!p;if(!p)return;const g=p.guide>=0?S.monty.guides[p.guide].name:'Проводник';
 const doors=[...Array(p.n).keys()].map(i=>{const open=p.opened.includes(i)||p.done;const isP=i===p.prize;
  const cls='door'+(i===p.pick?' pick':'')+(open?(isP?' prize':' empty'):'');const lab=open?(isP?'💰 приз':'пусто'):(i===p.pick?'ваш':p.hint===i&&!p.done?'👁 пусто':'?');
  return `<button class="${cls}" data-door="${i}" ${p.done?'disabled':''}>${ART.chest()}<span>${i+1}: ${lab}</span></button>`}).join('');
 let msg;if(p.pick===null)msg=`Найдено сундуков: ${p.n}. В одном — сокровище. Выберите сундук.${p.guide>=0?` С вами ${g}.`:''}`;
 else if(!p.done)msg=p.revealed?`${g} нечаянно открыл сундук с призом! Забирайте.`:`${g} открыл пуст${p.opened.length>1?'ые':'ой'}. Остаться при своём (№${p.pick+1}) или поменять?`;
 else msg=p.win?`🎉 Сокровище: ${itemHtml(p.reward)}`:`Пусто. Утешительные ${p.reward}💰.`;
 const st=S.monty.stats,r=x=>x[1]?`${x[0]}/${x[1]} (${pct(x[0]/x[1])})`:'—';
 $('monty').innerHTML=`<div>${msg}</div><div class="doors">${doors}</div>${p.done?'<button id="mclose" class="big">Дальше</button>':''}
 <div class="hint">Ваша статистика побед: остаться — ${r(st.stay)}, поменять — ${r(st.switch)}</div>`;}
function renderMimic(){const m=S.mimic;$('mimicCard').hidden=!m;if(!m)return;
 const kn=m.knocks.map(r=>r?'🔊 гремит':'🔇 тихо').join(', ')||'ещё не стучали';
 $('mimic').innerHTML=`<div class="herobox">${ART.mimic()}<div>Мимик? Априори 25%. Гремит: мимик 80%, сундук 30%.<br><b>Стуки:</b> ${kn}
 ${S.bayesUp?`<br>📘 Вероятность мимика сейчас: <b>${pct(G.posterior(m.knocks))}</b>`:''}</div></div>
 <div class="row"><button id="knock" ${m.knocks.length>=3||S.energy<1?'disabled':''}>👊 Постучать (⚡1, ${3-m.knocks.length} ост.)</button><button id="mopen" class="big">Открыть</button><button id="mleave">Уйти</button></div>
 <div class="hint">Мимик: −10⚡ и −10% золота. Сундук: эпик или легендарка.</div>`;}
function mimicReport(r){if(!r)return;let h=r.open?(r.isM?`<p class="bad">👹 Мимик! −${r.lost}⚡, −${r.g}💰.</p>`:`<p class="good">Настоящий сундук!</p>${itemHtml(r.item,'',1)}`):`<p>Вы ушли. Это был ${r.isM?'мимик 👹':'обычный сундук 🎁'}.</p>`;
 h+=`<p class="hint">По формуле Байеса вероятность мимика после ваших стуков была ${pct(r.post)}.</p>`;showReport(h);}
function renderStats(){$('statsCard').hidden=!S.unl.stats;if(!S.unl.stats)return;const st=S.stats;const row=(n,a,e,inv)=>{const v=G.luckVerdict(a,e);const good=inv?a<=e:a>=e;return `<tr><td>${n}</td><td>${a}</td><td>${e.toFixed(1)}</td><td>${e>=3?`${Math.round(v.lo)}–${Math.round(v.hi)}`:'—'}</td><td class="${v.v==='в пределах случайности'||v.v==='мало данных'?'':good?'good':'bad'}">${v.v.replace('необычно везёт',inv?'необычно мало':'необычно везёт').replace('необычно не везёт',inv?'необычно много':'необычно не везёт')}</td></tr>`};
 let h='<table><tr><th>Событие</th><th>Факт</th><th>Ожид.</th><th>Норма 95%</th><th>Вывод</th></tr>'+G.RARS.map((r,i)=>i===0?'':row(`<span class="r-${r}">${G.RAR_RU[r]}</span>`,st.rolls[i],st.exp[i])).join('');
 if(S.unl.chips)h+=row('Попадания фишек',st.chipHit,st.chipExp);if(S.unl.stages)h+=row('Гибели',st.deaths,st.deathExp,1);
 if(st.enhTry)h+=row('Удачные улучшения',st.enhOk,st.enhExp);const ms=S.monty.stats;if(ms.switch[1]+ms.stay[1])h+=`<tr><td>Сундуки: смена / остаться</td><td colspan="4">${ms.switch[0]}/${ms.switch[1]} · ${ms.stay[0]}/${ms.stay[1]}</td></tr>`;
 $('stats2').innerHTML=h+'</table><div class="hint">«Норма» — диапазон, куда в 95% случаев попадает чистая случайность. Вне его — вам и правда (не)везёт.</div>'+achHtml()+'';}
function achHtml(){const n=Object.keys(S.ach).length;return `<h3 style="font-size:.95rem;margin:12px 0 4px">🏅 Достижения ${n}/${G.ACH.length}</h3><div class="achs">${G.ACH.map(x=>`<span class="${S.ach[x.k]?'got':''}">${S.ach[x.k]?'🏅':'🔒'} ${x.ru}</span>`).join('')}</div>`;}
function renderSets(){$('setsCard').hidden=!S.unl.sets;if(!S.unl.sets)return;
 $('sets').innerHTML=G.SETS.map((st,i)=>{const a=S.sets[i]||[];const done=a.length===G.SET_N;
  return `<div class="item ${done?'legendary':''}"><div class="txt"><b>${st.ru}</b> <small>(${G.LOCS[i].name})</small><br>${[...Array(G.SET_N).keys()].map(k=>`<span class="trophy ${a.includes(k)?'got':''}">${k+1}</span>`).join('')}
  <div class="af">Бонус: +${st.v}% ${G.AFFIXES.find(x=>x.k===st.bonus).ru} · ${done?'<b class="good">активен</b>':`ожидается ещё ≈${G.expRemaining(a.length).toFixed(1)} полных походов`}</div></div></div>`}).join('')+
  '<div class="hint">Каждый полностью пройденный поход даёт случайный трофей из 5. Чем больше собрано, тем чаще дубликаты: ожидание = 5·(1/1+…+1/k) для k недостающих.</div>';}
function renderGuides(){const gs=S.monty.guides;$('guidesCard').hidden=!gs;if(!gs)return;const r=x=>x[1]?`${x[0]}/${x[1]} (${pct(x[0]/x[1])})`:'—';
 $('guides').innerHTML=gs.map((g,i)=>`<div class="item">${ART.guide(i)}<div class="txt"><b>${g.name}</b> — остаться: ${r(g.stats.stay)}, поменять: ${r(g.stats.switch)}
 ${S.monty.guess[i]==='ok'?`<br><span class="good">Разгадан: ${{honest:'честный',unreliable:'ненадёжный',random:'случайный'}[g.type]}</span>`:''}</div>
 ${S.monty.guess[i]==='ok'?'':`<div class="btns"><button class="small" data-guess="${i}" data-gt="honest">Честный</button><button class="small" data-guess="${i}" data-gt="unreliable">Ненадёжный</button><button class="small" data-guess="${i}" data-gt="random">Случайный</button></div>`}</div>`).join('')+
 '<div class="hint">Подсказка (3 сундука): у честного смена выигрывает ~67%, у случайного ~50% (раунды, где он открыл приз, не считаются), ненадёжный — между. Ошибка сбрасывает статистику проводника.</div>';}
function renderHowto(){$('howto').innerHTML=['start',...G.UNLOCKS.map(u=>u.k).filter(k=>S.unl[k])].map(k=>`<p><b>${HELP[k][0]}.</b> ${HELP[k][1]}</p>`).join('')+'<p class="hint">Остальное откроется по мере игры.</p>';}
function afterRun(){if(!G.maybeMonty(S))G.maybeMimic(S);}
const TABS=[['run','⚔️ Поход',()=>1],['hero','🧍 Герой',()=>1],['shop','🛒 Лавка',U=>U.shop],['games','🎲 Игры',U=>U.variants||U.kelly],['stats','📈 Итоги',U=>U.stats||U.sets]];
function renderTabs(){const U=S.unl;const on=!!U.shop;document.body.classList.toggle('tabs',on);$('tabs').hidden=!on;
 const av=TABS.filter(t=>t[2](U));if(!av.find(t=>t[0]===S.tab))S.tab='run';
 const better=S.inv.some(i=>!S[i.slot]||G.score(i)>G.score(S[i.slot]));
 $('tabs').innerHTML=av.map(t=>`<button data-tab="${t[0]}" class="${S.tab===t[0]?'sel':''}">${t[1]}${t[0]==='hero'&&better&&S.tab!=='hero'?'<span class="dot"></span>':''}</button>`).join('');
 document.querySelectorAll('main [data-tab]').forEach(el=>el.classList.toggle('off',on&&el.dataset.tab!==S.tab));}
let AC=null;function beep(f,d=0.12,v=0.05){if(!S.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();
 o.frequency.value=f;o.type='sine';g.gain.value=v;g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+d);o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+d);}catch(e){}}
function lootSound(items){if(!items.length)return;const r=Math.max(...items.map(i=>i.r));beep(330+r*110,0.15);if(r===4)setTimeout(()=>beep(880,0.3),150);}
function renderKelly(){const U=S.unl;$('kellyCard').hidden=!U.kelly;if(!U.kelly)return;const K=S.kelly;const f=S.kf??0.1;const st=Math.floor(S.gold*f);
 $('kelly').innerHTML=`<div class="kv"><span>Шанс выигрыша монеты</span><b>${pct(K.p)}</b><span>Выплата</span><b>1:1</b><span>Жетоны ставок</span><b>${K.tokens}/10</b>
 <span>Доля золота</span><b>${pct(f)} = ${fmt(st)}💰</b><span>Ожидаемый лог-рост за ставку</span><b class="${G.kellyGrowth(K.p,f)>0?'good':'bad'}">${(G.kellyGrowth(K.p,f)*100).toFixed(2)}%</b>
 <span>Итог ставок</span><b>${K.bets} ставок, ${K.profit>=0?'+':''}${fmt(K.profit)}💰</b></div>
 ${f>G.kellyOpt(K.p)*2?`<div class="warn">⚠️ Ставка больше двух Келли — в долгую золото будет таять, даже с перевесом.</div>`:f>G.kellyOpt(K.p)?`<div class="hint">Выше оптимума: рост медленнее, риск выше.</div>`:''}<input type="range" id="kf" class="slider" min="0" max="0.9" step="0.01" value="${f}"><div class="row"><button id="kbet" class="big" ${K.tokens<1||st<1?'disabled':''}>🪙 Поставить</button><button id="kopt" class="small">Показать оптимум Келли</button></div>
 <div class="hint">Жетон — за каждый полностью пройденный поход. Попробуйте найти долю, при которой золото растёт быстрее всего в долгую.</div>`;}
function renderRebirth(){const U=S.unl;$('rebirthCard').hidden=!U.rebirth;if(!U.rebirth)return;
 const perks=Object.entries(S.perks).map(([k,v])=>`${G.PERKS.find(p=>p.k===k).ru} ×${v}`).join('<br>')||'пока нет';
 $('rebirth').innerHTML=`<div>Перерождений: <b>${S.rebirths}</b> (добыча +${S.rebirths*25}%). Перки:<br><small>${perks}</small></div>`+
 (S.won?`<p>Выберите постоянный перк и начните заново:</p><div class="perks">${G.perksAvail(S).map(p=>`<button data-perk="${p.k}" class="${p.t2?'t2':''}">${p.t2?'✦ ':''}${p.ru}</button>`).join('')}</div>${S.rebirths<2?'<p class="hint">После 2-го перерождения откроются перки, меняющие правила.</p>':''}<div></div>`:'<p class="hint">Снова пройдите Бездну Удачи, чтобы переродиться ещё раз.</p>')+
 `<div class="row"><button id="summary" class="small">📜 Итоги удачи</button></div>`;}
function luckSummary(){const st=S.stats;const tot=st.rolls.reduce((a,b)=>a+b,0);const L=st.rolls[4],E=st.exp[4];
 const best=[S.weapon,S.armor,S.charm,...S.inv].filter(Boolean).sort((a,b)=>b.r-a.r||G.score(b)-G.score(a))[0];
 return['📜 Итоги удачи',`Время в игре: ${Math.round(S.playMs/60000)} мин · походов: ${S.runs} · гибелей: ${st.deaths} (ожидалось ${st.deathExp.toFixed(1)})<br>
 Предметов: ${tot}. Легендарок: ${L} при ожидании ${E.toFixed(1)} — ${L>=E?'вам везло':'удача была скупа'} (${E?((L/E-1)*100).toFixed(0):0}%).<br>
 Эпиков: ${st.rolls[3]} / ${st.exp[3].toFixed(1)}. Сундуки: смена ${S.monty.stats.switch[0]}/${S.monty.stats.switch[1]}, остаться ${S.monty.stats.stay[0]}/${S.monty.stats.stay[1]}.<br>
 ${best?`Лучшая вещь: <span class="r-${best.rarity}">${best.name}</span>`:''}`];}
function offlineReport(ev){if(!ev)return;const ru={merchant:'🧳 Торговец',boss:'👹 Босс'};
 let t=`Вас не было ${ev.hours.toFixed(1)} ч. Герой сходил в ${ev.runs} безопасных похода(ов), принёс ${ev.items.length} предм.${ev.sold?`, автопродажа +${fmt(ev.sold)}💰`:''}.<br>`;
 for(const e of ev.events)t+=`${ru[e.type]}: ${e.n} раз (в среднем ожидалось ${e.lt.toFixed(2)}, шанс ровно ${e.n} = ${pct(e.p)})<br>`;
 if(ev.merchantGold)t+=`Торговец скупил хлам: +${fmt(ev.merchantGold)}💰<br>`;if(ev.boss)t+=`Побеждён босс! Трофеи: ${ev.boss.map(i=>`<span class="r-${i.rarity}">${i.name}</span>`).join(', ')}<br>`;
 if(ev.bossLost)t+=`Босс отбился ${ev.bossLost} раз(а) — без потерь.<br>`;MQ.push(['🌙 Пока вас не было',t]);showModal();}
function showReport(h){$('reportCard').hidden=false;const better=S.inv.some(i=>!S[i.slot]||G.score(i)>G.score(S[i.slot]));$('report').innerHTML=h+(better?'<div class="row"><button id="autoeq2" class="ok small">Надеть лучшее</button></div>':'');}
function stage(){const lvl0=S.lvl;const r=G.rollStage(S);if(!r)return;lootSound(r.drops);if(r.died)beep(140,0.4);
 let h=S.unl.stages?`<p><b>Этап ${r.stage}</b></p>`:'';
 if(r.chips.length)h+=`<p class="hint">Фишки: ${r.chips.map(x=>`<span class="r-${G.RARS[G.CHIP_T[x.t].r]}">${G.CHIP_T[x.t].ru} ${x.k}/${x.n}${x.k&&!x.paid?' — ниже порога':''}</span>`).join(', ')}</p>`;
 if(r.revived)h+=`<p class="good">✨ Второй шанс спас героя от гибели!</p>`;
 if(r.died)h+=`<p class="bad">☠️ Герой пал (риск был ${pct(r.dc)}). Потеряно предметов: ${r.lost}.${r.kept?` Страховка сохранила ${r.kept}.`:''}</p>`;
 h+=r.drops.map((x,i)=>itemHtml(x,S[x.slot]&&G.score(x)>G.score(S[x.slot])||!S[x.slot]?'<span class="badge better">▲</span>':'',i+1)).join('');
 if(r.trophy){const t=r.trophy,st=G.SETS[t.loc];h+=t.dup?`<p>🏺 Трофей «${st.ru}» №${t.k+1} — дубликат (+${t.gold}💰).</p>`:`<p class="good">🏺 Новый трофей «${st.ru}» №${t.k+1}!${t.done?' Коллекция собрана — бонус активен!':''}</p>`;}
 if(r.shards)h+=`<p>💎 +${r.shards} оск.</p>`;if(S.lvl>lvl0)h+=`<p class="good">⭐ Новый уровень: ${S.lvl}!</p>`;
 if(r.bank){h+=`<p class="good">🏠 ${r.finished&&S.unl.stages?'Локация пройдена до конца! ':''}Добыча сохранена: ${r.bank.items.length} предм. (${fmt(r.bank.gold)}💰)${r.bank.sold?`, автопродажа +${fmt(r.bank.sold)}💰`:''}.</p>`;afterRun();}
 showReport(h);unlocks();checkWin();render();}
document.addEventListener('change',e=>{if(e.target.id==='useScroll'){S.useScroll=e.target.checked;render();}});
document.addEventListener('input',e=>{if(e.target.id==='kf'){S.kf=+e.target.value;const y=window.scrollY;renderKelly();const k=$('kf');if(k)k.focus();}});
document.addEventListener('click',e=>{const tp=e.target.closest('.tip');if(tp){MQ.push(TIPS[tp.dataset.tip]);showModal();return;}
 const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
 if(d.loc!==undefined){S.loc=+d.loc;$('eval').innerHTML='';}
 else if(d.p!==undefined){if(usedChips()<S.chips)S.alloc[+d.p]++;$('eval').innerHTML='';}
 else if(d.m!==undefined){if(S.alloc[+d.m]>0)S.alloc[+d.m]--;$('eval').innerHTML='';}
 else if(d.door!==undefined){const p=S.monty.pending;const i=+d.door;if(p.pick===null)G.montyPick(S,i);else if(!p.done&&(i===p.pick||G.montyClosed(p).includes(i)||(p.revealed&&i===p.prize)))G.montyFinal(S,i);}
 else if(b.id==='mclose')G.montyClear(S);
 else if(b.id==='knock'){G.knock(S);}
 else if(b.id==='mopen'||b.id==='mleave'){const r=G.resolveMimic(S,b.id==='mopen');mimicReport(r);}
 else if(d.tab){S.tab=d.tab;window.scrollTo&&window.scrollTo(0,0);}
 else if(b.id==='snd'){S.sound=S.sound?0:1;beep(660);}
 else if(b.id==='kbet'){if((S.kf??0.1)>0.5&&!b.dataset.ok){b.dataset.ok=1;b.textContent='Точно? Нажмите ещё раз';return;}const r=G.kellyBet(S,S.kf??0.1);if(r){beep(r.win?880:200);showReport(`<p class="${r.win?'good':'bad'}">🪙 ${r.win?'Выигрыш':'Проигрыш'}: ${r.win?'+':'−'}${fmt(r.stake)}💰 (шанс был ${pct(r.p)}, ваша доля ${pct(r.f)}, Келли: ${pct(r.opt)})</p>`);}}
 else if(b.id==='kopt'){S.kf=Math.round(G.kellyOpt(S.kelly.p)*100)/100;}
 else if(d.perk){if(confirm('Переродиться? Прогресс текущего пути сбросится.')){G.rebirth(S,d.perk);$('reportCard').hidden=true;}}
 else if(b.id==='summary'){MQ.push(luckSummary());showModal();return;}
 else if(b.id==='autosell'){S.autoSell=(S.autoSell+1)%4;}
 else if(d.guess!==undefined){const r=G.guessGuide(S,+d.guess,d.gt);showReport(r==='ok'?'<p class="good">Верно! +15 💎</p>':r==='few'?'<p>Мало данных: нужно хотя бы 5 раундов с этим проводником.</p>':'<p class="bad">Неверно. Статистика проводника сброшена.</p>');}
 else if(d.eq)G.equip(S,+d.eq);else if(d.dis)G.dismantle(S,+d.dis);else if(d.buy)G.buy(S,d.buy);else if(d.up){const r=G.upgradeItem(S,d.up,!!S.useScroll);if(r&&r!=='ok')showReport({fail:'<p>Улучшение не удалось (уровень сохранён).</p>',down:'<p class="bad">Провал! Уровень понижен на 1.</p>',saved:'<p>Провал, но свиток защиты спас уровень.</p>'}[r]);}
 else if(b.id==='pity'){const it=G.craftPity(S);if(it)showReport('<p>Создано:</p>'+itemHtml(it));}
 else if(b.id==='go'){G.startRun(S);}
 else if(b.id==='cont'){G.continueRun(S);}
 else if(b.id==='ret'){if(!S.run)return;const r=G.bank(S);showReport(`<p class="good">🏠 Вернулись. Сохранено ${r.items.length} предм. (${fmt(r.gold)}💰)${r.sold?`, автопродажа +${fmt(r.sold)}💰`:''}.</p>`+r.items.slice(-6).map((x,i)=>itemHtml(x,'',i+1)).join(''));afterRun();}
 else if(b.id==='evalb'){runEval();return;}
 else if(b.id==='autoeq'||b.id==='autoeq2'){G.equipBest(S);if(b.id==='autoeq2')b.remove();}
 else if(b.id==='disAll'){S.inv.filter(i=>S[i.slot]&&G.score(i)<=G.score(S[i.slot])).map(i=>i.id).forEach(id=>G.dismantle(S,id));}
 else if(b.id==='reset'){if(confirm('Сбросить весь прогресс?')){S=G.newState();G.tickEnergy(S);$('reportCard').hidden=true;$('eval').innerHTML='';popup('start');}}
 else return;unlocks();checkWin();render();});
function checkWin(){if(S.won&&!S.summarySeen){S.summarySeen=1;MQ.push(luckSummary());showModal();}}
let lastT=Date.now(),saveT=0;
function tick(){const n=Date.now();if(!document.hidden)S.playMs+=Math.min(1000,n-lastT);lastT=n;if(n-saveT>5000){saveT=n;save();}if(S.run&&!S.run.waiting&&Date.now()>=S.run.endAt){stage();return;}const e=S.energy;header();if(S.energy!==e&&!S.run)render();else tickProg();}
setInterval(tick,250);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){G.tickEnergy(S);offlineReport(G.offline(S));render();}else save();});
const offEv=G.offline(S);render();if(!S.runs&&!S.run&&!S.rebirths)popup('start');offlineReport(offEv);if(migrated)showReport('<p>Игра сильно обновилась — старое сохранение несовместимо, начинаем заново.</p>');
