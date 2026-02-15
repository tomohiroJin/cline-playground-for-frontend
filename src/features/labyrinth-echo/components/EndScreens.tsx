// @ts-nocheck
/**
 * 迷宮の残響 - ゲームオーバー・勝利画面
 */
import { ENDINGS, DEATH_FLAVORS, DEATH_TIPS } from '../definitions';
import { Page } from './Page';
import { Section } from './Section';
import { DiffLabel, RecordPanel, EndingGrid } from './GameComponents';
import { LE_IMAGES } from '../images';

/** ゲームオーバー画面 */
export const GameOverScreen = ({ Particles, player, meta, diff, floor, floorMeta, floorColor, progressPct, log, usedSecondLife, startRun, setPhase }) => {
  const deathCause = player?.hp <= 0 ? "体力消耗" : "精神崩壊";
  const flavors = DEATH_FLAVORS[deathCause];
  const flavor = flavors[meta.runs % flavors.length];
  return (
    <Page particles={Particles}>
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
          { label: "状態異常",   color: player?.st.length > 0 ? "#f87171" : "#4ade80", value: player?.st.length > 0 ? player.st.join("・") : "なし" },
        ]} />
        <div style={{ padding: "10px 16px", background: "rgba(74,222,128,.04)", borderRadius: 10, border: "1px solid rgba(74,222,128,.1)", marginBottom: 16, animation: "popIn .4s ease .3s both" }}>
          <div style={{ fontSize: 12, color: "#4ade80", fontFamily: "var(--sans)", fontWeight: 700, textAlign: "center" }}>
            獲得知見 +{diff?.kpDeath ?? 2}pt
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
        <button className="btn btn-p tc" style={{ fontSize: 15 }} onClick={startRun}>再び挑む</button>
        {meta.kp > 0 && <button className="btn tc" onClick={() => setPhase("unlocks")}>知見の継承 ◈ {meta.kp}pt</button>}
        <button className="btn tc" onClick={() => setPhase("title")}>タイトル</button>
      </div>
    </Page>
  );
};

/** 勝利画面（マルチエンディング） */
export const VictoryScreen = ({ Particles, ending, isNewEnding, isNewDiffClear, diff, player, usedSecondLife, log, meta, startRun, setPhase }) => {
  const end = ending ?? ENDINGS[ENDINGS.length - 1];
  const totalKp = (diff?.kpWin ?? 4) + end.bonusKp;
  return (
    <Page particles={Particles}>
      <div className="card tc" style={{ marginTop: "6vh", animation: "fadeUp .8s", borderColor: `${end.color}30` }}>
        <div style={{ fontSize: 10, color: end.color, letterSpacing: 6, marginBottom: 8, fontFamily: "var(--sans)", fontWeight: 600 }}>{end.sub}</div>
        <div style={{ fontSize: 48, marginBottom: 12, animation: "endingGlow 3s ease-in-out infinite", lineHeight: 1 }}>{end.icon}</div>
        {isNewEnding && <div style={{ display: "inline-block", padding: "2px 12px", borderRadius: 12, fontSize: 10, fontFamily: "var(--sans)", fontWeight: 700, background: `${end.color}20`, border: `1px solid ${end.color}40`, color: end.color, marginBottom: 8, letterSpacing: 2, animation: "pulse 2s infinite" }}>★ NEW ENDING ★</div>}
        {isNewDiffClear && <div style={{ display: "inline-block", padding: "2px 12px", borderRadius: 12, fontSize: 10, fontFamily: "var(--sans)", fontWeight: 700, background: `${diff?.color ?? "#818cf8"}20`, border: `1px solid ${diff?.color ?? "#818cf8"}40`, color: diff?.color ?? "#818cf8", marginBottom: 8, marginLeft: isNewEnding ? 6 : 0, letterSpacing: 2, animation: "pulse 2s infinite 0.3s" }}>🏆 {diff?.name}初クリア</div>}
        <h2 style={{ fontSize: 28, color: end.color, letterSpacing: 5, marginBottom: 20, lineHeight: 1.5, textShadow: `0 0 30px ${end.color}40` }}>{end.name}</h2>
        
        <div style={{
          width: "100%", height: 240, marginBottom: 24, borderRadius: 12, overflow: "hidden", position: "relative",
          border: `1px solid ${end.color}50`, boxShadow: `0 0 40px ${end.color}20`,
          animation: "floorReveal 1.2s ease"
        }}>
           <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${LE_IMAGES.endings[end.id] || LE_IMAGES.endings.standard})`,
            backgroundSize: "cover", backgroundPosition: "center",
          }} />
          {/* 光のエフェクト */}
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at center, transparent 30%, ${end.color}20 100%)`, mixBlendMode: "overlay" }} />
        </div>

        <DiffLabel diff={diff} />
        <p style={{ fontSize: 13, color: "#a0a0c0", lineHeight: 2, marginBottom: 24, fontFamily: "var(--sans)", whiteSpace: "pre-wrap" }}>{end.desc}</p>
        <div style={{ width: 80, height: 2, background: end.gradient, margin: "0 auto 24px", borderRadius: 2 }} />
        <RecordPanel labelText="生還記録" labelColor={end.color} borderColor={`${end.color}20`} entries={[
          { label: "エンディング", color: end.color, value: end.name },
          { label: "難易度",     color: diff?.color ?? "#818cf8", value: `${diff?.icon ?? ""}${diff?.name ?? "通常"}` },
          { label: "残存HP",     color: "#f87171", value: `${player?.hp}/${player?.maxHp}` },
          { label: "残存精神",   color: "#818cf8", value: `${player?.mn}/${player?.maxMn}` },
          { label: "情報値",     color: "#fbbf24", value: `${player?.inf}` },
          { label: "状態異常",   color: player?.st.length > 0 ? "#f87171" : "#4ade80", value: player?.st.length > 0 ? player.st.join("・") : "なし" },
          ...(usedSecondLife ? [{ label: "二度目の命", color: "#fbbf24", value: "発動（復活1回消費）" }] : []),
          { label: "通過イベント", color: "#c084fc", value: `${log.length}件` },
        ]} />
        <div style={{ padding: "12px 16px", background: "rgba(251,191,36,.05)", borderRadius: 10, border: "1px solid rgba(251,191,36,.12)", marginBottom: 20, animation: "popIn .4s ease .3s both" }}>
          <div style={{ fontSize: 13, color: "#fbbf24", fontFamily: "var(--sans)", fontWeight: 700, textAlign: "center" }}>
            獲得知見 +{totalKp}pt
            <span style={{ fontSize: 10, color: "#706080", fontWeight: 400, marginLeft: 6 }}>（基本{diff?.kpWin ?? 4} + ED{end.bonusKp}）</span>
          </div>
          <div style={{ fontSize: 11, color: "#706080", fontFamily: "var(--sans)", textAlign: "center", marginTop: 4 }}>合計: {meta.kp}pt</div>
        </div>
        <Section label="エンディング回収" style={{ background: "rgba(8,8,20,.5)" }}>
          <EndingGrid endings={ENDINGS} collected={meta.endings} />
          <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 8, fontFamily: "var(--sans)" }}>
            {meta.endings?.length ?? 0} / {ENDINGS.length} 回収済
          </div>
        </Section>
        <button className="btn btn-p tc" style={{ fontSize: 15 }} onClick={startRun}>新たな探索へ</button>
        <button className="btn tc" onClick={() => setPhase("unlocks")}>知見の継承 ◈ {meta.kp}pt</button>
        <button className="btn tc" onClick={() => setPhase("title")}>タイトル</button>
      </div>
    </Page>
  );
};
