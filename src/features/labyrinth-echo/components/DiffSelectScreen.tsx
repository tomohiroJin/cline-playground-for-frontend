/**
 * 迷宮の残響 - 難易度選択画面
 * echoDepth > 0 のとき残響圧セレクタを表示し、選択された圧を selectDiff に渡す
 * 解禁済みレガシーが1つ以上あるとき継承セレクタを表示する
 */
import { useState, type ReactNode } from 'react';
import { CFG } from '../domain/constants/config';
import { DIFFICULTY } from '../domain/constants/difficulty-defs';
import { maxSelectablePressure, applyPressureToDifficulty } from '../domain/services/pressure-service';
import { unlockedLegacies, mergeLegacyIntoFx, getLegacyById } from '../domain/services/legacy-service';
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
  selectDiff: (d: DifficultyDef, pressure: number, legacyId: string | null) => void;
  setPhase: (phase: UIPhase) => void;
}

export const DiffSelectScreen = ({ Particles, fx, meta, selectDiff, setPhase }: DiffSelectScreenProps) => {
  const maxP = maxSelectablePressure(meta.echoDepth);
  const [pressure, setPressure] = useState(0);
  // echoDepth が変化した場合に maxP を超えないよう制限
  const p = Math.min(pressure, maxP);

  // 解禁済みレガシー一覧と継承選択状態
  const legacies = unlockedLegacies(meta.fragments);
  const [legacyId, setLegacyId] = useState<string | null>(null);
  const selectedLegacy = getLegacyById(legacyId);
  // レガシー反映後の実効 fx（プレビュー用）
  const previewFx = mergeLegacyIntoFx(fx, selectedLegacy);

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

        {/* 解禁済みレガシーが1つ以上あるとき継承セレクタを表示 */}
        {legacies.length > 0 && (
          <div style={{ textAlign: "center", marginBottom: 20, fontFamily: "var(--sans)" }}>
            <div style={{ fontSize: 12, color: "#fbbf24", letterSpacing: 2, marginBottom: 6 }}>残響継承</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setLegacyId(null)} style={{
                padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "var(--sans)",
                background: legacyId === null ? "rgba(99,102,241,0.18)" : "rgba(20,20,35,0.4)",
                border: `1px solid ${legacyId === null ? "rgba(99,102,241,0.6)" : "rgba(60,60,80,0.3)"}`,
                color: legacyId === null ? "#a5b4fc" : "#505070",
              }}>継承なし</button>
              {legacies.map(l => (
                <button key={l.id} onClick={() => setLegacyId(l.id)} style={{
                  padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "var(--sans)",
                  background: legacyId === l.id ? `${l.color}22` : "rgba(20,20,35,0.4)",
                  border: `1px solid ${legacyId === l.id ? `${l.color}99` : "rgba(60,60,80,0.3)"}`,
                  color: legacyId === l.id ? l.color : "#505070",
                }}>
                  {/* アイコンを aria-hidden で分離し、名前テキストを独立した span に保持 */}
                  <span aria-hidden="true">{l.icon} </span>
                  <span>{l.name}</span>
                </button>
              ))}
            </div>
            {selectedLegacy && (
              <div style={{ fontSize: 10, marginTop: 8, lineHeight: 1.7 }}>
                <span style={{ color: "#4ade80" }}>＋{selectedLegacy.upside}</span>
                <span style={{ color: "#505070" }}> ／ </span>
                <span style={{ color: "#f87171" }}>−{selectedLegacy.downside}</span>
              </div>
            )}
          </div>
        )}

        {/* 圧適用後の実効値で各難易度カードを表示（侵蝕/被ダメも実効値にするため eff を渡す） */}
        {DIFFICULTY.map(d => {
          const eff = applyPressureToDifficulty(d, p);
          return (
            <DiffCard key={d.id} d={eff}
              hp={CFG.BASE_HP + previewFx.hpBonus + eff.modifiers.hpMod}
              mn={CFG.BASE_MN + previewFx.mentalBonus + eff.modifiers.mnMod}
              inf={CFG.BASE_INF + previewFx.infoBonus}
              cleared={meta.clearedDifficulties?.includes(d.id)}
              // 圧は selectDiff 側で適用されるため、基底難易度 d を渡して二重適用を防ぐ
              onSelect={() => selectDiff(d, p, legacyId)} />
          );
        })}
        <BackBtn onClick={() => setPhase("title")} />
      </div>
    </Page>
  );
};
