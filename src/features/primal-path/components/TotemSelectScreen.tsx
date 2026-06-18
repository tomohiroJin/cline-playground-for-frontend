/**
 * 始祖トーテム選択画面
 * ラン開始時に戦い方の軸（横軸）とカーブ（縦軸）を決める。
 */
import React from 'react';
import type { SaveData, SfxType, TotemId, PowerCurve } from '../types';
import type { GameAction } from '../hooks';
import { TOTEMS } from '../constants';
import { Screen, SubTitle, Divider, GameButton } from '../styles';

/** カーブの表示ラベル */
const CURVE_LABEL: Readonly<Record<PowerCurve, string>> = {
  front: '⚡ 即効',
  scaling: '🌱 晩成',
  combo: '🔗 コンボ',
  wild: '🃏 ワイルド',
};

interface Props {
  save: SaveData;
  pendingStart: { di: number; loopOverride: number; challengeId?: string };
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

export const TotemSelectScreen: React.FC<Props> = ({ save, pendingStart, dispatch, playSfx }) => {
  // save.clears >= t.unlock の条件で解放済みトーテムをフィルタ（Phase 1 は unlock=0 のため常に3種）
  const available = TOTEMS.filter(t => save.clears >= t.unlock);

  const handlePick = (totemId: TotemId): void => {
    playSfx('click');
    if (pendingStart.challengeId) {
      dispatch({ type: 'START_CHALLENGE', challengeId: pendingStart.challengeId, di: pendingStart.di, totemId });
    } else {
      dispatch({ type: 'START_RUN', di: pendingStart.di, loopOverride: pendingStart.loopOverride, totemId });
    }
  };

  return (
    <Screen>
      <div style={{ fontSize: 22, marginTop: 8 }}>🗿</div>
      <SubTitle>始祖トーテムを選べ</SubTitle>
      <div style={{ color: '#908070', fontSize: 11, margin: '2px 0' }}>
        このランの戦い方の軸とテンポが決まる
      </div>
      <Divider />
      {available.map(t => (
        <GameButton
          key={t.id}
          style={{ width: '94%', textAlign: 'left', padding: '10px 14px' }}
          onClick={() => handlePick(t.id)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#f0c040', fontSize: 13 }}>{t.ic} {t.nm}</span>
            <span style={{ fontSize: 11, color: '#988070' }}>{CURVE_LABEL[t.curve]}</span>
          </div>
          <div style={{ color: '#988070', fontSize: 12, marginTop: 2 }}>{t.desc}</div>
        </GameButton>
      ))}
      <GameButton style={{ marginTop: 10 }} onClick={() => { playSfx('click'); dispatch({ type: 'GO_DIFF' }); }}>
        ◀ もどる
      </GameButton>
    </Screen>
  );
};
