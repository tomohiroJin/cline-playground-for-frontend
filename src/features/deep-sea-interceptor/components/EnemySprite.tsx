// ============================================================================
// Deep Sea Interceptor - 敵描画コンポーネント
// ============================================================================

import React, { memo } from 'react';
import { ColorPalette } from '../constants';
import type { Enemy } from '../types';

/** ボスの名称マップ */
const BossNames: Record<string, string> = {
  boss: 'アンコウ・ガーディアン',
  boss1: 'アンコウ・ガーディアン',
  boss2: 'マインレイヤー',
  boss3: 'サーマルドラゴン',
  boss4: 'ルミナス・リヴァイアサン',
  boss5: 'アビサル・コア',
};

/** ミッドボスの名称マップ */
const MidbossNames: Record<string, string> = {
  midboss1: 'ヤドカリ・センチネル',
  midboss2: '双子エイ',
  midboss3: '溶岩カメ',
  midboss4: '発光イカ',
  midboss5: '深海サメ',
};

/** ボスタイプ別のSVG描画 */
function BossSvg({ enemy, color }: { enemy: Enemy; color: string }) {
  const s = enemy.size;
  const t = enemy.enemyType;

  // boss2: ウミウシ型（丸みのある体 + 突起）
  if (t === 'boss2') {
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <ellipse cx="20" cy="22" rx="17" ry="14" fill={color} opacity="0.9" />
        <ellipse cx="20" cy="22" rx="10" ry="8" fill="rgba(0,0,0,0.3)" />
        <circle cx="12" cy="14" r="3" fill="#c6c" opacity="0.8" />
        <circle cx="28" cy="14" r="3" fill="#c6c" opacity="0.8" />
        {/* 突起 */}
        <circle cx="8" cy="10" r="2.5" fill={color} opacity="0.7" />
        <circle cx="32" cy="10" r="2.5" fill={color} opacity="0.7" />
        <circle cx="20" cy="6" r="2" fill={color} opacity="0.7" />
      </svg>
    );
  }

  // boss3: チューブワーム集合体（複数の管状構造）
  if (t === 'boss3') {
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <ellipse cx="20" cy="20" rx="18" ry="16" fill={color} opacity="0.85" />
        {[10, 16, 22, 28].map(x => (
          <rect key={x} x={x - 2} y="6" width="4" height="18" rx="2" fill="#c44" opacity="0.6" />
        ))}
        <ellipse cx="20" cy="20" rx="10" ry="8" fill="rgba(0,0,0,0.3)" />
        <circle cx="14" cy="18" r="3" fill="#f84" opacity="0.8" />
        <circle cx="26" cy="18" r="3" fill="#f84" opacity="0.8" />
      </svg>
    );
  }

  // boss4: クラゲ集合体（半透明のドーム + 触手）
  if (t === 'boss4') {
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <ellipse cx="20" cy="16" rx="18" ry="12" fill={color} opacity="0.7" />
        <ellipse cx="20" cy="16" rx="12" ry="8" fill="rgba(100,150,255,0.3)" />
        <circle cx="14" cy="14" r="3" fill="#8af" opacity="0.9" />
        <circle cx="26" cy="14" r="3" fill="#8af" opacity="0.9" />
        {/* 触手 */}
        {[8, 14, 20, 26, 32].map(x => (
          <path
            key={x}
            d={`M${x} 26 Q${x + 2} 34 ${x - 1} 40`}
            stroke={color}
            strokeWidth="2"
            fill="none"
            opacity="0.5"
          />
        ))}
      </svg>
    );
  }

  // boss5: アビサル・コア（3段階変形）
  if (t === 'boss5') {
    const phase = enemy.bossPhase || 1;
    const isOpen = enemy.shellOpen ?? false;

    // 第3形態「暴走コア」: 赤発光・小型コア・回転放射線
    if (phase === 3) {
      const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
      const pulseOpacity = hpRatio < 0.15 ? 0.6 : 0.9;
      return (
        <svg width={s} height={s} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="12" fill="#ff2a2a" opacity={pulseOpacity}>
            <animate attributeName="r" values="12;14;12" dur="0.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="20" cy="20" r="7" fill="#ff6644" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.4;0.8" dur="0.3s" repeatCount="indefinite" />
          </circle>
          <circle cx="20" cy="20" r="3" fill="#fff" opacity="0.9" />
          {/* 激しく回転する放射線 */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
            <line
              key={deg}
              x1="20" y1="20"
              x2={20 + Math.cos((deg * Math.PI) / 180) * 18}
              y2={20 + Math.sin((deg * Math.PI) / 180) * 18}
              stroke="#ff4444" strokeWidth="1.5" opacity="0.6"
            >
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.2s" begin={`${deg / 360}s`} repeatCount="indefinite" />
            </line>
          ))}
        </svg>
      );
    }

    // 第2形態「内核露出」: 赤紫・触手・パルスアニメ
    if (phase === 2) {
      return (
        <svg width={s} height={s} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="#8a2a3a" opacity="0.85" />
          <circle cx="20" cy="20" r="9" fill="#c44a6a" opacity="0.6">
            <animate attributeName="r" values="9;11;9" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="20" cy="20" r="5" fill="#f4a" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="0.6s" repeatCount="indefinite" />
          </circle>
          {/* 触手状の付属物 */}
          {[0, 72, 144, 216, 288].map(deg => (
            <path
              key={deg}
              d={`M${20 + Math.cos((deg * Math.PI) / 180) * 14} ${20 + Math.sin((deg * Math.PI) / 180) * 14} Q${20 + Math.cos(((deg + 20) * Math.PI) / 180) * 22} ${20 + Math.sin(((deg + 20) * Math.PI) / 180) * 22} ${20 + Math.cos(((deg + 40) * Math.PI) / 180) * 18} ${20 + Math.sin(((deg + 40) * Math.PI) / 180) * 18}`}
              stroke="#f4a" strokeWidth="1.5" fill="none" opacity="0.5"
            />
          ))}
          <circle cx="15" cy="16" r="3" fill="#ff6688" opacity="0.8" />
          <circle cx="25" cy="16" r="3" fill="#ff6688" opacity="0.8" />
        </svg>
      );
    }

    // 第1形態「外殻」: 閉/開で色と構造が変化
    const shellColor = isOpen ? '#8a4a8a' : '#5a2a5a';
    const coreVisible = isOpen;
    const lineWidth = isOpen ? 2 : 1;
    const lineColor = isOpen ? '#f4f' : '#a4f';
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill={shellColor} opacity="0.85" />
        {isOpen && (
          <>
            {/* 外殻が割れる表現 */}
            <path d="M 20 2 L 18 10 L 22 10 Z" fill="#2a1a2a" opacity="0.6" />
            <path d="M 38 20 L 30 18 L 30 22 Z" fill="#2a1a2a" opacity="0.6" />
            <path d="M 20 38 L 18 30 L 22 30 Z" fill="#2a1a2a" opacity="0.6" />
            <path d="M 2 20 L 10 18 L 10 22 Z" fill="#2a1a2a" opacity="0.6" />
          </>
        )}
        <circle cx="20" cy="20" r="10" fill={coreVisible ? 'rgba(200,100,255,0.5)' : 'rgba(100,50,150,0.4)'} />
        {coreVisible && (
          <circle cx="20" cy="20" r="5" fill="#f4f" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="0.5s" repeatCount="indefinite" />
          </circle>
        )}
        {!coreVisible && <circle cx="20" cy="20" r="5" fill="#a4f" opacity="0.5" />}
        {/* 放射状の線 */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <line
            key={deg}
            x1="20" y1="20"
            x2={20 + Math.cos((deg * Math.PI) / 180) * 16}
            y2={20 + Math.sin((deg * Math.PI) / 180) * 16}
            stroke={lineColor} strokeWidth={lineWidth}
            opacity={isOpen ? 0.7 : 0.4}
          />
        ))}
        <circle cx="15" cy="16" r="3" fill={isOpen ? '#f4f' : '#f4a'} opacity="0.8" />
        <circle cx="25" cy="16" r="3" fill={isOpen ? '#f4f' : '#f4a'} opacity="0.8" />
      </svg>
    );
  }

  // boss / boss1: アンコウ（デフォルト）
  return (
    <svg width={s} height={s} viewBox="0 0 40 40">
      <ellipse cx="20" cy="20" rx="18" ry="16" fill={color} opacity="0.9" />
      <ellipse cx="20" cy="20" rx="12" ry="10" fill="rgba(0,0,0,0.4)" />
      <circle cx="13" cy="15" r="4" fill="#f66" opacity="0.8" />
      <circle cx="27" cy="15" r="4" fill="#f66" opacity="0.8" />
      {/* 提灯（アンコウの特徴） */}
      <line x1="20" y1="4" x2="20" y2="10" stroke={color} strokeWidth="2" opacity="0.7" />
      <circle cx="20" cy="3" r="3" fill="#ff8" opacity="0.8" />
      {[0, 1, 2, 3].map(i => (
        <path
          key={i}
          d={`M${8 + i * 8} 34 Q${10 + i * 8} 42 ${6 + i * 9} 48`}
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}

/** ミッドボスの SVG 描画 */
function MidbossSvg({ enemy, color }: { enemy: Enemy; color: string }) {
  const s = enemy.size;
  const t = enemy.enemyType;

  if (t === 'midboss2') {
    // 双子エイ
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <ellipse cx="12" cy="20" rx="10" ry="8" fill={color} opacity="0.85" />
        <ellipse cx="28" cy="20" rx="10" ry="8" fill={color} opacity="0.85" />
        <circle cx="10" cy="18" r="2" fill="#6cf" opacity="0.9" />
        <circle cx="26" cy="18" r="2" fill="#6cf" opacity="0.9" />
      </svg>
    );
  }
  if (t === 'midboss3') {
    // 溶岩カメ
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <ellipse cx="20" cy="22" rx="16" ry="12" fill={color} opacity="0.9" />
        <ellipse cx="20" cy="22" rx="10" ry="7" fill="#a64" opacity="0.6" />
        <circle cx="14" cy="18" r="2.5" fill="#f84" opacity="0.8" />
        <circle cx="26" cy="18" r="2.5" fill="#f84" opacity="0.8" />
      </svg>
    );
  }
  if (t === 'midboss4') {
    // 発光イカ
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <ellipse cx="20" cy="16" rx="12" ry="10" fill={color} opacity="0.75" />
        <circle cx="16" cy="14" r="2.5" fill="#adf" opacity="0.9" />
        <circle cx="24" cy="14" r="2.5" fill="#adf" opacity="0.9" />
        {[12, 16, 20, 24, 28].map(x => (
          <line key={x} x1={x} y1="26" x2={x + (Math.random() - 0.5) * 4} y2="38" stroke={color} strokeWidth="1.5" opacity="0.5" />
        ))}
      </svg>
    );
  }
  if (t === 'midboss5') {
    // 深海サメ
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <ellipse cx="20" cy="20" rx="18" ry="10" fill={color} opacity="0.9" />
        <polygon points="20,4 16,14 24,14" fill={color} opacity="0.7" />
        <circle cx="12" cy="18" r="2.5" fill="#f44" opacity="0.8" />
        <circle cx="28" cy="18" r="2.5" fill="#f44" opacity="0.8" />
      </svg>
    );
  }
  // midboss1: ヤドカリ（デフォルト）
  return (
    <svg width={s} height={s} viewBox="0 0 40 40">
      <ellipse cx="20" cy="22" rx="14" ry="12" fill={color} opacity="0.9" />
      <ellipse cx="20" cy="12" rx="10" ry="8" fill="#a86" opacity="0.6" />
      <circle cx="15" cy="18" r="2.5" fill="#f66" opacity="0.8" />
      <circle cx="25" cy="18" r="2.5" fill="#f66" opacity="0.8" />
    </svg>
  );
}

/** 機雷の SVG 描画 */
function MineSvg({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="14" fill={color} opacity="0.8" />
      <circle cx="20" cy="20" r="6" fill="#f44" opacity="0.6" />
      {[0, 60, 120, 180, 240, 300].map(deg => (
        <circle
          key={deg}
          cx={20 + Math.cos((deg * Math.PI) / 180) * 14}
          cy={20 + Math.sin((deg * Math.PI) / 180) * 14}
          r="3"
          fill="#ff8"
          opacity="0.7"
        />
      ))}
    </svg>
  );
}

/** 敵キャラクターのスプライト */
const EnemySprite = memo(function EnemySprite({ enemy }: { enemy: Enemy }) {
  const color = ColorPalette.enemy[enemy.enemyType] || ColorPalette.enemy.basic;
  const isBoss = enemy.enemyType === 'boss' || enemy.enemyType.startsWith('boss');
  const isMidboss = enemy.enemyType.startsWith('midboss');
  const isMine = enemy.enemyType === 'mine';

  return (
    <div
      style={{
        position: 'absolute',
        left: enemy.x - enemy.size / 2,
        top: enemy.y - enemy.size / 2,
      }}
    >
      {isBoss ? (
        <BossSvg enemy={enemy} color={color} />
      ) : isMidboss ? (
        <MidbossSvg enemy={enemy} color={color} />
      ) : isMine ? (
        <MineSvg size={enemy.size} color={color} />
      ) : (
        <svg width={enemy.size} height={enemy.size} viewBox="0 0 40 40">
          <ellipse cx="20" cy="20" rx="16" ry="14" fill={color} opacity="0.9" />
          <circle cx="13" cy="15" r="3" fill="#f66" opacity="0.8" />
          <circle cx="27" cy="15" r="3" fill="#f66" opacity="0.8" />
        </svg>
      )}
    </div>
  );
});

export { BossNames, MidbossNames };
export default EnemySprite;
