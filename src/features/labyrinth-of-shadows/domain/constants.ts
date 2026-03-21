/**
 * ドメイン定数
 * ゲームバランスに関わるマジックナンバーを集約
 */

/** ゲームバランス定数 */
export const GAME_BALANCE = {
  player: {
    ROTATION_SPEED: 0.003,
    MOVE_SPEED: 0.0024,
    COLLISION_RADIUS: 0.2,
    SPRINT_MULTIPLIER: 1.5,
  },
  hiding: {
    ENERGY_DRAIN_RATE: 0.02,
    ENERGY_RECHARGE_RATE: 0.016,
    MIN_ENERGY_TO_HIDE: 5,
  },
  stamina: {
    DRAIN_RATE: 0.022,
    RECHARGE_RATE: 0.014,
  },
  collision: {
    /** アイテム取得距離 */
    ITEM_PICKUP_DISTANCE: 0.5,
    /** 出口到達判定距離 */
    EXIT_DISTANCE: 0.55,
    /** 敵との衝突判定距離 */
    ENEMY_COLLISION_DISTANCE: 0.45,
    /** 敵ノックバック距離 */
    ENEMY_KNOCKBACK_DISTANCE: 2.5,
  },
  enemy: {
    /** 追跡型の追跡開始距離 */
    CHASE_RANGE: 8,
    /** 敵の最小スポーン距離 */
    MIN_SPAWN_DISTANCE: 5,
    /** BFS パス再計算間隔（ms） */
    PATH_RECALC_INTERVAL: 500,
    /** テレポートクールダウン（ms） */
    TELEPORT_COOLDOWN: 8000,
    /** テレポート型の追跡開始距離 */
    TELEPORT_CHASE_RANGE: 4,
    /** 追跡型の近距離加速しきい値 */
    CLOSE_RANGE_THRESHOLD: 4,
    /** 追跡型の近距離加速倍率 */
    CLOSE_RANGE_SPEED_MULTIPLIER: 1.2,
    /** 徘徊型の速度倍率 */
    WANDERER_SPEED_MULTIPLIER: 0.6,
    /** テレポート型の追跡速度倍率 */
    TELEPORTER_CHASE_SPEED_MULTIPLIER: 0.8,
    /** テレポート型の巡回速度倍率 */
    TELEPORTER_PATROL_SPEED_MULTIPLIER: 0.4,
    /** テレポート先の最小距離 */
    TELEPORT_MIN_DISTANCE: 3,
    /** テレポート先の最大距離 */
    TELEPORT_MAX_DISTANCE: 8,
    /** BFS パス到達判定距離 */
    PATH_NODE_REACH_DISTANCE: 0.3,
    /** 初期最遠敵距離（updateEnemies で使用） */
    INITIAL_CLOSEST_DISTANCE: 99,
  },
  scoring: {
    /** 鍵取得の基本スコア */
    KEY_BASE_SCORE: 100,
    /** 勝利ボーナス */
    VICTORY_BONUS: 500,
    /** ダメージペナルティ */
    DAMAGE_PENALTY: 50,
    /** ライフ満タン時の回復薬ボーナス */
    HEAL_FULL_BONUS: 50,
    /** コンボ時間窓（ms） */
    COMBO_TIME_WINDOW: 10000,
  },
  timing: {
    /** 無敵時間（ms） */
    INVINCIBILITY_DURATION: 2500,
    /** メッセージ表示時間（ms） */
    MESSAGE_DURATION: 2000,
    /** 罠の時間ペナルティ（ms） */
    TRAP_TIME_PENALTY: 12000,
    /** 加速ブースト持続時間（ms） */
    SPEED_BOOST_DURATION: 10000,
    /** ロック中メッセージ表示間隔（ms） */
    LOCKED_MESSAGE_DURATION: 1500,
    /** ダメージメッセージ表示時間（ms） */
    DAMAGE_MESSAGE_DURATION: 1500,
  },
  items: {
    /** 加速ブースト倍率 */
    SPEED_BOOST_MULTIPLIER: 1.3,
    /** 地図公開範囲 */
    MAP_REVEAL_RADIUS: 5,
  },
} as const;
