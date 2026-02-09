import React from 'react';
import { HELP_SECTIONS } from '../constants';
import ListPanel from './ListPanel';
import { ListItem, LiName, LiDesc } from './styles';

interface Props {
  active: boolean;
  selectedIndex?: number;
}

// カテゴリ別ヘルプ表示画面
const HelpScreen: React.FC<Props> = ({ active, selectedIndex }) => {
  let offset = 0;
  return (
    <ListPanel active={active} title="HELP" footer="◀ BACK" selectedIndex={selectedIndex}>
      {HELP_SECTIONS.map((sec) => {
        const catIdx = offset;
        offset += 1 + sec.items.length;
        return (
          <React.Fragment key={sec.cat}>
            {/* カテゴリヘッダー */}
            <ListItem
              $selected={catIdx === selectedIndex}
              style={{
                background: 'rgba(24,28,18,.04)',
                borderColor: catIdx === selectedIndex ? undefined : 'rgba(24,28,18,.36)',
                pointerEvents: 'none',
              }}
            >
              <LiName style={{ fontSize: '8px', letterSpacing: '2px' }}>
                ── {sec.cat} ──
              </LiName>
            </ListItem>
            {/* カテゴリ内アイテム */}
            {sec.items.map((item, i) => (
              <ListItem
                key={item.nm}
                $selected={catIdx + 1 + i === selectedIndex}
                style={{ pointerEvents: 'none' }}
              >
                <LiName>{item.nm}</LiName>
                <LiDesc>{item.ds}</LiDesc>
              </ListItem>
            ))}
          </React.Fragment>
        );
      })}
    </ListPanel>
  );
};

export default HelpScreen;
