/**
 * 迷宮の残響 - GameRouter
 *
 * フェーズに応じた画面コンポーネントの切り替えを担当する。
 * ビジネスロジックを一切持たない純粋なルーティングコンポーネント。
 */
import type { ReactNode, CSSProperties } from 'react';
import type { Player } from '../../domain/models/player';
import type { DifficultyDef } from '../../domain/models/difficulty';
import type { MetaState } from '../../domain/models/meta-state';
import type { FxState } from '../../domain/models/unlock';
import type { AudioSettings } from '../../audio';
import type { EndingDef } from '../../domain/models/ending';
import type { FloorMetaDef } from '../../domain/constants/floor-meta';
import type { LogEntry } from '../../domain/models/game-state';
import type { GameEvent } from '../../events/event-utils';
import type { UIPhase } from '../hooks/use-game-orchestrator';

// 画面コンポーネント
import { TitleScreen } from '../../components/TitleScreen';
import { DiffSelectScreen } from '../../components/DiffSelectScreen';
import { UnlocksScreen, TitlesScreen, RecordsScreen } from '../../components/CollectionScreens';
import { SettingsScreen, ResetConfirm1Screen, ResetConfirm2Screen } from '../../components/SettingsScreens';
import { FloorIntroScreen } from '../../components/FloorIntroScreen';
import { GameOverScreen, VictoryScreen } from '../../components/EndScreens';
import { StatusOverlay } from '../../components/StatusOverlay';
import { GuidanceOverlay } from '../../components/GameComponents';
import { EventScreen } from './screens/EventScreen';
import { ResultScreen } from './screens/ResultScreen';
import { Page } from '../../components/Page';

/** GameRouter の Props */
export interface GameRouterProps {
  // フェーズ
  phase: UIPhase;

  // ゲーム状態
  player: Player | null;
  diff: DifficultyDef | null;
  event: GameEvent | null;
  floor: number;
  step: number;
  ending: EndingDef | null;
  isNewEnding: boolean;
  isNewDiffClear: boolean;
  usedSecondLife: boolean;
  chainNext: string | null;
  log: readonly LogEntry[];

  // 結果表示
  resTxt: string;
  resChg: { hp: number; mn: number; inf: number; fl?: string } | null;
  drainInfo: { hp: number; mn: number } | null;

  // メタ・派生値
  meta: MetaState;
  fx: FxState;
  progressPct: number;
  floorMeta: FloorMetaDef;
  floorColor: string;
  vignette: CSSProperties;
  lowMental: boolean;

  // UI 状態
  showLog: boolean;
  audioSettings: AudioSettings;
  lastBought: string | null;

  // ビジュアルFX
  shake: boolean;
  overlay: string | null;

  // テキスト表示
  revealed: string;
  done: boolean;
  ready: boolean;
  skip: () => void;

  // パーティクル
  Particles: ReactNode;

  // イベント数
  eventCount: number;

  // ハンドラ
  startRun: () => void;
  enableAudio: () => void;
  selectDiff: (d: DifficultyDef) => void;
  enterFloor: () => void;
  handleChoice: (idx: number) => void;
  proceed: () => void;
  doUnlock: (uid: string) => void;
  toggleAudio: () => void;
  setShowLog: (v: boolean) => void;
  setPhase: (phase: string) => void;
  updateMeta: (updater: (prev: MetaState) => Partial<MetaState>) => void;
  resetMeta: () => Promise<void>;
  handleAudioSettingsChange: (next: AudioSettings) => void;
}

/** ローディング画面 */
export const LoadingScreen = ({ Particles }: { Particles: ReactNode }) => (
  <Page particles={Particles}>
    <div style={{ marginTop: "38vh", textAlign: "center" }}>
      <div style={{ fontSize: 24, letterSpacing: 6, color: "var(--bright)", marginBottom: 12, animation: "glow 3s ease-in-out infinite", opacity: .6 }}>迷宮の残響</div>
      <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--sans)", animation: "pulse 1.5s infinite", letterSpacing: 2 }}>loading...</div>
    </div>
  </Page>
);

/** フェーズに応じた画面を切り替えるルーターコンポーネント */
export const GameRouter = (props: GameRouterProps) => {
  const {
    phase, player, diff, event, floor, step, ending, isNewEnding, isNewDiffClear,
    usedSecondLife, chainNext, log, resTxt, resChg, drainInfo,
    meta, fx, progressPct, floorMeta, floorColor, vignette, lowMental,
    showLog, audioSettings, lastBought, shake, overlay,
    revealed, done, ready, skip, Particles, eventCount,
    startRun, enableAudio, selectDiff, enterFloor, handleChoice, proceed,
    doUnlock, toggleAudio, setShowLog, setPhase, updateMeta, resetMeta,
    handleAudioSettingsChange,
  } = props;

  const audioOn = audioSettings.sfxEnabled;
  // 1周目はガイダンスを表示
  const showGuidance = meta.runs <= 1 && ["floor_intro", "event", "result"].includes(phase);

  if (phase === "title") {
    return <TitleScreen meta={meta} Particles={Particles} startRun={startRun} enableAudio={enableAudio} setPhase={setPhase} eventCount={eventCount} />;
  }
  if (phase === "diff_select") {
    return <DiffSelectScreen Particles={Particles} fx={fx} meta={meta} selectDiff={selectDiff} setPhase={setPhase} />;
  }
  if (phase === "unlocks") {
    return <UnlocksScreen Particles={Particles} meta={meta} lastBought={lastBought} doUnlock={doUnlock} setPhase={setPhase} />;
  }
  if (phase === "titles") {
    return <TitlesScreen Particles={Particles} meta={meta} updateMeta={updateMeta} setPhase={setPhase} />;
  }
  if (phase === "records") {
    return <RecordsScreen Particles={Particles} meta={meta} setPhase={setPhase} />;
  }
  if (phase === "settings") {
    return <SettingsScreen Particles={Particles} eventCount={eventCount} audioSettings={audioSettings} onChangeAudioSettings={handleAudioSettingsChange} setPhase={setPhase} />;
  }
  if (phase === "reset_confirm1") {
    return <ResetConfirm1Screen Particles={Particles} meta={meta} setPhase={setPhase} />;
  }
  if (phase === "reset_confirm2") {
    return <ResetConfirm2Screen Particles={Particles} setPhase={setPhase} resetMeta={resetMeta} />;
  }

  if (phase === "floor_intro") {
    return (
      <>
        <FloorIntroScreen Particles={Particles} floor={floor} floorMeta={floorMeta} floorColor={floorColor} diff={diff} meta={meta} progressPct={progressPct} player={player} chainNext={chainNext} enterFloor={enterFloor} />
        <GuidanceOverlay show={showGuidance} />
      </>
    );
  }

  if (phase === "event" && player && event) {
    return (
      <>
        <EventScreen
          Particles={Particles} vignette={vignette} overlay={overlay} shake={shake} player={player}
          floor={floor} floorMeta={floorMeta} floorColor={floorColor} diff={diff} step={step} progressPct={progressPct}
          audioOn={audioOn} toggleAudio={toggleAudio} showLog={showLog} setShowLog={setShowLog} log={log}
          event={event} revealed={revealed} done={done} ready={ready} skip={skip}
          handleChoice={handleChoice} lowMental={lowMental}
        />
        <StatusOverlay statuses={[...player.statuses]} />
        <GuidanceOverlay show={showGuidance} />
      </>
    );
  }

  if (phase === "result" && player) {
    return (
      <>
        <ResultScreen
          Particles={Particles} vignette={vignette} overlay={overlay} shake={shake} player={player}
          floor={floor} floorMeta={floorMeta} floorColor={floorColor} diff={diff} step={step} progressPct={progressPct}
          audioOn={audioOn} toggleAudio={toggleAudio} showLog={showLog} setShowLog={setShowLog} log={log}
          resTxt={resTxt} revealed={revealed} done={done} ready={ready} skip={skip}
          resChg={resChg} drainInfo={drainInfo} proceed={proceed} lowMental={lowMental}
          isChainEvent={!!event?.chainOnly}
        />
        <StatusOverlay statuses={[...player.statuses]} />
        <GuidanceOverlay show={showGuidance} />
      </>
    );
  }

  if (phase === "gameover") {
    return <GameOverScreen Particles={Particles} player={player} meta={meta} diff={diff} floor={floor} floorMeta={floorMeta} floorColor={floorColor} progressPct={progressPct} log={log} usedSecondLife={usedSecondLife} startRun={startRun} setPhase={setPhase} />;
  }
  if (phase === "victory") {
    return <VictoryScreen Particles={Particles} ending={ending} isNewEnding={isNewEnding} isNewDiffClear={isNewDiffClear} diff={diff} player={player} usedSecondLife={usedSecondLife} log={log} meta={meta} floor={floor} startRun={startRun} setPhase={setPhase} />;
  }

  return null;
};
