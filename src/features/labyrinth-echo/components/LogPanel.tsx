/**
 * 迷宮の残響 - ログパネルコンポーネント
 *
 * イベント結果画面から分割されたログ表示パネル。
 * フィルター・フロアセパレーター・コピー機能を提供する。
 */
import { useState, useMemo } from 'react';
import { FLOOR_META } from '../domain/constants/floor-meta';
import type { LogEntry as LogEntryDef } from '../domain/models/game-state';
import { LogEntry } from './GameComponents';

/** ログフィルタータイプ */
export type LogFilter = "all" | "damage" | "recovery" | "flag";

/** フィルター定義 */
export const LOG_FILTERS: { key: LogFilter; label: string }[] = [
  { key: "all", label: "全て" },
  { key: "damage", label: "被害" },
  { key: "recovery", label: "回復" },
  { key: "flag", label: "状態変化" },
];

/** ログエントリーの一意キーを生成する */
const createLogKey = (entry: LogEntryDef, index: number): string =>
  `${entry.fl}-${entry.step}-${index}`;

/** フィルタリング済みログにフロアセパレーター情報を付与する */
const computeFloorSeparators = (entries: LogEntryDef[]): boolean[] => {
  let lastFloor = -1;
  return entries.map(entry => {
    const isNewFloor = entry.fl !== lastFloor;
    lastFloor = entry.fl;
    return isNewFloor;
  });
};

/** ログパネルの Props */
interface LogPanelProps {
  readonly log: readonly LogEntryDef[];
}

/** ログパネル（フィルター・フロアセパレーター・コピー機能付き） */
export const LogPanel = ({ log }: LogPanelProps) => {
  const [filter, setFilter] = useState<LogFilter>("all");
  const [copied, setCopied] = useState(false);

  const reversed = useMemo(() => log.slice().reverse(), [log]);
  const filtered = useMemo(() => {
    if (filter === "all") return reversed;
    return reversed.filter(l => {
      if (filter === "damage") return l.hp < 0 || l.mn < 0;
      if (filter === "recovery") return l.hp > 0 || l.mn > 0;
      if (filter === "flag") return !!l.flag;
      return true;
    });
  }, [reversed, filter]);
  const separators = useMemo(() => computeFloorSeparators(filtered), [filtered]);

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

  return (
    <div style={{ marginTop: 8, background: "rgba(0,0,0,.25)", borderRadius: 8, padding: 12 }}>
      {/* フィルターバー */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {LOG_FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
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
      {/* ログ本体 */}
      <div style={{ maxHeight: 180, overflowY: "auto" }}>
        {filtered.length === 0
          ? <div style={{ fontSize: 11, color: "#404060", fontFamily: "var(--sans)" }}>ログなし</div>
          : filtered.map((l, i) => (
              <div key={createLogKey(l, i)}>
                {separators[i] && <div style={{ fontSize: 9, color: FLOOR_META[l.fl]?.color ?? "#818cf8", fontFamily: "var(--sans)", marginTop: i > 0 ? 6 : 0, marginBottom: 4, borderBottom: `1px solid ${FLOOR_META[l.fl]?.color ?? "#818cf8"}22`, paddingBottom: 2, letterSpacing: 1 }}>── 第{l.fl}層 ──</div>}
                <LogEntry index={i} entry={l} />
              </div>
            ))
        }
      </div>
    </div>
  );
};
