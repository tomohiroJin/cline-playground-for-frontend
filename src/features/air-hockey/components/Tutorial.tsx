import React, { useState } from 'react';
import { StartButton } from '../styles';

const TUTORIAL_KEY = 'air_hockey_tutorial_completed';

type TutorialStep = {
  title: string;
  description: string;
  icon: string;
  details?: string[];
};

// チュートリアルステップ定義
const STEPS: TutorialStep[] = [
  {
    title: 'マレットを動かそう',
    description: '画面をタッチまたはマウスでマレット（下の青い丸）を操作します',
    icon: '👆',
  },
  {
    title: 'パックを打ち返そう',
    description: 'パック（白い丸）をマレットで弾いて相手のゴールに入れましょう',
    icon: '🏒',
  },
  {
    title: 'ゴールを決めよう',
    description: '画面上部の相手ゴールにパックを入れると得点！先に目標スコアに達した方が勝ちです',
    icon: '🎯',
  },
  {
    title: 'アイテムを活用しよう',
    description: 'フィールドに現れるアイテムをゴールに入れると効果が発動します',
    icon: '⚡',
    details: [
      '◆ Split: パックが3つに分裂',
      '⚡ Speed: 速度変化ゾーン発生',
      '👻 Hide: パックが一時的に透明化',
      '🛡 Shield: ゴール前にバリア（1回防御）',
      '🧲 Magnet: パックを引き寄せる磁力',
      '⬆ Big: マレットが1.5倍に拡大',
    ],
  },
  {
    title: 'フィールドを選ぼう',
    description: '6種類のフィールドにはそれぞれ特徴があります',
    icon: '🗺',
    details: [
      'Original: シンプルな基本フィールド',
      'Wide: ゴールが広い（攻守激しい）',
      'Pillars: 中央に障害物の柱',
      'Zigzag: ジグザグ配置の障害物',
      'Fortress: 破壊可能な壁でゴールを防御',
      'Bastion: 大量の破壊可能ブロック',
    ],
  },
  {
    title: 'ゲーム中の操作',
    description: '便利な機能を使いこなしましょう',
    icon: '🎮',
    details: [
      'Escape / P キー: ポーズ（一時停止）',
      '? ボタン: ヘルプ表示',
      '連続得点でコンボ発動！',
      'フィーバーモード: 一定時間得点なしでパック増加',
    ],
  },
];

export const isTutorialCompleted = (): boolean => {
  return localStorage.getItem(TUTORIAL_KEY) === 'true';
};

export const markTutorialCompleted = (): void => {
  localStorage.setItem(TUTORIAL_KEY, 'true');
};

type TutorialProps = {
  onComplete: () => void;
  isHelp?: boolean;
};

export const Tutorial: React.FC<TutorialProps> = ({ onComplete, isHelp = false }) => {
  const [step, setStep] = useState(0);
  const currentStep = STEPS[step];

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      if (!isHelp) markTutorialCompleted();
      onComplete();
    }
  };

  const handleSkip = () => {
    if (!isHelp) markTutorialCompleted();
    onComplete();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(13, 17, 23, 0.95)',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid rgba(0, 210, 255, 0.3)',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{currentStep.icon}</div>
        <h2 style={{ color: 'var(--accent-color)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
          {currentStep.title}
        </h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: currentStep.details ? '1rem' : '2rem' }}>
          {currentStep.description}
        </p>
        {currentStep.details && (
          <div style={{
            textAlign: 'left',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '1.5rem',
          }}>
            {currentStep.details.map((detail, i) => (
              <div key={i} style={{ color: '#ccc', fontSize: '0.8rem', lineHeight: 1.8, paddingLeft: '4px' }}>
                {detail}
              </div>
            ))}
          </div>
        )}

        {/* ステップインジケーター */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.5rem' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: i === step ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.2)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleSkip}
            style={{
              background: 'none',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#888',
              padding: '10px 20px',
              borderRadius: '25px',
              cursor: 'pointer',
            }}
          >
            スキップ
          </button>
          <StartButton onClick={handleNext} style={{ marginTop: 0 }}>
            {step < STEPS.length - 1 ? '次へ' : 'はじめる'}
          </StartButton>
        </div>
      </div>
    </div>
  );
};
