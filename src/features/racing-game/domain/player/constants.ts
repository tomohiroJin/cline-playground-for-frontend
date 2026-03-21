// Player ドメイン定数

/** ドリフト定数 */
export const DRIFT = Object.freeze({
  MIN_SPEED: 0.3,
  ANGLE_MULTIPLIER: 1.8,
  SPEED_RETAIN: 0.97,
  MAX_SLIP_ANGLE: Math.PI / 4,
  LATERAL_FORCE: 0.3,
  BOOST_BASE: 0.08,
  BOOST_PER_SEC: 0.15,
  BOOST_MAX: 0.5,
  BOOST_DURATION: 1.0,
});

/** プレイヤー操作定数 */
export const PLAYER = Object.freeze({
  TURN_RATE: 0.065,
  SPEED_RECOVERY: 0.02,
});

/** プレイヤー移動定数 */
export const PLAYER_PHYSICS = Object.freeze({
  /** dt はフレームレートから推定（60fps 想定） */
  FRAME_DT: 1 / 60,
  /** 壁接触中の速度回復率（30% に制限） */
  WALL_RECOVERY_RATE: 0.3,
  /** ワープ後の速度 */
  WARP_SPEED: 0.3,
  /** 最低速度（壁接触後） */
  MIN_SPEED_AFTER_WALL: 0.1,
});

/** HEAT（ニアミスボーナス）定数 */
export const HEAT = Object.freeze({
  WALL_THRESHOLD: 25,
  CAR_THRESHOLD: 40,
  GAIN_RATE: 0.8,
  DECAY_RATE: 0.15,
  BOOST_POWER: 0.25,
  BOOST_DURATION: 0.8,
  COOLDOWN: 1.0,
});
