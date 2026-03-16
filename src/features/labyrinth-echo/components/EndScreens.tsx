/**
 * 迷宮の残響 - ゲームオーバー・勝利画面
 */
import React from 'react';
import { ENDINGS, DEATH_FLAVORS, DEATH_TIPS } from '../domain/constants/ending-defs';
import type { FloorMetaDef } from '../domain/constants/floor-meta';
import type { EndingDef } from '../domain/models/ending';
import type { LogEntry } from '../domain/models/game-state';
import type { Player } from '../domain/models/player';
import type { DifficultyDef } from '../domain/models/difficulty';
import type { MetaState } from '../domain/models/meta-state';
import { Page } from './Page';
import { Section } from './Section';
import { DiffLabel, RecordPanel, EndingGrid } from './GameComponents';
import { LE_IMAGES } from '../images';
import { useKeyboardControl } from '../presentation/hooks/use-keyboard-control';

/** ゲームオーバー画面の Props */
interface GameOverScreenProps {
  Particles: React.ReactNode;
  player: Player | null;
  meta: MetaState;
  diff: DifficultyDef | null;
  floor: number;
  floorMeta: FloorMetaDef;
  floorColor: string;
  progressPct: number;
  log: readonly LogEntry[];
  usedSecondLife: boolean;
  startRun: () => void;
  setPhase: (phase: string) => void;
}

/** ゲームオーバー画面 */
export const GameOverScreen = ({ Particles, player, meta, diff, floor, floorMeta, floorColor, progressPct, log, usedSecondLife, startRun, setPhase }: GameOverScreenProps) => {
  const deathCause = (player?.hp ?? 0) <= 0 ? "体力消耗" : "精神崩壊";
  const flavors = DEATH_FLAVORS[deathCause];
  const flavor = flavors[meta.runs % flavors.length];

  const menuActions = [
    startRun,
    ...(meta.kp > 0 ? [() => setPhase("unlocks")] : []),
    () => setPhase("title"),
  ];
  const { selectedIndex, setSelectedIndex } = useKeyboardControl({
    optionsCount: menuActions.length,
    onSelect: (idx) => menuActions[idx](),
    isActive: true
  });

  return (
    <Page particles={Particles} floor={floor}>
      <div className="card tc" style={{ marginTop: "8vh", animation: "fadeUp .8s" }}>
        <div style={{ fontSize: 10, color: "#f87171", letterSpacing: 6, marginBottom: 14, fontFamily: "var(--sans)", fontWeight: 600 }}>EXPLORATION FAILED</div>
        <h2 style={{ fontSize: 30, color: "var(--bright)", letterSpacing: 5, marginBottom: 10, lineHeight: 1.5 }}>探索失敗</h2>
        <div style={{
          width: "100%", height: 180, margin: "16px 0 24px", borderRadius: 12, overflow: "hidden", position: "relative",
          border: "1px solid #f8717140", boxShadow: "0 0 30px #f8717115"
        }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${LE_IMAGES.gameover})`,
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "grayscale(0.8) contrast(1.2)"
          }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent, rgba(15,23,42,0.8))" }} />
        </div>
        <DiffLabel diff={diff} />
        <p style={{ fontSize: 13, color: "#a0a0c0", lineHeight: 1.9, marginBottom: 12, fontFamily: "var(--sans)", whiteSpace: "pre-wrap" }}>{flavor}</p>
        <p style={{ fontSize: 11, color: "var(--dim)", marginBottom: 24, fontFamily: "var(--sans)" }}>しかし、得た知見は失われない。</p>
        <div className="divider" style={{ margin: "0 auto 24px" }} />
        <RecordPanel labelText="探索記録" entries={[
          { label: "到達",       color: floorColor, value: `${floorMeta.name}（第${floor}層）` },
          { label: "通過イベント", color: "#fbbf24", value: `${log.length}件` },
          { label: "全体進捗",   color: "#818cf8", value: `${Math.round(progressPct)}%` },
          { label: "死因",       color: "#f87171", value: deathCause },
          ...(usedSecondLife ? [{ label: "二度目の命", color: "#fbbf24", value: "発動済（使い切り）" }] : []),
          { label: "状態異常",   color: (player?.statuses?.length ?? 0) > 0 ? "#f87171" : "#4ade80", value: (player?.statuses?.length ?? 0) > 0 ? player!.statuses.join("・") : "なし" },
        ]} />
        <div style={{ padding: "10px 16px", background: "rgba(74,222,128,.04)", borderRadius: 10, border: "1px solid rgba(74,222,128,.1)", marginBottom: 16, animation: "popIn .4s ease .3s both" }}>
          <div style={{ fontSize: 12, color: "#4ade80", fontFamily: "var(--sans)", fontWeight: 700, textAlign: "center" }}>
            獲得知見 +{diff?.rewards.kpOnDeath ?? 2}pt
            <span style={{ fontSize: 10, color: "#706080", fontWeight: 400, marginLeft: 6 }}>（合計 {meta.kp}pt）</span>
          </div>
        </div>
        <Section style={{ background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.1)", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#818cf8", fontFamily: "var(--sans)", fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>💡 助言</div>
          <p style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--sans)", lineHeight: 1.8, margin: 0 }}>
            {DEATH_TIPS[deathCause][meta.runs % DEATH_TIPS[deathCause].length]}
          </p>
          <p style={{ fontSize: 10, color: "#505070", fontFamily: "var(--sans)", lineHeight: 1.6, marginTop: 6, margin: 0 }}>
            {floor <= 2 ? DEATH_TIPS.early : floor <= 4 ? DEATH_TIPS.mid : DEATH_TIPS.late}
          </p>
        </Section>
        <button className={`btn btn-p tc ${selectedIndex === 0 ? 'selected' : ''}`} style={{ fontSize: 15 }} onMouseEnter={() => setSelectedIndex(0)} onClick={startRun}>再び挑む</button>
        {meta.kp > 0 && <button className={`btn tc ${selectedIndex === 1 ? 'selected' : ''}`} onMouseEnter={() => setSelectedIndex(1)} onClick={() => setPhase("unlocks")}>知見の継承 ◈ {meta.kp}pt</button>}
        <button className={`btn tc ${selectedIndex === (meta.kp > 0 ? 2 : 1) ? 'selected' : ''}`} onMouseEnter={() => setSelectedIndex(meta.kp > 0 ? 2 : 1)} onClick={() => setPhase("title")}>タイトル</button>
      </div>
    </Page>
  );
};

/** エンディング画像マップのキー型 */
type EndingImageKey = keyof typeof LE_IMAGES.endings;

/** 勝利画面の Props */
interface VictoryScreenProps {
  Particles: React.ReactNode;
  ending: EndingDef | null;
  isNewEnding: boolean;
  isNewDiffClear: boolean;
  diff: DifficultyDef | null;
  player: Player | null;
  usedSecondLife: boolean;
  log: readonly LogEntry[];
  meta: MetaState;
  floor: number;
  startRun: () => void;
  setPhase: (phase: string) => void;
}

/** 勝利画面（マルチエンディング） */
export const VictoryScreen = ({ Particles, ending, isNewEnding, isNewDiffClear, diff, player, usedSecondLife, log, meta, floor, startRun, setPhase }: VictoryScreenProps) => {
  const end = ending ?? ENDINGS[ENDINGS.length - 1];
  const totalKp = (diff?.rewards.kpOnWin ?? 4) + end.bonusKp;
  const endingKey = end.id as EndingImageKey;
  const bgImg = LE_IMAGES.endings[endingKey] || LE_IMAGES.endings.standard;

  const menuActions = [
    startRun,
    () => setPhase("unlocks"),
    () => setPhase("title"),
  ];
  const { selectedIndex, setSelectedIndex } = useKeyboardControl({
    optionsCount: menuActions.length,
    onSelect: (idx) => menuActions[idx](),
    isActive: true
  });

  return (
    <Page particles={Particles} floor={floor}>
      <style>{`
        @keyframes endingBgReveal {
          0% { filter: blur(20px); opacity: 0; transform: scale(1.1); }
          50% { filter: blur(10px); opacity: 0.6; transform: scale(1.05); }
          100% { filter: blur(0px); opacity: 1; transform: scale(1); }
        }
        @keyframes customEndingParticle {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(-300px); opacity: 0; }
        }
      `}</style>
      <div style={{
        position: "fixed", inset: 0, zIndex: -2, pointerEvents: "none",
        backgroundImage: `url(${bgImg})`,
        backgroundSize: "cover", backgroundPosition: "center",
        animation: "endingBgReveal 5s ease-out forwards",
      }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(10,10,24,0.3) 0%, rgba(10,10,24,0.85) 100%)"
      }} />
      {/* 舞い上がるパーティクル */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", overflow: "hidden" }}>
        {[...Array(30)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: Math.random() * 4 + 2, height: Math.random() * 4 + 2,
            background: end.color, borderRadius: "50%", boxShadow: `0 0 10px ${end.color}`,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 20 + 80}%`,
            animation: `customEndingParticle ${Math.random() * 5 + 5}s ease-in infinite ${Math.random() * 5}s`
          }} />
        ))}
      </div>
      {/* テキスト上のシミトランスペアレントレイヤー */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none",
        backgroundImage: `url(${bgImg})`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.05, mixBlendMode: "screen",
      }} />

      <div className="card tc" style={{ marginTop: "6vh", animation: "fadeUp .8s", borderColor: `${end.color}30`, background: "rgba(14, 14, 28, 0.75)", backdropFilter: "blur(8px)" }}>
        <div style={{ fontSize: 10, color: end.color, letterSpacing: 6, marginBottom: 8, fontFamily: "var(--sans)", fontWeight: 600 }}>{end.subtitle}</div>
        <div style={{ fontSize: 48, marginBottom: 12, animation: "endingGlow 3s ease-in-out infinite", lineHeight: 1 }}>{end.icon}</div>
        {isNewEnding && <div style={{ display: "inline-block", padding: "2px 12px", borderRadius: 12, fontSize: 10, fontFamily: "var(--sans)", fontWeight: 700, background: `${end.color}20`, border: `1px solid ${end.color}40`, color: end.color, marginBottom: 8, letterSpacing: 2, animation: "pulse 2s infinite" }}>★ NEW ENDING ★</div>}
        {isNewDiffClear && <div style={{ display: "inline-block", padding: "2px 12px", borderRadius: 12, fontSize: 10, fontFamily: "var(--sans)", fontWeight: 700, background: `${diff?.color ?? "#818cf8"}20`, border: `1px solid ${diff?.color ?? "#818cf8"}40`, color: diff?.color ?? "#818cf8", marginBottom: 8, marginLeft: isNewEnding ? 6 : 0, letterSpacing: 2, animation: "pulse 2s infinite 0.3s" }}>🏆 {diff?.name}初クリア</div>}
        <h2 style={{ fontSize: 28, color: end.color, letterSpacing: 5, marginBottom: 20, lineHeight: 1.5, textShadow: `0 0 30px ${end.color}40` }}>{end.name}</h2>

        <DiffLabel diff={diff} />
        <p style={{ fontSize: 13, color: "#a0a0c0", lineHeight: 2, marginBottom: 24, fontFamily: "var(--sans)", whiteSpace: "pre-wrap" }}>{end.description}</p>
        <div style={{ width: 80, height: 2, background: end.gradient, margin: "0 auto 24px", borderRadius: 2 }} />
        <RecordPanel labelText="生還記録" labelColor={end.color} borderColor={`${end.color}20`} entries={[
          { label: "エンディング", color: end.color, value: end.name },
          { label: "難易度",     color: diff?.color ?? "#818cf8", value: `${diff?.icon ?? ""}${diff?.name ?? "通常"}` },
          { label: "残存HP",     color: "#f87171", value: `${player?.hp}/${player?.maxHp}` },
          { label: "残存精神",   color: "#818cf8", value: `${player?.mn}/${player?.maxMn}` },
          { label: "情報値",     color: "#fbbf24", value: `${player?.inf}` },
          { label: "状態異常",   color: (player?.statuses?.length ?? 0) > 0 ? "#f87171" : "#4ade80", value: (player?.statuses?.length ?? 0) > 0 ? player!.statuses.join("・") : "なし" },
          ...(usedSecondLife ? [{ label: "二度目の命", color: "#fbbf24", value: "発動（復活1回消費）" }] : []),
          { label: "通過イベント", color: "#c084fc", value: `${log.length}件` },
        ]} />
        <div style={{ padding: "12px 16px", background: "rgba(251,191,36,.05)", borderRadius: 10, border: "1px solid rgba(251,191,36,.12)", marginBottom: 20, animation: "popIn .4s ease .3s both" }}>
          <div style={{ fontSize: 13, color: "#fbbf24", fontFamily: "var(--sans)", fontWeight: 700, textAlign: "center" }}>
            獲得知見 +{totalKp}pt
            <span style={{ fontSize: 10, color: "#706080", fontWeight: 400, marginLeft: 6 }}>（基本{diff?.rewards.kpOnWin ?? 4} + ED{end.bonusKp}）</span>
          </div>
          <div style={{ fontSize: 11, color: "#706080", fontFamily: "var(--sans)", textAlign: "center", marginTop: 4 }}>合計: {meta.kp}pt</div>
        </div>
        <Section label="エンディング回収" style={{ background: "rgba(8,8,20,.5)" }}>
          <EndingGrid endings={ENDINGS} collected={meta.endings} />
          <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 8, fontFamily: "var(--sans)" }}>
            {meta.endings?.length ?? 0} / {ENDINGS.length} 回収済
          </div>
        </Section>
        <button className={`btn btn-p tc ${selectedIndex === 0 ? 'selected' : ''}`} style={{ fontSize: 15 }} onMouseEnter={() => setSelectedIndex(0)} onClick={startRun}>新たな探索へ</button>
        <button className={`btn tc ${selectedIndex === 1 ? 'selected' : ''}`} onMouseEnter={() => setSelectedIndex(1)} onClick={() => setPhase("unlocks")}>知見の継承 ◈ {meta.kp}pt</button>
        <button className={`btn tc ${selectedIndex === 2 ? 'selected' : ''}`} onMouseEnter={() => setSelectedIndex(2)} onClick={() => setPhase("title")}>タイトル</button>
      </div>
    </Page>
  );
};
