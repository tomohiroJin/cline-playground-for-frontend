/**
 * シナジーバッジコンポーネント
 * アクティブなシナジーのバッジ一覧表示
 */
import React from 'react';
import type { ActiveSynergy } from '../../types';
import { SYNERGY_TAG_INFO } from '../../constants';
import { IFS } from '../../constants/ui';

export interface SynergyBadgesProps {
  synergies: ActiveSynergy[];
  showCount?: boolean;
}

export const SynergyBadges: React.FC<SynergyBadgesProps> = ({ synergies, showCount }) => {
  if (!synergies.length) return null;
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 3 }}>
      {synergies.map(s => {
        const info = SYNERGY_TAG_INFO[s.tag];
        return (
          <span key={s.tag} style={{
            fontSize: IFS.xs, color: info.cl, background: info.cl + '15',
            border: `1px solid ${info.cl}40`, padding: '2px 6px', borderRadius: 4,
          }}>
            {info.ic}{showCount ? `×${s.count} ` : ''}{s.bonusName}
          </span>
        );
      })}
    </div>
  );
};
