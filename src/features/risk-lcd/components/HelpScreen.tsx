import React from 'react';
import { HELP_SECTIONS } from '../constants';
import ListPanel from './ListPanel';
import { ListItem, LiName, LiDesc } from './styles';

interface Props {
  active: boolean;
}

// カテゴリ別ヘルプ表示画面
const HelpScreen: React.FC<Props> = ({ active }) => (
  <ListPanel active={active} title="HELP" footer="◀ BACK">
    {HELP_SECTIONS.map((sec) => (
      <React.Fragment key={sec.cat}>
        {/* カテゴリヘッダー */}
        <ListItem
          style={{
            background: 'rgba(24,28,18,.04)',
            borderColor: 'rgba(24,28,18,.36)',
            pointerEvents: 'none',
          }}
        >
          <LiName style={{ fontSize: '8px', letterSpacing: '2px' }}>
            ── {sec.cat} ──
          </LiName>
        </ListItem>
        {/* カテゴリ内アイテム */}
        {sec.items.map((item) => (
          <ListItem key={item.nm} style={{ pointerEvents: 'none' }}>
            <LiName>{item.nm}</LiName>
            <LiDesc>{item.ds}</LiDesc>
          </ListItem>
        ))}
      </React.Fragment>
    ))}
  </ListPanel>
);

export default HelpScreen;
