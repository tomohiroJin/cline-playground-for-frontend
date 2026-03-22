/**
 * 背景生成モジュール
 *
 * generators.ts の BackgroundGen を application 層に移動。
 */
import { Config } from '../../config';
import { createBuilding, createCloud } from '../../domain/entities';
import { MathUtils } from '../../domain/math-utils';
import type { Building, Cloud } from '../../types';

/** 背景生成サービス */
export const BackgroundGen = {
  /** 初期ビルディング群を生成する */
  initBuildings: (): Building[] => {
    const buildings: Building[] = [];
    for (
      let x = 0;
      x < Config.screen.width + 200;
      x += MathUtils.randomRange(50, 90)
    ) {
      buildings.push(createBuilding(x));
    }
    return buildings;
  },

  /** 初期雲群を生成する */
  initClouds: (n = 6): Cloud[] =>
    Array.from({ length: n }, () => createCloud()),
} as const;
