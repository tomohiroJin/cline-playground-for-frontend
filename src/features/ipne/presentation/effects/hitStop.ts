/**
 * ヒットストップ（打撃の重み演出）
 *
 * 描画用タイムスタンプを短時間凍結して「時が止まる」打撃感を作る。
 * ゲームループ・入力・ドメイン更新には一切影響しない（描画層専用）。
 * 凍結は非累積方式: 凍結中は開始時刻を返し、終了後は実時刻へ復帰する
 * （実時刻ベースの各種 until 比較と整合させるため、時間オフセットは持たない）。
 */

/** ヒットストップの持続時間（ms） */
export const HIT_STOP_DURATIONS = {
  /** プレイヤー攻撃ヒット時 */
  attackHit: 70,
  /** プレイヤー被弾時 */
  playerDamage: 70,
  /** ボス撃破時 */
  bossKill: 150,
} as const;

/**
 * ヒットストップマネージャー
 */
export class HitStopManager {
  private freezeStart = 0;
  private freezeUntil = 0;

  /** 凍結を開始する。凍結中の再トリガーは終了時刻の延長のみ行う */
  trigger(now: number, durationMs: number): void {
    if (now >= this.freezeUntil) {
      this.freezeStart = now;
    }
    this.freezeUntil = Math.max(this.freezeUntil, now + durationMs);
  }

  /** 凍結中か否か */
  isFrozen(now: number): boolean {
    return now < this.freezeUntil;
  }

  /** 描画に使うタイムスタンプを返す（凍結中は凍結開始時刻で固定） */
  resolveVisualNow(now: number): number {
    return this.isFrozen(now) ? this.freezeStart : now;
  }

  /** 凍結を解除する（ステージ遷移・リセット用） */
  clear(): void {
    this.freezeStart = 0;
    this.freezeUntil = 0;
  }
}
