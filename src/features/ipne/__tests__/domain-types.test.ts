/**
 * domain/types 分割テスト
 *
 * types.ts の型定義が domain/types/ 配下の各ファイルに正しく分割され、
 * barrel export 経由で全てアクセスできることを検証する。
 */

// === world.ts からのエクスポート検証 ===
import {
  TileType,
  Direction,
} from '../domain/types/world';

// === player.ts からのエクスポート検証 ===
import {
  PlayerClass,
  StatType,
} from '../domain/types/player';

// === enemy.ts からのエクスポート検証 ===
import {
  EnemyType,
  EnemyState,
} from '../domain/types/enemy';

// === gimmicks.ts からのエクスポート検証 ===
import {
  TrapType,
  TrapState,
  WallType,
  WallState,
} from '../domain/types/gimmicks';

// === items.ts からのエクスポート検証 ===
import {
  ItemType,
} from '../domain/types/items';

// === stage.ts からのエクスポート検証 ===
import type {
  StageNumber,
  StageConfig,
  GimmickPlacementConfig,
  StrategicPatternLimits,
  StoryScene,
  StorySceneSlide,
} from '../domain/types/stage';

// === game-state.ts からのエクスポート検証 ===
import {
  ScreenState,
  Rating,
} from '../domain/types/game-state';

// === feedback.ts からのエクスポート検証 ===
import {
  FeedbackType,
  TutorialStepType,
  TimerState,
} from '../domain/types/feedback';

// === audio.ts からのエクスポート検証 ===
import {
  SoundEffectType,
  BgmType,
  DEFAULT_AUDIO_SETTINGS,
} from '../domain/types/audio';

// === barrel export (domain/types/index.ts) からのエクスポート検証 ===
import {
  TileType as BarrelTileType,
  Direction as BarrelDirection,
  PlayerClass as BarrelPlayerClass,
  EnemyType as BarrelEnemyType,
  ScreenState as BarrelScreenState,
} from '../domain/types';

// === 後方互換: 既存 types.ts からのエクスポート検証 ===
import {
  TileType as LegacyTileType,
  Direction as LegacyDirection,
  PlayerClass as LegacyPlayerClass,
  EnemyType as LegacyEnemyType,
  ScreenState as LegacyScreenState,
} from '../types';

describe('domain/types 分割テスト', () => {
  describe('world.ts', () => {
    it('TileType 定数が正しい値を持つ', () => {
      expect(TileType.FLOOR).toBe(0);
      expect(TileType.WALL).toBe(1);
      expect(TileType.GOAL).toBe(2);
      expect(TileType.START).toBe(3);
    });

    it('Direction 定数が正しい値を持つ', () => {
      expect(Direction.UP).toBe('up');
      expect(Direction.DOWN).toBe('down');
      expect(Direction.LEFT).toBe('left');
      expect(Direction.RIGHT).toBe('right');
    });
  });

  describe('player.ts', () => {
    it('PlayerClass 定数が正しい値を持つ', () => {
      expect(PlayerClass.WARRIOR).toBe('warrior');
      expect(PlayerClass.THIEF).toBe('thief');
    });

    it('StatType 定数が正しい値を持つ', () => {
      expect(StatType.ATTACK_POWER).toBe('attackPower');
      expect(StatType.ATTACK_RANGE).toBe('attackRange');
      expect(StatType.MOVE_SPEED).toBe('moveSpeed');
      expect(StatType.ATTACK_SPEED).toBe('attackSpeed');
      expect(StatType.HEAL_BONUS).toBe('healBonus');
    });
  });

  describe('enemy.ts', () => {
    it('EnemyType 定数が正しい値を持つ', () => {
      expect(EnemyType.PATROL).toBe('patrol');
      expect(EnemyType.CHARGE).toBe('charge');
      expect(EnemyType.RANGED).toBe('ranged');
      expect(EnemyType.SPECIMEN).toBe('specimen');
      expect(EnemyType.BOSS).toBe('boss');
      expect(EnemyType.MINI_BOSS).toBe('mini_boss');
      expect(EnemyType.MEGA_BOSS).toBe('mega_boss');
    });

    it('EnemyState 定数が正しい値を持つ', () => {
      expect(EnemyState.IDLE).toBe('idle');
      expect(EnemyState.PATROL).toBe('patrol');
      expect(EnemyState.CHASE).toBe('chase');
      expect(EnemyState.ATTACK).toBe('attack');
      expect(EnemyState.FLEE).toBe('flee');
      expect(EnemyState.RETURN).toBe('return');
      expect(EnemyState.KNOCKBACK).toBe('knockback');
    });
  });

  describe('gimmicks.ts', () => {
    it('TrapType 定数が正しい値を持つ', () => {
      expect(TrapType.DAMAGE).toBe('damage');
      expect(TrapType.SLOW).toBe('slow');
      expect(TrapType.TELEPORT).toBe('teleport');
    });

    it('TrapState 定数が正しい値を持つ', () => {
      expect(TrapState.HIDDEN).toBe('hidden');
      expect(TrapState.REVEALED).toBe('revealed');
      expect(TrapState.TRIGGERED).toBe('triggered');
    });

    it('WallType 定数が正しい値を持つ', () => {
      expect(WallType.NORMAL).toBe('normal');
      expect(WallType.BREAKABLE).toBe('breakable');
      expect(WallType.PASSABLE).toBe('passable');
      expect(WallType.INVISIBLE).toBe('invisible');
    });

    it('WallState 定数が正しい値を持つ', () => {
      expect(WallState.INTACT).toBe('intact');
      expect(WallState.DAMAGED).toBe('damaged');
      expect(WallState.BROKEN).toBe('broken');
      expect(WallState.REVEALED).toBe('revealed');
    });
  });

  describe('items.ts', () => {
    it('ItemType 定数が正しい値を持つ', () => {
      expect(ItemType.HEALTH_SMALL).toBe('health_small');
      expect(ItemType.HEALTH_LARGE).toBe('health_large');
      expect(ItemType.HEALTH_FULL).toBe('health_full');
      expect(ItemType.LEVEL_UP).toBe('level_up');
      expect(ItemType.MAP_REVEAL).toBe('map_reveal');
      expect(ItemType.KEY).toBe('key');
    });
  });

  describe('game-state.ts', () => {
    it('ScreenState 定数が正しい値を持つ', () => {
      expect(ScreenState.TITLE).toBe('title');
      expect(ScreenState.CLASS_SELECT).toBe('class_select');
      expect(ScreenState.PROLOGUE).toBe('prologue');
      expect(ScreenState.GAME).toBe('game');
      expect(ScreenState.DYING).toBe('dying');
      expect(ScreenState.GAME_OVER).toBe('game_over');
      expect(ScreenState.STAGE_CLEAR).toBe('stage_clear');
      expect(ScreenState.STAGE_STORY).toBe('stage_story');
      expect(ScreenState.STAGE_REWARD).toBe('stage_reward');
      expect(ScreenState.FINAL_CLEAR).toBe('final_clear');
    });

    it('Rating 定数が正しい値を持つ', () => {
      expect(Rating.S).toBe('s');
      expect(Rating.A).toBe('a');
      expect(Rating.B).toBe('b');
      expect(Rating.C).toBe('c');
      expect(Rating.D).toBe('d');
    });
  });

  describe('feedback.ts', () => {
    it('FeedbackType 定数が正しい値を持つ', () => {
      expect(FeedbackType.DAMAGE).toBe('damage');
      expect(FeedbackType.HEAL).toBe('heal');
      expect(FeedbackType.LEVEL_UP).toBe('level_up');
      expect(FeedbackType.TRAP).toBe('trap');
      expect(FeedbackType.ITEM_PICKUP).toBe('item_pickup');
      expect(FeedbackType.BOSS_KILL).toBe('boss_kill');
      expect(FeedbackType.SPEED_BOOST).toBe('speed_boost');
    });

    it('TutorialStepType 定数が正しい値を持つ', () => {
      expect(TutorialStepType.MOVEMENT).toBe('movement');
      expect(TutorialStepType.ATTACK).toBe('attack');
      expect(TutorialStepType.MAP).toBe('map');
      expect(TutorialStepType.ITEM).toBe('item');
      expect(TutorialStepType.TRAP).toBe('trap');
      expect(TutorialStepType.GOAL).toBe('goal');
    });

    it('TimerState 定数が正しい値を持つ', () => {
      expect(TimerState.IDLE).toBe('idle');
      expect(TimerState.RUNNING).toBe('running');
      expect(TimerState.PAUSED).toBe('paused');
      expect(TimerState.STOPPED).toBe('stopped');
    });
  });

  describe('audio.ts', () => {
    it('SoundEffectType 定数が全種類揃っている', () => {
      expect(SoundEffectType.PLAYER_DAMAGE).toBe('player_damage');
      expect(SoundEffectType.ENEMY_KILL).toBe('enemy_kill');
      expect(SoundEffectType.BOSS_KILL).toBe('boss_kill');
      expect(SoundEffectType.TELEPORT).toBe('teleport');
      expect(SoundEffectType.DYING).toBe('dying');
    });

    it('BgmType 定数が全種類揃っている', () => {
      expect(BgmType.TITLE).toBe('title');
      expect(BgmType.GAME).toBe('game');
      expect(BgmType.GAME_STAGE1).toBe('game_stage1');
      expect(BgmType.BOSS).toBe('boss');
      expect(BgmType.CLEAR).toBe('clear');
      expect(BgmType.GAME_OVER).toBe('game_over');
    });

    it('DEFAULT_AUDIO_SETTINGS がデフォルト値を持つ', () => {
      expect(DEFAULT_AUDIO_SETTINGS.masterVolume).toBe(0.7);
      expect(DEFAULT_AUDIO_SETTINGS.seVolume).toBe(0.8);
      expect(DEFAULT_AUDIO_SETTINGS.bgmVolume).toBe(0.5);
      expect(DEFAULT_AUDIO_SETTINGS.isMuted).toBe(false);
    });
  });

  describe('barrel export (domain/types/index.ts)', () => {
    it('barrel export 経由で全定数にアクセスできる', () => {
      expect(BarrelTileType.FLOOR).toBe(0);
      expect(BarrelDirection.UP).toBe('up');
      expect(BarrelPlayerClass.WARRIOR).toBe('warrior');
      expect(BarrelEnemyType.PATROL).toBe('patrol');
      expect(BarrelScreenState.TITLE).toBe('title');
    });
  });

  describe('後方互換性 (types.ts)', () => {
    it('既存の types.ts パス経由でインポートできる', () => {
      expect(LegacyTileType.FLOOR).toBe(0);
      expect(LegacyDirection.UP).toBe('up');
      expect(LegacyPlayerClass.WARRIOR).toBe('warrior');
      expect(LegacyEnemyType.PATROL).toBe('patrol');
      expect(LegacyScreenState.TITLE).toBe('title');
    });

    it('分割前と分割後の定数が同一オブジェクトである', () => {
      // barrel export 経由のオブジェクトは元の定義と同一であること
      expect(BarrelTileType).toBe(TileType);
      expect(BarrelDirection).toBe(Direction);
      expect(BarrelPlayerClass).toBe(PlayerClass);
      expect(BarrelEnemyType).toBe(EnemyType);
      expect(BarrelScreenState).toBe(ScreenState);
    });
  });
});
