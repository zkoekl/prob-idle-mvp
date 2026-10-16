const G=require('./logic.js');const assert=(c,m)=>{if(!c)throw new Error(m);};
let sum=0;for(let k=0;k<=10;k++)sum+=G.pmf(10,k,0.3);assert(Math.abs(sum-1)<1e-9,'pmf');
assert(Math.abs(G.expPaid(10,0.3,1)-3)<1e-9,'exp');assert(Math.abs(G.pAtLeast(10,1,0.3)-G.pAtLeastOne(10,0.3))<1e-9,'pal');
assert(G.load('{"ver":1}')===null,'migrate');
// bot playthrough: measure expeditions to win
function bot(seed){let a=seed;const rng=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};let now=1;
 const s=G.newState();let actions=0;
 while(!s.won&&actions<5000){actions++;
  for(let l=G.LOCS.length-1;l>=0;l--)if(G.unlocked(s,l)){s.loc=l;break;}
  const n=G.totalChips(s);const strat=G.strategies(n);s.alloc=strat[1].a;
  now+=20000;G.tickEnergy(s,now);while(s.energy<G.foodCost(s.loc,s.alloc)){now+=G.regenSec(s)*1000;G.tickEnergy(s,now);}
  if(G.startRun(s)){s.alloc=s.alloc.map(v=>Math.floor(v/2));if(G.startRun(s))continue;}
  while(s.run){const r=G.rollStage(s,rng);if(!r||r.died||r.finished)break;
   if(G.deathChance(s,s.run.loc,s.run.alloc,s.run.stage)>0.12){G.bank(s);break;}}
  if(process.env.TR)console.log(actions,s.loc,G.heroPower(s),s.gold,s.lvl,s.inv.length,s.energy);G.equipBest(s);s.inv.slice().forEach(i=>G.dismantle(s,i.id));G.craftPity(s,rng);
  for(const sl of['weapon','armor'])while(G.upgradeItem(s,sl));
  let b=true;while(b){b=false;const opts=['dmg','hp','chips','maxE','regen','guide','lens','chest'].sort((a,c)=>G.SHOP[a](s)-G.SHOP[c](s));
   if(s.gold>G.SHOP[opts[0]](s))b=G.buy(s,opts[0]);}}
 return{min:Math.round(now/60000),actions,won:s.won,lvl:s.lvl,chips:s.chips,pow:G.heroPower(s),deaths:s.deaths,cleared:s.cleared.join('')};}
for(const sd of[1,2,3])console.log(JSON.stringify(bot(sd)));
const s=G.newState();const mc=G.monteCarlo(s,0,s.alloc,1,2000);assert(mc.mean>0&&mc.bins.length===12,'mc');console.log('MC',mc.mean.toFixed(1),mc.death);
console.log('TESTS OK');
