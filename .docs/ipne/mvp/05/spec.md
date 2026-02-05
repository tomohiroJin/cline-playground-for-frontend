# IPNE MVP05 詳細仕様書: 効果音・BGM実装

## 概要

IPNEゲームに効果音(SE)とBGM(Background Music)を追加し、Web Audio APIを使用した8bit風レトロサウンドを実装する。

## ファイル構成

```
src/features/ipne/audio/
├── index.ts           # エクスポート
├── audioContext.ts    # AudioContext管理
├── soundEffect.ts     # 効果音生成・再生
├── bgm.ts             # BGM生成・再生
├── audioSettings.ts   # 設定管理
└── __tests__/
    ├── soundEffect.test.ts
    ├── bgm.test.ts
    └── audioSettings.test.ts
```

## 型定義 (`types.ts`に追加)

### 効果音タイプ
```typescript
export const SoundEffectType = {
  PLAYER_DAMAGE: 'player_damage',  // プレイヤーダメージ
  ENEMY_KILL: 'enemy_kill',        // 敵撃破
  GAME_CLEAR: 'game_clear',        // ゲームクリア
  GAME_OVER: 'game_over',          // ゲームオーバー
  LEVEL_UP: 'level_up',            // レベルアップ
  ATTACK_HIT: 'attack_hit',        // 攻撃命中
  ITEM_PICKUP: 'item_pickup',      // アイテム取得
  HEAL: 'heal',                    // 回復
} as const;
```

### BGMタイプ
```typescript
export const BgmType = {
  TITLE: 'title',        // タイトル画面
  GAME: 'game',          // ゲームプレイ中
  CLEAR: 'clear',        // クリアジングル
  GAME_OVER: 'game_over' // ゲームオーバージングル
} as const;
```

### 音声設定
```typescript
export interface AudioSettings {
  masterVolume: number;  // 0.0〜1.0
  seVolume: number;      // 0.0〜1.0
  bgmVolume: number;     // 0.0〜1.0
  isMuted: boolean;
}
```

## 効果音仕様

| 効果音 | 波形 | 周波数 | 長さ | 特徴 |
|--------|------|--------|------|------|
| プレイヤーダメージ | sawtooth | 200→80Hz | 0.2s | 下降スウィープ |
| 敵撃破 | square | 400→800Hz | 0.15s | 上昇スウィープ |
| ゲームクリア | sine | メロディ | 2s | C→D→E→F→G→G→A→B→C6 |
| ゲームオーバー | sawtooth | メロディ | 3s | 下降メロディ |
| レベルアップ | sine | メロディ | 1s | C→E→G→C6→C6→D6 |
| 攻撃命中 | square | 600Hz | 0.08s | 短いパルス |
| アイテム取得 | sine | 800→1200Hz | 0.1s | 軽い上昇 |
| 回復 | sine | 600→900Hz | 0.15s | 柔らかい上昇 |

## BGM仕様

| BGM | 波形 | テンポ | ループ | 特徴 |
|-----|------|--------|--------|------|
| タイトル | sine | 遅め | ○ | 神秘的、C-E-G-E-C-D-E-D |
| ゲーム中 | triangle | 速め | ○ | 緊張感、E3-G3-A3-G3-E3-D3-C3-D3 |
| クリア | square | 速め | × | 壮大、C5→E6アルペジオ |
| ゲームオーバー | sawtooth | 遅め | × | 哀しみ、下降半音階 |

## iOS/モバイル対応

### 自動再生制限対策
- タイトル画面で「タップしてゲーム開始」メッセージを表示
- 初回タップ時に `enableAudio()` を呼び出してAudioContextを有効化
- `audioContext.resume()` でsuspended状態から復帰

### AudioContext初期化フロー
```
1. ユーザーがタイトル画面をタップ
2. enableAudio() 実行
3. AudioContext.resume() 成功
4. isAudioReady = true
5. タイトルBGM再生開始
```

## 音量設定システム

### localStorage保存
- キー: `ipne_audio_settings`
- 保存内容: AudioSettings (JSON)

### 実効音量計算
```typescript
// SE実効音量
seEffectiveVolume = masterVolume * seVolume * (isMuted ? 0 : 1)

// BGM実効音量
bgmEffectiveVolume = masterVolume * bgmVolume * (isMuted ? 0 : 1)
```

## UI統合

### 音声設定パネル
- 位置: 画面右上
- 表示: 🔊/🔇 アイコンをクリックで開閉
- 内容:
  - マスター音量スライダー
  - SE音量スライダー
  - BGM音量スライダー
  - ミュートボタン

### 効果音トリガーポイント
- `handleMove`: 敵接触ダメージ時
- `handleAttack`: 攻撃命中時、敵撃破時、レベルアップ時
- 更新ループ: 接触ダメージ、射撃ダメージ、アイテム取得、罠ダメージ

### BGM切り替えポイント
- TITLE画面: タイトルBGM
- GAME画面: ゲームBGM
- CLEAR画面: BGM停止 → クリアジングル
- GAME_OVER画面: BGM停止 → ゲームオーバージングル

## テスト

### 単体テスト項目
- 音声設定の読み書き
- 音量クランプ (0-1範囲)
- ミュートトグル
- AudioContextなしでもエラーにならない
- ヘルパー関数の呼び出し

## 完了条件

- [x] 高優先度効果音が全て実装されている
- [x] タイトル/ゲーム中のBGMが流れる
- [x] 音量調整・ミュート機能が動作する
- [x] iOSで音が再生される（タップ後有効化）
- [x] テストが追加され `npm test` が通る
