/**
 * 灰燼の城壁 - シード欄（反復7 段階1・反復1 から持ち越した minor 5回目）
 *
 * 旧版は構築画面へ戻るとシード欄に**構築時に入力した古い値**が残っていた。
 * 「同じデッキで別のシードに挑む」で実際に使ったシードではなく、しかも
 * そのまま始めると同一盤面になる（判定者が2度踏んだ事故）。
 * **欄は常に空で始め、前回のシードは明示操作でだけ入れる。**
 */
import React from 'react';
import styled from 'styled-components';
import { COLORS } from './theme';

export const SEED_LABEL = 'シード（空欄なら毎回ランダム）';
export const USE_LAST_SEED_LABEL = '前回のシードを使う';

const Field = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const UseLastButton = styled.button`
  min-height: 44px;
  padding: 0 12px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
`;

export const SeedField: React.FC<{ value: string; onChange: (text: string) => void; lastSeed?: number }> = ({
  value,
  onChange,
  lastSeed,
}) => (
  <Field>
    <label htmlFor="ashen-rampart-seed">{SEED_LABEL}</label>
    <input id="ashen-rampart-seed" value={value} inputMode="numeric" onChange={(e) => onChange(e.target.value)} />
    {lastSeed !== undefined && (
      <>
        <span>前回のシード: {lastSeed}</span>
        <UseLastButton type="button" onClick={() => onChange(String(lastSeed))}>
          {USE_LAST_SEED_LABEL}
        </UseLastButton>
      </>
    )}
  </Field>
);
