// @ts-nocheck
/**
 * 迷宮の残響 - カスタムフック
 *
 * LabyrinthEchoGame.tsx §9 から抽出。
 * テキスト表示、永続化、ビジュアルエフェクトのフックを提供する。
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { AudioEngine } from './audio';
import { Storage } from './storage';
import { UNLOCKS } from './game-logic';
import { FRESH_META } from './definitions';

/** テキスト逐次表示フック */
export const useTextReveal = (text, audioOn) => {
  const [pos, setPos] = useState(0);
  const [ready, setReady] = useState(false);
  const timerRef = useRef(null);
  const tickRef  = useRef(0);

  useEffect(() => {
    if (!text) return;

    setPos(0); setReady(false); tickRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPos(p => {
        const n = Math.min(p + 2, text.length);
        tickRef.current++;
        if (audioOn && tickRef.current % 3 === 0) AudioEngine.sfx.tick();
        if (n >= text.length) { clearInterval(timerRef.current); setTimeout(() => setReady(true), 200); }
        return n;
      });
    }, 18);
    return () => clearInterval(timerRef.current);
  }, [text, audioOn]);

  const skip = useCallback(() => {
    if (!text) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setPos(text.length);
    setTimeout(() => setReady(true), 50);
  }, [text]);

  return { revealed: text?.slice(0, pos) ?? "", done: pos >= (text?.length ?? 0), ready, skip };
};

/** 永続メタ状態 — ストレージからロード、変更時に自動保存、トロフィー/実績の自動解放 */
export const usePersistence = () => {
  const [meta, setMeta] = useState({ ...FRESH_META });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await Storage.load();
      if (s) setMeta(prev => {
        const m = { ...prev };
        for (const k of Object.keys(FRESH_META)) m[k] = s[k] ?? FRESH_META[k];
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

    if (changed) setMeta(prev => ({ ...prev, unlocked: next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.runs, meta.escapes, meta.totalEvents, meta.totalDeaths, meta.endings, meta.clearedDiffs, loaded]);

  useEffect(() => { if (loaded) Storage.save(meta); }, [meta, loaded]);

  const updateMeta = useCallback((updater) => setMeta(prev => ({ ...prev, ...updater(prev) })), []);

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
  const [overlay, setOverlay] = useState(null);
  const flash = useCallback((type, ms) => { setOverlay(type); setTimeout(() => setOverlay(null), ms); }, []);
  const doShake = useCallback(() => { setShake(true); setTimeout(() => setShake(false), 350); }, []);
  return { shake, overlay, flash, doShake };
};
