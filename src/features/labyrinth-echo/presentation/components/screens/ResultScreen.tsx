/**
 * 迷宮の残響 - 結果画面
 *
 * EventResultScreen から分割。選択結果の表示部分を担当する。
 */
import type { ReactNode, CSSProperties } from 'react';
import { CFG } from '../../../domain/constants/config';
import type { Player } from '../../../domain/models/player';
import type { DifficultyDef } from '../../../domain/models/difficulty';
import type { FloorMetaDef } from '../../../domain/constants/floor-meta';
import type { LogEntry as LogEntryDef } from '../../../domain/models/game-state';
import { Page } from '../../../components/Page';
import {
  TypewriterText, Change, FlagIndicator, DrainDisplay,
} from '../../../components/GameComponents';
import { useKeyboardControl } from '../../hooks/use-keyboard-control';
import { StatusPanel } from './StatusPanel';

/** 結果表示の変化量 */
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

/** ResultScreen の Props */
export interface ResultScreenProps {
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
  log: readonly LogEntryDef[];
  resTxt: string;
  revealed: string;
  done: boolean;
  ready: boolean;
  skip: () => void;
  resChg: ResChange | null;
  drainInfo: DrainInfo | null;
  proceed: () => void;
  lowMental: boolean;
  isChainEvent: boolean;
}

export const ResultScreen = ({
  Particles, vignette, overlay, shake, player, floor, floorMeta, floorColor,
  diff, step, progressPct, audioOn, toggleAudio, showLog, setShowLog, log,
  resTxt, revealed, done, ready, skip, resChg, drainInfo, proceed, lowMental, isChainEvent,
}: ResultScreenProps) => {
  const showProceed = done && ready && player.hp > 0 && player.mn > 0 && resChg?.fl !== "escape";
  const { selectedIndex: resSelIdx } = useKeyboardControl({
    optionsCount: showProceed ? 1 : 0,
    onSelect: () => proceed(),
    isActive: showProceed,
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
        shake={shake} isChainEvent={isChainEvent}
      />
      <div className={`card ${lowMental ? "distort" : ""}`} style={{ animation: "fadeUp .4s", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span className="tag" style={{ color: "#fbbf24", background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)", letterSpacing: 3, fontSize: 10, fontWeight: 600 }}>結 果</span>
        </div>
        <TypewriterText text={resTxt} revealed={revealed} done={done} ready={ready} skip={skip} mb={24} minHeight={60} />
        {done && ready && resChg && (
          <div style={{ animation: "fadeUp .3s" }}>
            {(() => {
              const net = (resChg.hp ?? 0) + (resChg.mn ?? 0) + (resChg.inf ?? 0);
              const borderClr = net > 0 ? "rgba(74,222,128,.18)" : net < 0 ? "rgba(248,113,113,.15)" : "rgba(50,50,80,.15)";
              const bgClr = net > 0 ? "rgba(74,222,128,.03)" : net < 0 ? "rgba(248,113,113,.03)" : "rgba(8,8,20,.5)";
              return (
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 12, padding: "12px 16px", background: bgClr, borderRadius: 10, border: `1px solid ${borderClr}` }}>
                  {resChg.hp !== 0 && <Change value={resChg.hp} label="HP" />}
                  {resChg.mn !== 0 && <Change value={resChg.mn} label="精神" />}
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
          </div>
        )}
      </div>
    </Page>
  );
};
