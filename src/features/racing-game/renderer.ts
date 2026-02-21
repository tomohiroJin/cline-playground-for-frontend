// Racing Game レンダラー

import type { Point, Checkpoint, StartLine, Player, Particle, Spark, Confetti, Decoration, HeatState, Card, HighlightEvent, HighlightType } from './types';
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

  /** T-104: ドラフトカード選択UI描画 */
  draftUI: (
    c: CanvasRenderingContext2D,
    cards: Card[],
    selectedIndex: number,
    timer: number,
    maxTimer: number,
    playerName: string,
    lapNum: number,
    confirmed: boolean,
    animProgress: number, // 0〜1 登場アニメーション進行度
  ) => {
    const { width, height } = Config.canvas;

    // 半透明オーバーレイ
    c.fillStyle = 'rgba(0,0,0,0.7)';
    c.fillRect(0, 0, width, height);

    // タイトル
    c.fillStyle = '#ffeb3b';
    c.font = 'bold 28px Arial';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(`ラップ ${lapNum} 完了!`, width / 2, 100);

    c.fillStyle = '#fff';
    c.font = '18px Arial';
    c.fillText(`${playerName} - カードを1枚選んでください`, width / 2, 140);

    // タイマー
    const timerRatio = timer / maxTimer;
    c.fillStyle = timerRatio > 0.3 ? '#4ade80' : '#ef4444';
    c.font = 'bold 20px Arial';
    c.fillText(`残り ${Math.ceil(timer)}秒`, width / 2, 175);

    // カード描画
    const cardW = 180;
    const cardH = 250;
    const gap = 30;
    const totalW = cardW * cards.length + gap * (cards.length - 1);
    const startX = (width - totalW) / 2;
    const baseY = 220;

    // イージング関数（easeOutBack）
    const ease = (t: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    cards.forEach((card, i) => {
      const x = startX + i * (cardW + gap);
      const isSelected = i === selectedIndex;

      // 登場アニメーション（下からスライドイン）
      const cardAnim = Math.min(1, animProgress * 3 - i * 0.3);
      const animOffset = cardAnim > 0 ? (1 - ease(Math.min(1, cardAnim))) * 100 : 100;
      const y = baseY + animOffset + (isSelected && !confirmed ? -8 : 0);
      const alpha = cardAnim > 0 ? Math.min(1, cardAnim) : 0;

      if (alpha <= 0) return;

      c.globalAlpha = confirmed && !isSelected ? 0.3 : alpha;

      // カード背景
      const rarityColors: Record<string, string> = {
        R: '#4a5568',
        SR: '#d69e2e',
        SSR: '#e53e3e',
      };
      const bgColor = rarityColors[card.rarity] || '#4a5568';

      // カード影
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.beginPath();
      c.roundRect(x + 4, y + 4, cardW, cardH, 12);
      c.fill();

      // カード本体
      c.fillStyle = bgColor;
      c.beginPath();
      c.roundRect(x, y, cardW, cardH, 12);
      c.fill();

      // 選択中の光彩
      if (isSelected && !confirmed) {
        c.strokeStyle = '#ffeb3b';
        c.lineWidth = 3;
        c.shadowColor = '#ffeb3b';
        c.shadowBlur = 15;
        c.beginPath();
        c.roundRect(x, y, cardW, cardH, 12);
        c.stroke();
        c.shadowBlur = 0;
      }

      // カード内容
      c.fillStyle = '#fff';

      // アイコン
      c.font = '36px Arial';
      c.textAlign = 'center';
      c.fillText(card.icon, x + cardW / 2, y + 45);

      // カード名
      c.font = 'bold 16px Arial';
      c.fillText(card.name, x + cardW / 2, y + 85);

      // レアリティバッジ
      c.font = 'bold 14px Arial';
      c.fillStyle = card.rarity === 'SSR' ? '#ffd700' : card.rarity === 'SR' ? '#c0c0c0' : '#cd7f32';
      c.fillText(`[${card.rarity}]`, x + cardW / 2, y + 110);

      // 区切り線
      c.strokeStyle = 'rgba(255,255,255,0.3)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + 15, y + 125);
      c.lineTo(x + cardW - 15, y + 125);
      c.stroke();

      // 効果説明文（ワードラップ）
      c.fillStyle = '#e2e8f0';
      c.font = '13px Arial';
      const desc = card.description;
      const maxLineW = cardW - 30;
      let line = '';
      let lineY = y + 150;
      for (const char of desc) {
        const test = line + char;
        if (c.measureText(test).width > maxLineW) {
          c.fillText(line, x + cardW / 2, lineY);
          line = char;
          lineY += 18;
        } else {
          line = test;
        }
      }
      if (line) c.fillText(line, x + cardW / 2, lineY);

      // カテゴリ
      const catLabels: Record<string, string> = {
        speed: '⚡スピード',
        handling: '🔄ハンドリング',
        defense: '🛡️防御',
        special: '✨特殊',
      };
      c.fillStyle = 'rgba(255,255,255,0.6)';
      c.font = '12px Arial';
      c.fillText(catLabels[card.category] || card.category, x + cardW / 2, y + cardH - 20);
    });

    c.globalAlpha = 1;

    // 操作説明
    if (!confirmed) {
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.font = '14px Arial';
      c.textAlign = 'center';
      c.fillText('← →キーで選択    Enter/Spaceで決定', width / 2, height - 50);
    }
  },

  /** T-109: ゴースト車体描画（半透明） */
  ghostKart: (c: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) => {
    c.save();
    c.globalAlpha = 0.3;
    c.translate(x, y);
    c.rotate(angle + Math.PI / 2);

    // 車体（簡略化版）
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(-10, -15, 20, 30, 4);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.lineWidth = 1;
    c.stroke();

    c.restore();

    // GHOST ラベル
    c.globalAlpha = 0.5;
    c.fillStyle = '#aaa';
    c.font = 'bold 10px Arial';
    c.textAlign = 'center';
    c.fillText('GHOST', x, y - 22);
    c.globalAlpha = 1;
  },

  /** T-111: ハイライト通知バナー描画（右上に小さく半透明表示） */
  highlightBanner: (
    c: CanvasRenderingContext2D,
    event: HighlightEvent & { displayTime: number },
    colors: Record<HighlightType, string>,
    index: number
  ) => {
    const { width } = Config.canvas;
    const displayDuration = 1200; // 1.2秒
    const fadeTime = 200; // 0.2秒

    const elapsed = event.displayTime;
    let alpha = 0.6; // 半透明ベース
    if (elapsed < fadeTime) {
      alpha = (elapsed / fadeTime) * 0.6; // フェードイン
    } else if (elapsed > displayDuration - fadeTime) {
      alpha = ((displayDuration - elapsed) / fadeTime) * 0.6; // フェードアウト
    }
    if (alpha <= 0) return;

    c.globalAlpha = alpha;

    const bgColor = colors[event.type] || '#333';
    const isLight = event.type === 'photo_finish' || event.type === 'near_miss';

    // バナー背景（画面右上端に配置、コンパクト表示）
    const bannerW = 180;
    const bannerH = 24;
    const bannerX = width - bannerW - 8;
    const bannerY = 8 + index * 30;

    c.fillStyle = bgColor;
    c.beginPath();
    c.roundRect(bannerX, bannerY, bannerW, bannerH, 6);
    c.fill();

    // テキスト
    c.fillStyle = isLight ? '#000' : '#fff';
    c.font = 'bold 12px Arial';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(event.message, bannerX + bannerW / 2, bannerY + bannerH / 2);

    c.globalAlpha = 1;
    c.textBaseline = 'alphabetic';
  },

  /** T-111: リザルト画面ハイライトサマリー描画 */
  highlightSummary: (
    c: CanvasRenderingContext2D,
    summary: { type: HighlightType; count: number; totalScore: number }[],
    labels: Record<HighlightType, string>,
    y: number
  ) => {
    const { width } = Config.canvas;
    if (summary.length === 0) return;

    c.fillStyle = '#ffeb3b';
    c.font = 'bold 18px Arial';
    c.textAlign = 'center';
    c.fillText('─── ハイライト ───', width / 2, y);

    let lineY = y + 28;
    let totalScore = 0;

    c.font = '14px Arial';
    for (const s of summary) {
      const label = labels[s.type] || s.type;
      c.fillStyle = '#e2e8f0';
      c.textAlign = 'left';
      c.fillText(`${label} × ${s.count}`, width / 2 - 120, lineY);
      c.textAlign = 'right';
      c.fillText(`+${s.totalScore}pt`, width / 2 + 120, lineY);
      totalScore += s.totalScore;
      lineY += 22;
    }

    // 合計スコア
    lineY += 8;
    c.fillStyle = '#ffeb3b';
    c.font = 'bold 16px Arial';
    c.textAlign = 'center';
    c.fillText(`合計ハイライトスコア: ${totalScore.toLocaleString()}pt`, width / 2, lineY);
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
