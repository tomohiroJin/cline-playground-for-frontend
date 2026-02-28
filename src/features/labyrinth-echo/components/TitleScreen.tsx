/**
 * 迷宮の残響 - タイトル画面
 */
import { useState, useEffect, ReactNode } from 'react';
import { CFG, DIFFICULTY, UNLOCKS } from '../game-logic';
import type { MetaState } from '../game-logic';
import { ENDINGS, getActiveTitle } from '../definitions';
import { Page } from './Page';
import { LE_IMAGES, LE_TITLE_LAYERS } from '../images';
import { useKeyboardControl } from '../hooks';

interface TitleScreenProps {
  meta: MetaState;
  Particles: ReactNode;
  startRun: () => void;
  enableAudio: () => void;
  setPhase: (phase: string) => void;
  eventCount: number;
}

export const TitleScreen = ({ meta, Particles, startRun, enableAudio, setPhase, eventCount }: TitleScreenProps) => {
  const activeTitle = meta.runs > 0 ? getActiveTitle(meta) : null;
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if ('ontouchstart' in window) return;
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setMousePos({ x: (e.clientX - cx) / cx, y: (e.clientY - cy) / cy });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const menuActions = [
    startRun,
    ...(meta.runs > 0 ? [() => { enableAudio(); setPhase("unlocks"); }, () => setPhase("titles"), () => setPhase("records")] : []),
    () => setPhase("settings")
  ];
  
  const { selectedIndex, setSelectedIndex } = useKeyboardControl({
    optionsCount: menuActions.length,
    onSelect: (idx) => menuActions[idx](),
    isActive: true
  });

  const farX = mousePos.x * 5;
  const farY = mousePos.y * 3;
  const midX = mousePos.x * 10;
  const midY = mousePos.y * 6;
  const nearX = mousePos.x * 15;
  const nearY = mousePos.y * 9;

  const runHue = (meta.runs * 15) % 360;
  const runBright = Math.max(0.3, 0.6 - (meta.runs * 0.01));
  const runFilter = `hue-rotate(${runHue}deg) brightness(${runBright})`;
  return (
    <Page particles={Particles}>
      <style>{`
        @keyframes titleGlitch {
          0%, 95% { transform: translate(0); filter: none; }
          96% { transform: translate(-3px, 1px); filter: hue-rotate(90deg) brightness(1.5); }
          98% { transform: translate(2px, -2px); filter: invert(0.2); }
          99% { transform: translate(-2px, -1px); filter: saturate(3); }
          100% { transform: translate(0); filter: none; }
        }
      `}</style>
      <div style={{
        position: "absolute", inset: -30,
        backgroundImage: `url(${LE_TITLE_LAYERS.far || LE_IMAGES.title})`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.5, filter: `blur(8px) ${runFilter}`, zIndex: -2,
        transform: `translate(${farX}px, ${farY}px)`,
        willChange: "transform"
      }} />
      <div style={{
        position: "absolute", inset: -30,
        backgroundImage: `url(${LE_TITLE_LAYERS.mid || LE_IMAGES.title})`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.55, filter: `blur(4px) ${runFilter}`, zIndex: -1,
        transform: `translate(${midX}px, ${midY}px)`,
        willChange: "transform"
      }} />
      <div style={{
        position: "absolute", inset: -30,
        backgroundImage: `url(${LE_IMAGES.title})`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.6, filter: `blur(2px) ${runFilter}`, zIndex: 0,
        transform: `translate(${nearX}px, ${nearY}px)`,
        willChange: "transform"
      }} />
      <div className="card tc" style={{ marginTop: "6vh", animation: "fadeUp .8s ease", position: "relative", zIndex: 1, background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)" }}>
        <div style={{ fontSize: 10, letterSpacing: 8, color: "#818cf8", marginBottom: 20, fontFamily: "var(--sans)", opacity: .8 }}>TEXT EXPLORATION × JUDGMENT × ROGUELITE</div>
        <h1 style={{ fontSize: 38, fontWeight: 700, color: "var(--bright)", letterSpacing: 8, marginBottom: 10, animation: "glow 4s ease-in-out infinite, titleGlitch 5s infinite", lineHeight: 1.5 }}>迷宮の残響</h1>
        {activeTitle && <div style={{ fontSize: 11, color: activeTitle.color, fontFamily: "var(--sans)", marginBottom: 4, letterSpacing: 2 }}>{activeTitle.icon} {activeTitle.name}</div>}
        <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 2, marginBottom: 8, fontFamily: "var(--sans)" }}>不確かな情報の中で選択を重ね<br />「生きて帰る」ための判断力を磨け</p>
        <div className="divider" style={{ margin: "20px auto" }} />
        <div style={{ fontSize: 11, color: "#505078", lineHeight: 1.8, marginBottom: 28, fontFamily: "var(--sans)" }}>
          <div style={{ marginBottom: 4 }}>全{CFG.MAX_FLOOR}層・{eventCount}種のイベント・{ENDINGS.length}種のエンディング</div>
          <div style={{ color: "#606090" }}>{meta.runs === 0
            ? "死は終わりではない。得た知見は次の探索へ継承される。"
            : "探索は常に命懸け。第一層ですら油断は死を意味する。"
          }</div>
        </div>
        <button className={`btn btn-p tc ${selectedIndex === 0 ? 'selected' : ''}`} style={{ fontSize: 16, padding: "16px", marginBottom: 12 }} onMouseEnter={() => setSelectedIndex(0)} onClick={startRun}>
          {meta.runs > 0 ? `${meta.runs + 1}回目の探索を開始` : "探索を開始する"}
        </button>
        {meta.runs > 0 && (() => {
          const buyable = UNLOCKS.filter(u => !meta.unlocked.includes(u.id) && u.cost > 0 && meta.kp >= u.cost && (!u.gate || meta.clearedDiffs?.includes(u.gate))).length;
          return <button className={`btn tc ${selectedIndex === 1 ? 'selected' : ''}`} onMouseEnter={() => setSelectedIndex(1)} onClick={() => { enableAudio(); setPhase("unlocks"); }}>
            知見の継承{"\u3000"}<span style={{ color: "#fbbf24", fontFamily: "var(--sans)" }}>◈ {meta.kp}pt</span>
            {buyable > 0 && <span style={{ fontSize: 10, color: "#4ade80", marginLeft: 8, fontFamily: "var(--sans)" }}>({buyable}個解放可能)</span>}
          </button>;
        })()}
        {meta.runs > 0 && <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button className={`btn tc ${selectedIndex === 2 ? 'selected' : ''}`} style={{ flex: 1, minWidth: 80 }} onMouseEnter={() => setSelectedIndex(2)} onClick={() => setPhase("titles")}>称号</button>
          <button className={`btn tc ${selectedIndex === 3 ? 'selected' : ''}`} style={{ flex: 1, minWidth: 80 }} onMouseEnter={() => setSelectedIndex(3)} onClick={() => setPhase("records")}>実績</button>
        </div>}
        <button className={`btn tc ${selectedIndex === (meta.runs > 0 ? 4 : 1) ? 'selected' : ''}`} style={{ fontSize: 12, color: "var(--dim)" }} onMouseEnter={() => setSelectedIndex(meta.runs > 0 ? 4 : 1)} onClick={() => setPhase("settings")}>⚙ 設定</button>
        {meta.runs > 0 && <div style={{ marginTop: 20, fontSize: 11, fontFamily: "var(--sans)", display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ color: "#818cf8" }}>探索 {meta.runs}回</span>
          <span style={{ color: "#4ade80" }}>脱出 {meta.escapes}回</span>
          <span style={{ color: "#fbbf24" }}>最深 第{meta.bestFl}層</span>
          <span style={{ color: meta.escapes / meta.runs > 0.3 ? "#4ade80" : "#f87171" }}>生還率 {Math.round(meta.escapes / meta.runs * 100)}%</span>
          <span style={{ color: "#c084fc" }}>ED {meta.endings?.length ?? 0}/{ENDINGS.length}</span>
          <span style={{ color: "#60a5fa" }}>継承 {meta.unlocked.length}/{UNLOCKS.length}</span>
        </div>}
        {meta.clearedDiffs?.length > 0 && <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {DIFFICULTY.map(d => {
            const cleared = meta.clearedDiffs.includes(d.id);
            return cleared ? <span key={d.id} style={{ fontSize: 10, color: d.color, fontFamily: "var(--sans)", padding: "2px 8px", borderRadius: 4, background: `${d.color}15`, border: `1px solid ${d.color}30` }}>{d.icon}{d.name}クリア</span> : null;
          })}
        </div>}
      </div>
      <p style={{ position: "relative", zIndex: 1, marginTop: 24, fontSize: 10, color: "#303050", fontFamily: "var(--sans)", letterSpacing: 2 }}>
        {meta.lastRun
          ? meta.lastRun.cause === "escape"
            ? `前回: 第${meta.lastRun.floor}層より生還 ── 今度はさらに深く`
            : `前回: 第${meta.lastRun.floor}層にて${meta.lastRun.cause} ── 次こそは`
          : "失敗は知見となり、次の探索に活きる"
        }
      </p>
    </Page>
  );
};
