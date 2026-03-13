import { isStageCleared, createStageConfig } from './stage-progress';
import type { RuntimeStageConfig, ModDef } from '../types';

describe('isStageCleared', () => {
  const cfg: RuntimeStageConfig = { cy: 8, spd: 2600, si: 1, fk: false };

  it('cycle が cy 未満のとき false', () => {
    expect(isStageCleared(0, cfg)).toBe(false);
    expect(isStageCleared(7, cfg)).toBe(false);
  });

  it('cycle が cy に等しいとき true', () => {
    expect(isStageCleared(8, cfg)).toBe(true);
  });

  it('cycle が cy を超えるとき true', () => {
    expect(isStageCleared(10, cfg)).toBe(true);
  });
});

describe('createStageConfig', () => {
  it('指定ステージの設定を返す', () => {
    const cfg = createStageConfig({ stageIndex: 0 });

    expect(cfg.cy).toBe(8);
    expect(cfg.spd).toBe(2600);
    expect(cfg.si).toBe(1);
    expect(cfg.fk).toBe(false);
  });

  it('ステージ番号が配列長を超える場合、最後のステージを返す', () => {
    const cfg = createStageConfig({ stageIndex: 100 });

    // STG の最後のステージ（index 5）
    expect(cfg.cy).toBe(20);
    expect(cfg.spd).toBe(1050);
  });

  it('モディファイアが適用される', () => {
    const mod: ModDef = {
      id: 'bonus',
      nm: 'BONUS ROUND',
      ds: '全得点×2',
      fn: (c: RuntimeStageConfig) => {
        c._scoreMod = 2;
      },
    };

    const cfg = createStageConfig({ stageIndex: 0, modifier: mod });

    expect(cfg._scoreMod).toBe(2);
    expect(cfg.cy).toBe(8); // 他のプロパティは変更なし
  });

  it('モディファイアなしの場合、基本設定のみ', () => {
    const cfg = createStageConfig({ stageIndex: 2 });

    expect(cfg._dblChance).toBeUndefined();
    expect(cfg._scoreMod).toBeUndefined();
    expect(cfg._fogShift).toBeUndefined();
  });

  it('カスタムステージ定義を渡せる', () => {
    const customStages = [
      { cy: 5, spd: 3000, si: 1, fk: false },
    ];

    const cfg = createStageConfig({ stageIndex: 0, stages: customStages });

    expect(cfg.cy).toBe(5);
    expect(cfg.spd).toBe(3000);
  });
});
