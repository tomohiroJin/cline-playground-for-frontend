/**
 * 迷宮の残響 - カスタムフック
 *
 * LabyrinthEchoGame.tsx §9 から抽出。
 * テキスト表示、永続化、ビジュアルエフェクトのフックを提供する。
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { AudioEngine } from './audio';
import { Storage } from './storage';
import { UNLOCKS, MetaState } from './game-logic';
import { FRESH_META } from './definitions';

/** テキスト逐次表示フック */
export const useTextReveal = (text: string | null, audioOn: boolean) => {
  const [pos, setPos] = useState(0);
  const [ready, setReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef  = useRef(0);

  useEffect(() => {
    if (!text) return;

    setPos(0); setReady(false); tickRef.current = 0;
    if (timerRef.current !== null) clearInterval(timerRef.current);
    if (readyTimerRef.current !== null) clearTimeout(readyTimerRef.current);
    timerRef.current = setInterval(() => {
      setPos(p => {
        const n = Math.min(p + 2, text.length);
        tickRef.current++;
        if (audioOn && tickRef.current % 3 === 0) AudioEngine.sfx.tick();
        if (n >= text.length) {
          if (timerRef.current !== null) clearInterval(timerRef.current);
          readyTimerRef.current = setTimeout(() => setReady(true), 200);
        }
        return n;
      });
    }, 18);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
      if (readyTimerRef.current !== null) clearTimeout(readyTimerRef.current);
    };
  }, [text, audioOn]);

  const skip = useCallback(() => {
    if (!text) return;
    if (timerRef.current !== null) clearInterval(timerRef.current);
    if (readyTimerRef.current !== null) clearTimeout(readyTimerRef.current);
    setPos(text.length);
    readyTimerRef.current = setTimeout(() => setReady(true), 50);
  }, [text]);

  return { revealed: text?.slice(0, pos) ?? "", done: pos >= (text?.length ?? 0), ready, skip };
};

/** 永続メタ状態 — ストレージからロード、変更時に自動保存、トロフィー/実績の自動解放 */
export const usePersistence = () => {
  const [meta, setMeta] = useState<MetaState>({ ...FRESH_META });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await Storage.load();
      if (s) setMeta(prev => {
        const m = { ...prev };
        for (const k of Object.keys(FRESH_META) as Array<keyof MetaState>) {
          (m as Record<string, unknown>)[k] = (s as Record<string, unknown>)[k] ?? FRESH_META[k];
        }
        return m;
      });
      setLoaded(true);
    })();
  }, []);

  // トロフィーと実績報酬の自動解放
  useEffect(() => {
    if (!loaded) return;
    let changed = false;
    const next = [...meta.unlocked];
    for (const u of UNLOCKS) {
      if (next.includes(u.id)) continue;
      if (u.cat === "trophy" && u.req && meta.clearedDiffs.includes(u.req)) { next.push(u.id); changed = true; }
      if (u.cat === "trophy" && u.req && meta.endings?.includes(u.req))     { next.push(u.id); changed = true; }
      if (u.cat === "achieve" && u.achReq && u.achReq(meta))                { next.push(u.id); changed = true; }
    }

    if (changed) {
      const newItems = next.filter(id => !meta.unlocked.includes(id));
      newItems.forEach(id => window.dispatchEvent(new CustomEvent('labyrinth-echo-unlock', { detail: id })));
      setMeta(prev => ({ ...prev, unlocked: next }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.runs, meta.escapes, meta.totalEvents, meta.totalDeaths, meta.endings, meta.clearedDiffs, loaded]);

  useEffect(() => { if (loaded) Storage.save(meta); }, [meta, loaded]);

  const updateMeta = useCallback((updater: (prev: MetaState) => Partial<MetaState>) => setMeta(prev => ({ ...prev, ...updater(prev) })), []);

  /** 全データを初期状態にリセット */
  const resetMeta = useCallback(async () => {
    const fresh = { ...FRESH_META, unlocked: [] };
    await Storage.save(fresh);
    setMeta(fresh);
  }, []);

  return { meta, updateMeta, resetMeta, loaded };
};

/** ビジュアルエフェクトフック */
export const useVisualFx = () => {
  const [shake, setShake]     = useState(false);
  const [overlay, setOverlay] = useState<string | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current);
      if (shakeTimerRef.current !== null) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  const flash = useCallback((type: string, ms: number) => {
    setOverlay(type);
    if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setOverlay(null), ms);
  }, []);

  const doShake = useCallback(() => {
    setShake(true);
    if (shakeTimerRef.current !== null) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setShake(false), 350);
  }, []);

  return { shake, overlay, flash, doShake };
};

/** 画像プリロードフック */
export const useImagePreload = (urls: string[]): void => {
  useEffect(() => {
    urls.forEach(url => {
      if (!url) return;
      const img = new Image();
      img.src = url;
    });
  }, [urls]);
};

export interface KeyboardControlParams {
  optionsCount: number;
  onSelect: (index: number) => void;
  onCancel?: () => void;
  isActive: boolean;
}

export const useKeyboardControl = ({ optionsCount, onSelect, onCancel, isActive }: KeyboardControlParams) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [optionsCount, isActive]);

  useEffect(() => {
    if (!isActive || optionsCount === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const numKey = parseInt(e.key, 10);
      if (!isNaN(numKey) && numKey >= 1 && numKey <= optionsCount) {
        setSelectedIndex(numKey - 1);
        onSelect(numKey - 1);
        e.preventDefault();
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
        case 'Tab':
          if (e.key === 'Tab' && e.shiftKey) {
            setSelectedIndex(prev => (prev - 1 + optionsCount) % optionsCount);
          } else {
            setSelectedIndex(prev => (prev + 1) % optionsCount);
          }
          e.preventDefault();
          break;
        case 'ArrowUp':
        case 'k':
          setSelectedIndex(prev => (prev - 1 + optionsCount) % optionsCount);
          e.preventDefault();
          break;
        case 'Enter':
        case ' ':
          onSelect(selectedIndex);
          e.preventDefault();
          break;
        case 'Escape':
        case 'Backspace':
          if (onCancel) {
            onCancel();
            e.preventDefault();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, optionsCount, selectedIndex, onSelect, onCancel]);

  return { selectedIndex, setSelectedIndex };
};
