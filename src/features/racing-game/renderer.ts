// Racing Game レンダラー

import type { Point, Checkpoint, StartLine, Player, Particle, Spark, Confetti, Decoration, HeatState } from './types';
import { Config, Colors } from './constants';

export const Render = {
  circle: (c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  },
  ellipse: (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
    ry: number,
    col: string
  ) => {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  },
  rect: (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  },
  tri: (c: CanvasRenderingContext2D, pts: number[], col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    c.lineTo(pts[2], pts[3]);
    c.lineTo(pts[4], pts[5]);
    c.fill();
  },

  background: (c: CanvasRenderingContext2D, course: { bg: string; ground: string }) => {
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

  track: (c: CanvasRenderingContext2D, pts: Point[]) => {
    if (pts.length < 2) return;
    const { trackWidth } = Config.game;
    const path = () => {
      c.beginPath();
      c.moveTo(pts[0].x, pts[0].y);
      pts.forEach(p => c.lineTo(p.x, p.y));
      c.closePath();
    };
    c.lineCap = c.lineJoin = 'round';
    [
      [trackWidth * 2 + 16, '#c00', []],
      [trackWidth * 2 + 16, '#fff', [20, 20]],
      [trackWidth * 2, '#3a3a3a', []],
      [trackWidth * 2 - 15, '#505050', []],
      [3, '#fff', [30, 20]],
    ].forEach(([w, col, dash]) => {
      c.lineWidth = w as number;
      c.strokeStyle = col as string;
      c.setLineDash(dash as number[]);
      path();
      c.stroke();
    });
    c.setLineDash([]);
  },

  startLine: (c: CanvasRenderingContext2D, sl: StartLine) => {
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

  checkpoints: (c: CanvasRenderingContext2D, coords: Checkpoint[]) => {
    const radius = Config.game.checkpointRadius;

    coords.forEach((cp, i) => {
      if (i === 0) return;

      c.globalAlpha = 0.3;
      c.strokeStyle = '#ffff00';
      c.lineWidth = 2;
      c.setLineDash([8, 8]);
      c.beginPath();
      c.arc(cp.x, cp.y, radius, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);

      c.globalAlpha = 0.7;
      c.font = '20px Arial';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('🚩', cp.x, cp.y);

      c.globalAlpha = 1;
      c.textBaseline = 'alphabetic';
    });
  },

  kart: (c: CanvasRenderingContext2D, p: Player) => {
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle + Math.PI / 2);
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(3, 3, 12, 8, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = p.color;
    c.beginPath();
    c.roundRect(-10, -15, 20, 30, 4);
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = '#FFE4C4';
    c.beginPath();
    c.arc(0, -3, 6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = p.color;
    c.beginPath();
    c.arc(0, -6, 5, Math.PI, 0);
    c.fill();
    c.fillStyle = '#111';
    [
      [-11, -10],
      [11, -10],
      [-11, 10],
      [11, 10],
    ].forEach(([x, y]) => c.fillRect(x - 3, y - 5, 6, 10));
    c.restore();
    c.fillStyle = '#fff';
    c.strokeStyle = p.color;
    c.lineWidth = 3;
    c.font = 'bold 14px Arial';
    c.textAlign = 'center';
    c.strokeText(p.name, p.x, p.y - 28);
    c.fillText(p.name, p.x, p.y - 28);
  },

  particles: (c: CanvasRenderingContext2D, parts: Particle[], sparks: Spark[]) => {
    parts.forEach(p => {
      c.globalAlpha = p.life;
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();
    });
    sparks.forEach(p => {
      c.globalAlpha = p.life;
      c.strokeStyle = p.color;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + p.vx * 3, p.y + p.vy * 3);
      c.stroke();
    });
    c.globalAlpha = 1;
  },

  confetti: (c: CanvasRenderingContext2D, items: Confetti[]) =>
    items.forEach(i => {
      c.save();
      c.translate(i.x, i.y);
      c.rotate((i.rot * Math.PI) / 180);
      c.fillStyle = i.color;
      c.fillRect(-i.size / 2, -i.size / 4, i.size, i.size / 2);
      c.restore();
    }),

  /** HEAT ゲージバー描画 */
  heatGauge: (c: CanvasRenderingContext2D, heat: HeatState, x: number, y: number) => {
    const barW = 80;
    const barH = 8;

    // 背景
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillRect(x, y, barW, barH);

    // ゲージ色（青→黄→赤）
    let color: string;
    if (heat.gauge <= 0.3) {
      color = '#3b82f6'; // 青
    } else if (heat.gauge <= 0.7) {
      color = '#eab308'; // 黄
    } else {
      color = '#ef4444'; // 赤
    }

    // MAX到達時の白点滅
    if (heat.gauge >= 1.0 || heat.boostRemaining > 0) {
      color = Math.floor(Date.now() / 100) % 2 === 0 ? '#fff' : '#ef4444';
    }

    // ゲージバー
    const fillW = barW * heat.gauge;
    c.fillStyle = color;
    c.fillRect(x, y, fillW, barH);

    // 枠線
    c.strokeStyle = '#fff';
    c.lineWidth = 1;
    c.strokeRect(x, y, barW, barH);

    // ブースト中のエフェクト
    if (heat.boostRemaining > 0) {
      c.fillStyle = '#fff';
      c.font = 'bold 10px Arial';
      c.textAlign = 'center';
      c.fillText('BOOST!', x + barW / 2, y - 4);
    }
  },

  /** ドリフトインジケータ描画 */
  driftIndicator: (c: CanvasRenderingContext2D, p: Player) => {
    if (!p.drift.active) return;
    c.save();
    c.fillStyle = '#ff8c00';
    c.font = 'bold 12px Arial';
    c.textAlign = 'center';
    c.fillText('DRIFT!', p.x, p.y + 25);
    c.restore();
  },

  fireworks: (c: CanvasRenderingContext2D, time: number) => {
    [
      [200, 200, 0],
      [700, 150, 500],
      [450, 250, 1000],
    ].forEach(([x, y, d]) => {
      const t = (time + d) % 2000;
      if (t < 800) {
        const p = t / 800,
          r = p * 60;
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

  /** コース環境ビジュアルエフェクト描画 */
  courseEffect: (c: CanvasRenderingContext2D, effect: string, time: number) => {
    const { width, height } = Config.canvas;

    switch (effect) {
      case 'rain': {
        // 雨パーティクル
        c.globalAlpha = 0.4;
        c.fillStyle = '#c0d8ff';
        for (let i = 0; i < 40; i++) {
          const x = ((i * 47 + time * 0.3) % width);
          const y = ((i * 31 + time * 0.8) % height);
          c.fillRect(x, y, 1.5, 8);
        }
        c.globalAlpha = 1;
        break;
      }
      case 'leaves': {
        // 落ち葉パーティクル
        c.globalAlpha = 0.5;
        for (let i = 0; i < 15; i++) {
          const x = ((i * 67 + time * 0.1) % width);
          const y = ((i * 43 + time * 0.15) % height);
          const color = i % 2 === 0 ? '#8B4513' : '#D2691E';
          c.fillStyle = color;
          c.beginPath();
          c.ellipse(x, y, 4, 2.5, (time * 0.01 + i) % (Math.PI * 2), 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1;
        break;
      }
      case 'snow': {
        // 雪パーティクル（強化版）
        c.globalAlpha = 0.7;
        c.fillStyle = '#fff';
        for (let i = 0; i < 50; i++) {
          const x = ((i * 53 + time * 0.05 + Math.sin(i + time * 0.002) * 20) % width);
          const y = ((i * 37 + time * 0.2) % height);
          const r = 1.5 + (i % 3);
          c.beginPath();
          c.arc(x, y, r, 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1;
        break;
      }
      case 'vignette': {
        // ビネットエフェクト（画面端を暗く）
        const gradient = c.createRadialGradient(
          width / 2, height / 2, Math.min(width, height) * 0.25,
          width / 2, height / 2, Math.min(width, height) * 0.6
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
        c.fillStyle = gradient;
        c.fillRect(0, 0, width, height);
        break;
      }
    }
  },
};

// デコレーション描画関数
const DecoRenderers: Record<
  string,
  ((c: CanvasRenderingContext2D, x: number, y: number) => void)[]
> = {
  forest: [
    (c, x, y) => {
      Render.circle(c, x, y, 15, '#0a5f0a');
      Render.rect(c, x - 3, y + 8, 6, 10, '#4a2800');
    },
    (c, x, y) => {
      Render.tri(c, [x, y - 20, x - 12, y + 10, x + 12, y + 10], '#2d5a1d');
      Render.rect(c, x - 2, y + 10, 4, 8, '#4a2800');
    },
    (c, x, y) => Render.ellipse(c, x, y, 8, 5, '#654321'),
  ],
  city: [
    (c, x, y) => {
      Render.rect(c, x - 12, y - 25, 24, 35, '#555');
      for (let i = 0; i < 6; i++)
        Render.rect(c, x - 8 + (i % 2) * 12, y - 20 + Math.floor(i / 2) * 10, 5, 6, '#ff0');
    },
    (c, x, y) => {
      Render.rect(c, x - 8, y - 35, 16, 45, '#444');
      for (let i = 0; i < 4; i++) Render.rect(c, x - 5, y - 30 + i * 10, 10, 5, '#0ff');
    },
    (c, x, y) => {
      Render.rect(c, x - 2, y - 25, 4, 30, '#333');
      Render.circle(c, x, y - 27, 5, '#ff0');
    },
  ],
  mountain: [
    (c, x, y) => Render.ellipse(c, x, y, 14, 9, '#666'),
    (c, x, y) => {
      Render.ellipse(c, x, y, 10, 6, '#f40');
      Render.ellipse(c, x, y, 5, 3, '#f80');
    },
    (c, x, y) => {
      Render.tri(c, [x, y - 18, x - 15, y + 8, x + 15, y + 8], '#5a4a3a');
      Render.tri(c, [x, y - 18, x - 5, y - 10, x + 5, y - 10], '#fff');
    },
  ],
  beach: [
    (c, x, y) => {
      Render.ellipse(c, x, y, 18, 10, '#2196F3');
      Render.ellipse(c, x, y - 3, 8, 4, '#fff');
    },
    (c, x, y) => {
      Render.rect(c, x - 2, y - 20, 4, 25, '#8B4513');
      Render.circle(c, x + 8, y - 18, 10, '#228B22');
    },
    (c, x, y) => Render.ellipse(c, x, y, 10, 6, '#f4a460'),
  ],
  night: [
    (c, x, y) => {
      Render.circle(c, x, y, 2, '#ffeb3b');
      Render.circle(c, x, y, 6, 'rgba(255,235,59,0.15)');
    },
    (c, x, y) => {
      Render.rect(c, x - 10, y - 20, 20, 30, '#333');
      Render.rect(c, x - 7, y - 15, 6, 8, '#0ff');
      Render.rect(c, x + 1, y - 15, 6, 8, '#0ff');
      Render.rect(c, x - 7, y - 2, 14, 6, '#f0f');
    },
    (c, x, y) => {
      Render.rect(c, x - 1, y - 18, 2, 20, '#444');
      Render.circle(c, x, y - 20, 4, '#f0f');
    },
  ],
  snow: [
    (c, x, y) => {
      Render.circle(c, x, y + 5, 10, '#fff');
      Render.circle(c, x, y - 5, 7, '#fff');
      Render.circle(c, x, y - 13, 5, '#fff');
      Render.circle(c, x - 2, y - 14, 1.5, '#333');
      Render.circle(c, x + 2, y - 14, 1.5, '#333');
      Render.tri(c, [x, y - 12, x + 4, y - 11, x, y - 10], '#f60');
    },
    (c, x, y) => {
      Render.tri(c, [x, y - 22, x - 12, y + 10, x + 12, y + 10], '#1a5c1a');
      Render.ellipse(c, x - 5, y - 8, 4, 2, '#fff');
      Render.ellipse(c, x + 6, y, 5, 2, '#fff');
    },
    (c, x, y) => Render.ellipse(c, x, y, 15, 8, '#a0c4e8'),
  ],
};

export const renderDecos = (
  c: CanvasRenderingContext2D,
  decos: Decoration[],
  type: string
) => {
  const fns = DecoRenderers[type];
  if (fns) decos.forEach(d => fns[d.variant % 3]?.(c, d.x, d.y));
};
