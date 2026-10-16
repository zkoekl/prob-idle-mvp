const G=require('./logic.js');const s=G.newState();
let sum=0;for(let k=0;k<=10;k++)sum+=G.pmf(10,k,0.3);if(Math.abs(sum-1)>1e-9)throw 'pmf';
for(let i=0;i<300;i++){G.runExpedition(s);G.equipBest(s);s.inv.map(x=>x.id).forEach(id=>G.dismantle(s,id));
 ['chips','dmg','hp'].forEach(k=>G.buy(s,k));G.craftPity(s);if(s.loc<2&&G.unlocked(s,s.loc+1))s.loc++;
 s.alloc=G.greedyAlloc(s.loc,s.chips);}
console.log('OK',s.loc,s.chips,G.heroDmg(s),G.heroHp(s),s.gold,s.runs);
