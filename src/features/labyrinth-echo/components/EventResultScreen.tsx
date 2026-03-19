/**
 * 迷宮の残響 - イベント・結果画面
 */
import type { CSSProperties, ReactNode } from 'react';
import { CFG } from '../domain/constants/config';
import type { Player } from '../domain/models/player';
import type { DifficultyDef } from '../domain/models/difficulty';
import { EVENT_TYPE } from '../domain/constants/event-type-defs';
import type { FloorMetaDef } from '../domain/constants/floor-meta';
import type { LogEntry as LogEntryDef } from '../domain/models/game-state';
import type { GameEvent } from '../events/event-utils';
import { Page } from './Page';
import {
  StatBar, StatusTag, StepDots, DiffBadge,
  TypewriterText, Change, FlagIndicator, DrainDisplay,
} from './GameComponents';
import { LE_IMAGES, getSceneImage } from '../images';
import { useKeyboardControl } from '../presentation/hooks/use-keyboard-control';
import { LogPanel } from './LogPanel';

/** 条件文字列を具体的なヒントテキストに変換（高情報値で開放） */
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

/** 条件文字列を曖昧なヒントテキストに変換（中間の情報値で表示） */
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

/** イベント結果の変化量 */
interface ResChange {
  hp: number;
  mn: number;
  inf: number;
  fl?: string;
}

/** ドレイン情報 */
interface DrainInfo {
  hp: number;
  mn: number;
}

/** EventResultScreen の Props */
interface EventResultScreenProps {
  Particles: ReactNode;
  vignette: CSSProperties;
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
  event: GameEvent | null;
  phase: string;
  revealed: string;
  done: boolean;
  ready: boolean;
  skip: () => void;
  handleChoice: (idx: number) => void;
  resTxt: string;
  resChg: ResChange | null;
  drainInfo: DrainInfo | null;
  proceed: () => void;
  lowMental: boolean;
}

export const EventResultScreen = ({
  Particles, vignette, overlay, shake, player, floor, floorMeta, floorColor,
  diff, step, progressPct, audioOn, toggleAudio, showLog, setShowLog, log,
  event, phase, revealed, done, ready, skip, handleChoice, resTxt, resChg, drainInfo, proceed, lowMental,
}: EventResultScreenProps) => {
  const evType = event ? EVENT_TYPE[event.tp] : null;
  const isChainEvent = event?.chainOnly;

  const bgImageUrl = event
    ? (getSceneImage(event, floor, [...player.statuses]) ?? LE_IMAGES.events[event.tp as keyof typeof LE_IMAGES.events] ?? LE_IMAGES.events.exploration)
    : '';

  const eventOptionsCount = phase === "event" && done && ready && event ? event.ch.length : 0;
  const { selectedIndex: eventSelIdx, setSelectedIndex: setEventSelIdx } = useKeyboardControl({
    optionsCount: eventOptionsCount,
    onSelect: (idx) => handleChoice(idx),
    isActive: phase === "event" && done && ready
  });

  const showProceed = phase === "result" && done && ready && player.hp > 0 && player.mn > 0 && resChg?.fl !== "escape";
  const { selectedIndex: resSelIdx } = useKeyboardControl({
    optionsCount: showProceed ? 1 : 0,
    onSelect: () => proceed(),
    isActive: showProceed
  });

  return (
    <Page particles={Particles} floor={floor}>
      <div className="vignette" style={vignette} />
      {overlay === "dmg" && <div className="dmg-overlay" />}
      {overlay === "heal" && <div className="heal-overlay" />}
      {/* ステータスパネル */}
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
      {/* メインイベントカード */}
      <div className={`card ${lowMental ? "distort" : ""}`} style={{ animation: "fadeUp .4s", overflow: "hidden" }}>
        {event && evType && (
          <div style={{
            height: 200, margin: "-16px -20px 16px", position: "relative",
            background: "#0f172a", borderBottom: `1px solid ${evType.colors[2] ?? "#333"}`,
            animation: "fadeIn 0.8s ease"
          }}>
             <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `url(${bgImageUrl})`,
              backgroundSize: "cover", backgroundPosition: "center",
              opacity: 0.6, maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)"
            }} />
            <div style={{ position: "absolute", bottom: 10, left: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <span className="tag" style={{ color: evType.colors[0], background: "rgba(15,23,42,0.8)", border: `1px solid ${evType.colors[2]}`, letterSpacing: 3, fontSize: 10, fontWeight: 700, backdropFilter: "blur(4px)" }}>{evType.label}</span>
              {isChainEvent && <span className="tag" style={{ color: "#60a5fa", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(96,165,250,.2)", fontSize: 10, backdropFilter: "blur(4px)" }}>連鎖</span>}
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "var(--sans)", textShadow: "0 1px 2px black" }}>#{(floor - 1) * CFG.EVENTS_PER_FLOOR + step + 1}/{CFG.MAX_FLOOR * CFG.EVENTS_PER_FLOOR}</span>
            </div>
          </div>
        )}
        {phase === "event" && event && <>
          <TypewriterText text={event.sit} revealed={revealed} done={done} ready={ready} skip={skip} />
          {done && ready && <div style={{ animation: "fadeUp .4s" }}>
            <div className="sec-hd" style={{ color: "#505078" }}>── 行動を選択 ──</div>
            {event.ch.map((c, i) => {
              const conds = c.o?.filter(o => o.c !== "default").map(o => o.c) ?? [];
              // ヒント表示の5段階:
              // inf < 20: 何も表示しない
              // 20-34: "?" アイコンのみ（条件の存在を示唆）
              // 35-49: 曖昧なテキスト（「身体の状態が関係するかもしれない…」等）
              // 50+: 具体的テキスト（「体力に余裕があるなら…」等）+ カテゴリアイコン
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
              return <button key={i} className={`btn ${eventSelIdx === i ? 'selected' : ''}`} onMouseEnter={() => setEventSelIdx(i)} onClick={() => handleChoice(i)} style={{ display: "flex", alignItems: "flex-start", animation: `slideIn .3s ease ${i * 0.08}s both` }}>
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
              </button>;
            })}
          </div>}
        </>}
        {phase === "result" && <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span className="tag" style={{ color: "#fbbf24", background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)", letterSpacing: 3, fontSize: 10, fontWeight: 600 }}>結 果</span>
          </div>
          <TypewriterText text={resTxt} revealed={revealed} done={done} ready={ready} skip={skip} mb={24} minHeight={60} />
          {done && ready && resChg && <div style={{ animation: "fadeUp .3s" }}>
            {(() => {
              const net = (resChg.hp ?? 0) + (resChg.mn ?? 0) + (resChg.inf ?? 0);
              const borderClr = net > 0 ? "rgba(74,222,128,.18)" : net < 0 ? "rgba(248,113,113,.15)" : "rgba(50,50,80,.15)";
              const bgClr = net > 0 ? "rgba(74,222,128,.03)" : net < 0 ? "rgba(248,113,113,.03)" : "rgba(8,8,20,.5)";
              return (
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 12, padding: "12px 16px", background: bgClr, borderRadius: 10, border: `1px solid ${borderClr}` }}>
                  {resChg.hp !== 0  && <Change value={resChg.hp} label="HP" />}
                  {resChg.mn !== 0  && <Change value={resChg.mn} label="精神" />}
                  {resChg.inf !== 0 && <Change value={resChg.inf} label="情報" />}
                  <FlagIndicator flag={resChg.fl ?? null} />
                </div>
              );
            })()}
            <DrainDisplay drain={drainInfo} />
            {showProceed && (() => {
              const remaining = CFG.EVENTS_PER_FLOOR - step;
              const nextFloorFlag = step >= CFG.EVENTS_PER_FLOOR && floor < CFG.MAX_FLOOR;
              return (
                <div style={{ fontSize: 10, color: "#505070", fontFamily: "var(--sans)", marginBottom: 10, display: "flex", gap: 12, justifyContent: "center" }}>
                  {remaining > 0 && <span>この層 残り{remaining}イベント</span>}
                  {nextFloorFlag && <span style={{ color: floorColor }}>→ 第{floor + 1}層へ</span>}
                </div>
              );
            })()}
            {showProceed && <button className={`btn btn-p tc ${resSelIdx === 0 ? 'selected' : ''}`} onClick={proceed}>先に進む</button>}
          </div>}
        </>}
      </div>
    </Page>
  );
};
