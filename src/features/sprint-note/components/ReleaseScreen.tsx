import React, { useState, useCallback } from 'react';
import {
  GameContainer,
  PhaseHeader,
  ContentArea,
  ChoiceArea,
  ChoiceButton,
} from './styles';
import TextReveal from './TextReveal';
import { GameState, ReleaseType } from '../types';
import { getQualityWarning, getFullReleaseRisk } from '../utils/game-logic';
import { getSprintPhaseHeader } from '../constants/texts';

type ReleaseScreenProps = {
  state: GameState;
  onSelectRelease: (releaseType: ReleaseType) => void;
};

// リリース判断画面
const ReleaseScreen: React.FC<ReleaseScreenProps> = ({
  state,
  onSelectRelease,
}) => {
  const [showChoices, setShowChoices] = useState(false);
  const [selectedType, setSelectedType] = useState<ReleaseType | undefined>();

  const handleComplete = useCallback(() => {
    setShowChoices(true);
  }, []);

  const handleSelect = useCallback(
    (type: ReleaseType) => {
      if (selectedType) return;
      setSelectedType(type);
      setTimeout(() => onSelectRelease(type), 500);
    },
    [selectedType, onSelectRelease]
  );

  const qualityWarning = getQualityWarning(state.qualityScore);
  const fullReleaseRisk = getFullReleaseRisk(state.qualityScore);

  const header = getSprintPhaseHeader(state.currentSprint, 'リリース判断');
  const paragraphs = [
    '開発が完了した。このスプリントの成果をどうリリースする？',
    qualityWarning,
  ];

  const options: { type: ReleaseType; label: string; desc: string }[] = [
    {
      type: 'full',
      label: '全機能リリース',
      desc: `完成した機能をすべて出す。\n${fullReleaseRisk}`,
    },
    {
      type: 'partial',
      label: '一部を削ってリリース',
      desc: '不安定な部分を切り、安定した機能だけ出す。\n確実だが、届けられる価値は小さくなる。',
    },
    {
      type: 'postpone',
      label: 'リリース延期',
      desc: '今回はリリースしない。次スプリントで品質を上げてから出す。\n品質は守れるが、進捗ゼロと見なされる。',
    },
  ];

  return (
    <GameContainer>
      <PhaseHeader>── {header} ──</PhaseHeader>
      <ContentArea>
        <TextReveal paragraphs={paragraphs} onComplete={handleComplete} />
        {showChoices && (
          <ChoiceArea>
            {options.map(opt => (
              <ChoiceButton
                key={opt.type}
                $selected={selectedType === opt.type}
                $disabled={
                  selectedType !== undefined && selectedType !== opt.type
                }
                onClick={() => handleSelect(opt.type)}
                disabled={selectedType !== undefined}
              >
                <strong>{opt.label}</strong>
                <br />
                <span style={{ fontSize: '13px', opacity: 0.7 }}>
                  {opt.desc}
                </span>
              </ChoiceButton>
            ))}
          </ChoiceArea>
        )}
      </ContentArea>
    </GameContainer>
  );
};

export default ReleaseScreen;
