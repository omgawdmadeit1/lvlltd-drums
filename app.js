
/* LVL LTD Studio — Drums + AS3340-class modular voice */
(() => {
const $ = (id) => document.getElementById(id);
const clamp = (n,a,b) => Math.max(a, Math.min(b, n));
const F0 = 261.6255653005986;
const midiToV = (m) => (m - 60) / 12;
const expo = (v, scale=1, offset=0, hf=0.15) => {
  let f = F0 * Math.pow(2, v * scale + offset);
  if (hf > 0 && f > 800) {
    const x = Math.log2(Math.max(1, f / 800));
    f *= 1 + hf * 0.04 * x * x;
  }
  return clamp(f, 20, 12000);
};

/* ── Tabs ── */
const modes = { modular: $('view-mod'), drums: $('view-drums') };
document.querySelectorAll('.tab').forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b === btn));
    const m = btn.dataset.mode;
    Object.entries(modes).forEach(([k, el]) => el.classList.toggle('hidden', k !== m));
  };
});

/* ══════════════════════════════════════
   DRUM MACHINE
   ══════════════════════════════════════ */
const N = 16, TR = ['kick','snare','hat','perc'];
const META = {
  kick:{l:'Kick',s:'KD',c:'ck',p:'k'},
  snare:{l:'Snare',s:'SN',c:'csn',p:'sn'},
  hat:{l:'Hats',s:'HH',c:'ch',p:'hh'},
  perc:{l:'Perc',s:'PC',c:'cp',p:'pc'}
};
const GENRES = [
  {id:'house',l:'House',d:'Four-on-floor'},
  {id:'hiphop',l:'Hip-Hop',d:'Boom-bap'},
  {id:'breakbeat',l:'Breaks',d:'Syncopated'},
  {id:'techno',l:'Techno',d:'Driving'},
  {id:'dnb',l:'DnB',d:'Shuffle'},
  {id:'afrobeats',l:'Afrobeats',d:'Poly perc'}
];
const emp = () => { const p={}; for (const t of TR) p[t]=Array(N).fill(0); return p; };
const rng = (a) => { let t=a>>>0; return () => { t+=0x6D2B79F5; let r=Math.imul(t^t>>>15,1|t); r^=r+Math.imul(r^r>>>7,61|r); return ((r^r>>>14)>>>0)/4294967296; }; };
const set = (r,a) => { for (const i of a) if (i>=0&&i<N) r[i]=1; };
function gen(g,seed){
  const r=rng(seed),p=emp();
  if(g==='house'){set(p.kick,[0,4,8,12]);if(r()>.5)p.kick[14]=1;set(p.snare,[4,12]);for(let i=0;i<N;i++)if(i%2)p.hat[i]=1;set(p.perc,[3,7,11,15]);}
  else if(g==='hiphop'){set(p.kick,[0,7,10]);if(r()>.4)p.kick[3]=1;set(p.snare,[4,12]);for(let i=0;i<N;i++)if(i%2===0)p.hat[i]=r()>.15;set(p.perc,[6,14]);}
  else if(g==='breakbeat'){set(p.kick,[0,6,10]);set(p.snare,[4,12,14]);for(let i=0;i<N;i++)p.hat[i]=r()>.35;set(p.perc,[2,8,11,15]);}
  else if(g==='techno'){set(p.kick,[0,4,8,12]);set(p.snare,[4,12]);for(let i=0;i<N;i++)p.hat[i]=1;set(p.perc,[2,6,10,14]);}
  else if(g==='dnb'){set(p.kick,[0,10]);if(r()>.4)p.kick[5]=1;set(p.snare,[4,12]);for(let i=0;i<N;i++)p.hat[i]=r()>.2;set(p.perc,[3,8,11,15]);}
  else{set(p.kick,[0,3,8,11]);set(p.snare,[4,12]);for(let i=0;i<N;i++)if(i%2===0)p.hat[i]=1;set(p.perc,[1,5,9,13]);}
  return p;
}
function rand(seed){
  const r=rng(seed),p=emp(),d={kick:.27,snare:.17,hat:.44,perc:.15};
  for(const t of TR)for(let i=0;i<N;i++){let c=d[t];if(t==='kick'&&i%4===0)c+=.35;if(t==='snare'&&(i===4||i===12))c+=.45;p[t][i]=r()<Math.min(.92,c)?1:0;}
  return p;
}
let dctx, dmaster, nc = new WeakMap();
function daudio(){
  if(!dctx){dctx=new AudioContext();dmaster=dctx.createGain();dmaster.gain.value=.88;const c=dctx.createDynamicsCompressor();c.threshold.value=-12;c.ratio.value=4;dmaster.connect(c);c.connect(dctx.destination);}
  if(dctx.state==='suspended')dctx.resume();return dctx;
}
function nbuf(d){let b=nc.get(dctx);const n=Math.ceil(dctx.sampleRate*Math.max(d,.5));if(b&&b.length>=n)return b;b=dctx.createBuffer(1,n,dctx.sampleRate);const a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;nc.set(dctx,b);return b;}
function kick(t){const o=dctx.createOscillator(),a=dctx.createGain();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.08);a.gain.setValueAtTime(1e-4,t);a.gain.exponentialRampToValueAtTime(.95,t+.004);a.gain.exponentialRampToValueAtTime(1e-4,t+.32);o.connect(a);a.connect(dmaster);o.start(t);o.stop(t+.35);}
function snare(t){const o=dctx.createOscillator(),a=dctx.createGain(),n=dctx.createBufferSource(),f=dctx.createBiquadFilter(),na=dctx.createGain();o.type='triangle';o.frequency.setValueAtTime(185,t);o.frequency.exponentialRampToValueAtTime(110,t+.08);a.gain.setValueAtTime(1e-4,t);a.gain.exponentialRampToValueAtTime(.45,t+.002);a.gain.exponentialRampToValueAtTime(1e-4,t+.12);n.buffer=nbuf(.2);f.type='highpass';f.frequency.value=1800;na.gain.setValueAtTime(1e-4,t);na.gain.exponentialRampToValueAtTime(.55,t+.002);na.gain.exponentialRampToValueAtTime(1e-4,t+.16);o.connect(a);a.connect(dmaster);n.connect(f);f.connect(na);na.connect(dmaster);o.start(t);o.stop(t+.15);n.start(t);n.stop(t+.2);}
function hat(t){const n=dctx.createBufferSource(),bp=dctx.createBiquadFilter(),hp=dctx.createBiquadFilter(),a=dctx.createGain();n.buffer=nbuf(.08);bp.type='bandpass';bp.frequency.value=9000;hp.type='highpass';hp.frequency.value=7000;a.gain.setValueAtTime(1e-4,t);a.gain.exponentialRampToValueAtTime(.32,t+.001);a.gain.exponentialRampToValueAtTime(1e-4,t+.055);n.connect(bp);bp.connect(hp);hp.connect(a);a.connect(dmaster);n.start(t);n.stop(t+.07);}
function perc(t){const o=dctx.createOscillator(),a=dctx.createGain();o.type='square';o.frequency.setValueAtTime(820,t);o.frequency.exponentialRampToValueAtTime(320,t+.04);a.gain.setValueAtTime(1e-4,t);a.gain.exponentialRampToValueAtTime(.28,t+.001);a.gain.exponentialRampToValueAtTime(1e-4,t+.09);o.connect(a);a.connect(dmaster);o.start(t);o.stop(t+.1);}
const playV=(v,t)=>{if(v==='kick')kick(t);else if(v==='snare')snare(t);else if(v==='hat')hat(t);else perc(t);};

let pattern=gen('house',42),bpm=124,swing=.12,genre='house',playing=0,cur=-1,muted={kick:0,snare:0,hat:0,perc:0},next=0,si=0,timer=0;
const tracks=$('tracks'),nums=$('nums'),bars=$('bars'),st=$('st'),playB=$('play');
for(let i=0;i<N;i++){const n=document.createElement('div');n.className='sn'+(i%4===0?' b':'');n.textContent=i+1;n.dataset.i=i;nums.appendChild(n);const b=document.createElement('div');b.className='pb'+(i%4===0?' b':'');b.dataset.i=i;bars.appendChild(b);}
function draw(){
  tracks.innerHTML='';
  for(const t of TR){
    const row=document.createElement('div');row.className='row';
    const lab=document.createElement('button');lab.className='tl'+(muted[t]?' mu':'');
    lab.innerHTML='<strong class="'+META[t].c+'">'+META[t].l+'</strong><span>'+(muted[t]?'muted':META[t].s)+'</span>';
    lab.onclick=()=>{daudio();playV(t,dctx.currentTime);};
    lab.oncontextmenu=e=>{e.preventDefault();muted[t]=!muted[t];draw();};
    const steps=document.createElement('div');steps.className='steps';
    for(let i=0;i<N;i++){
      const pad=document.createElement('button');
      pad.className='pad'+(i%4===0?' be':'')+(pattern[t][i]?' ok '+META[t].p:'')+(cur===i?' ph':'');
      pad.onclick=()=>{const on=!pattern[t][i];pattern[t][i]=on?1:0;if(on&&!playing){daudio();playV(t,dctx.currentTime);}draw();};
      steps.appendChild(pad);
    }
    row.append(lab,steps);tracks.appendChild(row);
  }
  nums.querySelectorAll('.sn').forEach(el=>{const i=+el.dataset.i;el.className='sn'+(i%4===0?' b':'')+(cur===i?' n':'');});
  bars.querySelectorAll('.pb').forEach(el=>{const i=+el.dataset.i;el.className='pb'+(i%4===0?' b':'')+(cur===i?' on':'');});
}
draw();
const dur=s=>{const x=60/bpm/4,w=Math.max(0,Math.min(.75,swing));return s%2===0?x*(1+w):x*(1-w);};
function sched(s,t){const d=Math.max(0,(t-dctx.currentTime)*1000);setTimeout(()=>{if(playing){cur=s;draw();}},d);for(const tr of TR)if(!muted[tr]&&pattern[tr][s])playV(tr,t);}
function tick(){if(!playing||!dctx)return;while(next<dctx.currentTime+.1){sched(si,next);next+=dur(si);si=(si+1)%N;}timer=setTimeout(tick,20);}
function toggle(){daudio();if(playing){playing=0;clearTimeout(timer);cur=-1;playB.textContent='▶';playB.className='btn play';draw();}else{playing=1;si=0;next=dctx.currentTime+.04;playB.textContent='■';playB.className='btn stop';tick();}}
playB.onclick=toggle;
$('clr').onclick=()=>{pattern=emp();st.textContent='Pattern cleared';draw();};
$('rnd').onclick=()=>{const s=Date.now();pattern=rand(s);st.textContent='Randomized · seed '+(s%10000);draw();};
$('ai').onclick=()=>{const s=Date.now();pattern=gen(genre,s);const g=GENRES.find(x=>x.id===genre);st.textContent='AI · '+(g?g.l:genre)+' · seed '+(s%10000);draw();};
const gb=$('gb'),gm=$('gm');
gb.onclick=e=>{e.stopPropagation();if(!gm.hidden){gm.hidden=1;return;}gm.innerHTML='';for(const g of GENRES){const b=document.createElement('button');b.textContent=g.l+' — '+g.d;b.onclick=()=>{genre=g.id;gb.textContent=g.l+' ▾';gm.hidden=1;};gm.appendChild(b);}gm.hidden=0;};
document.addEventListener('click',()=>gm.hidden=1);
$('bpm').oninput=e=>{bpm=+e.target.value;$('bv').textContent=bpm+' BPM';};
$('sw').oninput=e=>{swing=(+e.target.value)/100;$('sv').textContent=Math.round(swing*100)+'%';};
$('vl').oninput=e=>{const v=(+e.target.value)/100;$('vv').textContent=Math.round(v*100)+'%';if(dmaster)dmaster.gain.value=v;};
addEventListener('keydown',e=>{if(e.code==='Space'&&e.target.tagName!=='INPUT'&&e.target.tagName!=='BUTTON'&&!modes.drums.classList.contains('hidden')){e.preventDefault();toggle();}});

/* ══════════════════════════════════════
   MODULAR SYNTH (AS3340-class)
   ══════════════════════════════════════ */
const P = {
  scale:1, offset:0, hf:0.15,
  saw:0.7, tri:0.25, pulse:0.45, pwm:0.35,
  detune:7, sync:1, glide:0.02,
  ftype:'lowpass', cutoff:1800, q:4.5, fenv:0.55, flfo:0.2,
  a:0.01, d:0.18, s:0.65, r:0.28,
  lfoRate:4.2, lfoDepth:0.35, lfoDest:'filter',
  drive:0.25, delayT:0.28, delayFb:0.35, delayMix:0.22,
  chorusR:0.35, chorusD:0.003, chorusMix:0.2, master:0.72
};

let sctx=null, nodes=null, gateOn=false, baseMidi=48, oct=0, held=null, pwmPhase=0, raf=0;

function driveCurve(amt){
  const n=1024, c=new Float32Array(n), k=1+amt*40;
  for(let i=0;i<n;i++){const x=(i*2)/(n-1)-1;c[i]=((1+k)*x)/(1+k*Math.abs(x));}
  return c;
}
function pwmCurve(w){
  const n=2048, c=new Float32Array(n), thr=(w*2-1)*0.92;
  for(let i=0;i<n;i++){const x=(i*2)/(n-1)-1;c[i]=x>thr?1:-1;}
  return c;
}

async function ensureSynth(){
  if(sctx){if(sctx.state==='suspended')await sctx.resume();return;}
  sctx=new AudioContext();
  const mix=sctx.createGain(); mix.gain.value=0.45;
  const drive=sctx.createWaveShaper(); drive.curve=driveCurve(P.drive); drive.oversample='2x';
  const vcf=sctx.createBiquadFilter(); vcf.type=P.ftype; vcf.frequency.value=P.cutoff; vcf.Q.value=P.q;
  const vca=sctx.createGain(); vca.gain.value=0;

  const cDry=sctx.createGain(), cWet=sctx.createGain(), cDel=sctx.createDelay(0.05);
  const cLfo=sctx.createOscillator(), cDep=sctx.createGain();
  cDel.delayTime.value=0.012; cLfo.type='sine'; cLfo.frequency.value=P.chorusR; cDep.gain.value=P.chorusD;
  cDry.gain.value=1-P.chorusMix; cWet.gain.value=P.chorusMix;
  cLfo.connect(cDep); cDep.connect(cDel.delayTime); cLfo.start();

  const del=sctx.createDelay(1.5), dfb=sctx.createGain(), dWet=sctx.createGain(), dDry=sctx.createGain();
  del.delayTime.value=P.delayT; dfb.gain.value=P.delayFb; dWet.gain.value=P.delayMix; dDry.gain.value=1-P.delayMix*0.5;

  const master=sctx.createGain(); master.gain.value=P.master;
  const comp=sctx.createDynamicsCompressor();
  comp.threshold.value=-14; comp.knee.value=18; comp.ratio.value=3.5; comp.attack.value=0.005; comp.release.value=0.12;

  mix.connect(drive); drive.connect(vcf); vcf.connect(vca);
  vca.connect(cDry); vca.connect(cDel); cDel.connect(cWet);
  cDry.connect(dDry); cWet.connect(dDry); cDry.connect(del); cWet.connect(del);
  del.connect(dfb); dfb.connect(del); del.connect(dWet);
  dDry.connect(master); dWet.connect(master); master.connect(comp); comp.connect(sctx.destination);

  const saw=sctx.createOscillator(), tri=sctx.createOscillator(), pulse=sctx.createOscillator();
  saw.type='sawtooth'; tri.type='triangle'; pulse.type='square';
  const sawG=sctx.createGain(), triG=sctx.createGain(), pulseG=sctx.createGain();
  const sh=sctx.createWaveShaper(); sh.curve=pwmCurve(P.pwm);
  saw.connect(sawG); tri.connect(triG); pulse.connect(sh); sh.connect(pulseG);
  sawG.connect(mix); triG.connect(mix); pulseG.connect(mix);

  const lfo=sctx.createOscillator(), lfoG=sctx.createGain();
  lfo.type='triangle'; lfo.frequency.value=P.lfoRate; lfoG.gain.value=0;
  lfo.connect(lfoG); lfoG.connect(vcf.frequency);

  saw.start(); tri.start(); pulse.start(); lfo.start();

  nodes={mix,drive,vcf,vca,cDry,cWet,cDel,cLfo,cDep,del,dfb,dWet,dDry,master,saw,tri,pulse,sawG,triG,pulseG,sh,lfo,lfoG};
  applyWave(); applyFreq(baseMidi);
  $('m-status').textContent='AS3340 voice online · Eurorack 1V/oct · VCO→VCF→VCA';
  $('pwr').textContent='Engaged'; $('pwr').className='btn sec';

  const tickPwm=()=>{
    if(nodes && P.lfoDest==='pwm' && gateOn){
      pwmPhase+=0.016*P.lfoRate;
      const mod=clamp(P.pwm+Math.sin(pwmPhase)*0.25*P.lfoDepth,0.05,0.95);
      nodes.sh.curve=pwmCurve(mod);
    }
    raf=requestAnimationFrame(tickPwm);
  };
  raf=requestAnimationFrame(tickPwm);
}

function applyWave(){
  if(!nodes)return;
  const sum=P.saw+P.tri+P.pulse||1;
  nodes.sawG.gain.value=P.saw/sum; nodes.triG.gain.value=P.tri/sum; nodes.pulseG.gain.value=P.pulse/sum;
}
function applyFreq(midi){
  if(!nodes)return;
  const f=expo(midiToV(midi),P.scale,P.offset,P.hf);
  const det=Math.pow(2,P.detune/1200);
  const t=sctx.currentTime, g=Math.max(0.001,P.glide);
  nodes.saw.frequency.setTargetAtTime(f,t,g);
  nodes.tri.frequency.setTargetAtTime(f*det,t,g);
  nodes.pulse.frequency.setTargetAtTime(f*(P.sync>1?P.sync:1),t,g);
}
function applyAll(){
  if(!nodes)return;
  const t=sctx.currentTime;
  nodes.drive.curve=driveCurve(P.drive);
  nodes.vcf.type=P.ftype; nodes.vcf.Q.setTargetAtTime(P.q,t,0.02);
  if(!gateOn)nodes.vcf.frequency.setTargetAtTime(P.cutoff,t,0.03);
  nodes.del.delayTime.setTargetAtTime(P.delayT,t,0.05);
  nodes.dfb.gain.setTargetAtTime(P.delayFb,t,0.05);
  nodes.dWet.gain.setTargetAtTime(P.delayMix,t,0.05);
  nodes.dDry.gain.setTargetAtTime(1-P.delayMix*0.5,t,0.05);
  nodes.cLfo.frequency.setTargetAtTime(P.chorusR,t,0.05);
  nodes.cDep.gain.setTargetAtTime(P.chorusD,t,0.05);
  nodes.cWet.gain.setTargetAtTime(P.chorusMix,t,0.05);
  nodes.cDry.gain.setTargetAtTime(1-P.chorusMix,t,0.05);
  nodes.master.gain.setTargetAtTime(P.master,t,0.03);
  nodes.lfo.frequency.setTargetAtTime(P.lfoRate,t,0.05);
  nodes.lfoG.gain.setTargetAtTime(P.lfoDest==='filter'?P.lfoDepth*P.flfo*900:0,t,0.05);
  if(P.lfoDest!=='pwm')nodes.sh.curve=pwmCurve(P.pwm);
  applyWave(); applyFreq(baseMidi); updateCal();
}

function noteOn(midi){
  if(!nodes)return;
  baseMidi=midi; gateOn=true;
  const t=sctx.currentTime; applyFreq(midi);
  const g=nodes.vca.gain;
  g.cancelScheduledValues(t); g.setValueAtTime(Math.max(g.value,1e-4),t);
  g.linearRampToValueAtTime(1,t+Math.max(0.001,P.a));
  g.linearRampToValueAtTime(P.s,t+Math.max(0.001,P.a)+Math.max(0.001,P.d));
  const base=P.cutoff, peak=clamp(base+P.fenv*6500,80,14000);
  const f=nodes.vcf.frequency;
  f.cancelScheduledValues(t); f.setValueAtTime(base,t);
  f.linearRampToValueAtTime(peak,t+0.005);
  f.linearRampToValueAtTime(base+(peak-base)*0.25,t+0.25);
  const v=midiToV(midi), hz=expo(v,P.scale,P.offset,P.hf);
  $('m-status').textContent='Gate · CV '+v.toFixed(3)+' V · '+hz.toFixed(1)+' Hz';
}
function noteOff(){
  if(!nodes||!gateOn)return; gateOn=false;
  const t=sctx.currentTime;
  const g=nodes.vca.gain;
  g.cancelScheduledValues(t); g.setValueAtTime(Math.max(g.value,1e-4),t);
  g.linearRampToValueAtTime(1e-4,t+Math.max(0.01,P.r));
  nodes.vcf.frequency.cancelScheduledValues(t);
  nodes.vcf.frequency.setTargetAtTime(P.cutoff,t,P.r*0.3);
}

function updateCal(){
  const f0=expo(0,P.scale,P.offset,0), f1=expo(1,P.scale,P.offset,0);
  const ratio=f1/f0, mv=18*P.scale;
  $('cal').innerHTML='<p class="t">Expo calibration</p>pair ≈ <b>'+mv.toFixed(2)+' mV/oct</b> · octave ratio <b>'+ratio.toFixed(4)+'</b> (ideal 2.000)<br>0 V → <b>'+f0.toFixed(2)+' Hz</b> · +1 V → <b>'+f1.toFixed(2)+' Hz</b><br><span style="color:var(--fa)">f = f₀ · 2^(V·scale + offset) · HF track (AS3340 pin-7 style)</span>';
}
updateCal();

$('pwr').onclick=async()=>{await ensureSynth(); applyAll();};

const bind = (id, key, parse=Number, after=()=>{}) => {
  const el=$(id); if(!el)return;
  el.oninput=()=>{P[key]=parse(el.value); if($(id+'-v')) $(id+'-v').textContent=fmt(key,P[key]); applyAll(); after();};
};
const fmt = (k,v) => {
  if(k==='scale'||k==='offset')return (+v).toFixed(3)+(k==='offset'?' V':'');
  if(k==='hf'||k==='pwm'||k==='saw'||k==='tri'||k==='pulse'||k==='fenv'||k==='flfo'||k==='s'||k==='lfoDepth'||k==='drive'||k==='delayFb'||k==='delayMix'||k==='chorusMix'||k==='master')return Math.round(v*100)+'%';
  if(k==='detune')return (+v).toFixed(1)+' ¢';
  if(k==='sync')return (+v).toFixed(2);
  if(k==='glide'||k==='a'||k==='d'||k==='r'||k==='delayT')return Math.round(v*1000)+' ms';
  if(k==='cutoff')return Math.round(v)+' Hz';
  if(k==='q')return (+v).toFixed(1);
  if(k==='lfoRate'||k==='chorusR')return (+v).toFixed(2)+' Hz';
  if(k==='chorusD')return (v*1000).toFixed(1)+' ms';
  return String(v);
};
['scale','offset','hf','pwm','saw','tri','pulse','detune','sync','glide','cutoff','q','fenv','flfo','a','d','s','r','lfoRate','lfoDepth','drive','master','chorusR','chorusD','chorusMix','delayT','delayFb','delayMix'].forEach(k=>bind(k,k));

document.querySelectorAll('[data-ftype]').forEach(b=>{
  b.onclick=()=>{P.ftype=b.dataset.ftype; document.querySelectorAll('[data-ftype]').forEach(x=>x.classList.toggle('on',x===b)); applyAll();};
});
document.querySelectorAll('[data-lfo]').forEach(b=>{
  b.onclick=()=>{P.lfoDest=b.dataset.lfo; document.querySelectorAll('[data-lfo]').forEach(x=>x.classList.toggle('on',x===b)); applyAll();};
});

const PRESETS={
  bass:{saw:.9,tri:.1,pulse:.15,cutoff:420,q:6,fenv:.75,flfo:.05,a:.005,d:.2,s:.4,r:.15,drive:.4,delayMix:.08},
  pad:{saw:.35,tri:.7,pulse:.2,cutoff:2200,q:1.2,fenv:.25,flfo:.35,a:.35,d:.4,s:.8,r:.9,lfoRate:.25,lfoDepth:.4,lfoDest:'filter',chorusMix:.35,delayT:.4,delayFb:.4,delayMix:.3,drive:.1},
  lead:{saw:.2,tri:.15,pulse:.95,pwm:.28,cutoff:3200,q:3,fenv:.4,flfo:.15,a:.01,d:.15,s:.7,r:.2,lfoRate:5.5,lfoDepth:.55,lfoDest:'pwm',drive:.3,delayT:.32,delayFb:.38,delayMix:.28,chorusMix:.25},
  pluck:{saw:.5,tri:.4,pulse:.3,cutoff:900,q:8,fenv:.9,flfo:0,a:.001,d:.25,s:.05,r:.15,drive:.2,delayT:.22,delayFb:.45,delayMix:.25},
  west:{saw:.15,tri:.2,pulse:.85,sync:2.01,ftype:'bandpass',cutoff:1100,q:2.5,fenv:.5,flfo:.3,a:.02,d:.3,s:.5,r:.4,lfoRate:.4,lfoDepth:.5,drive:.55,delayT:.18,delayFb:.5,delayMix:.2}
};
document.querySelectorAll('[data-preset]').forEach(b=>{
  b.onclick=async()=>{
    await ensureSynth();
    Object.assign(P, PRESETS[b.dataset.preset]||{});
    // sync UI
    for(const k of Object.keys(P)){
      const el=$(k); if(el && 'value' in el){ el.value=P[k]; if($(k+'-v')) $(k+'-v').textContent=fmt(k,P[k]); }
    }
    document.querySelectorAll('[data-ftype]').forEach(x=>x.classList.toggle('on',x.dataset.ftype===P.ftype));
    document.querySelectorAll('[data-lfo]').forEach(x=>x.classList.toggle('on',x.dataset.lfo===P.lfoDest));
    document.querySelectorAll('[data-preset]').forEach(x=>x.classList.toggle('on',x===b));
    applyAll();
    $('m-status').textContent='Patch · '+b.textContent;
  };
});

$('oct-').onclick=()=>{oct=Math.max(-2,oct-1);$('octv').textContent='Oct '+(oct>=0?'+'+oct:oct);};
$('oct+').onclick=()=>{oct=Math.min(2,oct+1);$('octv').textContent='Oct '+(oct>=0?'+'+oct:oct);};

async function press(midiBase){
  await ensureSynth();
  const m=midiBase+oct*12;
  noteOn(m); held=m;
  document.querySelectorAll('.white,.black').forEach(el=>{
    el.classList.toggle('on', +el.dataset.midi+oct*12===m);
  });
}
function release(){
  noteOff(); held=null;
  document.querySelectorAll('.white,.black').forEach(el=>el.classList.remove('on'));
}

// keyboard UI
const WHITE=[{m:48,l:'C'},{m:50,l:'D'},{m:52,l:'E'},{m:53,l:'F'},{m:55,l:'G'},{m:57,l:'A'},{m:59,l:'B'},{m:60,l:'C'},{m:62,l:'D'},{m:64,l:'E'},{m:65,l:'F'},{m:67,l:'G'},{m:69,l:'A'},{m:72,l:'C'}];
const BLACK={49:1,51:1,54:1,56:1,58:1,61:1,63:1};
const whites=$('whites'), blacks=$('blacks');
WHITE.forEach((k,i)=>{
  const b=document.createElement('button');
  b.className='white'; b.dataset.midi=k.m; b.textContent=k.l;
  b.onpointerdown=e=>{e.preventDefault();press(k.m);};
  b.onpointerup=release; b.onpointerleave=()=>{if(held===k.m+oct*12)release();};
  whites.appendChild(b);
  const slot=document.createElement('div'); slot.className='black-slot';
  if(BLACK[k.m+1] && i<WHITE.length-1){
    const bk=document.createElement('button');
    bk.className='black'; bk.dataset.midi=k.m+1; bk.textContent='#';
    bk.onpointerdown=e=>{e.preventDefault();e.stopPropagation();press(k.m+1);};
    bk.onpointerup=release;
    slot.appendChild(bk);
  }
  blacks.appendChild(slot);
});

const keyMap={KeyA:48,KeyW:49,KeyS:50,KeyE:51,KeyD:52,KeyF:53,KeyT:54,KeyG:55,KeyY:56,KeyH:57,KeyU:58,KeyJ:59,KeyK:60};
const down=new Set();
addEventListener('keydown',e=>{
  if(e.repeat||!(e.code in keyMap))return;
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(modes.modular.classList.contains('hidden'))return;
  down.add(e.code); press(keyMap[e.code]);
});
addEventListener('keyup',e=>{
  if(!(e.code in keyMap))return;
  down.delete(e.code); if(down.size===0)release();
});

})();
