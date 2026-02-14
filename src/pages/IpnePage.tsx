/**
 * IPNE ゲームページ
 * シンプルな迷路ゲーム - タイトル→プロローグ→ゲーム→クリア の画面遷移
 */
import React, { useCallback, useRef } from 'react';
import {
  movePlayer,
  isGoal,
  canGoal,
  Direction,
  ScreenState,
  updateExploration,
  toggleDebugOption,
  DebugState,
  EnemyType,
  playerAttack,
  getEnemyAtPosition,
  COMBAT_CONFIG,
  updatePlayerDirection,
  processEnemyDeath,
  WallState,
  MAX_LEVEL,
  shouldLevelUp,
  getWallAt,
  revealWall,
  incrementKillCount,
  processLevelUp,
  StatTypeValue,
} from '../features/ipne';
import { PageContainer } from './IpnePage.styles';
import {
  stopTimer,
  getElapsedTime,
} from '../features/ipne/timer';
import {
  createRecord,
  saveRecord,
} from '../features/ipne/record';
import { calculateRating } from '../features/ipne/ending';
import { resolvePlayerDamage } from '../features/ipne/application';
import {
  playPlayerDamageSound,
  playEnemyKillSound,
  playBossKillSound,
  playLevelUpSound,
  playMoveStepSound,
  playWallBumpSound,
  playAttackSwingSound,
  playAttackMissSound,
  playEnemyDamageSound,
  playDoorOpenSound,
  playWallBreakSound,
} from '../features/ipne/audio';

// 画面コンポーネント
import { TitleScreen } from '../features/ipne/presentation/screens/Title';
import { PrologueScreen } from '../features/ipne/presentation/screens/Prologue';
import { GameScreen, ClassSelectScreen, LevelUpOverlayComponent, EffectEvent } from '../features/ipne/presentation/screens/Game';
import { EffectType } from '../features/ipne/presentation/effects';
import { ClearScreen as ClearScreenComponent, GameOverScreen } from '../features/ipne/presentation/screens/Clear';

// カスタムフック
import { useGameState } from '../features/ipne/presentation/hooks/useGameState';
import { useGameLoop } from '../features/ipne/presentation/hooks/useGameLoop';

// テスト互換性のために ClearScreen を re-export
export { ClearScreen } from '../features/ipne/presentation/screens/Clear';

/**
 * IPNE メインページコンポーネント
 */
const IpnePage: React.FC = () => {
  const state = useGameState();
  const effectQueueRef = useRef<EffectEvent[]>([]);

  // ゲームループ
  useGameLoop(state.screen, {
    mapRef: state.mapRef,
    playerRef: state.playerRef,
    enemiesRef: state.enemiesRef,
    itemsRef: state.itemsRef,
    trapsRef: state.trapsRef,
    wallsRef: state.wallsRef,
    pendingLevelPointsRef: state.pendingLevelPointsRef,
  }, {
    setPlayer: state.setPlayer,
    setEnemies: state.setEnemies,
    setItems: state.setItems,
    setTraps: state.setTraps,
    setPendingLevelPoints: state.setPendingLevelPoints,
    setCombatState: state.setCombatState,
    setMapState: state.setMapState,
    setIsGameOver: state.setIsGameOver,
    setScreen: state.setScreen,
  }, effectQueueRef);

  // MVP3: レベルアップ選択（ポイント制対応）
  const handleLevelUpChoice = useCallback((stat: StatTypeValue) => {
    const leveledPlayer = processLevelUp(state.player, stat);
    state.setPlayer(leveledPlayer);
    state.setPendingLevelPoints(prev => {
      const newPoints = prev - 1;
      if (newPoints <= 0) {
        state.setShowLevelUpModal(false);
      }
      return newPoints;
    });
  }, [state.player, state.setPendingLevelPoints, state.setPlayer, state.setShowLevelUpModal]);

  // レベルアップ画面を開く
  const handleOpenLevelUpModal = useCallback(() => {
    if (state.pendingLevelPoints > 0) {
      state.setShowLevelUpModal(true);
    }
  }, [state.pendingLevelPoints, state.setShowLevelUpModal]);

  // レベルアップ画面を閉じる
  const handleCloseLevelUpModal = useCallback(() => {
    state.setShowLevelUpModal(false);
  }, [state.setShowLevelUpModal]);

  // マップ表示切替ハンドラー（小窓 → 全画面 → 非表示 → 小窓）
  const handleMapToggle = useCallback(() => {
    state.setMapState(prev => {
      if (!prev.isMapVisible) {
        return { ...prev, isMapVisible: true, isFullScreen: false };
      } else if (!prev.isFullScreen) {
        return { ...prev, isMapVisible: true, isFullScreen: true };
      } else {
        return { ...prev, isMapVisible: false, isFullScreen: false };
      }
    });
  }, [state.setMapState]);

  // デバッグオプション切替ハンドラー
  const handleDebugToggle = useCallback(
    (option: keyof Omit<DebugState, 'enabled'>) => {
      state.setDebugState(prev => toggleDebugOption(prev, option));
    },
    [state.setDebugState]
  );

  // プレイヤー移動ハンドラー
  const handleMove = useCallback(
    (direction: (typeof Direction)[keyof typeof Direction]) => {
      if (state.isGameOver) return;

      const currentTime = Date.now();
      const nextPosition = (() => {
        switch (direction) {
          case Direction.UP:
            return { x: state.player.x, y: state.player.y - 1 };
          case Direction.DOWN:
            return { x: state.player.x, y: state.player.y + 1 };
          case Direction.LEFT:
            return { x: state.player.x - 1, y: state.player.y };
          case Direction.RIGHT:
            return { x: state.player.x + 1, y: state.player.y };
          default:
            return { x: state.player.x, y: state.player.y };
        }
      })();

      const enemyAtTarget = getEnemyAtPosition(state.enemiesRef.current, nextPosition.x, nextPosition.y);

      if (enemyAtTarget) {
        const damageResult = resolvePlayerDamage({
          player: { ...state.player, direction },
          damage: enemyAtTarget.damage,
          currentTime,
          invincibleDuration: COMBAT_CONFIG.invincibleDuration,
          sourceEnemy: enemyAtTarget,
          map: state.mapRef.current,
          enemies: state.enemiesRef.current,
          walls: state.wallsRef.current,
        });
        if (damageResult.tookDamage) {
          state.setCombatState(prev => ({ ...prev, lastDamageAt: currentTime }));
          playPlayerDamageSound();
        }
        state.setPlayer(damageResult.player);
        return;
      }

      // 移動先に特殊壁があれば発見済みにする
      const wallAtTarget = getWallAt(state.wallsRef.current, nextPosition.x, nextPosition.y);
      if (wallAtTarget && wallAtTarget.state === WallState.INTACT) {
        const updatedWalls = state.wallsRef.current.map(w =>
          w.x === wallAtTarget.x && w.y === wallAtTarget.y ? revealWall(w) : w
        );
        state.setWalls(updatedWalls);
      }

      const newPlayer = movePlayer(state.player, direction, state.map, state.wallsRef.current);
      state.setPlayer(newPlayer);

      // 移動成功/失敗の効果音
      if (newPlayer.x !== state.player.x || newPlayer.y !== state.player.y) {
        playMoveStepSound();
      } else {
        playWallBumpSound();
      }

      // 探索状態を更新
      state.setMapState(prev => ({
        ...prev,
        exploration: updateExploration(prev.exploration, newPlayer, state.map),
      }));

      // ゴール判定
      if (isGoal(state.map, newPlayer.x, newPlayer.y)) {
        if (canGoal(newPlayer)) {
          playDoorOpenSound();
          const now = Date.now();
          const stoppedTimer = stopTimer(state.timer, now);
          const elapsed = getElapsedTime(stoppedTimer, now);
          const rating = calculateRating(elapsed);

          state.setClearTime(elapsed);
          state.setClearRating(rating);
          state.setTimer(stoppedTimer);

          const record = createRecord(elapsed, rating, state.selectedClass);
          const { isNewBest: newBest } = saveRecord(record);
          state.setIsNewBest(newBest);

          state.setScreen(ScreenState.CLEAR);
        } else {
          state.setShowKeyRequiredMessage(true);
          setTimeout(() => state.setShowKeyRequiredMessage(false), 2000);
        }
      }
    },
    [state]
  );

  const handleTurn = useCallback(
    (direction: (typeof Direction)[keyof typeof Direction]) => {
      if (state.isGameOver) return;
      state.setPlayer(prev => updatePlayerDirection(prev, direction));
    },
    [state.isGameOver, state.setPlayer]
  );

  const handleAttack = useCallback(() => {
    if (state.isGameOver || state.showLevelUpModal) return;
    const currentTime = Date.now();
    const beforeEnemies = state.enemiesRef.current;
    const currentWalls = state.wallsRef.current;
    const result = playerAttack(state.playerRef.current, beforeEnemies, state.mapRef.current, currentTime, currentWalls);

    if (result.didAttack) {
      // 攻撃振り音（攻撃するたびに鳴る）
      playAttackSwingSound();
      state.setCombatState(prev => ({ ...prev, lastAttackAt: currentTime }));

      // 敵にダメージを与えたかチェック
      const enemyDamaged = result.enemies.some(e => {
        const before = beforeEnemies.find(b => b.id === e.id);
        return before && e.hp < before.hp;
      });

      if (enemyDamaged) {
        // 敵被弾音
        playEnemyDamageSound();
      }

      if (result.attackPosition) {
        state.setAttackEffect({ position: result.attackPosition, until: currentTime + 150 });
        if (!enemyDamaged && !result.hitWall) {
          // 空振り音（敵にも壁にもヒットしなかった）
          playAttackMissSound();
        }
      } else {
        state.setAttackEffect(undefined);
      }
    }

    if (result.walls) {
      // 壁破壊チェック: 壁が BROKEN 状態に変わったか
      const wallBroken = result.walls.some(w => {
        const before = currentWalls.find(bw => bw.x === w.x && bw.y === w.y);
        return before && before.state !== WallState.BROKEN && w.state === WallState.BROKEN;
      });
      if (wallBroken) {
        playWallBreakSound();
      }
      state.setWalls(result.walls);
    }

    const survivingEnemies = result.enemies.filter(enemy => enemy.hp > 0);
    const survivingIds = new Set(survivingEnemies.map(e => e.id));
    const killedEnemies = beforeEnemies.filter(e => !survivingIds.has(e.id));

    let updatedPlayer = result.player;
    let updatedItems = state.itemsRef.current;

    if (killedEnemies.length > 0) {
      const killedBoss = killedEnemies.some(e => e.type === EnemyType.BOSS);
      if (killedBoss) {
        playBossKillSound();
        // ボス撃破エフェクト
        const boss = killedEnemies.find(e => e.type === EnemyType.BOSS);
        if (boss) {
          effectQueueRef.current.push({ type: EffectType.BOSS_KILL, x: boss.x, y: boss.y });
        }
      } else {
        playEnemyKillSound();
      }

      for (const enemy of killedEnemies) {
        const deathResult = processEnemyDeath(enemy);
        if (deathResult.droppedItem) {
          updatedItems = [...updatedItems, deathResult.droppedItem];
        }
      }

      let addedPointsInLoop = 0;
      for (let i = 0; i < killedEnemies.length; i++) {
        const killResult = incrementKillCount(updatedPlayer);
        updatedPlayer = killResult.player;

        const effectiveLevel = updatedPlayer.level + state.pendingLevelPointsRef.current + addedPointsInLoop;

        if (effectiveLevel >= MAX_LEVEL) continue;

        if (shouldLevelUp(effectiveLevel, updatedPlayer.killCount)) {
          state.setPendingLevelPoints(prev => prev + 1);
          addedPointsInLoop++;
          playLevelUpSound();
          // レベルアップエフェクト
          effectQueueRef.current.push({ type: EffectType.LEVEL_UP, x: updatedPlayer.x, y: updatedPlayer.y });
        }
      }
    }

    state.setPlayer(updatedPlayer);
    state.setEnemies(survivingEnemies);
    state.setItems(updatedItems);
  }, [state]);

  // 画面に応じたコンテンツをレンダリング
  return (
    <PageContainer>
      {state.screen === ScreenState.TITLE && (
        <TitleScreen
          onStart={state.handleStartGame}
          audioSettings={state.audioSettings}
          showAudioSettings={state.showAudioSettings}
          isAudioReady={state.isAudioReady}
          onAudioSettingsToggle={state.handleAudioSettingsToggle}
          onMasterVolumeChange={state.handleMasterVolumeChange}
          onSeVolumeChange={state.handleSeVolumeChange}
          onBgmVolumeChange={state.handleBgmVolumeChange}
          onToggleMute={state.handleToggleMute}
          onTapToStart={state.handleEnableAudio}
        />
      )}
      {state.screen === ScreenState.CLASS_SELECT && <ClassSelectScreen onSelect={state.handleClassSelect} />}
      {state.screen === ScreenState.PROLOGUE && <PrologueScreen onSkip={state.handleSkipPrologue} />}
      {state.screen === ScreenState.GAME && (
        <>
          <GameScreen
            map={state.map}
            player={state.player}
            enemies={state.enemies}
            items={state.items}
            traps={state.traps}
            walls={state.walls}
            mapState={state.mapState}
            goalPos={state.goalPos}
            debugState={state.debugState}
            onMove={handleMove}
            onTurn={handleTurn}
            onAttack={handleAttack}
            onMapToggle={handleMapToggle}
            onDebugToggle={handleDebugToggle}
            attackEffect={state.attackEffect}
            lastDamageAt={state.combatState.lastDamageAt}
            timer={state.timer}
            showHelp={state.showHelp}
            onHelpToggle={state.handleHelpToggle}
            showKeyRequiredMessage={state.showKeyRequiredMessage}
            pendingLevelPoints={state.pendingLevelPoints}
            onOpenLevelUpModal={handleOpenLevelUpModal}
            effectQueueRef={effectQueueRef}
          />
          {state.showLevelUpModal && state.pendingLevelPoints > 0 && (
            <LevelUpOverlayComponent
              player={state.player}
              pendingPoints={state.pendingLevelPoints}
              onChoose={handleLevelUpChoice}
              onClose={handleCloseLevelUpModal}
            />
          )}
        </>
      )}
      {state.screen === ScreenState.CLEAR && (
        <ClearScreenComponent
          onRetry={state.handleRetry}
          onBackToTitle={state.handleBackToTitle}
          clearTime={state.clearTime}
          rating={state.clearRating}
          isNewBest={state.isNewBest}
        />
      )}
      {state.screen === ScreenState.GAME_OVER && (
        <GameOverScreen onRetry={state.handleGameOverRetry} onBackToTitle={state.handleBackToTitle} />
      )}
    </PageContainer>
  );
};

export default IpnePage;
