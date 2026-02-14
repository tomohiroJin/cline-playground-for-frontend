/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * 迷宮の残響 — メインゲームコンポーネント
 *
 * v6: Polish / Audio Toggle / Hints / QoL
 * SOLID / DRY / DbC / Functional-Declarative
 */
import { useState, useCallback, useEffect, useMemo } from "react";
import { CFG, DIFFICULTY, UNLOCKS, computeFx, createPlayer, computeProgress } from './game-logic';
import { rand } from './game-logic';
import { ErrorBoundary } from './contracts';
import { AudioEngine } from './audio';
import { EV } from './events/event-data';
import { computeVignette, processChoice, validateEvents, pickEvent, findChainEvent } from './events/event-utils';
import { FLOOR_META, EVENT_TYPE, ENDINGS, determineEnding } from './definitions';
import { Page } from './components/Page';
import { useTextReveal, usePersistence, useVisualFx } from './hooks';

// スクリーンコンポーネント
import { TitleScreen } from './components/TitleScreen';
import { DiffSelectScreen } from './components/DiffSelectScreen';
import { UnlocksScreen, TitlesScreen, RecordsScreen } from './components/CollectionScreens';
import { SettingsScreen, ResetConfirm1Screen, ResetConfirm2Screen } from './components/SettingsScreens';
import { FloorIntroScreen } from './components/FloorIntroScreen';
import { EventResultScreen } from './components/EventResultScreen';
import { GameOverScreen, VictoryScreen } from './components/EndScreens';

// イベントデータのバリデーション
const EVENTS = validateEvents(EV, EVENT_TYPE);

function GameInner() {
  const { meta, updateMeta, resetMeta, loaded } = usePersistence();

  // ラン状態
  const [phase,   setPhase]   = useState("title");
  const [player,  setPlayer]  = useState(null);
  const [event,   setEvent]   = useState(null);
  const [resTxt,  setResTxt]  = useState("");
  const [resChg,  setResChg]  = useState(null);
  const [drainInfo, setDrainInfo] = useState(null);
  const [floor,   setFloor]   = useState(1);
  const [step,    setStep]    = useState(0);
  const [usedIds, setUsedIds] = useState([]);
  const [log,     setLog]     = useState([]);
  const [diff,    setDiff]    = useState(null);
  const [ending,  setEnding]  = useState(null);
  const [isNewEnding, setIsNewEnding] = useState(false);
  const [isNewDiffClear, setIsNewDiffClear] = useState(false);
  const [chainNext, setChainNext] = useState(null);
  const [usedSecondLife, setUsedSecondLife] = useState(false);

  // UI状態
  const [showLog, setShowLog] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [lastBought, setLastBought] = useState(null);
  const { shake, overlay, flash, doShake } = useVisualFx();

  // 派生値
  const fx          = useMemo(() => computeFx(meta.unlocked), [meta.unlocked]);
  const progressPct = useMemo(() => computeProgress(floor, step), [floor, step]);
  const floorMeta   = FLOOR_META[floor] ?? FLOOR_META[1];
  const floorColor  = floorMeta.color;
  const vignette    = useMemo(() => computeVignette(player), [player]);
  const lowMental   = player && player.mn < player.maxMn * 0.3;

  // フェーズ変更時にスクロールトップ（モバイルUX）
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [phase]);

  // テキスト表示
  const activeText = phase === "event" ? event?.sit : phase === "result" ? resTxt : null;
  const { revealed, done, ready, skip } = useTextReveal(activeText, audioOn);

  // オーディオ
  const enableAudio = useCallback(() => { AudioEngine.init(); AudioEngine.resume(); setAudioOn(true); }, []);
  const toggleAudio = useCallback(() => { if (audioOn) { setAudioOn(false); } else { AudioEngine.init(); AudioEngine.resume(); setAudioOn(true); } }, [audioOn]);
  const sfx = useCallback((fn) => { if (audioOn) fn(); }, [audioOn]);

  // パーティクル
  const Particles = useMemo(() => (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {[...Array(20)].map((_, i) => <div key={i} style={{ position: "absolute", width: rand(1, 3), height: rand(1, 3), background: `rgba(${rand(100, 200)},${rand(120, 220)},${rand(180, 255)},${(rand(10, 25) / 100).toFixed(2)})`, borderRadius: "50%", left: `${rand(0, 100)}%`, top: `${rand(0, 100)}%`, animation: `float ${rand(8, 22)}s ease-in-out infinite ${rand(0, 10)}s` }} />)}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 80%,rgba(99,102,241,.04) 0%,transparent 60%)", animation: "breathe 8s ease-in-out infinite" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%,rgba(139,92,246,.03) 0%,transparent 50%)", animation: "breathe 12s ease-in-out infinite 3s" }} />
    </div>
  ), []);

  // ── ゲームアクション ──

  const startRun = useCallback(() => { enableAudio(); setPhase("diff_select"); }, [enableAudio]);

  const selectDiff = useCallback((d) => {
    setDiff(d); enableAudio();
    setPlayer(createPlayer(d, fx));
    setFloor(1); setStep(0); setUsedIds([]); setLog([]); setDrainInfo(null); setChainNext(null); setEnding(null); setIsNewEnding(false); setIsNewDiffClear(false); setUsedSecondLife(false);
    updateMeta(m => ({ runs: m.runs + 1 }));
    setPhase("floor_intro");
  }, [fx, enableAudio, updateMeta]);

  const enterFloor = useCallback(() => {
    sfx(AudioEngine.sfx.floor);
    setTimeout(() => sfx(() => AudioEngine.sfx.ambient(floor)), 500);
    if (chainNext) {
      const ce = findChainEvent(EVENTS, chainNext);
      if (ce) { setEvent(ce); setChainNext(null); setPhase("event"); return; }
    }
    const e = pickEvent(EVENTS, floor, usedIds, meta, fx);
    if (e) { setEvent(e); setPhase("event"); }
    else console.warn(`[enterFloor] No events for floor ${floor}`);
  }, [floor, usedIds, sfx, chainNext, meta, fx]);

  /** プレイヤーの選択処理 — processChoice で純粋計算、その後副作用を適用 */
  const handleChoice = useCallback((idx) => {
    if (!event || !player) return;
    sfx(AudioEngine.sfx.choice);
    const { choice, outcome, mods, chainId, playerFlag, drained: rawDrained, drain, impact } = processChoice(event, idx, player, fx, diff);

    // SecondLife 復活
    let drained = rawDrained;
    let didSecondLife = false;
    if (fx.secondLife && !usedSecondLife && (drained.hp <= 0 || drained.mn <= 0)) {
      drained = { ...drained, hp: Math.max(drained.hp, Math.ceil(drained.maxHp / 2)), mn: Math.max(drained.mn, Math.ceil(drained.maxMn / 2)) };
      setUsedSecondLife(true);
      didSecondLife = true;
      flash("heal", 800); sfx(AudioEngine.sfx.heal);
    }
    if (chainId) setChainNext(chainId);

    // ビジュアル・オーディオフィードバック
    if (impact === "bigDmg" || impact === "dmg") {
      doShake(); flash("dmg", 400);
      sfx(impact === "bigDmg" ? AudioEngine.sfx.bigHit : AudioEngine.sfx.hit);
    } else if (impact === "heal") {
      flash("heal", 500); sfx(AudioEngine.sfx.heal);
    }
    if (playerFlag?.startsWith("add:"))    setTimeout(() => sfx(AudioEngine.sfx.status), 200);
    if (playerFlag?.startsWith("remove:")) setTimeout(() => sfx(AudioEngine.sfx.clear), 200);
    if (drain) setTimeout(() => sfx(AudioEngine.sfx.drain), 400);

    // 状態更新
    setLog(l => [...l, { fl: floor, step: step + 1, ch: choice.t, hp: mods.hp, mn: mods.mn, inf: mods.inf }]);
    setResTxt(didSecondLife ? outcome.r + "\n\n──「二度目の命」が発動した。致命の闇から引き戻される。" : outcome.r);
    setResChg({ hp: mods.hp, mn: mods.mn, inf: mods.inf, fl: outcome.fl });
    setPlayer(drained); setDrainInfo(drain); setPhase("result");
    updateMeta(m => ({ totalEvents: m.totalEvents + 1 }));

    // 脱出
    if (outcome.fl === "escape") {
      const end = determineEnding(drained, log, diff);
      setEnding(end);
      setIsNewEnding(!meta.endings?.includes(end.id));
      setIsNewDiffClear(!meta.clearedDiffs?.includes(diff.id));
      setTimeout(() => sfx(AudioEngine.sfx.victory), 500);
      setTimeout(() => {
        updateMeta(m => ({
          escapes: m.escapes + 1,
          kp: m.kp + (diff?.kpWin ?? 4) + end.bonusKp,
          bestFl: Math.max(m.bestFl, floor),
          endings: m.endings.includes(end.id) ? m.endings : [...m.endings, end.id],
          clearedDiffs: m.clearedDiffs.includes(diff.id) ? m.clearedDiffs : [...m.clearedDiffs, diff.id],
          lastRun: { cause: "escape", floor, ending: end.id, hp: drained.hp, mn: drained.mn, inf: drained.inf },
        }));
        setPhase("victory");
      }, 2500);
      return;
    }
    // 死亡
    if (drained.hp <= 0 || drained.mn <= 0) {
      const deathCause = drained.hp <= 0 ? "体力消耗" : "精神崩壊";
      if (drained.mn <= 0 && drained.hp > 0) setResTxt(outcome.r + "\n\n……精神が限界に達した。意識が遠のき、迷宮の闇に呑まれていく。");
      setTimeout(() => sfx(AudioEngine.sfx.over), 800);
      setTimeout(() => {
        updateMeta(m => ({
          kp: m.kp + (diff?.kpDeath ?? 2), bestFl: Math.max(m.bestFl, floor),
          totalDeaths: (m.totalDeaths ?? 0) + 1,
          lastRun: { cause: deathCause, floor, ending: null, hp: drained.hp, mn: drained.mn, inf: drained.inf },
        }));
        setPhase("gameover");
      }, 2500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, player, fx, diff, floor, step, log, sfx, doShake, flash, updateMeta, usedSecondLife]);

  const proceed = useCallback(() => {
    if (!event) return;
    const ns = step + 1, nu = [...usedIds, event.id];
    setStep(ns); setUsedIds(nu); setDrainInfo(null);
    if (chainNext) {
      const ce = findChainEvent(EVENTS, chainNext);
      if (ce) { setEvent(ce); setChainNext(null); setPhase("event"); return; }
      setChainNext(null);
    }
    const isShort = resChg?.fl === "shortcut";
    const nf = isShort ? Math.min(floor + 2, CFG.MAX_FLOOR) : (ns >= CFG.EVENTS_PER_FLOOR ? floor + 1 : floor);
    if (nf > floor && nf <= CFG.MAX_FLOOR) {
      sfx(AudioEngine.sfx.levelUp); setFloor(nf); setStep(0); setPhase("floor_intro"); return;
    }
    if (nf > CFG.MAX_FLOOR) {
      const boss = EVENTS.find(e => e.id === CFG.BOSS_EVENT_ID);
      // 初回ボス発動
      if (boss && !nu.includes(CFG.BOSS_EVENT_ID)) {
        setEvent(boss); setPhase("event"); return;
      }
      // ボス敗北後: 2イベント挟んでボス再挑戦（最大3回）
      const bossCount = nu.filter(id => id === CFG.BOSS_EVENT_ID).length;
      const lastBossIdx = nu.lastIndexOf(CFG.BOSS_EVENT_ID);
      const postBoss = nu.length - lastBossIdx - 1;
      if (bossCount < CFG.MAX_BOSS_RETRIES && postBoss < 2) {
        const next = pickEvent(EVENTS, floor, nu, meta, fx);
        if (next) { setEvent(next); setPhase("event"); return; }
      }
      if (bossCount < CFG.MAX_BOSS_RETRIES && boss) {
        setEvent(boss); setPhase("event"); return;
      }
      // 全チャンス消化 → ゲームオーバー
      sfx(AudioEngine.sfx.over);
      updateMeta(m => ({
        kp: m.kp + (diff?.kpDeath ?? 2),
        bestFl: Math.max(m.bestFl, floor),
        totalDeaths: (m.totalDeaths ?? 0) + 1,
        lastRun: { cause: "精神崩壊", floor, ending: null, hp: player?.hp ?? 0, mn: 0, inf: player?.inf ?? 0 },
      }));
      setPhase("gameover");
      return;
    }
    const next = pickEvent(EVENTS, floor, nu, meta, fx);
    if (next) { setEvent(next); setPhase("event"); }
    else {
      // イベント枯渇の安全ネット（通常到達しないが保険）
      console.warn(`[proceed] No events left for floor ${floor}`);
      sfx(AudioEngine.sfx.over);
      updateMeta(m => ({
        kp: m.kp + (diff?.kpDeath ?? 2),
        bestFl: Math.max(m.bestFl, floor),
        totalDeaths: (m.totalDeaths ?? 0) + 1,
        lastRun: { cause: "精神崩壊", floor, ending: null, hp: player?.hp ?? 0, mn: 0, inf: player?.inf ?? 0 },
      }));
      setPhase("gameover");
    }
  }, [event, step, usedIds, floor, resChg, sfx, chainNext, meta, fx, player, diff, updateMeta]);

  const doUnlock = useCallback((uid) => {
    const def = UNLOCKS.find(u => u.id === uid);
    if (!def || meta.unlocked.includes(uid) || meta.kp < def.cost) return;
    sfx(AudioEngine.sfx.heal);
    setLastBought(uid);
    setTimeout(() => setLastBought(null), 600);
    updateMeta(m => ({ unlocked: [...m.unlocked, uid], kp: m.kp - def.cost }));
  }, [meta, sfx, updateMeta]);

  // ── 描画 ──

  if (!loaded) return (
    <Page particles={null}>
      <div style={{ marginTop: "38vh", textAlign: "center" }}>
        <div style={{ fontSize: 24, letterSpacing: 6, color: "var(--bright)", marginBottom: 12, animation: "glow 3s ease-in-out infinite", opacity: .6 }}>迷宮の残響</div>
        <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--sans)", animation: "pulse 1.5s infinite", letterSpacing: 2 }}>loading...</div>
      </div>
    </Page>
  );

  if (phase === "title")          return <TitleScreen meta={meta} Particles={Particles} startRun={startRun} enableAudio={enableAudio} setPhase={setPhase} eventCount={EVENTS.length} />;
  if (phase === "diff_select")    return <DiffSelectScreen Particles={Particles} fx={fx} meta={meta} selectDiff={selectDiff} setPhase={setPhase} />;
  if (phase === "unlocks")        return <UnlocksScreen Particles={Particles} meta={meta} lastBought={lastBought} doUnlock={doUnlock} setPhase={setPhase} />;
  if (phase === "titles")         return <TitlesScreen Particles={Particles} meta={meta} updateMeta={updateMeta} setPhase={setPhase} />;
  if (phase === "records")        return <RecordsScreen Particles={Particles} meta={meta} setPhase={setPhase} />;
  if (phase === "settings")       return <SettingsScreen Particles={Particles} eventCount={EVENTS.length} audioOn={audioOn} toggleAudio={toggleAudio} setPhase={setPhase} />;
  if (phase === "reset_confirm1") return <ResetConfirm1Screen Particles={Particles} meta={meta} setPhase={setPhase} />;
  if (phase === "reset_confirm2") return <ResetConfirm2Screen Particles={Particles} setPhase={setPhase} resetMeta={resetMeta} />;
  if (phase === "floor_intro")    return <FloorIntroScreen Particles={Particles} floor={floor} floorMeta={floorMeta} floorColor={floorColor} diff={diff} meta={meta} progressPct={progressPct} player={player} chainNext={chainNext} enterFloor={enterFloor} />;

  if ((phase === "event" || phase === "result") && player) {
    return <EventResultScreen Particles={Particles} vignette={vignette} overlay={overlay} shake={shake} player={player}
      floor={floor} floorMeta={floorMeta} floorColor={floorColor} diff={diff} step={step} progressPct={progressPct}
      audioOn={audioOn} toggleAudio={toggleAudio} showLog={showLog} setShowLog={setShowLog} log={log}
      event={event} phase={phase} revealed={revealed} done={done} ready={ready} skip={skip}
      handleChoice={handleChoice} resTxt={resTxt} resChg={resChg} drainInfo={drainInfo} proceed={proceed} lowMental={lowMental} />;
  }

  if (phase === "gameover") return <GameOverScreen Particles={Particles} player={player} meta={meta} diff={diff} floor={floor} floorMeta={floorMeta} floorColor={floorColor} progressPct={progressPct} log={log} usedSecondLife={usedSecondLife} startRun={startRun} setPhase={setPhase} />;
  if (phase === "victory")  return <VictoryScreen Particles={Particles} ending={ending} isNewEnding={isNewEnding} isNewDiffClear={isNewDiffClear} diff={diff} player={player} usedSecondLife={usedSecondLife} log={log} meta={meta} startRun={startRun} setPhase={setPhase} />;

  return null;
}

export function LabyrinthEchoGame() {
  return <ErrorBoundary><GameInner /></ErrorBoundary>;
}
