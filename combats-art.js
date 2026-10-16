// combats-art.js — Combats-style paper doll + duel screen. Requires hero-art.js. Raster art optional:
// drop files into img/ (hero_t0..4.webp, skin_<k>.webp, item_<slot>_<q0..4>.webp, enemy_<k>.webp); SVG is the fallback.
(function(){const H=window.HeroArt;if(!H)return;
const SL=[['helm','Шлем'],['charm','Амулет'],['weapon','Оружие'],['armor','Броня'],['gloves','Перчатки'],['boots','Сапоги']];
const qOf=it=>Math.min(4,Math.max(it.r||0,H.tierOf(it)>=7?4:0));
const img=(src,fb,cls)=>`<span class="cb-img ${cls||''}"><img src="${src}" alt="" onerror="this.remove()">${fb}</span>`;
function itemCell(it,sl,ru,o){if(!it)return `<div class="cb-slot empty" title="${ru}"><span>${ru}</span></div>`;const over=Math.max(0,H.tierOf(it)-8);
 return `<div class="cb-slot q${qOf(it)}${it.set?' set':''}${over?' over':''}" title="${it.name||ru}">${H.renderItemIcon(it,{size:o.cell||56})}</div>`;}
// paper doll: hero centre, slots left/right (Combats layout)
function renderDoll(eq,o){o=o||{};eq=eq||{};const pt=Math.min(4,H.powerTier(o.power||0)),F=H.FRAMES[pt];
 const hero=H.portrait(eq,{skin:o.skin,power:o.power,size:o.size||300});
 const col=a=>`<div class="cb-col">${a.map(([k,ru])=>itemCell(eq[k],k,ru,o)).join('')}</div>`;
 return `<div class="cb-doll"><div class="cb-name">${o.name||'Герой'} <small>[${o.lvl||1}]</small></div>${col(SL.slice(0,3))}<div class="cb-center">${hero}${o.hp!=null?`<div class="cb-hp"><i style="width:${Math.max(0,Math.min(100,o.hp))}%"></i></div>`:''}</div>${col(SL.slice(3))}</div>`;}
const ENEMIES=[{k:'bandit',ru:'Разбойник',skin:'shade',r:1},{k:'orc',ru:'Орк-громила',skin:'wander',r:2},{k:'knight',ru:'Тёмный рыцарь',skin:'knight',r:3},{k:'boss',ru:'Владыка Бездны',skin:'lich',r:4,tier:12},{k:'boss2',ru:'Хладный Змей-Рыцарь',r:4,tier:12},{k:'boss3',ru:'Чумной Колосс',r:4,tier:12},{k:'boss4',ru:'Госпожа Судьба',r:4,tier:12}];
function enemyEq(e){const o={};SL.forEach(([k])=>o[k]={slot:k,r:e.r,tier:e.tier,id:k.length*3+e.r});return o;}
// duel: hero left, enemy right (mirrored), zone pick in the middle
function renderDuel(eq,o){o=o||{};const e=ENEMIES.find(x=>x.k===o.enemy)||ENEMIES[0];const Z=[['head','Голова'],['chest','Грудь'],['belly','Живот'],['waist','Пояс'],['legs','Ноги']];
 const zs=(n,t)=>`<div class="cb-zones"><b>${t}</b>${Z.map(([k,ru])=>`<label><input type="radio" name="${n}" value="${k}"${k==='chest'?' checked':''}> ${ru}</label>`).join('')}</div>`;
 const foe=H.portrait({},{enemy:e.k,power:[30,300,1500,90000][Math.min(4,e.r)-1],size:o.size||300});
 return `<div class="cb-duel">${renderDoll(eq,o)}<div class="cb-mid"><div class="cb-vs">VS</div>${zs('atk','⚔ Удар')}${zs('def','🛡 Блок')}<button class="cb-btn">Вперёд!</button></div><div class="cb-doll cb-enemy"><div class="cb-name">${e.ru}</div><div class="cb-center">${foe}<div class="cb-hp"><i style="width:${o.foeHp!=null?o.foeHp:100}%"></i></div></div></div></div>`;}
Object.assign(H,{renderDoll,renderDuel,ENEMIES});})();
