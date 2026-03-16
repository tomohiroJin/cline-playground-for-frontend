/**
 * 迷宮の残響 - usePersistenceSync フック
 *
 * MetaState のストレージ同期を担当する副作用フック。
 * マウント時にロード、変更時に自動保存、トロフィー/実績の自動解放を処理する。
 */
import { useState, useCallback, useEffect } from 'react';
import type { MetaState } from '../../game-logic';
import { UNLOCKS } from '../../game-logic';
import { FRESH_META } from '../../definitions';

/** ストレージインターフェース（テスト時にモック可能） */
export interface StorageInterface {
  save: (meta: MetaState) => Promise<void | null>;
  load: () => Promise<MetaState | null>;
}

/** usePersistenceSync の戻り値 */
export interface PersistenceSyncResult {
  readonly meta: MetaState;
  readonly updateMeta: (updater: (prev: MetaState) => Partial<MetaState>) => void;
  readonly resetMeta: () => Promise<void>;
  readonly loaded: boolean;
}

/** 永続化同期フック — MetaState 変更時に自動保存 */
export const usePersistenceSync = (storage: StorageInterface): PersistenceSyncResult => {
  const [meta, setMeta] = useState<MetaState>({ ...FRESH_META });
  const [loaded, setLoaded] = useState(false);

  // 初期ロード
  useEffect(() => {
    (async () => {
      const saved = await storage.load();
      if (saved) {
        setMeta(prev => {
          const m = { ...prev } as Record<string, unknown>;
          for (const k of Object.keys(FRESH_META)) {
            m[k] = (saved as unknown as Record<string, unknown>)[k] ?? (FRESH_META as unknown as Record<string, unknown>)[k];
          }
          return m as unknown as MetaState;
        });
      }
      setLoaded(true);
    })();
  }, [storage]);

  // トロフィーと実績報酬の自動解放
  useEffect(() => {
    if (!loaded) return;
    let changed = false;
    const next = [...meta.unlocked];
    for (const u of UNLOCKS) {
      if (next.includes(u.id)) continue;
      if (u.cat === 'trophy' && u.req && meta.clearedDiffs.includes(u.req)) { next.push(u.id); changed = true; }
      if (u.cat === 'trophy' && u.req && meta.endings?.includes(u.req)) { next.push(u.id); changed = true; }
      if (u.cat === 'achieve' && u.achReq && u.achReq(meta)) { next.push(u.id); changed = true; }
    }

    if (changed) {
      const newItems = next.filter(id => !meta.unlocked.includes(id));
      newItems.forEach(id => window.dispatchEvent(new CustomEvent('labyrinth-echo-unlock', { detail: id })));
      setMeta(prev => ({ ...prev, unlocked: next }));
    }
  }, [meta.runs, meta.escapes, meta.totalEvents, meta.totalDeaths, meta.endings, meta.clearedDiffs, loaded, meta.unlocked, meta]);

  // 自動保存
  useEffect(() => {
    if (loaded) storage.save(meta);
  }, [meta, loaded, storage]);

  const updateMeta = useCallback((updater: (prev: MetaState) => Partial<MetaState>) => {
    setMeta(prev => ({ ...prev, ...updater(prev) }));
  }, []);

  const resetMeta = useCallback(async () => {
    const fresh = { ...FRESH_META, unlocked: [] as string[] };
    await storage.save(fresh);
    setMeta(fresh);
  }, [storage]);

  return { meta, updateMeta, resetMeta, loaded };
};
