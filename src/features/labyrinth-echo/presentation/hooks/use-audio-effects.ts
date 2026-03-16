/**
 * 迷宮の残響 - useAudioEffects フック
 *
 * ChoiceFeedback に応じた効果音再生と、
 * フェーズ変更時の BGM 制御を担当する副作用フック。
 */
import { useEffect, useRef } from 'react';
import type { StatusEffectId } from '../../domain/models/player';
import type { UIPhase } from './use-game-orchestrator';

/** ChoiceFeedback（選択処理の結果、音声・UI 反映用） */
export interface ChoiceFeedback {
  readonly impact: string | null;
  readonly statChanges: { readonly hp: number; readonly mn: number; readonly inf: number };
  readonly drain: { readonly hp: number; readonly mn: number } | null;
  readonly statusAdded: StatusEffectId | null;
  readonly statusRemoved: StatusEffectId | null;
  readonly secondLifeActivated: boolean;
  readonly chainTriggered: boolean;
  readonly resultText: string;
}

/** AudioEngine のインターフェース（テスト時にモック可能） */
export interface AudioEngineInterface {
  init: () => void;
  resume: () => void;
  sfx: Record<string, (...args: never[]) => void>;
  bgm: {
    startFloorBgm: (floor: number) => void;
    stopBgm: () => void;
    setEventMood: (mood: string) => void;
    updateCrisis: (hpRatio: number, mnRatio: number) => void;
    setBgmVolume: (vol: number) => void;
  };
}

/** useAudioEffects の入力パラメータ */
export interface AudioEffectsParams {
  readonly phase: UIPhase;
  readonly floor: number;
  readonly event: { readonly tp: string } | null;
  readonly player: { readonly hp: number; readonly maxHp: number; readonly mn: number; readonly maxMn: number } | null;
  readonly feedback: ChoiceFeedback | null;
  readonly sfxEnabled: boolean;
  readonly bgmEnabled: boolean;
  readonly bgmVolume: number;
  readonly audioEngine: AudioEngineInterface;
}

/** BGM を停止すべきフェーズ */
const BGM_STOP_PHASES: readonly UIPhase[] = [
  'title', 'gameover', 'victory', 'titles', 'unlocks', 'settings', 'records',
];

/** BGM 制御（フェーズ変更時） */
const useBgmControl = (params: AudioEffectsParams): void => {
  const { phase, floor, event, bgmEnabled, bgmVolume, audioEngine } = params;

  useEffect(() => {
    if (!bgmEnabled) {
      audioEngine.bgm.stopBgm();
      return;
    }
    audioEngine.bgm.setBgmVolume(bgmVolume);
    if (BGM_STOP_PHASES.includes(phase)) {
      audioEngine.bgm.stopBgm();
    } else if (phase === 'floor_intro') {
      audioEngine.bgm.startFloorBgm(floor);
      audioEngine.bgm.setEventMood('exploration');
    } else if (phase === 'event' && event) {
      audioEngine.bgm.setEventMood(event.tp);
    } else if (phase === 'result') {
      audioEngine.bgm.setEventMood('exploration');
    }
  }, [phase, floor, bgmEnabled, bgmVolume, event, audioEngine]);
};

/** 危機状態の音響更新 */
const useCrisisUpdate = (params: AudioEffectsParams): void => {
  const { phase, player, bgmEnabled, audioEngine } = params;

  useEffect(() => {
    if (!bgmEnabled || !player) return;
    if (phase === 'title' || phase === 'gameover' || phase === 'victory') return;
    const hpPct = player.hp / player.maxHp;
    const mnPct = player.mn / player.maxMn;
    audioEngine.bgm.updateCrisis(hpPct, mnPct);
  }, [player, bgmEnabled, phase, audioEngine]);
};

/** ChoiceFeedback に応じた効果音再生 */
const useFeedbackSfx = (params: AudioEffectsParams): void => {
  const { feedback, sfxEnabled, audioEngine } = params;
  const prevFeedbackRef = useRef<ChoiceFeedback | null>(null);

  useEffect(() => {
    // feedback が変わった時のみ再生
    if (!feedback || feedback === prevFeedbackRef.current) return;
    prevFeedbackRef.current = feedback;

    if (!sfxEnabled) return;

    const sfx = audioEngine.sfx;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // インパクト音
    if (feedback.impact === 'bigDmg') {
      sfx.bigHit();
    } else if (feedback.impact === 'dmg') {
      sfx.hit();
    } else if (feedback.impact === 'heal') {
      sfx.heal();
    }

    // ステータス変更音（遅延）
    if (feedback.statusAdded) {
      timers.push(setTimeout(() => sfx.status(), 200));
    }
    if (feedback.statusRemoved) {
      timers.push(setTimeout(() => sfx.clear(), 200));
    }

    // ドレイン音（遅延）
    if (feedback.drain) {
      timers.push(setTimeout(() => sfx.drain(), 400));
    }

    return () => { timers.forEach(t => clearTimeout(t)); };
  }, [feedback, sfxEnabled, audioEngine]);
};

/** 音声副作用フック — フェーズと ChoiceFeedback に応じた音声制御 */
export const useAudioEffects = (params: AudioEffectsParams): void => {
  useBgmControl(params);
  useCrisisUpdate(params);
  useFeedbackSfx(params);
};
