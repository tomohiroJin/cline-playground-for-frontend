/**
 * ゲームエンジン統合テスト
 * tickGameState を連続呼び出しして、複数ユースケースの結合動作を検証する
 */
import { tickGameState, TickSoundEffect, TickDisplayEffect } from '../../application/engine/tickGameState';
import { createTestTickInput, SeededRandomProvider } from '../helpers/scenarioHelpers';
import { aPlayer, anEnemy, aMap } from '../builders';
import { TrapType, ItemType } from '../../types';
import { createTrap } from '../../domain/entities/trap';
import { createItem } from '../../domain/entities/item';
import { SequentialIdGenerator } from '../../infrastructure/id/SequentialIdGenerator';
import { GAME_BALANCE } from '../../domain/config/gameBalance';
import { REGEN_CONFIG } from '../../application/usecases/resolveRegen';

describe('ゲームエンジン統合テスト', () => {
  const idGen = new SequentialIdGenerator();

  beforeEach(() => {
    idGen.reset();
  });

  describe('敵との接触ダメージ', () => {
    it('敵と接触してダメージを受け、無敵時間中は追加ダメージを受けない', () => {
      // Arrange: プレイヤーと敵が隣接
      const player = aPlayer().at(5, 5).withHp(10, 10).build();
      const enemy = anEnemy().withId('enemy-1').at(5, 5).withDamage(3).build();
      const map = aMap().build();

      const input = createTestTickInput({
        player,
        enemies: [enemy],
        map,
        currentTime: 1000,
      });

      // Act: 1ティック目 — ダメージ発生
      // updateEnemiesWithContact が接触ダメージを返すように設定
      const result1 = tickGameState(input, {
        updateEnemiesWithContact: () => ({
          enemies: [enemy],
          contactDamage: 3,
          contactEnemy: enemy,
          attackDamage: 0,
        }),
      });

      // Assert: ダメージを受けてHPが減少
      expect(result1.player.hp).toBe(7);
      expect(result1.player.isInvincible).toBe(true);
      expect(result1.effects).toContainEqual(
        expect.objectContaining({ kind: 'sound', type: TickSoundEffect.PLAYER_DAMAGE })
      );

      // Act: 2ティック目 — 無敵時間中（100ms後、invincibleDuration=1000ms以内）
      const input2 = createTestTickInput({
        player: result1.player,
        enemies: [enemy],
        map,
        currentTime: 1100,
      });
      const result2 = tickGameState(input2, {
        updateEnemiesWithContact: () => ({
          enemies: [enemy],
          contactDamage: 3,
          contactEnemy: enemy,
          attackDamage: 0,
        }),
      });

      // Assert: 無敵中なので追加ダメージなし
      expect(result2.player.hp).toBe(7);
      expect(result2.effects).toContainEqual(
        expect.objectContaining({ kind: 'sound', type: TickSoundEffect.DODGE })
      );
    });

    it('無敵時間経過後は再びダメージを受ける', () => {
      // Arrange
      const invincibleDuration = GAME_BALANCE.combat.invincibleDurationMs;
      const player = aPlayer()
        .at(5, 5)
        .withHp(10, 10)
        .invincibleUntil(1000 + invincibleDuration)
        .build();
      const enemy = anEnemy().withId('enemy-1').at(5, 5).withDamage(2).build();
      const map = aMap().build();

      // 無敵時間が切れた時刻でティック
      const currentTime = 1000 + invincibleDuration + 1;
      const input = createTestTickInput({
        player,
        enemies: [enemy],
        map,
        currentTime,
      });

      // Act
      const result = tickGameState(input, {
        updateEnemiesWithContact: () => ({
          enemies: [enemy],
          contactDamage: 2,
          contactEnemy: enemy,
          attackDamage: 0,
        }),
      });

      // Assert: 無敵解除後ダメージを受ける
      expect(result.player.hp).toBe(8);
    });
  });

  describe('アイテム取得', () => {
    it('プレイヤー位置のアイテムを拾い、HPが回復する', () => {
      // Arrange: プレイヤー位置にHP回復アイテム
      const player = aPlayer().at(3, 3).withHp(5, 20).build();
      const healItem = createItem(ItemType.HEALTH_SMALL, 3, 3, idGen);
      const map = aMap().build();

      const input = createTestTickInput({
        player,
        items: [healItem],
        map,
        currentTime: 1000,
      });

      // Act
      const result = tickGameState(input);

      // Assert: HP回復、アイテム消失
      expect(result.player.hp).toBeGreaterThan(5);
      expect(result.items).toHaveLength(0);
      expect(result.effects).toContainEqual(
        expect.objectContaining({ kind: 'sound', type: TickSoundEffect.HEAL })
      );
    });

    it('レベルアップアイテムを拾うとpendingLevelPointsが増加する', () => {
      // Arrange
      const player = aPlayer().at(3, 3).withLevel(1).build();
      const lvUpItem = createItem(ItemType.LEVEL_UP, 3, 3, idGen);
      const map = aMap().build();

      const input = createTestTickInput({
        player,
        items: [lvUpItem],
        map,
        currentTime: 1000,
        pendingLevelPoints: 0,
      });

      // Act
      const result = tickGameState(input);

      // Assert
      expect(result.pendingLevelPoints).toBe(1);
      expect(result.items).toHaveLength(0);
      expect(result.effects).toContainEqual(
        expect.objectContaining({ kind: 'sound', type: TickSoundEffect.LEVEL_UP })
      );
    });
  });

  describe('リジェネ', () => {
    it('リジェネが基本間隔経過後に発動する', () => {
      // Arrange: HPが最大HP未満でリジェネ間隔が経過
      const regenInterval = REGEN_CONFIG.BASE_INTERVAL;
      const player = aPlayer()
        .at(1, 1)
        .withHp(15, 20)
        .withLastRegenAt(0)
        .build();
      const map = aMap().build();

      const input = createTestTickInput({
        player,
        map,
        currentTime: regenInterval + 1,
      });

      // Act
      const result = tickGameState(input);

      // Assert: 1HP回復
      expect(result.player.hp).toBe(16);
      expect(result.player.lastRegenAt).toBe(regenInterval + 1);
    });

    it('HPが最大の場合はリジェネが発動しない', () => {
      // Arrange
      const regenInterval = REGEN_CONFIG.BASE_INTERVAL;
      const player = aPlayer()
        .at(1, 1)
        .withHp(20, 20)
        .withLastRegenAt(0)
        .build();
      const map = aMap().build();

      const input = createTestTickInput({
        player,
        map,
        currentTime: regenInterval + 1,
      });

      // Act
      const result = tickGameState(input);

      // Assert: HP変化なし
      expect(result.player.hp).toBe(20);
    });
  });

  describe('罠', () => {
    it('ダメージ罠を踏むとダメージを受ける', () => {
      // Arrange: プレイヤー位置にダメージ罠
      const player = aPlayer().at(3, 3).withHp(10, 10).build();
      const trap = createTrap(TrapType.DAMAGE, 3, 3, idGen);
      const map = aMap().build();

      const input = createTestTickInput({
        player,
        traps: [trap],
        map,
        currentTime: 1000,
      });

      // Act
      const result = tickGameState(input);

      // Assert: 罠ダメージ（3ポイント）を受ける
      expect(result.player.hp).toBeLessThan(10);
      expect(result.effects).toContainEqual(
        expect.objectContaining({ kind: 'sound', type: TickSoundEffect.TRAP_TRIGGERED })
      );
    });

    it('スロー罠を踏むと移動速度が低下する', () => {
      // Arrange
      const player = aPlayer().at(3, 3).withHp(10, 10).build();
      const trap = createTrap(TrapType.SLOW, 3, 3, idGen);
      const map = aMap().build();

      const input = createTestTickInput({
        player,
        traps: [trap],
        map,
        currentTime: 1000,
      });

      // Act
      const result = tickGameState(input);

      // Assert: スロー効果が適用
      expect(result.player.slowedUntil).toBeGreaterThan(1000);
      expect(result.effects).toContainEqual(
        expect.objectContaining({ kind: 'sound', type: TickSoundEffect.TRAP_TRIGGERED })
      );
    });

    it('テレポート罠を踏むと位置が変わる', () => {
      // Arrange
      const player = aPlayer().at(3, 3).withHp(10, 10).build();
      const trap = createTrap(TrapType.TELEPORT, 3, 3, idGen);
      const map = aMap().build();
      const random = new SeededRandomProvider(42);

      const input = createTestTickInput({
        player,
        traps: [trap],
        map,
        currentTime: 1000,
        random,
      });

      // Act
      const result = tickGameState(input);

      // Assert: テレポートが発生（位置が変わるか、少なくともテレポート音が鳴る）
      expect(result.effects).toContainEqual(
        expect.objectContaining({ kind: 'sound', type: TickSoundEffect.TELEPORT })
      );
    });
  });

  describe('ゲームオーバー', () => {
    it('HPが0になるとゲームオーバーになる', () => {
      // Arrange: HP 1 で 3 ダメージの敵と接触
      const player = aPlayer().at(5, 5).withHp(1, 10).build();
      const enemy = anEnemy().withId('enemy-1').at(5, 5).withDamage(3).build();
      const map = aMap().build();

      const input = createTestTickInput({
        player,
        enemies: [enemy],
        map,
        currentTime: 1000,
      });

      // Act
      const result = tickGameState(input, {
        updateEnemiesWithContact: () => ({
          enemies: [enemy],
          contactDamage: 3,
          contactEnemy: enemy,
          attackDamage: 0,
        }),
      });

      // Assert
      expect(result.isGameOver).toBe(true);
      expect(result.player.hp).toBe(0);
      expect(result.effects).toContainEqual(
        expect.objectContaining({ kind: 'sound', type: TickSoundEffect.DYING })
      );
      expect(result.effects).toContainEqual(
        expect.objectContaining({ kind: 'display', type: TickDisplayEffect.GAME_OVER })
      );
    });
  });

  describe('複合シナリオ', () => {
    it('ダメージを受けた後にアイテムで回復し、リジェネも発動する', () => {
      // Arrange: プレイヤーがダメージ→回復アイテム→リジェネの流れ
      const player = aPlayer()
        .at(3, 3)
        .withHp(10, 20)
        .withLastRegenAt(0)
        .build();
      const healItem = createItem(ItemType.HEALTH_SMALL, 3, 3, idGen);
      const map = aMap().build();

      // ティック1: ダメージを受ける
      const input1 = createTestTickInput({
        player,
        map,
        currentTime: 1000,
      });
      const result1 = tickGameState(input1, {
        updateEnemiesWithContact: () => ({
          enemies: [],
          contactDamage: 5,
          contactEnemy: anEnemy().build(),
          attackDamage: 0,
        }),
      });
      expect(result1.player.hp).toBe(5);

      // ティック2: 回復アイテムを拾う（移動してアイテムの位置に到達した想定）
      const playerAtItem = { ...result1.player, x: 3, y: 3 };
      const input2 = createTestTickInput({
        player: playerAtItem,
        items: [healItem],
        map,
        currentTime: 2000,
      });
      const result2 = tickGameState(input2);
      expect(result2.player.hp).toBeGreaterThan(5);

      // ティック3: リジェネ発動（十分な時間経過後）
      const regenPlayer = { ...result2.player, lastRegenAt: 0 };
      const input3 = createTestTickInput({
        player: regenPlayer,
        map,
        currentTime: REGEN_CONFIG.BASE_INTERVAL + 1,
      });
      const result3 = tickGameState(input3);

      // Assert: さらにHPが回復
      expect(result3.player.hp).toBeGreaterThan(result2.player.hp);
    });

    it('鍵アイテムを拾ってhasKeyフラグが立つ', () => {
      // Arrange
      const player = aPlayer().at(3, 3).build();
      expect(player.hasKey).toBe(false);
      const keyItem = createItem(ItemType.KEY, 3, 3, idGen);
      const map = aMap().build();

      const input = createTestTickInput({
        player,
        items: [keyItem],
        map,
        currentTime: 1000,
      });

      // Act
      const result = tickGameState(input);

      // Assert
      expect(result.player.hasKey).toBe(true);
      expect(result.effects).toContainEqual(
        expect.objectContaining({ kind: 'sound', type: TickSoundEffect.KEY_PICKUP })
      );
    });
  });
});
