import React from 'react';
import { STY, STY_KEYS } from '../constants';
import ListPanel from './ListPanel';
import { ListItem, LiName, LiDesc, LiDesc2, LiTag } from './styles';

interface Props {
  active: boolean;
  /** 現在選択中のインデックス */
  selectedIndex: number;
  /** 所持済みスタイルID一覧 */
  ownedStyles: string[];
  /** 装備中スタイルID一覧 */
  equippedStyles: string[];
  /** 最大装備スロット数 */
  maxSlots: number;
}

// プレイスタイル選択/装備画面
const StyleListScreen: React.FC<Props> = ({
  active,
  selectedIndex,
  ownedStyles,
  equippedStyles,
  maxSlots,
}) => {
  const footerText =
    maxSlots > 1
      ? `◀ BACK ── SLOT ${equippedStyles.length}/${maxSlots} ── TOGGLE ●`
      : '◀ BACK ── 1枠 (UNLOCKで拡張) ── EQUIP ●';

  return (
    <ListPanel
      active={active}
      title="PLAY STYLE"
      footer={footerText}
    >
      {STY_KEYS.map((id, i) => {
        const s = STY[id];
        const owned = ownedStyles.includes(id);
        const equipped = equippedStyles.includes(id);

        return (
          <ListItem key={id} $selected={i === selectedIndex} $locked={!owned}>
            <LiName>
              <span>{s.nm}</span>
              {equipped && <LiTag>EQUIP</LiTag>}
              {!owned && <LiTag $warn>LOCKED</LiTag>}
            </LiName>
            <LiDesc>{s.bf.map((b: string) => '+' + b).join(' ')}</LiDesc>
            {s.df.length > 0 && (
              <LiDesc2>{s.df.map((b: string) => '-' + b).join(' ')}</LiDesc2>
            )}
          </ListItem>
        );
      })}
    </ListPanel>
  );
};

export default StyleListScreen;
