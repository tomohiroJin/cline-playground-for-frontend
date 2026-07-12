import React from 'react';
import { ControlsContainer, ControlBtn } from '../presentation/styles/game.styles';

interface ControlsProps {
  keysRef: React.RefObject<Record<string, boolean>>;
  hiding: boolean;
  energy: number;
  stamina: number;
  /** スプリント中か（走るボタンの点灯表示に使う） */
  sprinting: boolean;
  /** 加速チャージの所持数（ボタンのラベル・活性表示に使う） */
  speedCharges: number;
  /** 加速効果中か（ボタン点灯表示に使う） */
  boostActive: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  keysRef,
  hiding,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  energy,
  stamina,
  sprinting,
  speedCharges,
  boostActive,
}) => (
  <ControlsContainer>
    <ControlBtn
      $variant="dpad"
      onPointerDown={e => {
        e.preventDefault();
        keysRef.current['turnleft'] = true;
      }}
      onPointerUp={e => {
        e.preventDefault();
        keysRef.current['turnleft'] = false;
      }}
      onPointerLeave={e => {
        e.preventDefault();
        keysRef.current['turnleft'] = false;
      }}
    >
      ◀
    </ControlBtn>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <ControlBtn
        $variant="dpad"
        onPointerDown={e => {
          e.preventDefault();
          keysRef.current['w'] = true;
        }}
        onPointerUp={e => {
          e.preventDefault();
          keysRef.current['w'] = false;
        }}
        onPointerLeave={e => {
          e.preventDefault();
          keysRef.current['w'] = false;
        }}
      >
        ▲
      </ControlBtn>
      <ControlBtn
        $variant="dpad"
        onPointerDown={e => {
          e.preventDefault();
          keysRef.current['s'] = true;
        }}
        onPointerUp={e => {
          e.preventDefault();
          keysRef.current['s'] = false;
        }}
        onPointerLeave={e => {
          e.preventDefault();
          keysRef.current['s'] = false;
        }}
      >
        ▼
      </ControlBtn>
    </div>
    <ControlBtn
      $variant="dpad"
      onPointerDown={e => {
        e.preventDefault();
        keysRef.current['turnright'] = true;
      }}
      onPointerUp={e => {
        e.preventDefault();
        keysRef.current['turnright'] = false;
      }}
      onPointerLeave={e => {
        e.preventDefault();
        keysRef.current['turnright'] = false;
      }}
    >
      ▶
    </ControlBtn>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '2rem' }}>
      <ControlBtn
        $variant="shift"
        onPointerDown={e => {
          e.preventDefault();
          keysRef.current['shift'] = true;
        }}
        onPointerUp={e => {
          e.preventDefault();
          keysRef.current['shift'] = false;
        }}
        onPointerLeave={e => {
          e.preventDefault();
          keysRef.current['shift'] = false;
        }}
        style={{
          backgroundColor: sprinting ? '#16a34a' : stamina > 10 ? 'rgba(21, 128, 61, 0.9)' : undefined,
          boxShadow: sprinting ? '0 0 12px #4ade80' : undefined,
        }}
      >
        {sprinting ? '💨 走行中!' : '🏃 走る'}
      </ControlBtn>
      <ControlBtn
        $variant="action"
        onPointerDown={e => {
          e.preventDefault();
          keysRef.current[' '] = true;
        }}
        onPointerUp={e => {
          e.preventDefault();
          keysRef.current[' '] = false;
        }}
        onPointerLeave={e => {
          e.preventDefault();
          keysRef.current[' '] = false;
        }}
        style={{ backgroundColor: hiding ? '#1d4ed8' : undefined }}
      >
        <div style={{ fontSize: '1.25rem' }}>{hiding ? '🙈' : '👁️'}</div>
        <div style={{ fontSize: '0.75rem' }}>{hiding ? '隠れ中' : '隠れる'}</div>
      </ControlBtn>
      <ControlBtn
        $variant="action"
        onPointerDown={e => {
          e.preventDefault();
          keysRef.current['e'] = true;
        }}
        onPointerUp={e => {
          e.preventDefault();
          keysRef.current['e'] = false;
        }}
        onPointerLeave={e => {
          e.preventDefault();
          keysRef.current['e'] = false;
        }}
        style={{
          backgroundColor: boostActive ? '#b45309' : speedCharges > 0 ? 'rgba(180, 83, 9, 0.9)' : undefined,
          boxShadow: boostActive ? '0 0 12px #fbbf24' : undefined,
        }}
      >
        <div style={{ fontSize: '1.25rem' }}>⚡</div>
        <div style={{ fontSize: '0.75rem' }}>{boostActive ? '加速中!' : `加速 x${speedCharges}`}</div>
      </ControlBtn>
    </div>
  </ControlsContainer>
);
