// ============================================
// RacingGame.jsx - v10 チェックポイント改善版
// ============================================

import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';

// ============================================
// 1. 定数
// ============================================

const Config = Object.freeze({
  canvas: { width: 900, height: 700 },
  game: {
    trackWidth: 55,
    turnRate: 0.065,
    collisionDist: 25,
    wallWarpThreshold: 10,
    speedRecovery: 0.02,
    sparkThreshold: 1.5,
    particleCount: 8,
    decoCount: 35,
    confettiCount: 100,
    maxParticles: 200,
    maxSparks: 100,
    checkpointRadius: 90, // チェックポイント検出半径（大きめ）
  },
  timing: {
    demo: 15000,
    idle: 8,
    countdown: 3500,
    lapAnnounce: 1500,
  },
  startLine: { width: 12, squares: 6 },
  audio: {
    defaultVolume: 0.5,
    minVolume: 0,
    maxVolume: 1,
    freq: {
      collision: [200, 150],
      wall: [100, 80],
      lap: [523, 659, 784],
      finalLap: [784, 988, 1175],
      countdown: [440],
      go: [880, 1760],
      finish: [523, 659, 784, 1047],
      engine: [80, 100],
      checkpoint: [660, 880],
    },
  },
});

const Colors = Object.freeze({
  car: ['#E60012', '#0066FF', '#00AA00', '#FF6600', '#AA00AA', '#FFCC00'],
  particle: ['#ff0', '#f80', '#f00'],
  confetti: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f'],
  firework: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0'],
});

const Options = Object.freeze({
  speed: [
    { label: '🐢ゆっくり', value: 2.2 },
    { label: '🚗ふつう', value: 3.2 },
    { label: '🚀はやい', value: 4.5 },
  ],
  cpu: [
    { label: '😊よわい', skill: 0.25, miss: 0.12 },
    { label: '🙂ふつう', skill: 0.5, miss: 0.05 },
    { label: '😈つよい', skill: 1.0, miss: 0 },
  ],
  laps: [1, 3, 5],
});

// コースデータ - チェックポイントを明示的に定義
// checkpoints: コースポイントのインデックス配列（必ず通過すべき地点）
const Courses = Object.freeze([
  { 
    name: '🌳フォレスト', bg: '#228B22', ground: '#1e7a1e', deco: 'forest',
    pts: [[450,650],[300,650],[150,600],[80,500],[60,380],[80,260],[150,160],[280,100],[450,80],[620,100],[750,160],[820,260],[840,380],[820,500],[750,600],[600,650]],
    // 16ポイント: 0(スタート), 4(左下), 8(上), 12(右下)
    checkpoints: [0, 4, 8, 12],
  },
  { 
    name: '🏙️シティ', bg: '#3a3a4a', ground: '#2a2a3a', deco: 'city',
    pts: [[450,650],[250,650],[100,600],[100,450],[200,350],[200,200],[100,100],[300,100],[400,200],[500,100],[700,100],[800,200],[800,400],[700,500],[700,600],[600,650]],
    // 16ポイント: 複雑なコース
    checkpoints: [0, 4, 8, 12],
  },
  { 
    name: '🌋マウンテン', bg: '#4a2020', ground: '#3a1515', deco: 'mountain',
    pts: [[450,650],[300,620],[150,550],[80,450],[120,350],[80,250],[150,150],[280,120],[350,200],[300,300],[400,350],[500,300],[550,200],[620,120],[750,150],[820,250],[780,350],[820,450],[750,550],[600,620]],
    // 20ポイント: 内側のループを必ず通過
    checkpoints: [0, 5, 10, 15],
  },
  { 
    name: '🏖️ビーチ', bg: '#d4a574', ground: '#c49a6c', deco: 'beach',
    pts: [[450,650],[300,640],[180,600],[100,520],[80,400],[120,280],[200,180],[320,120],[450,100],[580,120],[700,180],[780,280],[820,400],[800,520],[720,600],[600,640]],
    // 16ポイント: オーバルコース
    checkpoints: [0, 4, 8, 12],
  },
  { 
    name: '🌙ナイト', bg: '#1a1a2e', ground: '#16163a', deco: 'night',
    pts: [[450,650],[300,600],[180,500],[150,380],[200,280],[300,220],[420,200],[480,280],[420,360],[300,380],[250,300],[200,180],[300,100],[450,80],[600,100],[700,180],[750,300],[700,420],[600,500],[550,600]],
    // 20ポイント: 左側のループ(7-10)を必ず通過するように設定
    // 0(スタート), 5(左上入口), 9(ループ内), 14(右上)
    checkpoints: [0, 5, 9, 14],
  },
  { 
    name: '❄️スノー', bg: '#e8f4f8', ground: '#d0e8f0', deco: 'snow',
    pts: [[450,650],[280,630],[150,570],[80,470],[60,350],[80,230],[150,140],[280,80],[420,60],[550,80],[680,60],[780,100],[850,180],[870,300],[850,420],[780,520],[680,580],[580,620]],
    // 18ポイント: 上部の複雑な部分
    checkpoints: [0, 4, 9, 14],
  },
].map(c => ({ 
  ...c, 
  points: c.pts.map(([x, y]) => ({ x, y })),
  // チェックポイント座標を事前計算
  checkpointCoords: c.checkpoints.map(idx => {
    const [x, y] = c.pts[idx];
    return { x, y, idx };
  }),
})));

// ============================================
// 2. ユーティリティ
// ============================================

const Utils = {
  clamp: (v, min, max) => {
    const n = Number(v);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  },
  sum: arr => Array.isArray(arr) && arr.length > 0 ? arr.reduce((a, b) => a + b, 0) : 0,
  min: arr => Array.isArray(arr) && arr.length > 0 ? Math.min(...arr) : Infinity,
  randInt: max => Math.floor(Math.random() * Math.max(1, Math.floor(max))),
  randRange: (min, max) => min >= max ? min : Math.random() * (max - min) + min,
  randChoice: arr => Array.isArray(arr) && arr.length > 0 ? arr[Utils.randInt(arr.length)] : null,
  
  normalizeAngle: angle => {
    let a = angle % (Math.PI * 2);
    if (a > Math.PI) a -= Math.PI * 2;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
  },
  
  formatTime: ms => {
    if (typeof ms !== 'number' || Number.isNaN(ms)) return '-:--.--';
    const abs = Math.abs(ms);
    const m = Math.floor(abs / 60000);
    const s = Math.floor((abs % 60000) / 1000);
    const c = Math.floor((abs % 1000) / 100); // 1 digit for ms
    return `${m}:${String(s).padStart(2, '0')}.${c}`;
  },
  
  safeIndex: (arr, idx, fallback = null) => 
    Array.isArray(arr) && idx >= 0 && idx < arr.length ? arr[idx] : fallback,
    
  // 2点間の距離
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
};

// ============================================
// 3. サウンドエンジン
// ============================================

const SoundEngine = (() => {
  let ctx = null;
  let master = null;
  let volume = Config.audio.defaultVolume;
  let muted = false;
  let engineOsc = null;
  let engineGain = null;
  const pendingTimeouts = new Set();

  const getCtx = () => {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.connect(ctx.destination);
        master.gain.value = volume;
      } catch (e) {
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };

  const tone = (freq, dur, type = 'square', vol = 1) => {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = Utils.clamp(freq, 20, 20000);
      g.gain.value = Utils.clamp(volume * vol, 0, 1);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g);
      g.connect(master);
      o.start(c.currentTime);
      o.stop(c.currentTime + dur);
    } catch (e) {}
  };

  const sequence = (freqs, interval, type = 'square', vol = 1) => {
    if (!Array.isArray(freqs)) return;
    freqs.forEach((f, i) => {
      const id = setTimeout(() => {
        tone(f, interval * 0.9, type, vol);
        pendingTimeouts.delete(id);
      }, i * interval * 1000);
      pendingTimeouts.add(id);
    });
  };

  const noise = (dur, vol = 0.3) => {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const size = Math.min(c.sampleRate * dur, c.sampleRate * 2);
      const buf = c.createBuffer(1, size, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      const g = c.createGain();
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 500;
      src.buffer = buf;
      g.gain.value = Utils.clamp(volume * vol, 0, 1);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start();
    } catch (e) {}
  };

  const F = Config.audio.freq;
  
  return {
    collision: () => { tone(F.collision[0], 0.1, 'sawtooth', 0.4); setTimeout(() => tone(F.collision[1], 0.15, 'sawtooth', 0.3), 50); noise(0.15, 0.2); },
    wall: () => { tone(F.wall[0], 0.08, 'square', 0.3); noise(0.1, 0.15); },
    lap: () => sequence(F.lap, 0.12, 'sine', 0.5),
    finalLap: () => { sequence(F.finalLap, 0.15, 'sine', 0.6); setTimeout(() => sequence(F.finalLap, 0.15, 'sine', 0.4), 500); },
    countdown: () => tone(F.countdown[0], 0.15, 'sine', 0.5),
    go: () => sequence(F.go, 0.1, 'sine', 0.6),
    finish: () => { sequence(F.finish, 0.2, 'sine', 0.5); setTimeout(() => sequence([...F.finish].reverse(), 0.15, 'triangle', 0.4), 800); },
    checkpoint: () => sequence(F.checkpoint, 0.08, 'sine', 0.3),
    
    startEngine: () => {
      if (muted || engineOsc) return;
      const c = getCtx();
      if (!c) return;
      try {
        engineOsc = c.createOscillator();
        engineGain = c.createGain();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = F.engine[0];
        engineGain.gain.value = volume * 0.08;
        engineOsc.connect(engineGain);
        engineGain.connect(master);
        engineOsc.start();
      } catch (e) {}
    },
    
    updateEngine: spd => {
      if (engineOsc && engineGain) {
        engineOsc.frequency.value = F.engine[0] + Utils.clamp(spd, 0, 2) * 60;
        engineGain.gain.value = volume * (0.05 + Utils.clamp(spd, 0, 2) * 0.05);
      }
    },
    
    stopEngine: () => {
      try { engineOsc?.stop(); } catch {}
      engineOsc = engineGain = null;
    },
    
    setVolume: v => {
      volume = Utils.clamp(v, Config.audio.minVolume, Config.audio.maxVolume);
      if (master) master.gain.value = muted ? 0 : volume;
      if (engineGain) engineGain.gain.value = volume * 0.08;
    },
    
    getVolume: () => volume,
    toggleMute: () => { muted = !muted; if (master) master.gain.value = muted ? 0 : volume; return muted; },
    isMuted: () => muted,
    
    cleanup: () => {
      pendingTimeouts.forEach(id => clearTimeout(id));
      pendingTimeouts.clear();
      try { engineOsc?.stop(); } catch {}
      engineOsc = engineGain = null;
    },
  };
})();

// ============================================
// 4. エンティティファクトリ
// ============================================

const Entity = {
  player: (x, y, angle, color, name, isCpu) => ({
    x, y, angle, color, name, isCpu,
    lap: 1, 
    checkpointFlags: 0,  // ビットフラグでチェックポイント通過を管理
    lapTimes: [], 
    lapStart: 0,
    speed: 1, 
    wallStuck: 0, 
    progress: 0, 
    lastSeg: -1,
  }),
  
  particle: (x, y, i) => {
    const a = (i / Config.game.particleCount) * Math.PI * 2;
    return { x, y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, life: 1, size: 3, color: Colors.particle[i % 3] };
  },
  
  spark: (x, y, angle, color) => ({
    x: x - Math.cos(angle) * 20 + Utils.randRange(-15, 15),
    y: y - Math.sin(angle) * 20 + Utils.randRange(-15, 15),
    vx: -Math.cos(angle) * 8, vy: -Math.sin(angle) * 8, life: 0.5, color,
  }),
  
  confetti: () => ({
    x: Math.random() * Config.canvas.width, y: Utils.randRange(-700, 0),
    vx: Utils.randRange(-2, 2), vy: Utils.randRange(3, 8),
    size: Utils.randRange(5, 15), color: Utils.randChoice(Colors.confetti),
    rot: Utils.randRange(0, 360), rotSpd: Utils.randRange(-7.5, 7.5),
  }),
  
  decoration: (x, y) => ({ x, y, variant: Utils.randInt(3) }),
};

// ============================================
// 5. トラック計算
// ============================================

const Track = {
  getInfo: (px, py, points) => {
    const { trackWidth } = Config.game;
    let best = { dist: Infinity, seg: 0, pt: { x: px, y: py }, dir: 0 };
    
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const dx = p2.x - p1.x, dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;
      
      const t = Utils.clamp(((px - p1.x) * dx + (py - p1.y) * dy) / lenSq, 0, 1);
      const proj = { x: p1.x + t * dx, y: p1.y + t * dy };
      const dist = Math.hypot(px - proj.x, py - proj.y);
      
      if (dist < best.dist) {
        best = { dist, seg: i, pt: proj, dir: Math.atan2(dy, dx) };
      }
    }
    
    return { ...best, onTrack: best.dist < trackWidth };
  },
  
  startLine: pts => {
    if (pts.length < 2) return { cx: 0, cy: 0, px: 0, py: 1, dx: 1, dy: 0, len: 100 };
    const p0 = pts[0], pL = pts[pts.length - 1];
    const dx = p0.x - pL.x, dy = p0.y - pL.y;
    const len = Math.hypot(dx, dy) || 1;
    return { cx: p0.x, cy: p0.y, px: -dy / len, py: dx / len, dx: dx / len, dy: dy / len, len: Config.game.trackWidth * 2 };
  },
  
  // スタートライン通過判定
  crossedStart: (player, sl, currentSeg, prevSeg, totalSegs) => {
    if (totalSegs < 2) return false;
    const lastSeg = totalSegs - 1;
    const crossedFromEnd = prevSeg >= lastSeg - 1 && currentSeg <= 1;
    if (!crossedFromEnd) return false;
    const dx = player.x - sl.cx;
    const dy = player.y - sl.cy;
    const distAlongLine = Math.abs(dx * sl.px + dy * sl.py);
    const distFromLine = Math.abs(dx * sl.dx + dy * sl.dy);
    return distFromLine < 50 && distAlongLine < Config.game.trackWidth;
  },
};

// ============================================
// 6. レンダラー
// ============================================

const Render = {
  circle: (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); },
  ellipse: (c, x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); },
  rect: (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); },
  tri: (c, pts, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0], pts[1]); c.lineTo(pts[2], pts[3]); c.lineTo(pts[4], pts[5]); c.fill(); },

  background: (c, course) => {
    const { width, height } = Config.canvas;
    c.fillStyle = course.bg;
    c.fillRect(0, 0, width, height);
    c.fillStyle = course.ground;
    for (let i = 0; i < 150; i++) {
      c.beginPath();
      c.arc((i * 137) % width, (i * 97) % height, 2, 0, Math.PI * 2);
      c.fill();
    }
  },

  track: (c, pts) => {
    if (pts.length < 2) return;
    const { trackWidth } = Config.game;
    const path = () => { c.beginPath(); c.moveTo(pts[0].x, pts[0].y); pts.forEach(p => c.lineTo(p.x, p.y)); c.closePath(); };
    c.lineCap = c.lineJoin = 'round';
    [[trackWidth * 2 + 16, '#c00', []], [trackWidth * 2 + 16, '#fff', [20, 20]], [trackWidth * 2, '#3a3a3a', []], [trackWidth * 2 - 15, '#505050', []], [3, '#fff', [30, 20]]]
      .forEach(([w, col, dash]) => { c.lineWidth = w; c.strokeStyle = col; c.setLineDash(dash); path(); c.stroke(); });
    c.setLineDash([]);
  },

  startLine: (c, sl) => {
    const { width, squares } = Config.startLine;
    c.save();
    c.translate(sl.cx, sl.cy);
    c.rotate(Math.atan2(sl.py, sl.px));
    const sq = sl.len / squares;
    for (let i = 0; i < squares; i++) {
      for (let j = 0; j < 2; j++) {
        c.fillStyle = (i + j) % 2 ? '#000' : '#fff';
        c.fillRect(-sl.len / 2 + i * sq, -width / 2 + j * 6, sq, 6);
      }
    }
    c.restore();
  },

  // チェックポイント表示（シンプルなマーカー）
  checkpoints: (c, coords) => {
    const radius = Config.game.checkpointRadius;
    
    coords.forEach((cp, i) => {
      if (i === 0) return; // スタート地点は表示しない
      
      // 検出範囲の円（薄い点線）
      c.globalAlpha = 0.3;
      c.strokeStyle = '#ffff00';
      c.lineWidth = 2;
      c.setLineDash([8, 8]);
      c.beginPath();
      c.arc(cp.x, cp.y, radius, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      
      // 中央のフラッグアイコン
      c.globalAlpha = 0.7;
      c.font = '20px Arial';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('🚩', cp.x, cp.y);
      
      c.globalAlpha = 1;
      c.textBaseline = 'alphabetic';
    });
  },

  kart: (c, p) => {
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle + Math.PI / 2);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(3, 3, 12, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = p.color; c.beginPath(); c.roundRect(-10, -15, 20, 30, 4); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#FFE4C4'; c.beginPath(); c.arc(0, -3, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = p.color; c.beginPath(); c.arc(0, -6, 5, Math.PI, 0); c.fill();
    c.fillStyle = '#111';
    [[-11, -10], [11, -10], [-11, 10], [11, 10]].forEach(([x, y]) => c.fillRect(x - 3, y - 5, 6, 10));
    c.restore();
    c.fillStyle = '#fff'; c.strokeStyle = p.color; c.lineWidth = 3; c.font = 'bold 14px Arial'; c.textAlign = 'center';
    c.strokeText(p.name, p.x, p.y - 28); c.fillText(p.name, p.x, p.y - 28);
  },

  particles: (c, parts, sparks) => {
    parts.forEach(p => { c.globalAlpha = p.life; c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.size, 0, Math.PI * 2); c.fill(); });
    sparks.forEach(p => { c.globalAlpha = p.life; c.strokeStyle = p.color; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.vx * 3, p.y + p.vy * 3); c.stroke(); });
    c.globalAlpha = 1;
  },

  confetti: (c, items) => items.forEach(i => {
    c.save();
    c.translate(i.x, i.y);
    c.rotate(i.rot * Math.PI / 180);
    c.fillStyle = i.color;
    c.fillRect(-i.size / 2, -i.size / 4, i.size, i.size / 2);
    c.restore();
  }),

  fireworks: (c, time) => {
    [[200, 200, 0], [700, 150, 500], [450, 250, 1000]].forEach(([x, y, d]) => {
      const t = (time + d) % 2000;
      if (t < 800) {
        const p = t / 800, r = p * 60;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          c.fillStyle = Colors.firework[i % 5];
          c.globalAlpha = 1 - p;
          c.beginPath();
          c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 4 * (1 - p) + 2, 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1;
      }
    });
  },
};

// デコレーション
const DecoRenderers = {
  forest: [
    (c, x, y) => { Render.circle(c, x, y, 15, '#0a5f0a'); Render.rect(c, x - 3, y + 8, 6, 10, '#4a2800'); },
    (c, x, y) => { Render.tri(c, [x, y - 20, x - 12, y + 10, x + 12, y + 10], '#2d5a1d'); Render.rect(c, x - 2, y + 10, 4, 8, '#4a2800'); },
    (c, x, y) => Render.ellipse(c, x, y, 8, 5, '#654321'),
  ],
  city: [
    (c, x, y) => { Render.rect(c, x - 12, y - 25, 24, 35, '#555'); for (let i = 0; i < 6; i++) Render.rect(c, x - 8 + (i % 2) * 12, y - 20 + Math.floor(i / 2) * 10, 5, 6, '#ff0'); },
    (c, x, y) => { Render.rect(c, x - 8, y - 35, 16, 45, '#444'); for (let i = 0; i < 4; i++) Render.rect(c, x - 5, y - 30 + i * 10, 10, 5, '#0ff'); },
    (c, x, y) => { Render.rect(c, x - 2, y - 25, 4, 30, '#333'); Render.circle(c, x, y - 27, 5, '#ff0'); },
  ],
  mountain: [
    (c, x, y) => Render.ellipse(c, x, y, 14, 9, '#666'),
    (c, x, y) => { Render.ellipse(c, x, y, 10, 6, '#f40'); Render.ellipse(c, x, y, 5, 3, '#f80'); },
    (c, x, y) => { Render.tri(c, [x, y - 18, x - 15, y + 8, x + 15, y + 8], '#5a4a3a'); Render.tri(c, [x, y - 18, x - 5, y - 10, x + 5, y - 10], '#fff'); },
  ],
  beach: [
    (c, x, y) => { Render.ellipse(c, x, y, 18, 10, '#2196F3'); Render.ellipse(c, x, y - 3, 8, 4, '#fff'); },
    (c, x, y) => { Render.rect(c, x - 2, y - 20, 4, 25, '#8B4513'); Render.circle(c, x + 8, y - 18, 10, '#228B22'); },
    (c, x, y) => Render.ellipse(c, x, y, 10, 6, '#f4a460'),
  ],
  night: [
    (c, x, y) => { Render.circle(c, x, y, 2, '#ffeb3b'); Render.circle(c, x, y, 6, 'rgba(255,235,59,0.15)'); },
    (c, x, y) => { Render.rect(c, x - 10, y - 20, 20, 30, '#333'); Render.rect(c, x - 7, y - 15, 6, 8, '#0ff'); Render.rect(c, x + 1, y - 15, 6, 8, '#0ff'); Render.rect(c, x - 7, y - 2, 14, 6, '#f0f'); },
    (c, x, y) => { Render.rect(c, x - 1, y - 18, 2, 20, '#444'); Render.circle(c, x, y - 20, 4, '#f0f'); },
  ],
  snow: [
    (c, x, y) => { Render.circle(c, x, y + 5, 10, '#fff'); Render.circle(c, x, y - 5, 7, '#fff'); Render.circle(c, x, y - 13, 5, '#fff'); Render.circle(c, x - 2, y - 14, 1.5, '#333'); Render.circle(c, x + 2, y - 14, 1.5, '#333'); Render.tri(c, [x, y - 12, x + 4, y - 11, x, y - 10], '#f60'); },
    (c, x, y) => { Render.tri(c, [x, y - 22, x - 12, y + 10, x + 12, y + 10], '#1a5c1a'); Render.ellipse(c, x - 5, y - 8, 4, 2, '#fff'); Render.ellipse(c, x + 6, y, 5, 2, '#fff'); },
    (c, x, y) => Render.ellipse(c, x, y, 15, 8, '#a0c4e8'),
  ],
};

const renderDecos = (c, decos, type) => {
  const fns = DecoRenderers[type];
  if (fns) decos.forEach(d => fns[d.variant % 3]?.(c, d.x, d.y));
};

// ============================================
// 7. ゲームロジック
// ============================================

const Logic = {
  cpuTurn: (p, pts, skill, miss) => {
    const info = Track.getInfo(p.x, p.y, pts);
    const toCenter = Math.atan2(info.pt.y - p.y, info.pt.x - p.x);
    const nextIdx = (info.seg + 1) % pts.length;
    const toNext = Math.atan2(pts[nextIdx].y - p.y, pts[nextIdx].x - p.x);
    let target = info.dist / Config.game.trackWidth > 0.6 ? toCenter : toNext;
    let diff = Utils.normalizeAngle(target - p.angle);
    if (Math.random() < miss) diff += Utils.randRange(-0.4, 0.4);
    const rate = Config.game.turnRate * skill;
    return diff > 0.03 ? rate : diff < -0.03 ? -rate : 0;
  },

  movePlayer: (p, baseSpd, pts) => {
    const { speedRecovery, trackWidth, wallWarpThreshold } = Config.game;
    const spd = Math.min(1, p.speed + speedRecovery);
    const vel = baseSpd * spd;
    const nx = p.x + Math.cos(p.angle) * vel;
    const ny = p.y + Math.sin(p.angle) * vel;
    const info = Track.getInfo(nx, ny, pts);

    if (info.onTrack) {
      return { p: { ...p, x: nx, y: ny, speed: spd, wallStuck: 0 }, info, vel, hit: false };
    }

    const stuck = p.wallStuck + 1;
    if (stuck >= wallWarpThreshold) {
      const wi = (info.seg + 3) % pts.length;
      const wp = pts[wi];
      const nwi = (wi + 1) % pts.length;
      const nwp = pts[nwi];
      return { p: { ...p, x: wp.x, y: wp.y, angle: Math.atan2(nwp.y - wp.y, nwp.x - wp.x), speed: 0.3, wallStuck: 0 }, info, vel, hit: true };
    }
    
    const off = stuck >= 2 ? 2 : 1;
    const ti = (info.seg + off) % pts.length;
    const tp = pts[ti];
    return { p: { ...p, x: info.pt.x, y: info.pt.y, angle: Math.atan2(tp.y - info.pt.y, tp.x - info.pt.x), speed: 0.5, wallStuck: stuck }, info, vel, hit: true };
  },

  // 座標ベースのチェックポイント判定
  updateCheckpoints: (p, checkpointCoords, onNew) => {
    let flags = p.checkpointFlags;
    const radius = Config.game.checkpointRadius;
    
    checkpointCoords.forEach((cp, i) => {
      // 既に通過済みならスキップ
      if ((flags & (1 << i)) !== 0) return;
      
      // 前のチェックポイントを通過していない場合はスキップ（順序保証）
      // ただしi=0（スタート地点）は常にチェック可能
      if (i > 0 && (flags & (1 << (i - 1))) === 0) return;
      
      // 距離判定
      const dist = Utils.dist(p.x, p.y, cp.x, cp.y);
      if (dist < radius) {
        flags |= (1 << i);
        if (i > 0) onNew?.(); // スタート地点以外で音を鳴らす
      }
    });
    
    return { ...p, checkpointFlags: flags };
  },

  // 全チェックポイント通過済みか確認
  allCheckpointsPassed: (flags, totalCheckpoints) => {
    const allFlags = (1 << totalCheckpoints) - 1;
    return (flags & allFlags) === allFlags;
  },

  handleCollision: (p1, p2) => {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= Config.game.collisionDist || dist === 0) return null;
    const ov = (Config.game.collisionDist - dist) / 2;
    const nx = dx / dist, ny = dy / dist;
    return {
      p1: { ...p1, x: p1.x - nx * ov, y: p1.y - ny * ov },
      p2: { ...p2, x: p2.x + nx * ov, y: p2.y + ny * ov },
      pt: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
    };
  },
};

// ============================================
// 8. UIコンポーネント
// ============================================

const Btn = memo(({ sel, onClick, children, cls = 'bg-blue-500' }) => (
  <button onClick={onClick} className={`px-2 py-1 rounded text-xs font-bold transition-colors ${sel ? cls : 'bg-gray-700 hover:bg-gray-600'}`} aria-pressed={sel}>{children}</button>
));

const ColorBtn = memo(({ color, sel, onClick, label }) => (
  <button onClick={onClick} className={`w-6 h-6 rounded transition-transform ${sel ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`} style={{ background: color }} aria-label={label} aria-pressed={sel} />
));

const TouchBtn = memo(({ dir, onStart, onEnd, label }) => (
  <button className="w-16 h-16 bg-gray-700/80 rounded-full text-3xl active:bg-gray-500 select-none touch-none" onTouchStart={onStart} onTouchEnd={onEnd} onMouseDown={onStart} onMouseUp={onEnd} onMouseLeave={onEnd} aria-label={label}>{dir}</button>
));

const VolumeCtrl = memo(({ vol, setVol, muted, setMuted }) => (
  <div className="flex items-center gap-2 bg-gray-800/80 px-3 py-1 rounded-full" role="group" aria-label="音量コントロール">
    <button onClick={() => setMuted(SoundEngine.toggleMute())} className="text-xl hover:scale-110 transition-transform" aria-label={muted ? 'ミュート解除' : 'ミュート'} aria-pressed={muted}>
      {muted ? '🔇' : vol > 0.5 ? '🔊' : vol > 0 ? '🔉' : '🔈'}
    </button>
    <input type="range" min="0" max="1" step="0.1" value={muted ? 0 : vol}
      onChange={e => { const v = +e.target.value; setVol(v); SoundEngine.setVolume(v); }}
      className="w-20 h-2 bg-gray-600 rounded-lg cursor-pointer accent-yellow-400" disabled={muted}
      aria-label="音量" aria-valuemin={0} aria-valuemax={1} aria-valuenow={vol} />
  </div>
));

// ============================================
// 9. カスタムフック
// ============================================

const useInput = () => {
  const keys = useRef({});
  const touch = useRef({ L: false, R: false });

  useEffect(() => {
    const kd = e => { keys.current[e.key] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault(); };
    const ku = e => { keys.current[e.key] = false; };
    const blur = () => { keys.current = {}; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur); };
  }, []);

  return { keys, touch };
};

const useIdle = (active, timeout) => {
  const [idle, setIdle] = useState(0);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    if (!active) { setIdle(0); setDemo(false); return; }
    const timer = setInterval(() => setIdle(t => { if (t >= timeout && !demo) setDemo(true); return t + 1; }), 1000);
    const reset = () => { setIdle(0); if (demo) setDemo(false); };
    const events = ['mousemove', 'keydown', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    return () => { clearInterval(timer); events.forEach(e => window.removeEventListener(e, reset)); };
  }, [active, timeout, demo]);

  return [demo, setDemo];
};

// ============================================
// 10. メインコンポーネント
// ============================================

export default function RacingGame() {
  const [mode, setMode] = useState('2p');
  const [course, setCourse] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [cpu, setCpu] = useState(1);
  const [laps, setLaps] = useState(3);
  const [c1, setC1] = useState(0);
  const [c2, setC2] = useState(1);

  const [state, setState] = useState('start');
  const [winner, setWinner] = useState(null);
  const [results, setResults] = useState(null);
  const [bests, setBests] = useState({});
  const [paused, setPaused] = useState(false);
  const [vol, setVol] = useState(Config.audio.defaultVolume);
  const [muted, setMuted] = useState(false);

  const canvasRef = useRef(null);
  const { keys, touch } = useInput();
  const [demo, setDemo] = useIdle(state === 'start', Config.timing.idle);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = Config.canvas;
    canvas.width = width;
    canvas.height = height;

    const cIdx = demo ? Utils.randInt(Courses.length) : Utils.clamp(course, 0, Courses.length - 1);
    const cur = Courses[cIdx];
    const pts = cur.points;
    const cpCoords = cur.checkpointCoords;
    const baseSpd = Utils.safeIndex(Options.speed, speed, Options.speed[1]).value;
    const cpuCfg = Utils.safeIndex(Options.cpu, cpu, Options.cpu[1]);
    const maxLaps = laps;
    const sl = Track.startLine(pts);

    const sAngle = pts.length >= 2 ? Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) : 0;
    const pAngle = sAngle + Math.PI / 2;
    const col1 = Colors.car[demo ? Utils.randInt(6) : Utils.clamp(c1, 0, 5)];
    const col2 = Colors.car[demo ? Utils.randInt(6) : Utils.clamp(c2, 0, 5)];

    let players = [
      Entity.player(pts[0].x + Math.cos(pAngle) * 18, pts[0].y + Math.sin(pAngle) * 18 - 30, sAngle, col1, 'P1', demo),
      Entity.player(pts[0].x - Math.cos(pAngle) * 18, pts[0].y - Math.sin(pAngle) * 18 - 30, sAngle, col2, demo || mode === 'cpu' ? 'CPU' : 'P2', demo || mode === 'cpu'),
    ];

    let cdStart = Date.now();
    let raceStart = 0;
    let particles = [];
    let sparks = [];
    let confetti = [];
    let shake = 0;
    let lapAnn = null;
    let lapAnnT = 0;
    let lead = 0;
    let lastCd = 4;
    let engineOn = false;
    let isRunning = true;
    const demoStart = demo ? Date.now() : 0;

    const decos = [];
    for (let i = 0; i < Config.game.decoCount; i++) {
      let x, y, ok = false, att = 0;
      while (!ok && att++ < 50) { x = Math.random() * 860 + 20; y = Math.random() * 660 + 20; ok = Track.getInfo(x, y, pts).dist > Config.game.trackWidth + 30; }
      if (ok) decos.push(Entity.decoration(x, y));
    }

    const addParts = (x, y) => {
      for (let i = 0; i < Config.game.particleCount; i++) particles.push(Entity.particle(x, y, i));
      particles = particles.slice(-Config.game.maxParticles);
      shake = 5;
    };

    const update = () => {
      if (paused || !isRunning) return;
      if (demo && Date.now() - demoStart > Config.timing.demo) { setDemo(false); return; }

      players = players.map((p, i) => {
        let rot = 0;
        if (demo || p.isCpu) rot = Logic.cpuTurn(p, pts, demo ? 0.7 : cpuCfg.skill, demo ? 0.03 : cpuCfg.miss);
        else if (i === 0) { if (keys.current.a || keys.current.A || touch.current.L) rot = -Config.game.turnRate; if (keys.current.d || keys.current.D || touch.current.R) rot = Config.game.turnRate; }
        else { if (keys.current.ArrowLeft) rot = -Config.game.turnRate; if (keys.current.ArrowRight) rot = Config.game.turnRate; }
        return { ...p, angle: p.angle + rot };
      });

      let finished = false;
      players = players.map(p => {
        if (finished) return p;
        
        const prevSeg = p.lastSeg;
        const { p: np, info, vel, hit } = Logic.movePlayer(p, baseSpd, pts);
        
        if (hit && !demo) { addParts(p.x + Math.cos(p.angle) * 15, p.y + Math.sin(p.angle) * 15); SoundEngine.wall(); }
        if (vel > Config.game.sparkThreshold) {
          for (let i = 0; i < 2; i++) sparks.push(Entity.spark(np.x, np.y, np.angle, np.color));
          sparks = sparks.slice(-Config.game.maxSparks);
        }

        // チェックポイント更新（座標ベース）
        let up = Logic.updateCheckpoints(np, cpCoords, demo ? null : SoundEngine.checkpoint);
        up = { ...up, lastSeg: info.seg, progress: (up.lap - 1) * pts.length + info.seg };

        // スタートライン通過 & 全チェックポイント通過済みでラップ完了
        const crossed = Track.crossedStart(up, sl, info.seg, prevSeg, pts.length);
        const allPassed = Logic.allCheckpointsPassed(up.checkpointFlags, cpCoords.length);
        
        if (crossed && allPassed) {
          if (demo) {
            return { ...up, lap: 1, checkpointFlags: 0, lapTimes: [], lapStart: raceStart ? Date.now() - raceStart : 0 };
          }
          
          const lt = Date.now() - raceStart - up.lapStart;
          const nlt = [...up.lapTimes, lt];
          
          if (up.lap < maxLaps) {
            const isFinal = up.lap + 1 === maxLaps;
            lapAnn = { text: isFinal ? '🏁 FINAL LAP!' : `LAP ${up.lap + 1}`, final: isFinal };
            lapAnnT = Date.now();
            isFinal ? SoundEngine.finalLap() : SoundEngine.lap();
            // チェックポイントフラグをリセット
            return { ...up, lap: up.lap + 1, checkpointFlags: 0, lapTimes: nlt, lapStart: Date.now() - raceStart };
          }
          
          finished = true;
          const tot = Utils.sum(nlt);
          const key = `${course}-${speed}`;
          if (!bests[key] || tot < bests[key]) setBests(prev => ({ ...prev, [key]: tot }));
          setResults({ winner: up.name, p1: { lt: players[0].lapTimes, tot: Utils.sum(players[0].lapTimes) }, p2: { lt: players[1].lapTimes, tot: Utils.sum(players[1].lapTimes) } });
          setWinner(up.name);
          setState('finish');
          confetti = Array.from({ length: Config.game.confettiCount }, Entity.confetti);
          SoundEngine.stopEngine();
          SoundEngine.finish();
          return { ...up, lapTimes: nlt };
        }
        return up;
      });

      const col = Logic.handleCollision(players[0], players[1]);
      if (col) { players = [col.p1, col.p2]; addParts(col.pt.x, col.pt.y); if (!demo) SoundEngine.collision(); }

      lead = players[0].progress >= players[1].progress ? 0 : 1;

      particles = particles.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.2, life: p.life - 0.05 })).filter(p => p.life > 0);
      sparks = sparks.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.1 })).filter(p => p.life > 0);
      confetti = confetti.map(c => c.y + c.vy > 750 ? { ...c, y: -20, x: Math.random() * width, vy: Utils.randRange(3, 8) } : { ...c, x: c.x + c.vx, y: c.y + c.vy, vy: c.vy + 0.1, rot: c.rot + c.rotSpd });
      if (shake > 0) shake *= 0.9;
      if (lapAnn && Date.now() - lapAnnT > Config.timing.lapAnnounce) lapAnn = null;
      if (engineOn && !demo) SoundEngine.updateEngine((players[0].speed + players[1].speed) / 2);
    };

    const drawPanel = (p, x, isP1) => {
      const el = raceStart ? Date.now() - raceStart : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(x, 10, 155, 90);
      ctx.fillStyle = p.color; ctx.fillRect(x, 10, 155, 4);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'left';
      ctx.fillText(`${isP1 ? '🔴' : p.isCpu ? '🤖' : '🔵'} ${p.name} ${(isP1 ? lead === 0 : lead === 1) ? '👑1st' : '2nd'}`, x + 8, 30);
      ctx.font = 'bold 20px Arial'; ctx.fillText(`LAP ${p.lap}/${maxLaps}`, x + 8, 52);
      ctx.font = '12px Arial'; ctx.fillText(Utils.formatTime(el - p.lapStart), x + 8, 70);
      if (p.lapTimes.length > 0) { ctx.fillStyle = '#ff0'; ctx.fillText(`Best:${Utils.formatTime(Utils.min(p.lapTimes))}`, x + 8, 88); }
    };

    const drawUI = () => {
      if (demo) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(300, 10, 300, 40);
        ctx.fillStyle = '#ff0'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.fillText('🎮 DEMO PLAY 🎮', 450, 35);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(280, 620, 340, 35);
        ctx.fillStyle = '#fff'; ctx.font = '14px Arial'; ctx.fillText('何かキーを押すかタップでメニューへ', 450, 642);
        return;
      }
      drawPanel(players[0], 10, true); drawPanel(players[1], 735, false);
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(350, 10, 200, 45);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.fillText(cur.name, 450, 28);
      const bt = bests[`${course}-${speed}`];
      ctx.font = '11px Arial'; ctx.fillStyle = '#aaa'; ctx.fillText(bt ? `ベスト:${Utils.formatTime(bt)}` : 'ベスト:---', 450, 45);
      if (state === 'playing' || state === 'countdown') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(390, 662, 120, 25);
        ctx.fillStyle = '#aaa'; ctx.font = '10px Arial'; ctx.fillText('P:ポーズ ESC:やめる', 450, 678);
      }
    };

    const drawLapAnn = () => {
      if (!lapAnn) return;
      const el = Date.now() - lapAnnT;
      const a = el < 300 ? el / 300 : el > 1200 ? (1500 - el) / 300 : 1;
      const s = el < 300 ? 0.5 + el / 600 : 1;
      ctx.globalAlpha = a; ctx.font = `bold ${45 * s}px Arial`; ctx.textAlign = 'center';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.fillStyle = lapAnn.final ? '#ff0' : '#fff';
      ctx.strokeText(lapAnn.text, 450, 200); ctx.fillText(lapAnn.text, 450, 200); ctx.globalAlpha = 1;
    };

    const drawCountdown = () => {
      const el = Date.now() - cdStart, n = 3 - Math.floor(el / 1000);
      ctx.textAlign = 'center'; ctx.strokeStyle = '#000'; ctx.lineWidth = 6;
      if (n > 0) { const s = 1 + (el % 1000) / 1000 * 0.5; ctx.globalAlpha = 1 - (el % 1000) / 1000; ctx.font = `bold ${100 * s}px Arial`; ctx.fillStyle = '#fff'; ctx.strokeText(n, 450, 350); ctx.fillText(n, 450, 350); ctx.globalAlpha = 1; }
      else if (n === 0 && el < 4000) { ctx.globalAlpha = 1 - (el - 3000) / 1000; ctx.font = 'bold 80px Arial'; ctx.fillStyle = '#0f0'; ctx.strokeText('GO!', 450, 350); ctx.fillText('GO!', 450, 350); ctx.globalAlpha = 1; }
    };

    const drawPause = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 50px Arial'; ctx.textAlign = 'center';
      ctx.fillText('⏸️ PAUSE', 450, 320); ctx.font = '20px Arial'; ctx.fillText('P:再開 ESC:やめる', 450, 370);
    };

    const render = () => {
      ctx.save();
      if (shake > 0.5) ctx.translate(Utils.randRange(-shake / 2, shake / 2), Utils.randRange(-shake / 2, shake / 2));
      ctx.clearRect(0, 0, width, height);
      Render.background(ctx, cur);
      renderDecos(ctx, decos, cur.deco);
      Render.track(ctx, pts);
      Render.startLine(ctx, sl);
      
      // チェックポイント表示
      if (!demo) {
        Render.checkpoints(ctx, cpCoords);
      }
      
      Render.particles(ctx, particles, sparks);
      players.forEach(p => Render.kart(ctx, p));
      drawUI(); drawLapAnn();
      if (state === 'countdown') drawCountdown();
      if (state === 'finish') { Render.confetti(ctx, confetti); Render.fireworks(ctx, Date.now()); }
      if (paused) drawPause();
      ctx.restore();
    };

    let af;
    const loop = () => {
      if (!isRunning) return;
      if (state === 'countdown') {
        const el = Date.now() - cdStart, n = 3 - Math.floor(el / 1000);
        if (n !== lastCd && n >= 0 && !demo) { n > 0 ? SoundEngine.countdown() : SoundEngine.go(); lastCd = n; }
        if (el >= Config.timing.countdown) {
          raceStart = Date.now();
          players = players.map(p => ({ ...p, lapStart: 0 }));
          setState('playing');
          if (!demo) { SoundEngine.startEngine(); engineOn = true; }
        }
      }
      if (state === 'playing' && !paused) update();
      if (state === 'start' && demo) { if (!raceStart) raceStart = Date.now(); update(); }
      render();
      af = requestAnimationFrame(loop);
    };

    const onKey = e => {
      if ((e.key === 'p' || e.key === 'P') && state === 'playing') setPaused(p => !p);
      if (e.key === 'Escape') { setState('start'); setWinner(null); setResults(null); setPaused(false); SoundEngine.stopEngine(); }
    };
    window.addEventListener('keydown', onKey);
    loop();
    return () => { isRunning = false; cancelAnimationFrame(af); window.removeEventListener('keydown', onKey); SoundEngine.cleanup(); };
  }, [state, speed, course, mode, cpu, laps, c1, c2, bests, paused, demo]);

  return (
    <div className="flex flex-col items-center bg-gray-900 p-2 rounded-lg" role="application" aria-label="レーシングゲーム">
      <div className="relative">
        <canvas ref={canvasRef} className="border-4 border-yellow-500 rounded-lg" style={{ maxWidth: '100%' }} aria-label="ゲーム画面" />

        {state === 'start' && !demo && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-white rounded-lg overflow-auto p-2" role="dialog" aria-label="ゲーム設定">
            <h1 className="text-2xl font-bold text-yellow-400 mb-2">🏎️ レースゲーム</h1>
            <div className="mb-3"><VolumeCtrl vol={vol} setVol={setVol} muted={muted} setMuted={setMuted} /></div>
            <div className="flex gap-2 mb-2">
              <Btn sel={mode === '2p'} onClick={() => setMode('2p')} cls="bg-green-500">👫2人</Btn>
              <Btn sel={mode === 'cpu'} onClick={() => setMode('cpu')} cls="bg-purple-500">🤖CPU</Btn>
            </div>
            {mode === 'cpu' && <div className="flex gap-1 mb-2">{Options.cpu.map((l, i) => <Btn key={i} sel={cpu === i} onClick={() => setCpu(i)} cls="bg-orange-500">{l.label}</Btn>)}</div>}
            <div className="flex gap-4 mb-2">
              <div className="text-center"><p className="text-xs mb-1">P1</p><div className="flex gap-1">{Colors.car.map((c, i) => <ColorBtn key={i} color={c} sel={c1 === i} onClick={() => setC1(i)} label={`P1カラー${i + 1}`} />)}</div></div>
              <div className="text-center"><p className="text-xs mb-1">{mode === 'cpu' ? 'CPU' : 'P2'}</p><div className="flex gap-1">{Colors.car.map((c, i) => <ColorBtn key={i} color={c} sel={c2 === i} onClick={() => setC2(i)} label={`${mode === 'cpu' ? 'CPU' : 'P2'}カラー${i + 1}`} />)}</div></div>
            </div>
            <div className="mb-2"><p className="text-xs mb-1 text-center">コース</p><div className="flex flex-wrap gap-1 justify-center">{Courses.map((c, i) => <Btn key={i} sel={course === i} onClick={() => setCourse(i)} cls="bg-yellow-500 text-black">{c.name}</Btn>)}</div></div>
            <div className="mb-2"><p className="text-xs mb-1 text-center">スピード</p><div className="flex gap-1">{Options.speed.map((o, i) => <Btn key={i} sel={speed === i} onClick={() => setSpeed(i)} cls="bg-blue-500">{o.label}</Btn>)}</div></div>
            <div className="mb-3"><p className="text-xs mb-1 text-center">周回</p><div className="flex gap-1">{Options.laps.map(n => <Btn key={n} sel={laps === n} onClick={() => setLaps(n)} cls="bg-pink-500">{n}周</Btn>)}</div></div>
            <button onClick={() => setState('countdown')} className="bg-gradient-to-r from-green-400 to-yellow-400 text-black px-6 py-2 rounded-full text-lg font-bold hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-white">🏁 スタート!</button>
          </div>
        )}

        {state === 'finish' && results && (
          <div className="absolute inset-0 flex items-center justify-center" role="dialog" aria-label="レース結果">
            <div className="bg-black/85 p-4 rounded-xl text-center text-white">
              <div className="text-3xl mb-2">🏆👑🏆</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-1">WINNER!</h2>
              <div className={`text-4xl font-bold mb-2 ${winner === 'P1' ? 'text-red-500' : 'text-blue-500'}`}>{winner}</div>
              <div className="bg-gray-900/80 rounded p-2 mb-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  {[{ d: results.p1, l: 'P1', c: 'text-red-400' }, { d: results.p2, l: mode === 'cpu' ? 'CPU' : 'P2', c: 'text-blue-400' }].map(({ d, l, c }) => (
                    <div key={l}><p className={`${c} font-bold`}>{l}</p>{d.lt.map((t, i) => <p key={i}>{Utils.formatTime(t)}{t === Utils.min(d.lt) && ' ⭐'}</p>)}<p className="border-t border-gray-600 mt-1">計:{Utils.formatTime(d.tot)}</p></div>
                  ))}
                </div>
              </div>
              <button onClick={() => { setWinner(null); setResults(null); setState('start'); }} className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-white">🔄 もういちど</button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between w-full max-w-md px-4 md:hidden" role="group" aria-label="タッチコントロール">
        <TouchBtn dir="◀" onStart={() => touch.current.L = true} onEnd={() => touch.current.L = false} label="左に曲がる" />
        <TouchBtn dir="▶" onStart={() => touch.current.R = true} onEnd={() => touch.current.R = false} label="右に曲がる" />
      </div>
      <div className="mt-2"><VolumeCtrl vol={vol} setVol={setVol} muted={muted} setMuted={setMuted} /></div>
      <p className="text-gray-400 text-xs mt-1">P1:A/D P2:←/→ P:ポーズ ESC:終了</p>
    </div>
  );
}
