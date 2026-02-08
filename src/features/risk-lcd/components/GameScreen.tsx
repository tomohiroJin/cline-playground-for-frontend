import React from 'react';
import type { RenderState } from '../hooks';
import { Layer } from './styles';
import GameHud from './GameHud';
import LaneGrid from './LaneGrid';
import EmotionPanel from './EmotionPanel';
import AnnounceOverlayComp from './AnnounceOverlay';
import PerkSelectScreen from './PerkSelectScreen';

interface Props {
  active: boolean;
  rs: RenderState;
  getLaneInfo: (lane: number) => {
    mult: number;
    restricted: boolean;
    shelter: boolean;
    forecast: string;
  };
}

// ゲーム画面統合（HUD + レーン + キャラ + エモーション）
const GameScreen: React.FC<Props> = ({ active, rs, getLaneInfo }) => {
  const { game } = rs;
  if (!game) return <Layer $active={active} />;

  return (
    <Layer $active={active} style={{ position: 'relative' }}>
      <GameHud game={game} />
      <LaneGrid
        game={game}
        segments={rs.segments}
        segTexts={rs.segTexts}
        laneArt={rs.laneArt}
        beatAnimating={rs.beatAnimating}
        shaking={rs.shaking}
        flash={rs.flash}
        popText={rs.popText}
        getLaneInfo={getLaneInfo}
      />
      <EmotionPanel emoKey={rs.emoKey} frame={game.artFrame} />
      {rs.announce && (
        <AnnounceOverlayComp announce={rs.announce} />
      )}
      {game.phase === 'perks' && game.perkChoices && (
        <PerkSelectScreen
          choices={game.perkChoices}
          selectedIndex={rs.perkIndex}
          perks={game.perks}
        />
      )}
    </Layer>
  );
};

export default GameScreen;
