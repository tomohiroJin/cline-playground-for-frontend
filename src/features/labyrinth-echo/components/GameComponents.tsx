// @ts-nocheck
/**
 * 迷宮の残響 - ゲーム固有UIコンポーネント群
 *
 * LabyrinthEchoGame.tsx §8 から抽出。
 * ステータスバー、タグ、カード等のゲーム固有UIプリミティブを提供する。
 */
import { CFG, STATUS_META, DIFFICULTY } from '../game-logic';
import { Section } from './Section';
import { Badge } from './Badge';
import { FLOOR_META } from '../definitions';

/** ステータスのキー・バリューペア（グリッド用） */
export const StatEntry = ({ label, color, value }) => (
  <div><span style={{ color: "var(--dim)" }}>{label}: </span><span style={{ color }}>{value}</span></div>
);

/** 「戻る」ボタン — 全サブ画面に表示 */
export const BackBtn = ({ onClick, label = "戻る", primary = false }) => (
  <button className={`btn ${primary ? "btn-p" : ""} tc`} style={{ marginTop: 16 }} onClick={onClick}>{label}</button>
);

/** アンロック/トロフィー/実績アイテム行 */
export const UnlockRow = ({ icon, name, desc, own, locked, right, justBought }) => (
  <div className={`uc ${own ? "own" : ""}`} style={{ opacity: locked && !own ? 0.45 : 1, animation: justBought ? "bought .5s ease" : "none" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 20, opacity: own ? 1 : .5, filter: own ? "none" : "grayscale(1)" }}>{icon}</span>
      <div>
        <div style={{ fontSize: 14, color: own ? "#4ade80" : locked ? "#505070" : "var(--text)", fontFamily: "var(--sans)", fontWeight: 600 }}>{own && "✓ "}{locked && !own ? "???" : name}</div>
        <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2, fontFamily: "var(--sans)" }}>{desc}</div>
      </div>
    </div>
    {right}
  </div>
);

/** ステータスバー */
export const StatBar = ({ label, value, max, color, icon }) => {
  const critical = value < max * 0.25;
  const pct = Math.max(0, (value / max) * 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3, color: "var(--dim)", fontFamily: "var(--sans)" }}>
        <span>{icon} {label}{critical && <span style={{ color: "#ef4444", fontSize: 9, marginLeft: 4, animation: "dangerPulse 1s infinite" }}>⚠ 危険</span>}</span>
        <span style={{ color: critical ? "#f87171" : "var(--dim)", fontWeight: critical ? 700 : 400, animation: critical ? "dangerPulse 1s infinite" : "none" }}>{value}/{max}</span>
      </div>
      <div className="bar-t"><div className="bar-f" style={{ width: `${pct}%`, background: color, boxShadow: critical ? "0 0 8px rgba(239,68,68,.4)" : "none" }} /></div>
    </div>
  );
};

/** 状態異常タグ */
export const StatusTag = ({ name }) => {
  const meta = STATUS_META[name] || { colors: ["#f87171", "rgba(248,113,113,0.08)", "rgba(248,113,113,0.18)"], tick: null };
  const hasTick = !!meta.tick;
  return (
    <span className="tag" style={{ color: meta.colors[0], background: meta.colors[1], border: `1px solid ${meta.colors[2]}`, animation: hasTick ? "statusPulse 2s infinite" : "none" }}>
      {hasTick ? "● " : ""}{name}
    </span>
  );
};

/** ステータス変化表示 */
export const Change = ({ value, label }) => {
  if (!value) return null;
  const pos = value > 0;
  return <span style={{ color: pos ? "#4ade80" : "#f87171", fontSize: 12, fontFamily: "var(--sans)", fontWeight: 600, animation: "countUp .3s ease" }}>{label} {pos ? "▲" : "▼"}{pos ? "+" : ""}{value}</span>;
};

/** タイプライターテキスト表示 */
export const TypewriterText = ({ text, revealed, done, ready, skip, serif = true, minHeight = 80, mb = 28 }) => (
  <div onClick={!done ? skip : undefined} style={{ fontSize: 14.5, lineHeight: 2.1, color: "var(--text)", marginBottom: mb, letterSpacing: .5, cursor: !done ? "pointer" : "default", minHeight, fontFamily: serif ? "var(--serif)" : "var(--sans)", whiteSpace: "pre-wrap" }}>
    {revealed}{!done && <span style={{ animation: "pulse 1s infinite", color: "#818cf8" }}>▌</span>}
  </div>
);

/** フロア進捗バー */
export const FloorProgress = ({ pct, color }) => (
  <div className="progress-wrap">
    <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #6366f1, ${color})` }}>
      <div className="progress-glow" style={{ background: color }} />
    </div>
    <div style={{ position: "absolute", top: -18, display: "flex", width: "100%", justifyContent: "space-between", fontSize: 9, color: "var(--dim)", fontFamily: "var(--sans)" }}>
      {Array.from({ length: CFG.MAX_FLOOR }, (_, i) => i + 1).map(f => {
        const active = f <= Math.ceil(pct / (100 / CFG.MAX_FLOOR));
        return <span key={f} style={{ color: active ? color : "rgba(100,100,140,.3)", fontWeight: active ? 700 : 400, transition: "color .5s" }}>{f}F</span>;
      })}
    </div>
  </div>
);

/** ステータスサマリー */
export const StatSummary = ({ player }) => (
  <div style={{ fontSize: 11, color: "#606090", fontFamily: "var(--sans)", lineHeight: 1.8 }}>
    <span style={{ color: "#f87171" }}>HP {player.hp}/{player.maxHp}</span>{"\u3000"}
    <span style={{ color: "#818cf8" }}>精神 {player.mn}/{player.maxMn}</span>{"\u3000"}
    <span style={{ color: "#fbbf24" }}>情報 {player.inf}</span>
    {player.st.length > 0 && (
      <div style={{ marginTop: 6, display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
        {player.st.map(s => <StatusTag key={s} name={s} />)}
      </div>
    )}
  </div>
);

/** 記録パネル */
export const RecordPanel = ({ entries, borderColor = "rgba(50,50,80,.12)", labelColor = "var(--dim)", labelText }) => (
  <Section label={labelText} color={labelColor} style={{ background: "rgba(8,8,20,.5)", border: `1px solid ${borderColor}`, marginBottom: 24 }}>
    <div style={{ fontSize: 12, lineHeight: 2, fontFamily: "var(--sans)" }}>
      {entries.map((e, i) => <span key={i}>{e.label}: <span style={{ color: e.color }}>{e.value}</span>{i < entries.length - 1 && <br />}</span>)}
    </div>
  </Section>
);

/** 難易度選択カード */
export const DiffCard = ({ d, hp, mn, inf, onSelect, cleared }) => (
  <button onClick={() => onSelect(d)} style={{
    display: "block", width: "100%", textAlign: "left", padding: "16px 18px", marginBottom: 10, borderRadius: 12,
    background: `linear-gradient(135deg, rgba(${d.id === "abyss" ? "180,40,40" : "99,102,241"},.08), rgba(20,20,40,.6))`,
    border: `1px solid ${d.color}33`, cursor: "pointer", transition: "all .25s", position: "relative", overflow: "hidden"
  }}
  onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${d.color}88`; e.currentTarget.style.boxShadow = `0 0 20px ${d.color}22`; }}
  onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${d.color}33`; e.currentTarget.style.boxShadow = "none"; }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{d.icon}</span>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: d.color, fontFamily: "var(--sans)" }}>{d.name}</span>
          <span style={{ fontSize: 11, color: "var(--dim)", marginLeft: 8, fontFamily: "var(--sans)" }}>{d.sub}</span>
          {cleared && <span style={{ fontSize: 9, color: d.color, marginLeft: 8, fontFamily: "var(--sans)", padding: "1px 6px", borderRadius: 4, background: `${d.color}18`, border: `1px solid ${d.color}30` }}>✓ クリア済</span>}
        </div>
      </div>
      <div style={{ textAlign: "right", fontFamily: "var(--sans)" }}>
        <div style={{ fontSize: 11, color: "#fbbf24" }}>脱出 +{d.kpWin}pt</div>
        <div style={{ fontSize: 10, color: "#706080" }}>失敗 +{d.kpDeath}pt</div>
      </div>
    </div>
    <p style={{ fontSize: 11, color: "#808098", lineHeight: 1.6, margin: "0 0 10px 32px", fontFamily: "var(--sans)" }}>{d.desc}</p>
    <div style={{ display: "flex", gap: 12, marginLeft: 32, fontSize: 10, fontFamily: "var(--sans)", flexWrap: "wrap" }}>
      <span style={{ color: "#f87171" }}>HP {hp}</span>
      <span style={{ color: "#818cf8" }}>精神 {mn}</span>
      <span style={{ color: "#fbbf24" }}>情報 {inf}</span>
      {d.drainMod !== 0 ? <span style={{ color: "#a78bfa" }}>侵蝕 {d.drainMod}/手</span> : <span style={{ color: "#4ade80" }}>侵蝕 なし</span>}
      {d.dmgMult !== 1 && <span style={{ color: d.dmgMult > 1 ? "#f59e0b" : "#4ade80" }}>被ダメ ×{d.dmgMult}</span>}
    </div>
  </button>
);

/** 難易度バッジ（小） */
export const DiffBadge = ({ diff }) => diff
  ? <span style={{ fontSize: 9, color: diff.color, fontFamily: "var(--sans)", opacity: .7 }}>{diff.icon}{diff.name}</span>
  : null;

/** 難易度ラベル */
export const DiffLabel = ({ diff }) => diff
  ? <div style={{ fontSize: 11, color: diff.color, fontFamily: "var(--sans)", marginBottom: 8 }}>{diff.icon} {diff.name}モード</div>
  : null;

/** フラグインジケーター */
export const FlagIndicator = ({ flag }) => {
  if (!flag) return null;
  const styles = { fontSize: 12, fontFamily: "var(--sans)", fontWeight: 600 };
  if (flag.startsWith("add:"))    return <span style={{ ...styles, color: "#f87171" }}>⚠ {flag.slice(4)}</span>;
  if (flag.startsWith("remove:")) return <span style={{ ...styles, color: "#4ade80" }}>✦ {flag.slice(7)} 回復</span>;
  if (flag === "shortcut")        return <span style={{ ...styles, color: "#c084fc" }}>⟫ 近道発見</span>;
  if (flag.startsWith("chain:"))  return <span style={{ ...styles, color: "#60a5fa" }}>… 続く</span>;
  return null;
};

/** ドレイン表示 */
export const DrainDisplay = ({ drain }) => {
  if (!drain) return null;
  return (
    <div style={{ fontSize: 11, color: "#706080", fontFamily: "var(--sans)", marginBottom: 12, padding: "8px 12px", background: "rgba(80,30,30,.08)", borderRadius: 8, border: "1px solid rgba(80,30,30,.12)" }}>
      <span style={{ marginRight: 8 }}>⊘ 迷宮の侵蝕:</span>
      {drain.hp !== 0 && <span style={{ color: "#f87171", marginRight: 8 }}>HP{drain.hp}</span>}
      {drain.mn !== 0 && <span style={{ color: "#a78bfa" }}>精神{drain.mn}</span>}
    </div>
  );
};

/** ログエントリー */
export const LogEntry = ({ entry }) => (
  <div className="log-e">
    <span style={{ color: FLOOR_META[entry.fl]?.color ?? "#818cf8", fontWeight: 600 }}>第{entry.fl}層-{entry.step}</span>
    <span style={{ margin: "0 6px", color: "#404060" }}>|</span>{entry.ch}
    <div style={{ marginTop: 2 }}>
      {entry.hp !== 0 && <span style={{ color: entry.hp > 0 ? "#4ade80" : "#f87171", marginRight: 8, fontSize: 10 }}>HP{entry.hp > 0 ? "+" : ""}{entry.hp}</span>}
      {entry.mn !== 0 && <span style={{ color: entry.mn > 0 ? "#a5b4fc" : "#f87171", marginRight: 8, fontSize: 10 }}>精神{entry.mn > 0 ? "+" : ""}{entry.mn}</span>}
      {entry.inf !== 0 && <span style={{ color: entry.inf > 0 ? "#fbbf24" : "#f87171", fontSize: 10 }}>情報{entry.inf > 0 ? "+" : ""}{entry.inf}</span>}
    </div>
  </div>
);

/** ステップドット */
export const StepDots = ({ current, total }) => (
  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className={`dot ${i < current ? "done" : i === current ? "now" : ""}`} />
    ))}
  </div>
);

/** エンディングコレクショングリッド（DRY: 勝利画面＋記録画面で共用） */
export const EndingGrid = ({ endings, collected }) => (
  <div className="flex-wrap-c">
    {endings.map(e => (
      <Badge key={e.id} got={collected?.includes(e.id)} color={e.color} label={`${e.icon} ${e.name}`} />
    ))}
  </div>
);
