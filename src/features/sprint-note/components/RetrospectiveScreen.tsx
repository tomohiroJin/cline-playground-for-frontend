import React, { useState, useCallback } from 'react';
import {
  GameContainer,
  PhaseHeader,
  ContentArea,
  ChoiceArea,
  ChoiceButton,
  NextButton,
} from './styles';
import TextReveal from './TextReveal';
import { GameState } from '../types';
import {
  getImprovementCandidates,
  getRetrospectiveNarrative,
} from '../utils/game-logic';
import { MAX_SPRINT } from '../constants/game-config';
import { getSprintPhaseHeader } from '../constants/texts';

type RetrospectiveScreenProps = {
  state: GameState;
  onSelectImprovement: (improvementId: string) => void;
  onAdvance: () => void;
};

// 振り返り画面
const RetrospectiveScreen: React.FC<RetrospectiveScreenProps> = ({
  state,
  onSelectImprovement,
  onAdvance,
}) => {
  const [showChoices, setShowChoices] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [improvementSelected, setImprovementSelected] = useState(false);

  const isFinalSprint = state.currentSprint >= MAX_SPRINT;
  const candidates = isFinalSprint
    ? undefined
    : getImprovementCandidates(state.currentSprint, state);
  const narrative = isFinalSprint
    ? getRetrospectiveNarrative(state)
    : '';

  const handleComplete = useCallback(() => {
    setShowChoices(true);
  }, []);

  const handleSelectImprovement = useCallback(
    (id: string) => {
      if (selectedId) return;
      setSelectedId(id);
      onSelectImprovement(id);
      // 改善アクション選択後、ADVANCE_PHASE で次スプリントへ遷移
      setTimeout(() => {
        setImprovementSelected(true);
      }, 500);
    },
    [selectedId, onSelectImprovement]
  );

  // 改善アクション選択完了後、次スプリントへ遷移
  const handleAdvanceAfterImprovement = useCallback(() => {
    onAdvance();
  }, [onAdvance]);

  const header = getSprintPhaseHeader(state.currentSprint, '振り返り');

  if (isFinalSprint) {
    // Sprint 3: ナレーション表示 → 結果を見る
    const paragraphs = [
      '3スプリントを走りきった。',
      narrative,
      'このプロジェクトで、チームは何を学んだだろうか。',
    ];

    return (
      <GameContainer>
        <PhaseHeader>── {header} ──</PhaseHeader>
        <ContentArea>
          <TextReveal paragraphs={paragraphs} onComplete={handleComplete} />
        </ContentArea>
        {showChoices && (
          <NextButton onClick={onAdvance}>結果を見る</NextButton>
        )}
      </GameContainer>
    );
  }

  // Sprint 1, 2: 改善アクション選択
  const paragraphs = [
    'このスプリントを振り返って、次に向けた改善を1つ選ぼう。',
  ];

  return (
    <GameContainer>
      <PhaseHeader>── {header} ──</PhaseHeader>
      <ContentArea>
        <TextReveal paragraphs={paragraphs} onComplete={handleComplete} />
        {showChoices && candidates && !improvementSelected && (
          <ChoiceArea>
            {candidates.map(imp => (
              <ChoiceButton
                key={imp.id}
                $selected={selectedId === imp.id}
                $disabled={
                  selectedId !== undefined && selectedId !== imp.id
                }
                onClick={() => handleSelectImprovement(imp.id)}
                disabled={selectedId !== undefined}
              >
                <strong>{imp.name}</strong>
                <br />
                <span style={{ fontSize: '13px', opacity: 0.7 }}>
                  {imp.description}
                </span>
              </ChoiceButton>
            ))}
          </ChoiceArea>
        )}
        {improvementSelected && (
          <NextButton onClick={handleAdvanceAfterImprovement}>
            次のスプリントへ
          </NextButton>
        )}
      </ContentArea>
    </GameContainer>
  );
};

export default RetrospectiveScreen;
