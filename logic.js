// Pure game logic (browser + node)
(function(root){
const BASE_P=[0.6,0.4,0.25,0.15,0.09,0.05,0.03,0.015,0.007,0.003];
const VALUE=[3,6,11,20,36,65,115,230,500,1400];
const RAR=['common','common','common','uncommon','uncommon','rare','rare','epic','epic','legendary'];
const RAR_RU={common:'Обычный',uncommon:'Необычный',rare:'Редкий',epic:'Эпический',legendary:'Легендарный'};
const LOCS=[
 {id:0,name:'Тихий лес',mult:1,lvl:1,threat:20,req:0},
 {id:1,name:'Туманные пещеры',mult:2,lvl:2.2,threat:70,req:45},
 {id:2,name:'Пепельная крепость',mult:3.5,lvl:4,threat:180,req:120},
];
const SHARDS_FOR_PITY=25;
function chance(loc,t){return Math.min(0.95,BASE_P[t]*Math.pow(LOCS[loc].mult,t/9));}
function value(loc,t){return Math.round(VALUE[t]*LOCS[loc].lvl);}
function binom(n,k){let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;}
function pmf(n,k,p){return binom(n,k)*Math.pow(p,k)*Math.pow(1-p,n-k);}
function pAtLeastOne(n,p){return 1-Math.pow(1-p,n);}
function ev(loc,alloc){let s=0;alloc.forEach((n,t)=>s+=n*chance(loc,t)*value(loc,t));return s;}
function greedyAlloc(loc,chips){const a=new Array(10).fill(0);let best=0,bv=-1;
 for(let t=0;t<10;t++){const v=chance(loc,t)*value(loc,t);if(v>bv){bv=v;best=t;}}a[best]=chips;return a;}
function newState(){return{gold:0,mats:0,shards:0,chips:20,hpUp:0,dmgUp:0,loc:0,
 alloc:[6,4,3,2,2,1,1,1,0,0],inv:[],weapon:null,armor:null,nextId:1,runs:0};}
function heroDmg(s){return 10+s.dmgUp*4+(s.weapon?s.weapon.power:0);}
function heroHp(s){return 50+s.hpUp*15+(s.armor?s.armor.power*3:0);}
function heroPower(s){return heroDmg(s)+heroHp(s)/3;}
function unlocked(s,l){return heroPower(s)>=LOCS[l].req||(s.weapon&&s.weapon.loc>=l)||(s.armor&&s.armor.loc>=l);}
function deathChance(s,l){const t=LOCS[l].threat;return Math.max(0.02,Math.min(0.75,0.5*t/(heroHp(s)+heroDmg(s)*2)))*(l===0?0.3:1);}
function makeItem(s,loc,t,rng){const slot=rng()<0.5?'weapon':'armor';
 const power=Math.max(1,Math.round((2+t*t*0.9)*LOCS[loc].lvl*(0.8+rng()*0.4)));
 const names={weapon:['Кинжал','Меч','Топор','Копьё','Посох'],armor:['Куртка','Кольчуга','Панцирь','Мантия','Щит']};
 return{id:s.nextId++,slot,tier:t+1,rarity:RAR[t],loc,power,value:value(loc,t),name:names[slot][Math.floor(rng()*5)]};}
function equipBest(s){for(const it of s.inv.slice()){const cur=s[it.slot];if(!cur||it.power>cur.power){equip(s,it.id);}}}
function equip(s,id){const i=s.inv.findIndex(x=>x.id===id);if(i<0)return;const it=s.inv.splice(i,1)[0];
 if(s[it.slot])s.inv.push(s[it.slot]);s[it.slot]=it;}
function dismantle(s,id){const i=s.inv.findIndex(x=>x.id===id);if(i<0)return 0;const it=s.inv.splice(i,1)[0];
 s.gold+=it.value;s.mats+=it.tier;return it.value;}
function runExpedition(s,rng=Math.random){const l=s.loc;const alloc=s.alloc.slice();let drops=[],shardGain=0;
 alloc.forEach((n,t)=>{const p=chance(l,t);for(let i=0;i<n;i++){if(rng()<p)drops.push(makeItem(s,l,t,rng));else if(t===9)shardGain++;}});
 const dc=deathChance(s,l);const died=rng()<dc;let lost=[];
 if(died){drops.sort(()=>rng()-0.5);lost=drops.splice(0,Math.floor(drops.length/2));}
 s.shards+=shardGain;s.inv.push(...drops);s.runs++;
 const myEV=ev(l,alloc),g=greedyAlloc(l,alloc.reduce((a,b)=>a+b,0)),gEV=ev(l,g);
 return{drops,lost,died,dc,shardGain,myEV,gEV,greedy:g,gold:drops.reduce((a,b)=>a+b.value,0)};}
function craftPity(s,rng=Math.random){if(s.shards<SHARDS_FOR_PITY)return null;s.shards-=SHARDS_FOR_PITY;
 const it=makeItem(s,s.loc,9,rng);s.inv.push(it);return it;}
const SHOP={chips:s=>s.chips>=60?Infinity:Math.round(15*Math.pow(1.18,s.chips-20)),
 hp:s=>Math.round(20*Math.pow(1.35,s.hpUp)),dmg:s=>Math.round(25*Math.pow(1.35,s.dmgUp))};
function buy(s,k){const c=SHOP[k](s);if(s.gold<c)return false;s.gold-=c;
 if(k==='chips')s.chips++;else if(k==='hp')s.hpUp++;else s.dmgUp++;return true;}
const api={BASE_P,VALUE,RAR,RAR_RU,LOCS,SHARDS_FOR_PITY,chance,value,pmf,pAtLeastOne,ev,greedyAlloc,newState,heroDmg,heroHp,heroPower,
 unlocked,deathChance,makeItem,equipBest,equip,dismantle,runExpedition,craftPity,SHOP,buy};
if(typeof module!=='undefined')module.exports=api;else root.G=api;
})(this);
