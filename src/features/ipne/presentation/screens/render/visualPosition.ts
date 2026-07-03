/**
 * 視覚位置トラッカー（描画位置の補間）
 *
 * ドメインのタイル整数座標は変更せず、描画専用の補間位置を供給する。
 * エンティティ ID ごとに「補間元 → 目標位置・開始時刻」を保持し、
 * ease-out で目標へ収束する。大きな跳躍（テレポート等）は補間せずスナップする。
 */
import type { Position } from '../../../index';

/** 1タイル移動の補間時間（ms）。移動間隔 140ms より短くして追いつき遅れを防ぐ */
export const MOVE_TWEEN_MS = 120;

/** これを超える移動距離（タイル）は補間せずスナップする（テレポート・ステージ遷移対策） */
export const SNAP_DISTANCE_TILES = 1.5;

/** getRecentTransition が遷移情報を返す猶予時間（ms）。これを超えると undefined になる */
export const TRANSITION_MEMORY_MS = 240;

/**
 * ease-out（二次）。序盤に速く動き終端で減速する。範囲外はクランプ。
 */
export function easeOutQuad(t: number): number {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return k * (2 - k);
}

/** 直近の位置遷移記録（残像等の演出向け。ワープ時はスナップ前の元位置を保持する） */
interface LastTransition {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startAt: number;
  isWarp: boolean;
}

/** getRecentTransition が返す直近の位置遷移情報 */
export interface RecentTransition {
  from: Position;
  to: Position;
  startAt: number;
  isWarp: boolean;
}

/** 補間エントリ（補間元・目標・開始時刻） */
interface TweenEntry {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startAt: number;
  /** 直近の位置遷移（初回登録時は未設定） */
  lastTransition?: LastTransition;
}

/** エントリの現在の補間位置を計算する */
function interpolate(entry: TweenEntry, now: number): Position {
  const progress = easeOutQuad((now - entry.startAt) / MOVE_TWEEN_MS);
  return {
    x: entry.fromX + (entry.toX - entry.fromX) * progress,
    y: entry.fromY + (entry.toY - entry.fromY) * progress,
  };
}

/**
 * 視覚位置トラッカー
 *
 * 毎フレーム resolve() を呼ぶことで論理位置の変化を検知し、補間位置を返す。
 */
export class VisualPositionTracker {
  private entries = new Map<string, TweenEntry>();

  /**
   * 論理位置を登録しつつ現在の視覚位置を返す。
   * 初回・大跳躍はスナップ、通常移動は現在の視覚位置から新目標へ補間する。
   */
  resolve(id: string, logical: Position, now: number): Position {
    const entry = this.entries.get(id);

    if (!entry) {
      this.entries.set(id, {
        fromX: logical.x, fromY: logical.y,
        toX: logical.x, toY: logical.y,
        startAt: now,
      });
      return { x: logical.x, y: logical.y };
    }

    if (entry.toX !== logical.x || entry.toY !== logical.y) {
      const distance = Math.hypot(logical.x - entry.toX, logical.y - entry.toY);
      const current = interpolate(entry, now);
      const isWarp = distance > SNAP_DISTANCE_TILES;
      // 遷移前の位置（ワープ時はスナップで捨てられる元位置）を残像演出用に保存する
      entry.lastTransition = {
        fromX: current.x, fromY: current.y,
        toX: logical.x, toY: logical.y,
        startAt: now,
        isWarp,
      };
      entry.fromX = isWarp ? logical.x : current.x;
      entry.fromY = isWarp ? logical.y : current.y;
      entry.toX = logical.x;
      entry.toY = logical.y;
      entry.startAt = now;
    }

    return interpolate(entry, now);
  }

  /**
   * 直近の位置遷移を取得する（残像等の演出向け）。
   * TRANSITION_MEMORY_MS 以内の遷移のみ返し、それ以外・未移動・未登録は undefined。
   */
  getRecentTransition(id: string, now: number): RecentTransition | undefined {
    const transition = this.entries.get(id)?.lastTransition;
    if (!transition) return undefined;
    if (now - transition.startAt >= TRANSITION_MEMORY_MS) return undefined;

    return {
      from: { x: transition.fromX, y: transition.fromY },
      to: { x: transition.toX, y: transition.toY },
      startAt: transition.startAt,
      isWarp: transition.isWarp,
    };
  }

  /** 生存していないエンティティのエントリを削除する（メモリリーク防止） */
  prune(activeIds: ReadonlySet<string>): void {
    for (const id of this.entries.keys()) {
      if (!activeIds.has(id)) this.entries.delete(id);
    }
  }

  /** 全エントリを破棄する（ステージ遷移・リセット用） */
  clear(): void {
    this.entries.clear();
  }

  /** 現在のエントリ数を返す（テスト用） */
  size(): number {
    return this.entries.size;
  }
}
