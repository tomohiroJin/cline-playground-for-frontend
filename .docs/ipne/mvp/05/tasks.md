# IPNE MVP05 タスク一覧: 効果音・BGM実装

## 完了状況

全タスク完了 ✅

---

## フェーズ0: 型定義・基盤準備 ✅

- [x] `types.ts`に`SoundEffectType`定義を追加
- [x] `types.ts`に`BgmType`定義を追加
- [x] `types.ts`に`AudioSettings`インターフェースを追加
- [x] `src/features/ipne/audio/`ディレクトリを作成

## フェーズ1: 効果音システム基盤 ✅

- [x] `audioContext.ts`: AudioContext管理モジュール作成
- [x] `soundEffect.ts`: 効果音生成・再生モジュール作成
- [x] Safari対応（webkitAudioContext）

## フェーズ2-3: 効果音実装 ✅

- [x] 高優先度効果音: プレイヤーダメージ
- [x] 高優先度効果音: 敵撃破
- [x] 高優先度効果音: ゲームクリア（メロディ）
- [x] 高優先度効果音: ゲームオーバー（メロディ）
- [x] 高優先度効果音: レベルアップ（メロディ）
- [x] 中優先度効果音: 攻撃命中
- [x] 中優先度効果音: アイテム取得
- [x] 中優先度効果音: 回復

## フェーズ4-5: BGM実装 ✅

- [x] `bgm.ts`: BGM生成・再生モジュール作成
- [x] タイトルBGM: 神秘的なメロディ（ループ）
- [x] ゲームBGM: 緊張感のあるメロディ（ループ）
- [x] クリアジングル: 達成感のあるメロディ
- [x] ゲームオーバージングル: 哀しみのメロディ
- [x] シームレスループ対応

## フェーズ6: 音量・設定システム ✅

- [x] `audioSettings.ts`: 音量設定モジュール作成
- [x] マスター音量設定
- [x] SE音量設定
- [x] BGM音量設定
- [x] ミュート機能
- [x] localStorage保存/読込

## フェーズ7: UI統合 ✅

- [x] `index.ts`からエクスポート
- [x] `IpnePage.styles.ts`に音声設定UIコンポーネント追加
- [x] `IpnePage.tsx`に音声設定ステート追加
- [x] タイトル画面に音声設定ボタン追加
- [x] 画面遷移時のBGM切り替えロジック追加
- [x] ゲーム中の効果音トリガー追加
- [x] iOS対応（タップして開始メッセージ）

## フェーズ8: 統合テスト・調整 ✅

- [x] `soundEffect.test.ts`: 効果音テスト作成
- [x] `bgm.test.ts`: BGMテスト作成
- [x] `audioSettings.test.ts`: 音声設定テスト作成
- [x] `npm test`パス確認
- [x] ドキュメント作成

---

## 実装ファイル一覧

### 新規作成
- `src/features/ipne/audio/audioContext.ts`
- `src/features/ipne/audio/soundEffect.ts`
- `src/features/ipne/audio/bgm.ts`
- `src/features/ipne/audio/audioSettings.ts`
- `src/features/ipne/audio/index.ts`
- `src/features/ipne/audio/__tests__/soundEffect.test.ts`
- `src/features/ipne/audio/__tests__/bgm.test.ts`
- `src/features/ipne/audio/__tests__/audioSettings.test.ts`
- `.docs/ipne/mvp/05/spec.md`
- `.docs/ipne/mvp/05/tasks.md`

### 変更
- `src/features/ipne/types.ts` - 音声関連型定義追加
- `src/features/ipne/index.ts` - 音声モジュールエクスポート追加
- `src/pages/IpnePage.styles.ts` - 音声設定UIコンポーネント追加
- `src/pages/IpnePage.tsx` - 音声機能統合

---

## テスト結果

```
Test Suites: 3 passed, 3 total (audio関連)
Tests:       33 passed, 33 total (audio関連)
全体: 678 passed
```
