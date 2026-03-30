import { CONSTANTS, GameConstants } from './constants';
import { GameState, Mallet, Puck, Item, ItemType, FieldConfig, ObstacleState, MatchStats, EffectState } from './types';
import { applyDeflectionBias } from './physics';

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

/** マレットを目標位置に移動し速度を設定する */
export function moveMalletTo(mallet: Mallet, targetX: number, targetY: number): void {
  mallet.vx = targetX - mallet.x;
  mallet.vy = targetY - mallet.y;
  mallet.x = targetX;
  mallet.y = targetY;
}

/**
 * マレットとパックの食い込みを解消する
 * moveMalletTo の瞬間移動でマレットがパックに重なった場合、
 * パックをマレットの移動方向に押し出し、速度を与える。
 *
 * 幾何学的法線（マレット→パック）ではなくマレットの移動方向を使う理由:
 * マレットがパックを飛び越えて深くめり込んだ場合、幾何学的法線は
 * マレットの移動方向と逆向きになり、力が相殺されてパックが動かなくなるため。
 */
export function resolveMalletPuckOverlap(
  mallet: Mallet,
  pucks: Puck[],
  malletRadius: number,
  puckRadius: number,
  maxPower: number,
  deflectionBias: number = 0
): void {
  for (const puck of pucks) {
    const dx = puck.x - mallet.x;
    const dy = puck.y - mallet.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = malletRadius + puckRadius;
    if (dist >= minDist) continue;

    const malletSpeed = Math.sqrt(mallet.vx * mallet.vx + mallet.vy * mallet.vy);

    // 押し出し方向: マレットの移動方向を優先（幾何学的法線は深い食い込み時に逆向きになる）
    let pushNx: number;
    let pushNy: number;
    if (malletSpeed > 0.1) {
      // マレットが動いている → 移動方向にパックを弾く
      pushNx = mallet.vx / malletSpeed;
      pushNy = mallet.vy / malletSpeed;
    } else if (dist > 0.1) {
      // マレットが静止 → 幾何学的法線（マレット→パック方向）で押し出す
      pushNx = dx / dist;
      pushNy = dy / dist;
    } else {
      // 完全重複 + 静止 → 上方向に逃がす
      pushNx = 0;
      pushNy = -1;
    }

    // deflectionBias による法線バイアス適用（CPU マレットのみ非ゼロ値が渡される）
    const { nx: biasedNx, ny: biasedNy } = deflectionBias !== 0
      ? applyDeflectionBias(pushNx, pushNy, deflectionBias)
      : { nx: pushNx, ny: pushNy };

    // パックをマレットの移動方向に押し出す
    puck.x = mallet.x + biasedNx * (minDist + 1);
    puck.y = mallet.y + biasedNy * (minDist + 1);

    // マレット速度に応じた反射力をパックに与える
    const power = Math.min(maxPower, 5 + malletSpeed * 1.2);
    puck.vx = biasedNx * power + mallet.vx * 0.4;
    puck.vy = biasedNy * power + mallet.vy * 0.4;
  }
}

/**
 * マレット間の重なりを解消する
 * 全マレットペアの距離を判定し、重なっている場合は中心間ベクトルに沿って均等に押し戻す
 * zoneBounds が指定された場合、押し戻し後にゾーン内にクランプする
 */
export function resolveMalletMalletOverlaps(
  mallets: { mallet: Mallet }[],
  malletRadius: number,
  zoneBounds?: { minX: number; maxX: number; minY: number; maxY: number }[]
): void {
  const minDist = malletRadius * 2;
  for (let i = 0; i < mallets.length; i++) {
    for (let j = i + 1; j < mallets.length; j++) {
      const a = mallets[i].mallet;
      const b = mallets[j].mallet;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= minDist) continue;

      // 完全重複時は X 軸正方向に押し出す（決定的でテスト再現性あり）
      let nx: number;
      let ny: number;
      if (dist < 0.01) {
        nx = 1;
        ny = 0;
      } else {
        nx = dx / dist;
        ny = dy / dist;
      }
      const overlap = (minDist - dist) / 2;
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;
    }
  }

  // ゾーン制約の再適用（押し戻しで相手ゾーンに出ないように）
  if (zoneBounds) {
    for (let i = 0; i < mallets.length && i < zoneBounds.length; i++) {
      const m = mallets[i].mallet;
      const z = zoneBounds[i];
      if (m.x < z.minX) m.x = z.minX;
      if (m.x > z.maxX) m.x = z.maxX;
      if (m.y < z.minY) m.y = z.minY;
      if (m.y > z.maxY) m.y = z.maxY;
    }
  }
}

export const EntityFactory = {
  createMallet: (x: number, y: number): Mallet => ({ x, y, vx: 0, vy: 0 }),
  createPuck: (x: number, y: number, vx = 0, vy = 1.5): Puck => ({
    x,
    y,
    vx,
    vy,
    visible: true,
    invisibleCount: 0,
  }),
  createItem: (
    template: { id: string; name: string; color: string; icon: string },
    fromTop: boolean,
    consts: GameConstants = CONSTANTS
  ): Item => {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const { ITEM: IR } = consts.SIZES;
    return {
      ...template,
      id: template.id as ItemType,
      x: randomRange(50, W - 50),
      y: fromTop ? 80 : H - 80,
      vx: randomRange(-1, 1),
      vy: fromTop ? 2 : -2,
      r: IR,
    };
  },
  // 障害物の破壊状態を初期化
  createObstacleStates: (field?: FieldConfig): ObstacleState[] => {
    if (!field?.destructible) return [];
    const hp = field.obstacleHp ?? 3;
    return field.obstacles.map(() => ({
      hp,
      maxHp: hp,
      destroyed: false,
      destroyedAt: 0,
    }));
  },
  createGameState: (consts: GameConstants = CONSTANTS, field?: FieldConfig, is2v2 = false): GameState => {
    const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
    const defaultEffect = (): EffectState => ({ speed: null, invisible: 0, shield: false, magnet: null, big: null });

    // 2v2 モードではマレット位置を4分割配置に変更
    const playerX = is2v2 ? W / 4 : W / 2;
    const playerY = is2v2 ? H - 120 : H - 70;
    const cpuX = is2v2 ? W / 4 : W / 2;
    const cpuY = is2v2 ? 120 : 70;

    return {
      player: EntityFactory.createMallet(playerX, playerY),
      cpu: EntityFactory.createMallet(cpuX, cpuY),
      ally: is2v2 ? EntityFactory.createMallet(W * 3 / 4, H - 120) : undefined,
      enemy: is2v2 ? EntityFactory.createMallet(W * 3 / 4, 120) : undefined,
      pucks: [EntityFactory.createPuck(W / 2, H / 2, randomRange(-0.5, 0.5), Math.random() > 0.5 ? 1.5 : -1.5)],
      items: [],
      effects: {
        player: defaultEffect(),
        cpu: defaultEffect(),
        ...(is2v2 ? { ally: defaultEffect(), enemy: defaultEffect() } : {}),
      },
      lastItemSpawn: Date.now(),
      flash: null,
      goalEffect: null,
      cpuTarget: null,
      cpuTargetTime: 0,
      cpuStuckTimer: 0,
      fever: { active: false, lastGoalTime: Date.now(), extraPucks: 0 },
      particles: [],
      obstacleStates: EntityFactory.createObstacleStates(field),
      combo: { count: 0, lastScorer: undefined },
    };
  },
  createMatchStats: (): MatchStats => ({
    playerHits: 0,
    cpuHits: 0,
    maxPuckSpeed: 0,
    playerItemsCollected: 0,
    cpuItemsCollected: 0,
    playerSaves: 0,
    cpuSaves: 0,
    matchDuration: 0,
  }),
};
