/**
 * 迷宮の残響 — メインゲームコンポーネント（薄いシェル）
 *
 * Phase 4 リファクタリング: GameInner のロジックを useGameOrchestrator に移動。
 * ErrorBoundary + GameProvider + GameRouter の構成。
 */
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { CFG } from '../domain/constants/config';
import { UNLOCKS } from '../domain/constants/unlock-defs';
import { computeFx, createNewPlayer } from '../domain/services/unlock-service';
import { FLOOR_META } from '../domain/constants/floor-meta';
import { EVENT_TYPE } from '../domain/constants/event-type-defs';
import { determineEnding } from '../domain/services/ending-service';
import { randomInt } from '../../../utils/math-utils';
import type { DifficultyDef } from '../domain/models/difficulty';
import { ErrorBoundary } from '../contracts';
import { AudioEngine, loadAudioSettings, saveAudioSettings } from '../audio';
import type { AudioSettings } from '../audio';
import { EV } from '../events/event-data';
import { computeVignette, processChoice, validateEvents, pickEvent, findChainEvent } from '../events/event-utils';
import { getRandomSource, resetRandomSourceCache } from './get-random-source';
import { useTextReveal } from './hooks/use-text-reveal';
import { useImagePreload } from './hooks/use-image-preload';
import { LE_BG_IMAGES } from '../images';
import { useGameOrchestrator, GameContext, type UIPhase } from './hooks/use-game-orchestrator';
import { useAudioEffects } from './hooks/use-audio-effects';
import { usePersistenceSync } from './hooks/use-persistence-sync';
import { useVisualFx } from './hooks/use-visual-fx';
import { GameRouter, LoadingScreen } from './components/GameRouter';
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

// イベントデータのバリデーション
const EVENTS = validateEvents(EV, EVENT_TYPE);

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
  const fx = useMemo(() => computeFx(meta.unlocked), [meta.unlocked]);
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

  // パーティクル
  const Particles = useMemo(() => (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {[...Array(20)].map((_, i) => <div key={i} style={{ position: "absolute", width: randomInt(1, 3), height: randomInt(1, 3), background: `rgba(${randomInt(100, 200)},${randomInt(120, 220)},${randomInt(180, 255)},${(randomInt(10, 25) / 100).toFixed(2)})`, borderRadius: "50%", left: `${randomInt(0, 100)}%`, top: `${randomInt(0, 100)}%`, animation: `float ${randomInt(8, 22)}s ease-in-out infinite ${randomInt(0, 10)}s` }} />)}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 80%,rgba(99,102,241,.04) 0%,transparent 60%)", animation: "breathe 8s ease-in-out infinite" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%,rgba(139,92,246,.03) 0%,transparent 50%)", animation: "breathe 12s ease-in-out infinite 3s" }} />
    </div>
  ), []);

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

  // ── ゲームアクション（dispatch でリデューサーに委譲） ──

  const startRun = useCallback(() => { enableAudio(); dispatch({ type: 'START_RUN' }); }, [enableAudio, dispatch]);

  const selectDiff = useCallback((d: DifficultyDef) => {
    enableAudio();
    // テスト用: ゲーム開始時に乱数キャッシュをリセットし、同じ seed から再現可能にする
    resetRandomSourceCache();
    const player = createNewPlayer(d, fx);
    dispatch({ type: 'SELECT_DIFFICULTY', difficulty: d, player });
    updateMeta(m => ({ runs: m.runs + 1 }));
  }, [fx, enableAudio, dispatch, updateMeta]);

  const enterFloor = useCallback(() => {
    sfx(AudioEngine.sfx.floor);
    safeTimeout(() => sfx(() => AudioEngine.sfx.ambient(state.floor)), 500);
    if (state.chainNext) {
      const ce = findChainEvent(EVENTS, state.chainNext);
      if (ce) { dispatch({ type: 'SET_EVENT', event: ce }); return; }
    }
    const e = pickEvent(EVENTS, state.floor, [...state.usedIds], meta, fx, getRandomSource());
    if (e) dispatch({ type: 'SET_EVENT', event: e });
    else console.warn(`[enterFloor] No events for floor ${state.floor}`);
  }, [state.floor, state.usedIds, state.chainNext, sfx, safeTimeout, meta, fx, dispatch]);

  const handleChoice = useCallback((idx: number) => {
    if (!state.event || !state.player) return;
    sfx(AudioEngine.sfx.choice);

    const { choice, outcome, mods, chainId, playerFlag, drained: rawDrained, drain, impact } = processChoice(state.event, idx, state.player, fx, state.diff);

    // SecondLife 復活
    let drained = rawDrained;
    let didSecondLife = false;
    if (fx.secondLife && !state.usedSecondLife && (drained.hp <= 0 || drained.mn <= 0)) {
      drained = { ...drained, hp: Math.max(drained.hp, Math.ceil(drained.maxHp / 2)), mn: Math.max(drained.mn, Math.ceil(drained.maxMn / 2)) };
      didSecondLife = true;
      flash("heal", 800); sfx(AudioEngine.sfx.heal);
    }

    // ビジュアル・オーディオフィードバック
    if (impact === "bigDmg" || impact === "dmg") {
      doShake(); flash("dmg", 400);
      sfx(impact === "bigDmg" ? AudioEngine.sfx.bigHit : AudioEngine.sfx.hit);
    } else if (impact === "heal") {
      flash("heal", 500); sfx(AudioEngine.sfx.heal);
    }
    if (playerFlag?.startsWith("add:"))    safeTimeout(() => sfx(AudioEngine.sfx.status), 200);
    if (playerFlag?.startsWith("remove:")) safeTimeout(() => sfx(AudioEngine.sfx.clear), 200);
    if (drain) safeTimeout(() => sfx(AudioEngine.sfx.drain), 400);

    // リデューサーに結果を送信
    dispatch({
      type: 'APPLY_CHOICE',
      player: drained,
      resTxt: didSecondLife ? outcome.r + "\n\n──「二度目の命」が発動した。致命の闇から引き戻される。" : outcome.r,
      resChg: { hp: mods.hp, mn: mods.mn, inf: mods.inf, fl: outcome.fl },
      drainInfo: drain,
      logEntry: { fl: state.floor, step: state.step + 1, ch: choice.t, hp: mods.hp, mn: mods.mn, inf: mods.inf, flag: playerFlag ?? undefined },
      chainNext: chainId,
      usedSecondLife: state.usedSecondLife || didSecondLife,
    });
    updateMeta(m => ({ totalEvents: m.totalEvents + 1 }));

    // 脱出
    if (outcome.fl === "escape") {
      const end = determineEnding(drained, [...state.log], state.diff);
      const isNew = !meta.endings?.includes(end.id);
      const diffId = state.diff?.id;
      const isNewDiff = diffId ? !meta.clearedDifficulties?.includes(diffId) : false;
      safeTimeout(() => sfx(AudioEngine.sfx.victory), 500);
      safeTimeout(() => {
        dispatch({ type: 'SET_VICTORY', ending: end, isNewEnding: isNew, isNewDiffClear: isNewDiff });
        updateMeta(m => ({
          escapes: m.escapes + 1,
          kp: m.kp + (state.diff?.rewards.kpOnWin ?? 4) + end.bonusKp,
          bestFloor: Math.max(m.bestFloor, state.floor),
          endings: m.endings.includes(end.id) ? m.endings : [...m.endings, end.id],
          clearedDifficulties: !diffId || m.clearedDifficulties.includes(diffId) ? m.clearedDifficulties : [...m.clearedDifficulties, diffId],
          lastRun: { cause: "escape", floor: state.floor, endingId: end.id, hp: drained.hp, mn: drained.mn, inf: drained.inf },
        }));
      }, 2500);
      return;
    }

    // 死亡
    if (drained.hp <= 0 || drained.mn <= 0) {
      const deathCause = drained.hp <= 0 ? "体力消耗" : "精神崩壊";
      safeTimeout(() => sfx(AudioEngine.sfx.over), 800);
      safeTimeout(() => {
        dispatch({ type: 'SET_GAME_OVER' });
        updateMeta(m => ({
          kp: m.kp + (state.diff?.rewards.kpOnDeath ?? 2),
          bestFloor: Math.max(m.bestFloor, state.floor),
          totalDeaths: (m.totalDeaths ?? 0) + 1,
          lastRun: { cause: deathCause, floor: state.floor, endingId: null, hp: drained.hp, mn: drained.mn, inf: drained.inf },
        }));
      }, 2500);
    }
  }, [state.event, state.player, state.diff, state.floor, state.step, state.log, state.usedSecondLife, fx, sfx, safeTimeout, doShake, flash, dispatch, updateMeta, meta.endings, meta.clearedDifficulties]);

  const proceed = useCallback(() => {
    if (!state.event) return;
    const ns = state.step + 1;
    const nu = [...state.usedIds, state.event.id];

    if (state.chainNext) {
      const ce = findChainEvent(EVENTS, state.chainNext);
      if (ce) { dispatch({ type: 'ADVANCE_STEP', event: ce, step: ns, usedIds: nu }); return; }
    }

    const isShort = state.resChg?.fl === "shortcut";
    const nf = isShort ? Math.min(state.floor + 2, CFG.MAX_FLOOR) : (ns >= CFG.EVENTS_PER_FLOOR ? state.floor + 1 : state.floor);

    if (nf > state.floor && nf <= CFG.MAX_FLOOR) {
      sfx(AudioEngine.sfx.levelUp);
      dispatch({ type: 'CHANGE_FLOOR', floor: nf });
      return;
    }

    if (nf > CFG.MAX_FLOOR) {
      const boss = EVENTS.find(e => e.id === CFG.BOSS_EVENT_ID);
      if (boss && !nu.includes(CFG.BOSS_EVENT_ID)) {
        dispatch({ type: 'ADVANCE_STEP', event: boss, step: ns, usedIds: nu });
        return;
      }
      const bossCount = nu.filter(id => id === CFG.BOSS_EVENT_ID).length;
      const lastBossIdx = nu.lastIndexOf(CFG.BOSS_EVENT_ID);
      const postBoss = nu.length - lastBossIdx - 1;
      if (bossCount < CFG.MAX_BOSS_RETRIES && postBoss < 2) {
        const next = pickEvent(EVENTS, state.floor, nu, meta, fx, getRandomSource());
        if (next) { dispatch({ type: 'ADVANCE_STEP', event: next, step: ns, usedIds: nu }); return; }
      }
      if (bossCount < CFG.MAX_BOSS_RETRIES && boss) {
        dispatch({ type: 'ADVANCE_STEP', event: boss, step: ns, usedIds: nu });
        return;
      }
      sfx(AudioEngine.sfx.over);
      dispatch({ type: 'SET_GAME_OVER' });
      updateMeta(m => ({
        kp: m.kp + (state.diff?.rewards.kpOnDeath ?? 2),
        bestFloor: Math.max(m.bestFloor, state.floor),
        totalDeaths: (m.totalDeaths ?? 0) + 1,
        lastRun: { cause: "精神崩壊", floor: state.floor, endingId: null, hp: state.player?.hp ?? 0, mn: 0, inf: state.player?.inf ?? 0 },
      }));
      return;
    }

    const next = pickEvent(EVENTS, state.floor, nu, meta, fx, getRandomSource());
    if (next) {
      dispatch({ type: 'ADVANCE_STEP', event: next, step: ns, usedIds: nu });
    } else {
      console.warn(`[proceed] No events left for floor ${state.floor}`);
      sfx(AudioEngine.sfx.over);
      dispatch({ type: 'SET_GAME_OVER' });
      updateMeta(m => ({
        kp: m.kp + (state.diff?.rewards.kpOnDeath ?? 2),
        bestFloor: Math.max(m.bestFloor, state.floor),
        totalDeaths: (m.totalDeaths ?? 0) + 1,
        lastRun: { cause: "精神崩壊", floor: state.floor, endingId: null, hp: state.player?.hp ?? 0, mn: 0, inf: state.player?.inf ?? 0 },
      }));
    }
  }, [state, sfx, meta, fx, dispatch, updateMeta]);

  const doUnlock = useCallback((uid: string) => {
    const def = UNLOCKS.find(u => u.id === uid);
    if (!def || meta.unlocked.includes(uid) || meta.kp < def.cost) return;
    sfx(AudioEngine.sfx.heal);
    dispatch({ type: 'SET_LAST_BOUGHT', id: uid });
    safeTimeout(() => dispatch({ type: 'SET_LAST_BOUGHT', id: null }), 600);
    updateMeta(m => ({ unlocked: [...m.unlocked, uid], kp: m.kp - def.cost }));
  }, [meta, sfx, safeTimeout, dispatch, updateMeta]);

  const setPhase = useCallback((phase: string) => {
    if (phase === "title") {
      dispatch({ type: 'BACK_TO_TITLE' });
    } else {
      dispatch({ type: 'NAVIGATE_MENU', screen: phase as UIPhase });
    }
  }, [dispatch]);

  // ローディング画面
  if (!loaded) return <LoadingScreen Particles={Particles} />;

  return (
    <GameContext.Provider value={contextValue}>
      <GameRouter
        phase={state.phase}
        player={state.player}
        diff={state.diff}
        event={state.event}
        floor={state.floor}
        step={state.step}
        ending={state.ending}
        isNewEnding={state.isNewEnding}
        isNewDiffClear={state.isNewDiffClear}
        usedSecondLife={state.usedSecondLife}
        chainNext={state.chainNext}
        log={state.log}
        resTxt={state.resTxt}
        resChg={state.resChg}
        drainInfo={state.drainInfo}
        meta={meta}
        fx={fx}
        progressPct={progressPct}
        floorMeta={floorMeta}
        floorColor={floorColor}
        vignette={vignette}
        lowMental={lowMental}
        showLog={state.showLog}
        audioSettings={audioSettings}
        lastBought={state.lastBought}
        shake={shake}
        overlay={overlay}
        revealed={revealed}
        done={done}
        ready={ready}
        skip={skip}
        Particles={Particles}
        eventCount={EVENTS.length}
        startRun={startRun}
        enableAudio={enableAudio}
        selectDiff={selectDiff}
        enterFloor={enterFloor}
        handleChoice={handleChoice}
        proceed={proceed}
        doUnlock={doUnlock}
        toggleAudio={toggleAudio}
        setShowLog={() => dispatch({ type: 'TOGGLE_LOG' })}
        setPhase={setPhase}
        updateMeta={updateMeta}
        resetMeta={resetMeta}
        handleAudioSettingsChange={handleAudioSettingsChange}
      />
    </GameContext.Provider>
  );
}

/** 薄いシェル: ErrorBoundary + GameInner */
export function LabyrinthEchoGame() {
  return <ErrorBoundary><GameInner /></ErrorBoundary>;
}
