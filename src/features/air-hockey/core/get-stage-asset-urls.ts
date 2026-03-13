/**
 * ステージに必要な画像アセットURLを収集する関数
 * P1-03: 画像プリロード基盤
 */
import type { Character } from './types';
import type { StageDefinition } from './story';
import { BACKGROUND_MAP } from './characters';

/** 勝利カットイン画像のURLを生成する */
export function getVictoryCutInUrl(chapter: number): string {
  return `/assets/cutins/victory-ch${chapter}.png`;
}

/**
 * ステージで使用する全画像アセットのURLリストを返す
 * プリロード対象: 背景画像、プレイヤー立ち絵、対戦相手立ち絵、勝利カットイン
 */
export function getStageAssetUrls(
  stage: StageDefinition,
  characters: Record<string, Character>
): string[] {
  const urlSet = new Set<string>();

  // 背景画像
  if (stage.backgroundId) {
    const bgUrl = BACKGROUND_MAP[stage.backgroundId];
    if (bgUrl) {
      urlSet.add(bgUrl);
    }
  }

  // プレイヤーキャラの立ち絵
  const player = characters['player'];
  if (player?.portrait) {
    urlSet.add(player.portrait.normal);
    urlSet.add(player.portrait.happy);
  }

  // 対戦相手キャラの立ち絵
  const opponent = characters[stage.characterId];
  if (opponent?.portrait) {
    urlSet.add(opponent.portrait.normal);
    urlSet.add(opponent.portrait.happy);
  }

  // 勝利カットイン（章の最終ステージの場合）
  if (stage.isChapterFinale) {
    urlSet.add(getVictoryCutInUrl(stage.chapter));
  }

  return Array.from(urlSet);
}
