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
  /**
   * 表示する音量チャンネル（既定: master/bgm/se の全 3 種）。
   * 実際に音声へ反映されないチャンネルを隠したい呼び出し側が絞り込む。
   * 例: campaign は master のみ制御可能なため `['master']` を渡す。
   */
  readonly visibleVolumeChannels?: readonly (keyof VolumeSettings)[];
}

/** 音量チャンネルの表示メタ情報（ラベル・aria・要素 id） */
const VOLUME_CHANNELS: ReadonlyArray<{
  readonly key: keyof VolumeSettings;
  readonly label: string;
  readonly id: string;
  readonly ariaLabel: string;
}> = [
  { key: 'master', label: 'MASTER', id: 'vol-master', ariaLabel: 'マスター音量' },
  { key: 'bgm', label: 'BGM', id: 'vol-bgm', ariaLabel: 'BGM 音量' },
  { key: 'se', label: 'SE', id: 'vol-se', ariaLabel: 'SE 音量' },
];

const ALL_VOLUME_CHANNEL_KEYS = VOLUME_CHANNELS.map((c) => c.key);

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const toPercent = (v: number): string => `${Math.round(clamp01(v) * 100)}`;

/**
 * スライダー値（0..100 の文字列）を 0..1 の音量に変換する。
 * 非数値・空文字は 0 にフォールバックし、gain に NaN が渡るのを防ぐ（堅牢化）。
 */
export const parseVolumePercent = (raw: string): number => {
  const parsed = Number(raw);
  return clamp01(Number.isFinite(parsed) ? parsed / 100 : 0);
};

export const OptionsModal: React.FC<OptionsModalProps> = ({
  canReplayEnding,
  onReplayEnding,
  onResetProgress,
  onClose,
  volume,
  onVolumeChange,
  visibleVolumeChannels = ALL_VOLUME_CHANNEL_KEYS,
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
    onVolumeChange({ ...volume, [key]: parseVolumePercent(raw) });
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
                {VOLUME_CHANNELS.filter((ch) => visibleVolumeChannels.includes(ch.key)).map((ch) => (
                  <VolumeRow key={ch.key}>
                    <label htmlFor={ch.id}>{ch.label}</label>
                    <Slider
                      id={ch.id}
                      aria-label={ch.ariaLabel}
                      min={0}
                      max={100}
                      value={toPercent(volume[ch.key])}
                      onChange={(e) => updateVolume(ch.key, e.target.value)}
                    />
                    <span>{toPercent(volume[ch.key])}</span>
                  </VolumeRow>
                ))}
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
