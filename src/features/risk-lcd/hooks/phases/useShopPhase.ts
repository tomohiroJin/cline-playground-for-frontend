import { useCallback } from 'react';
import { STY_KEYS, SHP, HELP_SECTIONS } from '../../constants';
import type { useStore } from '../useStore';
import type { useAudio } from '../useAudio';
import type { PhaseContext } from './types';

type StoreApi = ReturnType<typeof useStore>;
type AudioApi = ReturnType<typeof useAudio>;

// ショップフェーズ：スタイル画面・ショップ画面・ヘルプ画面の入力処理
export function useShopPhase(
  ctx: PhaseContext,
  store: StoreApi,
  audio: AudioApi,
  goTitle: () => void,
) {
  const { rsRef, patch } = ctx;

  // スタイル画面の入力処理
  const dispatchStyle = useCallback(
    (action: string) => {
      const r = rsRef.current;
      const max = STY_KEYS.length;
      if (action === 'up') {
        patch({ listIndex: Math.max(0, r.listIndex - 1) });
        audio.mv();
      } else if (action === 'down') {
        patch({ listIndex: Math.min(max - 1, r.listIndex + 1) });
        audio.mv();
      } else if (action === 'act') {
        const id = STY_KEYS[r.listIndex];
        if (!store.hasStyle(id)) {
          audio.er();
        } else if (store.toggleEq(id)) {
          audio.sel();
        } else {
          audio.er();
        }
      } else if (action === 'left' || action === 'back') {
        audio.sel();
        goTitle();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ショップ画面の入力処理
  const dispatchShop = useCallback(
    (action: string) => {
      const r = rsRef.current;
      const maxShop = SHP.length;
      if (action === 'up') {
        patch({ listIndex: Math.max(0, r.listIndex - 1) });
        audio.mv();
      } else if (action === 'down') {
        patch({ listIndex: Math.min(maxShop - 1, r.listIndex + 1) });
        audio.mv();
      } else if (action === 'act') {
        const item = SHP[r.listIndex];
        const owned =
          item.tp === 's'
            ? store.hasStyle(item.id)
            : store.hasUnlock(item.id);
        if (owned) {
          audio.er();
        } else if (store.spend(item.co)) {
          if (item.tp === 's') store.ownStyle(item.id);
          else store.ownUnlock(item.id);
          audio.ul();
        } else {
          audio.er();
        }
      } else if (action === 'left' || action === 'back') {
        audio.sel();
        goTitle();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ヘルプ画面の入力処理
  const dispatchHelp = useCallback(
    (action: string) => {
      const r = rsRef.current;
      const helpTotal = HELP_SECTIONS.reduce(
        (n, s) => n + 1 + s.items.length,
        0,
      );
      if (action === 'up') {
        patch({ listIndex: Math.max(0, r.listIndex - 1) });
        audio.mv();
      } else if (action === 'down') {
        patch({ listIndex: Math.min(helpTotal - 1, r.listIndex + 1) });
        audio.mv();
      } else if (action === 'act' || action === 'left' || action === 'back') {
        audio.sel();
        goTitle();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { dispatchStyle, dispatchShop, dispatchHelp };
}
