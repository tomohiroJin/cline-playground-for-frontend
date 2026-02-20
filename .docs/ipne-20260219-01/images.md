# IPNE ビジュアル・ストーリー強化 — 画像生成仕様書

## 概要

本ドキュメントでは、ストーリー画面に表示するプレースホルダー画像を本番アセットに差し替えるための画像生成仕様を定義する。
現在、`src/features/ipne/storyImages.ts` の画像レジストリにて Canvas API によるプレースホルダー（ダークネイビー背景 + テキストラベル）が返却されている。

---

## 共通仕様

| 項目 | 値 |
|------|-----|
| **出力サイズ** | 960×540 px（表示は 480×270 に縮小、Retina 対応） |
| **出力形式** | WebP（品質 80〜85、ファイルサイズ目安 50〜150 KB） |
| **アスペクト比** | 16:9 |
| **配色トーン** | ダークファンタジー基調（深い青〜紫〜黒のグラデーション背景） |
| **画風** | アニメ調コンセプトアート。主線はやや太め。人物は登場させず構造物・風景を中心に描写。 |
| **テキスト** | 画像内にはテキストを一切含めないこと |
| **構図** | 中央下部にストーリーテキストが重なるため、画像の視覚的焦点は上半分〜中央寄りに配置 |

### 世界観キーワード

- 異常構造体「IPNE」：出現から72時間、内部が絶えず変化するダンジョン
- 壁面は脈動し、通路は不規則に再構成される
- 有機的かつ幾何学的な構造（生物と機械の中間のイメージ）
- 各層の「核」と呼ばれる制御装置がキーオブジェクト
- 暗い中に発光する紋様・回路のような模様が走る

---

## 画像一覧（9 枚）

### 1. `prologue_scene_1` — 任務ブリーフィング

| 項目 | 内容 |
|------|------|
| **ファイル名** | `ipne_story_prologue_1.webp` |
| **使用箇所** | プロローグ画面 スライド1（`Prologue.tsx`） |
| **シーン** | 構造体の全景を映す大型モニターの前で任務資料が広げられている |
| **描写要素** | 暗い作戦室、ホログラフィックな構造体の3D投影、散らばった調査報告書、青白い照明 |
| **配色** | 暗い室内に青白い光源。モニターの発光が中央に |
| **ムード** | 緊張感、未知への不安、静かな決意 |

### 2. `prologue_scene_2` — ダンジョン入口

| 項目 | 内容 |
|------|------|
| **ファイル名** | `ipne_story_prologue_2.webp` |
| **使用箇所** | プロローグ画面 スライド2（`Prologue.tsx`） |
| **シーン** | 構造体の外壁に開いた不規則な入口。内部から微かな光が漏れている |
| **描写要素** | 脈動する有機的な外壁、不規則に開閉する入口、地面に落ちる装備の影、内部から漏れる薄紫の光 |
| **配色** | 外部は夜空と暗い岩盤。入口から薄紫〜青紫の光 |
| **ムード** | 畏怖、未知の空間への入口、生物的な気味悪さ |

### 3. `prologue_scene_3` — 閉じた入口

| 項目 | 内容 |
|------|------|
| **ファイル名** | `ipne_story_prologue_3.webp` |
| **使用箇所** | プロローグ画面 スライド3（`Prologue.tsx`） |
| **シーン** | 振り返った先の入口が完全に塞がっている。滑らかに閉じた壁面のみ |
| **描写要素** | 閉じた壁面（継ぎ目すら見えない）、壁面に走る淡い発光紋様、暗い通路の先に微かな光源 |
| **配色** | 暗い壁面に淡い紫〜青の発光ライン。奥に進む通路の微かな光 |
| **ムード** | 閉所感、退路断絶、孤立感、前に進むしかない覚悟 |

### 4. `story_stage_1` — 第一層突破

| 項目 | 内容 |
|------|------|
| **ファイル名** | `ipne_story_stage_1.webp` |
| **使用箇所** | ステージ1クリア後のストーリー画面（`StageStory.tsx`） |
| **シーン** | 最初の核を停止させた直後の空間。壁の震動が収まりつつある |
| **描写要素** | 停止した球形の核（光が消えかけ）、安定しかけた壁面、新たに開いた下層への通路、冷えた空気を暗示する霧 |
| **配色** | 青〜シアン基調。核の残光がオレンジ〜白 |
| **ムード** | 小さな達成感、だが先への不安。冷たく静謐な空間 |

### 5. `story_stage_2` — 深部への接近

| 項目 | 内容 |
|------|------|
| **ファイル名** | `ipne_story_stage_2.webp` |
| **使用箇所** | ステージ2クリア後のストーリー画面（`StageStory.tsx`） |
| **シーン** | 壁の紋様が複雑化し、通路が不規則に分岐している |
| **描写要素** | 複雑化した壁面の発光紋様、増えた分岐路、一部が行き止まりに変化している痕跡、歪んだ通路 |
| **配色** | 紫〜ダークマゼンタ基調。紋様の発光が白〜薄紫 |
| **ムード** | 迷宮の知性、侵入者への拒絶、不穏さの増大 |

### 6. `story_stage_3` — 異変

| 項目 | 内容 |
|------|------|
| **ファイル名** | `ipne_story_stage_3.webp` |
| **使用箇所** | ステージ3クリア後のストーリー画面（`StageStory.tsx`） |
| **シーン** | 壁面にひびが入り、そこから光が漏れている。壁が不自然に増殖 |
| **描写要素** | ひび割れた壁面から漏れる強い光、有機的に増殖する壁、歪んだ空間、より攻撃的な雰囲気の通路 |
| **配色** | 赤紫〜深紅の不穏なトーン。ひびからの光はオレンジ〜白 |
| **ムード** | 危険の増大、構造体の防衛反応、世界の変質 |

### 7. `story_stage_4` — 最深部へ

| 項目 | 内容 |
|------|------|
| **ファイル名** | `ipne_story_stage_4.webp` |
| **使用箇所** | ステージ4クリア後のストーリー画面（`StageStory.tsx`） |
| **シーン** | 最後の封鎖が解け、中枢へ続く道が現れた。空間が歪んでいる |
| **描写要素** | 崩壊しかけた封鎖壁、目に見える壁面の脈動、歪んだ空間（遠近感の異常）、強い磁場を暗示する光の乱れ |
| **配色** | 深い暗黒に金〜オレンジの発光。歪んだ空間表現 |
| **ムード** | 最終決戦前の緊張、圧倒的な存在感、覚悟 |

### 8. `story_stage_5` — 封鎖解除

| 項目 | 内容 |
|------|------|
| **ファイル名** | `ipne_story_stage_5.webp` |
| **使用箇所** | ステージ5クリア後のストーリー画面（`StageStory.tsx`） |
| **シーン** | 全核停止後、迷宮が静まり封鎖が解除された。遠くに光が見える |
| **描写要素** | 脈動の止まった壁面、固定された通路、遠方に見える出口の光、通信回復を暗示する微かな電波パターン |
| **配色** | 落ち着いた青〜白基調。出口方向に希望を感じる暖色の光 |
| **ムード** | 解放感、達成感、長い旅の終わり、静寂と安堵 |

### 9. `game_over` — 冒険の終わり

| 項目 | 内容 |
|------|------|
| **ファイル名** | `ipne_story_game_over.webp` |
| **使用箇所** | ゲームオーバー画面での将来利用（`storyImages.ts` に登録済み） |
| **シーン** | 意識が遠のく中、構造体の壁がゆっくりと閉じていく |
| **描写要素** | 閉じかけた壁面（視界が狭まる表現）、薄れていく光、最後まで動く記録装置の微かな赤いランプ |
| **配色** | 暗黒基調。微かな赤い光のみ。ビネット効果で視界の端が暗い |
| **ムード** | 喪失、無念、だが希望の欠片（記録は残る） |

---

## 差し替え手順

### 1. 画像ファイルの配置

生成した WebP 画像を以下のディレクトリに配置する:

```
src/assets/images/
├── ipne_story_prologue_1.webp
├── ipne_story_prologue_2.webp
├── ipne_story_prologue_3.webp
├── ipne_story_stage_1.webp
├── ipne_story_stage_2.webp
├── ipne_story_stage_3.webp
├── ipne_story_stage_4.webp
├── ipne_story_stage_5.webp
└── ipne_story_game_over.webp
```

### 2. `storyImages.ts` の修正

Canvas プレースホルダー生成を、import した実画像に差し替える:

```typescript
// ---- 変更前 ----
// Canvas API でプレースホルダーを動的生成
function createPlaceholder(alt: string, width: number, height: number): string { ... }

export function getStoryImage(key: string): StoryImageEntry | undefined {
  // ...
  const entry: StoryImageEntry = {
    src: createPlaceholder(def.alt, def.width, def.height),
    // ...
  };
}

// ---- 変更後 ----
// 実画像を import
import imgPrologue1 from '../../assets/images/ipne_story_prologue_1.webp';
import imgPrologue2 from '../../assets/images/ipne_story_prologue_2.webp';
import imgPrologue3 from '../../assets/images/ipne_story_prologue_3.webp';
import imgStage1 from '../../assets/images/ipne_story_stage_1.webp';
import imgStage2 from '../../assets/images/ipne_story_stage_2.webp';
import imgStage3 from '../../assets/images/ipne_story_stage_3.webp';
import imgStage4 from '../../assets/images/ipne_story_stage_4.webp';
import imgStage5 from '../../assets/images/ipne_story_stage_5.webp';
import imgGameOver from '../../assets/images/ipne_story_game_over.webp';

// 画像キー → import マッピング
const IMAGE_SOURCES: Record<string, string> = {
  prologue_scene_1: imgPrologue1,
  prologue_scene_2: imgPrologue2,
  prologue_scene_3: imgPrologue3,
  story_stage_1: imgStage1,
  story_stage_2: imgStage2,
  story_stage_3: imgStage3,
  story_stage_4: imgStage4,
  story_stage_5: imgStage5,
  game_over: imgGameOver,
};

export function getStoryImage(key: string): StoryImageEntry | undefined {
  const def = IMAGE_DEFINITIONS[key];
  if (!def) return undefined;

  return {
    src: IMAGE_SOURCES[key],  // import 済み画像パスを使用
    alt: def.alt,
    width: def.width,
    height: def.height,
  };
}
```

### 3. 変更不要な箇所

以下のファイルは画像差し替え時に **修正不要**:

- `Prologue.tsx` — `getStoryImage()` 経由で取得するため変更不要
- `StageStory.tsx` — 同上
- `FinalClear.tsx` — `getEndingImage()` を使用（既存の実画像。今回の対象外）
- `story.ts` — `imageKey` 文字列のみ保持。変更不要
- コンポーネントの `<img>` / styled component — src を受け取るだけのため変更不要

### 4. 検証

```bash
npm run build
```

- ビルド成功を確認（Webpack が WebP ファイルをバンドル）
- ブラウザでプロローグ → ステージクリア → エンディングの各画面遷移を目視確認
- 画像が正しいタイミング・シーンで表示されることを確認

---

## 既存画像アセット一覧（参考）

以下は既に実画像として存在するアセット。今回の生成対象外:

| ファイル名 | 用途 | 備考 |
|-----------|------|------|
| `ipne_title_bg.webp` | タイトル画面背景（デスクトップ） | 既存 |
| `ipne_title_bg_mobile.webp` | タイトル画面背景（モバイル） | 既存 |
| `ipne_prologue_bg.webp` | プロローグ画面背景（デスクトップ） | 既存 |
| `ipne_prologue_bg_mobile.webp` | プロローグ画面背景（モバイル） | 既存 |
| `ipne_class_warrior.webp` | 職業選択:戦士 | 既存 |
| `ipne_class_thief.webp` | 職業選択:盗賊 | 既存 |
| `ipne_ending_s.webp` | Sランクエンディング | 既存 |
| `ipne_ending_a.webp` | Aランクエンディング | 既存 |
| `ipne_ending_b.webp` | Bランクエンディング | 既存 |
| `ipne_ending_c.webp` | Cランクエンディング | 既存 |
| `ipne_ending_d.webp` | Dランクエンディング | 既存 |
| `ipne_game_over.webp` | ゲームオーバー画面 | 既存（`ending.ts` 経由） |
| `ipne_ending_s.mp4` | Sランク特別動画 | 既存 |

> **注意**: `ipne_game_over.webp`（既存）は `ending.ts` の `getGameOverImage()` から参照されるゲームオーバー画面用。
> 今回生成する `game_over` キーの画像（`ipne_story_game_over.webp`）は `storyImages.ts` のレジストリ用で別用途。将来的にゲームオーバー画面を拡張する際に使用する。
