import React from 'react';
import type { GameState } from '../types';
import {
  Hud,
  HudScore,
  HudMid,
  HudCombo,
  HudPerks,
  HudRight,
  HudStage,
  HudCycle,
  HudShield,
} from './styles';

interface Props {
  game: GameState;
}

// スコア/ステージ/サイクル/コンボ/シールド表示
const GameHud: React.FC<Props> = ({ game }) => {
  const cfg = game.curStgCfg;

  return (
    <Hud>
      <HudScore>{game.score}</HudScore>
      <HudMid>
        <HudCombo $visible={game.comboCount >= 2}>
          {game.comboCount}COMBO
        </HudCombo>
        <HudPerks>{game.perks.map((p) => p.ic).join('')}</HudPerks>
      </HudMid>
      <HudRight>
        {game.st.sh > 0 && (
          <HudShield $empty={game.shields <= 0}>
            {'◆'.repeat(Math.max(0, game.shields))}
          </HudShield>
        )}
        <HudStage>ST{game.stage + 1}</HudStage>
        <HudCycle>
          {game.cycle}/{cfg?.cy ?? 0}
        </HudCycle>
      </HudRight>
    </Hud>
  );
};

export default GameHud;
