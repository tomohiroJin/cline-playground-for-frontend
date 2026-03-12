// テストモード デバッグパネル
// グリッド操作、エフェクト操作、スコア・ステージ操作、状態表示を提供する

import React, { useState } from 'react';

interface TestModePanelProps {
  // グリッド操作
  onFillRows: (rows: number) => void;
  onClearGrid: () => void;
  playerX: number;
  // エフェクト操作
  onBombShake: () => void;
  onBlastShake: () => void;
  onLineShake: () => void;
  onGameOverShake: () => void;
  onHighScoreEffect: () => void;
  // スコア・ステージ操作
  onAddScore: () => void;
  onSkillMax: () => void;
  onNextStage: () => void;
  // 状態表示
  comboCount: number;
  comboMultiplier: number;
  skillCharge: number;
  score: number;
  stage: number;
}

/** デバッグパネルのボタンスタイル */
const buttonStyle: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '11px',
  fontWeight: 'bold',
  border: '1px solid rgba(99, 102, 241, 0.5)',
  borderRadius: '4px',
  backgroundColor: 'rgba(55, 65, 81, 0.9)',
  color: '#e5e7eb',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

/** セクションラベルスタイル */
const sectionLabelStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#9ca3af',
  marginBottom: '4px',
  fontWeight: 'bold',
};

/** ボタングループスタイル */
const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  marginBottom: '8px',
};

/** テストモード用デバッグパネルコンポーネント */
export const TestModePanel: React.FC<TestModePanelProps> = React.memo(({
  onFillRows,
  onClearGrid,
  onBombShake,
  onBlastShake,
  onLineShake,
  onGameOverShake,
  onHighScoreEffect,
  onAddScore,
  onSkillMax,
  onNextStage,
  comboCount,
  comboMultiplier,
  skillCharge,
  score,
  stage,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      style={{
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        borderRadius: '8px',
        padding: '8px',
        marginTop: '8px',
        maxWidth: '360px',
      }}
    >
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isExpanded ? '8px' : '0' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#a78bfa' }}>
          Debug Panel
        </span>
        <button
          onClick={() => setIsExpanded(prev => !prev)}
          aria-label={isExpanded ? 'デバッグパネルを折りたたむ' : 'デバッグパネルを展開する'}
          style={{
            ...buttonStyle,
            padding: '2px 6px',
            fontSize: '10px',
          }}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* 状態表示 */}
          <div style={{
            fontSize: '11px',
            color: '#d1d5db',
            fontFamily: 'monospace',
            marginBottom: '8px',
            padding: '4px 6px',
            backgroundColor: 'rgba(31, 41, 55, 0.8)',
            borderRadius: '4px',
          }}>
            Combo: {comboCount} (x{comboMultiplier.toFixed(1)}) | Skill: {skillCharge}% | Score: {score} | Stage: {stage}
          </div>

          {/* グリッド操作 */}
          <div style={sectionLabelStyle}>Grid</div>
          <div style={buttonGroupStyle}>
            {[1, 2, 3, 4].map(n => (
              <button key={n} style={buttonStyle} onClick={() => onFillRows(n)}>
                {n}行セット
              </button>
            ))}
            <button style={{ ...buttonStyle, borderColor: 'rgba(239, 68, 68, 0.5)' }} onClick={onClearGrid}>
              グリッドクリア
            </button>
          </div>

          {/* エフェクト操作 */}
          <div style={sectionLabelStyle}>Effects</div>
          <div style={buttonGroupStyle}>
            <button style={buttonStyle} onClick={onBombShake}>Bomb</button>
            <button style={buttonStyle} onClick={onBlastShake}>Blast</button>
            <button style={buttonStyle} onClick={onLineShake}>Line</button>
            <button style={buttonStyle} onClick={onGameOverShake}>G.Over</button>
            <button style={buttonStyle} onClick={onHighScoreEffect}>Hi-Score</button>
          </div>

          {/* スコア・ステージ操作 */}
          <div style={sectionLabelStyle}>Controls</div>
          <div style={buttonGroupStyle}>
            <button style={buttonStyle} onClick={onAddScore}>+1000</button>
            <button style={buttonStyle} onClick={onSkillMax}>Skill MAX</button>
            <button style={buttonStyle} onClick={onNextStage}>Next Stage</button>
          </div>
        </>
      )}
    </div>
  );
});

TestModePanel.displayName = 'TestModePanel';
