import React from 'react';
import {
  TutorialLayer,
  TutorialStep,
  TutorialTitle,
  TutorialBody,
  TutorialAction,
} from './styles';

interface Props {
  active: boolean;
  step: number;
  onNext?: () => void;
  onBack?: () => void;
}

// チュートリアルの4ステップ定義
const STEPS = [
  {
    title: '予告を読め',
    body: '上から警告が降りてくる。\n長いほど早く気づける。\nレーン上部の予告段数を確認しよう。',
  },
  {
    title: '回避せよ',
    body: '◀▶ でレーン移動。\n危険レーンから逃げろ。\n障害が降りてくる前に安全な場所へ！',
  },
  {
    title: '倍率とスコア',
    body: '高倍率レーンで回避 = 高得点。\nリスクとリターンのバランスが鍵。\n×1 / ×2 / ×4 を見極めろ。',
  },
  {
    title: 'ビルドを構築',
    body: 'ステージクリアでパーク獲得。\nBUFF で強化、RISK で高倍率。\n組み合わせが戦略を決める。',
  },
];

// チュートリアル画面（4ステップ）
const TutorialScreen: React.FC<Props> = ({ active, step, onNext, onBack }) => {
  const s = STEPS[step] ?? STEPS[0];
  const isLast = step >= STEPS.length - 1;

  return (
    <TutorialLayer $active={active}>
      <TutorialStep>TUTORIAL [{step + 1}/{STEPS.length}]</TutorialStep>
      <TutorialTitle>── {s.title} ──</TutorialTitle>
      <TutorialBody>
        {s.body.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < s.body.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </TutorialBody>
      <TutorialAction $selected onClick={onNext}>
        ● {isLast ? 'START' : 'NEXT'}
      </TutorialAction>
      <TutorialAction onClick={onBack}>
        ◁ BACK
      </TutorialAction>
    </TutorialLayer>
  );
};

export default TutorialScreen;
