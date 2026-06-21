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

/**
 * カーブの色彩心理マッピング。
 * 「即効=赤(緊迫感)・晩成=緑(成長)・コンボ=青(連携)・ワイルド=白系(中立)」で
 * ビルド軸を直感的に識別させる。背景 #12121e に対し WCAG AA（4.5:1）準拠。
 * 採用コントラスト比: 赤6.69 / 緑10.97 / 青9.70 / 白系14.15
 */
const CURVE_COLOR: Readonly<Record<PowerCurve, string>> = {
  front: '#ff6b6b',   // 即効=赤（緊迫感・速攻）
  scaling: '#50e090', // 晩成=緑（成長・積み上げ）
  combo: '#5cc8f0',   // コンボ=青（連携・シナジー）
  wild: '#e8e0d0',    // ワイルド=白系（中立・予測不能）
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
            {/* カーブ軸をチップ化してビルド軸を発見しやすくする（色=色彩心理、背景+枠で視認性強化） */}
            <span style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: CURVE_COLOR[t.curve],
              background: CURVE_COLOR[t.curve] + '1f',
              border: `1px solid ${CURVE_COLOR[t.curve]}55`,
              borderRadius: 4,
              padding: '1px 6px',
            }}>{CURVE_LABEL[t.curve]}</span>
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
