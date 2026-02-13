// Racing Game 音量調節UIコンポーネント

import React, { memo } from 'react';
import { SoundEngine } from '../audio';
import { ControlGroup, Button } from '../../../pages/RacingGamePage.styles';

export const VolumeCtrl = memo(function VolumeCtrl({
  vol,
  setVol,
  muted,
  setMuted,
}: {
  vol: number;
  setVol: (v: number) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
}) {
  return (
    <ControlGroup>
      <Button onClick={() => setMuted(SoundEngine.toggleMute())}>
        {muted ? '🔇' : vol > 0.5 ? '🔊' : vol > 0 ? '🔉' : '🔈'}
      </Button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={muted ? 0 : vol}
        onChange={e => {
          const v = +e.target.value;
          setVol(v);
          SoundEngine.setVolume(v);
        }}
        style={{
          width: '80px',
          height: '4px',
          background: '#666',
          borderRadius: '4px',
          cursor: 'pointer',
          appearance: 'none',
          outline: 'none',
        }}
        disabled={muted}
      />
    </ControlGroup>
  );
});
