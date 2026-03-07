import React, { useState } from 'react';
import { StartButton } from '../styles';

const TUTORIAL_KEY = 'air_hockey_tutorial_completed';

// チュートリアルステップ定義
const STEPS = [
  {
    title: 'マレットを動かそう',
    description: '画面をタッチまたはマウスでマレット（下の丸）を操作します',
    icon: '👆',
  },
  {
    title: 'パックを打ち返そう',
    description: 'パック（中央の白い丸）をマレットで弾いて相手のゴールに入れましょう',
    icon: '🏒',
  },
  {
    title: 'ゴールを決めよう',
    description: '画面上部の相手ゴールにパックを入れると得点です',
    icon: '🎯',
  },
  {
    title: 'アイテムを活用しよう',
    description: 'フィールドに現れるアイテムに触れると特殊効果が発動します',
    icon: '⚡',
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
};

export const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const currentStep = STEPS[step];

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      markTutorialCompleted();
      onComplete();
    }
  };

  const handleSkip = () => {
    markTutorialCompleted();
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
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid rgba(0, 210, 255, 0.3)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{currentStep.icon}</div>
        <h2 style={{ color: 'var(--accent-color)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
          {currentStep.title}
        </h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          {currentStep.description}
        </p>

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
