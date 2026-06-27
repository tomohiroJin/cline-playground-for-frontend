/**
 * 迷宮の残響 - 難易度選択画面
 * echoDepth > 0 のとき残響圧セレクタを表示し、選択された圧を selectDiff に渡す
 */
import { useState, type ReactNode } from 'react';
import { CFG } from '../domain/constants/config';
import { DIFFICULTY } from '../domain/constants/difficulty-defs';
import { maxSelectablePressure, applyPressureToDifficulty } from '../domain/services/pressure-service';
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
  selectDiff: (d: DifficultyDef, pressure: number) => void;
  setPhase: (phase: UIPhase) => void;
}

export const DiffSelectScreen = ({ Particles, fx, meta, selectDiff, setPhase }: DiffSelectScreenProps) => {
  const maxP = maxSelectablePressure(meta.echoDepth);
  const [pressure, setPressure] = useState(0);
  // echoDepth が変化した場合に maxP を超えないよう制限
  const p = Math.min(pressure, maxP);

  return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: "4vh", animation: "fadeUp .5s ease" }}>
        <h2 style={{ fontSize: 22, color: "#c4b5fd", letterSpacing: 4, textAlign: "center", marginBottom: 6 }}>難易度選択</h2>
        <p style={{ fontSize: 11, color: "var(--dim)", textAlign: "center", marginBottom: 16, fontFamily: "var(--sans)" }}>高難度ほど獲得知見ポイントが増加する</p>

        {/* echoDepth > 0 のときのみ残響圧セレクタを表示 */}
        {maxP > 0 && (
          <div style={{ textAlign: "center", marginBottom: 20, fontFamily: "var(--sans)" }}>
            <div style={{ fontSize: 12, color: "#f43f5e", letterSpacing: 2, marginBottom: 6 }}>残響圧 {p} / {maxP}</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
              {Array.from({ length: maxP + 1 }, (_, i) => (
                <button key={i} onClick={() => setPressure(i)} style={{
                  width: 30, height: 30, borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700,
                  background: i <= p ? "rgba(244,63,94,0.18)" : "rgba(20,20,35,0.4)",
                  border: `1px solid ${i === p ? "rgba(244,63,94,0.6)" : "rgba(60,40,50,0.3)"}`,
                  color: i <= p ? "#fda4af" : "#505070",
                }}>{i}</button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 8, lineHeight: 1.6 }}>
              {p === 0 ? "圧をかけると迷宮が手強く化け、亡霊が現れる。報酬も増える。" : "侵蝕とダメージが増し、発見した先人の亡霊が襲来する。KP報酬が増加。"}
            </div>
          </div>
        )}

        {/* 圧適用後の実効値で各難易度カードを表示 */}
        {DIFFICULTY.map(d => {
          const eff = applyPressureToDifficulty(d, p);
          return (
            <DiffCard key={d.id} d={d}
              hp={CFG.BASE_HP + fx.hpBonus + eff.modifiers.hpMod}
              mn={CFG.BASE_MN + fx.mentalBonus + eff.modifiers.mnMod}
              inf={CFG.BASE_INF + fx.infoBonus}
              cleared={meta.clearedDifficulties?.includes(d.id)}
              onSelect={(picked) => selectDiff(picked, p)} />
          );
        })}
        <BackBtn onClick={() => setPhase("title")} />
      </div>
    </Page>
  );
};
