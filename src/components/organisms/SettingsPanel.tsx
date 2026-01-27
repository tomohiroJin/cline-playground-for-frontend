import React, { useState } from 'react';
import styled from 'styled-components';
import {
  GameSettings,
  loadSettings,
  saveSettings,
  ControlScheme,
} from '../../utils/settings-storage';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Panel = styled.div`
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  color: var(--text-primary);
`;

const Title = styled.h2`
  margin: 0 0 20px;
  font-size: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: var(--text-primary);
  }
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Label = styled.label`
  font-size: 0.9rem;
`;

const Slider = styled.input`
  width: 60%;
  accent-color: var(--accent-color);
`;

const Select = styled.select`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
`;

const ToggleSwitch = styled.button<{ $isOn: boolean }>`
  width: 48px;
  height: 24px;
  background: ${props => (props.$isOn ? 'var(--accent-color)' : '#4b5563')};
  border-radius: 12px;
  position: relative;
  border: none;
  cursor: pointer;
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => (props.$isOn ? '26px' : '2px')};
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: left 0.2s;
  }
`;

interface SettingsPanelProps {
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<GameSettings>(loadSettings());

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <Overlay onClick={onClose}>
      <Panel onClick={e => e.stopPropagation()}>
        <Title>
          設定
          <CloseButton onClick={onClose} aria-label="閉じる">
            ×
          </CloseButton>
        </Title>

        <Section>
          <SectionTitle>オーディオ</SectionTitle>
          <Row>
            <Label>マスター音量 ({settings.masterVolume}%)</Label>
            <Slider
              type="range"
              min="0"
              max="100"
              value={settings.masterVolume}
              onChange={e => updateSetting('masterVolume', Number(e.target.value))}
            />
          </Row>
          <Row>
            <Label>効果音 (SFX)</Label>
            <Slider
              type="range"
              min="0"
              max="100"
              value={settings.sfxVolume}
              onChange={e => updateSetting('sfxVolume', Number(e.target.value))}
            />
          </Row>
          <Row>
            <Label>BGM</Label>
            <Slider
              type="range"
              min="0"
              max="100"
              value={settings.bgmVolume}
              onChange={e => updateSetting('bgmVolume', Number(e.target.value))}
            />
          </Row>
        </Section>

        <Section>
          <SectionTitle>ゲームプレイ</SectionTitle>
          <Row>
            <Label>操作方法</Label>
            <Select
              value={settings.controls}
              onChange={e => updateSetting('controls', e.target.value as ControlScheme)}
            >
              <option value="keyboard">キーボード</option>
              <option value="mouse">マウス</option>
              <option value="touch">タッチ</option>
            </Select>
          </Row>
        </Section>

        <Section>
          <SectionTitle>表示・アクセシビリティ</SectionTitle>
          <Row>
            <Label>FPSを表示</Label>
            <ToggleSwitch
              $isOn={settings.showFps}
              onClick={() => updateSetting('showFps', !settings.showFps)}
              aria-label="FPS表示切り替え"
            />
          </Row>
          <Row>
            <Label>アニメーションを減らす</Label>
            <ToggleSwitch
              $isOn={settings.reducedMotion}
              onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
              aria-label="アニメーション軽減切り替え"
            />
          </Row>
        </Section>
      </Panel>
    </Overlay>
  );
};
