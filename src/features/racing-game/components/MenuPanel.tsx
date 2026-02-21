// メニューUI コンポーネント

import React from 'react';
import {
  ControlGroup,
  Label,
  Button,
  Overlay,
  ResultTitle,
  ActionButton,
  Btn,
  ColorBtn,
} from '../../../pages/RacingGamePage.styles';
import { Colors, Options, Courses } from '../constants';

export interface MenuPanelProps {
  mode: string;
  setMode: (m: string) => void;
  course: number;
  setCourse: (c: number) => void;
  speed: number;
  setSpeed: (s: number) => void;
  cpu: number;
  setCpu: (c: number) => void;
  laps: number;
  setLaps: (l: number) => void;
  c1: number;
  setC1: (c: number) => void;
  c2: number;
  setC2: (c: number) => void;
  cardsEnabled: boolean;
  setCardsEnabled: (e: boolean) => void;
  onStart: () => void;
}

export const MenuPanel: React.FC<MenuPanelProps> = ({
  mode, setMode, course, setCourse, speed, setSpeed,
  cpu, setCpu, laps, setLaps, c1, setC1, c2, setC2,
  cardsEnabled, setCardsEnabled, onStart,
}) => (
  <Overlay>
    <ResultTitle style={{ marginBottom: '0.5rem', color: '#fbbf24', fontSize: '1.5rem' }}>
      🏎️ レースゲーム
    </ResultTitle>

    <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
      <Label style={{ fontSize: '0.8rem' }}>Mode</Label>
      <Btn $sel={mode === 'solo'} onClick={() => setMode('solo')} $color="#3b82f6">
        🏃ソロ
      </Btn>
      <Btn $sel={mode === '2p'} onClick={() => setMode('2p')} $color="#10b981">
        👫2人
      </Btn>
      <Btn $sel={mode === 'cpu'} onClick={() => setMode('cpu')} $color="#a855f7">
        🤖CPU
      </Btn>
    </ControlGroup>

    {mode === 'cpu' && (
      <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
        <Label style={{ fontSize: '0.8rem' }}>CPU Level</Label>
        {Options.cpu.map((c, i) => (
          <Btn key={i} $sel={cpu === i} onClick={() => setCpu(i)} $color="#f97316">
            {c.label.split(' ')[0]}
          </Btn>
        ))}
      </ControlGroup>
    )}

    <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
      <Label style={{ fontSize: '0.8rem' }}>P1 Color</Label>
      <div style={{ display: 'flex', gap: '4px' }}>
        {Colors.car.map((c, i) => (
          <ColorBtn
            key={i}
            $color={c}
            $sel={c1 === i}
            onClick={() => setC1(i)}
            label={`P1 Color ${i + 1}`}
          />
        ))}
      </div>
    </ControlGroup>

    {mode !== 'solo' && (
      <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
        <Label style={{ fontSize: '0.8rem' }}>{mode === 'cpu' ? 'CPU' : 'P2'} Color</Label>
        <div style={{ display: 'flex', gap: '4px' }}>
          {Colors.car.map((c, i) => (
            <ColorBtn
              key={i}
              $color={c}
              $sel={c2 === i}
              onClick={() => setC2(i)}
              label={`P2 Color ${i + 1}`}
            />
          ))}
        </div>
      </ControlGroup>
    )}

    <ControlGroup
      style={{
        padding: '0.25rem 0.5rem',
        maxWidth: '800px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      <Label style={{ fontSize: '0.8rem' }}>Course</Label>
      {Courses.map((c, i) => (
        <Button
          key={i}
          $active={course === i}
          onClick={() => setCourse(i)}
          $color="#eab308"
          style={{
            color: '#000',
            marginRight: '2px',
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
          }}
        >
          {c.name}
        </Button>
      ))}
    </ControlGroup>

    <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
      <Label style={{ fontSize: '0.8rem' }}>Speed</Label>
      {Options.speed.map((s, i) => (
        <Btn key={i} $sel={speed === i} onClick={() => setSpeed(i)} $color="#3b82f6">
          {s.label.split(' ')[0]}
        </Btn>
      ))}
    </ControlGroup>

    <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
      <Label style={{ fontSize: '0.8rem' }}>Laps</Label>
      {Options.laps.map(l => (
        <Btn key={l} $sel={laps === l} onClick={() => setLaps(l)} $color="#ec4899">
          {l}周
        </Btn>
      ))}
    </ControlGroup>

    {mode !== 'solo' && (
      <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
        <Label style={{ fontSize: '0.8rem' }}>Cards</Label>
        <Btn
          $sel={cardsEnabled}
          onClick={() => setCardsEnabled(true)}
          $color="#10b981"
        >
          ON
        </Btn>
        <Btn
          $sel={!cardsEnabled}
          onClick={() => setCardsEnabled(false)}
          $color="#ef4444"
        >
          OFF
        </Btn>
      </ControlGroup>
    )}

    <ActionButton
      onClick={onStart}
      style={{
        marginTop: '1rem',
        padding: '0.5rem 2rem',
        background: 'linear-gradient(to right, #4ade80, #facc15)',
        color: '#000',
        fontSize: '1rem',
      }}
    >
      🏁 スタート!
    </ActionButton>
  </Overlay>
);
