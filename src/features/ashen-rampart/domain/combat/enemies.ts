/**
 * 灰燼の城壁 - 敵定義（P1: 地上3種）
 */
export interface EnemySpec {
  id: string;
  name: string;
  hp: number;
  /** 移動速度（経路セル/tick） */
  speed: number;
  /** 撃破時のスコア報酬 */
  reward: number;
}

const ENEMIES: readonly EnemySpec[] = [
  { id: 'grunt', name: '雑兵', hp: 20, speed: 0.1, reward: 10 },
  { id: 'runner', name: '俊足', hp: 12, speed: 0.18, reward: 12 },
  { id: 'brute', name: '重装', hp: 60, speed: 0.06, reward: 20 },
];

const ENEMY_MAP: ReadonlyMap<string, EnemySpec> = new Map(
  ENEMIES.map((e) => [e.id, e])
);

export const getEnemySpec = (id: string): EnemySpec => {
  const spec = ENEMY_MAP.get(id);
  if (!spec) {
    throw new Error(`未知の敵IDです: ${id}`);
  }
  return spec;
};
