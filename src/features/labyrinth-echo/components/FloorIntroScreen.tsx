/**
 * 迷宮の残響 - フロアイントロ画面
 */
import { ReactNode } from 'react';
import { Page } from './Page';
import { DiffLabel, FloorProgress, StatSummary } from './GameComponents';
import { LE_IMAGES } from '../images';
import { useKeyboardControl } from '../hooks';
import type { Player, DifficultyDef, MetaState } from '../game-logic';
import type { FloorMetaDef } from '../definitions';

interface FloorIntroScreenProps {
  Particles: ReactNode;
  floor: number;
  floorMeta: FloorMetaDef;
  floorColor: string;
  diff: DifficultyDef | null;
  meta: MetaState;
  progressPct: number;
  player: Player | null;
  chainNext: string | null;
  enterFloor?: (() => void) | null;
}

export const FloorIntroScreen = ({ Particles, floor, floorMeta, floorColor, diff, meta, progressPct, player, chainNext, enterFloor }: FloorIntroScreenProps) => {
  const { selectedIndex } = useKeyboardControl({
    optionsCount: enterFloor ? 1 : 0,
    onSelect: () => { if (enterFloor) enterFloor(); },
    isActive: !!enterFloor
  });

  return (
    <Page particles={Particles} floor={floor}>
    <div className="card tc" style={{ marginTop: "10vh", animation: "floorReveal .9s ease" }}>
      <div style={{ fontSize: 11, color: floorColor, letterSpacing: 8, marginBottom: 14, fontFamily: "var(--sans)", opacity: .8, fontWeight: 600 }}>FLOOR {floor}</div>
      <h2 style={{ fontSize: 32, color: floorColor, letterSpacing: 6, marginBottom: 10, animation: "glow 3s ease-in-out infinite", lineHeight: 1.5, textShadow: `0 0 30px ${floorColor}40` }}>{floorMeta.name}</h2>
      <p style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.8, marginBottom: 20, fontFamily: "var(--sans)" }}>{floorMeta.desc}</p>
      <div style={{
        width: "100%", height: 160, marginBottom: 20, borderRadius: 8, overflow: "hidden", position: "relative",
        border: `1px solid ${floorColor}40`, boxShadow: `0 0 20px ${floorColor}15`
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${(LE_IMAGES.floors as Record<number, string>)[floor] || LE_IMAGES.floors[1]})`,
          backgroundSize: "cover", backgroundPosition: "center",
          transition: "transform 10s ease-out", animation: "panImage 20s infinite alternate"
        }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 0%, ${floorColor}10 100%)` }} />
      </div>
      <DiffLabel diff={diff} />
      {meta.unlocked.length > 0 && <div style={{ fontSize: 10, color: "#818cf8", fontFamily: "var(--sans)", marginBottom: 12, opacity: .7 }}>継承効果 {meta.unlocked.length}個 有効</div>}
      <FloorProgress pct={progressPct} color={floorColor} />
      {player && <div style={{ marginTop: 24, marginBottom: 20 }}><StatSummary player={player} /></div>}
      {chainNext && <div style={{ fontSize: 11, color: "#60a5fa", fontFamily: "var(--sans)", marginBottom: 12, animation: "pulse 2s infinite" }}>… 何かが待ち構えている</div>}
      <button className={`btn btn-p tc ${selectedIndex === 0 ? 'selected' : ''}`} style={{ fontSize: 15 }} onClick={() => { if (enterFloor) enterFloor(); }}>
        {floor === 1 ? "迷宮に踏み込む" : `第${floor}層へ降りる`}
      </button>
    </div>
  </Page>
  );
};
