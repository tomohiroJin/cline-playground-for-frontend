/**
 * 速度コントロールコンポーネント
 * バトル速度の切り替えボタン群
 */
import React from 'react';
import type { GameAction } from '../../hooks';
import { SPEED_OPTS } from '../../constants';
import { SpeedBtn } from '../../styles';

export interface SpeedControlProps {
  battleSpd: number;
  dispatch: React.Dispatch<GameAction>;
}

export const SpeedControl: React.FC<SpeedControlProps> = ({ battleSpd, dispatch }) => (
  <>
    <span style={{ fontSize: 8, color: '#403828' }}>速度</span>
    {SPEED_OPTS.map(([label, spd]) => (
      <SpeedBtn key={spd} $active={battleSpd === spd}
        onClick={() => dispatch({ type: 'CHANGE_SPEED', speed: spd })}>
        {label}
      </SpeedBtn>
    ))}
    <SpeedBtn $active={battleSpd === 0}
      onClick={() => dispatch({ type: 'CHANGE_SPEED', speed: 0 })}>
      ⏸
    </SpeedBtn>
  </>
);
