/**
 * 迷宮の残響 - イベント画面
 *
 * EventResultScreen から分割。イベント表示・選択肢部分を担当する。
 */
import type { ReactNode } from 'react';
import { CFG } from '../../../game-logic';
import type { Player, DifficultyDef } from '../../../game-logic';
import { EVENT_TYPE } from '../../../definitions';
import type { FloorMetaDef, LogEntry as LogEntryDef } from '../../../definitions';
import type { GameEvent } from '../../../events/event-utils';
import { Page } from '../../../components/Page';
import {
  TypewriterText,
} from '../../../components/GameComponents';
import { LE_IMAGES, getSceneImage } from '../../../images';
import { useKeyboardControl } from '../../../hooks';
import { StatusPanel } from './StatusPanel';

/** 条件文字列を具体的なヒントテキストに変換 */
const conditionToDetailedHint = (cond: string): string => {
  if (cond.startsWith("hp>"))     return "体力に余裕があるなら…";
  if (cond.startsWith("hp<"))     return "体力が低い時に…";
  if (cond.startsWith("mn>"))     return "精神力が高ければ…";
  if (cond.startsWith("mn<"))     return "精神が弱っている時に…";
  if (cond.startsWith("inf>"))    return "情報が十分あれば…";
  if (cond.startsWith("inf<"))    return "情報が少ない時に…";
  if (cond.startsWith("status:")) return `「${cond.slice(7)}」の影響で…`;
  return "";
};

/** 条件文字列を曖昧なヒントテキストに変換 */
const conditionToVagueHint = (cond: string): string => {
  if (cond.startsWith("hp"))     return "身体の状態が関係するかもしれない…";
  if (cond.startsWith("mn"))     return "心の状態が影響するようだ…";
  if (cond.startsWith("inf"))    return "知識の量が鍵を握る…";
  if (cond.startsWith("status")) return "何かの状態が作用している…";
  return "何かの条件がありそうだ…";
};

/** アウトカムのカテゴリを判定 */
const classifyOutcomeCategory = (outcomes: { hp?: number; mn?: number; inf?: number; fl?: string }[]): string[] => {
  const cats: string[] = [];
  if (outcomes.some(o => (o.hp ?? 0) > 0 || (o.mn ?? 0) > 0)) cats.push("recovery");
  if (outcomes.some(o => (o.hp ?? 0) < 0 || (o.mn ?? 0) < 0)) cats.push("damage");
  if (outcomes.some(o => (o.inf ?? 0) > 0)) cats.push("info");
  if (outcomes.some(o => o.fl)) cats.push("flag");
  return cats;
};

/** カテゴリのアイコンマッピング */
const CATEGORY_ICONS: Record<string, string> = {
  recovery: "💚",
  damage: "💔",
  info: "📖",
  flag: "⚑",
};

/** EventScreen の Props */
export interface EventScreenProps {
  Particles: ReactNode;
  vignette: React.CSSProperties;
  overlay: string | null;
  shake: boolean;
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
  log: LogEntryDef[];
  event: GameEvent;
  revealed: string;
  done: boolean;
  ready: boolean;
  skip: () => void;
  handleChoice: (idx: number) => void;
  lowMental: boolean;
}

export const EventScreen = ({
  Particles, vignette, overlay, shake, player, floor, floorMeta, floorColor,
  diff, step, progressPct, audioOn, toggleAudio, showLog, setShowLog, log,
  event, revealed, done, ready, skip, handleChoice, lowMental,
}: EventScreenProps) => {
  const evType = EVENT_TYPE[event.tp];
  const isChainEvent = event.chainOnly;
  const bgImageUrl = getSceneImage(event, floor, player.st) ?? LE_IMAGES.events[event.tp as keyof typeof LE_IMAGES.events] ?? LE_IMAGES.events.exploration;

  const eventOptionsCount = done && ready ? event.ch.length : 0;
  const { selectedIndex: eventSelIdx, setSelectedIndex: setEventSelIdx } = useKeyboardControl({
    optionsCount: eventOptionsCount,
    onSelect: (idx) => handleChoice(idx),
    isActive: done && ready,
  });

  return (
    <Page particles={Particles} floor={floor}>
      <div className="vignette" style={vignette} />
      {overlay === "dmg" && <div className="dmg-overlay" />}
      {overlay === "heal" && <div className="heal-overlay" />}
      <StatusPanel
        player={player} floor={floor} floorMeta={floorMeta} floorColor={floorColor}
        diff={diff} step={step} progressPct={progressPct} audioOn={audioOn}
        toggleAudio={toggleAudio} showLog={showLog} setShowLog={setShowLog} log={log}
        shake={shake} isChainEvent={!!isChainEvent}
      />
      <div className={`card ${lowMental ? "distort" : ""}`} style={{ animation: "fadeUp .4s", overflow: "hidden" }}>
        {evType && (
          <div style={{
            height: 200, margin: "-16px -20px 16px", position: "relative",
            background: "#0f172a", borderBottom: `1px solid ${evType.colors[2] ?? "#333"}`,
            animation: "fadeIn 0.8s ease",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${bgImageUrl})`,
              backgroundSize: "cover", backgroundPosition: "center",
              opacity: 0.6, maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
            }} />
            <div style={{ position: "absolute", bottom: 10, left: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="tag" style={{ color: evType.colors[0], background: "rgba(15,23,42,0.8)", border: `1px solid ${evType.colors[2]}`, letterSpacing: 3, fontSize: 10, fontWeight: 700, backdropFilter: "blur(4px)" }}>{evType.label}</span>
              {isChainEvent && <span className="tag" style={{ color: "#60a5fa", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(96,165,250,.2)", fontSize: 10, backdropFilter: "blur(4px)" }}>連鎖</span>}
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "var(--sans)", textShadow: "0 1px 2px black" }}>#{(floor - 1) * CFG.EVENTS_PER_FLOOR + step + 1}/{CFG.MAX_FLOOR * CFG.EVENTS_PER_FLOOR}</span>
            </div>
          </div>
        )}
        <TypewriterText text={event.sit} revealed={revealed} done={done} ready={ready} skip={skip} />
        {done && ready && (
          <div style={{ animation: "fadeUp .4s" }}>
            <div className="sec-hd" style={{ color: "#505078" }}>── 行動を選択 ──</div>
            {event.ch.map((c, i) => {
              const conds = c.o?.filter(o => o.c !== "default").map(o => o.c) ?? [];
              const hasConditions = conds.length > 0;
              const showVagueIcon = player.inf >= 20 && hasConditions;
              const showSpecificIcon = player.inf >= 35 && hasConditions;
              const showCatIcons = player.inf >= 50;
              const hintIcon = showSpecificIcon
                ? conds[0].startsWith("hp") ? "❤" : conds[0].startsWith("mn") ? "◈" : conds[0].startsWith("inf") ? "📖" : conds[0].startsWith("status") ? "●" : null
                : showVagueIcon ? "?" : null;
              const hintText = player.inf >= 50 && hasConditions
                ? conditionToDetailedHint(conds[0])
                : player.inf >= 35 && hasConditions
                  ? conditionToVagueHint(conds[0])
                  : "";
              const cats = showCatIcons ? classifyOutcomeCategory(c.o) : [];
              return (
                <button key={i} className={`btn ${eventSelIdx === i ? 'selected' : ''}`} onMouseEnter={() => setEventSelIdx(i)} onClick={() => handleChoice(i)} style={{ display: "flex", alignItems: "flex-start", animation: `slideIn .3s ease ${i * 0.08}s both` }}>
                  <span className="cn">{i + 1}</span>
                  <span style={{ flex: 1 }}>
                    {c.t}
                    {hintText && <span className="key-hint" style={{ display: "block", fontSize: 10, color: "#a5b4fc", opacity: 0.6, marginTop: 2, animation: "fadeIn 0.3s ease 0.2s both" }}>{hintText}</span>}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 6, alignSelf: "center" }}>
                    {cats.map(cat => <span key={cat} style={{ fontSize: 9, opacity: .35 }} title={cat}>{CATEGORY_ICONS[cat]}</span>)}
                    {hintIcon && <span style={{ fontSize: 9, opacity: .4 }} title="条件あり">{hintIcon}</span>}
                    <span className="key-hint" style={{ fontSize: "0.7em", opacity: 0.5, fontFamily: "var(--sans)", color: "var(--dim)" }}>[{i + 1}]</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Page>
  );
};
