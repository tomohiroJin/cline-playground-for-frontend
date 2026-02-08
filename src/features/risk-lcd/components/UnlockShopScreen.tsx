import React from 'react';
import { SHP } from '../constants';
import ListPanel from './ListPanel';
import { ListItem, LiName, LiDesc, LiCost } from './styles';

interface Props {
  active: boolean;
  /** 現在選択中のインデックス */
  selectedIndex: number;
  /** ポイント残高 */
  pts: number;
  /** 所持済みスタイルID一覧 */
  ownedStyles: string[];
  /** 所持済みアンロックID一覧 */
  ownedUnlocks: string[];
}

// PTでアンロック購入するショップ画面
const UnlockShopScreen: React.FC<Props> = ({
  active,
  selectedIndex,
  pts,
  ownedStyles,
  ownedUnlocks,
}) => (
  <ListPanel
    active={active}
    title="UNLOCK"
    subtitle={`PT:${pts}`}
    footer="◀ BACK ──── BUY ●"
  >
    {SHP.map((item, i) => {
      const owned =
        item.tp === 's'
          ? ownedStyles.includes(item.id)
          : ownedUnlocks.includes(item.id);

      return (
        <ListItem key={item.id} $selected={i === selectedIndex} $owned={owned}>
          <LiName>{item.nm}</LiName>
          <LiDesc>{item.ds}</LiDesc>
          <LiCost>{owned ? 'OWNED' : `${item.co}PT`}</LiCost>
        </ListItem>
      );
    })}
  </ListPanel>
);

export default UnlockShopScreen;
