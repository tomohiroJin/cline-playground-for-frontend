/**
 * KEYS & ARMS — ゲーム更新ティック（状態マシン）
 *
 * engine.ts と test-engine.ts の両方から共有利用する。
 * 描画は含まない（render は engine 側に残る）。
 */
import type { GameState } from '../types';
import type { HUDModule } from '../types/hud';
import type { AudioModule } from '../types/audio';
import type { StageNavigator } from '../types/stage-navigator';
import type { Stage } from '../types/stage';
import type { GameStorageRepository } from '../infrastructure/storage-repository';
import { isActionKey } from './input';

/** gameTick が必要とする依存の束 */
export interface GameTickDeps {
  G: GameState;
  J: (key: string) => boolean;
  clearJustPressed: () => void;
  jAct: () => boolean;
  hud: HUDModule;
  audio: AudioModule;
  nav: StageNavigator;
  cave: Stage;
  prairie: Stage;
  boss: Stage;
  helpScreen: { update(): void };
  storage: GameStorageRepository;
}

/** ゲーム更新ティック（状態マシン）を生成する */
export function createGameTick(deps: GameTickDeps): () => void {
  const { G, J, clearJustPressed: clearJ, jAct, hud, audio, nav, cave, prairie, boss, helpScreen, storage } = deps;
  const isGameplay = () =>
    G.state !== 'title' && G.state !== 'over' && G.state !== 'trueEnd' && G.state !== 'ending1';

  return function gameTick(): void {
    G.tick++;
    if (G.beatPulse > 0) G.beatPulse--;

    // リセット確認
    if (G.resetConfirm > 0) {
      G.resetConfirm--;
      if (jAct()) {
        G.resetConfirm = 0; G.state = 'title'; G.blink = 0;
        if (G.score > G.hi) { G.hi = G.score; storage.setHighScore(G.hi); }
        clearJ(); return;
      }
      if (J('escape')) G.resetConfirm = 0;
      clearJ(); return;
    }

    // ポーズトグル（ゲームプレイ中のみ）
    if (J('p') && isGameplay() && G.state !== 'help') {
      G.paused = !G.paused;
      clearJ(); return;
    }

    // ポーズ中はティックスキップ
    if (G.paused) {
      if (J('escape')) { G.paused = false; G.resetConfirm = 90; }
      clearJ(); return;
    }

    // ESC でリセット確認
    if (J('escape') && isGameplay()) {
      G.resetConfirm = 90; clearJ(); return;
    }

    // ヒットストップ
    if (G.hitStop > 0) { G.hitStop--; clearJ(); return; }
    if (G.hurtFlash > 0) G.hurtFlash--;
    if (G.shakeT > 0) G.shakeT--;

    if (G.transition.t > 0) {
      if (isGameplay()) hud.doBeat();
    } else {
      let nb = false;
      if (isGameplay()) nb = hud.doBeat();
      switch (G.state) {
        case 'cave': cave.update(nb); break;
        case 'grass': prairie.update(nb); break;
        case 'boss': boss.update(nb); break;
        case 'title':
          for (const k of 'abcdefghijklmnopqrstuvwxyz'.split('')) {
            if (isActionKey(k)) continue; // 開始キー(z)はチート文字として扱わない
            if (J(k)) { G.cheatBuf += k; if (G.cheatBuf.length > 10) G.cheatBuf = G.cheatBuf.slice(-10); }
          }
          if (J('arrowup')) { G.state = 'help'; G.helpPage = 0; clearJ(); break; }
          if (jAct() || J('enter')) { audio.S.start(); nav.startGame(); }
          break;
        case 'help': helpScreen.update(); break;
        case 'over': case 'trueEnd': case 'ending1': break;
      }
    }
    clearJ();
  };
}
