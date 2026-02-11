// @ts-nocheck
/* eslint-disable */
/**
 * KEYS & ARMS ゲームエンジン
 * 元 HTML ファイルのゲームコード（2,458行）をクロージャに格納。
 * ゲームロジックの改変は DOM 参照の差し替えのみ。
 */

export interface Engine {
  start(): void;
  stop(): void;
  resize(): void;
  handleKeyDown(key: string): void;
  handleKeyUp(key: string): void;
}

export function createEngine(canvas: HTMLCanvasElement): Engine {


/* ================================================================
   KEYS & ARMS — Game & Watch tribute game
   Architecture: DRY / SOLID / DbC / Functional-declarative style
   
   Modules:
   - Contracts (DbC)     : assert for development-time checks
   - Pure Utilities       : clamp/rng/rngInt/rngSpread/TAU
   - Drawing Helpers      : onFill/onStroke/circle/circleS/lcdFg/lcdBg
   - Particles            : Generic spawn + update/draw pool
   - Popups               : Unified popup system
   - Difficulty            : Pure functions for all game balance params
   - Input                : Keyboard + touch state
   - Audio                : Tone/noise/BGM/SFX
   - Stage 1 (Cave)      : Exploration, keys, cage/bat/mimic/spider
   - Stage 2 (Prairie)   : 3-lane defense, combo, sweep, shield orbs
   - Stage 3 (Castle)    : Circular boss, arms, gems, counter, rage
   - UI Screens           : Title, Game Over, Endings
   - Game Loop            : Tick/Render/Frame state machine
   ================================================================ */

/* ================================================================
   CONTRACTS (DbC) — Development-time assertions
   ================================================================ */
const DEBUG = false;
const assert = (cond, msg='Assertion failed') => { if(DEBUG && !cond) throw new Error(msg); };

/* ================================================================
   PURE UTILITIES — No side effects, no canvas dependency
   ================================================================ */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rng = (lo=0, hi=1) => lo + Math.random() * (hi - lo);
const rngInt = (lo, hi) => Math.floor(rng(lo, hi + 1));
const rngSpread = (spread) => (Math.random() - .5) * spread * 2;
const TAU = Math.PI * 2;

/* ================================================================
   CANVAS & LAYOUT — Single source of truth for display constants
   ================================================================ */
const W=440,H=340,cv=canvas;const $=cv.getContext('2d')!;
cv.width=W;cv.height=H;
function resize(){const s=Math.min(window.innerWidth*0.94/W,(window.innerHeight*0.62)/H,2.5);cv.style.width=(W*s)+'px';cv.style.height=(H*s)+'px';}
resize();
/* LCD Color Palette */
const BG='#b0bc98',GH='rgba(80,92,64,0.14)',ON='#1a2810',RK='rgba(80,92,64,0.32)';

/* ================================================================
   DECLARATIVE DRAWING — Reduces repeated alpha/fill patterns
   ================================================================ */
/** LCD on/off color — DRY for all icon/sprite functions */
const lcdFg = (on) => on ? ON : GH;
const lcdBg = (on) => on ? BG : 'rgba(176,188,152,0.3)';

/** Draw a filled circle */
function circle(x, y, r) {
  $.beginPath(); $.arc(x, y, r, 0, TAU); $.fill();
}

/** Draw a stroked circle */
function circleS(x, y, r) {
  $.beginPath(); $.arc(x, y, r, 0, TAU); $.stroke();
}

/** Shorthand for ON-colored fill at alpha */
function onFill(alpha) { $.fillStyle = ON; $.globalAlpha = alpha; }

/** Shorthand for ON-colored stroke at alpha */
function onStroke(alpha, lw=1) { $.strokeStyle = ON; $.lineWidth = lw; $.globalAlpha = alpha; }

/* ================================================================
   GENERIC PARTICLE SYSTEM — DRY replacement for 6+ inline systems
   @param {Array} pool - Mutable particle array
   @param {Object} opts - {x,y,n,vxSpread,vySpread,vyBase,life,s,rot,gravity}
   ================================================================ */
const Particles = {
  /** Spawn n particles into pool. Returns pool for chaining. */
  spawn(pool, {x, y, n=4, vxSpread=2, vySpread=2, vyBase=0, life=12, s=3, rot=false, gravity=0}) {
    assert(Array.isArray(pool), 'pool must be array');
    for (let i = 0; i < n; i++) {
      pool.push({
        x: x + rng(-4, 4), y: y + rng(-4, 4),
        vx: rngSpread(vxSpread), vy: vyBase + rngSpread(vySpread),
        life, maxLife: life, s, rot: rot ? rng(0, 6) : 0, gravity
      });
    }
    return pool;
  },

  /** Update and render particles. Mutates pool in place. Pure filter + physics. */
  updateAndDraw(pool, color=ON) {
    $.fillStyle = color;
    for (let i = pool.length - 1; i >= 0; i--) {
      const p = pool[i];
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life--;
      if (p.life <= 0) { pool.splice(i, 1); continue; }
      $.globalAlpha = p.life / p.maxLife;
      $.fillRect(p.x, p.y, p.s, p.s);
    }
    $.globalAlpha = 1;
  }
};

/** Generic popup system (DRY: score/status popups) */
const Popups = {
  pool: [],
  add(x, y, t) { this.pool.push({x, y, t, life: 50}); },
  clear() { this.pool = []; },
  updateAndDraw() {
    this.pool = this.pool.filter(p => {
      p.life--; p.y -= .5;
      if (p.life <= 0) return false;
      $.globalAlpha = Math.min(1, p.life / 20);
      txt(p.t, p.x, p.y, 6);
      $.globalAlpha = 1;
      return true;
    });
  }
};

/* ================================================================
   INPUT MODULE — Keyboard & touch state management
   ================================================================ */
const kd={},jp={};
// キーボードイベントは React 側で管理

// タッチボタンは React 側で管理
function J(k){return jp[k.toLowerCase()];}function clearJ(){for(const k in jp)delete jp[k];}
function jAct(){return J('z')||J(' ');}

/* ================================================================
   AUDIO MODULE — AudioContext, tone generator, noise, SFX
   ================================================================ */
let ac;function ea(){if(!ac)ac=new((window as any).AudioContext||(window as any).webkitAudioContext)();}
function tn(f,d,tp='square',v=.04){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain();
  o.type=tp;o.frequency.value=f;g.gain.setValueAtTime(v,ac.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);
  o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d);}
function noise(d,v=.02){if(!ac)return;const n=ac.createBufferSource(),buf=ac.createBuffer(1,ac.sampleRate*d,ac.sampleRate),
  data=buf.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*v;
  n.buffer=buf;const g=ac.createGain();g.gain.setValueAtTime(v,ac.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);n.connect(g);g.connect(ac.destination);n.start();n.stop(ac.currentTime+d);}

/* === BGM SYSTEM — ambient rhythm per stage === */
let bgmBeat=0;
function bgmTick(){
  if(!ac)return;
  // Silence during victory sequences
  if((state==='cave'&&cav.won)||(state==='grass'&&grs.won)||(state==='boss'&&bos.won))return;
  bgmBeat++;
  if(state==='cave'){
    // Cave: sparse echoing drips
    if(bgmBeat%4===0)tn(165,.08,'sine',.02);  // soft plink
    if(bgmBeat%8===0)tn(82,.2,'triangle',.02); // bass hum
    if(bgmBeat%16===0)tn(330,.06,'sine',.012); // high harmonic
  }else if(state==='grass'){
    // Prairie: military march pulse
    if(bgmBeat%2===0)tn(110,.06,'triangle',.025); // bass kick
    if(bgmBeat%2===1)tn(880,.015,'square',.015);  // hi-hat snap
    if(bgmBeat%4===0)tn(220,.08,'square',.018);   // march accent
    if(bgmBeat%8===0)tn(330,.06,'square',.012);   // phrase end
  }else if(state==='boss'){
    // Boss: tense heartbeat throb
    tn(55,.15,'triangle',.022); // every beat: deep pulse
    if(bgmBeat%2===0)tn(82,.12,'sawtooth',.015);  // bass throb
    if(bgmBeat%4===0)tn(185,.08,'square',.012);   // dissonant accent
    if(bgmBeat%8===3)tn(147,.06,'sawtooth',.01);  // off-beat tension
  }
}

/* === HITSTOP — freeze game for N frames on impact === */
let hitStop=0,beatPulse=0;
function doHitStop(n){hitStop=n;}

const S={tick(){tn(1500,.01,'square',.015);},move(){tn(880,.03);},
  grab(){tn(1100,.08);setTimeout(()=>tn(1400,.07),50);doHitStop(3);},
  hit(){tn(90,.2,'sawtooth',.08);tn(70,.25,'square',.04);noise(.15,.03);doHitStop(4);},
  kill(){tn(800,.04);setTimeout(()=>tn(1100,.04),35);doHitStop(2);},
  pry(){tn(500,.03);},guard(){tn(300,.08);tn(600,.06);noise(.04,.01);doHitStop(2);},
  clear(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tn(f,.15,'square',.05),i*100));},
  over(){[400,320,240,160].forEach((f,i)=>setTimeout(()=>tn(f,.2,'sawtooth',.05),i*150));},
  start(){tn(523,.08);setTimeout(()=>tn(659,.08),70);setTimeout(()=>tn(784,.07),140);bgmBeat=0;},
  warn(){tn(220,.07,'square',.03);tn(165,.05,'sawtooth',.02);},
  steal(){tn(180,.14,'sawtooth',.06);setTimeout(()=>tn(120,.12,'square',.04),60);noise(.08,.02);doHitStop(3);},
  shieldBreak(){tn(400,.06);tn(200,.12,'sawtooth',.04);noise(.06,.02);doHitStop(3);},
  gem(){tn(660,.06);setTimeout(()=>tn(880,.06),50);setTimeout(()=>tn(1100,.05),100);doHitStop(2);},
  zap(){tn(150,.15,'sawtooth',.06);tn(100,.1,'square',.04);noise(.1,.02);doHitStop(4);},
  set(){tn(440,.08);setTimeout(()=>tn(660,.08),60);setTimeout(()=>tn(880,.07),120);doHitStop(3);},
  step(){tn(600,.02,'square',.015);},
  ladder(){tn(300,.04);setTimeout(()=>tn(350,.04),40);},
  safe(){tn(500,.04,'sine',.025);setTimeout(()=>tn(600,.03,'sine',.02),30);},
  drip(){tn(2000,.025,'sine',.008);},
  combo(n){const f=600+n*60;tn(f,.04,'square',.025);setTimeout(()=>tn(f*1.25,.03),25);},
  bossDie(){[200,160,120,80].forEach((f,i)=>setTimeout(()=>{tn(f,.2,'sawtooth',.06);noise(.08,.02);},i*120));}};

function R(a,b,w,h,on){$.fillStyle=lcdFg(on);$.fillRect(Math.round(a),Math.round(b),w,h);}
function txt(s,a,b,sz,on,al){$.fillStyle=lcdFg(on===undefined||on);
  $.font=(sz||8)+'px "Press Start 2P"';$.textAlign=al||'left';$.textBaseline='top';
  $.fillText(s,Math.round(a),Math.round(b));}
function txtC(s,a,b,sz,on){txt(s,a,b,sz,on,'center');}
/** Sprite pixel renderer. flip=true mirrors horizontally */
function px(data,dx,dy,s,on,flip){
  const w=data[0].length;
  for(let r=0;r<data.length;r++)for(let c=0;c<w;c++){
    const v=data[r][flip?w-1-c:c];
    if(v===1){$.fillStyle=lcdFg(on);$.fillRect(dx+c*s,dy+r*s,s,s);}
    if(v===2){$.fillStyle=lcdBg(on);$.fillRect(dx+c*s,dy+r*s,s,s);}}}
function drawK(spr,x,y,s,on,dir){px(spr,x,y,s,on,dir<0);}

/* ============ SPRITES ============ */
const K_R=[[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,0,1,1,0,0],[0,1,1,1,0,0,1,1,1,0]];
const K_RW=[[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,0,0,1,1,0,0],[0,1,1,0,0,0,0,1,1,0],[1,1,0,0,0,0,0,0,1,1],[1,1,0,0,0,0,0,0,1,1]];
const K_F=[[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,2,2,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,1,1,1,1,1,1,1,1,0],[0,1,1,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1,1,1],[1,0,1,1,1,1,1,1,0,1],[0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,0,1,1,0,0],[0,1,1,1,0,0,1,1,1,0]];
const K_PK=[[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,0,1,1,0,0],[0,1,1,1,0,0,1,1,1,0]];
const K_CLR=[[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,1,1,1,1,0,0],[0,0,1,1,1,0,0,1,0,0],[0,0,1,1,0,0,0,1,1,0],[0,1,1,1,0,0,1,1,1,0]];
const K_JP=[[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,0,1,1,0,0,0],[0,1,1,1,0,1,1,1,0,0],[0,1,1,0,0,0,1,1,0,0]];
const K_DK=[[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,2,2,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,1,1,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1,1,1],[1,0,1,1,1,1,1,1,0,1],[0,0,0,0,0,0,0,0,0,0],[0,1,1,1,1,1,1,1,1,0],[1,1,1,1,0,0,1,1,1,1]];
const K_RE=[[0,0,0,0,1,1,0,0,0,0],[0,0,0,0,1,1,0,0,0,0],[0,0,0,0,1,1,0,0,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,2,2,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,1,1,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1,1,1],[1,0,0,1,1,1,1,0,0,1],[0,0,0,1,0,0,1,0,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,0,1,1,0,0],[0,1,1,1,0,0,1,1,1,0]];
const K_AT=[[0,0,0,1,1,1,1,0,0,0,0,0],[0,0,1,1,1,1,1,1,0,0,0,0],[0,0,1,1,1,2,2,1,0,0,0,0],[0,0,0,1,1,1,1,0,0,0,0,0],[0,0,1,1,1,1,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,1,1,1],[0,0,0,1,1,1,1,0,0,0,0,0],[0,0,1,1,0,0,1,1,0,0,0,0],[0,0,1,1,0,0,1,1,0,0,0,0],[0,0,1,1,0,0,1,1,0,0,0,0],[0,1,1,1,0,0,1,1,1,0,0,0]];
const K_PR=[[0,0,0,0,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,0,0],[0,0,0,1,1,1,2,2,1,0,0],[0,0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,1,1],[0,0,0,1,1,1,1,1,0,0,0],[0,0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,0,0,0,1,1,0],[0,0,1,1,0,0,0,1,1,0,0],[0,1,1,1,0,0,1,1,1,0,0]];
const K_HU=[[0,1,0,1,0,0,1,0,1,0],[0,0,0,0,1,1,0,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,2,2,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,1,0,1,1,1,1,0,1,0],[1,0,1,1,1,1,1,1,0,1],[0,1,1,1,1,1,1,1,1,0],[0,0,0,1,0,0,1,0,0,0],[0,0,1,0,0,0,0,1,0,0],[0,0,0,1,0,0,1,0,0,0],[0,1,1,0,0,0,0,1,1,0]];
const K_CR=[[0,0,0,1,1,1,0,0,0,0],[0,0,0,1,2,1,0,0,0,0],[0,0,0,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,0,1,0,0,1,0,0,0],[0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,0,1,1,0,0],[0,1,1,1,0,0,1,1,1,0]];
const K_CRW=[[0,0,0,1,1,1,0,0,0,0],[0,0,0,1,2,1,0,0,0,0],[0,0,0,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,0,1,0,0,1,0,0,0],[0,1,1,0,0,0,0,1,1,0],[1,1,0,0,0,0,0,0,1,1],[1,1,0,0,0,0,0,0,1,1]];
const K_CJP=[[0,0,0,1,1,1,0,0,0,0],[0,0,0,1,2,1,0,0,0,0],[0,0,0,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,1,1,0,1,1,0,0,0],[0,1,1,1,0,1,1,1,0,0]];
const K_CCLR=[[0,0,0,1,1,1,0,0,0,0],[0,0,0,1,2,1,0,0,0,0],[0,0,0,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,1,1,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,0],[0,0,0,0,1,1,1,1,0,0],[0,0,1,1,1,0,0,1,0,0],[0,1,1,1,0,0,1,1,1,0]];
const K_CDK=[[0,0,0,1,1,1,0,0,0,0],[0,0,0,1,2,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,2,2,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,1,1,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1,1,1],[1,0,1,1,1,1,1,1,0,1],[0,1,1,1,1,1,1,1,1,0],[1,1,1,1,0,0,1,1,1,1]];
const K_CL=[[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,2,2,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[1,1,1,1,1,1,1,1,0,0],[1,1,1,1,1,1,1,1,1,1],[0,0,1,1,1,1,1,1,1,1],[0,0,1,1,0,0,1,1,0,0],[0,1,1,0,0,0,0,1,1,0],[1,1,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,1,1,0,0],[0,0,0,0,0,1,1,1,0,0]];
const K_CL2=[[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,2,2,2,2,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,0,0],[0,0,1,1,0,0,1,1,0,0],[0,1,1,0,0,0,0,1,1,0],[1,1,0,0,0,0,0,0,1,1],[0,0,1,1,0,0,0,0,0,0],[0,1,1,1,0,0,0,0,0,0]];

const BAT_FU=[[0,1,1,0,0,0,0,0,0,1,1,0],[1,1,1,1,0,0,0,0,1,1,1,1],[1,1,1,1,1,0,0,1,1,1,1,1],[0,0,0,1,1,1,1,1,1,0,0,0],[0,0,0,1,2,1,1,2,1,0,0,0],[0,0,0,1,1,1,1,1,1,0,0,0],[0,0,0,0,1,1,1,1,0,0,0,0],[0,0,0,0,0,1,1,0,0,0,0,0]];
const BAT_FD=[[0,0,0,0,1,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,1,1,0,0,0],[0,0,0,1,2,1,1,2,1,0,0,0],[0,0,0,1,1,1,1,1,1,0,0,0],[1,1,1,1,1,0,0,1,1,1,1,1],[1,1,1,1,0,0,0,0,1,1,1,1],[0,1,1,0,0,0,0,0,0,1,1,0],[0,0,0,0,0,1,1,0,0,0,0,0]];
const BAT_P=[[0,0,0,0,1,1,1,1,0,0,0,0],[0,0,0,0,0,1,1,0,0,0,0,0],[0,0,0,1,1,1,1,1,1,0,0,0],[0,0,0,1,1,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,1,1,0,0],[0,0,1,1,2,1,1,2,1,1,0,0],[0,0,0,1,1,1,1,1,1,0,0,0],[0,0,0,0,1,1,1,1,0,0,0,0]];
const KEY_D=[[0,1,1,1,1,0],[1,1,2,2,1,1],[1,2,0,0,2,1],[1,1,2,2,1,1],[0,1,1,1,1,0],[0,0,1,1,0,0],[0,0,1,1,0,0],[0,0,1,1,1,0],[0,0,1,1,0,0],[0,0,1,1,1,1]];
const BOLT=[[0,0,0,1,1,0],[0,0,1,1,0,0],[0,1,1,1,0,0],[1,1,1,0,0,0],[1,1,1,1,1,0],[0,0,1,1,1,0],[0,0,1,1,0,0],[0,1,1,0,0,0],[0,1,1,0,0,0],[1,1,0,0,0,0]];
const MIM_C=[[0,1,1,1,1,1,1,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,2,2,1,1,1,1,1,1],[1,1,1,1,1,1,2,2,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,1,1,1,1,0]];
const MIM_CRK=[[0,1,1,1,1,1,1,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,2,2,1,1,1,1,1,1],[1,1,1,1,1,1,2,2,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,1,1,1,1,0]];
const MIM_O=[[0,0,1,1,1,1,1,1,1,1,1,1,0,0],[0,1,1,1,1,1,1,1,1,1,1,1,1,0],[0,1,1,2,2,1,1,1,2,2,1,1,1,0],[1,1,1,2,2,1,1,1,2,2,1,1,1,1],[1,0,1,0,1,0,1,0,1,0,1,0,1,1],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,0,1,0,1,0,1,0,1,0,1,0,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,2,2,1,1,1,1,1,1],[1,1,1,1,1,1,2,2,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,1,1,1,1,0]];
const SPIDER=[[1,0,0,0,1,1,0,0,0,1],[0,1,0,1,1,1,1,0,1,0],[0,0,1,1,1,1,1,1,0,0],[1,0,1,2,1,1,2,1,0,1],[0,1,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,1,0,0],[1,0,0,1,1,1,1,0,0,1],[0,1,0,0,1,1,0,0,1,0]];
const SPIDER_T=[[0,0,0,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,1,2,1,1,2,1,0,0],[0,0,1,1,1,1,1,1,0,0],[0,0,0,1,1,1,1,0,0,0],[0,0,0,0,1,1,0,0,0,0]];
const DOOR_D=[[1,1,1,1,1,1,1,1,1,1],[1,0,0,0,0,0,0,0,0,1],[1,0,2,2,2,2,2,2,0,1],[1,0,2,0,0,0,0,2,0,1],[1,0,2,0,0,0,0,2,0,1],[1,0,2,2,2,2,2,2,0,1],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,1,1,0,0,1],[1,0,0,0,0,1,1,0,0,1],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[1,0,0,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,1,1,1]];
// Rat (small, runs along floor)
const RAT=[[0,0,1,1,0,0,0],[0,1,1,1,1,0,0],[1,1,2,1,1,1,0],[0,1,1,1,1,1,1],[0,0,1,0,1,0,0]];

function iHeart(a,b,on){$.fillStyle=lcdFg(on);$.beginPath();$.arc(a+4,b+4,4,0,TAU);$.arc(a+12,b+4,4,0,TAU);$.fill();$.beginPath();$.moveTo(a,b+6);$.lineTo(a+8,b+14);$.lineTo(a+16,b+6);$.fill();}
function iGem(a,b,on){$.fillStyle=lcdFg(on);$.beginPath();$.moveTo(a+8,b);$.lineTo(a+16,b+9);$.lineTo(a+8,b+18);$.lineTo(a,b+9);$.closePath();$.fill();if(on){$.fillStyle=BG;$.fillRect(a+5,b+5,4,4);}}
function iSlime(a,b,on){$.fillStyle=lcdFg(on);$.beginPath();$.ellipse(a+10,b+12,10,8,0,0,TAU);$.fill();$.fillStyle=on?BG:GH;$.fillRect(a+4,b+9,4,3);$.fillRect(a+12,b+9,4,3);}
function iGoblin(a,b,on){$.fillStyle=lcdFg(on);$.fillRect(a+3,b,14,10);$.fillRect(a-1,b+3,5,4);$.fillRect(a+16,b+3,5,4);$.fillRect(a+2,b+11,16,10);$.fillRect(a+4,b+22,5,5);$.fillRect(a+11,b+22,5,5);$.fillStyle=on?BG:GH;$.fillRect(a+5,b+3,4,3);$.fillRect(a+11,b+3,4,3);}
function iSkel(a,b,on){$.fillStyle=lcdFg(on);$.fillRect(a+3,b,14,10);$.fillRect(a+8,b+10,4,12);$.fillRect(a+2,b+12,16,2);$.fillRect(a+2,b+16,16,2);$.fillRect(a+4,b+22,5,6);$.fillRect(a+11,b+22,5,6);$.fillStyle=on?BG:GH;$.fillRect(a+5,b+2,4,4);$.fillRect(a+11,b+2,4,4);$.fillRect(a+7,b+7,6,2);}
function iBoss(a,b,on){$.fillStyle=lcdFg(on);circle(a,b,24);$.fillStyle=lcdBg(on);circle(a,b,18);$.fillStyle=lcdFg(on);circle(a,b-2,12);$.fillStyle=on?BG:GH;$.fillRect(a-9,b-6,4,4);$.fillRect(a-2,b-6,4,4);$.fillRect(a+5,b-6,4,4);$.fillRect(a-4,b+3,8,3);$.fillStyle=lcdFg(on);$.beginPath();$.moveTo(a-11,b-12);$.lineTo(a-7,b-22);$.lineTo(a-3,b-12);$.fill();$.beginPath();$.moveTo(a+3,b-12);$.lineTo(a+7,b-22);$.lineTo(a+11,b-12);$.fill();}
function iArmDown(a,b,on){$.fillStyle=lcdFg(on);$.fillRect(a+2,b,6,28);$.fillRect(a-2,b+26,5,5);$.fillRect(a+7,b+26,5,5);$.fillRect(a,b+30,10,3);}
function iArmUp(a,b,on){$.fillStyle=lcdFg(on);$.fillRect(a+2,b,6,12);$.fillRect(a,b+10,10,4);}

let state='title',loop=1,score=0,hp=3,maxHp=3;
let tick=0,beatCtr=0,beatNum=0,noDmg=true,hurtFlash=0,shakeT=0;
let hi=parseInt(localStorage.getItem('kaG')||'0');
let resetConfirm=0; // >0 means reset confirmation is showing
let earnedShields=0; // shields earned in Stage 2, carried to Stage 3
/* ================================================================
   DIFFICULTY CONFIG — Pure functions, no side effects
   Open for extension: add new loops by extending the table
   ================================================================ */
const Difficulty = {
  /** Beat length in ticks for a given loop (lower = faster) */
  beatLength(loop) {
    assert(loop >= 1, 'loop must be >= 1');
    if (loop <= 3) return Math.max(20, 34 - (loop - 1) * 7);
    return Math.max(14, 20 - (loop - 3) * 2);
  },

  /** Hazard cycle period for cave traps/enemies. Floor = base - 3 */
  hazardCycle(loop, base) {
    assert(base >= 3, 'base period must be >= 3');
    return Math.max(base - 3, base - loop);
  },

  /** Boss arm speed (beats per move) for a given loop */
  bossArmSpeed(loop) { return loop <= 1 ? 3 : 2; },

  /** Boss arm rest time for a given loop */
  bossArmRest(loop) {
    return [5, 4, 3, 2][clamp(loop - 1, 0, 3)];
  },

  /** Stage 2 enemy goal count */
  grassGoal(loop) { return 10 + loop * 4; },

  /** Stage 2 enemy composition probabilities → {shifterChance, dasherChance} */
  grassEnemyMix(loop) {
    if (loop === 1) return { shifter: .15, dasher: 0 };
    if (loop === 2) return { shifter: .25, dasher: .3 };
    return { shifter: .3, dasher: .45 };
  },

  /** Cage max progress for a given loop */
  cageMax(loop) { return 50 + loop * 15; },

  /** Is this loop the true ending? */
  isTrueEnding(loop) { return loop >= 3; },

  /** Shield count for boss stage: base 1 + earned from Stage 2 */
  bossShields(earned) { return Math.min(5, 1 + earned); }
};
/** BL() — current beat length. Delegates to pure Difficulty module. */
function BL() { return Difficulty.beatLength(loop); }
/** Standard 2-beat duration (damage invulnerability, counter cooldown, etc.) */
function twoBeatDuration() { return BL() * 2; }
function doHurt(){hp--;noDmg=false;hurtFlash=10;shakeT=8;S.hit();if(hp<=0){state='over';S.over();if(score>hi){hi=score;localStorage.setItem('kaG',hi);}}}
function doBeat(){beatCtr++;if(beatCtr>=BL()){beatCtr=0;beatNum++;S.tick();bgmTick();beatPulse=6;return true;}return false;}
let dispScore=0; // displayed score (rolls up to actual)
function drawHUD(){
  // Score with roll-up animation
  if(dispScore<score)dispScore=Math.min(score,dispScore+Math.max(1,Math.floor((score-dispScore)/8)));
  if(dispScore>score)dispScore=score;
  // Hearts - compact if many
  if(maxHp<=5){for(let i=0;i<maxHp;i++)iHeart(W-58+i*19,4,i<hp);}
  else{iHeart(W-80,4,hp>0);txt(hp+'/'+maxHp,W-60,6,6);}
  const scStr=String(dispScore).padStart(7,'0');
  // Flash new digits
  const scOld=String(Math.max(0,dispScore-100)).padStart(7,'0');
  for(let i=0;i<7;i++){
    const changed=scStr[i]!==scOld[i]&&dispScore<score;
    if(changed){$.globalAlpha=.6+Math.sin(tick*.5)*.3;}
    txt(scStr[i],8+i*13,4,8);
    $.globalAlpha=1;}
  txt('LP'+loop,8,16,6);
  // Beat bar — prominent, bottom center
  const bl=BL();const bp2=beatCtr/bl;const bx=W/2-50,by=H-12;
  R(bx,by,100,7,false);R(bx,by,Math.floor(100*bp2),7,true);
  // Beat flash pulse on bar
  if(beatPulse>0){onFill(beatPulse/6*.2);
    $.fillRect(bx-2,by-2,104,11);$.globalAlpha=1;}
  // Beat count dots (4 per measure)
  for(let i=0;i<4;i++){const dx=bx+Math.floor(100*(i+1)/4)-1;
    $.fillStyle=beatNum%4===i?ON:GH;$.globalAlpha=beatNum%4===i?.4:.15;
    $.fillRect(dx,by+8,3,3);$.globalAlpha=1;}
  // Border pulse on beat (top and bottom lines)
  if(beatPulse>3){const ba=((beatPulse-3)/3)*.06;
    onFill(ba);$.fillRect(0,0,W,1);$.fillRect(0,H-1,W,1);$.globalAlpha=1;}
}
let trT=0,trTxt='',trFn=null;
function transTo(t,fn){trT=42;trTxt=t;trFn=fn;bgmBeat=0;
  // Transition whoosh
  if(ac)tn(200,.15,'triangle',.03);}
function drawTrans(){if(trT<=0)return false;trT--;if(trT===21&&trFn)trFn();
  const p=trT>21?(42-trT)/21:trT/21; // 0→1→0
  // Wipe from center (expanding bar)
  const wh=Math.floor(H*p);
  $.fillStyle=`rgba(176,188,152,.95)`;$.fillRect(0,H/2-wh/2,W,wh);
  // Text (only when mostly covered)
  if(p>.4){$.globalAlpha=(p-.4)/.6;
    txtC(trTxt,W/2,H/2-6,12);
    // Decorative line under text
    const lw=80*Math.min(1,(p-.4)*3);$.fillStyle=ON;$.globalAlpha*=.2;
    $.fillRect(W/2-lw/2,H/2+10,lw,1);}
  $.globalAlpha=1;return true;}

/* ================================================================
   STAGE 1: CAVE — 3 levels, exploration & puzzle
   ================================================================ */
let cav={};const SC=2;
const L1T=38,L1B=100,L2T=130,L2B=192,L3T=222,L3B=278;
const SHL=208,SHR=232;
const KY1=L1T+16,KY2=L2T+16,KY3=L3T+14;
const POS=[{x:34,y:KY1},{x:125,y:KY1},{x:220,y:KY1},{x:315,y:KY1},{x:406,y:KY1},
  {x:34,y:KY2},{x:125,y:KY2},{x:220,y:KY2},{x:315,y:KY2},{x:406,y:KY2},{x:220,y:KY3}];
const NAV=[{r:1},{l:0,r:2},{l:1,r:3,d:7},{l:2,r:4},{l:3},
  {r:6},{l:5,r:7},{l:6,r:8,u:2,d:10},{l:7,r:9},{l:8},{u:7}];
const GHOST_SPR=[K_PK,K_CLR,K_CL,K_JP,K_AT,K_PR,K_DK,K_CL2,K_CLR,K_RE,K_RE];
const GHOST_DIR=[1,1,0,-1,-1,1,1,0,-1,1,0];
const GHOST_DY=[0,0,0,-6,0,0,4,0,0,-2,-2];

let sparks=[],dust=[],feathers=[],smoke=[],stepDust=[],keySpk=[],cavDrips=[];
/** Shorthand for Popups.add */
function addPopup(x,y,t){ Popups.add(x,y,t); }
function initDust(){dust=[];for(let i=0;i<15;i++)dust.push({x:rng(0,W),y:rng(30,H-30),vx:rngSpread(.15),vy:rngSpread(.075),s:rng(1,3),a:rng(.06,.14)});}
function addStepDust(x,y){Particles.spawn(stepDust,{x,y,n:4,vxSpread:.6,vySpread:.4,vyBase:-.4,life:12,s:1.5});}

function drawCaveBG(){
  $.fillStyle=RK;$.fillRect(0,26,W,H-36);
  $.fillStyle=BG;
  const mkP=(pts)=>{$.beginPath();$.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)$.lineTo(pts[i][0],pts[i][1]);$.closePath();$.fill();};
  mkP([[0,L1T-8],[16,L1T],[80,L1T+2],[160,L1T-2],[SHL,L1T],[SHR,L1T],[340,L1T-3],[400,L1T+1],[W,L1T],
    [W,L1B],[400,L1B+2],[340,L1B],[SHR,L1B],[SHL,L1B],[160,L1B+3],[80,L1B-1],[16,L1B+2],[0,L1B+8]]);
  mkP([[0,L2T-2],[60,L2T+1],[70,L2T-4],[SHL,L2T],[SHR,L2T],[300,L2T-2],[380,L2T+1],[W,L2T-2],
    [W,L2B+2],[380,L2B],[300,L2B+3],[SHR,L2B],[SHL,L2B],[70,L2B+4],[60,L2B-1],[0,L2B+2]]);
  mkP([[130,L3T],[340,L3T-2],[340,L3B+2],[130,L3B+2]]);
  $.fillRect(SHL,L1B-2,SHR-SHL,L2T-L1B+4);$.fillRect(SHL,L2B-2,SHR-SHL,L3T-L2B+4);
  $.beginPath();$.moveTo(0,L1T-16);$.quadraticCurveTo(28,L1T-10,16,L1T);$.lineTo(0,L1T);$.closePath();$.fill();
  $.beginPath();$.moveTo(0,L1B+16);$.quadraticCurveTo(28,L1B+10,16,L1B+2);$.lineTo(0,L1B);$.closePath();$.fill();
  $.fillRect(370,L1T-6,W-370,6);$.fillRect(370,L1B,W-370,6);
  $.fillRect(0,L2T-4,70,4);$.fillRect(0,L2B,70,6);
  $.fillRect(370,L2T-5,W-370,5);$.fillRect(370,L2B,W-370,6);
  $.fillRect(170,L3T-4,100,4);$.fillRect(170,L3B,100,6);

  // Brick texture (faint, in room areas)
  onFill(.04);
  for(let y=L1T+2;y<L1B;y+=8)for(let x=370;x<W;x+=14)$.fillRect(x+(y%16?0:7),y,12,1);
  for(let y=L2T+2;y<L2B;y+=8)for(let x=0;x<70;x+=14)$.fillRect(x+(y%16?0:7),y,12,1);
  for(let y=L2T+2;y<L2B;y+=8)for(let x=370;x<W;x+=14)$.fillRect(x+(y%16?0:7),y,12,1);
  for(let y=L3T+2;y<L3B;y+=8)for(let x=170;x<270;x+=14)$.fillRect(x+(y%16?0:7),y,12,1);
  $.globalAlpha=1;

  // Borders
  $.strokeStyle=ON;$.lineWidth=2;
  $.beginPath();$.moveTo(0,L1T-8);$.lineTo(16,L1T);$.lineTo(80,L1T+2);$.lineTo(160,L1T-2);$.lineTo(SHL,L1T);$.lineTo(SHR,L1T);$.lineTo(340,L1T-3);$.lineTo(370,L1T-6);$.lineTo(W,L1T-6);$.stroke();
  $.beginPath();$.moveTo(0,L1B+8);$.lineTo(16,L1B+2);$.lineTo(80,L1B-1);$.lineTo(160,L1B+3);$.lineTo(SHL,L1B);$.moveTo(SHR,L1B);$.lineTo(340,L1B);$.lineTo(370,L1B+6);$.lineTo(W,L1B+6);$.stroke();
  $.beginPath();$.moveTo(0,L2T-4);$.lineTo(70,L2T-4);$.moveTo(SHR,L2T);$.lineTo(370,L2T-5);$.lineTo(W,L2T-5);$.stroke();
  $.beginPath();$.moveTo(0,L2B+2);$.lineTo(70,L2B+4);$.moveTo(SHR,L2B);$.lineTo(370,L2B+4);$.lineTo(W,L2B+4);$.stroke();
  $.beginPath();$.moveTo(130,L3T);$.lineTo(170,L3T-4);$.lineTo(270,L3T-4);$.lineTo(340,L3T-2);$.stroke();
  $.beginPath();$.moveTo(130,L3B+2);$.lineTo(170,L3B+6);$.lineTo(270,L3B+6);$.lineTo(340,L3B+2);$.stroke();
  $.lineWidth=1;$.fillStyle=ON;
  $.fillRect(SHL,L1B,2,L2T-L1B);$.fillRect(SHR-2,L1T,2,L1B-L1T);
  $.fillRect(SHL,L2B,2,L3T-L2B);$.fillRect(SHR-2,L2T,2,L2B-L2T);$.fillRect(SHR-2,L3T,2,L3B-L3T);
  // Ladders
  const dL=(x,y1,y2)=>{$.fillStyle=ON;$.fillRect(x,y1,2,y2-y1);$.fillRect(x+18,y1,2,y2-y1);for(let y=y1+6;y<y2;y+=9)$.fillRect(x,y,20,2);};
  dL(SHL+2,L1B+2,L2T-2);dL(SHL+2,L2B+2,L3T-2);

  // === OBSTACLES ===
  // Rock pos 1
  {const rx=POS[1].x+2,ry=L1B-2;$.fillStyle=ON;$.beginPath();$.moveTo(rx-8,ry);$.lineTo(rx-4,ry-10);$.lineTo(rx+2,ry-14);$.lineTo(rx+8,ry-10);$.lineTo(rx+12,ry);$.closePath();$.fill();$.fillStyle=BG;$.fillRect(rx-2,ry-10,4,2);}
  // Pit pos 3
  {const p3=POS[3].x,py=L1B-2;$.fillStyle=RK;$.fillRect(p3-8,py-1,18,4);$.fillStyle=ON;$.fillRect(p3-9,py-2,2,4);$.fillRect(p3+10,py-2,2,4);onFill(.15);$.fillRect(p3-7,py,14,2);$.globalAlpha=1;}
  // Low ceiling pos 6
  {const lx=POS[6].x;$.fillStyle=ON;$.beginPath();$.moveTo(lx-12,L2T);$.lineTo(lx-6,L2T+16);$.lineTo(lx+2,L2T+20);$.lineTo(lx+10,L2T+16);$.lineTo(lx+16,L2T);$.closePath();$.fill();$.fillStyle=BG;$.fillRect(lx-4,L2T+8,4,2);$.fillRect(lx+4,L2T+12,3,2);
    // Slime drip from low ceiling
    const sd=(tick*2)%80;if(sd<40){onFill(.35);
      circle(lx+2,L2T+20+sd*.6,1.5);$.globalAlpha=1;}}
  // Rock pos 8
  {const rx=POS[8].x-2,ry=L2B-2;$.fillStyle=ON;$.beginPath();$.moveTo(rx-6,ry);$.lineTo(rx-2,ry-8);$.lineTo(rx+4,ry-12);$.lineTo(rx+10,ry-8);$.lineTo(rx+14,ry);$.closePath();$.fill();$.fillStyle=BG;$.fillRect(rx+1,ry-8,3,2);}

  // Stalactites/stalagmites
  const sc=(x,y,w,h)=>{$.fillStyle=ON;$.beginPath();$.moveTo(x,y);$.lineTo(x+w,y);$.lineTo(x+w/2,y+h);$.closePath();$.fill();};
  const sg=(x,y,w,h)=>{$.fillStyle=ON;$.beginPath();$.moveTo(x+w/2,y);$.lineTo(x,y+h);$.lineTo(x+w,y+h);$.closePath();$.fill();};
  sc(65,L1T,8,12);sc(270,L1T,10,14);sc(350,L1T-2,8,10);
  sg(70,L1B-10,6,10);sg(280,L1B-10,10,10);
  sc(50,L2T,10,12);sc(280,L2T-1,8,12);sc(360,L2T-3,10,14);
  sg(55,L2B-8,8,8);sg(290,L2B-8,6,8);sg(370,L2B-10,8,10);
  sc(180,L3T-2,8,10);sc(260,L3T,6,8);sg(195,L3B-8,6,8);sg(270,L3B-8,8,8);

  // === ROOM DECORATIONS ===
  // BAT room (right L1): guano stains, claw marks on ceiling
  onFill(.35);
  $.fillRect(390,L1B-3,8,3);$.fillRect(408,L1B-2,6,2);$.fillRect(420,L1B-4,10,4);
  $.strokeStyle=ON;$.lineWidth=1;
  $.beginPath();$.moveTo(396,L1T);$.lineTo(394,L1T+6);$.stroke();$.beginPath();$.moveTo(400,L1T);$.lineTo(399,L1T+5);$.stroke();
  $.beginPath();$.moveTo(418,L1T);$.lineTo(416,L1T+7);$.stroke();$.globalAlpha=1;

  // TRAP room (right L2): chains hanging from ceiling
  {const tx=POS[9].x;
    $.fillStyle=ON;
    const chain=(x,y1,y2)=>{for(let y=y1;y<y2;y+=5){$.fillRect(x,y,3,3);$.fillRect(x+1,y+3,1,2);}};
    chain(tx-30,L2T+2,L2T+24);chain(tx+28,L2T+2,L2T+20);}

  // MIMIC room (left L2): scattered coins
  $.fillStyle=ON;
  circle(20,L2B-4,2);circle(32,L2B-3,2.5);
  circle(48,L2B-5,2);circle(12,L2B-6,1.5);
  circle(55,L2B-3,2);

  // DOOR room (center L3): archway decoration
  {const dx=POS[10].x;$.fillStyle=ON;
    $.beginPath();$.arc(dx,L3T-2,30,Math.PI,0);$.lineWidth=3;$.strokeStyle=ON;$.stroke();
    for(let i=0;i<5;i++){const a=Math.PI+i*(Math.PI/4);circle(dx+Math.cos(a)*28,L3T-2+Math.sin(a)*28,1.5);}
    $.lineWidth=1;}

  // Mushrooms (solid decoration)
  $.fillStyle=ON;
  const mush=(x,y)=>{$.beginPath();$.arc(x,y-2,3,Math.PI,0);$.fill();$.fillRect(x-1,y-1,2,4);};
  mush(85,L1B);mush(175,L2B);mush(340,L1B);mush(310,L3B);

  // Torches with GLOW
  const torch=(x,y)=>{
    // Glow circle
    const gl=.04+Math.sin(tick*.08+x)*.015;onFill(gl);
    circle(x+2,y+4,18);$.globalAlpha=1;
    // Torch body
    $.fillStyle=ON;$.fillRect(x,y+6,4,10);
    const fl=tick%18<6?0:tick%18<12?1:2;$.fillRect(x-1+fl,y+1,5,5);$.fillRect(x,y-1+(fl===1?1:0),3,3);
    $.fillRect(x+fl,y-2,2,2); // taller flame tip
    if(tick%9===0)sparks.push({x:x+1,y:y-2,vx:rngSpread(.75),vy:-rng(0,1.5),life:14});
    if(tick%14===0)sparks.push({x:x+2,y:y,vx:rngSpread(.5),vy:-rng(0,2),life:10});
    if(tick%11===0)smoke.push({x:x+1,y:y-3,vx:rngSpread(.2),vy:-.3-rng(0,.3),life:28,s:rng(2,4)});};
  torch(100,L1T+3);torch(355,L1T+3);torch(100,L2T+3);torch(355,L2T+3);
  $.fillStyle=ON;sparks=sparks.filter(s=>{s.x+=s.vx;s.y+=s.vy;s.life--;if(s.life>0){$.globalAlpha=s.life/14;$.fillRect(s.x,s.y,2,2);$.globalAlpha=1;return true;}return false;});
  // Torch smoke
  smoke=smoke.filter(sm=>{sm.x+=sm.vx;sm.y+=sm.vy;sm.s+=.03;sm.life--;if(sm.life>0){onFill(sm.life/28*.08);circle(sm.x,sm.y,sm.s);$.globalAlpha=1;return true;}return false;});

  // Entrance sign
  {const sx=14,sy=L1T-22;$.fillStyle=ON;$.fillRect(sx,sy,36,14);$.fillStyle=BG;$.fillRect(sx+1,sy+1,34,12);
    $.fillStyle=ON;$.fillRect(sx+16,sy+14,3,10);
    $.font='6px "Press Start 2P"';$.textAlign='center';$.textBaseline='top';$.fillText('CAVE',sx+18,sy+3);}

  // Water drips with sound trigger
  const drip=(x,y0,per,off)=>{const t=(tick+off)%per;
    if(t<15){onFill(.5);$.fillRect(x,y0+t*2,2,3);$.globalAlpha=1;}
    if(t===15&&off===0)S.drip();
    if(t>=15&&t<28){const r=(t-15)*.7;onStroke(.25);$.lineWidth=1;circleS(x+1,y0+32,r);$.globalAlpha=1;}};
  drip(152,L1T+12,55,0);drip(290,L2T+10,65,20);drip(240,L3T+4,48,35);

  // Crystals (glow)
  const cry=(x,y,h)=>{const gl=.18+Math.sin(tick*.05+x)*.1;onFill(gl);$.beginPath();$.moveTo(x,y+h);$.lineTo(x+3,y);$.lineTo(x+6,y+h);$.closePath();$.fill();
    $.globalAlpha=gl*.3;circle(x+3,y+h/2,h*.6);$.globalAlpha=1;};
  cry(60,L1B-16,10);cry(340,L1B-12,8);cry(60,L2B-14,10);cry(310,L2B-12,8);cry(200,L3B-10,8);cry(300,L3B-12,10);

  // Cobwebs
  onStroke(.25);$.lineWidth=1;
  const web=(x,y,sx,sy)=>{$.beginPath();$.moveTo(x,y);$.quadraticCurveTo(x+sx*.5,y+sy*.3,x+sx,y);$.stroke();$.beginPath();$.moveTo(x,y);$.quadraticCurveTo(x+sx*.3,y+sy*.5,x,y+sy);$.stroke();$.beginPath();$.moveTo(x,y);$.quadraticCurveTo(x+sx*.4,y+sy*.4,x+sx*.7,y+sy*.7);$.stroke();};
  web(0,L1T-6,30,20);web(W-2,L2T-4,-30,20);web(130,L3T-2,20,16);web(W-2,L1T-6,-25,18);$.globalAlpha=1;

  // Bones
  $.fillStyle=ON;$.fillRect(170,L1B-4,8,2);$.fillRect(172,L1B-6,2,6);$.fillRect(176,L1B-6,2,6);
  // Skull in mimic room
  $.fillStyle=ON;$.fillRect(14,L2B-8,8,6);$.fillRect(16,L2B-10,4,3);$.fillStyle=BG;$.fillRect(16,L2B-7,2,2);$.fillRect(20,L2B-7,2,2);
  // Bones in trap room
  $.fillStyle=ON;$.fillRect(380,L2B-6,10,2);$.fillRect(384,L2B-8,2,6);

  // Moss
  $.fillStyle='rgba(70,100,60,0.35)';$.fillRect(80,L1B-3,14,3);$.fillRect(320,L2B-2,20,2);$.fillRect(160,L3B-2,16,2);$.fillRect(410,L1B-2,20,2);$.fillRect(10,L2B-2,30,2);

  // Cracks
  onStroke(.4);$.beginPath();$.moveTo(90,L1T+18);$.lineTo(96,L1T+24);$.lineTo(94,L1T+30);$.stroke();
  $.beginPath();$.moveTo(320,L2T+12);$.lineTo(326,L2T+20);$.stroke();
  $.beginPath();$.moveTo(200,L3T+6);$.lineTo(204,L3T+12);$.lineTo(202,L3T+18);$.stroke();$.globalAlpha=1;

  // Cave mouth light shaft
  $.fillStyle='rgba(176,188,152,0.08)';$.beginPath();$.moveTo(0,L1T-16);$.lineTo(50,KY1-4);$.lineTo(50,KY1+28);$.lineTo(0,L1B+16);$.closePath();$.fill();
  // Stray light rays
  onStroke(.08);$.lineWidth=2;
  $.beginPath();$.moveTo(0,L1T);$.lineTo(40,KY1+4);$.stroke();
  $.beginPath();$.moveTo(0,L1T+10);$.lineTo(35,KY1+12);$.stroke();$.globalAlpha=1;$.lineWidth=1;

  // Rats (solid, ambient critters)
  const ratX=(tick*1.2)%180;
  px(RAT,ratX+160,L1B-12,2,true);
  px(RAT,(180-ratX%180)+140,L2B-12,2,true,true);

  // Dust
  // Dust (drawn here as part of BG, movement handled in cavDraw)
  $.fillStyle=ON;dust.forEach(d=>{
    $.globalAlpha=d.a+Math.sin(tick*.03+d.x)*.04;$.fillRect(d.x,d.y,d.s,d.s);});$.globalAlpha=1;
  // Puddles with shimmer
  onFill(.18);$.beginPath();$.ellipse(156,L1B-1,8,2,0,0,TAU);$.fill();
  $.beginPath();$.ellipse(294,L2B-1,10,2,0,0,TAU);$.fill();$.beginPath();$.ellipse(244,L3B-1,8,2,0,0,TAU);$.fill();
  // Puddle shimmer lines
  $.globalAlpha=.06+Math.sin(tick*.08)*.03;$.fillRect(150,L1B-2,4,1);$.fillRect(158,L1B-2,3,1);
  $.fillRect(288,L2B-2,5,1);$.fillRect(296,L2B-2,4,1);$.globalAlpha=1;

  // Step dust particles
  $.fillStyle=ON;stepDust=stepDust.filter(d=>{d.x+=d.vx;d.y+=d.vy;d.vy-=.02;d.life--;
    if(d.life>0){$.globalAlpha=d.life/12*.4;circle(d.x,d.y,d.s);$.globalAlpha=1;return true;}return false;});

  // Key sparkle
  $.fillStyle=ON;keySpk=keySpk.filter(k=>{k.life--;if(k.life>0){$.globalAlpha=k.life/10;$.fillRect(k.x,k.y,1,1);$.fillRect(k.x-1,k.y,3,1);$.fillRect(k.x,k.y-1,1,3);$.globalAlpha=1;return true;}return false;});

  // Feathers from bat hit
  $.fillStyle=ON;feathers=feathers.filter(f=>{f.x+=f.vx;f.y+=f.vy;f.vy+=.05;f.life--;
    if(f.life>0){$.globalAlpha=f.life/20;$.save();$.translate(f.x,f.y);$.rotate(f.life*.2);$.fillRect(-2,-1,4,2);$.fillRect(-1,-2,2,4);$.restore();$.globalAlpha=1;return true;}return false;});

  // Score popups
  Popups.updateAndDraw();
}

/* ================================================================
   STAGE 1: CAVE — Exploration, puzzle solving, key collection
   ================================================================ */
function cavInit(){
  assert(loop >= 1, 'cavInit: loop must be >= 1');
  state='cave';beatCtr=0;beatNum=0;sparks=[];feathers=[];smoke=[];stepDust=[];Popups.clear();keySpk=[];initDust();
  cav={pos:0,prevPos:-1,dir:1,keys:[false,false,false],keysPlaced:0,carrying:false,
    trapOn:false,trapBeat:0,trapSparks:[],trapWasDanger:false,
    cageProgress:0,cageMax:Difficulty.cageMax(loop),cageHolding:false, // cage: hold ACT to fill, decays
    batPhase:0,batBeat:0,batHitAnim:0,batWasDanger:false,
    mimicOpen:false,mimicBeat:0,pryCount:0,mimicShake:0,mimicWasDanger:false,pryDecayT:0,
    spiderY:0,spiderBeat:0,spiderWasDanger:false,
    hurtCD:0,actAnim:0,actType:'',walkAnim:0,idleT:0,won:false,wonT:0,
    trailAlpha:0,roomNameT:0,roomName:'ENTRANCE'};}

function cavUpdate(nb){
  const C=cav;if(C.hurtCD>0)C.hurtCD--;if(C.actAnim>0)C.actAnim--;if(C.batHitAnim>0)C.batHitAnim--;
  if(C.mimicShake>0)C.mimicShake--;if(C.walkAnim>0)C.walkAnim--;if(C.won){C.wonT++;if(C.wonT===120)transTo('STAGE 2',grsInit);return;}
  if(C.trailAlpha>0)C.trailAlpha-=.03;if(C.roomNameT>0)C.roomNameT--;
  C.idleT++;
  // Key sparkle when carrying
  if(C.carrying&&tick%4===0)keySpk.push({x:POS[C.pos].x-4+rng(0,12),y:POS[C.pos].y-6+rng(0,6),life:10});
  const ROOM_NAMES=['ENTRANCE','TUNNEL','SHAFT','CHASM','BAT NEST','MIMIC DEN','LOW PASS','SHAFT','BOULDER','CAGE ROOM','THE DOOR'];
  if(C.actAnim<=0){
    const n=NAV[C.pos];let moved=false;const oldPos=C.pos;
    if(J('arrowleft')&&n.l!==undefined){C.pos=n.l;C.dir=-1;moved=true;}
    if(J('arrowright')&&n.r!==undefined){C.pos=n.r;C.dir=1;moved=true;}
    if(J('arrowdown')&&n.d!==undefined){C.prevPos=C.pos;C.trailAlpha=.3;C.pos=n.d;S.ladder();C.walkAnim=4;C.idleT=0;addStepDust(POS[C.pos].x,POS[C.pos].y+20);C.roomNameT=25;C.roomName=ROOM_NAMES[C.pos];}
    else if(J('arrowup')&&n.u!==undefined){C.prevPos=C.pos;C.trailAlpha=.3;C.pos=n.u;S.ladder();C.walkAnim=4;C.idleT=0;addStepDust(POS[C.pos].x,POS[C.pos].y+20);C.roomNameT=25;C.roomName=ROOM_NAMES[C.pos];}
    else if(moved){C.prevPos=oldPos;C.trailAlpha=.3;S.step();C.walkAnim=3;C.idleT=0;addStepDust(POS[C.pos].x,POS[C.pos].y+20);
      if(ROOM_NAMES[C.pos]!==ROOM_NAMES[oldPos]){C.roomNameT=40;C.roomName=ROOM_NAMES[C.pos];}}}
  // === CAGE HOLD mechanic (TRAP key, pos 9) ===
  const actHeld=kd['z']||kd[' '];
  C.cageHolding=false;
  if(C.pos===9&&!C.keys[0]&&!C.carrying&&!C.trapOn&&actHeld&&C.hurtCD<=0&&C.actAnim<=0){
    ea();C.cageHolding=true;C.idleT=0;C.cageProgress+=2.5;
    if(tick%3===0)S.pry();
    if(C.cageProgress>=C.cageMax){C.keys[0]=true;C.carrying=true;score+=300*loop;S.grab();C.actAnim=8;C.actType='reach';addPopup(POS[9].x,POS[9].y-14,'+'+300*loop);C.cageProgress=0;}}
  // Cage decay when not holding — extremely slow, barely noticeable
  if(!C.cageHolding&&C.cageProgress>0)C.cageProgress=Math.max(0,C.cageProgress-.05);
  // Trap zap nudges cage progress slightly
  if(C.pos===9&&C.trapOn&&C.cageProgress>0)C.cageProgress=Math.max(0,C.cageProgress-.5);

  // === MIMIC mash decay — extremely slow, only lose progress after long absence ===
  if(C.pos===5&&!C.keys[2]&&!C.mimicOpen&&C.pryCount>0){C.pryDecayT++;
    if(C.pryDecayT>=180){C.pryDecayT=0;C.pryCount=Math.max(0,C.pryCount-1);}}
  else C.pryDecayT=0;
  if(C.pos!==5&&C.pryCount>0&&tick%120===0)C.pryCount=Math.max(0,C.pryCount-1);

  if(jAct()&&C.hurtCD<=0&&C.actAnim<=0){ea();C.idleT=0;
    if(C.pos===4&&!C.keys[1]&&!C.carrying&&C.batPhase===0){C.keys[1]=true;C.carrying=true;score+=300*loop;S.grab();C.actAnim=8;C.actType='atk';C.batHitAnim=10;C.dir=-1;addPopup(POS[4].x,POS[4].y-14,'+'+300*loop);
      for(let i=0;i<8;i++)feathers.push({x:POS[4].x,y:L1T+10,vx:rngSpread(1.5),vy:-rng(0,2)-1,life:12});}
    if(C.pos===5&&!C.keys[2]&&!C.carrying&&!C.mimicOpen){
      C.pryCount++;C.pryDecayT=0;C.actAnim=3;C.actType='pry';S.pry();C.mimicShake=3;C.dir=1;
      if(C.pryCount>=5){C.keys[2]=true;C.carrying=true;score+=300*loop;S.grab();C.actAnim=8;C.actType='reach';addPopup(POS[5].x,POS[5].y-14,'+'+300*loop);}}
    if(C.pos===10&&C.carrying&&C.spiderY===0){C.carrying=false;C.keysPlaced++;score+=500*loop;S.set();C.actAnim=8;C.actType='reach';addPopup(POS[10].x,POS[10].y-14,'+'+500*loop);
      if(C.keysPlaced>=3){C.won=true;C.wonT=0;S.clear();score+=2000*loop;if(hp<maxHp)hp++;addPopup(W/2,H/2-30,'+'+2000*loop);}}}
  // Passive damage
  if(C.hurtCD<=0&&C.actAnim<=0){
    if(C.pos===9&&C.trapOn&&!C.keys[0]){C.hurtCD=twoBeatDuration();S.zap();C.actAnim=8;C.actType='hurt';doHurt();C.idleT=0;
      for(let i=0;i<6;i++)C.trapSparks.push({x:POS[9].x+rng(-10,10),y:KY2-6+rng(0,10),vx:rngSpread(1.5),vy:-rng(0,2)-1,l:6});}
    if(C.pos===4&&C.batPhase===2&&!C.keys[1]){C.hurtCD=twoBeatDuration();S.hit();C.actAnim=8;C.actType='hurt';doHurt();C.idleT=0;}
    if(C.pos===5&&C.mimicOpen&&!C.keys[2]){C.hurtCD=twoBeatDuration();C.pryCount=Math.max(0,C.pryCount-2);C.actAnim=8;C.actType='hurt';S.hit();doHurt();C.idleT=0;}
    if(C.pos===10&&C.spiderY===2){C.hurtCD=twoBeatDuration();C.actAnim=8;C.actType='hurt';S.hit();doHurt();C.idleT=0;
      if(C.carrying){C.carrying=false;for(let i=2;i>=0;i--){if(C.keys[i]){C.keys[i]=false;break;}}}}}
  C.trapSparks=C.trapSparks.filter(s=>{s.x+=s.vx;s.y+=s.vy;s.l--;return s.l>0;});
  if(!nb)return;
  // Ambient drips
  if(beatNum%4===0&&cavDrips.length<3){
    const dx=[85,260,350][rngInt(0,2)];
    cavDrips.push({x:dx+rng(-5,5),y:L1T+2,vy:0,life:40});
    if(rng()>.6)S.drip();}
  // Beat updates with safe indicators
  const prevTrap=C.trapOn,prevBat=C.batPhase,prevMim=C.mimicOpen,prevSp=C.spiderY;
  C.trapBeat++;const tp=Difficulty.hazardCycle(loop,6);C.trapOn=(C.trapBeat%tp)>=(tp-2);
  C.batBeat++;const bp=Difficulty.hazardCycle(loop,7);const bc=C.batBeat%bp;
  if(bc<Math.floor(bp*.4))C.batPhase=0;else if(bc<Math.floor(bp*.7))C.batPhase=1;else C.batPhase=2;
  C.mimicBeat++;const mp=Difficulty.hazardCycle(loop,6);C.mimicOpen=(C.mimicBeat%mp)>=(mp-2);
  C.spiderBeat++;const sp=Difficulty.hazardCycle(loop,7);const sc2=C.spiderBeat%sp;
  if(sc2<Math.floor(sp*.35))C.spiderY=0;else if(sc2<Math.floor(sp*.6))C.spiderY=1;else C.spiderY=2;
  // Track danger→safe transitions
  if(prevTrap&&!C.trapOn)C.trapWasDanger=true; else if(!C.trapOn)C.trapWasDanger&&(C.trapWasDanger=!!(C.trapWasDanger=8));
  if(prevBat===2&&C.batPhase===0)C.batWasDanger=8;
  if(prevMim&&!C.mimicOpen)C.mimicWasDanger=8;
  if(prevSp===2&&C.spiderY===0)C.spiderWasDanger=8;
  if(typeof C.trapWasDanger==='number'&&C.trapWasDanger>0)C.trapWasDanger--;
  if(typeof C.batWasDanger==='number'&&C.batWasDanger>0)C.batWasDanger--;
  if(typeof C.mimicWasDanger==='number'&&C.mimicWasDanger>0)C.mimicWasDanger--;
  if(typeof C.spiderWasDanger==='number'&&C.spiderWasDanger>0)C.spiderWasDanger--;
}

function cavDraw(){
  const C=cav;const s=SC;const wf=Math.floor(tick/(BL()/2))%2;
  drawCaveBG();

  // Key status HUD (top center)
  {const kx=W/2-42,ky=28;
    txt('CAGE',kx-4,ky+1,5,C.keys[0]||C.keysPlaced>0);
    px(KEY_D,kx+18,ky-2,1,C.keys[0]||C.keysPlaced>0);
    txt('BAT',kx+28,ky+1,5,C.keys[1]||(C.keysPlaced>1));
    px(KEY_D,kx+44,ky-2,1,C.keys[1]||(C.keysPlaced>1));
    txt('BOX',kx+58,ky+1,5,C.keys[2]||(C.keysPlaced>2));
    px(KEY_D,kx+74,ky-2,1,C.keys[2]||(C.keysPlaced>2));
  }

  // Room name display
  if(C.roomNameT>0){const rna=Math.min(1,C.roomNameT/15);
    $.globalAlpha=rna*.7;txtC(C.roomName,W/2,H-24,6);$.globalAlpha=1;}

  // === GHOST SPRITES ===
  for(let i=0;i<POS.length;i++){const p=POS[i];const gs=GHOST_SPR[i];const gd=GHOST_DIR[i];const gdy=GHOST_DY[i];
    if(gd<0)px(gs,p.x-10,p.y+gdy,s,false,true);else px(gs,p.x-10,p.y+gdy,s,false);}

  // === TRAIL GHOST (previous position) ===
  if(C.prevPos>=0&&C.trailAlpha>0){
    const tp=POS[C.prevPos];$.globalAlpha=C.trailAlpha;
    if(C.carrying)drawK(K_CR,tp.x-10,tp.y-2,s,true,C.dir);
    else drawK(K_R,tp.x-10,tp.y,s,true,C.dir);
    $.globalAlpha=1;}

  // BAT (pos 4)
  {const cx=POS[4].x,perchY=L1T+2,midY=L1T+16,swoopY=L1T+32;
    px(BAT_P,cx-12,perchY,s,false);px(BAT_FU,cx-12,midY,s,false);px(BAT_FD,cx-12,swoopY,s,false);
    R(cx+16,swoopY+10,14,3,true);px(KEY_D,cx+18,swoopY-1,s,false);
    if(!C.keys[1]){px(KEY_D,cx+18,swoopY-1,s,true);
      if(C.batHitAnim>0){const yo=Math.sin(C.batHitAnim*.5)*4;px(BAT_FD,cx-12,perchY-6+yo,s,true);}
      else switch(C.batPhase){case 0:px(BAT_P,cx-12,perchY,s,true);break;
        case 1:px(wf?BAT_FU:BAT_FD,cx-12,midY,s,true);break;
        case 2:px(wf?BAT_FU:BAT_FD,cx-12,swoopY,s,true);break;}}
    if(C.batPhase===2&&!C.keys[1]&&Math.floor(tick/4)%2)txt('!',cx-20,swoopY+2,8);
    if(C.batWasDanger>0&&C.batPhase===0&&!C.keys[1])txt('○',cx-20,perchY+4,7);}

  // CAGE TRAP (pos 9) - hold ACT to pry open cage
  {const cx=POS[9].x;
    // Cage frame (bars)
    R(cx-22,L2T+4,4,L2B-L2T-8,false);R(cx+20,L2T+4,4,L2B-L2T-8,false);
    // Cage bars (vertical)
    for(let i=0;i<5;i++)R(cx-18+i*8,L2T+6,2,L2B-L2T-14,false);
    px(BOLT,cx-16,L2T+6,s,false);px(BOLT,cx+8,L2T+6,s,false);px(KEY_D,cx-6,L2T+20,s,false);
    if(!C.keys[0]){
      R(cx-22,L2T+4,4,L2B-L2T-8,true);R(cx+20,L2T+4,4,L2B-L2T-8,true);
      // Cage bars (active)
      const cageOpen=C.cageProgress/C.cageMax;
      for(let i=0;i<5;i++){
        const barShift=cageOpen*((i%2?-1:1)*3); // bars shift apart as cage opens
        R(cx-18+i*8+Math.round(barShift),L2T+6,2,L2B-L2T-14,true);}
      px(BOLT,cx-16,L2T+6,s,C.trapOn);px(BOLT,cx+8,L2T+6,s,C.trapOn);px(KEY_D,cx-6,L2T+20,s,true);
      // Cage progress bar
      {const bx=cx-22,by2=L2B-10,bw=44,bh=5;
        $.fillStyle=GH;$.fillRect(bx,by2,bw,bh);
        $.fillStyle=ON;$.fillRect(bx,by2,Math.floor(bw*cageOpen),bh);
        // HOLD label when at cage
        if(C.pos===9&&!C.carrying&&!C.trapOn)
          {if(C.cageHolding){txt('HOLD',cx-16,L2B-22,5);}
            else{if(Math.floor(tick/16)%2)txt('HOLD Z',cx-18,L2B-22,5);}}}
      // Electrified
      if(C.trapOn){onFill(.12+Math.sin(tick*.9)*.06);
        for(let i=0;i<6;i++)$.fillRect(cx-14+i*6,L2T+30+(i%2?-3:3),5,2);$.globalAlpha=1;
        if(Math.floor(tick/3)%2)txt('!',cx-4,L2T+42,7);}
      if(C.trapWasDanger>0&&!C.trapOn)txt('○',cx-4,L2T+42,7);
      // Holding vibration
      if(C.cageHolding){const shk=Math.floor(tick/2)%2?1:-1;
        onFill(.15);$.fillRect(cx-24+shk,L2T+2,48,2);$.fillRect(cx-24-shk,L2B-4,48,2);$.globalAlpha=1;}}
    $.fillStyle=ON;C.trapSparks.forEach(sp=>{$.globalAlpha=sp.l/10;$.fillRect(sp.x,sp.y,2,2);});$.globalAlpha=1;}

  // MIMIC (pos 5) with breathing
  {const cx=POS[5].x,by=L2T+10;const shk=C.mimicShake>0?(Math.floor(tick/2)%2?1:-1):0;
    px(MIM_C,cx-14,by,s,false);px(MIM_O,cx-14,by-6,s,false);px(KEY_D,cx-6,by+8,s,false);
    if(!C.keys[2]){
      if(C.mimicOpen){const ch=Math.floor(tick/4)%2;px(MIM_O,cx-14+shk,by-6+(ch?2:0),s,true);if(Math.floor(tick/4)%2)txt('!',cx-20,by-4,7);}
      else{
        // Mimic breathing (subtle pulse when closed)
        const breathY=Math.sin(tick*.04)*.5;
        if(C.pryCount>=3)px(MIM_CRK,cx-14+shk,by+Math.round(breathY),s,true);
        else px(MIM_C,cx-14+shk,by+Math.round(breathY),s,true);
        if(C.mimicWasDanger>0)txt('○',cx-20,by-4,7);}
      if(C.pryCount>=2)px(KEY_D,cx-6,by+8,s,true);
      // Mash progress bar
      {const bx=cx-14,by2=by+34,bw=30,bh=5;
        $.fillStyle=GH;$.fillRect(bx,by2,bw,bh);
        $.fillStyle=ON;$.fillRect(bx,by2,Math.floor(bw*(C.pryCount/5)),bh);
        if(C.pos===5&&!C.carrying&&!C.mimicOpen){if(Math.floor(tick/16)%2)txt('MASH Z',cx-20,by+42,5);}}}}

  // DOOR (pos 10) with glow effect
  {const cx=POS[10].x,by=L3T+4;
    // Door glow based on keys placed
    if(C.keysPlaced>0){const glw=C.keysPlaced/3;onFill(.04*glw+Math.sin(tick*.06)*.02*glw);
      circle(cx,by+14,20+C.keysPlaced*4);$.globalAlpha=1;}
    px(DOOR_D,cx-10,by,s,true);
    for(let i=0;i<3;i++){const fl=i<C.keysPlaced;$.fillStyle=fl?ON:GH;$.fillRect(cx-6+i*5,by+14,4,4);if(fl){$.fillStyle=BG;$.fillRect(cx-5+i*5,by+15,2,2);}}
    // Spider with vibrating thread
    const thX=cx+18,spTY=L3T+2,spMY=L3T+16,spBY=by+18,spYA=[spTY,spMY,spBY],spCY=spYA[C.spiderY];
    // Thread with wobble when spider moves
    const wobble=C.spiderY>0?Math.sin(tick*.5)*1.5:0;
    $.strokeStyle=ON;$.lineWidth=1;$.beginPath();$.moveTo(thX+9,L3T);
    if(C.spiderY>0){$.quadraticCurveTo(thX+9+wobble,(L3T+spCY)/2,thX+9,spCY+4);}
    else{$.lineTo(thX+9,spCY+4);}$.stroke();
    px(SPIDER_T,thX+2,spTY,s,false);px(SPIDER,thX,spMY,s,false);px(SPIDER,thX,spBY,s,false);
    if(C.spiderY===0){px(SPIDER_T,thX+2,spTY,s,true);if(C.spiderWasDanger>0)txt('○',thX-2,spBY+18,7);}
    else{const lw=Math.floor(tick/4)%2;px(SPIDER,thX+(lw?0:1),spCY,s,true);}
    if(C.spiderY===2&&Math.floor(tick/4)%2)txt('!',thX-2,spBY+18,7);}

  // Entrance arrow
  if(C.pos===0){onFill(.3+Math.sin(tick*.1)*.15);
    $.beginPath();$.moveTo(2,KY1+10);$.lineTo(14,KY1+4);$.lineTo(14,KY1+16);$.closePath();$.fill();$.globalAlpha=1;}

  // Water drips
  cavDrips=cavDrips.filter(d=>{d.vy+=.12;d.y+=d.vy;d.life--;
    if(d.life>0&&d.y<L1B){onFill(.3);
      $.fillRect(d.x,d.y,2,3+d.vy);$.globalAlpha=1;return true;}
    // Splash
    onFill(.15);
    $.fillRect(d.x-3,d.y,2,1);$.fillRect(d.x+3,d.y,2,1);$.fillRect(d.x,d.y-1,1,1);
    $.globalAlpha=1;return false;});

  // Floating dust motes
  dust.forEach(d=>{d.x+=d.vx+Math.sin(tick*.02+d.a*100)*.08;d.y+=d.vy;
    if(d.x<0)d.x=W;if(d.x>W)d.x=0;if(d.y<30)d.y=H-60;if(d.y>H-30)d.y=30;
    onFill(d.a*(0.7+Math.sin(tick*.04+d.x)*.3));$.fillRect(d.x,d.y,d.s,d.s);$.globalAlpha=1;});

  // === ACTIVE KNIGHT ===
  {const p=POS[C.pos];const hurting=C.hurtCD>0&&Math.floor(tick/3)%2;
    if(!hurting){const kx=p.x-10,ky=p.y;const d=C.dir;
      // Idle breathing
      const br=C.idleT>20?Math.sin(tick*.06)*.8:0;
      if(C.actAnim>0){
        switch(C.actType){case 'reach':px(K_RE,kx,ky-2,s,true);break;
          case 'atk':drawK(K_AT,kx-2,ky,s,true,d);break;
          case 'pry':drawK(K_PR,kx-2,ky,s,true,d);break;
          case 'hurt':px(K_HU,kx,ky,s,true);break;
          default:drawK(K_R,kx,ky,s,true,d);}
      } else if(C.cageHolding){
        // Holding cage - straining pose with shake
        const shk=Math.floor(tick/2)%2?1:0;
        px(K_RE,kx+shk,ky-2,s,true);
      } else if(C.walkAnim>0){
        const cp=C.pos;
        if(cp===2||cp===7)px(C.walkAnim>2?K_CL:K_CL2,kx,ky,s,true);
        else if(cp===1||cp===8){if(C.carrying)drawK(C.walkAnim>1?K_CCLR:K_CR,kx,ky+(C.walkAnim>1?-2:0),s,true,d);
          else drawK(C.walkAnim>1?K_CLR:K_R,kx,ky+(C.walkAnim>1?-2:0),s,true,d);
        }else if(cp===3){if(C.carrying)drawK(C.walkAnim>1?K_CJP:K_CR,kx,ky+(C.walkAnim>1?-8:-2),s,true,d);
          else drawK(C.walkAnim>1?K_JP:K_R,kx,ky+(C.walkAnim>1?-8:-2),s,true,d);
        }else if(cp===6){if(C.carrying)px(K_CDK,kx,ky+4,s,true);else px(K_DK,kx,ky+4,s,true);
        }else{if(C.carrying)drawK(C.walkAnim>1?K_CR:K_CRW,kx,ky-2,s,true,d);
          else drawK(C.walkAnim>1?K_R:K_RW,kx,ky,s,true,d);}
      } else{
        const cp=C.pos;const bry=Math.round(br);
        if(cp===0)drawK(K_PK,kx,ky+bry,s,true,1);
        else if(cp===1||cp===8)drawK(C.carrying?K_CCLR:K_CLR,kx,ky-2+bry,s,true,d);
        else if(cp===3)drawK(C.carrying?K_CJP:K_JP,kx,ky-6+bry,s,true,d);
        else if(cp===6){if(C.carrying)px(K_CDK,kx,ky+4,s,true);else px(K_DK,kx,ky+4,s,true);}
        else if(cp===4&&!C.keys[1])drawK(K_R,kx,ky+bry,s,true,-1);
        else if(cp===5&&!C.keys[2])drawK(K_R,kx,ky+bry,s,true,1);
        else if(cp===9&&!C.keys[0])px(K_RE,kx,ky-2+bry,s,true);
        else if(cp===10)px(K_RE,kx,ky-2+bry,s,true);
        else if(C.carrying)drawK(K_CR,kx,ky-2+bry,s,true,d);
        else drawK(K_R,kx,ky+bry,s,true,d);
      }}}
  if(C.won){const wt=C.wonT;
    // Overlay fades in
    const oa=Math.min(.90,wt/20*.90);$.fillStyle=`rgba(176,188,152,${oa})`;$.fillRect(0,0,W,H);
    // Phase 1: STAGE CLEAR (big, with expansion)
    if(wt>8){const sc=Math.min(1,(wt-8)/12);$.globalAlpha=sc;
      txtC('STAGE CLEAR',W/2,70,16);$.globalAlpha=1;}
    // Phase 2: stage name with line
    if(wt>28){$.globalAlpha=Math.min(1,(wt-28)/12);
      const lw=Math.min(100,(wt-28)*3);$.fillStyle=ON;$.globalAlpha*=.3;
      $.fillRect(W/2-lw/2,88,lw,1);$.globalAlpha=Math.min(1,(wt-28)/12);
      txtC('— CAVE —',W/2,100,8);$.globalAlpha=1;}
    // Phase 3: three keys fly in from sides
    if(wt>42){const ka=Math.min(1,(wt-42)/12);$.globalAlpha=ka;
      const spread=60*(1-ka)+0; // keys converge
      px(KEY_D,W/2-35-spread*.5,140,3,true);
      px(KEY_D,W/2-5,140-spread*.3,3,true);
      px(KEY_D,W/2+25+spread*.5,140,3,true);
      $.globalAlpha=1;}
    // Phase 4: bonus
    if(wt>62){$.globalAlpha=Math.min(1,(wt-62)/12);
      txtC('BONUS +'+2000*loop,W/2,185,8);$.globalAlpha=1;}
    if(wt>75&&hp===maxHp){$.globalAlpha=Math.min(1,(wt-75)/10);
      txtC('HP RECOVERED',W/2,205,6);$.globalAlpha=1;}
    // Phase 5: teaser
    if(wt>88){$.globalAlpha=Math.min(1,(wt-88)/15);
      txtC('The prairie awaits...',W/2,240,6);$.globalAlpha=1;}
    // Sparkles (continuous)
    if(wt>12){onFill(.25+Math.sin(tick*.2)*.1);
      const sx=W/2-80+(tick*17)%160,sy=60+(tick*13+wt*7)%180;
      $.fillRect(sx,sy,2,2);$.globalAlpha=1;}
  }
}

/* ================================================================
   STAGE 2: PRAIRIE — 3-lane defense, combo system, sweep attack
   ================================================================ */
let grs={};const GRS_LY=[56,138,220],GRS_EX=[52,130,208,286];
let grsSlash=[],grsDead=[],grsGrass=[],grsLaneFlash=[],grsMiss=[];

function initGrass(){grsGrass=[];for(let i=0;i<30;i++)grsGrass.push({
  x:rng(0,W),y:GRS_LY[rngInt(0,2)]+rng(42,48),h:rng(3,8),ph:rng(0,TAU)});}

/** Spawn death particles at lane position — DRY for sweep/attack/guard kills */
function grsDeathParticles(lane, n, spread) {
  const ex=GRS_EX[0]+70, ey=GRS_LY[lane]+14;
  Particles.spawn(grsDead, {x:ex, y:ey, n, vxSpread:spread, vySpread:spread*.7, life:12, s:3, rot:true});
}

/** Check & award shield orb drops — DRY for sweep/normal kill paths */
function grsCheckShieldDrop(G, lane) {
  if(G.kills>=G.nextShieldAt && earnedShields<4) {
    earnedShields++; G.nextShieldAt+=5;
    G.shieldOrbs.push({y:GRS_LY[lane]+20, alpha:1, t:0});
    addPopup(W/2, 20, 'SHIELD +1'); S.guard();
  }
}

/** Increment combo on kill — DRY for sweep/normal paths */
function grsComboHit(G) {
  G.kills++; G.combo++; G.comboT=BL()*5;
  if(G.combo>G.maxCombo) G.maxCombo=G.combo;
}

function grsInit(){
  assert(loop >= 1, 'grsInit: loop must be >= 1');
  state='grass';beatCtr=0;beatNum=0;grsSlash=[];grsDead=[];grsLaneFlash=[];grsMiss=[];Popups.clear();initGrass();
  const g=Difficulty.grassGoal(loop);earnedShields=0;
  grs={ens:[],kills:0,goal:g,maxSpawn:Math.floor(g*1.6)+4,spawned:0,guards:3,
    atkAnim:[-1,0],atkCD:0,guardAnim:0,guardFlash:0,hurtCD:0,
    combo:0,comboT:0,maxCombo:0,won:false,wonT:0,
    shieldOrbs:[],nextShieldAt:5,
    sweepReady:false,sweepFlash:0};}

/** Enemy factory — composition from Difficulty module */
function spawnEnemy(G){
  const ln=rngInt(0,2);
  if(G.ens.some(e=>e.lane===ln&&e.step>=2&&!e.dead))return false;
  let beh='normal',type='slime';const r=rng();
  const mix=Difficulty.grassEnemyMix(loop);
  if(r<mix.shifter){beh='shifter';type='goblin';}
  else if(r>1-mix.dasher){beh='dasher';type='skel';}
  let shDir=rng()<.5?1:-1;
  if(ln===0)shDir=1;if(ln===2)shDir=-1;
  G.ens.push({lane:ln,step:3,type,beh,dead:false,
    wait:0,shiftDir:shDir,shifted:false,dashReady:false,dashFlash:0,spawnT:4});
  G.spawned++;return true;}

function grsUpdate(nb){const G=grs;
  if(G.hurtCD>0)G.hurtCD--;
  if(G.atkAnim[1]>0)G.atkAnim[1]--;
  if(G.atkCD>0)G.atkCD--;
  if(G.guardAnim>0)G.guardAnim--;
  if(G.guardFlash>0)G.guardFlash--;
  if(G.sweepFlash>0)G.sweepFlash--;
  if(G.comboT>0)G.comboT--; // visual timer only, combo doesn't reset from time
  // Shield orb float animation
  G.shieldOrbs=G.shieldOrbs.filter(o=>{o.t++;o.y-=1.5;o.alpha=Math.max(0,1-o.t/20);return o.t<20;});
  if(G.won){G.wonT++;if(G.wonT===120)transTo('STAGE 3',bosInit);return;}
  G.ens.forEach(e=>{if(e.dashFlash>0)e.dashFlash--;if(e.spawnT>0)e.spawnT--;});

  // Attack (↑→↓ = lane 0,1,2)
  if(G.atkCD<=0){
    const ak=[['arrowup',0],['arrowright',1],['arrowdown',2]];
    for(const[k,l]of ak){if(J(k)){ea();G.atkAnim=[l,5];G.atkCD=2;S.kill();
      let hit=false;
      // SWEEP: combo >= 4 → hit ALL step-0 enemies
      if(G.sweepReady){
        G.sweepReady=false;G.sweepFlash=8;
        for(let i=0;i<G.ens.length;i++){const e=G.ens[i];
          if(!e.dead&&e.step===0){
            e.dead=true;grsComboHit(G);
            const pts=(200+G.combo*60)*loop;score+=pts;hit=true;
            addPopup(GRS_EX[0]+75,GRS_LY[e.lane]+4,'SWEEP +'+pts);
            grsDeathParticles(e.lane, 10, 2);
            grsSlash.push({lane:e.lane,life:6,hit:true});}}
        if(hit)S.combo(8);
        G.combo=0;G.comboT=0;
        grsCheckShieldDrop(G, l);
      }else{
        // Normal single-lane attack
        for(let i=0;i<G.ens.length;i++){const e=G.ens[i];
          if(!e.dead&&e.lane===l&&e.step===0){
            e.dead=true;grsComboHit(G);
            if(G.combo>1)S.combo(Math.min(G.combo,8));
            const pts=(100+G.combo*40)*loop;score+=pts;hit=true;
            addPopup(GRS_EX[0]+75,GRS_LY[l]+4,G.combo>2?pts+' x'+G.combo:'+'+pts);
            grsDeathParticles(l, 8, 1.5);
            break;}}
        grsSlash.push({lane:l,life:6,hit});
        if(!hit){grsMiss.push({lane:l,life:5});G.combo=0;G.sweepReady=false;}
        if(hit) grsCheckShieldDrop(G, l);
      }
      // Activate sweep when combo reaches 4
      if(G.combo>=4&&!G.sweepReady){G.sweepReady=true;S.gem();}
      break;}}}

  // Guard (←) — can be used same tick as attack
  if(J('arrowleft')&&G.guards>0&&G.atkCD<=0){ea();
    for(let i=0;i<G.ens.length;i++){const e=G.ens[i];
      if(!e.dead&&e.step===0){
        e.dead=true;G.kills++;score+=50*loop;
        addPopup(GRS_EX[0]+75,GRS_LY[e.lane]+4,'+'+50*loop);
        grsDeathParticles(e.lane, 4, 1);
        break;}}
    G.guards--;G.guardAnim=6;G.guardFlash=4;G.atkCD=3;S.guard();}

  if(!nb)return;
  G.ens=G.ens.filter(e=>!e.dead);

  // Enemies reaching knight
  for(let i=G.ens.length-1;i>=0;i--){if(G.ens[i].step<=-1){
    G.ens[i].dead=true;if(G.hurtCD<=0){G.hurtCD=twoBeatDuration();G.combo=0;doHurt();}}}

  // Move enemies by behavior
  G.ens.forEach(e=>{if(e.dead||e.spawnT>0)return;
    if(e.beh==='dasher'){
      if(e.step===2&&!e.dashReady){e.dashReady=true;e.dashFlash=4;return;}
      if(e.dashReady){e.step=0;e.dashReady=false;e.dashFlash=3;
        grsLaneFlash.push({lane:e.lane,life:4});return;}}
    if(e.beh==='shifter'&&e.step===2&&!e.shifted){
      e.shifted=true;const nl=e.lane+e.shiftDir;
      if(nl>=0&&nl<=2){grsLaneFlash.push({lane:e.lane,life:3});e.lane=nl;}}
    if(e.wait>0){e.wait--;return;}
    e.step--;
  });

  // Spawn surplus
  if(G.spawned<G.maxSpawn&&!G.won){
    const iv=Math.max(1,3-Math.floor((loop-1)/1));
    if(beatNum%iv===0)spawnEnemy(G);
    if(loop>=2&&beatNum%3===1&&G.spawned<G.maxSpawn)spawnEnemy(G);
    if(loop>=4&&beatNum%4===2&&G.spawned<G.maxSpawn)spawnEnemy(G);}

  G.ens=G.ens.filter(e=>!e.dead);
  if(G.kills>=G.goal&&!G.won){G.won=true;G.wonT=0;S.clear();score+=3000*loop;if(hp<maxHp)hp++;}}

function drawPrairieBG(){
  // Sky gradient feel (subtle)
  onFill(.015);$.fillRect(0,0,W,40);$.globalAlpha=1;

  // Distant mountains
  onFill(.035);
  $.beginPath();$.moveTo(0,30);$.lineTo(50,10);$.lineTo(100,28);$.lineTo(150,8);$.lineTo(200,25);
  $.lineTo(260,12);$.lineTo(310,26);$.lineTo(360,6);$.lineTo(W,24);$.lineTo(W,40);$.lineTo(0,40);$.closePath();$.fill();$.globalAlpha=1;

  // Rolling hills (foreground)
  onFill(.055);
  $.beginPath();$.moveTo(0,36);$.quadraticCurveTo(80,24,160,34);$.quadraticCurveTo(240,20,320,32);$.quadraticCurveTo(380,26,W,30);$.lineTo(W,42);$.lineTo(0,42);$.closePath();$.fill();$.globalAlpha=1;

  // Distant castle silhouette (larger, more detailed)
  onFill(.07);
  $.fillRect(350,12,4,22);$.fillRect(360,16,10,18);$.fillRect(372,14,4,20);$.fillRect(378,18,6,16);
  // Castle towers
  $.beginPath();$.moveTo(350,12);$.lineTo(352,4);$.lineTo(354,12);$.fill();
  $.beginPath();$.moveTo(372,14);$.lineTo(374,6);$.lineTo(376,14);$.fill();
  // Castle walls
  $.fillRect(354,22,6,2);$.fillRect(370,22,8,2);
  // Flag on tower
  const fWave=Math.sin(tick*.1)*2;
  $.fillRect(352,4,1,4);$.fillRect(353,4+fWave*.3,4,2);$.globalAlpha=1;

  // Trees (varied sizes)
  onFill(.06);
  circle(8,34,16);$.fillRect(6,34,4,16);
  circle(24,38,8);$.fillRect(22,38,4,12);
  circle(W-12,30,14);$.fillRect(W-14,30,4,18);
  circle(W-30,36,9);$.fillRect(W-32,36,4,14);$.globalAlpha=1;

  // Bushes between lanes
  onFill(.04);
  for(const[bx,by]of[[60,GRS_LY[0]+52],[180,GRS_LY[1]+52],[320,GRS_LY[0]+52],[400,GRS_LY[1]+52]]){
    $.beginPath();$.arc(bx,by,6,0,TAU);$.arc(bx+8,by-1,5,0,TAU);$.arc(bx+4,by-3,4,0,TAU);$.fill();}
  $.globalAlpha=1;

  // Birds (V-shapes, animated)
  onStroke(.06);
  for(let i=0;i<3;i++){const bx=(tick*.4+i*150)%500-20,by=8+i*6+Math.sin(tick*.12+i*2)*4;
    $.beginPath();$.moveTo(bx-3,by+2);$.lineTo(bx,by);$.lineTo(bx+3,by+2);$.stroke();}
  $.globalAlpha=1;

  // Clouds (3 layers)
  const cx1=(tick*.3)%520-60,cx2=(tick*.2+200)%540-70,cx3=(tick*.15+350)%560-80;
  onFill(.04);
  $.beginPath();$.arc(cx1,10,8,0,TAU);$.arc(cx1+10,8,6,0,TAU);$.arc(cx1+18,11,7,0,TAU);$.fill();
  $.beginPath();$.arc(cx2,16,6,0,TAU);$.arc(cx2+12,14,8,0,TAU);$.fill();
  $.beginPath();$.arc(cx3,6,5,0,TAU);$.arc(cx3+8,5,4,0,TAU);$.arc(cx3+14,7,5,0,TAU);$.fill();
  $.globalAlpha=1;

  // === PER-LANE: Road with cobblestone feel ===
  for(let ln=0;ln<3;ln++){const ly=GRS_LY[ln];
    // Road surface (wider, textured)
    onFill(.04);$.fillRect(20,ly+42,W-40,6);$.globalAlpha=1;
    // Cobblestone dots
    onFill(.025);
    for(let cx=25;cx<W-25;cx+=12)$.fillRect(cx+(ln*4)%8,ly+43,4,3);$.globalAlpha=1;
    // Signpost at right edge
    onFill(.12);
    $.fillRect(W-22,ly+20,3,28);$.fillRect(W-22,ly+28,10,2);$.fillRect(W-22,ly+36,8,2);
    // Milestone markers
    for(let ss=1;ss<4;ss++){onFill(.08);$.fillRect(GRS_EX[ss]+74,ly+42,2,6);$.globalAlpha=1;}
    R(20,ly+48,W-40,1,false);}

  // Knight's barricade (left side defense line)
  onFill(.1);
  $.fillRect(38,GRS_LY[0]-4,4,GRS_LY[2]+50-GRS_LY[0]);// vertical post
  $.fillRect(34,GRS_LY[0]+20,12,2);$.fillRect(34,GRS_LY[1]+20,12,2);$.fillRect(34,GRS_LY[2]+20,12,2);// cross beams
  $.globalAlpha=1;

  // Flowers (more varied)
  onFill(.18);
  const fl=(x,y)=>{$.fillRect(x,y,2,2);$.fillRect(x-1,y+1,1,1);$.fillRect(x+2,y+1,1,1);$.fillRect(x,y+2,2,3);};
  fl(72,GRS_LY[0]+38);fl(190,GRS_LY[1]+40);fl(310,GRS_LY[2]+38);
  fl(130,GRS_LY[0]+42);fl(260,GRS_LY[1]+38);fl(400,GRS_LY[2]+42);
  fl(95,GRS_LY[2]+40);fl(230,GRS_LY[0]+40);fl(370,GRS_LY[1]+42);$.globalAlpha=1;

  // Animated grass (swaying)
  grsGrass.forEach(g=>{const sway=Math.sin(tick*.08+g.ph)*2.5;
    onStroke(.2);$.lineWidth=1;
    $.beginPath();$.moveTo(g.x,g.y);$.lineTo(g.x+sway,g.y-g.h);$.stroke();
    $.beginPath();$.moveTo(g.x+2,g.y);$.lineTo(g.x+2+sway*.7,g.y-g.h*.8);$.stroke();$.globalAlpha=1;});

  // Wind streaks
  $.strokeStyle=ON;$.lineWidth=1;
  for(let i=0;i<4;i++){const wx=(tick*1.5+i*130)%540-50,wy=GRS_LY[i%3]+25+Math.sin(tick*.06+i)*8;
    $.globalAlpha=.04;$.beginPath();$.moveTo(wx,wy);$.lineTo(wx+20+Math.sin(tick*.1)*4,wy-2);$.stroke();}
  $.globalAlpha=1;
}

function grsDraw(){const G=grs;
  drawPrairieBG();
  txtC('— PRAIRIE —',W/2,28,7);

  // Guard display
  txt('←GRD',338,40,5);
  for(let i=0;i<3;i++){R(386+i*14,38,10,10,i<G.guards);
    if(i<G.guards){$.fillStyle=ON;$.fillRect(388+i*14,40,6,6);$.fillStyle=BG;$.fillRect(389+i*14,41,4,4);}}
  if(G.guardFlash>0){onFill(G.guardFlash/4*.3);$.fillRect(16,44,W-32,4);$.globalAlpha=1;}

  const eDr={slime:iSlime,goblin:iGoblin,skel:iSkel};
  const kL=['↑','→','↓'];

  for(let ln=0;ln<3;ln++){const ly=GRS_LY[ln];
    txt(kL[ln],8,ly+14,10);
    px(K_F,28,ly+4,2,false);px(K_AT,28,ly+4,2,false);
    for(let ss=0;ss<4;ss++){iSlime(GRS_EX[ss]+65,ly+8,false);R(GRS_EX[ss]+73,ly+34,2,6,false);}
    // Danger zone
    onFill(.03);$.fillRect(GRS_EX[0]+58,ly,36,48);$.globalAlpha=1;
    R(GRS_EX[0]+65,ly+38,20,2,false);

    // Active knight — attack / guard / idle breathing
    const atkThis=G.atkAnim[1]>0&&G.atkAnim[0]===ln;
    if(atkThis)px(K_AT,28,ly+4,2,true);
    else if(G.guardAnim>0)px(K_AT,28,ly+4,2,true);
    else{const br=tick>20?Math.sin(tick*.07+ln)*.5:0;px(K_F,28,ly+4+br,2,true);}
    R(28,ly+44,W-56,1,false);}

  // Lane flash
  grsLaneFlash=grsLaneFlash.filter(f=>{f.life--;if(f.life<=0)return false;
    const ly=GRS_LY[f.lane];onFill(f.life/4*.12);
    $.fillRect(GRS_EX[0]+58,ly,W-GRS_EX[0]-80,48);$.globalAlpha=1;return true;});

  // Miss X marks
  grsMiss=grsMiss.filter(m=>{m.life--;if(m.life<=0)return false;
    const ly=GRS_LY[m.lane],mx=GRS_EX[0]+73;
    $.strokeStyle=ON;$.lineWidth=2;$.globalAlpha=m.life/4*.5;
    $.beginPath();$.moveTo(mx-5,ly+12);$.lineTo(mx+5,ly+22);$.stroke();
    $.beginPath();$.moveTo(mx+5,ly+12);$.lineTo(mx-5,ly+22);$.stroke();
    $.globalAlpha=1;$.lineWidth=1;return true;});

  // Enemies
  G.ens.forEach(e=>{if(e.dead||e.step<0||e.step>3)return;
    const ly=GRS_LY[e.lane],ex=GRS_EX[e.step]+65;
    // Spawn fade-in
    const sa=e.spawnT>0?(1-e.spawnT/4):1;
    $.globalAlpha=sa;
    // March wobble
    const wobble=Math.sin(tick*.25+e.lane*2)*.8;
    eDr[e.type](ex,ly+8+wobble,true);

    // SHIFTER: direction arrow + dotted trail
    if(e.beh==='shifter'&&!e.shifted&&e.step>=2){
      const ay=ly+20,ax2=ex+10;onFill(sa*(.5+Math.sin(tick*.3)*.2));
      if(e.shiftDir<0){$.beginPath();$.moveTo(ax2,ay-8);$.lineTo(ax2-5,ay-2);$.lineTo(ax2+5,ay-2);$.closePath();$.fill();}
      else{$.beginPath();$.moveTo(ax2,ay+8);$.lineTo(ax2-5,ay+2);$.lineTo(ax2+5,ay+2);$.closePath();$.fill();}
      const tl=e.lane+e.shiftDir;
      if(tl>=0&&tl<=2){$.globalAlpha=sa*.15;for(let d=0;d<3;d++)$.fillRect(ex+8,ly+20+e.shiftDir*(8+d*8),3,3);}
      $.globalAlpha=sa;}

    // DASHER: charge then leap
    if(e.beh==='dasher'&&e.step===2){
      if(e.dashReady){
        if(Math.floor(tick/2)%2){onFill(sa*.35);
          $.fillRect(GRS_EX[0]+68,ly+20,ex-GRS_EX[0]-60,3);$.globalAlpha=sa;
          txt('!!',ex-16,ly+4,8);}
        // Vibrate
        const vx=(Math.random()-.5)*2;eDr[e.type](ex+vx,ly+8,true);
      }else{onFill(sa*.25);$.fillRect(ex-2,ly+34,24,3);$.globalAlpha=sa;
        txt('»',ex+22,ly+14,6);}}

    // Landing flash
    if(e.dashFlash>0&&e.step===0){onFill(e.dashFlash/3*.3);
      $.fillRect(GRS_EX[0]+58,ly,36,48);$.globalAlpha=1;}

    // Warnings
    if(e.step===0&&Math.floor(tick/2)%2){$.globalAlpha=1;txt('!',ex-12,ly+6,10);}
    if(e.step===1){onFill(.2);$.fillRect(ex-3,ly+16,3,3);}
    $.globalAlpha=1;
  });

  // Slash effects (impact arc)
  grsSlash=grsSlash.filter(sl=>{sl.life--;if(sl.life<=0)return false;
    const ly=GRS_LY[sl.lane],sx=GRS_EX[0]+55;const p=sl.life/6;
    $.strokeStyle=ON;$.lineWidth=2+p;$.globalAlpha=p;
    $.beginPath();$.arc(sx+20,ly+18,10+((6-sl.life)*5),-.8,1.3);$.stroke();
    if(sl.hit){$.lineWidth=1;circleS(sx+20,ly+18,4+((6-sl.life)*2));
      // Impact sparks
      if(sl.life>3){for(let sp=0;sp<2;sp++){const sa=Math.random()*TAU;
        $.fillStyle=ON;$.fillRect(sx+20+Math.cos(sa)*12,ly+18+Math.sin(sa)*12,2,2);}}}
    $.globalAlpha=1;$.lineWidth=1;return true;});

  // Death particles (with rotation)
  $.fillStyle=ON;grsDead=grsDead.filter(d=>{d.x+=d.vx;d.y+=d.vy;d.vy+=.08;d.life--;
    if(d.life>0){$.globalAlpha=d.life/12;
      $.save();$.translate(d.x+1.5,d.y+1.5);$.rotate((d.rot||0)+tick*.1);
      $.fillRect(-1.5,-1.5,3,3);$.restore();$.globalAlpha=1;return true;}return false;});

  // Popups
  Popups.updateAndDraw();

  // Progress bar with pulse near completion
  {const bx=80,by2=H-16,bw=180,bh=8;
    $.fillStyle=GH;$.fillRect(bx,by2,bw,bh);
    const pct=Math.min(1,G.kills/G.goal);
    $.fillStyle=ON;$.fillRect(bx,by2,Math.floor(bw*pct),bh);
    if(pct>.75){$.globalAlpha=.15+Math.sin(tick*.2)*.1;$.fillRect(bx,by2,Math.floor(bw*pct),bh);$.globalAlpha=1;}
    for(let i=1;i<4;i++){$.fillStyle=BG;$.fillRect(bx+Math.floor(bw*i/4),by2,1,bh);}
    txt(G.kills+'/'+G.goal,bx+bw+8,by2,6);}

  // Cooldown bar
  if(G.atkCD>0){onFill(.25);$.fillRect(28,GRS_LY[2]+50,G.atkCD*8,2);$.globalAlpha=1;}

  // Combo
  if(G.combo>1){const csz=Math.min(14,7+G.combo);const bounce=Math.sin(tick*.3)*1.5;
    txtC(G.combo+' HIT!',W/2,42+bounce,csz);
    if(G.combo>=3){onFill(.06+Math.sin(tick*.15)*.03);
      $.fillRect(W/2-50,38,100,csz+10);$.globalAlpha=1;}
    if(G.combo>=5){// Fire streaks
      for(let f=0;f<2;f++){const fx=W/2-40+Math.random()*80,fy=46+Math.random()*8;
        onFill(.12);$.fillRect(fx,fy,2,3);$.globalAlpha=1;}}}

  // === SWEEP READY indicator ===
  if(G.sweepReady){
    const sw=.5+Math.sin(tick*.25)*.3;onFill(sw);
    txtC('★ SWEEP ★',W/2,GRS_LY[0]-10,7);$.globalAlpha=1;
    // Flash all danger zones
    for(let ln=0;ln<3;ln++){onFill(sw*.08);
      $.fillRect(GRS_EX[0]+58,GRS_LY[ln],36,48);$.globalAlpha=1;}}

  // === SWEEP flash (all lanes) ===
  if(G.sweepFlash>0){onFill(G.sweepFlash/8*.15);
    $.fillRect(20,GRS_LY[0],W-40,GRS_LY[2]+48-GRS_LY[0]);$.globalAlpha=1;}

  // === SHIELD ORB floating up ===
  G.shieldOrbs.forEach(o=>{
    $.globalAlpha=o.alpha;
    $.strokeStyle=ON;$.lineWidth=2;circleS(W/2,o.y,7);
    onFill(o.alpha*.3);circle(W/2,o.y,5);
    $.globalAlpha=1;$.lineWidth=1;});

  // === EARNED SHIELDS display (bottom left, under progress)
  if(earnedShields>0){
    $.globalAlpha=.5;txt('SHLD',14,H-16,5);
    for(let i=0;i<earnedShields;i++){
      onStroke(.45);
      circleS(52+i*12,H-12,4);
      onFill(.1);circle(52+i*12,H-12,4);}
    $.globalAlpha=1;}

  // Clear celebration
  if(G.won){const wt=G.wonT;
    const oa=Math.min(.90,wt/20*.90);$.fillStyle=`rgba(176,188,152,${oa})`;$.fillRect(0,0,W,H);
    if(wt>8){const sc=Math.min(1,(wt-8)/12);$.globalAlpha=sc;
      txtC('STAGE CLEAR',W/2,70,16);$.globalAlpha=1;}
    if(wt>28){$.globalAlpha=Math.min(1,(wt-28)/12);
      const lw=Math.min(100,(wt-28)*3);$.fillStyle=ON;$.globalAlpha*=.3;
      $.fillRect(W/2-lw/2,88,lw,1);$.globalAlpha=Math.min(1,(wt-28)/12);
      txtC('— PRAIRIE —',W/2,100,8);$.globalAlpha=1;}
    // Defeated enemies march across
    if(wt>42){$.globalAlpha=Math.min(1,(wt-42)/12);
      const ox=(wt-42)*.8;
      iSlime(W/2-80+ox*.3,140,true);iGoblin(W/2-20,140-2,true);iSkel(W/2+40-ox*.3,140-2,true);
      $.globalAlpha=1;}
    // Knight salute
    if(wt>55){$.globalAlpha=Math.min(1,(wt-55)/10);
      px(K_R,W/2-10,165,2,true);$.globalAlpha=1;}
    if(wt>65){$.globalAlpha=Math.min(1,(wt-65)/12);
      txtC('BONUS +'+3000*loop,W/2,205,8);$.globalAlpha=1;}
    if(wt>78&&G.maxCombo>1){$.globalAlpha=Math.min(1,(wt-78)/10);
      txtC('MAX COMBO: '+G.maxCombo,W/2,225,7);$.globalAlpha=1;}
    if(wt>88&&earnedShields>0){$.globalAlpha=Math.min(1,(wt-88)/10);
      txtC('SHIELDS: '+earnedShields+' → CASTLE',W/2,242,6);
      // Draw shield icons
      for(let i=0;i<earnedShields;i++){$.strokeStyle=ON;$.lineWidth=1;
        circleS(W/2-30+i*18,256,5);}
      $.globalAlpha=1;}
    if(wt>100){$.globalAlpha=Math.min(1,(wt-100)/15);
      txtC('The castle looms ahead...',W/2,274,6);$.globalAlpha=1;}
    // Sparkles
    if(wt>12){onFill(.25+Math.sin(tick*.2)*.1);
      const sx=W/2-80+(tick*17)%160,sy=60+(tick*13+wt*7)%180;
      $.fillRect(sx,sy,2,2);$.globalAlpha=1;}}
}
/* ================================================================
   STAGE 3: CASTLE — Circular boss arena
   Boss center, 6 pedestals in ring, safe zone below
   ←→ rotates around ring (wraps through safe zone)
   ================================================================ */
let bos={};
const BOS_CX=220,BOS_CY=132,BOS_R=90;
const SAFE_X=220,SAFE_Y=282;
let bosParticles=[],bosShieldBreak=[],bosArmTrail=[];

const PED_ANG=[],PED_POS=[];
for(let i=0;i<6;i++){
  const a=-Math.PI/2+i*Math.PI/3;
  PED_ANG.push(a);
  PED_POS.push({x:BOS_CX+Math.cos(a)*BOS_R,y:BOS_CY+Math.sin(a)*BOS_R});}

function playerXY(pos){
  if(pos===0)return{x:SAFE_X,y:SAFE_Y};
  return{x:PED_POS[pos-1].x,y:PED_POS[pos-1].y};}

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rngInt(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;}

function bosInit(){
  assert(loop >= 1, 'bosInit: loop must be >= 1');
  state='boss';beatCtr=0;beatNum=0;Popups.clear();bosParticles=[];bosShieldBreak=[];bosArmTrail=[];
  // Arm speeds — from Difficulty module
  const baseSpd=Difficulty.bossArmSpeed(loop);
  const spdVar=loop<=2?1:0;
  const baseRest=Difficulty.bossArmRest(loop);
  const restVar=loop<=2?2:1;
  const initDelays=shuffle([0,3,6,9,12,15].map(d=>d+rngInt(0,2)));
  const spd=[],rest=[];
  for(let i=0;i<6;i++){
    spd.push(Math.max(1,baseSpd+rngInt(-spdVar,spdVar)));
    rest.push(Math.max(1,baseRest+rngInt(-restVar,restVar)));}
  // Shields — from Difficulty module
  const totalShields=Difficulty.bossShields(earnedShields);
  bos={pos:0,hasGem:false,
    peds:[0,0,0,0,0,0],
    armStage:[0,0,0,0,0,0],armDir:[1,1,1,1,1,1],
    armSpeed:spd,armBaseSpd:baseSpd,armSpdVar:spdVar,
    armRest:rest,armBaseRest:baseRest,armRestVar:restVar,
    armBeat:[0,0,0,0,0,0],
    armResting:[true,true,true,true,true,true],
    armRestT:[...initDelays],
    armWarn:[0,0,0,0,0,0],
    shields:totalShields,
    hurtCD:0,moveCD:0,won:false,wonT:0,walkT:0,prevPos:0,
    stealAnim:[-1,0],placeAnim:[-1,0],shieldAnim:[-1,0],
    bossAnger:0,bossPulse:0,bossBreath:0,
    counterCD:0,counterFlash:[-1,0],
    rageWave:0,
    quake:0
  };}

function bosUpdate(nb){const B=bos;
  if(B.hurtCD>0)B.hurtCD--;
  if(B.moveCD>0)B.moveCD--;
  if(B.counterCD>0)B.counterCD--;
  if(B.stealAnim[1]>0)B.stealAnim[1]--;
  if(B.placeAnim[1]>0)B.placeAnim[1]--;
  if(B.shieldAnim[1]>0)B.shieldAnim[1]--;
  if(B.counterFlash[1]>0)B.counterFlash[1]--;
  if(B.bossPulse>0)B.bossPulse--;
  if(B.quake>0)B.quake--;
  B.bossBreath+=.04;
  if(B.walkT>0)B.walkT--;
  if(B.won){B.wonT++;
    if(B.wonT===150){
      if(Difficulty.isTrueEnding(loop)){state='trueEnd';teT=0;tick=0;}
      else if(loop===1){state='ending1';e1T=0;tick=0;}
      else{loop++;noDmg=true;if(hp<maxHp)hp++;transTo('LOOP '+loop,cavInit);}}
    return;}
  B.bossAnger=B.peds.filter(p=>p>0).length;
  for(let i=0;i<6;i++)if(B.armWarn[i]>0)B.armWarn[i]--;

  // Movement ←→ (wrap around 0-6)
  if(B.moveCD<=0){
    if(J('arrowright')){B.prevPos=B.pos;B.pos=(B.pos+1)%7;B.moveCD=3;B.walkT=6;
      if(B.pos===0)S.safe();else S.move();
      if(B.pos===0&&!B.hasGem)B.hasGem=true;bosChk();}
    else if(J('arrowleft')){B.prevPos=B.pos;B.pos=(B.pos+6)%7;B.moveCD=3;B.walkT=6;
      if(B.pos===0)S.safe();else S.move();
      if(B.pos===0&&!B.hasGem)B.hasGem=true;bosChk();}}
  if(B.pos===0&&!B.hasGem)B.hasGem=true;

  // Z = place gem / shield
  if(jAct()&&B.pos>=1&&B.pos<=6){
    const pi=B.pos-1;const pp=PED_POS[pi];
    if(B.hasGem&&B.peds[pi]===0){
      B.peds[pi]=1;B.hasGem=false;B.placeAnim=[pi,8];
      score+=500*loop;addPopup(pp.x,pp.y-20,'+'+500*loop);
      S.gem();ea();
      if(B.peds.every(p=>p>0)){B.won=true;B.wonT=0;S.clear();S.bossDie();score+=5000*loop;
        if(noDmg)score+=10000*loop;}
    }else if(B.peds[pi]===1&&B.shields>0){
      B.peds[pi]=2;B.shields--;B.shieldAnim=[pi,8];
      score+=200*loop;addPopup(pp.x,pp.y-20,'SHIELD');
      S.guard();ea();}}
  // ↑ = shield shortcut
  if(J('arrowup')&&B.pos>=1&&B.pos<=6){
    const pi=B.pos-1;const pp=PED_POS[pi];
    if(B.peds[pi]===1&&B.shields>0){
      B.peds[pi]=2;B.shields--;B.shieldAnim=[pi,8];
      score+=200*loop;addPopup(pp.x,pp.y-20,'SHIELD');
      S.guard();ea();}}

  // ↓ = COUNTER-ATTACK — deflect an approaching arm
  if(J('arrowdown')&&B.pos>=1&&B.pos<=6&&B.counterCD<=0){
    const pi=B.pos-1;
    if(B.armStage[pi]>=3&&!B.armResting[pi]){
      // Deflect! Reset arm and stun it
      B.armStage[pi]=0;B.armResting[pi]=true;
      B.armRestT[pi]=Math.max(2,B.armBaseRest+2); // longer rest after deflect
      B.armDir[pi]=1;B.counterCD=twoBeatDuration(); // cooldown = 2 beats
      B.counterFlash=[pi,8];
      score+=300*loop;addPopup(PED_POS[pi].x,PED_POS[pi].y-20,'COUNTER!');
      S.kill();doHitStop(3);
      Particles.spawn(bosParticles,{x:PED_POS[pi].x,y:PED_POS[pi].y-4,n:8,vxSpread:1.5,vySpread:1.2,vyBase:-1.5,life:12,s:3,gravity:.1});
      B.bossPulse=5;ea();}}

  if(!nb)return;
  // --- Beat tick ---
  // RAGE WAVE: when anger >= 3, occasionally force multiple arms to attack together
  if(B.bossAnger>=3&&B.rageWave<=0&&rng()<.08*B.bossAnger){
    B.rageWave=1;B.quake=6;
    // Wake up 2-3 sleeping arms at once
    let woken=0;const target=B.bossAnger>=5?3:2;
    for(let i=0;i<6;i++){
      if(woken>=target)break;
      if(B.armResting[i]&&B.armRestT[i]>1){
        B.armRestT[i]=1;woken++;}}
    if(woken>0){S.warn();S.zap();addPopup(BOS_CX,BOS_CY-40,'RAGE!');}}
  if(B.rageWave>0)B.rageWave--;
  for(let i=0;i<6;i++){
    if(B.armResting[i]){B.armRestT[i]--;
      if(B.armRestT[i]===2){B.armWarn[i]=Math.round(B.armSpeed[i]*30/TICK_RATE*2+12);}
      if(B.armRestT[i]<=0){B.armResting[i]=false;B.armDir[i]=1;
        B.armSpeed[i]=Math.max(1,B.armBaseSpd+rngInt(-B.armSpdVar,B.armSpdVar));}
      continue;}
    B.armBeat[i]++;
    if(B.armBeat[i]>=B.armSpeed[i]){
      B.armBeat[i]=0;
      B.armStage[i]+=B.armDir[i];
      // Sound cue approaching danger
      if(B.armStage[i]===5&&B.armDir[i]===1)S.warn();
      if(B.armStage[i]>=6){
        B.armStage[i]=6;B.armDir[i]=-1;B.bossPulse=5;
        const pp=PED_POS[i];
        if(B.peds[i]===1){B.peds[i]=0;B.stealAnim=[i,10];S.steal();
          Particles.spawn(bosParticles,{x:pp.x,y:pp.y-6,n:8,vxSpread:1.2,vySpread:1.2,vyBase:-1.5,life:14,s:3,gravity:.1});
          bosArmTrail.push({idx:i,life:8});}
        if(B.peds[i]===2){B.peds[i]=1;B.shieldAnim=[i,8];
          bosShieldBreak.push({idx:i,life:10});S.shieldBreak();
          Particles.spawn(bosParticles,{x:pp.x,y:pp.y-6,n:6,vxSpread:1.5,vySpread:1,vyBase:-1,life:12,s:3,gravity:.1});}
        if(B.pos===i+1&&B.hurtCD<=0){B.hurtCD=twoBeatDuration();if(B.hasGem)B.hasGem=false;B.pos=0;doHurt();}
      }
      if(B.armStage[i]<=0){B.armStage[i]=0;B.armResting[i]=true;
        B.armRestT[i]=Math.max(1,B.armBaseRest+rngInt(-B.armRestVar,B.armRestVar));
        if(B.bossAnger>=3)B.armRestT[i]=Math.max(1,B.armRestT[i]-1);
        if(B.bossAnger>=5)B.armRestT[i]=Math.max(1,B.armRestT[i]-1);}
    }
  }
}

function bosChk(){const B=bos;
  if(B.pos>=1&&B.pos<=6){const ai=B.pos-1;
    if(B.armStage[ai]>=6&&B.hurtCD<=0){
      B.hurtCD=twoBeatDuration();if(B.hasGem)B.hasGem=false;B.pos=0;doHurt();}}}

function drawCastleBG(){
  // === DARK STONE WALLS ===
  // Brick pattern (more visible)
  onFill(.035);
  for(let y=0;y<H;y+=12)for(let x=0;x<W;x+=20){
    $.fillRect(x+(Math.floor(y/12)%2)*10,y,19,11);}$.globalAlpha=1;
  // Darker edges (room depth)
  onFill(.04);
  $.fillRect(0,0,30,H);$.fillRect(W-30,0,30,H);$.globalAlpha=1;

  // === GOTHIC ARCHES (top) ===
  $.strokeStyle=ON;$.lineWidth=2;$.globalAlpha=.06;
  $.beginPath();$.moveTo(60,0);$.quadraticCurveTo(W/2,30,W-60,0);$.stroke();
  $.beginPath();$.moveTo(30,0);$.quadraticCurveTo(W/2,18,W-30,0);$.stroke();$.lineWidth=1;$.globalAlpha=1;
  // Keystone
  onFill(.06);$.fillRect(W/2-4,0,8,12);$.globalAlpha=1;

  // === TALL PILLARS ===
  for(const px2 of[0,W-14]){
    onFill(.09);$.fillRect(px2,0,14,H);
    // Bevel highlight
    $.fillStyle=BG;$.globalAlpha=.04;$.fillRect(px2+(px2===0?1:11),0,2,H);
    // Pillar base (wider)
    onFill(.08);$.fillRect(px2-2,H-30,18,30);
    // Pillar capital (top detail)
    $.fillRect(px2-2,0,18,8);$.globalAlpha=1;}

  // === STAINED GLASS WINDOWS (arched) ===
  for(const[wx,wy]of[[55,12],[W-55,12]]){
    // Window frame
    $.strokeStyle=ON;$.lineWidth=2;$.globalAlpha=.12;
    $.beginPath();$.moveTo(wx-14,wy+40);$.lineTo(wx-14,wy+8);
    $.arc(wx,wy+8,14,Math.PI,0);$.lineTo(wx+14,wy+40);$.closePath();$.stroke();
    // Panes (stained glass feel - geometric divisions)
    $.lineWidth=1;$.globalAlpha=.05;
    $.fillRect(wx-12,wy+10,24,28);// glass area
    $.globalAlpha=.08;
    $.beginPath();$.moveTo(wx,wy-4);$.lineTo(wx,wy+40);$.stroke();// vertical div
    $.beginPath();$.moveTo(wx-14,wy+20);$.lineTo(wx+14,wy+20);$.stroke();// horizontal div
    $.beginPath();$.moveTo(wx-14,wy+30);$.lineTo(wx+14,wy+30);$.stroke();
    // Light cast from window (subtle cone)
    onFill(.015);
    $.beginPath();$.moveTo(wx-10,wy+40);$.lineTo(wx-25,SAFE_Y);$.lineTo(wx+25,SAFE_Y);$.lineTo(wx+10,wy+40);$.closePath();$.fill();
    $.globalAlpha=1;$.lineWidth=1;}

  // === BANNERS (hanging from ceiling) ===
  for(const[bx,bc]of[[130,.08],[W-130,.08],[W/2,.06]]){
    // Pole
    onFill(bc);$.fillRect(bx-10,0,20,2);
    // Fabric (wavy)
    const sway=Math.sin(tick*.04+bx*.1)*1.5;
    $.globalAlpha=bc*.8;
    $.beginPath();$.moveTo(bx-8,2);$.lineTo(bx-7+sway,30);
    $.lineTo(bx+sway*.5,35);$.lineTo(bx+7+sway,30);$.lineTo(bx+8,2);$.closePath();$.fill();
    // Banner emblem (diamond)
    $.fillStyle=BG;$.globalAlpha=bc*.4;$.beginPath();
    $.moveTo(bx+sway*.3,14);$.lineTo(bx+4+sway*.3,20);$.lineTo(bx+sway*.3,26);$.lineTo(bx-4+sway*.3,20);$.closePath();$.fill();
    $.globalAlpha=1;}

  // === TORCHES (4 total, animated) ===
  for(const tx of[18,68,W-68,W-18]){
    onFill(.2);$.fillRect(tx-1,55,3,10);
    $.fillRect(tx-3,54,7,2);// bracket
    const fh=5+Math.sin(tick*.18+tx)*.8;const fw=2.5+Math.sin(tick*.22+tx+1)*.5;
    // Outer flame
    $.globalAlpha=.45+Math.sin(tick*.14+tx)*.12;
    $.beginPath();$.ellipse(tx+.5,53-fh*.3,fw,fh,0,0,TAU);$.fill();
    // Inner flame
    $.fillStyle=BG;$.globalAlpha=.18;
    $.beginPath();$.ellipse(tx+.5,53-fh*.2,1.2,fh*.5,0,0,TAU);$.fill();
    // Glow (warm light on walls)
    onFill(.035);circle(tx+.5,52,22);
    $.globalAlpha=.015;circle(tx+.5,52,40);
    // Smoke
    const sy2=45-((tick+tx*7)%40)*.6;const sa=Math.max(0,.05-((tick+tx*7)%40)*.0013);
    onFill(sa);$.fillRect(tx+Math.sin(tick*.07+tx)*3-1,sy2,2,2);
    $.globalAlpha=1;}

  // === THRONE/ALTAR behind boss ===
  // Tall back
  onFill(.04);
  $.fillRect(BOS_CX-18,BOS_CY-55,36,20);
  // Side spires
  $.fillRect(BOS_CX-22,BOS_CY-48,6,14);$.fillRect(BOS_CX+16,BOS_CY-48,6,14);
  // Pointed tops
  $.beginPath();$.moveTo(BOS_CX-22,BOS_CY-48);$.lineTo(BOS_CX-19,BOS_CY-58);$.lineTo(BOS_CX-16,BOS_CY-48);$.fill();
  $.beginPath();$.moveTo(BOS_CX+16,BOS_CY-48);$.lineTo(BOS_CX+19,BOS_CY-58);$.lineTo(BOS_CX+22,BOS_CY-48);$.fill();
  $.globalAlpha=1;

  // === FLOOR ===
  // Main floor line
  onFill(.14);$.fillRect(14,SAFE_Y+20,W-28,2);
  $.globalAlpha=.05;$.fillRect(14,SAFE_Y+22,W-28,1);$.globalAlpha=1;
  // Floor tiles
  for(let x=16;x<W-16;x+=28){
    onFill(.025);$.fillRect(x,SAFE_Y+23,27,10);
    $.fillStyle=BG;$.globalAlpha=.012;$.fillRect(x+1,SAFE_Y+23,25,1);}$.globalAlpha=1;
  // Carpet/rug (center path to boss)
  onFill(.03);
  $.fillRect(SAFE_X-16,SAFE_Y+2,32,20);
  $.globalAlpha=.015;$.fillRect(SAFE_X-14,SAFE_Y+4,28,16);
  // Carpet edge tassels
  $.globalAlpha=.04;
  $.fillRect(SAFE_X-18,SAFE_Y+20,2,4);$.fillRect(SAFE_X+16,SAFE_Y+20,2,4);
  $.fillRect(SAFE_X-12,SAFE_Y+20,2,4);$.fillRect(SAFE_X+10,SAFE_Y+20,2,4);
  $.globalAlpha=1;

  // === CHAINS (from ceiling) ===
  for(const cx of[38,W-38]){
    onFill(.05);
    for(let cy=2;cy<35;cy+=5){$.fillRect(cx-1,cy,3,4);
      $.fillStyle=BG;$.globalAlpha=.02;$.fillRect(cx,cy+1,1,2);onFill(.05);}
    $.globalAlpha=1;}
}

function bosDraw(){const B=bos;
  drawCastleBG();

  // === AMBIENT DUNGEON DECORATIONS ===
  // Floating dust motes (slow, lazy)
  $.fillStyle=ON;
  for(let i=0;i<10;i++){
    const dx=(tick*.15+i*47)%W,dy=(tick*.08+i*33+Math.sin(tick*.02+i*1.7)*20)%H;
    $.globalAlpha=.04+Math.sin(tick*.03+i*2)*.02;
    $.fillRect(dx,dy,1+((i%3===0)?1:0),1);}$.globalAlpha=1;

  // Skull decorations on walls (flanking the arena)
  for(const[sx,sy] of [[22,90],[W-22,90],[22,200],[W-22,200]]){
    onFill(.06);
    circle(sx,sy,5); // cranium
    $.fillRect(sx-3,sy+4,6,3); // jaw
    $.fillStyle=BG;$.globalAlpha=.04;
    $.fillRect(sx-2,sy-1,2,2);$.fillRect(sx+1,sy-1,2,2); // eye sockets
    $.globalAlpha=1;}

  // Magic circle on floor (large, around ring)
  onStroke(.03+Math.sin(tick*.04)*.01);
  circleS(BOS_CX,BOS_CY,BOS_R+22);
  // Inner circle
  $.globalAlpha=.025;circleS(BOS_CX,BOS_CY,BOS_R-10);
  // Hexagram inscribed in circle
  for(let i=0;i<6;i++){
    const a1=-Math.PI/2+i*Math.PI/3,a2=-Math.PI/2+(i+2)*Math.PI/3;
    const r2=BOS_R+18;
    $.globalAlpha=.02;$.beginPath();
    $.moveTo(BOS_CX+Math.cos(a1)*r2,BOS_CY+Math.sin(a1)*r2);
    $.lineTo(BOS_CX+Math.cos(a2)*r2,BOS_CY+Math.sin(a2)*r2);$.stroke();}
  $.globalAlpha=1;

  // Rune glyphs between pedestals (on the outer circle)
  for(let i=0;i<6;i++){
    const midA=PED_ANG[i]+Math.PI/6; // between pedestals
    const rx=BOS_CX+Math.cos(midA)*(BOS_R+18),ry=BOS_CY+Math.sin(midA)*(BOS_R+18);
    onFill(.04+Math.sin(tick*.06+i*1.1)*.015);
    // Small cross/rune shape
    $.fillRect(rx-1,ry-3,2,6);$.fillRect(rx-3,ry-1,6,2);}
  $.globalAlpha=1;

  // Magical sparkles (drifting upward, near pedestals)
  for(let i=0;i<4;i++){
    const pi2=Math.floor((tick*.07+i*1.5)%6);const pp=PED_POS[pi2];
    if(B.peds[pi2]>0){
      const sparkX=pp.x-8+((tick*1.3+i*37)%16),sparkY=pp.y-20-((tick*.5+i*19)%30);
      onFill(.08+Math.sin(tick*.2+i)*.04);
      $.fillRect(sparkX,sparkY,1,1);$.globalAlpha=1;}}

  // Floor cracks (static, radiating from center)
  onStroke(.025);
  for(let i=0;i<5;i++){const ca=-Math.PI/2+i*TAU/5+.5;
    $.beginPath();$.moveTo(BOS_CX+Math.cos(ca)*20,BOS_CY+Math.sin(ca)*20);
    $.lineTo(BOS_CX+Math.cos(ca+.1)*55,BOS_CY+Math.sin(ca+.1)*55);$.stroke();}
  $.globalAlpha=1;

  // === RING PATH (visible movement route) ===
  // Arcane inner glow
  onFill(.02+Math.sin(tick*.06)*.008);
  circle(BOS_CX,BOS_CY,BOS_R+8);$.globalAlpha=1;
  // Draw ring circle (the movement path)
  onStroke(.1);
  circleS(BOS_CX,BOS_CY,BOS_R);
  // Rotating rune dots along ring
  for(let r=0;r<12;r++){const ra=-Math.PI/2+r*Math.PI/6+tick*.005;
    const rx=BOS_CX+Math.cos(ra)*(BOS_R+1),ry=BOS_CY+Math.sin(ra)*(BOS_R+1);
    $.globalAlpha=.06+Math.sin(tick*.1+r)*.03;$.fillRect(rx-1,ry-1,2,2);}

  // === PATH from safe zone to ring (subtle static connectors) ===
  onStroke(.05);
  $.setLineDash([2,6]);
  // Left connector: safe → pos 6 (top-left)
  $.beginPath();$.moveTo(SAFE_X-6,SAFE_Y-14);
  $.quadraticCurveTo(PED_POS[4].x+20,SAFE_Y-40,PED_POS[4].x,PED_POS[4].y+10);$.stroke();
  // Right connector: safe → pos 1 (top)
  $.beginPath();$.moveTo(SAFE_X+6,SAFE_Y-14);
  $.quadraticCurveTo(PED_POS[2].x-20,SAFE_Y-40,PED_POS[2].x,PED_POS[2].y+10);$.stroke();
  // Center connector: safe → pos 4 (bottom)
  $.beginPath();$.moveTo(SAFE_X,SAFE_Y-14);
  $.lineTo(PED_POS[3].x,PED_POS[3].y+8);$.stroke();
  $.setLineDash([]);$.globalAlpha=1;

  // Position markers on ring (enhanced with glow for current)
  for(let i=0;i<6;i++){const pp=PED_POS[i];
    const isCur=B.pos===i+1;
    onFill(isCur?.35:.08);
    circle(pp.x,pp.y,isCur?4:2);
    if(isCur){$.globalAlpha=.06;circle(pp.x,pp.y,12);}}
  // Safe zone marker
  const isSafe=B.pos===0;
  onFill(isSafe?.35:.12);circle(SAFE_X,SAFE_Y,isSafe?4:2.5);
  if(isSafe){$.globalAlpha=.06;circle(SAFE_X,SAFE_Y,14);}
  $.globalAlpha=1;

  // === MOVEMENT PREVIEW (shows where ← and → will go) ===
  if(!B.won){
    const posR=(B.pos+1)%7,posL=(B.pos+6)%7;
    const prR=playerXY(posR),prL=playerXY(posL);
    const pls=.1+Math.sin(tick*.12)*.05;
    const curP=playerXY(B.pos);

    if(B.pos===0){
      // === AT SAFE ZONE: show entry paths curving up to the ring ===
      // Right entry (→ → pos 1, top pedestal)
      onStroke(pls*2);$.lineWidth=2;
      $.setLineDash([4,4]);$.lineDashOffset=-tick*.6;
      $.beginPath();$.moveTo(SAFE_X+6,SAFE_Y-16);
      $.quadraticCurveTo(SAFE_X+30,SAFE_Y-60,prR.x,prR.y+12);$.stroke();
      // Left entry (← → pos 6, top-left pedestal)
      $.lineDashOffset=tick*.6;
      $.beginPath();$.moveTo(SAFE_X-6,SAFE_Y-16);
      $.quadraticCurveTo(SAFE_X-30,SAFE_Y-60,prL.x,prL.y+12);$.stroke();
      $.setLineDash([]);$.lineWidth=1;$.globalAlpha=1;

      // Ghost sprites at entry points
      $.globalAlpha=pls*1.2;px(K_F,prR.x-10,prR.y-12,2,true);$.globalAlpha=1;
      $.globalAlpha=pls*1.2;px(K_F,prL.x-10,prL.y-12,2,true);$.globalAlpha=1;

      // Arrow labels at destinations
      onFill(pls*2.5);txt('→',prR.x+12,prR.y-4,7);$.globalAlpha=1;
      onFill(pls*2.5);txt('←',prL.x-24,prL.y-4,7);$.globalAlpha=1;

    }else{
      // === ON RING: show arc paths along ring to adjacent pedestals ===
      const curAng=PED_ANG[B.pos-1];

      // Draw arc from current to right (→, clockwise) destination
      if(posR!==0){
        const destAng=PED_ANG[posR-1];
        let endAng=destAng;if(endAng<=curAng)endAng+=TAU;
        onStroke(pls*2);$.lineWidth=2;
        $.setLineDash([4,4]);$.lineDashOffset=-tick*.6;
        $.beginPath();$.arc(BOS_CX,BOS_CY,BOS_R,curAng,endAng);$.stroke();
        $.setLineDash([]);$.lineWidth=1;$.globalAlpha=1;
      }else{
        // → leads to safe zone: draw path curving down from ring
        onStroke(pls*2);$.lineWidth=2;
        $.setLineDash([4,4]);$.lineDashOffset=-tick*.6;
        $.beginPath();$.moveTo(curP.x,curP.y);
        $.quadraticCurveTo(curP.x+20,SAFE_Y-50,SAFE_X,SAFE_Y-12);$.stroke();
        $.setLineDash([]);$.lineWidth=1;$.globalAlpha=1;
      }

      // Draw arc from current to left (←, counterclockwise) destination
      if(posL!==0){
        const destAng=PED_ANG[posL-1];
        let startAng=destAng;if(startAng>=curAng)startAng-=TAU;
        onStroke(pls*2);$.lineWidth=2;
        $.setLineDash([4,4]);$.lineDashOffset=tick*.6;
        $.beginPath();$.arc(BOS_CX,BOS_CY,BOS_R,startAng,curAng);$.stroke();
        $.setLineDash([]);$.lineWidth=1;$.globalAlpha=1;
      }else{
        // ← leads to safe zone
        onStroke(pls*2);$.lineWidth=2;
        $.setLineDash([4,4]);$.lineDashOffset=tick*.6;
        $.beginPath();$.moveTo(curP.x,curP.y);
        $.quadraticCurveTo(curP.x-20,SAFE_Y-50,SAFE_X,SAFE_Y-12);$.stroke();
        $.setLineDash([]);$.lineWidth=1;$.globalAlpha=1;
      }

      // Ghost sprites + labels at destinations
      $.globalAlpha=pls;px(K_F,prR.x-10,prR.y-12,2,true);$.globalAlpha=1;
      onFill(pls*2);txt('→',prR.x+12,prR.y-4,6);$.globalAlpha=1;
      $.globalAlpha=pls;px(K_F,prL.x-10,prL.y-12,2,true);$.globalAlpha=1;
      onFill(pls*2);txt('←',prL.x-22,prL.y-4,6);$.globalAlpha=1;
    }
  }

  // === DANGER ZONE (behind arms) ===
  for(let i=0;i<6;i++){
    const pp=PED_POS[i];const stg=B.armStage[i];
    if(stg>=3){const danger=(stg-2)/4;
      onFill(danger*.07);
      circle(pp.x,pp.y,16+danger*6);$.globalAlpha=1;}}

  // === 6 ARMS (radial from center) ===
  for(let i=0;i<6;i++){
    const pp=PED_POS[i];
    const stg=B.armStage[i];const ext=stg/6;
    const dx=pp.x-BOS_CX,dy=pp.y-BOS_CY;

    // Reach guide (dotted path)
    onStroke(.07);
    $.setLineDash([2,5]);$.beginPath();$.moveTo(BOS_CX,BOS_CY);$.lineTo(pp.x,pp.y);$.stroke();
    $.setLineDash([]);$.globalAlpha=1;
    // Stage dots along path
    for(let s=1;s<=6;s++){const sx=BOS_CX+dx*s/6,sy=BOS_CY+dy*s/6;
      onFill(s<=stg?.18:.05);
      $.fillRect(sx-1,sy-1,s<=stg?3:2,s<=stg?3:2);}$.globalAlpha=1;

    // Warning pulse
    if(B.armWarn[i]>0&&stg===0){
      const wp=Math.sin(B.armWarn[i]*.5)*.5+.5;
      onFill(wp*.08);
      circle(pp.x,pp.y,22);
      $.strokeStyle=ON;$.lineWidth=2;$.globalAlpha=wp*.3;
      circleS(pp.x,pp.y,18);$.lineWidth=1;
      if(Math.floor(B.armWarn[i]/5)%2){$.globalAlpha=wp*.55;txt('!',pp.x+14,pp.y-14,8);}
      $.globalAlpha=1;}

    // Arm body (wavy, organic)
    if(stg>0){
      const ang=PED_ANG[i];const perp={x:-Math.sin(ang),y:Math.cos(ang)};
      const endX=BOS_CX+dx*ext,endY=BOS_CY+dy*ext;
      // Shadow
      onStroke(.04);$.lineWidth=6;
      $.beginPath();$.moveTo(BOS_CX+2,BOS_CY+2);
      for(let t=0;t<=1;t+=.08){const px2=BOS_CX+dx*ext*t,py2=BOS_CY+dy*ext*t;
        const wave=Math.sin(t*5+tick*.07+i)*3*ext;
        $.lineTo(px2+perp.x*wave+2,py2+perp.y*wave+2);}$.stroke();
      // Main arm
      $.globalAlpha=.4+ext*.6;$.lineWidth=4+ext;
      $.beginPath();$.moveTo(BOS_CX,BOS_CY);
      for(let t=0;t<=1;t+=.06){const px2=BOS_CX+dx*ext*t,py2=BOS_CY+dy*ext*t;
        const wave=Math.sin(t*5+tick*.07+i)*3.5*ext;
        $.lineTo(px2+perp.x*wave,py2+perp.y*wave);}$.stroke();$.lineWidth=1;
      // Joints (suction cups)
      for(let s=1;s<=stg;s++){
        const jt=s/6;const jx=BOS_CX+dx*jt,jy=BOS_CY+dy*jt;
        const jwave=Math.sin(jt*5+tick*.07+i)*3.5*ext;
        $.fillStyle=ON;circle(jx+perp.x*jwave,jy+perp.y*jwave,3);
        $.fillStyle=BG;circle(jx+perp.x*jwave,jy+perp.y*jwave,1.5);}
      // Claw at tip
      const tipWave=Math.sin(1*5+tick*.07+i)*3.5*ext;
      const tipX=endX+perp.x*tipWave,tipY=endY+perp.y*tipWave;
      $.fillStyle=ON;circle(tipX,tipY,5+ext*2);
      $.lineWidth=2;$.strokeStyle=ON;
      const cl=7+ext*4;
      $.beginPath();$.moveTo(tipX,tipY);$.lineTo(tipX+Math.cos(ang-.4)*cl,tipY+Math.sin(ang-.4)*cl);$.stroke();
      $.beginPath();$.moveTo(tipX,tipY);$.lineTo(tipX+Math.cos(ang+.4)*cl,tipY+Math.sin(ang+.4)*cl);$.stroke();
      $.beginPath();$.moveTo(tipX,tipY);$.lineTo(tipX+Math.cos(ang)*cl,tipY+Math.sin(ang)*cl);$.stroke();
      $.lineWidth=1;
      // Full extension danger pulse
      if(stg>=6){onFill(.1+Math.sin(tick*.3)*.05);
        circle(pp.x,pp.y,20);$.globalAlpha=1;}
      // Stage 5 approaching
      if(stg===5&&B.armDir[i]===1){$.strokeStyle=ON;$.lineWidth=2;
        $.globalAlpha=.2+Math.sin(tick*.4)*.1;
        circleS(pp.x,pp.y,16);$.lineWidth=1;$.globalAlpha=1;}
      $.globalAlpha=1;}
  }

  // Arm steal trail
  bosArmTrail=bosArmTrail.filter(t=>{t.life--;if(t.life<=0)return false;
    const pp=PED_POS[t.idx];
    $.strokeStyle=ON;$.lineWidth=3;$.globalAlpha=t.life/8*.2;
    $.beginPath();$.moveTo(BOS_CX,BOS_CY);$.lineTo(pp.x,pp.y);$.stroke();
    $.lineWidth=1;$.globalAlpha=1;return true;});

  // === BOSS FACE ===
  const breathOff=Math.sin(B.bossBreath)*1.5;
  const angerSh=B.bossAnger>=4?Math.sin(tick*.35)*B.bossAnger*.25:0;
  const bfx=BOS_CX+angerSh,bfy=BOS_CY+breathOff;
  // Eye direction tracks player
  const pp2=playerXY(B.pos);const edx=pp2.x-bfx,edy=pp2.y-bfy;
  const ed=Math.sqrt(edx*edx+edy*edy)||1;const enx=edx/ed*2.5,eny=edy/ed*2;
  iBoss(bfx,bfy,true);
  // Eye pupils track player (3 eye slots)
  $.fillStyle=ON;
  $.fillRect(bfx-9+enx,bfy-6+eny,2,2);
  $.fillRect(bfx-2+enx,bfy-6+eny,2,2);
  $.fillRect(bfx+5+enx,bfy-6+eny,2,2);
  // Pulse ring
  if(B.bossPulse>0){$.strokeStyle=ON;$.lineWidth=2;$.globalAlpha=B.bossPulse/5*.25;
    circleS(bfx,bfy,28+(5-B.bossPulse)*4);
    $.lineWidth=1;$.globalAlpha=1;}
  // Anger aura (pulsing rings)
  if(B.bossAnger>=3){const nRings=Math.min(3,B.bossAnger-2);
    for(let r=0;r<nRings;r++){
      onStroke(.04+Math.sin(tick*.1+r*.7)*.02);
      const ar=30+B.bossAnger*2+r*8+Math.sin(tick*.08+r)*2;
      circleS(bfx,bfy,ar);}$.globalAlpha=1;}
  // Eye glow (intensifies with active arms)
  const nrHot=B.armStage.filter(s=>s>=4).length;
  if(nrHot>0){onFill(.03*nrHot+Math.sin(tick*.2)*.01);
    circle(bfx,bfy,26+nrHot*2);$.globalAlpha=1;}
  // Heartbeat throb (when angry)
  if(B.bossAnger>=4&&tick%Math.max(8,20-B.bossAnger*2)<2){
    onStroke(.08);
    circleS(bfx,bfy,28);$.globalAlpha=1;}

  // === PEDESTALS & GEMS ===
  for(let i=0;i<6;i++){
    const pp=PED_POS[i];
    // Pedestal base
    onFill(.18);
    $.fillRect(pp.x-8,pp.y+8,16,6);
    $.globalAlpha=.1;$.fillRect(pp.x-6,pp.y+5,12,4);$.globalAlpha=1;
    // Pedestal number
    $.globalAlpha=.15;txt(String(i+1),pp.x-3,pp.y+16,5);$.globalAlpha=1;

    // Gem
    if(B.peds[i]>=1){
      let gy=pp.y-12;
      if(B.placeAnim[0]===i&&B.placeAnim[1]>0)gy-=B.placeAnim[1]*2;
      iGem(pp.x-8,gy,true);
      // Gem glow
      onFill(.05+Math.sin(tick*.1+i)*.02);
      circle(pp.x,gy+9,10);$.globalAlpha=1;
      // Sparkle
      if(tick%14<2){onFill(.3);
        $.fillRect(pp.x-3+Math.sin(tick*.4+i)*5,gy-2,2,2);$.globalAlpha=1;}
    }else{iGem(pp.x-8,pp.y-12,false);}

    // Shield dome
    if(B.peds[i]===2){
      $.strokeStyle=ON;$.lineWidth=2;$.globalAlpha=.4+Math.sin(tick*.1+i)*.08;
      $.beginPath();$.arc(pp.x,pp.y-4,14,Math.PI,0);$.stroke();
      $.globalAlpha=.05;$.beginPath();$.arc(pp.x,pp.y-4,14,Math.PI,0);$.fill();
      $.globalAlpha=1;$.lineWidth=1;}

    // Danger meter (small arc around pedestal base)
    const stg=B.armStage[i];
    if(stg>0||B.armWarn[i]>0){
      const arcEnd=-Math.PI/2+TAU*(stg/6);
      $.strokeStyle=ON;$.lineWidth=2;
      $.globalAlpha=stg>=5?.35:stg>=3?.2:.1;
      $.beginPath();$.arc(pp.x,pp.y,14,-Math.PI/2,arcEnd);$.stroke();
      $.lineWidth=1;$.globalAlpha=1;
      // Warn blink
      if(B.armWarn[i]>0&&Math.floor(B.armWarn[i]/4)%2){
        $.strokeStyle=ON;$.lineWidth=2;$.globalAlpha=.2;
        circleS(pp.x,pp.y,14);$.lineWidth=1;$.globalAlpha=1;}}

    // Steal flash
    if(B.stealAnim[0]===i&&B.stealAnim[1]>0){
      $.globalAlpha=B.stealAnim[1]/10;txtC('LOST!',pp.x,pp.y-26,7);
      onFill(B.stealAnim[1]/10*.12);
      circle(pp.x,pp.y,18);$.globalAlpha=1;}
  }

  // Shield break effects
  bosShieldBreak=bosShieldBreak.filter(sb=>{sb.life--;if(sb.life<=0)return false;
    const pp=PED_POS[sb.idx];const r=12+(10-sb.life)*2.5;
    $.strokeStyle=ON;$.lineWidth=2;$.globalAlpha=sb.life/10*.3;
    circleS(pp.x,pp.y,r);
    for(let f=0;f<3;f++){const a=f*TAU/3+(10-sb.life)*.15;
      $.fillStyle=ON;$.fillRect(pp.x+Math.cos(a)*r-1,pp.y+Math.sin(a)*r-1,3,2);}
    $.globalAlpha=1;$.lineWidth=1;return true;});

  // === SAFE ZONE ===
  // Alcove with breathing glow
  const safeGlow=B.pos===0?.08:.04;
  onFill(safeGlow+Math.sin(tick*.08)*.01);$.fillRect(SAFE_X-22,SAFE_Y-24,44,52);$.globalAlpha=1;
  onStroke(.18);$.strokeRect(SAFE_X-22,SAFE_Y-24,44,52);$.globalAlpha=1;
  // Corner ornaments
  onFill(.12);
  $.fillRect(SAFE_X-22,SAFE_Y-24,4,4);$.fillRect(SAFE_X+18,SAFE_Y-24,4,4);
  $.fillRect(SAFE_X-22,SAFE_Y+24,4,4);$.fillRect(SAFE_X+18,SAFE_Y+24,4,4);$.globalAlpha=1;
  // Label
  $.globalAlpha=B.pos===0?.4:.25;txt('SAFE',SAFE_X-12,SAFE_Y-20,5);$.globalAlpha=1;
  // Gem chest (detailed)
  onFill(.35);$.fillRect(SAFE_X-9,SAFE_Y+8,18,11);
  $.globalAlpha=.2;$.fillRect(SAFE_X-7,SAFE_Y+6,14,3);// lid
  $.fillRect(SAFE_X-10,SAFE_Y+18,20,2);// base
  $.fillStyle=BG;$.globalAlpha=.3;$.fillRect(SAFE_X-1,SAFE_Y+12,3,3);// lock
  $.globalAlpha=1;
  // Gem in chest (when not held)
  if(!B.hasGem&&B.pos!==0){$.globalAlpha=.55;iGem(SAFE_X-8,SAFE_Y-10,true);$.globalAlpha=1;
    // Gem beckons
    onFill(.04+Math.sin(tick*.1)*.02);
    circle(SAFE_X,SAFE_Y-2,16);$.globalAlpha=1;
    // Sparkle
    if(tick%18<2){onFill(.2);
      $.fillRect(SAFE_X-4+Math.random()*8,SAFE_Y-12+Math.random()*6,2,2);$.globalAlpha=1;}}

  // === ACTIVE PLAYER (with walk interpolation) ===
  const destP=playerXY(B.pos);
  let plx=destP.x,ply=destP.y;
  if(B.walkT>0){
    const t=B.walkT/6;// 1→0
    const fromP=playerXY(B.prevPos);
    plx=fromP.x+(destP.x-fromP.x)*(1-t);
    ply=fromP.y+(destP.y-fromP.y)*(1-t);}
  // Hurt blink
  if(!(B.hurtCD>0&&Math.floor(tick/3)%2)){
    const br=Math.sin(B.bossBreath)*.4;
    // Walk vs stand sprite
    if(B.walkT>0&&Math.floor(B.walkT/2)%2)px(K_RW,plx-10,ply-12+br,2,true);
    else px(K_F,plx-10,ply-12+br,2,true);
    // Gem held
    if(B.hasGem){iGem(plx-8,ply-28,true);
      if(tick%8<2){onFill(.25);
        $.fillRect(plx-3+Math.random()*6,ply-30+Math.random()*5,2,2);$.globalAlpha=1;}}}
  // Position highlight
  onStroke(.15+Math.sin(tick*.1)*.05);
  circleS(plx,ply+2,18);$.globalAlpha=1;
  // Landing dust
  if(B.walkT===4){onFill(.12);
    $.fillRect(plx-5,ply+16,3,2);$.fillRect(plx+2,ply+16,3,2);$.globalAlpha=1;}

  // === HUD ===
  const placed=B.peds.filter(p=>p>0).length;
  txt('GEM',14,34,5);
  for(let i=0;i<6;i++){
    const gx=48+i*18,gy=30;
    if(i<placed){$.fillStyle=ON;$.beginPath();$.moveTo(gx+5,gy);$.lineTo(gx+10,gy+5);
      $.lineTo(gx+5,gy+10);$.lineTo(gx,gy+5);$.fill();
    }else{onStroke(.18);$.beginPath();
      $.moveTo(gx+5,gy);$.lineTo(gx+10,gy+5);$.lineTo(gx+5,gy+10);$.lineTo(gx,gy+5);$.closePath();$.stroke();$.globalAlpha=1;}
    if(i===placed-1&&B.placeAnim[1]>0){onFill(B.placeAnim[1]/8*.3);
      circle(gx+5,gy+5,8);$.globalAlpha=1;}}
  // Shields
  txt('SHLD',286,34,5);
  for(let i=0;i<B.shields;i++){
    onStroke(.5);
    circleS(330+i*14,38,5);
    onFill(.08);circle(330+i*14,38,5);$.globalAlpha=1;}
  // Active arms count
  const activeN=B.armStage.filter(s=>s>0).length;
  if(activeN>0){$.globalAlpha=.3;txt('ARMS:'+activeN,175,34,5);$.globalAlpha=1;}

  // Action hints
  if(B.pos>=1&&B.pos<=6){const pi=B.pos-1;const pp=PED_POS[pi];
    if(B.hasGem&&B.peds[pi]===0){$.globalAlpha=.45+Math.sin(tick*.12)*.12;
      txt('Z:SET',pp.x-14,pp.y+24,5);$.globalAlpha=1;}
    else if(B.peds[pi]===1&&B.shields>0){$.globalAlpha=.45+Math.sin(tick*.12)*.12;
      txt('↑:SHLD',pp.x-16,pp.y+24,5);$.globalAlpha=1;}
    // Counter hint when arm is approaching
    if(B.armStage[pi]>=3&&!B.armResting[pi]&&B.counterCD<=0){
      $.globalAlpha=.5+Math.sin(tick*.25)*.2;
      txt('↓:CTR',pp.x-14,pp.y+34,5);$.globalAlpha=1;}}
  if(B.pos===0){
    if(B.hasGem){$.globalAlpha=.35;txt('← →',SAFE_X-10,SAFE_Y-32,5);$.globalAlpha=1;}
    else{$.globalAlpha=.25+Math.sin(tick*.1)*.08;txt('GEM!',SAFE_X-10,SAFE_Y-32,5);$.globalAlpha=1;}}

  // Counter flash effect (radial burst at deflected pedestal)
  if(B.counterFlash[1]>0&&B.counterFlash[0]>=0){
    const cfp=PED_POS[B.counterFlash[0]];const cfa=B.counterFlash[1]/8;
    $.strokeStyle=ON;$.lineWidth=3;$.globalAlpha=cfa*.4;
    circleS(cfp.x,cfp.y,8+(8-B.counterFlash[1])*4);
    // Radial lines
    for(let r=0;r<6;r++){const a=r*Math.PI/3+tick*.1;const rl=10+(8-B.counterFlash[1])*3;
      $.beginPath();$.moveTo(cfp.x+Math.cos(a)*6,cfp.y+Math.sin(a)*6);
      $.lineTo(cfp.x+Math.cos(a)*rl,cfp.y+Math.sin(a)*rl);$.stroke();}
    $.lineWidth=1;$.globalAlpha=1;}

  // Counter CD indicator (small bar under player)
  if(B.counterCD>0){const maxCD=twoBeatDuration();const cdPct=B.counterCD/maxCD;
    const pxy=playerXY(B.pos);
    $.fillStyle=GH;$.fillRect(pxy.x-12,pxy.y+20,24,3);
    $.fillStyle=ON;$.fillRect(pxy.x-12,pxy.y+20,Math.floor(24*(1-cdPct)),3);}

  // Rage wave flash (screen edge pulses red-ish / dark)
  if(B.rageWave>0||B.quake>0){const ra=Math.max(B.rageWave,B.quake)/6;
    onFill(ra*.06);$.fillRect(0,0,W,H);$.globalAlpha=1;}

  // Particles
  Particles.updateAndDraw(bosParticles);
  // Popups
  Popups.updateAndDraw();

  // === WIN CELEBRATION ===
  if(B.won){const wt=B.wonT;
    // Initial flash
    if(wt<4){$.fillStyle=BG;$.globalAlpha=(4-wt)/4*.4;$.fillRect(0,0,W,H);$.globalAlpha=1;}
    // Boss shakes + arms retract
    if(wt<40){const sh=(40-wt)*.6*Math.sin(tick*1.2);
      iBoss(BOS_CX+sh,BOS_CY,true);
      for(let i=0;i<6;i++){const pp=PED_POS[i];const ext=Math.max(0,1-wt/25);
        if(ext>.05){$.strokeStyle=ON;$.lineWidth=3;$.globalAlpha=ext*.35;
          $.beginPath();$.moveTo(BOS_CX,BOS_CY);
          $.lineTo(BOS_CX+(pp.x-BOS_CX)*ext,BOS_CY+(pp.y-BOS_CY)*ext);$.stroke();
          $.globalAlpha=1;$.lineWidth=1;}}
      // Dissolve particles burst from boss
      if(wt>15&&wt%2===0){onFill(.3);
        for(let i=0;i<6;i++){const a=Math.random()*TAU,r=Math.random()*30+10;
          $.fillRect(BOS_CX+Math.cos(a)*r-1,BOS_CY+Math.sin(a)*r-1,3,3);}
        $.globalAlpha=1;}}
    // Gems pulse on pedestals
    if(wt<70){for(let i=0;i<6;i++){const pp=PED_POS[i];
      onFill(Math.max(0,.22*Math.sin(tick*.25+i)-.012*(wt-20)));
      circle(pp.x,pp.y,8+Math.sin(tick*.25+i)*3);}$.globalAlpha=1;}
    // Overlay
    const oa=Math.min(.92,Math.max(0,(wt-15)/25*.92));
    $.fillStyle=`rgba(176,188,152,${oa})`;$.fillRect(0,0,W,H);
    if(wt>35){$.globalAlpha=Math.min(1,(wt-35)/18);txtC('DEFEATED!',W/2,56,18);
      $.globalAlpha*=.06;txtC('DEFEATED!',W/2+1,57,18);$.globalAlpha=1;}
    if(wt>55){$.globalAlpha=Math.min(1,(wt-55)/14);
      const lw=Math.min(130,(wt-55)*2.5);$.fillStyle=ON;$.globalAlpha*=.3;
      $.fillRect(W/2-lw/2,78,lw,1);$.fillRect(W/2-lw/2-2,77,2,3);$.fillRect(W/2+lw/2,77,2,3);
      $.globalAlpha=Math.min(1,(wt-55)/14);
      txtC('— CASTLE —',W/2,90,8);$.globalAlpha=1;}
    // 6 gems line up with sparkle
    if(wt>70){for(let i=0;i<6;i++){
        const delay=i*4;const ga=Math.min(1,Math.max(0,(wt-70-delay)/10));
        $.globalAlpha=ga;const bounce=ga<1?12*(1-ga):Math.sin(tick*.12+i)*.5;
        iGem(W/2-55+i*20,124-bounce,true);
        // Gem sparkle
        if(ga>=1&&tick%(10+i*2)<2){$.globalAlpha=.25;
          $.fillRect(W/2-50+i*20+Math.random()*8,120+Math.random()*8,2,2);}}$.globalAlpha=1;}
    if(wt>90){$.globalAlpha=Math.min(1,(wt-90)/14);
      txtC('BONUS +'+5000*loop,W/2,168,8);$.globalAlpha=1;}
    if(wt>105&&noDmg){$.globalAlpha=Math.min(1,(wt-105)/12);
      txtC('NO DAMAGE +'+10000*loop+'!',W/2,188,7);$.globalAlpha=1;}
    // Story tease
    if(wt>115){$.globalAlpha=Math.min(1,(wt-115)/22);
      if(Difficulty.isTrueEnding(loop))txtC('...The final seal shatters...',W/2,228,7);
      else if(loop===1)txtC('...But this is not the end...',W/2,228,7);
      else txtC('...The curse grows stronger...',W/2,228,7);
      $.globalAlpha=1;}
    if(wt>130&&loop<3){$.globalAlpha=Math.min(1,(wt-130)/18);
      txtC('LOOP '+(loop+1)+' APPROACHES',W/2,260,6);$.globalAlpha=1;}
    // Continuous sparkles (scattered)
    if(wt>20){$.fillStyle=ON;
      for(let sp=0;sp<2;sp++){const sx=40+(tick*17+sp*127)%360,sy=50+(tick*11+sp*89+wt*5)%200;
        $.globalAlpha=.15+Math.sin(tick*.12+sp)*.08;$.fillRect(sx,sy,2,2);}$.globalAlpha=1;}}
}
/* ================================================================
   UI SCREENS — Title, Game Over, Endings
   ================================================================ */
let blink=0,cheatBuf='';
function drawTitle(){blink++;
  // Background stars
  $.fillStyle=ON;
  for(let i=0;i<8;i++){const sx=(blink*(.3+i*.1)+i*57)%W,sy=(i*41+blink*.05)%H;
    $.globalAlpha=.04+Math.sin(blink*.05+i)*.025;$.fillRect(sx,sy,2,2);}$.globalAlpha=1;
  // Title with subtle bounce
  const tbounce=Math.sin(blink*.03)*2;
  txtC('KEYS',W/2,14+tbounce*.3,28);txtC('&',W/2,46,14);txtC('ARMS',W/2,62-tbounce*.3,28);
  // Title shadow
  $.globalAlpha=.06;txtC('KEYS',W/2+1,15+tbounce*.3,28);txtC('ARMS',W/2+1,63-tbounce*.3,28);$.globalAlpha=1;
  // Decorative line with end ornaments
  onFill(.15);const tlw=100+Math.sin(blink*.02)*10;
  $.fillRect(W/2-tlw/2,90,tlw,1);
  $.fillRect(W/2-tlw/2-2,89,2,3);$.fillRect(W/2+tlw/2,89,2,3);// end dots
  $.globalAlpha=1;
  // Character parade with shadow
  $.globalAlpha=.06;px(K_R,51,113,3,true);$.globalAlpha=1;
  px(K_R,50,112,3,true);
  px(BAT_FU,110,116,3,blink%16<8);px(BAT_FD,110,116,3,blink%16>=8);
  px(MIM_O,164,114,3,true);px(SPIDER,226,120,3,true);iSlime(274,126,true);
  // Boss breathes with aura
  const bby=134+Math.sin(blink*.05);
  onFill(.03+Math.sin(blink*.04)*.015);
  circle(356,bby,30);$.globalAlpha=1;
  iBoss(356,bby,true);
  // Keys + Gems with gentle float
  const ky=170+Math.sin(blink*.04)*1.5;
  px(KEY_D,W/2-55,ky,3,true);px(KEY_D,W/2-25,ky+Math.sin(blink*.04+1)*1,3,true);
  iGem(W/2+6,ky-2+Math.sin(blink*.04+2)*1,true);iGem(W/2+30,ky+Math.sin(blink*.04+3)*1.5,true);
  // Sparkle on items
  if(blink%16<2){onFill(.3);
    $.fillRect(W/2-50+Math.random()*100,ky+Math.random()*20,2,2);$.globalAlpha=1;}
  // Start prompt with grow
  if(Math.floor(blink/18)%2===0){const ps=8+Math.sin(blink*.08)*.3;txtC('PRESS Z TO START',W/2,210,ps);}
  // Info (stage progression)
  $.globalAlpha=.7;txtC('CAVE → PRAIRIE → CASTLE',W/2,236,6);
  txtC('CLEAR 3 LOOPS!',W/2,250,6);$.globalAlpha=1;
  $.globalAlpha=.5;
  txt('CAVE:  ←→↑↓ HOLD/MASH Z',80,268,5);
  txt('FIELD: ↑→↓ ATK  ← GRD',80,280,5);
  txt('CASTLE: ←→ Z ↑:SHLD ↓:CTR',80,292,5);
  $.globalAlpha=.3;
  txt('ESC/RST: RETURN TO TITLE',80,306,5);$.globalAlpha=1;
  if(hi>0){$.globalAlpha=.8;txtC('HI '+String(hi).padStart(7,'0'),W/2,312,7);$.globalAlpha=1;}
  if(cheatBuf.endsWith('jin')){$.globalAlpha=.4;txtC('— GOD MODE —',W/2,326,5);$.globalAlpha=1;}
}
function startGame(){
  const cheat=cheatBuf.endsWith('jin');cheatBuf='';
  loop=1;score=0;dispScore=0;hp=cheat?20:3;maxHp=cheat?20:3;noDmg=true;hurtFlash=0;bgmBeat=0;cavInit();}
function drawOver(){blink++;
  // Background cracks radiating from center
  if(blink>3){$.strokeStyle=ON;$.lineWidth=1;
    for(let i=0;i<5;i++){const a=-Math.PI/2+i*TAU/5+.3;
      const len=Math.min(80,(blink-3)*2);
      $.globalAlpha=.03+Math.sin(blink*.06+i)*.01;
      $.beginPath();$.moveTo(W/2,120);
      $.lineTo(W/2+Math.cos(a)*len,120+Math.sin(a)*len);$.stroke();}$.globalAlpha=1;}
  // Fallen knight with shadow
  if(blink>10){$.globalAlpha=Math.min(1,(blink-10)/20);
    $.fillStyle=ON;$.globalAlpha*=.08;$.beginPath();$.ellipse(W/2,195,14,4,0,0,TAU);$.fill();// shadow
    $.globalAlpha=Math.min(1,(blink-10)/20);px(K_HU,W/2-10,178,2,true);$.globalAlpha=1;}
  // Title with emphasis
  if(blink>5){const a=Math.min(1,(blink-5)/15);$.globalAlpha=a;
    txtC('GAME OVER',W/2,36,20);
    // Title shadow
    $.globalAlpha=a*.08;txtC('GAME OVER',W/2+1,37,20);$.globalAlpha=1;}
  // Line
  if(blink>15){$.globalAlpha=Math.min(.3,(blink-15)/20*.3);$.fillStyle=ON;
    const lw=Math.min(140,(blink-15)*3);$.fillRect(W/2-lw/2,64,lw,1);
    $.fillRect(W/2-lw/2-2,63,2,3);$.fillRect(W/2+lw/2,63,2,3);// end dots
    $.globalAlpha=1;}
  // Score (large)
  if(blink>20){$.globalAlpha=Math.min(1,(blink-20)/15);
    txtC(String(score).padStart(7,'0'),W/2,80,16);$.globalAlpha=1;}
  if(blink>30){$.globalAlpha=Math.min(1,(blink-30)/12);
    txtC('LOOP '+loop,W/2,112,9);$.globalAlpha=1;}
  if(blink>38&&score>=hi&&score>0){$.globalAlpha=Math.min(1,(blink-38)/10);
    // Flash effect for new high score
    if(Math.floor(blink/6)%2){txtC('★ NEW HIGH SCORE! ★',W/2,136,7);}
    else{txtC('NEW HIGH SCORE!',W/2,136,7);}
    $.globalAlpha=1;}
  if(blink>45){$.globalAlpha=Math.min(1,(blink-45)/12);
    txtC('HI '+String(hi).padStart(7,'0'),W/2,158,7);$.globalAlpha=1;}
  // Retry prompt
  if(blink>70){const ra=.6+Math.sin(blink*.08)*.3;$.globalAlpha=Math.floor(blink/18)%2===0?ra:0;
    txtC('PRESS Z TO RETRY',W/2,260,7);$.globalAlpha=1;}
  if(blink>70&&(jAct()||J('enter'))){ea();startGame();}}
let teT=0,e1T=0;

/* === MID-ENDING (after loop 1 boss clear) === */
function drawEnding1(){e1T++;
  $.fillStyle=BG;$.fillRect(0,0,W,H);$.fillStyle='rgba(145,158,125,0.1)';for(let y=0;y<H;y+=2)$.fillRect(0,y,W,1);
  // Slow scroll offset
  const scroll=Math.max(0,(e1T-180)*.4);
  $.save();$.translate(0,-scroll);

  // Stars
  $.fillStyle=ON;
  for(let i=0;i<15;i++){const sx=(i*59+e1T*.15)%W,sy=(i*37+Math.sin(e1T*.025+i)*8)%90+8;
    $.globalAlpha=.15+Math.sin(e1T*.04+i*2)*.1;
    if(e1T%(8+i%4)<2)$.fillRect(sx,sy+scroll*.5,2,2);}$.globalAlpha=1;

  const line=(start,text,y,sz)=>{if(e1T>start){
    $.globalAlpha=Math.min(1,(e1T-start)/30);txtC(text,W/2,y,sz||6);$.globalAlpha=1;}};

  // Scene 1: Castle silhouette + knight walks out
  if(e1T>5){$.globalAlpha=Math.min(1,(e1T-5)/20);
    // Ground
    $.fillStyle=ON;$.globalAlpha*=.12;$.fillRect(20,168,W-40,2);$.globalAlpha=Math.min(1,(e1T-5)/20);
    // Castle silhouette (left)
    $.fillStyle=ON;$.globalAlpha*=.15;
    $.fillRect(30,110,40,58);$.fillRect(24,100,12,68);$.fillRect(50,105,10,63);
    $.fillRect(34,95,8,5);$.fillRect(52,98,6,4); // turrets
    // Gate
    $.fillStyle=BG;$.fillRect(40,148,20,20);$.globalAlpha=1;}
  // Knight walks out of castle
  if(e1T>30){const kx=Math.min(240,60+(e1T-30)*.9);const walking=e1T<240;
    $.globalAlpha=Math.min(1,(e1T-30)/15);
    if(walking&&Math.floor(e1T/4)%2)px(K_R,kx,148,2,true);
    else px(K_R,kx,148,2,true);
    // Footstep dust
    if(walking&&e1T%8===0){onFill(.1);
      $.fillRect(kx-5,165,3,2);$.globalAlpha=1;}
    $.globalAlpha=1;}

  line(15,'The knight emerges',W/2+60,7);
  line(40,'from the cursed castle.',W/2+60,6);
  line(90,'The demon lord has fallen.',W/2,208,7);
  line(120,'The six seals are restored.',W/2,228,6);

  // Scene 2: But...
  line(170,'...But a dark whisper',W/2,268,7);
  line(195,'echoes through the land.',W/2,288,6);

  // Dark pulse effect
  if(e1T>200&&e1T<260){const dp=(e1T-200)/60;
    onFill(.04*Math.sin(dp*Math.PI));
    $.fillRect(0,260,W,60);$.globalAlpha=1;}

  line(230,'"The seal weakens',W/2,328,6);
  line(250,'with each passing dawn..."',W/2,348,6);
  line(280,'"Stronger foes will return..."',W/2,388,7);

  // Knight turns to look back
  if(e1T>290){$.globalAlpha=Math.min(1,(e1T-290)/15);
    px(K_R,W/2-10,408,2,true,true);// facing left (flipped)
    // Sword raised
    $.fillStyle=ON;$.fillRect(W/2-14,396,2,10);
    $.globalAlpha=1;}

  // Score section
  if(e1T>340){$.globalAlpha=Math.min(1,(e1T-340)/20);
    // Decorative line
    $.fillStyle=ON;$.globalAlpha*=.3;$.fillRect(W/2-60,445,120,1);
    $.globalAlpha=Math.min(1,(e1T-340)/20);
    txtC('LOOP 1 COMPLETE',W/2,462,12);$.globalAlpha=1;}
  if(e1T>365){$.globalAlpha=Math.min(1,(e1T-365)/15);
    txtC(String(score).padStart(7,'0'),W/2,488,14);$.globalAlpha=1;}
  if(e1T>385&&noDmg){$.globalAlpha=Math.min(.8,(e1T-385)/15);
    txtC('NO DAMAGE CLEAR',W/2,512,8);$.globalAlpha=1;}

  $.restore();
  // Fixed overlay at bottom for prompt (not scrolled)
  if(e1T>420){
    $.fillStyle=BG;$.globalAlpha=.7;$.fillRect(0,H-30,W,30);$.globalAlpha=1;
    if(Math.floor(e1T/22)%2)txtC('PRESS Z TO CONTINUE',W/2,H-14,7);
    if(jAct()){ea();e1T=0;loop=2;noDmg=true;if(hp<maxHp)hp++;transTo('LOOP 2',cavInit);}}}

/* === TRUE ENDING (after loop 5 boss clear) === */
function drawTrueEnd(){teT++;
  $.fillStyle=BG;$.fillRect(0,0,W,H);$.fillStyle='rgba(145,158,125,0.1)';for(let y=0;y<H;y+=2)$.fillRect(0,y,W,1);
  // Slow scroll
  const scroll=Math.max(0,(teT-200)*.35);
  $.save();$.translate(0,-scroll);

  // Stars (more numerous, fixed to sky, parallax)
  $.fillStyle=ON;
  for(let i=0;i<25;i++){const sx=(i*47+teT*.1)%W,sy=(i*31+Math.sin(teT*.02+i)*6)%100+5+scroll*.3;
    $.globalAlpha=.12+Math.sin(teT*.04+i*3)*.08;
    $.fillRect(sx,sy,teT%(9+i%5)<2?3:2,teT%(9+i%5)<2?3:2);}$.globalAlpha=1;

  const line=(start,text,y,sz)=>{if(teT>start){
    $.globalAlpha=Math.min(1,(teT-start)/30);txtC(text,W/2,y,sz||6);$.globalAlpha=1;}};

  // ===== ACT 1: BOSS DISSOLVE =====
  line(8,'After three arduous journeys...',40,8);
  line(50,'the knight has shattered',62,6);
  line(65,'every curse upon the land.',78,6);

  // Boss dissolve scene
  if(teT>90){const da=Math.min(1,(teT-90)/50);
    // Boss fading + shaking
    const bsh=da<.8?(1-da)*Math.sin(teT*.8)*3:0;
    $.globalAlpha=Math.max(0,1-da*1.2);
    iBoss(W/2+bsh,118,true);$.globalAlpha=1;
    // Dissolve particles float up
    if(da<1&&teT%2===0){onFill(.25);
      for(let i=0;i<3;i++){const px2=W/2-22+Math.random()*44,py2=100+Math.random()*36;
        $.fillRect(px2,py2-da*30,2,2);}$.globalAlpha=1;}
    // Knight appears as boss fades
    if(da>.4){$.globalAlpha=Math.min(1,(da-.4)*2.5);
      px(K_R,W/2-10,128,2,true);
      // Sword glint
      if(teT%6<2){$.fillStyle=ON;$.globalAlpha*=.4;
        $.fillRect(W/2+12,120,2,2);$.globalAlpha=Math.min(1,(da-.4)*2.5);}
      $.globalAlpha=1;}}

  // ===== ACT 2: SUNRISE =====
  if(teT>170){const sa=Math.min(1,(teT-170)/80);
    // Sun arc rising
    onFill(sa*.07);
    $.beginPath();$.arc(W/2,175,30+sa*40,Math.PI,0);$.fill();
    // Sun rays (radial)
    for(let r=0;r<7;r++){const ra=-Math.PI+r*Math.PI/6;const rl=sa*25;
      $.fillRect(W/2+Math.cos(ra)*(45+sa*25)-1,175+Math.sin(ra)*(45+sa*25)-1,2,rl);}
    // Warm overlay
    $.globalAlpha=sa*.03;$.fillRect(0,150,W,60);
    $.globalAlpha=1;}

  line(195,'The sun rises on a world reborn.',185,8);

  // ===== ACT 3: PEACE =====
  line(240,'The caves are silent.',225,6);
  // Mini cave scene
  if(teT>250){$.globalAlpha=Math.min(.12,(teT-250)/40*.12);
    $.fillStyle=ON;$.fillRect(W/2-50,240,100,25);$.fillStyle=BG;$.fillRect(W/2-45,243,90,18);
    px(KEY_D,W/2-8,248,1,true);$.globalAlpha=1;}

  line(280,'The prairie is at peace.',275,6);
  // Mini prairie scene
  if(teT>290){$.globalAlpha=Math.min(.12,(teT-290)/40*.12);
    $.fillStyle=ON;$.fillRect(W/2-60,290,120,1);
    for(let i=0;i<5;i++){const gx=W/2-40+i*20;
      $.fillRect(gx,286-Math.random()*3,1,4+Math.random()*2);}$.globalAlpha=1;}

  line(320,'The castle crumbles to dust.',325,6);
  // Mini castle crumble
  if(teT>330){$.globalAlpha=Math.min(.12,(teT-330)/40*.12);
    const crumble=Math.min(1,(teT-330)/60);
    $.fillStyle=ON;
    $.fillRect(W/2-20,335,40*(1-crumble*.3),20*(1-crumble*.5));
    // Falling particles
    for(let i=0;i<3;i++){const fx=W/2-15+i*15,fy=340+crumble*i*8;
      $.fillRect(fx,fy,3,2);}$.globalAlpha=1;}

  // ===== ACT 4: CHARACTER PARADE =====
  if(teT>370){const pa=Math.min(1,(teT-370)/25);$.globalAlpha=pa;
    const cy=388;
    // Characters walk in from sides
    const spread=80*(1-pa);
    px(K_R,W/2-80-spread,cy,2,true);
    px(KEY_D,W/2-50-spread*.5,cy+4,2,true);
    iSlime(W/2-20,cy+6,true);
    iGoblin(W/2+6,cy+4,true);
    iSkel(W/2+32+spread*.5,cy+4,true);
    iGem(W/2+58+spread*.5,cy+4,true);
    iBoss(W/2+84+spread,cy+8,true);
    $.globalAlpha=1;}
  // Line under characters
  if(teT>400){$.globalAlpha=Math.min(.2,(teT-400)/20*.2);$.fillStyle=ON;
    $.fillRect(W/2-100,414,200,1);$.globalAlpha=1;}

  // ===== ACT 5: CONGRATULATIONS =====
  if(teT>420){$.globalAlpha=Math.min(1,(teT-420)/25);
    txtC('CONGRATULATIONS',W/2,440,14);$.globalAlpha=1;}

  // Score
  if(teT>460){$.globalAlpha=Math.min(1,(teT-460)/20);
    txtC(String(score).padStart(7,'0'),W/2,472,18);$.globalAlpha=1;}

  // Rank
  if(teT>490){$.globalAlpha=Math.min(1,(teT-490)/20);
    let rk='C';if(score>80000)rk='B';if(score>150000)rk='A';if(score>250000)rk='S';if(score>400000)rk='SS';
    const rsz=rk==='SS'?22:(rk==='S'?20:16);
    txtC('RANK',W/2,500,8);
    txtC(rk,W/2,522,rsz);
    // Big rank sparkle for S/SS
    if(rk==='SS'||rk==='S'){
      for(let i=0;i<3;i++){const sa2=teT*.1+i*2.1;onFill(.3+Math.sin(sa2)*.15);
        $.fillRect(W/2+Math.cos(sa2)*25-1,518+Math.sin(sa2+1)*10-1,3,3);}
      $.globalAlpha=Math.min(1,(teT-490)/20);}
    $.globalAlpha=1;}

  // No Damage / loops
  if(teT>530){$.globalAlpha=Math.min(1,(teT-530)/15);
    if(noDmg){txtC('PERFECT',W/2,555,10);txtC('NO DAMAGE',W/2,572,8);}
    else txtC('3 LOOPS CLEARED!',W/2,560,10);
    $.globalAlpha=1;}

  // Credits
  if(teT>570){$.globalAlpha=Math.min(1,(teT-570)/20);
    $.fillStyle=ON;$.globalAlpha*=.2;$.fillRect(W/2-50,592,100,1);
    $.globalAlpha=Math.min(1,(teT-570)/20);
    txtC('KEYS & ARMS',W/2,608,7);
    txtC('A GAME & WATCH TRIBUTE',W/2,622,5);$.globalAlpha=1;}

  // Thank you
  if(teT>610){$.globalAlpha=Math.min(1,(teT-610)/25);
    txtC('THANK YOU FOR PLAYING',W/2,650,8);$.globalAlpha=1;}

  $.restore();

  // Fixed footer (not scrolled)
  if(teT>650){
    $.fillStyle=BG;$.globalAlpha=.7;$.fillRect(0,H-30,W,30);$.globalAlpha=1;
    // Post-game option
    if(Math.floor(teT/16)%2){
      txtC('Z: CONTINUE    ESC: TITLE',W/2,H-14,6);}
    if(jAct()){ea();loop=4;noDmg=true;if(hp<maxHp)hp++;transTo('LOOP 4 — BEYOND',cavInit);}
    if(J('escape')){state='title';teT=0;blink=0;if(score>hi){hi=score;localStorage.setItem('kaG',hi);}}}}


const TICK_RATE=30;
const TICK_MS=1000/TICK_RATE;
let lastTime=0,accumulator=0;

/* ================================================================
   GAME LOOP — Tick, Render, Frame, State Machine
   ================================================================ */
function gameTick(){
  tick++;if(beatPulse>0)beatPulse--;
  // Reset confirmation
  if(resetConfirm>0){
    resetConfirm--;
    if(jAct()){resetConfirm=0;state='title';blink=0;if(score>hi){hi=score;localStorage.setItem('kaG',hi);}clearJ();return;}
    if(J('escape'))resetConfirm=0;// cancel
    clearJ();return;}
  // ESC to trigger reset (only during gameplay)
  if(J('escape')&&state!=='title'&&state!=='over'&&state!=='trueEnd'&&state!=='ending1'){
    resetConfirm=90;clearJ();return;}
  // Hitstop: freeze game logic but keep rendering
  if(hitStop>0){hitStop--;clearJ();return;}
  if(hurtFlash>0)hurtFlash--;if(shakeT>0)shakeT--;
  if(trT>0){if(state!=='title'&&state!=='over'&&state!=='trueEnd'&&state!=='ending1')doBeat();}
  else{let nb=false;if(state!=='title'&&state!=='over'&&state!=='trueEnd'&&state!=='ending1')nb=doBeat();
    switch(state){case 'cave':cavUpdate(nb);break;case 'grass':grsUpdate(nb);break;case 'boss':bosUpdate(nb);break;
    case 'title':
      for(const k of 'abcdefghijklmnopqrstuvwxyz'.split('')){if(J(k)){cheatBuf+=k;if(cheatBuf.length>10)cheatBuf=cheatBuf.slice(-10);}}
      if(jAct()||J('enter')){ea();S.start();startGame();}break;
    case 'over':case 'trueEnd':case 'ending1':break;}}
  clearJ();
}

function render(){
  $.save();
  const qk=state==='boss'&&typeof bos!=='undefined'?bos.quake||0:0;
  const totalShake=shakeT+qk;
  if(totalShake>0){const sx=(Math.random()-.5)*totalShake*.7,sy=(Math.random()-.5)*totalShake*.5;$.translate(sx,sy);}
  $.fillStyle=BG;$.fillRect(0,0,W,H);
  // LCD scanlines
  $.fillStyle='rgba(145,158,125,0.08)';for(let y=0;y<H;y+=2)$.fillRect(0,y,W,1);
  // Beat pulse — whole screen breathes with the rhythm
  if(beatPulse>0&&state!=='title'&&state!=='over'){
    onFill(beatPulse/6*.035);$.fillRect(0,0,W,H);$.globalAlpha=1;}
  // Hurt flash
  if(hurtFlash>0){const hfa=Math.min(1,hurtFlash/5);$.fillStyle=`rgba(40,10,0,${hfa*.2})`;$.fillRect(0,0,W,H);}
  // Hitstop flash
  if(hitStop>0){$.fillStyle=BG;$.globalAlpha=.1;$.fillRect(0,0,W,H);$.globalAlpha=1;}
  if(trT>0){switch(state){case 'cave':cavDraw();drawHUD();break;case 'grass':grsDraw();drawHUD();break;case 'boss':bosDraw();drawHUD();break;}drawTrans();}
  else{switch(state){case 'title':drawTitle();break;case 'cave':cavDraw();drawHUD();break;case 'grass':grsDraw();drawHUD();break;case 'boss':bosDraw();drawHUD();break;case 'over':drawOver();break;case 'trueEnd':drawTrueEnd();break;case 'ending1':drawEnding1();break;}}
  // LCD bezel shadow (simple edge darkening)
  onFill(.03);
  $.fillRect(0,0,W,3);$.fillRect(0,H-3,W,3);$.fillRect(0,0,3,H);$.fillRect(W-3,0,3,H);
  $.globalAlpha=1;
  // Reset confirmation overlay
  if(resetConfirm>0){
    $.fillStyle=`rgba(26,40,16,.75)`;$.fillRect(0,0,W,H);
    $.fillStyle=BG;txtC('RETURN TO TITLE?',W/2,H/2-20,10);
    if(Math.floor(tick/12)%2)txtC('Z: YES    ESC: NO',W/2,H/2+10,7);
  }
  $.restore();
}

function frame(now){
  if(!lastTime)lastTime=now;
  const dt=Math.min(now-lastTime,100);
  lastTime=now;
  accumulator+=dt;
  while(accumulator>=TICK_MS){gameTick();accumulator-=TICK_MS;}
  render();
  if(running)animFrameId=requestAnimationFrame(frame);}

// === エンジン制御 ===
let animFrameId: number = 0;
let running = false;

function start(): void {
  if (running) return;
  running = true;
  lastTime = 0;
  accumulator = 0;
  animFrameId = requestAnimationFrame(frame);
}

function stop(): void {
  running = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = 0;
  }
}

function handleKeyDown(key: string): void {
  const k = key.toLowerCase();
  if (!kd[k]) jp[k] = true;
  kd[k] = true;
}

function handleKeyUp(key: string): void {
  kd[key.toLowerCase()] = false;
}

return { start, stop, resize, handleKeyDown, handleKeyUp };
}
