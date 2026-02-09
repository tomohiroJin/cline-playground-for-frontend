import React from 'react';
import type { ArtKey } from '../types';
import { ART } from '../constants';
import { ArtZone, ArtText } from './styles';

interface Props {
  /** 現在のアートキー */
  artKey: ArtKey;
  /** アニメーションフレーム番号 */
  frame: number;
  /** プレイヤーがこのレーンにいるか */
  here?: boolean;
  /** 危険状態（点滅） */
  danger?: boolean;
  /** 被弾状態 */
  hit?: boolean;
  /** セーフ発光 */
  safeGlow?: boolean;
}

// ASCIIアート表示コンポーネント
const CharacterArt: React.FC<Props> = ({
  artKey,
  frame,
  here = false,
  danger = false,
  hit = false,
  safeGlow = false,
}) => {
  const variants = ART[artKey] ?? ART.idle;
  const lines = variants[frame % variants.length];

  return (
    <ArtZone $here={here} $danger={danger} $hit={hit} $safeGlow={safeGlow}>
      <ArtText $here={here} $danger={danger} $hit={hit}>
        {lines.join('\n')}
      </ArtText>
    </ArtZone>
  );
};

export default CharacterArt;
