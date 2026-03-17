/**
 * 迷宮の残響 - ステータスパネル
 *
 * EventScreen / ResultScreen で共有するステータス表示部分。
 */
import { useState } from 'react';
import { CFG } from '../../../domain/constants/config';
import type { Player } from '../../../domain/models/player';
import type { DifficultyDef } from '../../../domain/models/difficulty';
import { FLOOR_META } from '../../../domain/constants/floor-meta';
import type { FloorMetaDef } from '../../../domain/constants/floor-meta';
import type { LogEntry as LogEntryDef } from '../../../domain/models/game-state';
import {
  StatBar, StatusTag, StepDots, DiffBadge, LogEntry,
} from '../../../components/GameComponents';

/** ログフィルタータイプ */
type LogFilter = "all" | "damage" | "recovery" | "flag";

/** フィルター定義 */
const LOG_FILTERS: { key: LogFilter; label: string }[] = [
  { key: "all", label: "全て" },
  { key: "damage", label: "被害" },
  { key: "recovery", label: "回復" },
  { key: "flag", label: "状態変化" },
];

/** ログパネル */
const LogPanel = ({ log }: { log: readonly LogEntryDef[] }) => {
  const [filter, setFilter] = useState<LogFilter>("all");
  const [copied, setCopied] = useState(false);

  const reversed = log.slice().reverse();
  const filtered = filter === "all" ? reversed : reversed.filter(l => {
    if (filter === "damage") return l.hp < 0 || l.mn < 0;
    if (filter === "recovery") return l.hp > 0 || l.mn > 0;
    if (filter === "flag") return !!l.flag;
    return true;
  });

  const handleCopy = () => {
    const text = log.map(l => {
      const parts = [`第${l.fl}層-${l.step}: ${l.ch}`];
      if (l.hp !== 0) parts.push(`HP${l.hp > 0 ? "+" : ""}${l.hp}`);
      if (l.mn !== 0) parts.push(`精神${l.mn > 0 ? "+" : ""}${l.mn}`);
      if (l.inf !== 0) parts.push(`情報${l.inf > 0 ? "+" : ""}${l.inf}`);
      if (l.flag) parts.push(`[${l.flag}]`);
      return parts.join(" ");
    }).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // フロア区切り情報を事前計算（レンダリング中の副作用を避ける）
  const withSeparators = filtered.map((l, i) => ({
    entry: l,
    showSep: i === 0 || l.fl !== filtered[i - 1].fl,
    index: i,
  }));

  return (
    <div style={{ marginTop: 8, background: "rgba(0,0,0,.25)", borderRadius: 8, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {LOG_FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} aria-label={`フィルター：${f.label}`} aria-pressed={filter === f.key} style={{
              fontSize: 9, padding: "2px 8px", borderRadius: 10, border: "1px solid",
              borderColor: filter === f.key ? "rgba(99,102,241,.4)" : "rgba(50,50,80,.2)",
              background: filter === f.key ? "rgba(99,102,241,.12)" : "transparent",
              color: filter === f.key ? "#a5b4fc" : "#505070",
              cursor: "pointer", fontFamily: "var(--sans)", transition: "all .2s",
            }}>{f.label}</button>
          ))}
        </div>
        <button onClick={handleCopy} style={{
          fontSize: 9, padding: "2px 8px", borderRadius: 10, border: "1px solid rgba(50,50,80,.2)",
          background: copied ? "rgba(74,222,128,.12)" : "transparent",
          color: copied ? "#4ade80" : "#505070",
          cursor: "pointer", fontFamily: "var(--sans)", transition: "all .2s",
        }}>{copied ? "✓" : "📋"}</button>
      </div>
      <div style={{ maxHeight: 180, overflowY: "auto" }}>
        {withSeparators.length === 0
          ? <div style={{ fontSize: 11, color: "#404060", fontFamily: "var(--sans)" }}>ログなし</div>
          : withSeparators.map(({ entry: l, showSep, index: i }) => (
            <div key={`${l.fl}-${l.step}-${i}`}>
              {showSep && <div style={{ fontSize: 9, color: FLOOR_META[l.fl]?.color ?? "#818cf8", fontFamily: "var(--sans)", marginTop: i > 0 ? 6 : 0, marginBottom: 4, borderBottom: `1px solid ${FLOOR_META[l.fl]?.color ?? "#818cf8"}22`, paddingBottom: 2, letterSpacing: 1 }}>── 第{l.fl}層 ──</div>}
              <LogEntry index={i} entry={l} />
            </div>
          ))
        }
      </div>
    </div>
  );
};

/** StatusPanel の Props */
export interface StatusPanelProps {
  player: Player;
  floor: number;
  floorMeta: FloorMetaDef;
  floorColor: string;
  diff: DifficultyDef | null;
  step: number;
  progressPct: number;
  audioOn: boolean;
  toggleAudio: () => void;
  showLog: boolean;
  setShowLog: (v: boolean) => void;
  log: readonly LogEntryDef[];
  shake: boolean;
  isChainEvent: boolean;
}

export const StatusPanel = ({
  player, floor, floorMeta, floorColor, diff, step, progressPct,
  audioOn, toggleAudio, showLog, setShowLog, log, shake, isChainEvent,
}: StatusPanelProps) => (
  <div className={`card ${shake ? "shake" : ""}`} style={{ padding: "16px 20px", marginBottom: 12, animation: "fadeIn .3s" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div className="fb" style={{ background: `${floorColor}12`, border: `1px solid ${floorColor}25`, color: floorColor }}>
          <span style={{ fontWeight: 700 }}>第{floor}層</span><span style={{ opacity: .5 }}>|</span><span>{floorMeta.name}</span>
        </div>
        <DiffBadge diff={diff} />
        {isChainEvent && <span style={{ fontSize: 9, color: "#60a5fa", fontFamily: "var(--sans)", opacity: .8 }}>連続</span>}
      </div>
      <StepDots current={step} total={CFG.EVENTS_PER_FLOOR} />
    </div>
    <StatBar label="体力" value={player.hp} max={player.maxHp} color={player.hp < player.maxHp * .25 ? "#ef4444" : "linear-gradient(90deg,#ef4444,#f87171)"} icon="❤" />
    <StatBar label="精神力" value={player.mn} max={player.maxMn} color={player.mn < player.maxMn * .25 ? "#7c3aed" : "linear-gradient(90deg,#6366f1,#818cf8)"} icon="◈" />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, flexWrap: "wrap", gap: 6 }}>
      <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--sans)" }}>📖 情報: <span style={{ color: "#fbbf24", fontWeight: 700 }}>{player.inf}</span></div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{player.statuses.map(s => <StatusTag key={s} name={s} />)}</div>
    </div>
    <div style={{ marginTop: 10, height: 3, background: "rgba(20,20,50,.8)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${progressPct}%`, background: `linear-gradient(90deg,#6366f1,${floorColor})`, borderRadius: 2, transition: "width .5s" }} />
    </div>
    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 9, color: "#404060", fontFamily: "var(--sans)" }}>全体進捗 {Math.round(progressPct)}%</span>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={toggleAudio} style={{ fontSize: 10, color: audioOn ? "#4ade80" : "#404060", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)", transition: "color .2s" }}>{audioOn ? "♪" : "♪×"}</button>
        <button onClick={() => setShowLog(!showLog)} style={{ fontSize: 10, color: "var(--dim)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)" }}>{showLog ? "閉じる ▲" : "ログ ▼"}</button>
      </div>
    </div>
    {showLog && <LogPanel log={log} />}
  </div>
);
