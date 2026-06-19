/**
 * キーストーン選択画面（バイオーム踏破後の節目3択）
 * 「ルールを変える」キーストーンを1つ選ぶ。
 */
import React from 'react';
import type { SfxType, KeystoneDef, KeystoneId, PowerCurve } from '../types';
import type { GameAction } from '../hooks';
import { Screen, SubTitle, Divider, GameButton } from '../styles';

/** カーブの表示ラベル */
const CURVE_LABEL: Readonly<Record<PowerCurve, string>> = {
  front: '⚡ 即効',
  scaling: '🌱 晩成',
  combo: '🔗 コンボ',
  wild: '🃏 ワイルド',
};

interface Props {
  picks: KeystoneDef[];
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

export const KeystoneScreen: React.FC<Props> = ({ picks, dispatch, playSfx }) => {
  const handlePick = (id: KeystoneId): void => {
    playSfx('click');
    dispatch({ type: 'SELECT_KEYSTONE', id });
  };

  return (
    <Screen>
      <div style={{ fontSize: 22, marginTop: 8 }}>💠</div>
      <SubTitle>キーストーンを選べ</SubTitle>
      <div style={{ color: '#908070', fontSize: 11, margin: '2px 0' }}>
        ルールを変える一手を1つ獲得する
      </div>
      <Divider />
      {picks.map(k => (
        <GameButton
          key={k.id}
          style={{ width: '94%', textAlign: 'left', padding: '10px 14px' }}
          onClick={() => handlePick(k.id)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#f0c040', fontSize: 13 }}>{k.ic} {k.nm}</span>
            <span style={{ fontSize: 11, color: '#988070' }}>{CURVE_LABEL[k.curve]}</span>
          </div>
          <div style={{ color: '#988070', fontSize: 12, marginTop: 2 }}>{k.desc}</div>
        </GameButton>
      ))}
    </Screen>
  );
};
