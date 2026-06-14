/**
 * 一時的な特性化テスト（Phase B 安全網）
 *
 * enemy/player スプライトの生成プリミティブ共通化リファクタの前後で、
 * 全スプライトのピクセル出力が完全に一致することを保証する。
 * モジュール名前空間を丸ごとスナップショットすることで、どの export の
 * ピクセルが1点でも変われば検知できる。
 *
 * NOTE: Phase B 完了後に本ファイルとスナップショットを削除する（恒久的負債を残さない）。
 */
import * as enemySprites from './enemySprites';
import * as playerSprites from './playerSprites';

describe('スプライト特性化（Phase B 安全網・完了後削除）', () => {
  it('敵スプライトの全 export が変化しないこと', () => {
    expect(enemySprites).toMatchSnapshot();
  });

  it('プレイヤースプライトの全 export が変化しないこと', () => {
    expect(playerSprites).toMatchSnapshot();
  });
});
