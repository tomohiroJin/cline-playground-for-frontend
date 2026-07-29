/**
 * 灰燼の城壁 - 敵定義（5種）
 *
 * 設計書 §6。3種のカウンター要求を最小構成で担う:
 * 属性=鴉(飛行) / 位置=鴉(経路中盤から出現) / テンポ=俊足(速い)。
 * 群れは範囲攻撃を、重装は単体高火力を要求する。
 */
export interface EnemySpec {
  id: string;
  name: string;
  hp: number;
  /** 移動速度（経路セル/tick） */
  speed: number;
  /** 飛行するか。true の敵には hitsFlying の塔と罠が当たらない */
  flying: boolean;
}

const ENEMIES: readonly EnemySpec[] = [
  { id: 'grunt', name: '雑兵', hp: 20, speed: 0.1, flying: false },
  { id: 'runner', name: '俊足', hp: 12, speed: 0.18, flying: false },
  { id: 'swarm', name: '群れ', hp: 8, speed: 0.12, flying: false },
  { id: 'brute', name: '重装', hp: 60, speed: 0.06, flying: false },
  { id: 'raven', name: '鴉', hp: 16, speed: 0.14, flying: true },
];

const ENEMY_MAP: ReadonlyMap<string, EnemySpec> = new Map(ENEMIES.map((e) => [e.id, e]));

export const ENEMY_IDS: readonly string[] = ENEMIES.map((e) => e.id);

export const getEnemySpec = (id: string): EnemySpec => {
  const spec = ENEMY_MAP.get(id);
  if (!spec) {
    throw new Error(`未知の敵IDです: ${id}`);
  }
  return spec;
};
