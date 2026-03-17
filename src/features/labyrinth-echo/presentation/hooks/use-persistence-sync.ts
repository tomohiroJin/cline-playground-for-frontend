/**
 * 迷宮の残響 - usePersistenceSync フック
 *
 * MetaState のストレージ同期を担当する副作用フック。
 * マウント時にロード、変更時に自動保存、トロフィー/実績の自動解放を処理する。
 */
import { useState, useCallback, useEffect } from 'react';
import type { MetaState } from '../../domain/models/meta-state';
import { UNLOCKS } from '../../domain/constants/unlock-defs';
import { FRESH_META } from '../../domain/constants/config';

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

/** localStorage の旧フィールド名を新フィールド名にマイグレーション */
export const migrateMetaState = (raw: Record<string, unknown>): Record<string, unknown> => {
  const migrated = { ...raw };
  // MetaState のフィールド名変更
  if ('bestFl' in migrated && !('bestFloor' in migrated)) {
    migrated.bestFloor = migrated.bestFl;
    delete migrated.bestFl;
  }
  if ('clearedDiffs' in migrated && !('clearedDifficulties' in migrated)) {
    migrated.clearedDifficulties = migrated.clearedDiffs;
    delete migrated.clearedDiffs;
  }
  if ('title' in migrated && !('activeTitle' in migrated)) {
    migrated.activeTitle = migrated.title;
    delete migrated.title;
  }
  // lastRun の ending → endingId
  if (migrated.lastRun && typeof migrated.lastRun === 'object') {
    const lr = migrated.lastRun as Record<string, unknown>;
    if ('ending' in lr && !('endingId' in lr)) {
      lr.endingId = lr.ending;
      delete lr.ending;
    }
    migrated.lastRun = lr;
  }
  return migrated;
};

/** 永続化同期フック — MetaState 変更時に自動保存 */
export const usePersistenceSync = (storage: StorageInterface): PersistenceSyncResult => {
  const [meta, setMeta] = useState<MetaState>({ ...FRESH_META });
  const [loaded, setLoaded] = useState(false);

  // 初期ロード
  useEffect(() => {
    (async () => {
      const saved = await storage.load();
      if (saved) {
        const migrated = migrateMetaState(saved as unknown as Record<string, unknown>);
        setMeta(prev => {
          const m = { ...prev } as Record<string, unknown>;
          for (const k of Object.keys(FRESH_META)) {
            m[k] = migrated[k] ?? (FRESH_META as unknown as Record<string, unknown>)[k];
          }
          return m as unknown as MetaState;
        });
      }
      setLoaded(true);
    })();
  }, [storage]);

  // トロフィーと実績報酬の自動解放
  // トリガー: meta の個別フィールド変更時に再評価（setMeta のコールバック内で prev を参照し、meta 全体の参照変更による無限ループを防止）
  useEffect(() => {
    if (!loaded) return;
    setMeta(prev => {
      let changed = false;
      const next = [...prev.unlocked];
      for (const u of UNLOCKS) {
        if (next.includes(u.id)) continue;
        if (u.category === 'trophy' && u.difficultyRequirement && (prev.clearedDifficulties as readonly string[]).includes(u.difficultyRequirement)) { next.push(u.id); changed = true; }
        if (u.category === 'trophy' && u.difficultyRequirement && prev.endings?.includes(u.difficultyRequirement)) { next.push(u.id); changed = true; }
        if (u.category === 'achieve' && u.achievementCondition && u.achievementCondition(prev)) { next.push(u.id); changed = true; }
      }
      if (changed) {
        const newItems = next.filter(id => !prev.unlocked.includes(id));
        newItems.forEach(id => window.dispatchEvent(new CustomEvent('labyrinth-echo-unlock', { detail: id })));
        return { ...prev, unlocked: next };
      }
      return prev;
    });
  }, [meta.runs, meta.escapes, meta.totalEvents, meta.totalDeaths, meta.endings, meta.clearedDifficulties, loaded, meta.unlocked]);

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
