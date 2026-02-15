// @ts-nocheck
/**
 * 迷宮の残響 - タイトル画面
 */
import { CFG, DIFFICULTY, UNLOCKS } from '../game-logic';
import { ENDINGS, getActiveTitle } from '../definitions';
import { Page } from './Page';
import { LE_IMAGES } from '../images';

export const TitleScreen = ({ meta, Particles, startRun, enableAudio, setPhase, eventCount }) => {
  const activeTitle = meta.runs > 0 ? getActiveTitle(meta) : null;
  return (
    <Page particles={Particles}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${LE_IMAGES.title})`,
        backgroundSize: "cover", backgroundPosition: "center",
        opacity: 0.3, filter: "blur(4px) brightness(0.6)", zIndex: 0
      }} />
      <div className="card tc" style={{ marginTop: "6vh", animation: "fadeUp .8s ease", position: "relative", zIndex: 1, background: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)" }}>
        <div style={{ fontSize: 10, letterSpacing: 8, color: "#818cf8", marginBottom: 20, fontFamily: "var(--sans)", opacity: .8 }}>TEXT EXPLORATION × JUDGMENT × ROGUELITE</div>
        <h1 style={{ fontSize: 38, fontWeight: 700, color: "var(--bright)", letterSpacing: 8, marginBottom: 10, animation: "glow 4s ease-in-out infinite", lineHeight: 1.5 }}>迷宮の残響</h1>
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
        <button className="btn btn-p tc" style={{ fontSize: 16, padding: "16px", marginBottom: 12 }} onClick={startRun}>
          {meta.runs > 0 ? `${meta.runs + 1}回目の探索を開始` : "探索を開始する"}
        </button>
        {meta.runs > 0 && (() => {
          const buyable = UNLOCKS.filter(u => !meta.unlocked.includes(u.id) && u.cost > 0 && meta.kp >= u.cost && (!u.gate || meta.clearedDiffs?.includes(u.gate))).length;
          return <button className="btn tc" onClick={() => { enableAudio(); setPhase("unlocks"); }}>
            知見の継承{"\u3000"}<span style={{ color: "#fbbf24", fontFamily: "var(--sans)" }}>◈ {meta.kp}pt</span>
            {buyable > 0 && <span style={{ fontSize: 10, color: "#4ade80", marginLeft: 8, fontFamily: "var(--sans)" }}>({buyable}個解放可能)</span>}
          </button>;
        })()}
        {meta.runs > 0 && <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn tc" style={{ flex: 1, minWidth: 80 }} onClick={() => setPhase("titles")}>称号</button>
          <button className="btn tc" style={{ flex: 1, minWidth: 80 }} onClick={() => setPhase("records")}>実績</button>
        </div>}
        <button className="btn tc" style={{ fontSize: 12, color: "var(--dim)" }} onClick={() => setPhase("settings")}>⚙ 設定</button>
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
