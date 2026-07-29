
const N=16,T=['kick','snare','hat','perc'],M={kick:{l:'Kick',s:'KD',c:'ck',p:'k'},snare:{l:'Snare',s:'SN',c:'csn',p:'sn'},hat:{l:'Hats',s:'HH',c:'ch',p:'hh'},perc:{l:'Perc',s:'PC',c:'cp',p:'pc'}};
const G=[{id:'house',l:'House',d:'Four-on-floor'},{id:'hiphop',l:'Hip-Hop',d:'Boom-bap'},{id:'breakbeat',l:'Breaks',d:'Syncopated'},{id:'techno',l:'Techno',d:'Driving'},{id:'dnb',l:'DnB',d:'Shuffle'},{id:'afrobeats',l:'Afrobeats',d:'Poly perc'}];
const emp=()=>{const p={};for(const t of T)p[t]=Array(N).fill(0);return p};
const rng=a=>{let t=a>>>0;return()=>{t+=0x6D2B79F5;let r=Math.imul(t^t>>>15,1|t);r^=r+Math.imul(r^r>>>7,61|r);return((r^r>>>14)>>>0)/4294967296}};
const set=(r,a)=>{for(const i of a)if(i>=0&&i<N)r[i]=1};
function gen(g,seed){const r=rng(seed),p=emp();
if(g==='house'){set(p.kick,[0,4,8,12]);if(r()>.5)p.kick[14]=1;set(p.snare,[4,12]);for(let i=0;i<N;i++)if(i%2)p.hat[i]=1;set(p.perc,[3,7,11,15])}
else if(g==='hiphop'){set(p.kick,[0,7,10]);if(r()>.4)p.kick[3]=1;set(p.snare,[4,12]);for(let i=0;i<N;i++)if(i%2===0)p.hat[i]=r()>.15;set(p.perc,[6,14])}
else if(g==='breakbeat'){set(p.kick,[0,6,10]);set(p.snare,[4,12,14]);for(let i=0;i<N;i++)p.hat[i]=r()>.35;set(p.perc,[2,8,11,15])}
else if(g==='techno'){set(p.kick,[0,4,8,12]);set(p.snare,[4,12]);for(let i=0;i<N;i++)p.hat[i]=1;set(p.perc,[2,6,10,14])}
else if(g==='dnb'){set(p.kick,[0,10]);if(r()>.4)p.kick[5]=1;set(p.snare,[4,12]);for(let i=0;i<N;i++)p.hat[i]=r()>.2;set(p.perc,[3,8,11,15])}
else{set(p.kick,[0,3,8,11]);set(p.snare,[4,12]);for(let i=0;i<N;i++)if(i%2===0)p.hat[i]=1;set(p.perc,[1,5,9,13])}
return p}
function rand(seed){const r=rng(seed),p=emp(),d={kick:.27,snare:.17,hat:.44,perc:.15};
for(const t of T)for(let i=0;i<N;i++){let c=d[t];if(t==='kick'&&i%4===0)c+=.35;if(t==='snare'&&(i===4||i===12))c+=.45;p[t][i]=r()<Math.min(.92,c)?1:0}return p}
let ctx,master;const nc=new WeakMap();
function audio(){if(!ctx){ctx=new AudioContext();master=ctx.createGain();master.gain.value=.88;const c=ctx.createDynamicsCompressor();c.threshold.value=-12;c.ratio.value=4;master.connect(c);c.connect(ctx.destination)}if(ctx.state==='suspended')ctx.resume();return ctx}
function nbuf(d){let b=nc.get(ctx);const n=Math.ceil(ctx.sampleRate*Math.max(d,.5));if(b&&b.length>=n)return b;b=ctx.createBuffer(1,n,ctx.sampleRate);const a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;nc.set(ctx,b);return b}
function kick(t){const o=ctx.createOscillator(),a=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.08);a.gain.setValueAtTime(1e-4,t);a.gain.exponentialRampToValueAtTime(.95,t+.004);a.gain.exponentialRampToValueAtTime(1e-4,t+.32);o.connect(a);a.connect(master);o.start(t);o.stop(t+.35)}
function snare(t){const o=ctx.createOscillator(),a=ctx.createGain(),n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),na=ctx.createGain();o.type='triangle';o.frequency.setValueAtTime(185,t);o.frequency.exponentialRampToValueAtTime(110,t+.08);a.gain.setValueAtTime(1e-4,t);a.gain.exponentialRampToValueAtTime(.45,t+.002);a.gain.exponentialRampToValueAtTime(1e-4,t+.12);n.buffer=nbuf(.2);f.type='highpass';f.frequency.value=1800;na.gain.setValueAtTime(1e-4,t);na.gain.exponentialRampToValueAtTime(.55,t+.002);na.gain.exponentialRampToValueAtTime(1e-4,t+.16);o.connect(a);a.connect(master);n.connect(f);f.connect(na);na.connect(master);o.start(t);o.stop(t+.15);n.start(t);n.stop(t+.2)}
function hat(t){const n=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),hp=ctx.createBiquadFilter(),a=ctx.createGain();n.buffer=nbuf(.08);bp.type='bandpass';bp.frequency.value=9000;hp.type='highpass';hp.frequency.value=7000;a.gain.setValueAtTime(1e-4,t);a.gain.exponentialRampToValueAtTime(.32,t+.001);a.gain.exponentialRampToValueAtTime(1e-4,t+.055);n.connect(bp);bp.connect(hp);hp.connect(a);a.connect(master);n.start(t);n.stop(t+.07)}
function perc(t){const o=ctx.createOscillator(),a=ctx.createGain();o.type='square';o.frequency.setValueAtTime(820,t);o.frequency.exponentialRampToValueAtTime(320,t+.04);a.gain.setValueAtTime(1e-4,t);a.gain.exponentialRampToValueAtTime(.28,t+.001);a.gain.exponentialRampToValueAtTime(1e-4,t+.09);o.connect(a);a.connect(master);o.start(t);o.stop(t+.1)}
const playV=(v,t)=>{if(v==='kick')kick(t);else if(v==='snare')snare(t);else if(v==='hat')hat(t);else perc(t)};
let pattern=gen('house',42),bpm=124,swing=.12,genre='house',playing=0,cur=-1,muted={kick:0,snare:0,hat:0,perc:0},next=0,si=0,timer=0;
const tracks=document.getElementById('tracks'),nums=document.getElementById('nums'),bars=document.getElementById('bars'),st=document.getElementById('st'),playB=document.getElementById('play');
for(let i=0;i<N;i++){const n=document.createElement('div');n.className='sn'+(i%4===0?' b':'');n.textContent=i+1;n.dataset.i=i;nums.appendChild(n);const b=document.createElement('div');b.className='pb'+(i%4===0?' b':'');b.dataset.i=i;bars.appendChild(b)}
function draw(){tracks.innerHTML='';for(const t of T){const row=document.createElement('div');row.className='row';const lab=document.createElement('button');lab.className='tl'+(muted[t]?' mu':'');lab.innerHTML='<strong class="'+M[t].c+'">'+M[t].l+'</strong><span>'+(muted[t]?'muted':M[t].s)+'</span>';lab.onclick=()=>{audio();playV(t,ctx.currentTime)};lab.oncontextmenu=e=>{e.preventDefault();muted[t]=!muted[t];draw()};const steps=document.createElement('div');steps.className='steps';
for(let i=0;i<N;i++){const pad=document.createElement('button');pad.className='pad'+(i%4===0?' be':'')+(pattern[t][i]?' ok '+M[t].p:'')+(cur===i?' ph':'');pad.onclick=()=>{const on=!pattern[t][i];pattern[t][i]=on?1:0;if(on&&!playing){audio();playV(t,ctx.currentTime)}draw()};steps.appendChild(pad)}
row.append(lab,steps);tracks.appendChild(row)}
nums.querySelectorAll('.sn').forEach(el=>{const i=+el.dataset.i;el.className='sn'+(i%4===0?' b':'')+(cur===i?' n':'')});
bars.querySelectorAll('.pb').forEach(el=>{const i=+el.dataset.i;el.className='pb'+(i%4===0?' b':'')+(cur===i?' on':'')})}
draw();
const dur=s=>{const x=60/bpm/4,w=Math.max(0,Math.min(.75,swing));return s%2===0?x*(1+w):x*(1-w)};
function sched(s,t){const d=Math.max(0,(t-ctx.currentTime)*1000);setTimeout(()=>{if(playing){cur=s;draw()}},d);for(const tr of T)if(!muted[tr]&&pattern[tr][s])playV(tr,t)}
function tick(){if(!playing||!ctx)return;while(next<ctx.currentTime+.1){sched(si,next);next+=dur(si);si=(si+1)%N}timer=setTimeout(tick,20)}
function toggle(){audio();if(playing){playing=0;clearTimeout(timer);cur=-1;playB.textContent='▶';playB.className='btn play';playB.setAttribute('aria-label','Play');draw()}else{playing=1;si=0;next=ctx.currentTime+.04;playB.textContent='■';playB.className='btn stop';playB.setAttribute('aria-label','Stop');tick()}}
playB.onclick=toggle;document.getElementById('clr').onclick=()=>{pattern=emp();st.textContent='Pattern cleared';draw()};
document.getElementById('rnd').onclick=()=>{const s=Date.now();pattern=rand(s);st.textContent='Randomized · seed '+(s%10000);draw()};
document.getElementById('ai').onclick=()=>{const s=Date.now();pattern=gen(genre,s);const g=G.find(x=>x.id===genre);st.textContent='AI · '+(g?g.l:genre)+' · seed '+(s%10000);draw()};
const gb=document.getElementById('gb'),gm=document.getElementById('gm');
gb.onclick=e=>{e.stopPropagation();if(!gm.hidden){gm.hidden=1;return}gm.innerHTML='';for(const g of G){const b=document.createElement('button');b.textContent=g.l+' — '+g.d;b.onclick=()=>{genre=g.id;gb.textContent=g.l+' ▾';gm.hidden=1};gm.appendChild(b)}gm.hidden=0};
document.onclick=()=>gm.hidden=1;
document.getElementById('bpm').oninput=e=>{bpm=+e.target.value;document.getElementById('bv').textContent=bpm+' BPM'};
document.getElementById('sw').oninput=e=>{swing=(+e.target.value)/100;document.getElementById('sv').textContent=Math.round(swing*100)+'%'};
document.getElementById('vl').oninput=e=>{const v=(+e.target.value)/100;document.getElementById('vv').textContent=Math.round(v*100)+'%';if(master)master.gain.value=v};
addEventListener('keydown',e=>{if(e.code==='Space'&&e.target.tagName!=='INPUT'&&e.target.tagName!=='BUTTON'){e.preventDefault();toggle()}});
