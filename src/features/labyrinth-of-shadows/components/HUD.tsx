import React from 'react';
import type { HUDData } from '../types';
import { formatTime } from '../utils';
import {
  HUDContainer,
  HUDGroup,
  HUDPanel,
  BarContainer,
  BarFill,
} from '../../../pages/MazeHorrorPage.styles';

interface HUDProps {
  h: HUDData;
}

export const HUD: React.FC<HUDProps> = ({ h }) => (
  <HUDContainer>
    <HUDGroup>
      <HUDPanel $borderColor="#b45309">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🔑</span>
          <div>
            <div style={{ color: '#facc15', fontWeight: 'bold' }}>
              {h.keys} / {h.req}
            </div>
            <div style={{ color: '#fde047', opacity: 0.5, fontSize: '0.75rem' }}>鍵を集めろ</div>
          </div>
        </div>
      </HUDPanel>
      <HUDPanel $borderColor="#b91c1c">
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {Array.from({ length: h.maxL }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: '1.25rem',
                opacity: i < h.lives ? 1 : 0.3,
                filter: i < h.lives ? 'none' : 'grayscale(100%)',
              }}
            >
              {i < h.lives ? '❤️' : '🖤'}
            </span>
          ))}
        </div>
      </HUDPanel>
      <HUDPanel $borderColor="#15803d">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem' }}>🏃</span>
          <BarContainer>
            <BarFill $percent={h.stamina} $color={h.stamina > 30 ? '#22c55e' : '#f97316'} />
          </BarContainer>
        </div>
      </HUDPanel>
    </HUDGroup>

    <HUDGroup $align="right">
      <HUDPanel $animate={h.time <= 30} $borderColor={h.time <= 30 ? '#ef4444' : undefined}>
        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.125rem' }}>残り時間</div>
        <div
          style={{
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            color: h.time <= 30 ? '#f87171' : h.time <= 60 ? '#facc15' : 'white',
          }}
        >
          {formatTime(h.time)}
        </div>
      </HUDPanel>
      <HUDPanel
        $bg={h.hide ? 'rgba(30, 58, 138, 0.4)' : undefined}
        $borderColor={h.hide ? '#60a5fa' : undefined}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}
        >
          <span style={{ fontSize: '1.125rem' }}>{h.hide ? '🙈' : '👁️'}</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
            {h.hide ? '隠れ中' : '隠れゲージ'}
          </span>
        </div>
        <div
          style={{
            width: '5rem',
            height: '0.625rem',
            backgroundColor: '#1f2937',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <BarFill $percent={h.energy} $color={h.energy > 30 ? '#3b82f6' : '#ef4444'} />
        </div>
      </HUDPanel>
      {h.eNear > 0.2 && (
        <HUDPanel $bg="rgba(127, 29, 29, 0.9)" $borderColor="#ef4444" $animate>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <div style={{ color: '#fca5a5', fontSize: '0.75rem', fontWeight: 'bold' }}>
                敵が近い！
              </div>
              <div
                style={{
                  width: '3.5rem',
                  height: '0.5rem',
                  backgroundColor: '#1f2937',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}
              >
                <BarFill $percent={h.eNear * 100} $color="#ef4444" />
              </div>
            </div>
          </div>
        </HUDPanel>
      )}
      <HUDPanel>
        <div style={{ color: '#facc15', fontSize: '0.875rem', fontWeight: 'bold' }}>
          SCORE: {h.score.toLocaleString()}
        </div>
        <div style={{ color: '#fbbf24', fontSize: '0.7rem', opacity: 0.8 }}>
          HI: {h.highScore.toLocaleString()}
        </div>
      </HUDPanel>
    </HUDGroup>
  </HUDContainer>
);
