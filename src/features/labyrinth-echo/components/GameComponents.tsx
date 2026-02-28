/**
 * 迷宮の残響 - ゲーム固有UIコンポーネント群
 *
 * LabyrinthEchoGame.tsx §8 から抽出。
 * ステータスバー、タグ、カード等のゲーム固有UIプリミティブを提供する。
 */
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { CFG, STATUS_META, DIFFICULTY, UNLOCKS } from '../game-logic';
import type { Player, DifficultyDef, UnlockDef } from '../game-logic';
import { Section } from './Section';
import { Badge } from './Badge';
import { FLOOR_META } from '../definitions';
import type { EndingDef, LogEntry as LogEntryDef } from '../definitions';
import { LE_IMAGES } from '../images';

// ── Props型定義 ──────────────────────────────────────────

interface StatEntryProps {
  label: string;
  color: string;
  value: string | number;
}

interface BackBtnProps {
  onClick: () => void;
  label?: string;
  primary?: boolean;
}

interface UnlockRowProps {
  icon: string;
  name: string;
  desc: string | undefined;
  own: boolean;
  locked: boolean;
  right: ReactNode;
  justBought?: boolean;
}

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: string;
}

interface StatusTagProps {
  name: string;
}

interface ChangeProps {
  value: number;
  label: string;
}

interface TypewriterTextProps {
  text: string;
  revealed: string;
  done: boolean;
  ready: boolean;
  skip: () => void;
  serif?: boolean;
  minHeight?: number;
  mb?: number;
}

interface FloorProgressProps {
  pct: number;
  color: string;
}

interface StatSummaryProps {
  player: Player;
}

interface RecordPanelEntry {
  label: string;
  color: string;
  value: string | number;
}

interface RecordPanelProps {
  entries: RecordPanelEntry[];
  borderColor?: string;
  labelColor?: string;
  labelText: string;
}

interface DiffCardProps {
  d: DifficultyDef;
  hp: number;
  mn: number;
  inf: number;
  onSelect: (d: DifficultyDef) => void;
  cleared: boolean;
}

interface DiffBadgeProps {
  diff: DifficultyDef | null;
}

interface DiffLabelProps {
  diff: DifficultyDef | null;
}

interface FlagIndicatorProps {
  flag: string | null;
}

interface DrainDisplayProps {
  drain: { hp: number; mn: number } | null;
}

interface LogEntryProps {
  entry: LogEntryDef;
  index?: number;
}

interface StepDotsProps {
  current: number;
  total: number;
}

interface EndingGridProps {
  endings: readonly EndingDef[];
  collected: string[] | undefined;
}

interface GuidanceOverlayProps {
  show: boolean;
}

interface ToastItem {
  id: string;
  def: UnlockDef;
  time: number;
}

// ── コンポーネント ──────────────────────────────────────────

/** ステータスのキー・バリューペア（グリッド用） */
export const StatEntry = ({ label, color, value }: StatEntryProps) => (
  <div><span style={{ color: "var(--dim)" }}>{label}: </span><span style={{ color }}>{value}</span></div>
);

/** 「戻る」ボタン — 全サブ画面に表示 */
export const BackBtn = ({ onClick, label = "戻る", primary = false }: BackBtnProps) => (
  <button className={`btn ${primary ? "btn-p" : ""} tc`} style={{ marginTop: 16 }} onClick={onClick}>{label}</button>
);

/** アンロック/トロフィー/実績アイテム行 */
export const UnlockRow = ({ icon, name, desc, own, locked, right, justBought }: UnlockRowProps) => (
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
export const StatBar = ({ label, value, max, color, icon }: StatBarProps) => {
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
export const StatusTag = ({ name }: StatusTagProps) => {
  const meta = STATUS_META[name] || { colors: ["#f87171", "rgba(248,113,113,0.08)", "rgba(248,113,113,0.18)"], tick: null };
  const hasTick = !!meta.tick;
  return (
    <span className="tag" style={{ color: meta.colors[0], background: meta.colors[1], border: `1px solid ${meta.colors[2]}`, animation: hasTick ? "statusPulse 2s infinite" : "none" }}>
      {hasTick ? "● " : ""}{name}
    </span>
  );
};

/** ステータス変化表示 */
export const Change = ({ value, label }: ChangeProps) => {
  if (!value) return null;
  const pos = value > 0;
  return <span style={{ color: pos ? "#4ade80" : "#f87171", fontSize: 12, fontFamily: "var(--sans)", fontWeight: 600, animation: "countUp .3s ease" }}>{label} {pos ? "▲" : "▼"}{pos ? "+" : ""}{value}</span>;
};

/** タイプライターテキスト表示 */
export const TypewriterText = ({ text, revealed, done, ready, skip, serif = true, minHeight = 80, mb = 28 }: TypewriterTextProps) => (
  <div onClick={!done ? skip : undefined} style={{ fontSize: 14.5, lineHeight: 2.1, color: "var(--text)", marginBottom: mb, letterSpacing: .5, cursor: !done ? "pointer" : "default", minHeight, fontFamily: serif ? "var(--serif)" : "var(--sans)", whiteSpace: "pre-wrap" }}>
    {revealed}{!done && <span style={{ animation: "pulse 1s infinite", color: "#818cf8" }}>▌</span>}
  </div>
);

/** フロア進捗バー */
export const FloorProgress = ({ pct, color }: FloorProgressProps) => (
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
export const StatSummary = ({ player }: StatSummaryProps) => (
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
export const RecordPanel = ({ entries, borderColor = "rgba(50,50,80,.12)", labelColor = "var(--dim)", labelText }: RecordPanelProps) => (
  <Section label={labelText} color={labelColor} style={{ background: "rgba(8,8,20,.5)", border: `1px solid ${borderColor}`, marginBottom: 24 }}>
    <div style={{ fontSize: 12, lineHeight: 2, fontFamily: "var(--sans)" }}>
      {entries.map((e: RecordPanelEntry, i: number) => <span key={i}>{e.label}: <span style={{ color: e.color }}>{e.value}</span>{i < entries.length - 1 && <br />}</span>)}
    </div>
  </Section>
);

/** 難易度選択カード */
export const DiffCard = ({ d, hp, mn, inf, onSelect, cleared }: DiffCardProps) => (
  <button onClick={() => onSelect(d)} style={{
    display: "block", width: "100%", textAlign: "left", padding: "16px 18px", marginBottom: 10, borderRadius: 12,
    background: `linear-gradient(135deg, rgba(${d.id === "abyss" ? "180,40,40" : "99,102,241"},.08), rgba(20,20,40,.6))`,
    border: `1px solid ${d.color}33`, cursor: "pointer", transition: "all .25s", position: "relative", overflow: "hidden"
  }}
  onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${d.color}88`; e.currentTarget.style.boxShadow = `0 0 20px ${d.color}22`; }}
  onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${d.color}33`; e.currentTarget.style.boxShadow = "none"; }}
  >
    <div style={{
      position: "absolute", inset: 0,
      backgroundImage: `url(${LE_IMAGES.difficulty[d.id as keyof typeof LE_IMAGES.difficulty] || LE_IMAGES.difficulty.normal})`,
      backgroundSize: "cover", backgroundPosition: "center",
      opacity: 0.12, mixBlendMode: "luminosity", pointerEvents: "none"
    }} />
    <div style={{ position: "relative", zIndex: 1 }}>
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
    </div>
  </button>
);

/** 難易度バッジ（小） */
export const DiffBadge = ({ diff }: DiffBadgeProps) => diff
  ? <span style={{ fontSize: 9, color: diff.color, fontFamily: "var(--sans)", opacity: .7 }}>{diff.icon}{diff.name}</span>
  : null;

/** 難易度ラベル */
export const DiffLabel = ({ diff }: DiffLabelProps) => diff
  ? <div style={{ fontSize: 11, color: diff.color, fontFamily: "var(--sans)", marginBottom: 8 }}>{diff.icon} {diff.name}モード</div>
  : null;

/** フラグインジケーター */
export const FlagIndicator = ({ flag }: FlagIndicatorProps) => {
  if (!flag) return null;
  const styles = { fontSize: 12, fontFamily: "var(--sans)", fontWeight: 600 } as const;
  if (flag.startsWith("add:"))    return <span style={{ ...styles, color: "#f87171" }}>⚠ {flag.slice(4)}</span>;
  if (flag.startsWith("remove:")) return <span style={{ ...styles, color: "#4ade80" }}>✦ {flag.slice(7)} 回復</span>;
  if (flag === "shortcut")        return <span style={{ ...styles, color: "#c084fc" }}>⟫ 近道発見</span>;
  if (flag.startsWith("chain:"))  return <span style={{ ...styles, color: "#60a5fa" }}>… 続く</span>;
  return null;
};

/** ドレイン表示 */
export const DrainDisplay = ({ drain }: DrainDisplayProps) => {
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
export const LogEntry = ({ entry, index = 0 }: LogEntryProps) => {
  const opacity = Math.max(0.4, 1 - index * 0.15);
  return (
    <div className="log-e" style={{ opacity }}>
      <span style={{ color: FLOOR_META[entry.fl]?.color ?? "#818cf8", fontWeight: index === 0 ? 700 : 400 }}>第{entry.fl}層-{entry.step}</span>
      <span style={{ margin: "0 6px", color: "#404060" }}>|</span>{entry.ch}
      <div style={{ marginTop: 2 }}>
        {entry.hp !== 0 && <span style={{ color: entry.hp > 0 ? "#4ade80" : "#ef4444", marginRight: 8, fontSize: 10 }}>HP{entry.hp > 0 ? "+" : ""}{entry.hp}</span>}
        {entry.mn !== 0 && <span style={{ color: entry.mn > 0 ? "#60a5fa" : "#a855f7", marginRight: 8, fontSize: 10 }}>精神{entry.mn > 0 ? "+" : ""}{entry.mn}</span>}
        {entry.inf !== 0 && <span style={{ color: entry.inf > 0 ? "#fbbf24" : "#94a3b8", fontSize: 10 }}>情報{entry.inf > 0 ? "+" : ""}{entry.inf}</span>}
      </div>
    </div>
  );
};


/** ステップドット */
export const StepDots = ({ current, total }: StepDotsProps) => (
  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className={`dot ${i < current ? "done" : i === current ? "now" : ""}`} />
    ))}
  </div>
);

/** エンディングコレクショングリッド（DRY: 勝利画面＋記録画面で共用） */
export const EndingGrid = ({ endings, collected }: EndingGridProps) => (
  <div className="flex-wrap-c">
    {endings.map(e => (
      <Badge key={e.id} got={collected?.includes(e.id) ?? false} color={e.color} label={`${e.icon} ${e.name}`} />
    ))}
  </div>
);

/** 初回プレイ用ガイダンスオーバーレイ */
export const GuidanceOverlay = ({ show }: GuidanceOverlayProps) => {
  if (!show) return null;
  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      background: "rgba(15,23,42,0.95)", border: "1px solid rgba(99,102,241,0.4)",
      padding: "16px 20px", borderRadius: 12, zIndex: 100,
      boxShadow: "0 4px 30px rgba(0,0,0,0.6)", color: "var(--text)", fontFamily: "var(--sans)",
      animation: "fadeUp 0.6s ease-out", maxWidth: 400, width: "90%",
      textAlign: "center", backdropFilter: "blur(4px)"
    }}>
      <div style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 700, marginBottom: 8, letterSpacing: 2 }}>💡 迷宮探索の心得</div>
      <div style={{ fontSize: 12, lineHeight: 1.8, color: "var(--dim)" }}>
        選択肢は<strong>キーボード(1-9, ↑↓, Enter)</strong>でも決定できます。<br/>
        <span style={{color:"#f87171"}}>体力(HP)</span>と<span style={{color:"#a78bfa"}}>精神(◈)</span>に気を配り、時には<span style={{color:"#fbbf24"}}>情報</span>を集めながら深く潜りましょう。
      </div>
    </div>
  );
};

/** トースト通知コンポーネント */
export const ToastContainer = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleUnlock = (e: Event) => {
      const unlockId = (e as CustomEvent<string>).detail;
      const found = UNLOCKS.find(u => u.id === unlockId) as UnlockDef | undefined;
      if (found) {
        const def = found;
        const t: ToastItem = { id: unlockId, def, time: Date.now() };
        setToasts(prev => [...prev, t]);
        setTimeout(() => {
          setToasts(prev => prev.filter(x => x.time !== t.time));
        }, 5000);
      }
    };
    window.addEventListener('labyrinth-echo-unlock', handleUnlock);
    return () => window.removeEventListener('labyrinth-echo-unlock', handleUnlock);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.time} style={{
          background: "rgba(15, 23, 42, 0.95)", border: `1px solid ${t.def.cat === 'trophy' ? '#fbbf24' : '#60a5fa'}`,
          padding: "16px 20px", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          animation: "slideIn 0.4s ease-out, fadeOut 0.4s ease-in 4.6s forwards",
          color: "var(--text)", width: 280, backdropFilter: "blur(8px)"
        }}>
          <div style={{ fontSize: 11, color: t.def.cat === 'trophy' ? '#fcd34d' : '#93c5fd', fontFamily: "var(--sans)", fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>
            {t.def.cat === 'trophy' ? "🏆 トロフィー獲得" : "🎖️ 実績解除"}
          </div>
          <div style={{ fontSize: 14, fontWeight: "bold", fontFamily: "var(--sans)" }}>{t.def.name}</div>
          <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 4, fontFamily: "var(--sans)" }}>{t.def.desc}</div>
        </div>
      ))}
      <style>{`
        @keyframes fadeOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(20px); } }
      `}</style>
    </div>
  );
};
