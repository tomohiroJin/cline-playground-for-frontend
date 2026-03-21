import React from 'react';
import { ControlsContainer, ControlBtn } from '../presentation/styles/game.styles';

interface ControlsProps {
  keysRef: React.RefObject<Record<string, boolean>>;
  hiding: boolean;
  energy: number;
  stamina: number;
}

export const Controls: React.FC<ControlsProps> = ({
  keysRef,
  hiding,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  energy,
  stamina,
}) => (
  <ControlsContainer>
    <ControlBtn
      $variant="dpad"
      onPointerDown={e => {
        e.preventDefault();
        keysRef.current['a'] = true;
      }}
      onPointerUp={e => {
        e.preventDefault();
        keysRef.current['a'] = false;
      }}
      onPointerLeave={e => {
        e.preventDefault();
        keysRef.current['a'] = false;
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
        keysRef.current['d'] = true;
      }}
      onPointerUp={e => {
        e.preventDefault();
        keysRef.current['d'] = false;
      }}
      onPointerLeave={e => {
        e.preventDefault();
        keysRef.current['d'] = false;
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
        style={{ backgroundColor: stamina > 10 ? 'rgba(21, 128, 61, 0.9)' : undefined }}
      >
        🏃 走る
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
    </div>
  </ControlsContainer>
);
