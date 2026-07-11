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
    /** ストレイフ（横移動）の前進速度に対する倍率 */
    STRAFE_SPEED_MULTIPLIER: 0.8,
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
    /**
     * 罠の発動距離。壁寄り時の中心オフセット上限
     * (通路半幅0.5 − プレイヤー半径0.2 = 0.3) より小さくし、横移動での回避を可能にする
     */
    TRAP_PICKUP_DISTANCE: 0.28,
    /** 出口到達判定距離 */
    EXIT_DISTANCE: 0.55,
    /** 敵との衝突判定距離 */
    ENEMY_COLLISION_DISTANCE: 0.45,
    /** 敵ノックバック距離 */
    ENEMY_KNOCKBACK_DISTANCE: 2.5,
  },
  enemy: {
    /** 敵の最小スポーン距離 */
    MIN_SPAWN_DISTANCE: 10,
    /** BFS パス再計算間隔（ms） */
    PATH_RECALC_INTERVAL: 500,
    /** テレポートクールダウン（ms） */
    TELEPORT_COOLDOWN: 8000,
    /** テレポート型の追跡開始距離 */
    TELEPORT_CHASE_RANGE: 4,
    /** 徘徊型の速度倍率（eSpeed 全体が下がったため、徘徊型の存在感を維持する補正） */
    WANDERER_SPEED_MULTIPLIER: 1.0,
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
    /** 視野角の全体角（ラジアン、±60°） */
    FOV_ANGLE: (Math.PI * 2) / 3,
    /** 追跡中に視線を失ってから捜索へ移るまでの猶予（ms） */
    LOSE_SIGHT_GRACE: 2000,
    /** 最終目撃地点への到達判定距離（セル） */
    LAST_SEEN_REACH_DISTANCE: 0.6,
    /** 敵速度の対プレイヤー移動速度比の上限（走り勝てないが視線を切れば撒ける） */
    MAX_SPEED_RATIO: 0.9,
    /** 捜索中に目撃地点へ引き戻される距離しきい値（セル） */
    SEARCH_PULL_DISTANCE: 2,
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
    MAP_REVEAL_RADIUS: 10,
  },
  stone: {
    /** 初期所持数 */
    INITIAL_COUNT: 3,
    /** 最大所持数 */
    MAX_COUNT: 5,
    /** 石の飛行速度（セル/ms） */
    SPEED: 0.012,
    /** 最大飛距離（セル） */
    THROW_RANGE: 6,
    /** 着地音に敵が反応する半径（セル） */
    NOISE_RADIUS: 5,
  },
} as const;
