# IPNE 画像アセット仕様

5ステージ拡張で追加された画面に対する画像挿入箇所と仕様。

---

## 命名規則

```
ipne_{用途}_{識別子}.{拡張子}
```

| 接頭辞 | 用途 | 例 |
|--------|------|-----|
| `ipne_ending_` | エンディング画像 | `ipne_ending_s.webp` |
| `ipne_stage_` | ステージ関連画像 | `ipne_stage_1.webp` |
| `ipne_story_` | ストーリー画像 | `ipne_story_prologue.webp` |
| `ipne_game_over` | ゲームオーバー画像 | `ipne_game_over.webp` |

---

## ファイル形式・サイズ

| 項目 | 推奨値 |
|------|--------|
| ファイル形式 | WebP（`.webp`） |
| フォールバック | PNG（`.png`） |
| 推奨サイズ | 720×528px（Canvas解像度に合わせる） |
| 最大ファイルサイズ | 100KB以下 |
| 配置ディレクトリ | `src/assets/images/` |

---

## 画像挿入箇所一覧

### 既存（実装済み）

| 画像 | ファイル名 | 使用画面 | 参照ファイル |
|------|-----------|---------|-------------|
| エンディングS評価 | `ipne_ending_s.webp` | FinalClear | `ending.ts` |
| エンディングA評価 | `ipne_ending_a.webp` | FinalClear | `ending.ts` |
| エンディングB評価 | `ipne_ending_b.webp` | FinalClear | `ending.ts` |
| エンディングC評価 | `ipne_ending_c.webp` | FinalClear | `ending.ts` |
| エンディングD評価 | `ipne_ending_d.webp` | FinalClear | `ending.ts` |
| ゲームオーバー | `ipne_game_over.webp` | GameOver | `ending.ts` |

### 追加候補（未実装）

| 画像 | 推奨ファイル名 | 使用画面 | 用途 |
|------|---------------|---------|------|
| ステージ1背景 | `ipne_stage_1.webp` | StageStory | ステージ間ストーリー背景 |
| ステージ2背景 | `ipne_stage_2.webp` | StageStory | ステージ間ストーリー背景 |
| ステージ3背景 | `ipne_stage_3.webp` | StageStory | ステージ間ストーリー背景 |
| ステージ4背景 | `ipne_stage_4.webp` | StageStory | ステージ間ストーリー背景 |
| ステージ5背景 | `ipne_stage_5.webp` | StageStory | 最終ステージストーリー背景 |
| プロローグ | `ipne_story_prologue.webp` | Prologue | プロローグ画面背景 |
| ステージクリア | `ipne_stage_clear.webp` | StageClear | ステージクリア演出 |

---

## スプライトアセット

### 敵スプライト（ピクセルアート）

コード内で定義された2フレームスプライトシート。実装済み。

| 敵種 | スプライトサイズ | フレーム数 | 定義ファイル |
|------|----------------|----------|-------------|
| パトロール | 16×16 | 2 | `presentation/sprites/enemySprites.ts` |
| チャージ | 16×16 | 2 | `presentation/sprites/enemySprites.ts` |
| レンジド | 16×16 | 2 | `presentation/sprites/enemySprites.ts` |
| スペシメン | 16×16 | 2 | `presentation/sprites/enemySprites.ts` |
| ボス | 24×24 | 2 | `presentation/sprites/enemySprites.ts` |
| ミニボス | 20×20 | 2 | `presentation/sprites/enemySprites.ts` |
| メガボス | 28×28 | 2 | `presentation/sprites/enemySprites.ts` |

---

## 動画アセット

| 動画 | ファイル名 | 使用画面 | 形式 |
|------|-----------|---------|------|
| S評価エンディング動画 | `ipne_ending_s.mp4` | FinalClear | MP4 |
