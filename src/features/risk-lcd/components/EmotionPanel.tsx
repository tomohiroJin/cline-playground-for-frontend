import React from 'react';
import type { EmoKey } from '../types';
import { EMO } from '../constants';
import { EmoZone, EmoArt } from './styles';

interface Props {
  /** 現在のエモーションキー */
  emoKey: EmoKey;
  /** アニメーションフレーム番号 */
  frame: number;
}

// エモーションパネル表示コンポーネント
const EmotionPanel: React.FC<Props> = ({ emoKey, frame }) => {
  const variants = EMO[emoKey] ?? EMO.idle;
  const lines = variants[frame % variants.length];

  return (
    <EmoZone>
      <EmoArt>{lines.join('\n')}</EmoArt>
    </EmoZone>
  );
};

export default EmotionPanel;
