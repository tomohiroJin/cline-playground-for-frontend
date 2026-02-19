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

  // boss5: 深海の核（機械+生物融合）
  if (t === 'boss5') {
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill={color} opacity="0.85" />
        <circle cx="20" cy="20" r="10" fill="rgba(100,50,150,0.4)" />
        <circle cx="20" cy="20" r="5" fill="#a4f" opacity="0.9" />
        {/* 放射状の線 */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <line
            key={deg}
            x1="20"
            y1="20"
            x2={20 + Math.cos((deg * Math.PI) / 180) * 16}
            y2={20 + Math.sin((deg * Math.PI) / 180) * 16}
            stroke="#a4f"
            strokeWidth="1"
            opacity="0.4"
          />
        ))}
        <circle cx="15" cy="16" r="3" fill="#f4a" opacity="0.8" />
        <circle cx="25" cy="16" r="3" fill="#f4a" opacity="0.8" />
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
