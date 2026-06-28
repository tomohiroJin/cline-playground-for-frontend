/**
 * 迷宮の残響 - 第6階層（終章）画面
 * finaleStep 0 は offer（さらに深く/脱出）、1..3 は FINALE_BEATS を描画する。
 */
import type { ReactNode } from 'react';
import { FINALE_BEATS } from '../../../domain/constants/finale-defs';
import type { FinaleDecision } from '../../../domain/models/finale';
import { Page } from '../../../components/Page';

interface FinaleScreenProps {
  Particles: ReactNode;
  finaleStep: number;
  onEscape: () => void;
  onAdvance: () => void;
  onDecide: (decision: FinaleDecision) => void;
}

export const FinaleScreen = ({ Particles, finaleStep, onEscape, onAdvance, onDecide }: FinaleScreenProps) => {
  // offer: さらに深く潜る / ここで脱出する
  if (finaleStep === 0) {
    return (
      <Page particles={Particles}>
        <div className="card" style={{ marginTop: "6vh", animation: "fadeUp .6s ease", textAlign: "center" }}>
          <h2 style={{ fontSize: 20, color: "#c4b5fd", letterSpacing: 4, marginBottom: 10 }}>さらなる深淵</h2>
          <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 1.9, fontFamily: "var(--sans)", marginBottom: 20 }}>
            帰り道の先に、まだ下りていく階段が見える。迷宮の最も深い場所が、お前を呼んでいる。
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn btn-p tc" onClick={onAdvance} aria-label="さらに深く潜る">さらに深く潜る</button>
            <button className="btn tc" onClick={onEscape} aria-label="ここで脱出する">ここで脱出する</button>
          </div>
        </div>
      </Page>
    );
  }

  const beat = FINALE_BEATS[finaleStep - 1];
  // 範囲外の finaleStep は何も描画しない
  if (!beat) return null;

  return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: "5vh", animation: "fadeUp .6s ease" }}>
        <h2 style={{ fontSize: 20, color: "#c4b5fd", letterSpacing: 4, textAlign: "center", marginBottom: 14 }}>{beat.title}</h2>
        <p style={{ fontSize: 13, color: "#d8d8e8", lineHeight: 2.0, fontFamily: "var(--sans)", marginBottom: 22 }}>{beat.text}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {beat.choices.map((c, i) => (
            <button key={`${beat.id}_${i}`} className="btn btn-p tc"
              onClick={() => (c.decision ? onDecide(c.decision) : onAdvance())}
              aria-label={c.label}>{c.label}</button>
          ))}
        </div>
      </div>
    </Page>
  );
};
