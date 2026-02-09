import React from 'react';
import type { PerkDef } from '../types';
import {
  PerkOverlay,
  PerkTitle,
  PerkSub,
  PerkChoices,
  PerkCard,
  PerkName,
  PerkDesc,
  PerkType,
  PerkFooter,
  PerkSummary,
} from './styles';

interface Props {
  choices: PerkDef[];
  selectedIndex: number;
  perks: PerkDef[];
  /** パーク項目クリック時のコールバック */
  onPerkClick?: (index: number) => void;
}

// ステージ間パーク選択画面
const PerkSelectScreen: React.FC<Props> = ({
  choices,
  selectedIndex,
  perks,
  onPerkClick,
}) => (
  <PerkOverlay>
    <PerkTitle>PERK SELECT</PerkTitle>
    <PerkSub>▲▼ SELECT ─ ● EQUIP</PerkSub>
    <PerkChoices>
      {choices.map((p, i) => (
        <PerkCard key={p.id + i} $selected={i === selectedIndex} onClick={() => onPerkClick?.(i)}>
          <PerkName>
            {p.ic} {p.nm}
          </PerkName>
          <PerkDesc>{p.ds}</PerkDesc>
          <PerkType>{p.tp === 'risk' ? '⚠ RISK' : '✦ BUFF'}</PerkType>
        </PerkCard>
      ))}
    </PerkChoices>
    <PerkFooter>パークは累積する</PerkFooter>
    <PerkSummary>
      BUILD: {perks.length ? perks.map((p) => p.ic).join('') : 'なし'}
    </PerkSummary>
  </PerkOverlay>
);

export default PerkSelectScreen;
