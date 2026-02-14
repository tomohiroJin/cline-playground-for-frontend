import { useState, useCallback, useRef } from 'react';
import type {
  GameState,
  ArtKey,
  EmoKey,
  InputAction,
  ModDef,
} from '../types';
import {
  LANES,
  ROWS,
  MENUS,
} from '../constants';
import { calcEffBf, visLabel } from '../utils';
import type { useStore } from './useStore';
import type { useAudio } from './useAudio';
import {
  useRunningPhase,
  usePerkPhase,
  useShopPhase,
  useResultPhase,
} from './phases';
import type { PhaseContext } from './phases';

// ── セグメント表示状態 ──
export type SegState =
  | 'ghost'
  | 'warn'
  | 'danger'
  | 'impact'
  | 'safe'
  | 'near'
  | 'fake'
  | 'shield'
  | 'shieldWarn';

// ── アナウンス表示データ ──
export interface AnnounceInfo {
  stage: number;
  cycles: number;
  mod: ModDef | null;
  forecast: string;
  buildSummary: string;
}

// ── レンダリング用の状態 ──
export interface RenderState {
  screen: import('../types').ScreenId;
  game: GameState | null;
  menuIndex: number;
  listIndex: number;
  perkIndex: number;
  announce: AnnounceInfo | null;
  segments: (SegState | null)[][];
  segTexts: string[][];
  beatAnimating: boolean;
  flash: boolean;
  shaking: boolean;
  popText: { lane: number; text: string; id: number } | null;
  laneArt: ArtKey[];
  emoKey: EmoKey;
}

type StoreApi = ReturnType<typeof useStore>;
type AudioApi = ReturnType<typeof useAudio>;

// 初期レンダリング状態
export function initRender(): RenderState {
  const segs: (SegState | null)[][] = LANES.map(() =>
    Array(ROWS).fill(null),
  );
  const texts: string[][] = LANES.map(() => Array(ROWS).fill('╳'));
  return {
    screen: 'T',
    game: null,
    menuIndex: 0,
    listIndex: 0,
    perkIndex: 0,
    announce: null,
    segments: segs,
    segTexts: texts,
    beatAnimating: false,
    flash: false,
    shaking: false,
    popText: null,
    laneArt: ['ghost', 'idle', 'ghost'],
    emoKey: 'idle',
  };
}

// ── メインゲームエンジンフック（オーケストレーター） ──
export function useGameEngine(store: StoreApi, audio: AudioApi) {
  const [rs, setRs] = useState<RenderState>(initRender);

  // ゲーム状態（ミュータブル、高速アクセス用）
  const gRef = useRef<GameState | null>(null);
  const rsRef = useRef(rs);
  rsRef.current = rs;

  // タイマー管理
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const popIdRef = useRef(0);

  // タイマー追加
  const addTimer = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  // 全タイマークリア
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // レンダリング状態を部分更新
  const patch = useCallback((partial: Partial<RenderState>) => {
    setRs((prev) => {
      const next = { ...prev, ...partial };
      rsRef.current = next;
      return next;
    });
  }, []);

  // ゲーム状態をレンダリングに反映
  const syncGame = useCallback(() => {
    const g = gRef.current;
    if (g) patch({ game: { ...g } });
  }, [patch]);

  // ── ヘルパー関数 ──
  const isRestricted = (lane: number): boolean =>
    gRef.current?.st.rs.includes(lane) ?? false;
  const isShelter = (lane: number): boolean =>
    gRef.current?.st.sf.includes(lane) ?? false;
  const laneMultiplier = (lane: number): number =>
    gRef.current?.st.mu[lane] ?? 1;

  // セグメント状態をクリア
  const clearSegs = useCallback(() => {
    const g = gRef.current;
    const segs: (SegState | null)[][] = LANES.map((l) =>
      Array(ROWS).fill(isShelter(l) ? 'shield' : null),
    );
    const texts: string[][] = LANES.map((l) =>
      Array(ROWS).fill(isShelter(l) ? '─' : '╳'),
    );
    patch({
      segments: segs,
      segTexts: texts,
      shaking: false,
      laneArt: LANES.map((l) => resolveArtKey(l)) as ArtKey[],
      emoKey: resolveEmoKey(g),
    });
  }, [patch]);

  // アート状態の解決
  const resolveArtKey = (lane: number): ArtKey => {
    const g = gRef.current;
    if (!g || lane !== g.lane) return 'ghost';
    if (!g.alive) return 'dead';
    if (g.shields > 0 && store.hasUnlock('ui_art')) return 'shield';
    if (g.comboCount >= 4 && store.hasUnlock('ui_art')) return 'combo';
    if (g.artState === 'danger') return 'danger';
    if (g.artState === 'walk') return 'walk';
    if (g.artState === 'safe') return 'safe';
    return 'idle';
  };

  const resolveEmoKey = (g: GameState | null): EmoKey => {
    if (!g) return 'idle';
    if (!g.alive) return 'dead';
    const art = resolveArtKey(g.lane);
    if (art === 'ghost' || art === 'idle') return 'idle';
    return art as EmoKey;
  };

  // アート状態の更新とレンダリング
  const updArt = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    g.artFrame = (g.artFrame || 0) + 1;
    patch({
      laneArt: LANES.map((l) => resolveArtKey(l)) as ArtKey[],
      emoKey: resolveEmoKey(g),
    });
  }, [patch, store]);

  // 一時的なアート状態変更
  const setArtTemp = useCallback(
    (state: ArtKey, ms: number) => {
      const g = gRef.current;
      if (!g) return;
      g.artState = state;
      updArt();
      if (ms > 0)
        addTimer(() => {
          if (gRef.current?.alive) {
            gRef.current.artState = 'idle';
            updArt();
          }
        }, ms);
    },
    [updArt, addTimer],
  );

  // ポップテキスト表示
  const showPop = useCallback(
    (lane: number, text: string) => {
      const id = ++popIdRef.current;
      patch({ popText: { lane, text, id } });
      addTimer(() => {
        setRs((prev) =>
          prev.popText?.id === id ? { ...prev, popText: null } : prev,
        );
      }, 600);
    },
    [patch, addTimer],
  );

  // ── フェーズフック共有コンテキスト ──
  const ctx: PhaseContext = {
    gRef,
    rsRef,
    addTimer,
    clearTimers,
    patch,
    syncGame,
    updArt,
    setArtTemp,
    showPop,
    clearSegs,
    isRestricted,
    isShelter,
    laneMultiplier,
    resolveArtKey,
    resolveEmoKey,
  };

  // ── クロスフェーズ参照（循環依存の解消） ──
  const endGameRef = useRef<(cleared: boolean) => void>(() => {});
  const showPerksRef = useRef<() => void>(() => {});
  const announceRef = useRef<() => void>(() => {});

  // ── フェーズフック ──
  const { endGame, goTitle } = useResultPhase(ctx, store, audio);
  const { showPerks, selectPerk } = usePerkPhase(ctx, store, audio, announceRef);
  const { startGame, movePlayer, announce } = useRunningPhase(
    ctx, store, audio, endGameRef, showPerksRef,
  );
  const { dispatchStyle, dispatchShop, dispatchHelp } = useShopPhase(
    ctx, store, audio, goTitle,
  );

  // クロスフェーズ参照の設定
  endGameRef.current = endGame;
  showPerksRef.current = showPerks;
  announceRef.current = announce;

  // ── 入力ディスパッチ ──
  const dispatch = useCallback(
    (action: InputAction) => {
      const r = rsRef.current;
      const g = gRef.current;
      const screen = r.screen;

      // ゲーム中パーク選択画面
      if (screen === 'G' && g?.phase === 'perks') {
        const maxP = g.perkChoices?.length || 3;
        if (action === 'up') {
          patch({ perkIndex: Math.max(0, r.perkIndex - 1) });
          audio.mv();
        } else if (action === 'down') {
          patch({ perkIndex: Math.min(maxP - 1, r.perkIndex + 1) });
          audio.mv();
        } else if (action === 'act') {
          selectPerk();
        }
        return;
      }

      // ゲーム中の左右移動
      if (screen === 'G' && (action === 'left' || action === 'right')) {
        movePlayer(action === 'left' ? -1 : 1);
        return;
      }

      // 各画面の入力処理
      switch (screen) {
        case 'T':
          if (action === 'up') {
            patch({ menuIndex: Math.max(0, r.menuIndex - 1) });
            audio.mv();
          } else if (action === 'down') {
            patch({
              menuIndex: Math.min(MENUS.length - 1, r.menuIndex + 1),
            });
            audio.mv();
          } else if (action === 'act') {
            audio.sel();
            switch (r.menuIndex) {
              case 0:
                startGame();
                break;
              case 1:
                patch({ screen: 'Y', listIndex: 0 });
                break;
              case 2:
                patch({ screen: 'H', listIndex: 0 });
                break;
              case 3:
                patch({ screen: 'HP', listIndex: 0 });
                break;
            }
          }
          break;

        case 'Y':
          dispatchStyle(action);
          break;

        case 'H':
          dispatchShop(action);
          break;

        case 'HP':
          dispatchHelp(action);
          break;

        case 'R':
          if (action === 'act' || action === 'left' || action === 'back') {
            goTitle();
          }
          break;

        default:
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ゲーム状態からレーン情報を導出
  const getLaneInfo = useCallback(
    (lane: number) => {
      const g = gRef.current;
      if (!g) return { mult: 1, restricted: false, shelter: false, forecast: '' };
      const restricted = g.st.rs.includes(lane);
      const shelter = g.st.sf.includes(lane);
      const mult = g.st.mu[lane];
      const bf = calcEffBf(
        g.curBf0,
        lane,
        g.bfAdj,
        g.bfAdj_lane,
        g.bfAdj_extra,
        0,
      );
      const vis = ROWS - bf;
      return {
        mult,
        restricted,
        shelter,
        forecast: visLabel(vis),
      };
    },
    [],
  );

  // 項目を直接クリック/タップした際に「選択 + 実行」を一括で行う
  const selectAndAct = useCallback((index: number) => {
    const r = rsRef.current;
    const g = gRef.current;
    let key: 'menuIndex' | 'listIndex' | 'perkIndex';
    if (r.screen === 'G' && g?.phase === 'perks') {
      key = 'perkIndex';
    } else if (r.screen === 'T') {
      key = 'menuIndex';
    } else {
      key = 'listIndex';
    }
    // ref を即座に更新（dispatch が読む rsRef.current に反映）
    rsRef.current = { ...rsRef.current, [key]: index };
    patch({ [key]: index });
    dispatch('act');
  }, [patch, dispatch]);

  return {
    state: rs,
    dispatch,
    selectAndAct,
    getLaneInfo,
  };
}
