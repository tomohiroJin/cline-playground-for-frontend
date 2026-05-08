// OPTIONS モーダル（spec §6.2.6）
//
// 機能: 音量設定 / REPLAY ENDING / RESET PROGRESS / CLOSE
// RESET は二重確認モーダルで保護。

import React, { useState } from 'react';
import styled from 'styled-components';
import { Overlay, Panel, LargeTitle, PrimaryButton, DangerButton, TOKENS } from './campaign-styles';

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
`;

const ConfirmText = styled.p`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 14px;
  color: ${TOKENS.accentDanger};
  margin: 0 0 16px;
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const VolumeRow = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 36px;
  align-items: center;
  gap: 8px;
  font-family: ${TOKENS.fontEnPixel};
  font-size: 12px;
  color: ${TOKENS.textPrimary};
`;

const Slider = styled.input.attrs({ type: 'range' })`
  width: 100%;
  accent-color: ${TOKENS.accentGold};
`;

const VolumeGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0 16px;
  padding: 12px;
  border: 1px solid ${TOKENS.textSecondary};
`;

export interface VolumeSettings {
  readonly master: number;
  readonly bgm: number;
  readonly se: number;
}

export const DEFAULT_VOLUME_SETTINGS: VolumeSettings = {
  master: 0.8,
  bgm: 0.7,
  se: 0.7,
};

export interface OptionsModalProps {
  /** REPLAY ENDING ボタンを有効にするか（completed=true のとき true） */
  readonly canReplayEnding: boolean;
  readonly onReplayEnding: () => void;
  readonly onResetProgress: () => void;
  readonly onClose: () => void;
  /** 音量設定（任意。未指定なら音量 UI を出さない） */
  readonly volume?: VolumeSettings;
  readonly onVolumeChange?: (next: VolumeSettings) => void;
}

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const toPercent = (v: number): string => `${Math.round(clamp01(v) * 100)}`;

export const OptionsModal: React.FC<OptionsModalProps> = ({
  canReplayEnding,
  onReplayEnding,
  onResetProgress,
  onClose,
  volume,
  onVolumeChange,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleResetClick = () => setConfirmReset(true);
  const handleResetConfirm = () => {
    onResetProgress();
    setConfirmReset(false);
  };
  const handleResetCancel = () => setConfirmReset(false);

  const updateVolume = (key: keyof VolumeSettings, raw: string) => {
    if (!volume || !onVolumeChange) return;
    const value = clamp01(Number(raw) / 100);
    onVolumeChange({ ...volume, [key]: value });
  };

  return (
    <Overlay role="dialog" aria-label="OPTIONS">
      <Panel>
        <LargeTitle>OPTIONS</LargeTitle>
        {confirmReset ? (
          <>
            <ConfirmText>DELETE ALL RECORDS?</ConfirmText>
            <Row>
              <DangerButton onClick={handleResetConfirm} autoFocus>Y (DELETE)</DangerButton>
              <PrimaryButton onClick={handleResetCancel}>N (CANCEL)</PrimaryButton>
            </Row>
          </>
        ) : (
          <>
            {volume && onVolumeChange && (
              <VolumeGroup>
                <VolumeRow>
                  <label htmlFor="vol-master">MASTER</label>
                  <Slider
                    id="vol-master"
                    aria-label="マスター音量"
                    min={0}
                    max={100}
                    value={toPercent(volume.master)}
                    onChange={(e) => updateVolume('master', e.target.value)}
                  />
                  <span>{toPercent(volume.master)}</span>
                </VolumeRow>
                <VolumeRow>
                  <label htmlFor="vol-bgm">BGM</label>
                  <Slider
                    id="vol-bgm"
                    aria-label="BGM 音量"
                    min={0}
                    max={100}
                    value={toPercent(volume.bgm)}
                    onChange={(e) => updateVolume('bgm', e.target.value)}
                  />
                  <span>{toPercent(volume.bgm)}</span>
                </VolumeRow>
                <VolumeRow>
                  <label htmlFor="vol-se">SE</label>
                  <Slider
                    id="vol-se"
                    aria-label="SE 音量"
                    min={0}
                    max={100}
                    value={toPercent(volume.se)}
                    onChange={(e) => updateVolume('se', e.target.value)}
                  />
                  <span>{toPercent(volume.se)}</span>
                </VolumeRow>
              </VolumeGroup>
            )}
            <Stack>
              <PrimaryButton
                onClick={onReplayEnding}
                disabled={!canReplayEnding}
                aria-label="REPLAY ENDING"
              >
                ▶ REPLAY ENDING
              </PrimaryButton>
              <DangerButton onClick={handleResetClick} aria-label="RESET PROGRESS">
                ⚠ RESET PROGRESS
              </DangerButton>
            </Stack>
            <PrimaryButton onClick={onClose}>CLOSE</PrimaryButton>
          </>
        )}
      </Panel>
    </Overlay>
  );
};
