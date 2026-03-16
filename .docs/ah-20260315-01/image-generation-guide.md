# Phase 2: 画像生成ガイド

> **生成ツール**: Google Nanobanana2
> **重要**: Phase 2 は Phase 1 の既存アセットをほぼすべて再利用します。新規生成が必要な画像は最小限です。

---

## 目次

1. [Phase 2 で必要な画像の概要](#1-phase-2-で必要な画像の概要)
2. [既存アセット一覧（Phase 1 生成済み）](#2-既存アセット一覧phase-1-生成済み)
3. [新規生成プロンプト](#3-新規生成プロンプト)
4. [後処理手順](#4-後処理手順)
5. [品質チェックリスト](#5-品質チェックリスト)

---

## 1. Phase 2 で必要な画像の概要

### 使用場面ごとの画像一覧

| 使用場面 | 必要な画像 | 状態 |
|---------|-----------|------|
| 図鑑画面 — キャラカード | アイコン（128x128）× 8キャラ | ✅ Phase 1 既存 |
| 図鑑画面 — ロック中カード | CSS フィルタで対応（画像不要） | ✅ 不要 |
| プロフィールカード — 立ち絵 | 立ち絵（512x1024）× 16枚 | ✅ Phase 1 既存 |
| リザルト画面 — 表情差分 | 立ち絵（512x1024）× 16枚 | ✅ Phase 1 既存 |
| ユウの VS 用画像 | VS 画像（256x512）× 1枚 | 🔲 **新規作成が必要** |

### 新規生成・後処理まとめ

| # | ファイル名 | 種類 | サイズ | 作成方法 | 必要タイミング |
|---|-----------|------|--------|---------|--------------|
| 1 | `yuu-vs.png` | VS 用 | 256x512 | 既存 `yuu-normal.png` からトリミング+リサイズ | P2-00（画像アセット準備） |

> **注意**: `yuu-vs.png` は既存の透過済み立ち絵 `yuu-normal.png` からのトリミングで作成します。
> AI 画像生成は不要です。Phase 1 の VS 画像と同じ手順で作成してください。

---

## 2. 既存アセット一覧（Phase 1 生成済み）

Phase 2 で再利用する全アセットの一覧です。画像生成時にスタイル参照として使用してください。

### アイコン（characters/ — 128x128 PNG）

図鑑画面のキャラカードに使用します。

| # | ファイル | キャラ名 | テーマカラー | 生成時期 |
|---|---------|---------|-------------|---------|
| 1 | `characters/akira.png` | 蒼葉 アキラ | 青 #3498db | 初期 |
| 2 | `characters/hiro.png` | 日向 ヒロ | オレンジ #e67e22 | 初期 |
| 3 | `characters/misaki.png` | 水瀬 ミサキ | 紫 #9b59b6 | 初期 |
| 4 | `characters/takuma.png` | 鷹見 タクマ | 赤 #c0392b | 初期 |
| 5 | `characters/yuu.png` | 柊 ユウ | 緑 #2ecc71 | Phase 1 |
| 6 | `characters/rookie.png` | 春日 ソウタ | ライム #27ae60 | 初期 |
| 7 | `characters/regular.png` | 秋山 ケンジ | ネイビー #2c3e50 | 初期 |
| 8 | `characters/ace.png` | 氷室 レン | 黒+赤 #2c3e50 | 初期 |

**Phase 1 生成時のプロンプト参考**（スタイル統一のため）:

```
共通スタイル:
anime style chibi character portrait, 3/4 view bust shot,
clean line art, cel-shaded, bright vivid colors, 128x128 pixels
```

### 立ち絵（portraits/ — 512x1024 PNG）

プロフィールカード・リザルト画面の表情差分に使用します。

| # | ファイル | キャラ | 表情 | クロマキー |
|---|---------|--------|------|----------|
| 1 | `portraits/akira-normal.png` | アキラ | 通常 | グリーンバック |
| 2 | `portraits/akira-happy.png` | アキラ | 嬉しい | グリーンバック |
| 3 | `portraits/hiro-normal.png` | ヒロ | 通常 | グリーンバック |
| 4 | `portraits/hiro-happy.png` | ヒロ | 嬉しい | グリーンバック |
| 5 | `portraits/misaki-normal.png` | ミサキ | 通常 | グリーンバック |
| 6 | `portraits/misaki-happy.png` | ミサキ | 嬉しい | グリーンバック |
| 7 | `portraits/takuma-normal.png` | タクマ | 通常 | グリーンバック |
| 8 | `portraits/takuma-happy.png` | タクマ | 嬉しい | グリーンバック |
| 9 | `portraits/yuu-normal.png` | ユウ | 通常 | ブルーバック |
| 10 | `portraits/yuu-happy.png` | ユウ | 嬉しい | ブルーバック |
| 11 | `portraits/rookie-normal.png` | ソウタ | 通常 | ブルーバック |
| 12 | `portraits/rookie-happy.png` | ソウタ | 嬉しい | ブルーバック |
| 13 | `portraits/regular-normal.png` | ケンジ | 通常 | グリーンバック |
| 14 | `portraits/regular-happy.png` | ケンジ | 嬉しい | グリーンバック |
| 15 | `portraits/ace-normal.png` | レン | 通常 | グリーンバック |
| 16 | `portraits/ace-happy.png` | レン | 嬉しい | グリーンバック |

**Phase 1 生成時のプロンプト参考**（スタイル統一のため）:

```
共通スタイル:
anime style character illustration, cel-shaded coloring,
clean bold outlines, knee-up shot, 5.5 head proportions,
3/4 view facing slightly right, soft front lighting,
bright vivid colors, high quality, detailed
```

各キャラの詳細プロンプト（キャラごとの外見・服装・ポーズ指定）は Phase 1 の画像生成ガイド `.docs/ah-20260311-02/image-generation-guide.md` に記載されています。
将来スタイルの統一や再生成が必要な場合はそちらを参照してください。

### VS 用画像（vs/ — 256x512 PNG）

VS 画面で使用しています。**ユウのみ未作成**です。

| # | ファイル | キャラ | 状態 |
|---|---------|--------|------|
| 1 | `vs/akira-vs.png` | アキラ | ✅ 既存 |
| 2 | `vs/hiro-vs.png` | ヒロ | ✅ 既存 |
| 3 | `vs/misaki-vs.png` | ミサキ | ✅ 既存 |
| 4 | `vs/takuma-vs.png` | タクマ | ✅ 既存 |
| 5 | `vs/rookie-vs.png` | ソウタ | ✅ 既存 |
| 6 | `vs/regular-vs.png` | ケンジ | ✅ 既存 |
| 7 | `vs/ace-vs.png` | レン | ✅ 既存 |
| 8 | `vs/yuu-vs.png` | ユウ | 🔲 **未作成** |

### 背景（backgrounds/ — 450x900 WebP）

Phase 2 では直接使用しませんが、参考として記載します。

| # | ファイル | 場面 |
|---|---------|------|
| 1 | `backgrounds/bg-clubroom.webp` | 部室 |
| 2 | `backgrounds/bg-gym.webp` | 体育館 |
| 3 | `backgrounds/bg-school-gate.webp` | 校門・桜 |

### カットイン（cutins/ — 450x400 PNG）

Phase 2 では直接使用しませんが、参考として記載します。

| # | ファイル | 内容 |
|---|---------|------|
| 1 | `cutins/victory-ch1.png` | 第1章勝利カットイン |

---

## 3. 新規生成プロンプト

### 3-1. yuu-vs.png — ユウの VS 用画像

> **AI 画像生成は不要**。既存の透過済み立ち絵からトリミングで作成します。

| 項目 | 仕様 |
|------|------|
| 出力ファイル | `public/assets/vs/yuu-vs.png` |
| サイズ | 256 × 512 px |
| フォーマット | PNG（透過） |
| 元画像 | `public/assets/portraits/yuu-normal.png`（512x1024、透過済み） |

#### 作成手順

**方法 A: 全体リサイズ（推奨）**

```bash
convert public/assets/portraits/yuu-normal.png \
  -resize 256x512 \
  public/assets/vs/yuu-vs.png
```

**方法 B: 上半身トリミング + リサイズ（頭部が小さい場合）**

```bash
convert public/assets/portraits/yuu-normal.png \
  -crop 512x768+0+0 \
  -resize 256x384 \
  -gravity North -extent 256x512 \
  public/assets/vs/yuu-vs.png
```

> **注意**: 他の VS 画像（akira-vs.png 等）と同じ方法で作成してください。
> Phase 1 でどちらの方法を使用したかは、他の VS 画像のサイズ・構図と比較して判断してください。

#### 品質チェック

- [ ] サイズが 256x512 であること
- [ ] 背景が透過されていること
- [ ] 他の VS 画像と同じ構図・サイズ感であること
- [ ] ユウの立ち絵（丸メガネ・ストップウォッチ・緑の服）が認識できること

---

## 4. 後処理手順

Phase 2 では `yuu-vs.png` のみが対象です。

### VS 画像作成フロー

```
1. 既存の透過済み立ち絵を確認
   └── portraits/yuu-normal.png（512x1024、透過済み）
         ↓
2. トリミング + リサイズ
   └── 方法A or 方法B（他のVS画像と揃える）
         ↓
3. 品質チェック
   └── サイズ・透過・構図の確認
         ↓
4. 配置
   └── public/assets/vs/yuu-vs.png
```

### 他の VS 画像の確認コマンド

```bash
# 既存 VS 画像のサイズを確認（作成方法の参考）
identify public/assets/vs/akira-vs.png
identify public/assets/vs/hiro-vs.png

# 全 VS 画像の一覧
ls -la public/assets/vs/
```

---

## 5. 品質チェックリスト

### yuu-vs.png

- [ ] ファイルが `public/assets/vs/yuu-vs.png` に配置されている
- [ ] サイズが 256 × 512 px である
- [ ] PNG フォーマットで透過されている
- [ ] 他の VS 画像（akira-vs.png 等）と同じ構図・サイズ感
- [ ] ユウの特徴（丸メガネ、ストップウォッチ、緑の服、黒髪マッシュ）が認識可能

### 既存アセットの確認（Phase 2 使用分）

Phase 1 で生成済みの画像を Phase 2 で使用するにあたり、以下を再確認してください。

- [ ] 全 8 キャラのアイコン（`characters/*.png`）が存在する
- [ ] 全 16 枚の立ち絵（`portraits/*.png`）が存在する
- [ ] 立ち絵の normal / happy で表情の違いが明確である
- [ ] 立ち絵の背景が正しく透過されている（白背景・黒背景の両方で確認）
- [ ] 透過処理のアーティファクト（輪郭の色残り）が許容範囲内である

> **既知の問題**（README より）:
> - 立ち絵の画風がキャラ間で統一されていない（AI 生成ツールの制約）
> - 128×128 アイコンと立ち絵の整合性が一部のキャラで低い
> - 透過処理のアーティファクト（色残り）
>
> これらは Phase 2 のスコープでは修正しません（影響が大きいため別対応）。

---

## 全アセット配置図（Phase 2 完了後）

```
public/assets/
├── characters/           # アイコン（128x128）— 全8枚、変更なし
│   ├── akira.png
│   ├── hiro.png
│   ├── misaki.png
│   ├── takuma.png
│   ├── yuu.png
│   ├── rookie.png
│   ├── regular.png
│   └── ace.png
├── portraits/            # 立ち絵（512x1024）— 全16枚、変更なし
│   ├── akira-normal.png, akira-happy.png
│   ├── hiro-normal.png, hiro-happy.png
│   ├── misaki-normal.png, misaki-happy.png
│   ├── takuma-normal.png, takuma-happy.png
│   ├── yuu-normal.png, yuu-happy.png
│   ├── rookie-normal.png, rookie-happy.png
│   ├── regular-normal.png, regular-happy.png
│   └── ace-normal.png, ace-happy.png
├── vs/                   # VS用（256x512）— 7枚既存 + ★1枚新規
│   ├── akira-vs.png
│   ├── hiro-vs.png
│   ├── misaki-vs.png
│   ├── takuma-vs.png
│   ├── yuu-vs.png        # ★新規（立ち絵からトリミング）
│   ├── rookie-vs.png
│   ├── regular-vs.png
│   └── ace-vs.png
├── backgrounds/          # 背景（450x900）— 全3枚、変更なし
│   ├── bg-clubroom.webp
│   ├── bg-gym.webp
│   └── bg-school-gate.webp
└── cutins/               # カットイン（450x400）— 全1枚、変更なし
    └── victory-ch1.png
```

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-03-15 | 初版作成。Phase 2 用（既存アセット再利用 + yuu-vs.png 新規作成） |
