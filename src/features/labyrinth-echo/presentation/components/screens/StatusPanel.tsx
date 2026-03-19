/**
 * 迷宮の残響 - ステータスパネル
 *
 * EventScreen / ResultScreen で共有するステータス表示部分。
 */
import { CFG } from '../../../domain/constants/config';
import type { Player } from '../../../domain/models/player';
import type { DifficultyDef } from '../../../domain/models/difficulty';
import type { FloorMetaDef } from '../../../domain/constants/floor-meta';
import type { LogEntry as LogEntryDef } from '../../../domain/models/game-state';
import {
  StatBar, StatusTag, StepDots, DiffBadge,
} from '../../../components/GameComponents';
import { LogPanel } from '../../../components/LogPanel';

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
