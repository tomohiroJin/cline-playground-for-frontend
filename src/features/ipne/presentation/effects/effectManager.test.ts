import { EffectManager, resetEffectIdCounter } from './effectManager';
import { EffectType, EffectTypeValue } from './effectTypes';
import { EnemyType } from '../../types';

describe('EffectManager', () => {
  let manager: EffectManager;

  beforeEach(() => {
    manager = new EffectManager();
    resetEffectIdCounter();
  });

  describe('addEffect', () => {
    it('エフェクトを追加できる', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000);
      expect(manager.getEffectCount()).toBe(1);
    });

    it('複数のエフェクトを追加できる', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000);
      manager.addEffect(EffectType.DAMAGE, 150, 250, 1000);
      manager.addEffect(EffectType.ITEM_PICKUP, 200, 300, 1000);
      expect(manager.getEffectCount()).toBe(3);
    });

    it('各エフェクトタイプのパーティクルが正しく生成される', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000);
      // 攻撃ヒットエフェクトは 8 個のパーティクル
      expect(manager.getTotalParticleCount()).toBe(8);
    });

    it('ダメージエフェクトのパーティクルが生成される', () => {
      manager.addEffect(EffectType.DAMAGE, 100, 200, 1000);
      // ダメージエフェクトは 6 個のパーティクル
      expect(manager.getTotalParticleCount()).toBe(6);
    });

    it('ボス撃破エフェクトのパーティクルが生成される', () => {
      manager.addEffect(EffectType.BOSS_KILL, 100, 200, 1000);
      // ボス撃破エフェクトは 24 個のパーティクル
      expect(manager.getTotalParticleCount()).toBe(24);
    });

    it('アイテム取得エフェクトのパーティクルが生成される', () => {
      manager.addEffect(EffectType.ITEM_PICKUP, 100, 200, 1000);
      expect(manager.getTotalParticleCount()).toBe(6);
    });

    it('レベルアップエフェクトのパーティクルが生成される', () => {
      manager.addEffect(EffectType.LEVEL_UP, 100, 200, 1000);
      expect(manager.getTotalParticleCount()).toBe(24);
    });

    it('罠エフェクトのパーティクルが生成される', () => {
      manager.addEffect(EffectType.TRAP_DAMAGE, 100, 200, 1000);
      expect(manager.getTotalParticleCount()).toBe(6);

      manager.addEffect(EffectType.TRAP_SLOW, 100, 200, 1000);
      expect(manager.getTotalParticleCount()).toBe(14); // 6 + 8

      manager.addEffect(EffectType.TRAP_TELEPORT, 100, 200, 1000);
      expect(manager.getTotalParticleCount()).toBe(24); // 6 + 8 + 10
    });
  });

  describe('update', () => {
    it('持続時間を超えたエフェクトが削除される', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000);
      expect(manager.getEffectCount()).toBe(1);

      // 攻撃ヒットの持続時間は 300ms
      manager.update(0.1, 1400);
      expect(manager.getEffectCount()).toBe(0);
    });

    it('持続時間内のエフェクトは保持される', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000);

      // 100ms 後（持続時間 300ms 以内）
      manager.update(0.1, 1100);
      expect(manager.getEffectCount()).toBe(1);
    });

    it('複数エフェクトのうち期限切れのものだけ削除される', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000); // 300ms
      manager.addEffect(EffectType.LEVEL_UP, 150, 250, 1000); // 800ms

      // 500ms 後: 攻撃ヒット(300ms)は期限切れ、レベルアップ(800ms)は残る
      manager.update(0.5, 1500);
      expect(manager.getEffectCount()).toBe(1);
    });
  });

  describe('clear', () => {
    it('全エフェクトをクリアできる', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000);
      manager.addEffect(EffectType.DAMAGE, 150, 250, 1000);
      manager.addEffect(EffectType.LEVEL_UP, 200, 300, 1000);
      expect(manager.getEffectCount()).toBe(3);

      manager.clear();
      expect(manager.getEffectCount()).toBe(0);
      expect(manager.getTotalParticleCount()).toBe(0);
    });
  });

  describe('新エフェクトタイプ（Phase 4）', () => {
    it('ENEMY_ATTACK（melee）のパーティクルが生成される', () => {
      manager.addEffect(EffectType.ENEMY_ATTACK, 100, 200, 1000, { variant: 'melee' });
      expect(manager.getEffectCount()).toBe(1);
      expect(manager.getTotalParticleCount()).toBe(8);
    });

    it('ENEMY_ATTACK（ranged）のパーティクルが生成される', () => {
      manager.addEffect(EffectType.ENEMY_ATTACK, 100, 200, 1000, { variant: 'ranged' });
      expect(manager.getEffectCount()).toBe(1);
      expect(manager.getTotalParticleCount()).toBe(8);
    });

    it('ENEMY_ATTACK（boss）のパーティクルが生成される', () => {
      manager.addEffect(EffectType.ENEMY_ATTACK, 100, 200, 1000, { variant: 'boss' });
      expect(manager.getEffectCount()).toBe(1);
      expect(manager.getTotalParticleCount()).toBe(16);
    });

    it('SCREEN_SHAKEが追加される（パーティクルなし）', () => {
      manager.addEffect(EffectType.SCREEN_SHAKE, 0, 0, 1000, { damage: 4 });
      expect(manager.getEffectCount()).toBe(1);
      expect(manager.getTotalParticleCount()).toBe(0);
    });

    it('STAGE_CLEARの螺旋パーティクルが生成される', () => {
      manager.addEffect(EffectType.STAGE_CLEAR, 100, 200, 1000, { stageNumber: 1 });
      expect(manager.getEffectCount()).toBe(1);
      expect(manager.getTotalParticleCount()).toBe(32);
    });
  });

  describe('getShakeOffset', () => {
    it('シェイク中はオフセットを返す', () => {
      manager.addEffect(EffectType.SCREEN_SHAKE, 0, 0, 1000, { damage: 4 });
      const offset = manager.getShakeOffset(1050);
      expect(offset).not.toBeNull();
      if (offset) {
        expect(typeof offset.x).toBe('number');
        expect(typeof offset.y).toBe('number');
      }
    });

    it('シェイクなしではnullを返す', () => {
      const offset = manager.getShakeOffset(1000);
      expect(offset).toBeNull();
    });

    it('シェイク終了後はnullを返す', () => {
      manager.addEffect(EffectType.SCREEN_SHAKE, 0, 0, 1000, { damage: 2 });
      // 200ms超で持続時間終了
      manager.update(0.3, 1300);
      const offset = manager.getShakeOffset(1300);
      expect(offset).toBeNull();
    });
  });

  describe('ENEMY_DEATH エフェクト（Phase 2-4）', () => {
    it('敵タイプに応じたパーティクルが生成される', () => {
      manager.addEffect(EffectType.ENEMY_DEATH, 100, 200, 1000, { enemyType: EnemyType.PATROL });
      expect(manager.getEffectCount()).toBe(1);
      expect(manager.getTotalParticleCount()).toBe(6);
    });

    it('ボス敵は多数のパーティクルが生成される', () => {
      manager.addEffect(EffectType.ENEMY_DEATH, 100, 200, 1000, { enemyType: EnemyType.BOSS });
      expect(manager.getTotalParticleCount()).toBe(24);
    });

    it('コンボ倍率でパーティクル数が増加する', () => {
      manager.addEffect(EffectType.ENEMY_DEATH, 100, 200, 1000, { enemyType: EnemyType.PATROL, comboMultiplier: 1.5 });
      // 6 * 1.5 = 9
      expect(manager.getTotalParticleCount()).toBe(9);
    });

    it('enemyType未指定ではパーティクルが生成されない', () => {
      manager.addEffect(EffectType.ENEMY_DEATH, 100, 200, 1000);
      expect(manager.getEffectCount()).toBe(0);
    });
  });

  describe('ATTACK_HIT スケーリング（Phase 2-2）', () => {
    it('powerLevel 0 はパーティクル4個', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000, { powerLevel: 0 });
      expect(manager.getTotalParticleCount()).toBe(4);
    });

    it('powerLevel 4 はパーティクル24個', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000, { powerLevel: 4 });
      // 24個 + SCREEN_SHAKE(0個) = 24個パーティクル、エフェクト2個
      expect(manager.getTotalParticleCount()).toBe(24);
      expect(manager.getEffectCount()).toBe(2); // ATTACK_HIT + SCREEN_SHAKE
    });

    it('コンボ倍率でパーティクル数が増加する', () => {
      manager.addEffect(EffectType.ATTACK_HIT, 100, 200, 1000, { powerLevel: 1, comboMultiplier: 1.5 });
      // 8 * 1.5 = 12
      expect(manager.getTotalParticleCount()).toBe(12);
    });
  });

  describe('パーティクル上限', () => {
    it('パーティクル数が上限を超えた場合、古いエフェクトから削除される', () => {
      // 各ボス撃破エフェクトは 24 パーティクル
      // 200 / 24 ≒ 8.3 なので 9 個追加すると上限を超える
      for (let i = 0; i < 9; i++) {
        manager.addEffect(EffectType.BOSS_KILL, 100, 200, 1000 + i);
      }

      // 上限 200 を超えないようにエフェクトが削減されている
      expect(manager.getTotalParticleCount()).toBeLessThanOrEqual(200);
    });
  });

  describe('決定的フィールド検証（Phase C 特性化）', () => {
    it('ATTACK_HIT は duration 300 で、powerLevel 4 では shockwave/flash/shake を伴う', () => {
      const m = new EffectManager();
      m.addEffect(EffectType.ATTACK_HIT, 10, 20, 1000, { powerLevel: 4 });
      const effects = m.getEffects();
      const hit = effects.find((e) => e.type === EffectType.ATTACK_HIT);
      expect(hit?.duration).toBe(300);
      expect(hit?.ringMaxRadius).toBe(8 + 4 * 4);
      expect(hit?.flashAlpha).toBe(0.4);
      // hasShake により SCREEN_SHAKE が追従追加される
      expect(effects.some((e) => e.type === EffectType.SCREEN_SHAKE)).toBe(true);
    });

    // stageNumber 未指定でも既定 1 で生成される（STAGE_CLEAR）
    it.each<[EffectTypeValue, number]>([
      [EffectType.DAMAGE, 400],
      [EffectType.TRAP_DAMAGE, 350],
      [EffectType.TRAP_SLOW, 500],
      [EffectType.TRAP_TELEPORT, 400],
      [EffectType.ITEM_PICKUP, 500],
      [EffectType.LEVEL_UP, 1500],
      [EffectType.BOSS_KILL, 1200],
      [EffectType.STAGE_CLEAR, 1500],
    ])('%s の duration が %d である', (type, duration) => {
      const m = new EffectManager();
      m.addEffect(type, 0, 0, 1000);
      const e = m.getEffects().find((ef) => ef.type === type);
      expect(e?.duration).toBe(duration);
    });

    it('TRAP_TELEPORT と LEVEL_UP は ringMaxRadius を持つ', () => {
      const m = new EffectManager();
      m.addEffect(EffectType.TRAP_TELEPORT, 0, 0, 1000);
      m.addEffect(EffectType.LEVEL_UP, 0, 0, 1000);
      const teleport = m.getEffects().find((e) => e.type === EffectType.TRAP_TELEPORT);
      const levelUp = m.getEffects().find((e) => e.type === EffectType.LEVEL_UP);
      expect(teleport?.ringMaxRadius).toBe(30);
      expect(levelUp?.ringMaxRadius).toBe(40);
      expect(levelUp?.flashColor).toBe('#fbbf24');
    });

    it('SCREEN_SHAKE は particles が空で shakeIntensity を持つ', () => {
      const m = new EffectManager();
      m.addEffect(EffectType.SCREEN_SHAKE, 0, 0, 1000, { damage: 4 });
      const e = m.getEffects().find((ef) => ef.type === EffectType.SCREEN_SHAKE);
      expect(e?.particles.length).toBe(0);
      expect(e?.shakeIntensity).toBe(2); // damage=4 → Math.min(4, 4*0.5) = 2
    });

    it('LOW_HP_WARNING は addEffect してもエフェクトを追加しない（未処理を保存）', () => {
      const m = new EffectManager();
      m.addEffect(EffectType.LOW_HP_WARNING, 0, 0, 1000);
      expect(m.getEffectCount()).toBe(0);
    });

    it('ENEMY_DEATH は enemyType 未指定だとエフェクトを追加しない', () => {
      const m = new EffectManager();
      m.addEffect(EffectType.ENEMY_DEATH, 0, 0, 1000);
      expect(m.getEffectCount()).toBe(0);
    });
  });

  describe('updateAt', () => {
    it('前回時刻からの実経過秒で更新する', () => {
      const em = new EffectManager();
      em.addEffect(EffectType.DAMAGE, 100, 100, 1000);
      em.updateAt(1000); // 初回はデルタ0
      em.updateAt(1050); // 50ms 経過
      // 例外なく生存していること（DAMAGE duration=400ms）
      expect(em.getEffectCount()).toBe(1);
    });

    it('now が進まない場合（凍結中）はデルタ0で更新する', () => {
      const em = new EffectManager();
      em.addEffect(EffectType.DAMAGE, 100, 100, 1000);
      em.updateAt(1050);
      const before = em.getEffects()[0].particles.map((p) => ({ x: p.x, y: p.y }));
      em.updateAt(1050); // 同時刻 → パーティクルは動かない
      const after = em.getEffects()[0].particles.map((p) => ({ x: p.x, y: p.y }));
      expect(after).toEqual(before);
    });
  });
});
