const KEY='probIdleSave';const $=id=>document.getElementById(id);
let S=G.load(localStorage.getItem(KEY));let migrated=false;
if(!S){const raw0=localStorage.getItem(KEY);if(raw0){try{localStorage.setItem(KEY+'_bak_'+Date.now(),raw0);}catch(e){}}migrated=!!(raw0||localStorage.getItem('probIdleMvp1'));localStorage.removeItem('probIdleMvp1');S=G.newState();}
G.tickEnergy(S);
const save=()=>{try{S.lastSeen=Date.now();localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});window.addEventListener('pagehide',save);window.addEventListener('beforeunload',save);
const pct=x=>(x*100).toFixed(x<0.01&&x>0?2:1)+'%';
const fmt=n=>n>=1e12?(n/1e12).toFixed(1)+'T':n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':Math.round(n)+'';
const AFRU=Object.fromEntries(G.AFFIXES.map(a=>[a.k,a]));
const usedChips=()=>S.alloc.reduce((a,b)=>a+b,0);
// --- popups
const MQ=[];function popup(k){const t=HELP[k];if(t)MQ.push(t);showModal();}
function showModal(){if(!$('modal').hidden||!MQ.length)return;const [ti,tx]=MQ.shift();$('mtext').innerHTML=`<h3>${ti}</h3><p>${tx}</p>`;$('modal').hidden=false;}
$('mok').onclick=()=>{$('modal').hidden=true;showModal();};
function unlocks(){G.checkUnlocks(S).forEach(popup);const so=G.slotsOpen(S).length;if(so>(S.slotsN||3)){if(!S.slotsN||S.slotsN<4)popup('slots');else toast('🧩 Новая ячейка: '+G.SLOT_RU[G.slotsOpen(S)[so-1]]);S.slotsN=so;}if(!S.gsSeen&&G.GSETS.some(g=>G.ownedPieces(S,g.k).size)){S.gsSeen=1;popup('gsets');}G.checkAch(S).forEach(x=>toast('🏅 '+x.ru));}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),3500);beep(990,0.2);}
// --- pieces
function afText(it){return it.affixes.map(a=>`+${a.v}${AFRU[a.k].unit} ${AFRU[a.k].ru}`).join(' · ');}
function itemHtml(it,btns,pop){const pw=it.slot==='charm'?'':` ${it.slot==='weapon'||it.slot==='gloves'?'⚔️':'🛡️'}${G.itemPower(it)}${it.lvl?` (+${it.lvl})`:''}`;
 return `<div class="item ${it.rarity}${it.set?' setitem':''}${pop?' pop':''}" ${pop?`style="animation-delay:${pop*0.12}s"`:''}>${window.HeroArt?HeroArt.renderItemIcon(it,{size:48}):ART.icon(it.slot,it.rarity,it.id)}<div class="txt">${it.fresh&&!pop?'<span class="badge">NEW</span> ':''}<span class="${it.set?'r-set':'r-'+it.rarity}">${it.name}</span> <small>${it.set?'🟩 '+G.GSETS.find(g=>g.k===it.set).ru:G.RAR_RU[it.rarity]}</small>${pw}<div class="af">${S.unl.synergy&&it.tag?`<span class="tag t-${it.tag}">${G.TAGS[it.tag].ic} ${G.TAGS[it.tag].ru}</span> `:''}${it.kept?'📦 ':''}${afText(it)||'без свойств'}</div></div><div class="btns">${btns||''}</div></div>`;}
let RC=null;function rc(){if(!RC)RC={base:G.heroPower(S),dp:new Map()};return RC;}
function powDelta(i){const c=rc();if(c.dp.has(i.id))return c.dp.get(i.id);const eq=G.eqOf(S);eq[G.SLOTS.indexOf(i.slot)]=i;const d=G.heroPower(S,eq)-c.base;c.dp.set(i.id,d);return d;}
function isBetter(i){if(!S[i.slot])return true;if(!S.unl.synergy)return G.score(i)>G.score(S[i.slot]);return powDelta(i)>0;}
function synPreview(it){if(!S.unl.synergy||!it.tag)return'';const eq=G.eqOf(S);const idx=G.SLOTS.indexOf(it.slot);const now=G.syn(S,it.tag);eq[idx]=it;const n=G.syn(S,it.tag,eq);
 const dp=powDelta(it);let t=`<span class="delta ${dp>0?'good':dp<0?'bad':''}">сила ${dp>=0?'+':''}${dp}</span>`;
 if(n>now&&n>=2)t+=` <span class="badge syn">${G.TAGS[it.tag].ic} ${n}/3: ${n>=3?G.TAGS[it.tag].b3:G.TAGS[it.tag].b2}</span>`;return t;}
function cmp(it){if(S.unl.synergy)return synPreview(it)||'';const c=S[it.slot];if(!c)return '<span class="delta good">слот пуст</span>';const d=Math.round(G.score(it)-G.score(c));
 return d>0?`<span class="badge better" title="Сравнение с надетым">▲ лучше +${d}</span>`:`<span class="delta bad" title="Сравнение с надетым">▼ ${d}</span>`;}
function chancesBar(c){return `<div class="chances" title="Шанс редкости каждого предмета">${c.map((p,r)=>`<i class="c-${G.RARS[r]}" style="width:${Math.max(p*100,1.5)}%">${p>0.07?pct(p):''}</i>`).join('')}</div>
 <div class="legend">${c.map((p,r)=>r?`<span class="r-${G.RARS[r]}">● ${G.RAR_RU[G.RARS[r]]} ${pct(p)}</span>`:'').join('')}</div>`;}
function header(){G.tickEnergy(S);const me=G.maxEnergy(S);const U=S.unl;
 const left=S.energy>=me?'полна':'+1 через '+Math.ceil(G.regenSec(S)-(Date.now()-S.energyT)/1000)+'с';
 $('stats').innerHTML=`<span>💰 ${fmt(S.gold)}</span>${U.shop?`<span title="Материалы: для улучшения снаряжения">🔩 ${fmt(S.mats)}</span>`:''}${U.pity?`<span title="Осколки: ${G.pityCost(S)} = легендарка">💎 ${S.shards}/${G.pityCost(S)}</span>`:''}
 <span title="Энергия: тратится на поход, восстанавливается со временем">⚡ ${S.energy}/${me} <span class="bar e"><i style="width:${S.energy/me*100}%"></i></span> <small>${left}</small></span>
 ${G.daily(S)?`<span class="daily" title="Модификатор дня — меняется каждый день">☀️ ${G.daily(S).ru}</span>`:''}<span title="Уровень героя">Ур. ${S.lvl} <span class="bar"><i style="width:${S.lvl>=G.MAX_LVL?100:S.xp/G.xpNeed(S.lvl)*100}%"></i></span></span>`;}
function stanceHtml(){const cur=S.stance===undefined?1:S.stance;return `<div class="stance">${G.STANCE.map((st,k)=>{const i=G.stanceInfo(S,S.loc,k);return `<button class="small ${k===cur?'sel':''}" data-stance="${k}">${st.ic} ${st.ru}<small><span title="${i.x?`+1 предмет с шансом ${pct(i.x)}`:''}">${i.n}${i.x?'–'+(i.n+1):''} предм.</span>${S.unl.stages?'/этап':''}</small>${st.tag&&S.unl.synergy?'<small>🏷 всё с тегами</small>':''}<small title="шанс за предмет ${pct(i.p)}; хотя бы один = 1−(1−p)ⁿ">редкий+: <b>${pct(i.any)}</b></small>${S.unl.stages&&st.dm!==1?`<small>риск ×${st.dm}</small>`:''}</button>`;}).join('')}</div><div class="hint">«Редкий+» — шанс, что хотя бы одна находка будет редкой или лучше: 1−(1−p)ⁿ.</div>`;}
function quickbar(){if(!S.unl.stages&&!G.CONS_K.some(k=>S.cons[k]>0))return'';const a=S.arm||(S.arm={});const ks=['potion','elixir','bait'];const pr=k=>G.consPrice(S,k);
 const base=G.rarChances(S,S.loc),el=G.elixPreview(S,S.loc);const rp=c=>c[2]+c[3]+c[4];
 const eff={potion:S.unl.stages?'спасёт от одной гибели':'пока гибели нет — не нужно',elixir:`редкий+ ${pct(rp(base))} → <b>${pct(rp(el))}</b> за предмет`,bait:`тег: <select id="baitTag">${G.TAG_K.map(t=>`<option value="${t}" ${a.baitTag===t?'selected':''}>${G.TAGS[t].ic} ${G.TAGS[t].ru}</option>`).join('')}</select>`};
 const row=k=>{const C=G.CONS[k],n=S.cons[k]||0,on=a[k]&&n>0;return `<div class="qb ${on?'on':''}"><button class="small ${on?'sel':''}" data-arm="${k}" ${n?'':'disabled'}>${C.ic} ${n}</button><span><b>${C.ru}</b> <small>${eff[k]||C.d}</small></span><span class="qbuy">${C.g?`<button class="small" data-cbuy="${k}" data-how="g" ${S.gold<pr(k).g?'disabled':''}>${fmt(pr(k).g)}💰</button>`:''}<button class="small" data-cbuy="${k}" data-how="m" ${S.mats<pr(k).m?'disabled':''}>${fmt(pr(k).m)}🔩</button></span></div>`;};
 const other=G.CONS_K.filter(k=>!ks.includes(k)&&(S.cons[k]||0)>0).map(k=>`${G.CONS[k].ic}${S.cons[k]}`).join(' ');
 return `<details class="qbar" ${ks.some(k=>a[k])?'open':''}><summary>🎒 Расходники на поход ${ks.map(k=>G.CONS[k].ic+(S.cons[k]||0)).join(' ')}${other?' · '+other:''}</summary>${ks.map(row).join('')}<small class="hint">Нажмите на значок, чтобы взять с собой (тратится при старте). Расходники иногда находятся среди переплавленной мелочи (5%), их можно купить или создать из 🔩.</small></details>`;}
function renderShrine(){const on=!!(S.shrineOpen&&S.run);$('shrineCard').hidden=!on;if(!on){S.shrineOpen=0;return;}const c=S.run.cash||0;
 const opts=[[0,'Не ставить'],[0.2,'Келли 20%'],[0.5,'Половину'],[1,'Всё']];
 $('shrine').innerHTML=`<div>Монета алтаря выпадает в вашу пользу с шансом <b>${pct(G.SHRINE_P)}</b>, выплата 1:1. Ставка — мелочь из мешка этого похода (сейчас ${fmt(c)}💰, максимум ${fmt(G.shrineStake({run:{cash:1e12},cleared:S.cleared,rebirths:S.rebirths},1))}💰).</div>
 <div class="row">${opts.map(([f,n])=>`<button class="${f===0.2?'big':''}" data-shr="${f}">${n}${f?` (${fmt(G.shrineStake(S,f))}💰)`:''}</button>`).join('')}</div>
 <small class="hint">Формула Келли: лучшая доля f* = 2p − 1 = ${pct(2*G.SHRINE_P-1)}. Больше — выше разброс и ниже рост в долгую.</small>`;}
function routeHtml(r){const L=G.LX(r.loc);const route=r.route||[];const opts=route[r.stage]||['fight'];const pr=G.nodeProbs(S).map(([k,p])=>`${G.NODES[k].ic} ${pct(p)}`).join(' · ');
 const nodes=route.map((o,i)=>{const done=i<r.stage;const t=done?(r.path||[])[i]||'fight':null;return `<div class="node ${done?'done':i===r.stage?'next':''}">${done?G.NODES[t].ic:i===r.stage?o.map(k=>G.NODES[k].ic).join('/'):'?'}</div>`;}).join('<i class="link"></i>');
 return `<div class="route"><div class="routeline">🏠<i class="link"></i>${nodes}<i class="link"></i>🏁</div><small>Дальше по маршруту «?»: ${pr}</small></div>
 <div class="row nodes">${opts.map((k,i)=>`<button class="big nodebtn" data-node="${i}" ${k==='boss'?'data-boss="1"':''}><b>${G.NODES[k].ic} ${G.NODES[k].ru}</b><small>${G.NODES[k].d}${k==='boss'?` · <b class="bad">гибель ${pct(Math.min(.9,G.deathChance(S,r.loc,r.alloc,r.stage)*3))}</b>`:''}</small></button>`).join('')}</div>`;}
const ZI=['🗣 Голова','🫁 Корпус','🦵 Ноги'],ZA=['голову','корпус','ноги'];
function renderDuel(){const d=S.duel;$('duelCard').hidden=!d;if($('arena')&&S.tab==='games'){const pr=S.energy<G.DUEL_COST;$('arena').innerHTML=`<p class="goal">Цель: победить бойца, угадывая его привычки.</p><small class="hint">Каждый раунд вы выбираете, <b>куда бить</b> и <b>что закрыть блоком</b>. У врага есть любимые зоны — следите за его статистикой и бейте туда, где он редко ставит блок.</small><div class="row"><button class="big" id="duelGo" ${d?'disabled':''}>${pr?'🎯 Тренировочный бой (бесплатно, награда крошечная)':`🤺 Вызвать на бой (⚡${G.DUEL_COST})`}</button></div><small>Побед: ${S.duelStats.w}/${S.duelStats.n}. Награда: редкая или эпическая вещь.</small>`;}
 if(!d)return;const O=G.duelOdds(S),h=G.duelHint(S),n=d.round;const bar=(v,m,c)=>`<div class="bar"><i style="width:${Math.max(0,v/m*100)}%;background:${c}"></i></div>`;
 const fr=(arr)=>arr.map((x,i)=>`<td>${n?Math.round(x/n*100)+'%':'—'}</td>`).join('');
 const last=d.log.slice(-3).reverse().map(r=>`<div class="dl">Вы: удар в ${ZA[r.a]}${r.hit?` — <b class="good">−${r.hit}${r.crit?' крит!':''}</b>`:` — ${r.a===r.eb?'блок':'уворот'}`}; враг: в ${ZA[r.ea]}${r.ehit?` — <b class="bad">−${r.ehit}${r.ecrit?' крит!':''}</b>`:` — ${r.ea===r.b?'ваш блок':'уворот'}`}</div>`).join('');
 const BO=d.boss?G.BOSSES.find(x=>x.k===d.bk):null;let h_=(BO?`<div class="bossh"><img src="${BO.img}" alt="" onerror="this.remove()"><div><b>💀 ${BO.name}</b><br><i>${BO.lore}</i><br><small>Повадка: ${BO.tip}.</small></div></div>`:'')+`<p class="goal">${d.boss?'':d.name+': '}Повергните врага раньше, чем он повергнет вас.</p><div class="duelhp"><div>Вы ${Math.max(0,d.hp)}/${d.max}${bar(d.hp,d.max,'#4caf50')}</div><div>${d.name} ${Math.max(0,d.ehp)}/${d.emax}${bar(d.ehp,d.emax,'#d9534f')}</div></div>`;
 if(!d.done){const a=S.dA??null,b=S.dB??null;h_+=`<div class="dz"><div><b>Удар</b>${ZI.map((z,i)=>`<button class="${a===i?'sel':''}" data-da="${i}">${z}</button>`).join('')}</div><div><b>Блок</b>${ZI.map((z,i)=>`<button class="${b===i?'sel':''}" data-db="${i}">${z}</button>`).join('')}</div></div><div class="row"><button class="big" id="duelHit" ${a===null||b===null?'disabled':''}>⚔️ Раунд ${n+1}</button></div>`;}
 else h_+=`<div class="${d.win?'good':'bad'}"><b>${d.win?'Победа!':'Поражение.'}</b> ${d.win?(d.reward&&d.reward.name?`Награда: ${d.reward.name} (${d.reward.rarity})${d.route?' — в мешок похода':''}`:`+${d.reward}💰`):'Награды нет.'}</div><div class="row"><button class="big" id="duelEnd">Дальше</button></div>`;
 h_+=`<details class="fold" open><summary>👁 Привычки врага <small>за ${n} раундов</small></summary><table><tr><th></th><th>гол.</th><th>корп.</th><th>ноги</th></tr><tr><td>бьёт</td>${fr(d.seen.atk)}</tr><tr><td>блок</td>${fr(d.seen.blk)}</tr></table>${G.A(S,'int')>=5&&n>=3?`<small>Интуиция подсказывает: бить в <b>${ZA[h.atk]}</b>, закрывать <b>${ZA[h.blk]}</b>.</small>`:'<small>Чем больше раундов, тем точнее частоты. (Интуиция 5+ даёт подсказку.)</small>'}<br><small>Ваш крит ${Math.round(O.crit*100)}%, уворот ${Math.round(O.dodge*100)}%, удар ${O.dmg}; враг бьёт на ${O.edmg}.</small></details>${last}`;
 $('duel').innerHTML=h_;}
function attrHtml(){const f=G.attrFree(S);return `<details class="fold" data-fold="openAttr" ${S.openAttr||f?'open':''}><summary>📊 Характеристики <small>${f?`<b class="good">свободно очков: ${f}</b>`:Object.keys(G.ATTR).map(k=>G.ATTR[k].ic+G.A(S,k)).join(' ')}</small></summary>${Object.keys(G.ATTR).map(k=>`<div class="attr"><span>${G.ATTR[k].ic} <b>${G.ATTR[k].ru}</b> ${G.A(S,k)}<br><small>${G.ATTR[k].d}</small></span><button class="small" data-attr="${k}" ${f?'':'disabled'}>+</button></div>`).join('')}<small class="hint">1 очко за уровень. Сбросить можно за золото.</small> <button class="small" id="attrReset">Сбросить</button></details>`;}
const TUT={monty:['🎁 Сундуки','Перед вами несколько сундуков. В одном добыча, в остальных пусто.','Выберите сундук. Проводник откроет пустой из оставшихся и предложит сменить выбор.','Остаться или сменить? У честного проводника смена выигрывает в 2 случаях из 3. Но проводники бывают коварны — следите за их повадками.'],
 shrine:['⛩ Алтарь удачи','Алтарь бросает монету: в вашу пользу выпадает чаще, чем против.','Вы ставите часть мелочи из мешка похода. Победа удваивает ставку, поражение забирает её.','Не ставьте всё: мудрая доля (по Келли) растит мешок быстрее всего и не разоряет.'],
 duel:['🤺 Поединок','Бой идёт по раундам, пока у кого-то не кончится здоровье.','Каждый раунд выберите, куда бить и что закрыть блоком. Враг делает то же самое.','У врага есть любимые зоны. Смотрите таблицу привычек: бейте туда, где он редко ставит блок, а закрывайте то, куда он чаще бьёт.'],
 dive:['🕳️ Погружение','Цель — спуститься на дно. Каждый шаг ведёт вниз или отбрасывает вверх.','Новая глубина кладёт добычу в мешок. Вернётесь на поверхность — мешок потерян. Забрать и выйти можно в любой момент.','Смелый шаг быстрее, но на глубине опасен. Осторожный стоит ⚡, зато надёжнее и показывает следующий шаг.'],
 mimic:['👀 Подозрительный сундук','Это может быть клад, а может быть мимик.','Постучите: мимик гремит чаще, чем сундук. Каждый стук уточняет шанс.','Когда шанс мимика станет мал — открывайте. Велик — уходите.'],
 merchant:['🧳 Странник','Странник показывает товары по одному, всего 8.','Взять можно только один, и к пропущенному не вернуться.','Мудрость старая: первые трое — только смотреть, потом брать первый, что лучше всех виденных.']};
const TUTC={montyCard:'monty',shrineCard:'shrine',duelCard:'duel',mimicCard:'mimic',secCard:'merchant'};
function tutHtml(){const t=S.tut;let el=document.getElementById('tut');if(!t){if(el)el.remove();return;}if(!el){el=document.createElement('div');el.id='tut';document.body.appendChild(el);}const T=TUT[t.k];const last=t.i>=T.length-2;
 el.innerHTML=`<div class="tutbox"><h3>${T[0]}</h3><p>${T[t.i+1]}</p><div class="tutdots">${T.slice(1).map((_,i)=>`<i class="${i===t.i?'on':''}"></i>`).join('')}</div><div class="row"><button class="small" data-tutx="1">Пропустить</button><button class="big" data-tutn="1">${last?'Понятно':'Дальше'}</button></div></div>`;}
function tutCheck(){S.tutSeen=S.tutSeen||{};if(S.tut)return;for(const id in TUTC){const e=$(id);if(e&&!e.hidden&&!S.tutSeen[TUTC[id]]){S.tut={k:TUTC[id],i:0};return;}}if(S.dive&&!S.tutSeen.dive){S.tut={k:'dive',i:0};}}
function nodeEvent(t){if(t==='chest'){G.maybeMonty(S,Math.random,true,S.run?S.run.stage:0);}else if(t==='mimic'){G.maybeMimic(S,Math.random,true);}else if(t==='merchant'){G.maybeSecretary(S,Math.random,true);}else if(t==='shrine'){S.shrineOpen=1;}else if(t==='boss'){G.duelStart(S,Math.random,{free:1,route:1,boss:1,loc:S.run?S.run.loc:undefined});}else if(t==='duel'){G.duelStart(S,Math.random,{free:1,route:1,loc:S.run?S.run.loc:undefined});}else if(t==='shaft'){}}
function avEq(){const e=G.eqOf(S);const o={};G.SLOTS.forEach((k,i)=>o[k]=e[i]);return o;}
const BN={hpPct:'здоровье',luck:'удача',riskRed:'риск',goldPct:'золото'};
const SKN={wander:['🧭','Странник'],knight:['🛡️','Рыцарь'],witch:['🔮','Ведьма'],shade:['🗡️','Тень'],lich:['💀','Лич']};
const BN2={regen:'восстановление энергии',hpPct:'здоровье',luck:'удача',riskRed:'риск гибели −',goldPct:'золото'};
function skinsHtml(){const st=G.skinStage(S),cur=S.skin||'wander';return `<details class="fold" data-fold="openSkins" ${S.openSkins?'open':''}><summary>🎭 Облик <small>${SKN[cur][0]} ${SKN[cur][1]} · стадия ${st+1}/3</small></summary><div class="skins">${Object.keys(G.SKIN_U).map(k=>{const u=G.SKIN_U[k],ok=G.skinOk(S,k);return `<button class="skin ${cur===k?'sel':''}" data-skin="${k}" ${ok?'':'disabled'} title="${u.how}"><span class="skic">${window.HeroArt&&HeroArt.renderSkin?HeroArt.renderSkin(k,st,{size:64}):SKN[k][0]}</span><b>${SKN[k][1]}</b><small>${ok?`+${u.b[1][st]}% ${BN2[u.b[0]]}`:'🔒 '+u.how}</small></button>`;}).join('')}</div><small class="hint">Облик — это выбор пути, а не «лучше/хуже»: у каждого свой небольшой бонус. С ростом силы облик проходит 3 стадии (сила 300 и 1500), бонус чуть растёт.</small></details>`;}
function lootMini(){const rc=$('reportCard');const off=()=>{rc.classList.remove('compact');return'';};if(!S.unl.shop||S.run)return off();const fr=S.inv.filter(i=>i.fresh).slice(0,4);const better=S.inv.some(isBetter);if(!fr.length&&!better)return off();rc.classList.add('compact');
 return `<div class="lootmini">${fr.length?'<b>Последняя добыча</b>':'<small>В сумке есть вещь лучше надетой.</small>'}${fr.map(it=>itemHtml(it,`<button class="small" data-eq="${it.id}">Надеть</button>${!it.kept?`<button class="small" data-dis="${it.id}">Продать ${fmt(it.value)}💰</button>`:''}`)).join('')}<div class="row"><button id="autoeq3" class="${better?'nudge':''}">Надеть лучшее</button></div></div>`;}
function renderRun(){const r=S.run;const L=G.LX(r?r.loc:S.loc);let h;
 if(!r){const cost=G.runCost(S,S.loc);const c=G.rarChances(S,S.loc);
  h=`<div class="runmain"><b>${L.name}</b><div class="pills"><span>🎁 ${G.rolls(S)} предм.${S.unl.stages?'/этап':''}</span><span>⏱ ${(G.stageMs(S,S.loc)/1000).toFixed(1)} с</span><span>⚡ ${cost}</span></div>
  ${G.hurtLeft(S)>0?`<button id="go" class="big" disabled>🩹 Лечится: ${Math.ceil(G.hurtLeft(S)/1000)}с</button><button id="heal" class="ok" ${S.gold<G.healCost(S,S.hurtLoc||1)?'disabled':''}>Вылечить за ${fmt(G.healCost(S,S.hurtLoc||1))}💰</button>`:`<button id="go" class="big" ${S.energy<cost?'disabled':''}>${S.energy<cost?`Ждём энергию (${S.energy}/${cost})`:'⚔️ В поход'}</button>`}</div>${stanceHtml()}${quickbar()}${chancesBar(S.arm&&S.arm.elixir&&(S.cons.elixir||0)>0?G.elixPreview(S,S.loc):c)}`;
  if(S.unl.stages){const a=S.unl.chips?S.alloc:[0,0,0];h+=`<div class="hint">${!S.cleared.includes(S.loc)?'🎯 Пройдите все этапы до конца — откроется новое. ':''}Этапов: ${L.stages}. Риск гибели по этапам: <span class="bad">${Array.from({length:L.stages},(_,i)=>pct(G.deathChance(S,S.loc,a,i))).join(' → ')}</span></div>`;}}
 else if(!r.waiting){h=`<div class="runmain"><b>${L.name}</b> — ${S.unl.stages?`этап ${r.stage+1}/${L.stages}`:'герой в походе…'}</div><div class="prog"><i id="progbar" style="width:0%"></i><b id="walker">🚶</b></div><div class="hint" id="progtxt"></div>`;}
 else{const dc=G.deathChance(S,r.loc,r.alloc,r.stage);
  h=`<b>${L.name}</b>: пройдено ${r.stage}/${L.stages}<div class="stage">${Array.from({length:L.stages},(_,i)=>`<i class="${i<r.stage?'d':''}"></i>`).join('')}</div>
${(()=>{const e=G.continueEV(S);return `<div class="evbox"><div><span>На кону (пропадёт при гибели)</span><b class="bad">${r.loot.length} предм. · ${fmt(e.carried)}💰${e.pen?` + штраф ≈${fmt(e.pen)}💰`:''}</b></div>
  <div><span>Следующий этап</span><b>риск <span class="bad">${pct(e.dc)}</span> · добыча ≈ <span class="good">${fmt(e.gain)}💰</span></b></div>
  <div><span>Ожидание «Дальше»</span><b class="${e.ev>=0?'good':'bad'}">${e.ev>=0?'+':''}${fmt(Math.round(e.ev))}💰</b></div><div><span>«Домой»</span><b>0 (сохраните ${fmt(e.carried)}💰)</b></div>
  <small>${(1-e.dc).toFixed(2)}·${fmt(e.gain)} − ${e.dc.toFixed(2)}·${fmt(e.carried+e.pen)} = ${fmt(Math.round(e.ev))}. ${e.ev>=0?'Математически выгоднее идти дальше.':'Математически выгоднее вернуться.'}${r.loc?` Гибель: лечение ${Math.round(G.healMs(S,r.loc)/1000)}с (или ${fmt(G.healCost(S,r.loc))}💰), −${G.deathEnergy(r.loc)}⚡, 35% шанс потерять уровень улучшения вещи (свиток защищает).`:' В первой локации гибель стоит только добычи.'}</small></div>`;})()}
  ${chancesBar(G.rarChances(S,r.loc,r.stage))}
  ${routeHtml(r)}<div class="row"><button id="ret" class="ok">🏠 Домой с добычей</button></div>`;}
 $('run').innerHTML=h+lootMini();tickProg();}
function tickProg(){const r=S.run;if(!r||r.waiting||!$('progbar'))return;const tot=G.stageMs(S,r.loc);const left=Math.max(0,r.endAt-Date.now());
 const w=(100-left/tot*100);$('progbar').style.width=w+'%';$('walker').style.left=`calc(${w}% - 10px)`;$('progtxt').textContent=`осталось ${(left/1000).toFixed(1)}с`;}
function renderChips(){const U=S.unl;$('chipCard').hidden=!U.chips;if(!U.chips)return;const n=S.chips;
 while(usedChips()>n){const i=S.alloc.findIndex(x=>x>0);S.alloc[i]--;}$('chipinfo').textContent=`(${usedChips()}/${n})`;
 const lock=!!S.run;
 $('chips').innerHTML=G.CHIP_T.map((t,i)=>{const p=G.chipChance(S,S.loc,i),k=S.alloc[i],th=G.thr(S,i);const rar=G.RARS[t.r];
  return `<div class="chip"><b class="r-${rar}">${t.ru}${th>1?` (≥${th})`:''}</b><div class="m" title="ожидаемо ${(k*p).toFixed(2)} попаданий">${pct(p)} за фишку${k?` · P(≥${th}) ${pct(G.pAtLeast(k,th,p))}`:''}</div>
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
function render(){if(window.HeroArt){const e=G.eqOf(S),key=(S.skin||'')+G.heroPower(S)+e.map(x=>x?x.id:0).join();if(key!==window._havK){window._havK=key;const h=document.getElementById('hav');if(h)h.innerHTML=HeroArt.renderAvatar(avEq(),{skin:S.skin,power:G.heroPower(S),size:34});}}RC=null;renderShrine();renderDuel();header();const U=S.unl;const act=t=>!U.shop||S.tab===t;if(!['run','hero','shop','games','stats'].includes(S.tab))S.tab='run';$('win').hidden=!S.won||S.winHidden;
 const slot=(k)=>{const it=S[k];if(!it)return G.slotsOpen(S).includes(k)?`<div class="item empty"><div class="txt"><small>${G.SLOT_RU[k]}: пусто — найдите в походе</small></div></div>`:'';const c=G.upgradeCost(it);const p=G.enhP(it.lvl);
  const can=U.shop&&it.slot!=='charm'&&it.lvl<10;
  const info=p<1?`<br><small>шанс ${pct(p)}${G.enhDown(it.lvl)?' · провал: −1 ур.':''} · ≈${G.expTries(it.lvl,S.useScroll&&S.scrolls>0).toFixed(1)} попыт.</small>`:'';
  return itemHtml(it,can?`<button class="small" data-up="${k}" ${S.gold>=c.gold&&S.mats>=c.mats?'':'disabled'} title="Улучшить снаряжение">⬆ +${it.lvl+1}: ${fmt(c.gold)}💰 ${fmt(c.mats)}🔩${info}</button>`:'');};
 if(act('hero'))$('hero').innerHTML=`<div class="herobox ${S.run&&!S.run.waiting?'walking':''}"><div class="avwrap">${window.HeroArt?HeroArt.renderAvatar(avEq(),{skin:S.skin,power:G.heroPower(S),size:120}):ART.hero()}</div><div><b>Герой, ур. ${S.lvl}</b><br>⚔️ ${G.heroDmg(S)} · ❤️ ${G.heroHp(S)}<br><span title="Сила = урон + HP/4; открывает локации">💪 Сила ${G.heroPower(S)}</span><br><small>Походов ${S.runs}${S.deaths?`, гибелей ${S.deaths}`:''}</small></div>
 ${G.eqOf(S).some(Boolean)?`<div class="slots">${G.SLOTS.map(slot).join('')}</div>`:''}</div>`+(U.enhance?`<div class="row"><label class="hint"><input type="checkbox" id="useScroll" ${S.useScroll?'checked':''}> тратить свиток защиты при риске понижения (свитков: ${S.scrolls})</label></div>`:'')+
 attrHtml()+synHtml()+gsetHtml()+skinsHtml()+(U.pity&&S.shards>=G.pityCost(S)?`<div class="lootmini row"><span>💎 Осколков хватает на гарантированную легендарку</span><button id="pity" class="big">Создать</button></div>`:'');
 renderTabs();if(act('games')){renderKelly();renderDeck();renderDive();renderGuides();}else if((S.dive&&S.dive.route)||S.pendingNode!==undefined)renderDive();if(act('stats')){renderRebirth();renderStats();renderSets();renderHowto();}$('snd').textContent=S.sound?'🔊':'🔇';
 renderRun();renderChips();renderMonty();renderSec();applyColl();renderMimic();
 $('autosell').hidden=!U.shop;$('autosell').textContent='Автопродажа: '+['выкл','обычные','≤ необычные','≤ редкие'][S.autoSell];
 $('locCard').hidden=!U.locs;
 if(U.locs){const P=[[10,78],[28,40],[46,72],[63,30],[76,64],[85,22]];const path='M'+P.map(p=>`${p[0]*3.6},${p[1]*1.6}`).join(' L');
  $('locs').innerHTML=`<div class="wmap"><svg viewBox="0 0 360 160" preserveAspectRatio="none"><path d="${path}" fill="none" stroke="#d8b25a" stroke-width="2" stroke-dasharray="5 5" opacity=".55"/></svg>`+G.LOCS.map((l,i)=>{const u=G.unlocked(S,i);const why=!S.cleared.includes(i-1)?'пройдите предыдущую до конца':`нужна сила ${G.locReq(S,i)}`;
  return `<button class="pin ${(S.run?S.run.loc:S.loc)===i?'sel':''} ${u?'':'lock'} ${S.cleared.includes(i)?'done':''}" style="left:${P[i][0]}%;top:${P[i][1]}%" data-loc="${i}" ${u&&!S.run?'':'disabled'} title="${l.stages} этапа · угроза ${G.locThreat(S,i)}${u?'':' · '+why}"><i>${u?(S.cleared.includes(i)?'✔':i+1):'🔒'}</i><span>${l.name}</span></button>`}).join('')+`</div><small class="hint">${(()=>{const l=G.LX(S.run?S.run.loc:S.loc);return `${S.run?'В походе':'Выбрано'}: <b>${l.name}</b> · ${l.stages} этапа · угроза ${G.locThreat(S,S.run?S.run.loc:S.loc)}`;})()}${S.won?(()=>{const mx=G.abyssMax(S)+1,cur=S.loc>=G.BASE_N?S.loc-G.BASE_N+1:0,L=G.BASE_N-1+Math.max(1,cur),need=G.locReq(S,L),pw=G.heroPower(S);return `<div class="abyss"><b>🌀 Бесконечная Бездна</b> <button class="small" data-abyss="-1" ${cur<=1||S.run?'disabled':''}>−</button> <b>${cur?'глубина '+cur:'—'}</b> <button class="small" data-abyss="1" ${cur>=mx||S.run?'disabled':''}>+</button> ${cur?'':`<button class="small" data-abyss="1" ${S.run?'disabled':''}>Спуститься</button>`}<br><small>рекорд: ${mx-1} · рекомендуемая сила <b class="${pw>=need?'good':'bad'}">${need}</b>, у вас ${pw}. Каждая глубина опаснее и богаче; вещи бывают «+N» — чем выше N, тем реже (шанс ×0.18 за ступень).</small></div>`;})():''}${G.LOCS.findIndex((l,i)=>!G.unlocked(S,i))>0?` · следующая: ${(()=>{const i=G.LOCS.findIndex((l,i)=>!G.unlocked(S,i));return !S.cleared.includes(i-1)?'пройдите текущую до конца':'нужна сила '+G.locReq(S,i);})()}`:''}</small>`;}
 $('autoeq').classList.toggle('nudge',S.inv.some(isBetter));
 if(act('hero')){const inv=S.inv.slice().sort((a,b)=>b.r-a.r||G.score(b)-G.score(a));$('disAll').hidden=!U.shop;
 $('eqch').innerHTML=eqChoiceHtml();$('inv').innerHTML=(inv.length>(S.bagAll?40:12)?`<div class="row"><button class="small" id="bagAll">${S.bagAll?'Свернуть':'Показать все ('+inv.length+')'}</button></div>`:'')+(inv.length?inv.slice(0,S.bagAll?40:12).map(it=>itemHtml(it,cmp(it)+`<button class="small" data-eq="${it.id}">Надеть</button>${U.synergy?`<button class="small" data-keep="${it.id}" title="Тайник: не продаётся">${it.kept?'📦 ✓':'📦'}</button>`:''}${U.shop&&!it.kept?`<button class="small" data-dis="${it.id}">Продать ${fmt(it.value)}💰</button>`:''}`)).join(''):'<div class="hint">Пусто — сходите в поход!</div>');
 }
 $('shopCard').hidden=!U.shop;
 if(U.shop&&act('shop')){const sh=[['hp','❤️','+12 HP',`ур. ${S.hpUp}`],['dmg','⚔️','+3 урона',`ур. ${S.dmgUp}`],['maxE','⚡','+10 макс. энергии',`${G.maxEnergy(S)}`],
  ['regen','⏱️','Быстрее энергия',`${G.regenSec(S).toFixed(1)}с за ед.`],['boots','👢','Сапоги: походы быстрее',`ур. ${S.bootsUp}`],['bag','🎒','Сумка: +1 предмет за этап',`${G.rolls(S)} предм.`],
  ['chips','🎲','+1 фишка удачи',`${S.chips}`+(G.rule(S,'chip')?' (+1 сет)':'')],['guide','G','Проводник: −3% риска',`ур. ${S.guideUp}`],['lens','🔍','Линза: +5% к редким',`ур. ${S.lensUp}`],['doors','C','+1 сундук у проводника',`${G.doors(S)}`],['stash','📦','Тайник: +3 места',`${G.stashCap(S)} мест`],['scroll','📜','Свиток защиты (от понижения)',`есть ${S.scrolls}`],['bayes','📘','Книга Байеса: показывает вероятность мимика',S.bayesUp?'куплено':'']];
  $('shop').innerHTML=sh.filter(x=>G.shopAvail(S,x[0])).map(([k,ic,n,cur])=>{const c=G.SHOP[k](S);const icon=ic==='G'?ART.compass():ic==='C'?ART.chest():`<span style="font-size:1.5rem">${ic}</span>`;
   return `<button data-buy="${k}" ${S.gold>=c?'':'disabled'}>${icon}<span>${n}<br><small>${cur} · ${c===Infinity?'макс.':fmt(c)+'💰'}</small></span></button>`}).join('');}
 save();}
function renderMonty(){const p=S.monty.pending;$('montyCard').hidden=!p;if(!p)return;const g=p.guide>=0?S.monty.guides[p.guide].name:'Проводник';
 const doors=[...Array(p.n).keys()].map(i=>{const open=p.opened.includes(i)||p.done;const isP=i===p.prize;
  const cls='door'+(i===p.pick?' pick':'')+(open?(isP?' prize':' empty'):'');const lab=open?(isP?'💰 приз':'пусто'):(i===p.pick?'ваш':p.hint===i&&!p.done?'👁 пусто':p.peekI===i?(isP?'🔍 приз!':'🔍 пусто'):'?');
  return `<button class="${cls}" data-door="${i}" ${p.done?'disabled':''}>${ART.chest()}<span>${i+1}: ${lab}</span></button>`}).join('');
 const peekB=!p.done&&(S.cons.peek||0)>0&&p.peekI===undefined?`<button class="small" data-peek="1">🔍 Подсмотреть один сундук (${S.cons.peek})</button>`:'';
 const gk=p.guide>=0&&S.monty.guess[p.guide]==='ok'?S.monty.guides[p.guide].type:null;let msg;if(p.pick===null)msg=`Сундуков: <b>${p.n}</b>, в одном сокровище. После выбора откроют <b>${p.k||p.n-2}</b> пуст.${p.guide>=0?` С вами <b>${g}</b>${gk?` (${G.GT_RU[gk]})`:' (характер неизвестен)'}.`:''} Выберите сундук.`;
 else if(p.stepMode)msg=`${g} открывает пустые по одному. Нажмите на любой закрытый сундук, чтобы перейти к нему, или на свой, чтобы остаться. Ведущий откроет ещё один пустой. ${gk==='classic'?`<br><small>Совет: держитесь до конца и поменяйте в последний момент — выигрыш (N−1)/N = ${pct((p.n-1)/p.n)}.</small>`:''}`;
 else if(p.offer===false)msg=`${g} не предложил обмен, остаётся ваш выбор. `+(p.win?`🎉 Сокровище: ${itemHtml(p.reward)}`:`Пусто. Утешительные ${p.reward}💰.`);
 else if(!p.done)msg=p.revealed?`${g} нечаянно открыл сундук с призом! Забирайте.`:`${g} открыл пуст${p.opened.length>1?'ые':'ой'}. Остаться при своём (№${p.pick+1}) или поменять?${gk==='classic'?` <br><small>Знающий: обмен выигрывает (N−1)/(N(N−k−1)) = ${pct(G.switchWin(p.n,p.k||p.n-2))}, остаться: ${pct(1/p.n)}.</small>`:gk?`<br><small>${G.GT_RULE[gk]}</small>`:''}`;
 else msg=p.win?`🎉 Сокровище: ${itemHtml(p.reward)}${p.bonus?`<br>🔑 Бонус маршрута: ${G.CONS[p.bonus].ic} ${G.CONS[p.bonus].ru}`:''}`:`Пусто. Утешительные ${p.reward}💰.`;
 const st=S.monty.stats,r=x=>x[1]?`${x[0]}/${x[1]} (${pct(x[0]/x[1])})`:'—';
 $('monty').innerHTML=`<div>${msg}</div><div class="doors">${doors}</div>${peekB}${p.done?'<button id="mclose" class="big">Дальше</button>':''}
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
  return `<div class="item ${done?'legendary':''}"><div class="txt"><b>${st.ru}</b> <small>(${G.LX(i).name})</small><br>${[...Array(G.SET_N).keys()].map(k=>`<span class="trophy ${a.includes(k)?'got':''}">${k+1}</span>`).join('')}
  <div class="af">Бонус: +${st.v}% ${G.AFFIXES.find(x=>x.k===st.bonus).ru} · ${done?'<b class="good">активен</b>':`ожидается ещё ≈${G.expRemaining(a.length).toFixed(1)} полных походов`}</div></div></div>`}).join('')+
  '<div class="hint">Каждый полностью пройденный поход даёт случайный трофей из 5. Чем больше собрано, тем чаще дубликаты: ожидание = 5·(1/1+…+1/k) для k недостающих.</div>';}
function renderGuides(){const gs=S.monty.guides;$('guidesCard').hidden=!gs;if(!gs)return;const r=x=>x&&x[1]?`${x[0]}/${x[1]} (${pct(x[0]/x[1])})`:'—';
 $('guides').innerHTML=`<div class="hint">У каждого проводника свой характер, и он меняет лучшую стратегию. Кто есть кто, неизвестно: выясняйте по истории (Байес). Угадали — +15💎.</div>`+gs.map((g,i)=>{const ok=S.monty.guess[i]==='ok';const n=(g.stats.offer||[0,0])[1];
 return `<div class="item guide">${ART.guide(i%3)}<div class="txt"><b>${g.name}</b>${ok?` · <span class="good">${G.GT_RU[g.type]}</span><br><small>${G.GT_RULE[g.type]}</small>`:''}${g.stats.offer[1]?`<div class="af">предлагал обмен: ${r(g.stats.offer)} · остаться: ${r(g.stats.stay)} · поменять: ${r(g.stats.switch)}</div>`:''}
 ${ok?'':n<5?`<small>Угадать характер можно после 5 раундов (сыграно ${n})</small>`:`<div class="btns">${G.GTYPES.map(t=>`<button class="small" data-guess="${i}" data-gt="${t}">${G.GT_RU[t]}</button>`).join('')}</div>`}</div></div>`;}).join('')+
 `<details><summary class="hint">Характеры проводников</summary>${G.GTYPES.map(t=>`<p class="hint"><b>${G.GT_RU[t]}:</b> ${G.GT_RULE[t]}</p>`).join('')}<p class="hint">Подсказка: Коварный предлагает обмен редко (≈1/N раундов), Добрый — почти всегда. Ошибка в догадке сбрасывает статистику.</p></details>`+
 `<div class="row"><button id="montyGo" class="big" ${S.monty.pending?'disabled':''}>${S.energy<3?'🎯 Тренировка (бесплатно, награда крошечная)':'🎁 Сыграть раунд (⚡3)'}</button></div><div class="hint">Ещё чаще комнаты сундуков встречаются на маршруте похода (🎁): чем глубже этап, тем больше сундуков.</div>`;}
function renderHowto(){$('howto').innerHTML=['start',...G.UNLOCKS.map(u=>u.k).filter(k=>S.unl[k]&&HELP[k])].map(k=>`<p><b>${HELP[k][0]}.</b> ${HELP[k][1]}</p>`).join('')+'<p class="hint">Остальное откроется по мере игры.</p>';}
function guessMsg(h){const t=document.createElement('div');t.innerHTML=h;toast(t.textContent);}
let lastCard=null;function afterRun(){const c=G.drawCard(S,S.loc);lastCard=c;if(!G.maybeMonty(S)&&!G.maybeMimic(S))G.maybeSecretary(S);return c;}
function cardHtml(c){if(!c)return'';return `<p>🃏 Карта колоды: <b>${c.ru}</b>${c.gold?` +${fmt(c.gold)}💰`:''}${c.reshuffle?' · колода перетасована':''}</p>${c.item?itemHtml(c.item,'',3):''}`;}
function renderDeck(){$('deckCard').hidden=!S.unl.deck;if(!S.unl.deck)return;const d=G.deckOf(S,S.loc),N=G.deckLeft(d);
 $('deck').innerHTML=`<div class="hint">В колоде «${G.LX(S.loc).name}» осталось ${N} из ${G.DECK_N} карт. Играть отдельно не нужно: после каждого сохранённого похода карта тянется сама, вытянутые не возвращаются.${lastCard?` Последняя: <b>${lastCard.ru}</b>.`:''}</div>
 <table><tr><th>Карта</th><th>Осталось</th><th>Следующая</th><th>За 3 похода</th></tr>${G.DECK.map(c=>`<tr><td>${c.ru}</td><td>${d[c.k]}/${c.n}</td><td>${pct(N?d[c.k]/N:0)}</td><td>${pct(G.pWithin(d,c.k,3))}</td></tr>`).join('')}</table>`;}
function renderSec(){const m=S.sec;$('secCard').hidden=!m;if(!m)return;const it=G.secCur(S);const sb=G.secSeenBest(S);const sc=Math.round(G.score(it));
 $('sec').innerHTML=`<div>Странник показывает товары по одному: <b>${m.i+1} из ${G.SEC_N}</b>. Можно забрать один бесплатно — но вернуться к пропущенному нельзя.</div>${itemHtml(it)}
 <div class="hint">Ценность: <b>${sc}</b> · лучшая из виденных: ${sb<0?'—':Math.round(sb)} ${sb>=0&&sc>sb?'<b class="good">— это лучше всех до сих пор!</b>':''}</div>
 <div class="row"><button id="secTake" class="ok">Забрать</button><button id="secPass" ${m.i>=G.SEC_N-1?'disabled':''}>Дальше ➡️</button></div>`;}
let DPOL='norm';
function afterRouteDive(){if(S.pendingNode!==undefined&&!S.dive){if(S.run&&S.run.waiting)G.continueRun(S,Date.now(),S.pendingNode);delete S.pendingNode;}}
function renderDive(){afterRouteDive();$('diveCard').hidden=!S.unl.dive;if(!S.unl.dive)return;$('diveCard').toggleAttribute('data-ev',!!(S.dive&&S.dive.route));const d=S.dive,D=G.DIVE;const p=d?d.p:G.diveP(S);const x=d?d.x:D.A;const mx=d?d.max:D.A;
 const potG=d?d.pot.gold:0,potI=d?d.pot.items:[];const RIC=['⚪','🟢','🔵','🟣','🟠'];
 let bar='';for(let y=0;y<=D.N;y++){const it=D.ITEMS[y];bar+=`<div class="dcell ${y===x&&d?'here':''} ${y<=mx&&y>D.A&&d?'got':''} ${y===0?'top':''} ${y===D.N?'bot':''}"><span>${y===0?'⛰ поверхность':y===D.N?'дно':y}</span>${it!==undefined?`<i>${y<=mx&&d?'✔':RIC[it]} ${G.RAR_RU[G.RARS[it]]}</i>`:''}${y>D.A?`<em>${fmt(G.diveCash(S,y))}💰</em>`:''}${y===x&&d?'<b>🧗</b>':''}</div>`;}
 const pol=Object.entries(G.DSTEP).map(([k,P])=>{const sp=d?G.diveStepP(S,k):Math.max(0.05,Math.min(0.95,p+P.dp));const fin=G.divePolicyP(p,x,D.N,k,d&&d.rope);
  return `<button class="${k===DPOL?'sel':''} ${d?'big':''}" data-dpol="${k}" ${!d||(P.e&&S.energy<P.e)?'disabled':''}>${P.ic} ${P.ru}${P.e?` (⚡${P.e})`:''}<br><small>успех ${pct(sp)} → ${P.m>1?'+2 вниз':'+1 вниз'}; провал −1<br>до дна так: ${pct(fin)}</small></button>`;}).join('');
 $('dive').innerHTML=`${d&&d.route?'<div class="dgoal"><b>🕳️ Шахта на маршруте.</b> Добыча пойдёт в мешок похода. После выхода поход продолжится.</div>':''}<div class="dgoal"><b>Цель:</b> спуститься поглубже, собрать добычу и вовремя выйти. Если поднимет до поверхности (0), всё собранное пропадёт.</div>
 <div class="dwrap"><div class="dbar">${bar}</div><div class="dside">
 <div class="kv"><span>Глубина</span><b>${x} / ${D.N}</b><span>Шанс шага вниз</span><b>${pct(p)}${d&&d.nextT!==null?` <span class="${d.nextT>0?'good':d.nextT<0?'bad':''}">(факел: ${d.nextT>0?'+10%':d.nextT<0?'−10%':'±0'})</span>`:''}</b>
 <span>В мешке сейчас</span><b>${fmt(potG)}💰${potI.length?' + '+potI.map(i=>RIC[i.r]).join(''):''}</b><span>На дне будет</span><b>${fmt(G.diveCash(S,D.N))}💰 + ${Object.values(D.ITEMS).map(r=>RIC[r]).join('')}</b></div>
 ${d?`<div class="row"><button data-dbuy="rope" class="small" ${d.rope||(S.gold<G.ropeCost(S)&&!(S.cons.rope>0))?'disabled':''}>🪢 Верёвка ${d.rope?'✔':S.cons.rope>0?'(есть '+S.cons.rope+')':fmt(G.ropeCost(S))+'💰'}</button><button data-dbuy="torch" class="small" ${d.nextT!==null||(S.gold<G.torchCost(S)&&!(S.cons.torch>0))?'disabled':''}>🔦 Факел ${S.cons.torch>0?'(есть '+S.cons.torch+')':fmt(G.torchCost(S))+'💰'}</button></div><small>Верёвка спасает от одного провала. Факел показывает, легче или труднее следующий шаг (±10%).</small>`:''}
 </div></div>
 ${d?`<div class="dpol">${pol}</div><div class="row"><button id="dcash" class="ok big" ${potG<=0&&!potI.length&&!d.route?'disabled':''}>💰 Забрать и выйти (${fmt(potG)}💰${potI.length?' + '+potI.length+' предм.':''})</button></div>`:`<div class="row"><button id="dstart" class="big" ${S.energy<D.cost&&!(S.diveFree>0)?'disabled':''}>⛏ Спуститься (${S.diveFree>0?"бесплатно: шахта":"⚡"+D.cost})</button></div>`}
 <div class="hint">🔥 Смелый шаг тем опаснее, чем глубже и чем больше смелых шагов подряд. 🟢 Осторожный стоит ⚡1 и подсвечивает следующий шаг, как факел. Обычный шаг понемногу тяжелеет с глубиной. Найденное на новой глубине сразу кладётся в мешок, даже если потом откинет назад. Теги 🌑 Тень и 🍀 Удача на снаряжении: +1% к шагу за каждую вещь. «До дна так» считается точно (задача о разорении игрока), если всё время ходить выбранным шагом. Погружений: ${S.diveStats.n}, до дна: ${S.diveStats.top}, разорений: ${S.diveStats.ruin}.</div>`;}
let EQCH=null;
function eqChoiceHtml(){if(!EQCH)return'';return `<div class="eqchoice"><b>«Надеть лучшее» сломает бонус сета: ${EQCH.lost.map(g=>`<span class="r-set">${g.ru}</span>`).join(', ')}</b><br><small>Сила это только урон и HP. Бонусы сета (золото, удача, риск, особое правило) в силу не входят.</small><div class="row"><button id="eqBest">💪 Макс. сила (${EQCH.pb})</button><button id="eqKeep" class="ok">🟩 Сохранить сет (${EQCH.pk})</button></div></div>`;}
function gsetHtml(){const any=G.GSETS.some(g=>G.ownedPieces(S,g.k).size);if(!any)return'';const cnt=G.setCount(S);const best=Math.max(0,...S.cleared);const AF=k=>AFRU[k];
 const found=G.GSETS.filter(g=>G.ownedPieces(S,g.k).size);const rest=G.GSETS.filter(g=>!found.includes(g));const rows=found.map(g=>{const own=G.ownedPieces(S,g.k);const n=cnt[g.k]||0;const loc=Math.max(g.loc,Math.min(best+1,S.loc));const L=S.loc>=g.loc?S.loc:null;
  const pcs=G.SLOTS.map((sl,i)=>`<span class="pc ${S[sl]&&S[sl].set===g.k?'on':own.has(sl)?'bag':''}" title="${g.names[i]}">${own.has(sl)?'✔':'·'} ${G.SLOT_RU[sl]}</span>`).join('');
  const b=(t,txt)=>`<div class="${n>=t?'act':''}">${t}: ${txt}</div>`;
  const prob=own.size>=6?'<small>Все части собраны.</small>':L===null?`<small>Падает в «${G.LX(g.loc).name}» и дальше. Выберите там поход, и здесь появится шанс.</small>`:`<small>${G.SLOTS.some(k=>!own.has(k)&&!G.slotsOpen(S).includes(k))?`Закрытые ячейки (${G.SLOTS.filter(k=>!own.has(k)&&!G.slotsOpen(S).includes(k)).map(k=>G.SLOT_RU[k]).join(', ')}) откроются позже. `:''}Шанс собрать недостающие ${G.slotsOpen(S).filter(k=>!own.has(k)).length} шт. в «${G.LX(L).name}»: за 10 походов ${pct(G.setComplete(S,L,g,10))}, за 30 — ${pct(G.setComplete(S,L,g,30))}, за 100 — ${pct(G.setComplete(S,L,g,100))}. Это задача о коллекционере: последние части ищутся дольше всего.</small>`;
  return `<div class="gset ${n>=2?'on':''}"><b class="r-set">🟩 ${g.ru}</b> <small>надето ${n}/6 · найдено ${own.size}/6 · ${G.TAGS[g.tag].ic} тег ${G.TAGS[g.tag].ru}</small><div class="pcs">${pcs}</div>${b(2,`+${g.b2.v}${AF(g.b2.k).unit} ${AF(g.b2.k).ru}`)}${b(4,`+${g.b4.v}${AF(g.b4.k).unit} ${AF(g.b4.k).ru}`)}${b(6,'<b>правило:</b> '+g.ruleRu)}${prob}</div>`;}).join('')+(rest.length?`<small>Ещё не найдены: ${rest.map(g=>`<span class="r-set">${g.ru}</span> (с локации «${G.LX(g.loc).name}»)`).join(', ')}.</small>`:'');
 return `<details class="gsets fold" ${S.openSets?'open':''} data-fold="openSets"><summary>🟩 Сеты <small>${G.GSETS.filter(g=>(cnt[g.k]||0)>=2).map(g=>`${g.ru} ${cnt[g.k]}/6`).join(', ')||'бонусов нет'}</small></summary><small>Сетовой (зелёной) может стать любая находка редкого качества и выше, шанс 30%. В половине случаев выпадает часть, которой у вас ещё нет.</small>${rows}</details>`;}
function synHtml(){if(!S.unl.synergy)return'';const tc=G.tagCount(S);const slots=G.slotsOpen(S);const ru=G.SLOT_RU;
 const rows=Object.entries(tc).map(([t,n])=>{const T=G.TAGS[t];const miss=slots.filter(sl=>!(S[sl]&&S[sl].tag===t));
  const inStash=miss.filter(sl=>S.inv.some(i=>i.slot===sl&&i.tag===t));
  const hint=n>=3?'':inStash.length?` · в сумке есть: ${inStash.map(sl=>ru[sl]).join(', ')}`:` · шанс найти ещё одну такую вещь за 5 походов: ${pct(1-miss.reduce((q,sl)=>q*(1-G.pieceChance(S,S.loc,sl,t,5)),1))}`;
  return `<div class="synrow ${n>=2?'on':''}"><b>${T.ic} ${T.ru} ${n}/3</b> — ${n>=3?T.b3:n>=2?T.b2+` (3: ${T.b3})`:`2: ${T.b2}`} <small>[${T.kind}]</small><br><small>${hint}</small></div>`;}).join('');
 return `<details class="syn fold" ${S.openSyn?'open':''} data-fold="openSyn"><summary>🏷 Синергии <small>${Object.entries(tc).filter(([t,n])=>n>=2).map(([t,n])=>G.TAGS[t].ic+n).join(' ')||'нет'} · тайник ${G.keptCount(S)}/${G.stashCap(S)}</small></summary>${rows||'<div class="hint">Наденьте 2–3 вещи с одинаковой меткой.</div>'}<div class="hint">«Надеть лучшее» считает только силу (🔥❄️). Пользу (🍀🌑🎯) выбирайте сами.</div></details>`;}
function celebrate(){if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.body.classList.remove('shake');void document.body.offsetWidth;document.body.classList.add('shake');
 const cols=['#f08a00','#ffd166','#8e44c9','#2f7fd8','#3fa34d'];for(let i=0;i<36;i++){const e=document.createElement('i');e.className='confetti';e.style.left=Math.random()*100+'vw';
  e.style.background=cols[i%5];e.style.animationDelay=Math.random()*0.3+'s';e.style.setProperty('--dx',(Math.random()*120-60)+'px');document.body.appendChild(e);setTimeout(()=>e.remove(),2000);}}
const TABS=[['run','⚔️','Поход',()=>1],['hero','🛡️','Снаряжение',()=>1],['games','🎲','Испытания',U=>U.monty||U.deck||U.dive||U.kelly],['shop','🪙','Лавка',U=>U.shop]];
const GAMES=[['guidesCard','🎁','Сундуки',U=>U.monty&&S.monty.guides],['diveCard','🕳️','Погружение',U=>U.dive],['kellyCard','🪙','Монета',U=>U.kelly],['deckCard','🃏','Колода',U=>U.deck],['arenaCard','🤺','Арена',U=>U.duel]];
function renderTabs(){const U=S.unl;const on=!!U.shop;document.body.classList.toggle('tabs',on);$('tabs').hidden=!on;
 const av=TABS.filter(t=>t[3](U));if(S.tab!=='stats'&&!av.find(t=>t[0]===S.tab))S.tab='run';$('menu').hidden=!on;$('menu').classList.toggle('sel',S.tab==='stats');
 const better=S.inv.some(isBetter);
 $('tabs').innerHTML=av.map(t=>`<button data-tab="${t[0]}" class="${S.tab===t[0]?'sel':''}"><i>${t[1]}</i><span>${t[2]}</span>${t[0]==='hero'&&better&&S.tab!=='hero'?'<span class="dot"></span>':''}</button>`).join('');
 const gs=GAMES.filter(g=>g[3](U));if(!gs.find(g=>g[0]===S.game))S.game=gs.length?gs[0][0]:null;
 if(S.tab==='games')$('gameTiles').innerHTML=gs.map(g=>`<button class="tile ${S.game===g[0]?'sel':''}" data-game="${g[0]}"><i>${g[1]}</i><span>${g[2]}</span></button>`).join('');
 document.querySelectorAll('main [data-tab]').forEach(el=>el.classList.toggle('off',!(el.id==='diveCard'&&S.dive&&S.dive.route)&&(on&&el.dataset.tab!==S.tab||(S.tab==='games'&&el.id&&GAMES.some(g=>g[0]===el.id)&&el.id!==S.game))));
 const ev=['montyCard','secCard','mimicCard','shrineCard','duelCard'].some(k=>!$(k).hidden)||!!(S.dive&&S.dive.route);document.body.classList.toggle('evopen',ev);tutCheck();tutHtml();}
let AC=null;function beep(f,d=0.12,v=0.05){if(!S.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();
 o.frequency.value=f;o.type='sine';g.gain.value=v;g.gain.exponentialRampToValueAtTime(0.0001,AC.currentTime+d);o.connect(g).connect(AC.destination);o.start();o.stop(AC.currentTime+d);}catch(e){}}
function lootSound(items){if(!items.length)return;const r=Math.max(...items.map(i=>i.r));beep(330+r*110,0.15);if(r===4)setTimeout(()=>beep(880,0.3),150);}
function renderKelly(){const U=S.unl;$('kellyCard').hidden=!U.kelly;if(!U.kelly)return;const K=S.kelly;const f=S.kf??0.1;const st=Math.min(G.kellyCap(S),Math.floor(S.gold*f));
 $('kelly').innerHTML=`<div class="kv"><span>Шанс выигрыша монеты</span><b>${pct(K.p)}</b><span>Выплата</span><b>1:1</b><span>Жетоны ставок</span><b>${K.tokens}/10</b>
 <span>Доля золота</span><b>${pct(f)} = ${fmt(st)}💰</b><span>Ожидаемый лог-рост за ставку</span><b class="${G.kellyGrowth(K.p,f)>0?'good':'bad'}">${(G.kellyGrowth(K.p,f)*100).toFixed(2)}%</b>
 <span>Макс. ставка (растёт с прогрессом)</span><b>${fmt(G.kellyCap(S))}💰</b><span>Итог ставок</span><b>${K.bets} ставок, ${K.profit>=0?'+':''}${fmt(K.profit)}💰</b></div>
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
function showReport(h){$('reportCard').hidden=false;if(h.includes('item legendary'))celebrate();const better=S.inv.some(isBetter);$('report').innerHTML=h+(better?'<div class="row"><button id="autoeq2" class="ok small">Надеть лучшее</button></div>':'');}
function stage(){const lvl0=S.lvl;const r=G.rollStage(S);if(!r)return;lootSound(r.drops);if(r.died)beep(140,0.4);
 let h=S.unl.stages?`<p><b>Этап ${r.stage}</b></p>`:'';
 if(r.chips.length)h+=`<p class="hint">Фишки: ${r.chips.map(x=>`<span class="r-${G.RARS[G.CHIP_T[x.t].r]}">${G.CHIP_T[x.t].ru} ${x.k}/${x.n}${x.k&&!x.paid?' — ниже порога':''}</span>`).join(', ')}</p>`;
 if(r.revived)h+=`<p class="good">✨ Второй шанс спас героя от гибели!</p>`;
 if(r.cash)h+=`<p class="hint">🔥 Мелочь переплавлена: +${fmt(r.cash)}💰 и материалы (в мешке до возвращения).</p>`;if(r.cons)h+=`<p class="good">Найдено: ${r.cons.map(k=>G.CONS[k].ic+' '+G.CONS[k].ru).join(', ')}</p>`;if(r.potion)h+=`<p class="good">🧪 Зелье лечения спасло от гибели!</p>`;
 if(r.died)h+=`<p class="bad">☠️ Герой пал (риск был ${pct(r.dc)}). Потеряно предметов: ${r.lost}${r.lostGold?` (${fmt(r.lostGold)}💰)`:''}.${r.kept?` Страховка сохранила ${r.kept}.`:''}${r.heal?` Нужно лечение: ${Math.round(r.heal/1000)}с.`:''}${r.elost?` −${r.elost}⚡.`:''}${r.down?` ${r.down} потерял уровень улучшения.`:''}${r.scroll?` Свиток защитил ${r.scroll}.`:''}</p>`;
 h+=r.drops.map((x,i)=>itemHtml(x,S[x.slot]&&G.score(x)>G.score(S[x.slot])||!S[x.slot]?'<span class="badge better">▲</span>':'',i+1)).join('');
 if(r.trophy){const t=r.trophy,st=G.SETS[t.loc];h+=t.dup?`<p>🏺 Трофей «${st.ru}» №${t.k+1} — дубликат (+${t.gold}💰).</p>`:`<p class="good">🏺 Новый трофей «${st.ru}» №${t.k+1}!${t.done?' Коллекция собрана — бонус активен!':''}</p>`;}
 if(r.shards)h+=`<p>💎 +${r.shards} оск.</p>`;if(S.lvl>lvl0)h+=`<p class="good">⭐ Новый уровень: ${S.lvl}!</p>`;
 if(r.bank){h+=`<p class="good">🏠 ${r.finished&&S.unl.stages?'Локация пройдена до конца! ':''}Добыча сохранена: ${r.bank.items.length} предм. (${fmt(r.bank.gold)}💰)${r.bank.sold?`, автопродажа +${fmt(r.bank.sold)}💰`:''}.</p>`;h+=cardHtml(afterRun());}
 showReport(h);unlocks();checkWin();render();}
document.addEventListener('toggle',e=>{const f=e.target.dataset&&e.target.dataset.fold;if(f)S[f]=e.target.open;},true);
addEventListener('change',e=>{if(e.target.id==='baitTag'){S.arm=S.arm||{};S.arm.baitTag=e.target.value;render();}if(e.target.id==='useScroll'){S.useScroll=e.target.checked;render();}});
document.addEventListener('input',e=>{if(e.target.id==='kf'){S.kf=+e.target.value;const y=window.scrollY;renderKelly();const k=$('kf');if(k)k.focus();}});
function applyColl(){document.querySelectorAll('main section.card[id]').forEach(el=>{if(el.id==='runCard')return;el.classList.toggle('collapsed',!!S.coll[el.id]);const h=el.querySelector('h2');if(h)h.classList.add('coll');});}
document.addEventListener('click',e=>{const hh=e.target.closest('h2.coll');if(hh&&!e.target.closest('.tip')){const id=hh.closest('section').id;S.coll[id]=!S.coll[id];applyColl();save();return;}});
document.addEventListener('click',e=>{const tp=e.target.closest('.tip');if(tp){MQ.push(TIPS[tp.dataset.tip]);showModal();return;}
 const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
 if(d.loc!==undefined){S.loc=+d.loc;$('eval').innerHTML='';}
 else if(d.p!==undefined){if(usedChips()<G.chipTotal(S))S.alloc[+d.p]++;$('eval').innerHTML='';}
 else if(d.m!==undefined){if(S.alloc[+d.m]>0)S.alloc[+d.m]--;$('eval').innerHTML='';}
 else if(d.door!==undefined){const p=S.monty.pending;const i=+d.door;if(p.pick===null)G.montyPick(S,i);else if(p.stepMode)G.montyStep(S,i);else if(!p.done&&(i===p.pick||G.montyClosed(p).includes(i)||(p.revealed&&i===p.prize)))G.montyFinal(S,i);}
 else if(b.id==='winx')S.winHidden=1;
 else if(b.id==='mclose')G.montyClear(S);
 else if(b.id==='dstart')G.diveStart(S);
 else if(d.dpol){DPOL=d.dpol;const r=G.diveStep(S,Math.random,d.dpol);if(!r){}else if(r.end==='ruin'){beep(150,0.3);showReport(`<p class="bad">🕳️ Подняло на поверхность. Добыча из мешка потеряна (${fmt(r.lost.gold)}💰${r.lost.items.length?' + '+r.lost.items.length+' предм.':''}).</p>`);}else if(r.end==='top'){celebrate();showReport(`<p class="good">🏆 Дно! +${fmt(r.gold)}💰</p>${r.items.map(i=>itemHtml(i,'',1)).join('')}`);}else{beep(r.ok?660:r.saved?440:220,0.08);if(r.saved)toast('🪢 Верёвка удержала!');r.got.forEach(i=>toast('🎁 В мешок: '+i.name));}}
 else if(d.dbuy){G.diveBuy(S,d.dbuy);}
 else if(b.id==='dcash'){const r=G.diveCashOut(S);if(r)showReport(`<p class="good">Вышли с глубины ${r.x}: +${fmt(r.gold)}💰${r.route?' в мешок похода':''}</p>${r.items.map(i=>itemHtml(i,'',1)).join('')}`);}
 else if(b.id==='secTake'||b.id==='secPass'){const r=b.id==='secTake'?G.secTake(S):G.secPass(S);if(r&&r!=='next')showReport(`<p>Вы взяли товар №${r.all.indexOf(r.it)+1}: он ${r.rank===1?'<b class="good">лучший из всех 8!</b>':`${r.rank}-й по ценности из 8.`}</p>${itemHtml(r.it,'',1)}<p class="hint">Стратегия «1/e»: пропустить первые ~3 и взять первый, кто лучше всех виденных — так лучший достаётся ~40% раз.</p>`);}
 else if(b.id==='knock'){G.knock(S);}
 else if(b.id==='mopen'||b.id==='mleave'){const r=G.resolveMimic(S,b.id==='mopen');mimicReport(r);}
 else if(d.tab){S.tab=d.tab;window.scrollTo&&window.scrollTo(0,0);}
 else if(b.id==='snd'){S.sound=S.sound?0:1;beep(660);}
 else if(b.id==='kbet'){if((S.kf??0.1)>0.5&&!b.dataset.ok){b.dataset.ok=1;b.textContent='Точно? Нажмите ещё раз';return;}const r=G.kellyBet(S,S.kf??0.1);if(r){beep(r.win?880:200);showReport(`<p class="${r.win?'good':'bad'}">🪙 ${r.win?'Выигрыш':'Проигрыш'}: ${r.win?'+':'−'}${fmt(r.stake)}💰 (шанс был ${pct(r.p)}, ваша доля ${pct(r.f)}, Келли: ${pct(r.opt)})</p>`);}}
 else if(b.id==='kopt'){S.kf=Math.round(G.kellyOpt(S.kelly.p)*100)/100;}
 else if(d.perk){if(confirm('Переродиться? Прогресс текущего пути сбросится.')){G.rebirth(S,d.perk);$('reportCard').hidden=true;}}
 else if(b.id==='summary'){MQ.push(luckSummary());showModal();return;}
 else if(b.id==='autosell'){S.autoSell=(S.autoSell+1)%4;}
 else if(d.guess!==undefined){const r=G.guessGuide(S,+d.guess,d.gt);guessMsg(r==='ok'?'<p class="good">Верно! +15 💎</p>':r==='few'?'<p>Мало данных: нужно хотя бы 5 раундов с этим проводником.</p>':'<p class="bad">Неверно. Статистика проводника сброшена.</p>');}
 else if(d.keep){if(G.toggleKeep(S,+d.keep)==='full')showReport('<p>Тайник полон — расширьте его в лавке.</p>');}
 else if(d.eq)G.equip(S,+d.eq);else if(d.dis)G.dismantle(S,+d.dis);else if(d.buy)G.buy(S,d.buy);else if(d.up){const r=G.upgradeItem(S,d.up,!!S.useScroll);if(r&&r!=='ok')showReport({fail:'<p>Улучшение не удалось (уровень сохранён).</p>',down:'<p class="bad">Провал! Уровень понижен на 1.</p>',saved:'<p>Провал, но свиток защиты спас уровень.</p>'}[r]);}
 else if(b.id==='pity'){const it=G.craftPity(S);if(it)showReport('<p>Создано:</p>'+itemHtml(it));}
 else if(b.id==='go'){G.startRun(S);}
 else if(b.id==='heal'){G.healNow(S);}
 else if(b.id==='bagAll'){S.bagAll=!S.bagAll;}
 else if(d.tutn&&S.tut){S.tut.i++;if(S.tut.i>=TUT[S.tut.k].length-1){S.tutSeen[S.tut.k]=1;S.tut=null;}}
 else if(d.tutx&&S.tut){S.tutSeen[S.tut.k]=1;S.tut=null;}
 else if(d.tut){S.tutSeen=S.tutSeen||{};S.tut={k:d.tut,i:0};}
 else if(b.id==='expSave'){save();const t=$('saveCode');t.hidden=false;t.value=btoa(unescape(encodeURIComponent(JSON.stringify(S))));t.select();try{navigator.clipboard&&navigator.clipboard.writeText(t.value);toast('Код скопирован');}catch(e){}}
 else if(b.id==='impSave'){const t=$('saveCode');if(t.hidden||!t.value.trim()){t.hidden=false;t.value='';t.focus();toast('Вставьте код и нажмите «Импорт» ещё раз');}else{let n=null;try{n=G.load(decodeURIComponent(escape(atob(t.value.trim()))));}catch(e){}if(!n)toast('Код не подошёл');else if(confirm('Заменить текущий прогресс импортированным?')){try{localStorage.setItem(KEY+'_bak_'+Date.now(),JSON.stringify(S));}catch(e){}S=n;RC=null;save();t.value='';t.hidden=true;toast('Сохранение загружено');}}}
 else if(d.attr){G.attrAdd(S,d.attr);}else if(b.id==='attrReset'){G.attrReset(S);}
 else if(b.id==='duelGo'){const pr=S.energy<G.DUEL_COST;G.duelStart(S,Math.random,{free:pr,practice:pr});S.dA=S.dB=null;}
 else if(d.da!==undefined){S.dA=+d.da;}else if(d.db!==undefined){S.dB=+d.db;}
 else if(b.id==='duelHit'&&S.duel&&S.dA!=null&&S.dB!=null){const r=G.duelRound(S,S.dA,S.dB);if(r){beep(r.hit?660:330);}}
 else if(b.id==='duelEnd'){G.duelEnd(S);S.dA=S.dB=null;}
 else if(d.skin&&G.skinOk(S,d.skin)){S.skin=d.skin;}
 else if(d.abyss&&!S.run){const cur=S.loc>=G.BASE_N?S.loc-G.BASE_N+1:0;const n=Math.max(1,Math.min(G.abyssMax(S)+1,cur+(+d.abyss)));S.loc=G.BASE_N-1+n;}
 else if(d.shr!==undefined){const f=+d.shr;if(f>0){const r=G.shrineBet(S,f);if(r)toast(r.win?`⛩ Выигрыш +${fmt(r.st)}💰 в мешок`:`⛩ Проигрыш −${fmt(r.st)}💰`);}S.shrineOpen=0;}
 else if(b.id==='menu'){S.tab=S.tab==='stats'?'run':'stats';}
 else if(d.game){S.game=d.game;}
 else if(d.arm){S.arm=S.arm||{};S.arm[d.arm]=!S.arm[d.arm];if(d.arm==='bait'&&!S.arm.baitTag)S.arm.baitTag='fire';}
 else if(d.cbuy){G.buyCons(S,d.cbuy,d.how);}
 else if(d.peek!==undefined){const p=S.monty.pending;if(p&&S.cons.peek>0&&p.peekI===undefined){S.cons.peek--;const c=[...Array(p.n).keys()].filter(i=>i!==p.pick&&!p.opened.includes(i));p.peekI=c[Math.floor(Math.random()*c.length)];}}
 else if(b.id==='cont'){G.continueRun(S);}
 else if(d.node!==undefined){const r=S.run;const t=((r.route&&r.route[r.stage])||['fight'])[+d.node]||'fight';if(t==='shaft'&&G.diveRoute(S)){S.pendingNode=+d.node;}else{G.continueRun(S,Date.now(),+d.node);nodeEvent(t);}}
 else if(b.id==='ret'){if(!S.run)return;const r=G.bank(S);showReport(`<p class="good">🏠 Вернулись. Сохранено ${r.items.length} предм. (${fmt(r.gold)}💰)${r.sold?`, автопродажа +${fmt(r.sold)}💰`:''}.</p>`+r.items.slice(-6).map((x,i)=>itemHtml(x,'',i+1)).join('')+cardHtml(afterRun()));}
 else if(b.id==='evalb'){runEval();return;}
 else if(b.id==='autoeq'||b.id==='autoeq2'||b.id==='autoeq3'){const ch=G.equipBest(S);if(b.id==='autoeq2')b.remove();if(ch){EQCH=ch;S.tab='hero';}}
 else if(b.id==='eqBest'||b.id==='eqKeep'){G.equipBest(S,b.id==='eqBest'?'best':'keep');EQCH=null;}
 else if(b.id==='disAll'){S.inv.filter(i=>S[i.slot]&&G.score(i)<=G.score(S[i.slot])).map(i=>i.id).forEach(id=>G.dismantle(S,id));}
 else if(b.id==='montyGo'){const pr=S.energy<3;if(!S.monty.pending&&G.maybeMonty(S,Math.random,true,0,pr)){if(!pr)S.energy-=3;S.tab='run';setTimeout(()=>{const e=document.getElementById('montyCard');e&&e.scrollIntoView({behavior:'smooth'});},50);}}
 else if(d.stance!==undefined){S.stance=+d.stance;}
 else if(b.id==='reset'){if(confirm('Сбросить весь прогресс?')){localStorage.removeItem(KEY);S=G.newState();MQ.length=0;EQCH=null;lastCard=null;RC=null;G.tickEnergy(S);$('reportCard').hidden=true;$('eval').innerHTML='';popup('start');}}
 else return;unlocks();checkWin();render();});
function checkWin(){if(S.won&&!S.summarySeen){S.summarySeen=1;MQ.push(luckSummary());showModal();}}
let lastT=Date.now(),saveT=0;
function tick(){const n=Date.now();if(!document.hidden)S.playMs+=Math.min(1000,n-lastT);lastT=n;if(n-saveT>3000){saveT=n;save();}if(S.run&&!S.run.waiting&&Date.now()>=S.run.endAt){stage();return;}const e=S.energy;header();const hs=Math.ceil(G.hurtLeft(S)/1000);if((S.energy!==e||hs!==window.__hs)&&!S.run){window.__hs=hs;render();}else tickProg();}
setInterval(tick,250);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){G.tickEnergy(S);offlineReport(G.offline(S));render();}else save();});
const offEv=G.offline(S);render();if(!S.runs&&!S.run&&!S.rebirths)popup('start');offlineReport(offEv);if(migrated)showReport('<p>Игра сильно обновилась — старое сохранение несовместимо, начинаем заново.</p>');
