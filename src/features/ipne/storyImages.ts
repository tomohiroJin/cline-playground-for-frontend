/**
 * ストーリー画像レジストリ
 *
 * ストーリー画面・エンディング画面で使用する画像を一元管理する。
 * 画像はassetsからimportし、Webpackでバンドルされる。
 */

import { StoryImageEntry } from './types';

// 実画像を import
import imgPrologue1 from '../../assets/images/ipne_story_prologue_1.webp';
import imgPrologue2 from '../../assets/images/ipne_story_prologue_2.webp';
import imgPrologue3 from '../../assets/images/ipne_story_prologue_3.webp';
import imgStage1 from '../../assets/images/ipne_story_stage_1.webp';
import imgStage2 from '../../assets/images/ipne_story_stage_2.webp';
import imgStage3 from '../../assets/images/ipne_story_stage_3.webp';
import imgStage4 from '../../assets/images/ipne_story_stage_4.webp';
import imgStage5 from '../../assets/images/ipne_story_stage_5.webp';
import imgGameOver from '../../assets/images/ipne_story_game_over.webp';

/** 画像定義（キー → alt, width, height） */
const IMAGE_DEFINITIONS: Record<string, { alt: string; width: number; height: number }> = {
  prologue_scene_1: { alt: '任務ブリーフィング', width: 480, height: 270 },
  prologue_scene_2: { alt: 'ダンジョン入口', width: 480, height: 270 },
  prologue_scene_3: { alt: '閉じた入口', width: 480, height: 270 },
  story_stage_1: { alt: '第一層突破', width: 480, height: 270 },
  story_stage_2: { alt: '深部への接近', width: 480, height: 270 },
  story_stage_3: { alt: '異変', width: 480, height: 270 },
  story_stage_4: { alt: '最深部へ', width: 480, height: 270 },
  story_stage_5: { alt: '封鎖解除', width: 480, height: 270 },
  game_over: { alt: '冒険の終わり', width: 480, height: 270 },
};

// 画像キー → import マッピング
const IMAGE_SOURCES: Record<string, string> = {
  prologue_scene_1: imgPrologue1,
  prologue_scene_2: imgPrologue2,
  prologue_scene_3: imgPrologue3,
  story_stage_1: imgStage1,
  story_stage_2: imgStage2,
  story_stage_3: imgStage3,
  story_stage_4: imgStage4,
  story_stage_5: imgStage5,
  game_over: imgGameOver,
};

/**
 * 画像キーからエントリを取得する
 * @param key 画像キー
 * @returns StoryImageEntry | undefined
 */
export function getStoryImage(key: string): StoryImageEntry | undefined {
  const def = IMAGE_DEFINITIONS[key];
  if (!def) return undefined;

  return {
    src: IMAGE_SOURCES[key],
    alt: def.alt,
    width: def.width,
    height: def.height,
  };
}

/**
 * 画像キーが登録されているか確認する
 * @param key 画像キー
 * @returns boolean
 */
export function hasStoryImage(key: string): boolean {
  return key in IMAGE_DEFINITIONS;
}
