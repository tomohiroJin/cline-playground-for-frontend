import React from 'react';
import { AudioSettings } from '../core/audio-settings';
import { ModeButton, MenuButton } from '../styles';

type SettingsPanelProps = {
  bgmEnabled: boolean;
  onToggleBgm: () => void;
  audioSettings: AudioSettings;
  onAudioSettingsChange: (settings: AudioSettings) => void;
  onClose: () => void;
};

// オーバーレイ + モーダル形式の設定パネル
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  bgmEnabled,
  onToggleBgm,
  audioSettings,
  onAudioSettingsChange,
  onClose,
}) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  }}>
    <div style={{
      background: 'rgba(20, 25, 35, 0.95)',
      borderRadius: '16px',
      border: '1px solid rgba(0, 210, 255, 0.3)',
      padding: '32px',
      maxWidth: '380px',
      width: '90%',
    }}>
      <h2 style={{
        color: 'var(--accent-color)',
        textAlign: 'center',
        marginBottom: '24px',
        fontSize: '1.4rem',
      }}>
        Settings
      </h2>

      {/* BGM ON/OFF */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '8px', fontWeight: 600 }}>BGM</p>
        <ModeButton onClick={onToggleBgm} $selected={bgmEnabled}>
          {bgmEnabled ? 'ON' : 'OFF'}
        </ModeButton>
      </div>

      {/* BGM 音量 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#aaa', fontSize: '0.8rem', width: '40px' }}>BGM</span>
          <input
            type="range"
            min={0}
            max={100}
            value={audioSettings.bgmVolume}
            onChange={e => onAudioSettingsChange({ ...audioSettings, bgmVolume: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ color: '#aaa', fontSize: '0.8rem', width: '30px', textAlign: 'right' }}>{audioSettings.bgmVolume}</span>
        </div>
      </div>

      {/* SE 音量 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#aaa', fontSize: '0.8rem', width: '40px' }}>SE</span>
          <input
            type="range"
            min={0}
            max={100}
            value={audioSettings.seVolume}
            onChange={e => onAudioSettingsChange({ ...audioSettings, seVolume: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ color: '#aaa', fontSize: '0.8rem', width: '30px', textAlign: 'right' }}>{audioSettings.seVolume}</span>
        </div>
      </div>

      {/* MUTE */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <ModeButton
          onClick={() => onAudioSettingsChange({ ...audioSettings, muted: !audioSettings.muted })}
          $selected={audioSettings.muted}
        >
          {audioSettings.muted ? 'MUTED' : 'MUTE'}
        </ModeButton>
      </div>

      {/* 閉じる */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <MenuButton onClick={onClose}>Close</MenuButton>
      </div>
    </div>
  </div>
);
