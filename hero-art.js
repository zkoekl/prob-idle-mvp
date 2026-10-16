// hero-art.js — juicy layered SVG art (no deps). Exposes window.HeroArt
(function(){
let U=0;const uid=()=> 'ha'+(++U).toString(36);
const RC=[ // [main, light, dark, glow] per rarity 0..4, 5=set
 ['#9aa3ad','#e6ebf0','#4b525a',null],
 ['#5fbf6a','#c9f5cf','#245a2c','#5fbf6a'],
 ['#3f8cff','#bcd8ff','#163b80','#3f8cff'],
 ['#b052ff','#ecc6ff','#4a1680','#c070ff'],
 ['#ff9a1f','#fff0b0','#7a3a00','#ffb030'],
 ['#3fe07a','#d8ffe4','#0d5a2a','#4dff8a']];
const TAGC={fire:'#ff5a1f',ice:'#5fd8ff',luck:'#5fe06a',shadow:'#9a5cff',crit:'#ff3d6e'};
const SETC={forest:'#3fbf5f',guard:'#5fc8ff',gambler:'#ffcf3f',monty:'#b05cff'};
// tier: rarity + enhance + quality + log power; unbounded. >=7 is "over-the-top"
function tierOf(it){if(!it)return 0;if(it.tier!=null)return it.tier;return (it.r||0)+Math.floor((it.lvl||0)/3)+(it.q||0)+Math.max(0,Math.floor(Math.log10(Math.max(1,it.power||1))-1));}
function pal(it){const p=RC[Math.min(4,it.r||0)].slice(),g=tierOf(it)-6;if(g>=4)return['#6a1aa8','#e0ff9a','#14001f','#7dff3a'];if(g>=1)return['#c8202a','#ffd27a','#3a0008','#ff5020'];if(it.set){const c=SETC[it.set]||RC[5][0];p[0]=c;p[3]=c;}return p;}
function grad(id,c,ang){return `<linearGradient id="${id}" x1="0" y1="0" x2="${ang?1:0}" y2="1"><stop offset="0" stop-color="${c[1]}"/><stop offset=".45" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>`;}
function glowF(id,c,s){return `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="${s}"/><feFlood flood-color="${c}"/><feComposite operator="in" in2="SourceAlpha"/><feGaussianBlur stdDeviation="${s}"/><feMerge><feMergeNode/><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;}
const spikes=(cx,cy,r,n,len,rot,fill)=>{let d='';for(let i=0;i<n;i++){const a=rot+i*2*Math.PI/n,w=0.22;const P=(an,rr)=>(cx+Math.cos(an)*rr).toFixed(1)+' '+(cy+Math.sin(an)*rr).toFixed(1);d+=`M${P(a-w,r)}L${P(a,r+len)}L${P(a+w,r)}Z`;}return `<path d="${d}" fill="${fill}"/>`;};
const skull=(x,y,s,eye)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-6-2a6 6 0 0 1 12 0v3l-2 1v3h-8v-3l-2-1z" fill="#efe6d0" stroke="#3a2a1a" stroke-width=".8"/><circle cx="-2.4" cy="0" r="1.6" fill="${eye}"/><circle cx="2.4" cy="0" r="1.6" fill="${eye}"/><path d="M-2 4.5v-1.5M0 4.5v-1.5M2 4.5v-1.5" stroke="#3a2a1a" stroke-width=".6"/></g>`;
const RUNES='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᛁᛃᛇ';
// ---- slot silhouettes (64x64 space, centred ~32,32). g = over-tier level (0 = normal)
const SIL={
weapon:(f,c,g,acc)=>{const w=3.5+g*1.6,L=Math.min(10,4-g*1.2);let blade=`M${32-w} 40 L${32-w*0.9} ${16+L} L32 ${6+L-g} L${32+w*0.9} ${16+L} L${32+w} 40Z`;
 let s=`<path d="${blade}" fill="url(#${f})" stroke="${c[2]}" stroke-width="1"/><path d="M32 ${8+L} V39" stroke="#fff" stroke-opacity=".55" stroke-width="1"/>`;
 if(g)s+=spikes(32,26,w,8,2+g,0.3,c[2]).replace('<path','<path opacity=".9"');
 const gw=10+g*3;s+=`<path d="M${32-gw} 40 Q32 ${44+g} ${32+gw} 40 L${32+gw-2} 44 Q32 ${47+g} ${32-gw+2} 44Z" fill="${c[2]}" stroke="${acc}" stroke-width="1"/><rect x="30" y="45" width="4" height="11" rx="1.5" fill="#5a3a22" stroke="#2a1a0e" stroke-width=".8"/><circle cx="32" cy="58" r="3" fill="${acc}" stroke="${c[2]}"/>`;
 if(g>=2)s+=skull(32,42,0.7+g*0.06,acc);return s;},
armor:(f,c,g,acc)=>{let s=`<path d="M18 18 Q32 12 46 18 L48 30 Q46 48 32 56 Q18 48 16 30Z" fill="url(#${f})" stroke="${c[2]}" stroke-width="1.2"/><path d="M32 16 V54 M22 30 Q32 35 42 30" stroke="${c[2]}" stroke-width="1" fill="none" opacity=".7"/><path d="M19 20 Q32 14 45 20" stroke="#fff" stroke-opacity=".6" fill="none"/>`;
 const pr=6+Math.min(g,3)*1.6;s=`<ellipse cx="${18-g}" cy="20" rx="${pr}" ry="${pr*0.75}" fill="url(#${f})" stroke="${c[2]}"/><ellipse cx="${46+g}" cy="20" rx="${pr}" ry="${pr*0.75}" fill="url(#${f})" stroke="${c[2]}"/>`+s;
 if(g){s=spikes(18-g,19,pr*0.7,5,3+Math.min(g,4)*1.4,Math.PI*1.05,c[2])+spikes(46+g,19,pr*0.7,5,3+Math.min(g,4)*1.4,-Math.PI*0.05,c[2]).replace(/M/,'M')+s;s=s.replace(/(<path d="M[^"]*Z" fill="#[0-9a-f]+"\/>)/g,m=>m);}
 s+=`<circle cx="32" cy="30" r="${3+Math.min(g,3)}" fill="${acc}" stroke="${c[1]}" stroke-width=".8"/>`;if(g>=2)s+=skull(32,40,0.8+g*0.05,acc);return s;},
helm:(f,c,g,acc)=>{let s='';if(g||c.horn){const h=6+g*4;s+=`<path d="M20 26 Q${10-g*2} ${20-h*0.4} ${12-g} ${12-h}Q${16} ${18} 24 22Z" fill="#e8dcc0" stroke="#5a4630"/><path d="M44 26 Q${54+g*2} ${20-h*0.4} ${52+g} ${12-h}Q48 18 40 22Z" fill="#e8dcc0" stroke="#5a4630"/>`;}
 s+=`<path d="M16 40 Q15 14 32 12 Q49 14 48 40 L44 50 H20Z" fill="url(#${f})" stroke="${c[2]}" stroke-width="1.2"/><path d="M21 31 H43 L41 36 H35 L32 44 L29 36 H23Z" fill="#0b0b12"/><path d="M19 22 Q32 12 45 22" stroke="#fff" stroke-opacity=".6" fill="none"/><path d="M32 12 V30" stroke="${c[2]}"/>`;
 if(acc&&g)s+=`<circle cx="27" cy="33" r="1.4" fill="${acc}"/><circle cx="37" cy="33" r="1.4" fill="${acc}"/>`;if(g>=2)s+=spikes(32,26,15,7,2+g,-Math.PI*0.95,c[2]).replace('<path','<path transform="scale(1 .9) translate(0 2)"');return s;},
gloves:(f,c,g,acc)=>{let s=`<path d="M18 52 V28 Q18 22 22 22 V14 Q25 11 27 14 V22 H29 V11 Q32 8 34 11 V22 H36 V13 Q39 10 41 13 V24 Q46 22 47 27 L44 40 Q42 52 40 52Z" fill="url(#${f})" stroke="${c[2]}" stroke-width="1.1"/><rect x="16" y="46" width="27" height="8" rx="2" fill="${c[2]}" stroke="${acc}" stroke-width=".8"/><path d="M21 26 H40" stroke="#fff" stroke-opacity=".5"/>`;
 if(g)for(let i=0;i<3;i++)s+=`<path d="M${23+i*7} 24 L${25.5+i*7} ${18-g*2.2} L${28+i*7} 24Z" fill="${c[1]}" stroke="${c[2]}" stroke-width=".7"/>`;if(g>=2)s+=`<circle cx="30" cy="50" r="2.2" fill="${acc}"/>`;return s;},
boots:(f,c,g,acc)=>{let s=`<path d="M20 10 H36 V34 L48 40 Q52 50 46 52 H18 Q16 52 17 44Z" fill="url(#${f})" stroke="${c[2]}" stroke-width="1.1"/><rect x="18" y="10" width="20" height="6" rx="2" fill="${c[2]}" stroke="${acc}" stroke-width=".8"/><path d="M17 48 H48" stroke="${c[2]}" stroke-width="3"/><path d="M23 18 V40" stroke="#fff" stroke-opacity=".5"/>`;
 if(g){s+=`<path d="M36 22 L${44+g*3} ${18-g} L36 30Z M20 26 L${12-g*3} ${22-g} L20 32Z" fill="${c[1]}" stroke="${c[2]}" stroke-width=".7"/>`;}if(g>=2)s+=skull(28,26,0.6,acc);return s;},
charm:(f,c,g,acc)=>{let s=`<path d="M20 8 Q32 22 44 8" stroke="#c9a54a" stroke-width="2" fill="none"/>`;if(g)s+=`<circle cx="32" cy="36" r="${17+g}" fill="none" stroke="${acc}" stroke-dasharray="2 3" opacity=".7" class="ha-spin"/>`;
 if(g>=2)s+=spikes(32,36,15,8,2+g*1.5,0,c[2]);s+=`<path d="M32 18 L46 32 L32 54 L18 32Z" fill="url(#${f})" stroke="#c9a54a" stroke-width="1.6"/><path d="M32 18 L38 32 L32 54 L26 32Z M18 32 H46" stroke="#fff" stroke-opacity=".35" fill="none"/><path d="M24 26 L32 20" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>`;
 return s;}};
function frame(id,c,r,g,set){const bg=`<radialGradient id="${id}b" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="${r?c[0]:'#3a4048'}" stop-opacity="${r?.55:.6}"/><stop offset="1" stop-color="#0d0f14"/></radialGradient>`;
 let s=`<rect x="2" y="2" width="60" height="60" rx="9" fill="url(#${id}b)" stroke="${r?c[0]:'#5a626c'}" stroke-width="${r>=3?2.2:1.4}"/>`;
 if(r>=3)s+=`<rect x="5" y="5" width="54" height="54" rx="7" fill="none" stroke="${c[1]}" stroke-opacity=".45"/>`;
 if(r>=4||set){const o=(x,y,sx,sy)=>`<path transform="translate(${x} ${y}) scale(${sx} ${sy})" d="M0 0 H12 Q5 2 3 5 Q2 8 0 12Z" fill="${c[1]}" stroke="${c[2]}" stroke-width=".6"/>`;s+=o(1,1,1,1)+o(63,1,-1,1)+o(1,63,1,-1)+o(63,63,-1,-1);}
 if(g>=1)s+=`<text x="32" y="61" text-anchor="middle" font-size="5.5" fill="${c[1]}" opacity=".85" font-family="serif" letter-spacing="1.5">${RUNES.slice(0,Math.min(8,3+g)).split('').join('')}</text>`;
 return {defs:bg,body:s};}
function parts(n,c,seed){let s='';for(let i=0;i<n;i++){const x=8+((seed*37+i*53)%48),d=(i*0.37+seed%7*0.13)%2.4;s+=`<circle cx="${x}" cy="56" r="${1+(i%3)*0.5}" fill="${i%2?c[1]:c[0]}" class="ha-pt" style="animation-delay:-${d.toFixed(2)}s"/>`;}return s;}
function renderItemIcon(it,o){o=o||{};if(!it)return '';const id=uid(),r=Math.min(4,it.r||0),t=tierOf(it),g=Math.max(0,t-6),c=pal(it);c.horn=r>=3;
 const acc=TAGC[it.tag]||c[1],fr=frame(id,c,r,g,it.set),sil=(SIL[it.slot]||SIL.charm)(id+'m',c,Math.min(g,6),acc);
 let defs=fr.defs+grad(id+'m',c,1)+(r>=3||g?glowF(id+'g',c[3],1.2+Math.min(g,5)*0.5):'')+`<clipPath id="${id}c"><rect x="2" y="2" width="60" height="60" rx="9"/></clipPath>`;
 let aura=r>=3||g?`<circle cx="32" cy="32" r="${18+Math.min(g,6)*2}" fill="${c[3]}" opacity="${0.18+Math.min(g,6)*0.05}" class="ha-pulse"/>`:'';
 if(g>=2)aura+=`<g class="ha-spin" opacity=".55">${spikes(32,32,20,12,6+g,0,c[3])}</g>`;
 const shine=r>=4||it.set||g?`<g clip-path="url(#${id}c)"><rect x="-30" y="-10" width="14" height="90" fill="#fff" opacity=".35" transform="rotate(25)" class="ha-shine"/></g>`:'';
 const lvl=it.lvl?`<text x="56" y="13" text-anchor="end" font-size="9" font-weight="800" fill="#fff" stroke="#000" stroke-width="2" paint-order="stroke" font-family="sans-serif">+${it.lvl}</text>`:'';
 const sz=o.size||64;
 return `<svg class="ha-icon ha-r${r}${g?' ha-over':''}" viewBox="0 0 64 64" width="${sz}" height="${sz}"><defs>${defs}</defs>${fr.body}<g clip-path="url(#${id}c)">${aura}</g><g ${r>=3||g?`filter="url(#${id}g)"`:''}>${sil}</g>${shine}${r>=4||g?parts(4+Math.min(g,6)*2,c,it.id||t):''}${lvl}</svg>`;}
// ---- skins
const skinList=[
 {k:'wander',ru:'Странник',skin:'#f2d2b6',hair:'#5e4636',cloth:'#4a6fa5',cape:'#8a3a3a',eye:'#2b2d33',bonus:null,how:'с самого начала',need:s=>true},
 {k:'knight',ru:'Рыцарь',skin:'#e8c4a4',hair:'#c9a54a',cloth:'#7a8794',cape:'#2d4f8a',eye:'#1d3a6a',bonus:['hpPct',1],how:'40 походов',need:s=>s.runs>=40},
 {k:'witch',ru:'Ведьма',skin:'#e9d6c8',hair:'#2a1838',cloth:'#4b2a6a',cape:'#2a1838',eye:'#7a2ac8',bonus:['luck',1],how:'20 раундов в сундуках',need:s=>(s.monty&&s.monty.plays||0)>=20},
 {k:'shade',ru:'Тень',skin:'#9aa0b4',hair:'#15151d',cloth:'#23232e',cape:'#0e0e14',eye:'#ff3d6e',bonus:['riskRed',1],how:'победить босса',need:s=>(s.bosses||0)>=1},
 {k:'lich',ru:'Лич',skin:'#b8d8c8',hair:'#dfe8e0',cloth:'#1f3a34',cape:'#122420',eye:'#4dff8a',bonus:['goldPct',2],how:'глубина Бездны 3',need:s=>(s.abyssMax||0)>=3}];
const FRAMES=[ // power tier frames
 {min:0,ru:'Новичок',c:['#8a6a4a','#d9b48a','#3a2a1a']},{min:60,ru:'Ветеран',c:['#9aa8b8','#f0f6ff','#3a4450']},
 {min:250,ru:'Герой',c:['#e0a820','#fff2a0','#6a4000']},{min:1000,ru:'Легенда',c:['#d0203a','#ffb0b8','#4a0010']},{min:5000,ru:'Владыка Бездны',c:['#8a2aff','#e8c8ff','#1a0040']}];
function powerTier(p){let i=0;FRAMES.forEach((f,j)=>{if(p>=f.min)i=j;});return i+Math.max(0,Math.floor(Math.log(Math.max(1,p/5000))/Math.log(4)));}
// ---- avatar. eq: state object (s.weapon...) or {weapon:item,...}; opts {skin, power, size, sets:{forest:4}}
function renderAvatar(eq,opts){opts=opts||{};eq=eq||{};const id=uid(),S=skinList.find(x=>x.k===(opts.skin||eq.skin))||skinList[0];
 const E={};['weapon','armor','charm','helm','gloves','boots'].forEach(k=>E[k]=eq[k]||null);
 const items=Object.values(E).filter(Boolean),pw=opts.power!=null?opts.power:items.reduce((a,i)=>a+(i.power||0)*Math.pow(1.12,i.lvl||0),0);
 const pt=powerTier(pw),F=FRAMES[Math.min(pt,FRAMES.length-1)],over=Math.max(0,pt-4);
 const sc={};items.forEach(i=>{if(i.set)sc[i.set]=(sc[i.set]||0)+1;});Object.assign(sc,opts.sets||{});const best=Object.entries(sc).sort((a,b)=>b[1]-a[1])[0];
 const setC=best&&best[1]>=2?(SETC[best[0]]||'#4dff8a'):null;const maxT=Math.max(0,...items.map(tierOf)),g=Math.max(0,maxT-6);
 let d=grad(id+'f',F.c)+`<radialGradient id="${id}bg" cx=".5" cy=".42" r=".65"><stop offset="0" stop-color="${setC||F.c[0]}" stop-opacity=".55"/><stop offset="1" stop-color="#07080c"/></radialGradient>`+glowF(id+'gl',setC||F.c[1],2.5)+`<clipPath id="${id}cl"><circle cx="80" cy="80" r="70"/></clipPath>`;
 const P=(slot)=>{const it=E[slot];if(!it)return null;const c=pal(it),gid=id+slot;d+=grad(gid,c,1);return{c,f:`url(#${gid})`,g:Math.max(0,tierOf(it)-6),r:it.r||0,acc:TAGC[it.tag]||c[1]};};
 const A=P('armor'),H=P('helm'),W=P('weapon'),Gl=P('gloves'),B=P('boots'),C=P('charm');
 let s=`<circle cx="80" cy="80" r="70" fill="url(#${id}bg)"/>`;
 let inner='';
 if(setC||g){inner+=`<g class="ha-spin" style="transform-box:view-box;transform-origin:80px 88px" opacity="${setC?.5:.35}">${spikes(80,88,40,16,8+g*3,0,setC||F.c[0])}</g><ellipse cx="80" cy="150" rx="46" ry="10" fill="${setC||F.c[0]}" opacity=".5" class="ha-pulse"/>`;}
 // cape
 inner+=`<path d="M52 82 Q40 120 44 160 H116 Q120 120 108 82Z" fill="${S.cape}"/><path d="M58 86 Q50 120 52 160" stroke="#fff" stroke-opacity=".12" stroke-width="3" fill="none"/>`;
 // legs+boots
 inner+=`<rect x="64" y="118" width="12" height="30" fill="${S.cloth}" filter="brightness(.7)"/><rect x="84" y="118" width="12" height="30" fill="${S.cloth}"/>`;
 if(B){inner+=`<path d="M61 134 H78 V150 Q80 158 74 158 H58 Q56 150 61 146Z M82 134 H99 V146 Q104 150 102 158 H86 Q80 158 82 150Z" fill="${B.f}" stroke="${B.c[2]}"/>`;if(B.g)inner+=`<path d="M61 138 L${50-B.g*3} ${132-B.g} L61 144Z M99 138 L${110+B.g*3} ${132-B.g} L99 144Z" fill="${B.c[1]}" stroke="${B.c[2]}"/>`;}
 else inner+=`<path d="M62 146 H77 V156 H58Z M83 146 H98 L102 156 H83Z" fill="#4a3624"/>`;
 // torso
 inner+=`<path d="M56 80 Q80 70 104 80 L100 122 H60Z" fill="${S.cloth}"/>`;
 if(A){inner+=`<path d="M58 80 Q80 72 102 80 L99 116 Q80 126 61 116Z" fill="${A.f}" stroke="${A.c[2]}"/><path d="M80 76 V122 M64 98 Q80 104 96 98" stroke="${A.c[2]}" fill="none" opacity=".6"/><path d="M60 82 Q80 74 100 82" stroke="#fff" stroke-opacity=".5" fill="none"/>`;
  const pr=9+Math.min(A.g,3)*2.2+A.r*0.6;inner+=`${A.g?spikes(56-A.g,80,pr*0.7,5,4+Math.min(A.g,5)*2,Math.PI*1.1,A.c[2])+spikes(104+A.g,80,pr*0.7,5,4+Math.min(A.g,5)*2,-Math.PI*0.1,A.c[2]):''}<ellipse cx="${56-A.g}" cy="82" rx="${pr}" ry="${pr*0.7}" fill="${A.f}" stroke="${A.c[2]}"/><ellipse cx="${104+A.g}" cy="82" rx="${pr}" ry="${pr*0.7}" fill="${A.f}" stroke="${A.c[2]}"/>${A.g>=2?skull(56-A.g,82,0.9,A.acc)+skull(104+A.g,82,0.9,A.acc):''}`;}
 // charm
 if(C)inner+=`<path d="M72 80 L80 92 L88 80" stroke="#c9a54a" fill="none"/><path d="M80 90 L85 96 L80 104 L75 96Z" fill="${C.f}" stroke="#c9a54a" filter="url(#${id}gl)"/>`;
 // arms + gloves
 inner+=`<path d="M54 86 Q46 104 50 118" stroke="${S.cloth}" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M106 86 Q116 100 114 112" stroke="${S.cloth}" stroke-width="10" stroke-linecap="round" fill="none"/>`;
 const hand=(x,y)=>Gl?`<circle cx="${x}" cy="${y}" r="${6+Gl.g*0.6}" fill="${Gl.f}" stroke="${Gl.c[2]}"/>${Gl.g?spikes(x,y,6,4,2+Gl.g,-1.2,Gl.c[1]):''}`:`<circle cx="${x}" cy="${y}" r="5" fill="${S.skin}"/>`;
 // weapon behind right hand
 let wpn='';if(W){const k=1+Math.min(W.g,5)*0.14+W.r*0.05,bw=4*k;wpn=`<g transform="translate(114 112) rotate(-28) scale(${k.toFixed(2)})"><path d="M-${bw/k} -6 L-${bw/k*0.8} -58 L0 -${70+W.g*4} L${bw/k*0.8} -58 L${bw/k} -6Z" fill="${W.f}" stroke="${W.c[2]}"/><path d="M0 -64 V-8" stroke="#fff" stroke-opacity=".6"/>${W.g?spikes(0,-34,bw/k,8,3+W.g,0.4,W.c[2]):''}<path d="M-12 -6 Q0 0 12 -6 L10 0 Q0 4 -10 0Z" fill="${W.c[2]}" stroke="${W.acc}"/><rect x="-2" y="0" width="4" height="12" fill="#5a3a22"/>${W.g>=2?skull(0,-6,0.7,W.acc):''}</g>`;
  if(W.r>=3||W.g)wpn=`<g filter="url(#${id}gl)">${wpn}</g>`;}
 inner+=wpn+hand(50,118)+hand(114,112);
 // head
 inner+=`<rect x="74" y="64" width="12" height="10" fill="${S.skin}"/><circle cx="80" cy="54" r="17" fill="${S.skin}"/>`;
 if(!H)inner+=`<path d="M62 52 Q62 34 80 34 Q98 34 98 52 Q92 44 80 44 Q68 44 62 52Z" fill="${S.hair}"/><ellipse cx="74" cy="56" rx="2" ry="2.6" fill="${S.eye}"/><ellipse cx="86" cy="56" rx="2" ry="2.6" fill="${S.eye}"/><path d="M76 63 Q80 66 84 63" stroke="#7a4a3a" stroke-width="1.4" fill="none"/>`;
 else{const hg=H.g;inner+=`${H.r>=3||hg?`<path d="M64 50 Q${50-hg*3} ${40-hg*2} ${52-hg*2} ${26-hg*6} Q58 40 70 44Z M96 50 Q${110+hg*3} ${40-hg*2} ${108+hg*2} ${26-hg*6} Q102 40 90 44Z" fill="#e8dcc0" stroke="#5a4630"/>`:''}<path d="M61 62 Q60 34 80 33 Q100 34 99 62 L94 72 H66Z" fill="${H.f}" stroke="${H.c[2]}"/><path d="M66 52 H94 L91 58 H84 L80 68 L76 58 H69Z" fill="#08080c"/><circle cx="73" cy="55" r="1.8" fill="${H.r>=3||hg?H.acc:S.eye}" class="${hg?'ha-pulse':''}"/><circle cx="87" cy="55" r="1.8" fill="${H.r>=3||hg?H.acc:S.eye}" class="${hg?'ha-pulse':''}"/><path d="M64 44 Q80 33 96 44" stroke="#fff" stroke-opacity=".55" fill="none"/>${hg>=2?spikes(80,52,19,7,3+hg*1.5,-Math.PI*0.92,H.c[2]):''}`;}
 s+=`<g clip-path="url(#${id}cl)">${inner}</g>`;
 // power frame
 const fw=4+Math.min(pt,6);s+=`<circle cx="80" cy="80" r="72" fill="none" stroke="url(#${id}f)" stroke-width="${fw}"/>`;
 if(pt>=2)s+=`<circle cx="80" cy="80" r="${72+fw/2+1}" fill="none" stroke="${F.c[1]}" stroke-opacity=".6" stroke-dasharray="3 5"/>`;
 if(pt>=3)s=spikes(80,80,74,pt>=4?16:8,6+Math.min(over,4)*3,-Math.PI/2,F.c[0])+s;
 if(over)s+=`<g class="ha-spin" style="transform-box:view-box;transform-origin:80px 80px" opacity=".7"><text font-size="8" fill="${F.c[1]}" font-family="serif"><textPath href="#${id}rp">${(RUNES+RUNES+RUNES).slice(0,30)}</textPath></text></g>`,d+=`<path id="${id}rp" d="M80 4a76 76 0 1 1-.1 0"/>`;
 s+=`<g transform="translate(80 152)"><rect x="${-30-(over?14:0)}" y="-7" width="${60+(over?28:0)}" height="14" rx="7" fill="url(#${id}f)" stroke="${F.c[2]}"/><text y="3.5" text-anchor="middle" font-size="9" font-weight="800" fill="${F.c[2]}" font-family="sans-serif">${F.ru}${over?' '+'★'.repeat(Math.min(over,5)):''}</text></g>`;
 const sz=opts.size||160;
 return `<svg class="ha-avatar ha-pt${Math.min(pt,6)}" viewBox="${-10-Math.min(over,3)*3} ${-10-Math.min(over,3)*3} ${180+Math.min(over,3)*6} ${180+Math.min(over,3)*6}" width="${sz}" height="${sz}"><defs>${d}</defs>${s}</svg>`;}
const IMG=window.HERO_ART_IMG||'img/';
const stageOf=pw=>{const t=powerTier(pw||0);return t>=4?2:t>=2?1:0;};
function portrait(eq,o){o=o||{};const k=(skinList.find(x=>x.k===o.skin)||skinList[0]).k,sz=o.size||160,items=Object.values(eq||{}).filter(x=>x&&x.slot);
 const pw=o.power!=null?o.power:items.reduce((a,i)=>a+(i.power||0),0),st=o.stage!=null?o.stage:stageOf(pw),pt=powerTier(pw);
 return `<span class="ha-port ha-pt${Math.min(pt,6)}" style="width:${Math.round(sz*300/432)}px;height:${sz}px"><img src="${IMG}${o.enemy?'enemy_'+o.enemy:'skin_'+k+'_'+st}.webp" alt="" loading="lazy" draggable="false"></span>`;}
function itemImg(it,o){o=o||{};if(!it)return '';const r=Math.min(4,it.r||0),over=Math.max(0,tierOf(it)-8),sz=o.size||64;
 return `<span class="ha-it q${r}${it.set?' set':''}${over?' over o'+Math.min(over,5):''}" style="width:${sz}px;height:${sz}px"><img src="${IMG}item_${it.slot}_q${r}.webp" alt="" loading="lazy" draggable="false">${it.lvl?`<b>+${it.lvl}</b>`:''}${over?`<i>${'★'.repeat(Math.min(5,over))}</i>`:''}</span>`;}
const renderAvatarSvg=renderAvatar,renderItemIconSvg=renderItemIcon;
window.HeroArt={renderAvatar:(eq,o)=>(o&&o.size<60)?renderAvatarSvg(eq,o):portrait(eq,o),renderItemIcon:itemImg,renderAvatarSvg,renderItemIconSvg,portrait,stageOf,skinList,FRAMES,powerTier,tierOf};
})();
