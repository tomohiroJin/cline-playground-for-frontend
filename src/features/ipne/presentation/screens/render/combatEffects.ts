/**
 * 戦闘エフェクト処理層（純粋描画ではなく状態変更を伴う）
 *
 * 攻撃/被弾エフェクトのトリガー・外部キュー処理・エフェクト更新描画・フローティングテキストを担う。
 * effectManagerRef 等の ref を変更する副作用を持つため、呼び出し位置（敵とプレイヤーの間）を厳守する。
 */
import { EffectType, calculatePowerLevel } from '../../effects';
import type { FrameContext } from './renderContext';

/**
 * 戦闘エフェクトシステムを処理する
 *
 * renderGameFrame の「パーティクルエフェクトシステム」節を逐語移植したもの。
 * 攻撃/被弾トリガー・外部キュー処理・エフェクト更新描画・フローティングテキストの
 * 順序・副作用を完全に保持する。
 */
export function combatEffects(frame: FrameContext): void {
  const {
    ctx,
    canvas,
    now,
    player,
    attackEffect,
    lastDamageAt,
    effectManagerRef,
    playerAttackUntilRef,
    playerDamageUntilRef,
    lastAttackEffectKeyRef,
    lastDamageAtRef,
    floatingTextManagerRef,
    effectQueueRef,
    toScreenPosition,
  } = frame;

  const em = effectManagerRef.current;

  // 攻撃ヒットエフェクトのトリガー（パワーレベルスケーリング）
  if (attackEffect && now < attackEffect.until) {
    const key = `${attackEffect.position.x}-${attackEffect.position.y}-${attackEffect.until}`;
    if (lastAttackEffectKeyRef.current !== key) {
      lastAttackEffectKeyRef.current = key;
      playerAttackUntilRef.current = attackEffect.until;
      const screenPos = toScreenPosition(attackEffect.position);
      const powerLevel = calculatePowerLevel(player);
      em.addEffect(EffectType.ATTACK_HIT, screenPos.x, screenPos.y, now, { powerLevel });
    }
  }

  // ダメージエフェクトのトリガー
  if (lastDamageAt > lastDamageAtRef.current) {
    lastDamageAtRef.current = lastDamageAt;
    playerDamageUntilRef.current = now + 200; // 被弾フレーム200ms表示
    const screenPos = toScreenPosition(player);
    em.addEffect(EffectType.DAMAGE, screenPos.x, screenPos.y, now);
    // 画面シェイク（Phase 4）
    em.addEffect(EffectType.SCREEN_SHAKE, 0, 0, now, { damage: 4 });
  }

  // 外部エフェクトキューの処理
  if (effectQueueRef && effectQueueRef.current.length > 0) {
    for (const evt of effectQueueRef.current) {
      const screenPos = toScreenPosition({ x: evt.x, y: evt.y });
      em.addEffect(evt.type, screenPos.x, screenPos.y, now, {
        enemyType: evt.enemyType as import('../../../types').EnemyTypeValue | undefined,
        comboMultiplier: evt.comboMultiplier,
        powerLevel: evt.powerLevel,
        variant: evt.variant as 'melee' | 'ranged' | 'boss' | undefined,
        itemType: evt.itemType as import('../../../types').ItemTypeValue | undefined,
      });
    }
    effectQueueRef.current = [];
  }

  // エフェクト更新・描画（100ms 間隔）
  em.update(0.1, now);
  em.draw(ctx, canvas.width, canvas.height);

  // フローティングテキスト更新・描画
  if (floatingTextManagerRef) {
    floatingTextManagerRef.current.update(now);
    floatingTextManagerRef.current.draw(ctx, now, (tx, ty) => toScreenPosition({ x: tx, y: ty }));
  }
}
