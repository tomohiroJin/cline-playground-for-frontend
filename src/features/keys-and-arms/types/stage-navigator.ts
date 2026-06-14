/**
 * KEYS & ARMS — ステージ遷移ナビゲータの型定義
 *
 * 遷移先ステージの init 関数を保持する単一責務レジストリ。
 * 循環依存を避けるため engine.ts で遅延バインドされるが、
 * GameState から隔離することで状態オブジェクトの責務を純化する。
 */
export interface StageNavigator {
  /** 洞窟ステージを初期化する */
  cave: () => void;
  /** 草原ステージを初期化する */
  prairie: () => void;
  /** ボスステージを初期化する */
  boss: () => void;
  /** タイトルからゲームを開始する */
  startGame: () => void;
}
