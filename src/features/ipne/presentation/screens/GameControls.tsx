/**
 * ゲームコントロールコンポーネント
 * D-pad、攻撃ボタン、キーボード入力処理、連続移動ロジック
 */
import React, { useEffect, useCallback, useRef } from 'react';
import {
  ControlsContainer,
  DPadContainer,
  DPadButton,
  AttackButton,
} from '../../../../pages/IpnePage.styles';
import {
  Direction,
  Player,
  DebugState,
  DirectionValue,
  MovementState,
  getDirectionFromKey,
  startMovement,
  stopMovement,
  updateMovement,
  getEffectiveMoveInterval,
  INITIAL_MOVEMENT_STATE,
  DEFAULT_MOVEMENT_CONFIG,
} from '../../index';

/** GameControls の Props 定義 */
export interface GameControlsProps {
  player: Player;
  debugState: DebugState;
  onMove: (direction: (typeof Direction)[keyof typeof Direction]) => void;
  onTurn: (direction: (typeof Direction)[keyof typeof Direction]) => void;
  onAttack: () => void;
  onMapToggle: () => void;
  onHelpToggle: () => void;
  onDebugToggle: (option: keyof Omit<DebugState, 'enabled'>) => void;
  isDying: boolean;
  isAttackReady: boolean;
  /** 移動状態への参照（Canvas描画useEffectと共有） */
  movementStateRef: React.MutableRefObject<MovementState>;
}

/**
 * ゲームコントロールコンポーネント
 * キーボード入力、D-padボタン、攻撃ボタンを管理
 */
export const GameControls: React.FC<GameControlsProps> = ({
  player,
  debugState,
  onMove,
  onTurn,
  onAttack,
  onMapToggle,
  onHelpToggle,
  onDebugToggle,
  isDying,
  isAttackReady,
  movementStateRef,
}) => {
  const animationFrameRef = useRef<number | null>(null);
  const attackHoldRef = useRef(false);

  const setAttackHold = useCallback((isHolding: boolean) => {
    attackHoldRef.current = isHolding;
    if (isHolding) {
      movementStateRef.current = INITIAL_MOVEMENT_STATE;
    }
  }, [movementStateRef]);

  // 連続移動のアニメーションループ
  useEffect(() => {
    const tick = () => {
      const currentTime = Date.now();

      // プレイヤーの移動速度を考慮した移動間隔を計算
      const effectiveMoveInterval = getEffectiveMoveInterval(
        player,
        DEFAULT_MOVEMENT_CONFIG.moveInterval,
        currentTime
      );
      const effectiveConfig = {
        ...DEFAULT_MOVEMENT_CONFIG,
        moveInterval: effectiveMoveInterval,
      };

      const { shouldMove, newState } = updateMovement(
        movementStateRef.current,
        currentTime,
        effectiveConfig
      );

      movementStateRef.current = newState;

      if (shouldMove && newState.activeDirection && !attackHoldRef.current && !isDying) {
        onMove(newState.activeDirection);
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onMove, player, isDying, movementStateRef]);

  // キーボード入力
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // DYING 状態中は入力無効化
      if (isDying) return;

      const key = e.key.toLowerCase();

      // 攻撃（Spaceキー）
      if (key === ' ' || key === 'space') {
        e.preventDefault();
        setAttackHold(true);
        onAttack();
        return;
      }

      // マップ切替（Mキー）
      if (key === 'm') {
        e.preventDefault();
        onMapToggle();
        return;
      }

      // ヘルプ切替（Hキー）
      if (key === 'h') {
        e.preventDefault();
        onHelpToggle();
        return;
      }

      // デバッグモード時のキー（Shift + キーで操作、移動キーと競合しない）
      if (debugState.enabled && e.shiftKey) {
        if (key === 'd') {
          e.preventDefault();
          onDebugToggle('showPanel');
          return;
        } else if (key === 'f') {
          e.preventDefault();
          onDebugToggle('showFullMap');
          return;
        } else if (key === 'c') {
          e.preventDefault();
          onDebugToggle('showCoordinates');
          return;
        } else if (key === 'p') {
          e.preventDefault();
          onDebugToggle('showPath');
          return;
        }
      }

      // 移動キーの場合、連続移動状態を開始
      const direction = getDirectionFromKey(e.key);
      if (direction) {
        e.preventDefault();
        if (attackHoldRef.current) {
          onTurn(direction);
          return;
        }
        const currentTime = Date.now();

        // 最初の1マス目は即座に移動
        if (movementStateRef.current.activeDirection !== direction) {
          onMove(direction);
        }

        movementStateRef.current = startMovement(
          movementStateRef.current,
          direction,
          currentTime
        );
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'space') {
        setAttackHold(false);
        return;
      }
      // 移動キーの場合、連続移動状態を停止
      const direction = getDirectionFromKey(e.key);
      if (direction) {
        movementStateRef.current = stopMovement(movementStateRef.current, direction);
      }
    };

    // フォーカス喪失時にすべてのキー状態をリセット
    const handleBlur = () => {
      movementStateRef.current = INITIAL_MOVEMENT_STATE;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onMove, onTurn, onAttack, onMapToggle, onHelpToggle, debugState.enabled, onDebugToggle, setAttackHold, isDying, movementStateRef]);

  // D-pad押下開始時のハンドラー
  const handleDPadPointerDown = useCallback(
    (direction: DirectionValue) => {
      // DYING 状態中は入力無効化
      if (isDying) return;
      const currentTime = Date.now();
      if (attackHoldRef.current) {
        onTurn(direction);
        return;
      }
      // 最初の1マス目は即座に移動
      onMove(direction);
      // 連続移動状態を開始
      movementStateRef.current = startMovement(
        movementStateRef.current,
        direction,
        currentTime
      );
    },
    [onMove, onTurn, isDying, movementStateRef]
  );

  // D-pad離し時のハンドラー
  const handleDPadPointerUp = useCallback((direction: DirectionValue) => {
    movementStateRef.current = stopMovement(movementStateRef.current, direction);
  }, [movementStateRef]);

  return (
    <ControlsContainer>
      <DPadContainer>
        <DPadButton
          $direction="up"
          onPointerDown={e => {
            e.preventDefault();
            handleDPadPointerDown(Direction.UP);
          }}
          onPointerUp={() => handleDPadPointerUp(Direction.UP)}
          onPointerLeave={() => handleDPadPointerUp(Direction.UP)}
          onPointerCancel={() => handleDPadPointerUp(Direction.UP)}
          aria-label="上に移動"
        >
          ▲
        </DPadButton>
        <DPadButton
          $direction="left"
          onPointerDown={e => {
            e.preventDefault();
            handleDPadPointerDown(Direction.LEFT);
          }}
          onPointerUp={() => handleDPadPointerUp(Direction.LEFT)}
          onPointerLeave={() => handleDPadPointerUp(Direction.LEFT)}
          onPointerCancel={() => handleDPadPointerUp(Direction.LEFT)}
          aria-label="左に移動"
        >
          ◀
        </DPadButton>
        <AttackButton
          onPointerDown={e => {
            e.preventDefault();
            setAttackHold(true);
            if (isAttackReady) onAttack();
          }}
          onPointerUp={() => setAttackHold(false)}
          onPointerLeave={() => setAttackHold(false)}
          onPointerCancel={() => setAttackHold(false)}
          $ready={isAttackReady}
          aria-label="攻撃"
        >
          ATK
        </AttackButton>
        <DPadButton
          $direction="right"
          onPointerDown={e => {
            e.preventDefault();
            handleDPadPointerDown(Direction.RIGHT);
          }}
          onPointerUp={() => handleDPadPointerUp(Direction.RIGHT)}
          onPointerLeave={() => handleDPadPointerUp(Direction.RIGHT)}
          onPointerCancel={() => handleDPadPointerUp(Direction.RIGHT)}
          aria-label="右に移動"
        >
          ▶
        </DPadButton>
        <DPadButton
          $direction="down"
          onPointerDown={e => {
            e.preventDefault();
            handleDPadPointerDown(Direction.DOWN);
          }}
          onPointerUp={() => handleDPadPointerUp(Direction.DOWN)}
          onPointerLeave={() => handleDPadPointerUp(Direction.DOWN)}
          onPointerCancel={() => handleDPadPointerUp(Direction.DOWN)}
          aria-label="下に移動"
        >
          ▼
        </DPadButton>
      </DPadContainer>
    </ControlsContainer>
  );
};
