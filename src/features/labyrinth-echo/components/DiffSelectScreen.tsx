/**
 * 迷宮の残響 - 難易度選択画面
 */
import type { ReactNode } from 'react';
import { CFG } from '../domain/constants/config';
import { DIFFICULTY } from '../domain/constants/difficulty-defs';
import type { FxState } from '../domain/models/unlock';
import type { DifficultyDef } from '../domain/models/difficulty';
import type { MetaState } from '../domain/models/meta-state';
import type { UIPhase } from '../presentation/hooks/use-game-orchestrator';
import { Page } from './Page';
import { DiffCard, BackBtn } from './GameComponents';

/** 難易度選択画面の Props */
interface DiffSelectScreenProps {
  Particles: ReactNode;
  fx: FxState;
  meta: MetaState;
  selectDiff: (d: DifficultyDef) => void;
  setPhase: (phase: UIPhase) => void;
}

export const DiffSelectScreen = ({ Particles, fx, meta, selectDiff, setPhase }: DiffSelectScreenProps) => (
  <Page particles={Particles}>
    <div className="card" style={{ marginTop: "4vh", animation: "fadeUp .5s ease" }}>
      <h2 style={{ fontSize: 22, color: "#c4b5fd", letterSpacing: 4, textAlign: "center", marginBottom: 6 }}>難易度選択</h2>
      <p style={{ fontSize: 11, color: "var(--dim)", textAlign: "center", marginBottom: 24, fontFamily: "var(--sans)" }}>高難度ほど獲得知見ポイントが増加する</p>
      {DIFFICULTY.map(d => (
        <DiffCard key={d.id} d={d}
          hp={CFG.BASE_HP + fx.hpBonus + d.modifiers.hpMod}
          mn={CFG.BASE_MN + fx.mentalBonus + d.modifiers.mnMod}
          inf={CFG.BASE_INF + fx.infoBonus}
          cleared={meta.clearedDifficulties?.includes(d.id)}
          onSelect={selectDiff} />
      ))}
      <BackBtn onClick={() => setPhase("title")} />
    </div>
  </Page>
);
