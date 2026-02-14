import { useCallback, type MutableRefObject } from 'react';
import type { PerkDef } from '../../types';
import { PERKS, STACKABLE_PERKS } from '../../constants';
import { Rand } from '../../utils';
import type { useStore } from '../useStore';
import type { useAudio } from '../useAudio';
import type { PhaseContext } from './types';

type StoreApi = ReturnType<typeof useStore>;
type AudioApi = ReturnType<typeof useAudio>;

// パークフェーズ：パーク選択画面の表示・選択実行
export function usePerkPhase(
  ctx: PhaseContext,
  store: StoreApi,
  audio: AudioApi,
  announceRef: MutableRefObject<() => void>,
) {
  const { gRef, rsRef, syncGame, patch } = ctx;

  // パーク選択画面表示
  const showPerks = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    g.phase = 'perks';

    const pool = PERKS.filter(
      (p) => !g.perks.find((x) => x.id === p.id) || STACKABLE_PERKS.has(p.id),
    );
    const shuffled = Rand.shuffle(pool);
    const numP = store.hasUnlock('perk4') ? 4 : 3;
    const risks = shuffled.filter((p: PerkDef) => p.tp === 'risk');
    const buffs = shuffled.filter((p: PerkDef) => p.tp === 'buff');

    let picks: PerkDef[];
    if (risks.length > 0 && buffs.length >= numP - 1) {
      picks = [...buffs.slice(0, numP - 1), risks[0]];
    } else {
      picks = shuffled.slice(0, numP);
    }
    picks = Rand.shuffle(picks);
    g.perkChoices = picks;
    syncGame();
    patch({ perkIndex: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // パーク選択実行
  const selectPerk = useCallback(() => {
    const g = gRef.current;
    if (!g?.perkChoices) return;
    const pk = g.perkChoices[rsRef.current.perkIndex];
    if (!pk) return;
    audio.pk();
    pk.fn(g);
    g.perks.push(pk);
    g.perkChoices = null;
    g.phase = 'idle';
    g.stage++;
    g.maxCombo = 0;
    g.nearMiss = 0;
    syncGame();
    announceRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { showPerks, selectPerk };
}
