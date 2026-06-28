/**
 * 迷宮の残響 — メインゲームコンポーネント（薄いシェル）
 *
 * Phase 4 リファクタリング: GameInner のロジックを useGameOrchestrator に移動。
 * ErrorBoundary + GameProvider + GameRouter の構成。
 */
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { CFG } from '../domain/constants/config';
import { computeFx, createNewPlayer } from '../domain/services/unlock-service';
import { mergeLegacyIntoFx, getLegacyById } from '../domain/services/legacy-service';
import { FLOOR_META } from '../domain/constants/floor-meta';
import { EVENT_TYPE } from '../domain/constants/event-type-defs';
import { randomInt } from '../../../utils/math-utils';
import type { DifficultyDef } from '../domain/models/difficulty';
import { ErrorBoundary } from '../contracts';
import { AudioEngine, loadAudioSettings, saveAudioSettings } from '../audio';
import type { AudioSettings } from '../audio';
import { EV } from '../events/event-data';
import { ECHO_EVENTS } from '../events/echo-events';
import { REVENANT_EVENTS } from '../events/revenant-events';
import { computeVignette, validateEvents, pickEvent, findChainEvent } from '../events/event-utils';
import { applyPressureToDifficulty } from '../domain/services/pressure-service';
import { getRandomSource, resetRandomSourceCache } from './get-random-source';
import { useTextReveal } from './hooks/use-text-reveal';
import { useImagePreload } from './hooks/use-image-preload';
import { LE_BG_IMAGES } from '../images';
import { useGameOrchestrator, GameContext, type UIPhase } from './hooks/use-game-orchestrator';
import { useAudioEffects } from './hooks/use-audio-effects';
import { usePersistenceSync } from './hooks/use-persistence-sync';
import { useVisualFx } from './hooks/use-visual-fx';
import { useGameActions } from './hooks/use-game-actions';
import { GameRouter, LoadingScreen } from './components/GameRouter';
import { ToastContainer } from '../components/GameComponents';
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter';
import type { StorageInterface } from './hooks/use-persistence-sync';

/** StorageInterface に適合するアダプターインスタンス */
const storageAdapter = new LocalStorageAdapter();
const Storage: StorageInterface = {
  save: (meta) => storageAdapter.saveMeta(meta),
  load: () => storageAdapter.loadMeta(),
};

/** 全体進捗率を計算する（プレゼンテーション層のユーティリティ） */
const computeProgress = (floor: number, step: number): number =>
  Math.min(100, ((floor - 1) * CFG.EVENTS_PER_FLOOR + step) / (CFG.MAX_FLOOR * CFG.EVENTS_PER_FLOOR) * 100);

// イベントデータのバリデーション（通常 + echo + 亡霊イベントを統合）
const EVENTS = validateEvents([...EV, ...ECHO_EVENTS, ...REVENANT_EVENTS], EVENT_TYPE);

/** パーティクルアニメーション（静的コンテンツのためコンポーネント外に定義） */
const Particles = (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
    {[...Array(20)].map((_, i) => <div key={i} style={{ position: "absolute", width: randomInt(1, 3), height: randomInt(1, 3), background: `rgba(${randomInt(100, 200)},${randomInt(120, 220)},${randomInt(180, 255)},${(randomInt(10, 25) / 100).toFixed(2)})`, borderRadius: "50%", left: `${randomInt(0, 100)}%`, top: `${randomInt(0, 100)}%`, animation: `float ${randomInt(8, 22)}s ease-in-out infinite ${randomInt(0, 10)}s` }} />)}
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 80%,rgba(99,102,241,.04) 0%,transparent 60%)", animation: "breathe 8s ease-in-out infinite" }} />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%,rgba(139,92,246,.03) 0%,transparent 50%)", animation: "breathe 12s ease-in-out infinite 3s" }} />
  </div>
);

/** ゲーム内部コンポーネント — useGameOrchestrator で状態管理 */
function GameInner() {
  // setTimeout クリーンアップ用
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    return () => { pendingTimers.current.forEach(clearTimeout); };
  }, []);
  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      fn();
      pendingTimers.current = pendingTimers.current.filter(t => t !== id);
    }, ms);
    pendingTimers.current.push(id);
    return id;
  }, []);

  const { state, dispatch, contextValue } = useGameOrchestrator();
  const { meta, updateMeta, resetMeta, loaded } = usePersistenceSync(Storage);

  // オーディオ設定
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(loadAudioSettings);

  // ビジュアルFX
  const { shake, overlay, flash, doShake } = useVisualFx();

  // 派生値
  // baseFx: アンロック状態のみ反映した基本fx（レガシー未適用・DiffSelectScreen のプレビューに使用）
  const baseFx = useMemo(() => computeFx(meta.unlocked), [meta.unlocked]);
  // activeFx: run 中の legacyId を baseFx に畳み込んだ実効fx（useGameActions/processChoice/computeDrain で使用）
  const activeFx = useMemo(
    () => mergeLegacyIntoFx(baseFx, getLegacyById(state.legacyId)),
    [baseFx, state.legacyId],
  );
  const progressPct = useMemo(() => computeProgress(state.floor, state.step), [state.floor, state.step]);
  const floorMeta = FLOOR_META[state.floor] ?? FLOOR_META[1];
  const floorColor = floorMeta.color;
  const vignette = useMemo(() => computeVignette(state.player), [state.player]);
  const lowMental = state.player !== null && state.player.mn < state.player.maxMn * 0.3;

  // 次フロアの背景画像をプリロード
  const nextFloorImages = useMemo(() => {
    const next = state.floor + 1;
    const bg = LE_BG_IMAGES[next];
    if (!bg) return [];
    return [bg.far, bg.mid, bg.near].filter(Boolean);
  }, [state.floor]);
  useImagePreload(nextFloorImages);

  // フェーズ変更時にスクロールトップ
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [state.phase]);

  // テキスト表示
  const activeText: string | null = state.phase === "event" ? (state.event?.sit ?? null) : state.phase === "result" ? state.resTxt : null;
  const { revealed, done, ready, skip } = useTextReveal(activeText, audioSettings.sfxEnabled);

  // BGM制御・危機状態更新（useAudioEffects に委譲）
  useAudioEffects({
    phase: state.phase,
    floor: state.floor,
    event: state.event,
    player: state.player,
    feedback: null,
    sfxEnabled: audioSettings.sfxEnabled,
    bgmEnabled: audioSettings.bgmEnabled,
    bgmVolume: audioSettings.bgmVolume,
    audioEngine: AudioEngine,
  });

  // SFX ヘルパー
  const sfx = useCallback((fn: () => void) => { if (audioSettings.sfxEnabled) fn(); }, [audioSettings.sfxEnabled]);

  // オーディオ設定ハンドラ
  const handleAudioSettingsChange = useCallback((next: AudioSettings) => {
    setAudioSettings(next);
    saveAudioSettings(next);
    if (next.bgmEnabled || next.sfxEnabled) { AudioEngine.init(); AudioEngine.resume(); }
    AudioEngine.bgm.setBgmVolume(next.bgmEnabled ? next.bgmVolume : 0);
  }, []);
  const enableAudio = useCallback(() => {
    const next = { ...audioSettings, sfxEnabled: true, bgmEnabled: true };
    handleAudioSettingsChange(next);
  }, [audioSettings, handleAudioSettingsChange]);
  const toggleAudio = useCallback(() => {
    const allOn = audioSettings.sfxEnabled && audioSettings.bgmEnabled;
    const next = { ...audioSettings, sfxEnabled: !allOn, bgmEnabled: !allOn };
    handleAudioSettingsChange(next);
  }, [audioSettings, handleAudioSettingsChange]);

  // ── ゲームアクション（useGameActions に委譲） ──
  // activeFx を渡すことで processChoice/computeDrain がレガシー反映の fx を使う
  const { handleChoice, proceed, doUnlock } = useGameActions({
    state, dispatch, fx: activeFx, meta, events: EVENTS,
    sfx, safeTimeout, doShake, flash, updateMeta,
    audioSfx: AudioEngine.sfx,
  });

  const startRun = useCallback(() => { enableAudio(); dispatch({ type: 'START_RUN' }); }, [enableAudio, dispatch]);

  const selectDiff = useCallback((d: DifficultyDef, pressure: number, legacyId: string | null) => {
    enableAudio();
    resetRandomSourceCache();
    // 残響圧を実効難易度に反映する
    const eff = applyPressureToDifficulty(d, pressure);
    // ラン開始時の実効fx: baseFx にレガシーを畳み込んで初期プレイヤーを生成する
    const runFx = mergeLegacyIntoFx(baseFx, getLegacyById(legacyId));
    const player = createNewPlayer(eff, runFx);
    dispatch({ type: 'SELECT_DIFFICULTY', difficulty: eff, player, pressure, legacyId });
    updateMeta(m => ({ runs: m.runs + 1 }));
  }, [baseFx, enableAudio, dispatch, updateMeta]);

  const enterFloor = useCallback(() => {
    sfx(AudioEngine.sfx.floor);
    safeTimeout(() => sfx(() => AudioEngine.sfx.ambient(state.floor)), 500);
    if (state.chainNext) {
      const chainEvent = findChainEvent(EVENTS, state.chainNext);
      if (chainEvent) { dispatch({ type: 'SET_EVENT', event: chainEvent }); return; }
    }
    // イベントピックはレガシー反映後の実効fx（activeFx）を使用する
    const nextEvent = pickEvent({ events: EVENTS, floor: state.floor, usedIds: [...state.usedIds], meta, fx: activeFx, rng: getRandomSource(), pressure: state.pressure });
    if (nextEvent) dispatch({ type: 'SET_EVENT', event: nextEvent });
    else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[enterFloor] No events for floor ${state.floor}`);
      }
    }
  }, [state.floor, state.usedIds, state.chainNext, state.pressure, sfx, safeTimeout, meta, activeFx, dispatch]);

  const setPhase = useCallback((phase: UIPhase) => {
    if (phase === "title") {
      dispatch({ type: 'BACK_TO_TITLE' });
    } else {
      dispatch({ type: 'NAVIGATE_MENU', screen: phase });
    }
  }, [dispatch]);

  // ローディング画面
  if (!loaded) return <LoadingScreen Particles={Particles} />;

  return (
    <GameContext.Provider value={contextValue}>
      {/* アンロック通知トースト（labyrinth-echo-unlock イベントを購読。画面遷移をまたいで常設） */}
      <ToastContainer />
      <GameRouter
        phase={state.phase}
        game={{
          player: state.player,
          diff: state.diff,
          event: state.event,
          floor: state.floor,
          step: state.step,
          ending: state.ending,
          isNewEnding: state.isNewEnding,
          isNewDiffClear: state.isNewDiffClear,
          usedSecondLife: state.usedSecondLife,
          chainNext: state.chainNext,
          log: state.log,
          resTxt: state.resTxt,
          resChg: state.resChg,
          drainInfo: state.drainInfo,
          legacyId: state.legacyId,
        }}
        derived={{
          meta,
          // DiffSelectScreen にはレガシー未適用のベースfxを渡す（プレビューは画面内で合成）
          fx: baseFx,
          progressPct,
          floorMeta,
          floorColor,
          vignette,
          lowMental,
        }}
        ui={{
          showLog: state.showLog,
          audioSettings,
          lastBought: state.lastBought,
          shake,
          overlay,
          revealed,
          done,
          ready,
        }}
        handlers={{
          startRun,
          enableAudio,
          selectDiff,
          enterFloor,
          handleChoice,
          proceed,
          doUnlock,
          toggleAudio,
          setShowLog: () => dispatch({ type: 'TOGGLE_LOG' }),
          setPhase,
          updateMeta,
          resetMeta,
          handleAudioSettingsChange,
          skip,
        }}
        Particles={Particles}
        eventCount={EV.length}
      />
    </GameContext.Provider>
  );
}

/** 薄いシェル: ErrorBoundary + GameInner */
export function LabyrinthEchoGame() {
  return <ErrorBoundary><GameInner /></ErrorBoundary>;
}
