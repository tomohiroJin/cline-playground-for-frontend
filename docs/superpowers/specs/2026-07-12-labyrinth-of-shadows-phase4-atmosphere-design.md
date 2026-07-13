# Labyrinth of Shadows Phase 4「雰囲気パス」設計

- 日付: 2026-07-12
- 対象: `src/features/labyrinth-of-shadows/`
- フェーズ: 抜本改修4フェーズの Phase 4（演出・仕上げ）
- 前提: Phase 1（3D化 #162）/ Phase 2（逃走再設計 #163）/ Phase 3（アイテム再設計 #164）マージ済み

## 目的と背景

3D化・ゲーム性・アイテムの再設計を終え、ルールとしては「まともに遊べる」水準に達した。
残る課題はユーザーの言う「もう少しクォリティが無いとつらい」— **空間の質感と照明の安っぽさ**である。

現状のビジュアルは以下の弱点を持つ:

- 壁が InstancedMesh のフラット単色（`#3a3630`）で、のっぺりして石壁に見えない
- 後処理（bloom）が皆無で、発光体（アイテム・敵・出口）の光がにじまず立体感が乏しい
- 床・天井も単色平面で質感がない
- トーチは camera 位置の点光源のみで、光源としての存在感（炎）がない

本 spec は **「空間の質感・照明・後処理」に純化**する。難易度カーブや P3 バランス較正
（罠半径8 / 敵表示5秒 / 加速上限2）は本 spec の対象外とし、別 spec に切り出す。

## 方針（確定事項）

ブレストで以下を確定した:

1. **技術スコープ**: 後処理ライブラリの導入を許容する（`@react-three/postprocessing` + `postprocessing`）
2. **ムード**: 現行の暗紫フォグ＋トーチ基調を「深化」させる。冷たい石壁の青グレー × トーチの橙火の対比、
   bloom で炎と発光体をにじませ、ホラーの緊張感を強化する（路線変更はしない）
3. **アプローチ**: 「A. 雰囲気パス」— Bloom+Vignette / 石積みテクスチャ / 照明再調整 / 炎メッシュ を束ねた
   焦点を絞った高インパクト構成。SSAO・色収差・粒子等の重量級効果は非目標とする

## アーキテクチャ（テスト可能性の確保）

R3F コンポーネントは jsdom でテスト不可（air-hockey と同じ制約）。
そのため **「見た目を決める数値・生成ロジック」を純粋モジュールに切り出し**、TDD 可能な範囲を最大化する。
R3F 配線・マテリアル指定・エフェクト合成そのものは目視QAで担保する。

| モジュール | 種別 | 新規/変更 | テスト |
|-----------|------|-----------|--------|
| `presentation/three/textures/stone-texture.ts` | 純粋: 石積みの color/roughness/normal ピクセルを型付き配列（`Uint8Array`）へ決定論的生成。canvas API 非依存 | 新規 | ✅ ユニット（出力サイズ・シード決定性・チャンネル値域） |
| `presentation/three/lighting-config.ts` | 純粋: ムード色定数・距離減衰・フリッカ合成・bloom パラメータ導出 | 新規 | ✅ ユニット |
| `presentation/three/PostFx.tsx` | R3F: EffectComposer + Bloom + Vignette | 新規 | ❌ 目視QA |
| `presentation/three/TorchFlame.tsx` | R3F: 一人称手元の炎メッシュ（bloom 対象）。フリッカ計算は lighting-config へ委譲 | 新規 | 純関数のみテスト |
| `presentation/three/MazeWalls.tsx` | stone-texture を適用（color/roughness/normal マップ） | 変更 | ❌ |
| `presentation/three/FloorCeiling.tsx` | 床＝湿った石畳、天井＝より暗い質感を付与 | 変更 | ❌ |
| `presentation/three/LabyrinthScene.tsx` | PostFx を Canvas 内に組み込み、fog/ambient を lighting-config 参照に | 変更 | ❌ |
| `presentation/three/GameController.tsx` | トーチ色・強度・フリッカを lighting-config 参照に | 変更 | ❌ |
| `infrastructure/rendering/brick-texture.ts`（`getBrickColor`） | 旧・疑似3D（レイキャスト）時代のデッドコード。削除し `index.ts` の再エクスポートも掃除 | 削除 | 参照掃除 |

### 依存の追加

- `@react-three/postprocessing`, `postprocessing` を `dependencies` に追加
- **第一リスク**: peer 依存が `@react-three/fiber@9.6.1` / `three@0.185.1` と互換か。
  実装の最初のタスクでバージョン整合を検証し、必要なら対応バージョンにピン留めする
- webpack `webpack.config.ts` の `vendor-three` cacheGroup の test を
  `/[\\/]node_modules[\\/](three|@react-three)[\\/]/` から
  `/[\\/]node_modules[\\/](three|@react-three|postprocessing)[\\/]/` に拡張。
  ベースの `postprocessing` パッケージが `vendors`（メイン寄り）チャンクに落ちて
  初期ロードを膨らませるのを防ぐ

## 各パスの詳細

### 1. 後処理（Bloom + Vignette）

- `PostFx.tsx` で `EffectComposer` に `Bloom` と `Vignette` を積む
- **Bloom**: `luminanceThreshold` を発光体（アイテム / 敵の目 / 出口ランプ / トーチ炎）の
  emissive だけが閾値を超えるよう調整する。壁・床・天井はにじませない（表面質感はテクスチャで出す）
- **Vignette**: 周辺をわずかに落として閉塞感と視線集中を作る
- パラメータ（閾値・強度・半径・vignette darkness）は `lighting-config.ts` に定数として集約

### 2. 壁・床・天井のマテリアル刷新

- `stone-texture.ts` が石積みの **color / roughnessMap / normalMap** のピクセルを
  `Uint8Array`（RGBA）へ決定論的に生成する純関数を提供する。**canvas API に依存しない**
  （jsdom は canvas 2D の `getImageData` を標準実装しないため、canvas 依存だと純粋モジュールが
  テスト不能になる）。R3F 側はこの配列を `THREE.DataTexture` に渡してマップとして供給する
- 生成は決定論的（同一入力→同一出力）にしてユニットテスト可能にする
- 冷たい青グレー基調に微妙な色ムラと目地。`MazeWalls`（InstancedMesh）へ適用（UV は box 標準）
- 床＝湿った石畳（やや反射）、天井＝より暗くフラット。roughness/metalness を質感別に調整

### 3. 照明の再調整＋トーチ炎

- トーチ点光源: 温かい橙、多周波フリッカ（既存の合成式を `lighting-config` の純関数へ抽出）
- 一人称の手元に**小さな炎メッシュ**（`TorchFlame.tsx`, 発光マテリアル）を追加 → bloom で揺らめく光源として見える
- 環境光・フォグの寒暖対比を再調整（トーチ橙 vs 石壁の寒色）。色は `lighting-config` に集約
- 出口グロー: 開放時に bloom で強調（既存の脈動演出は維持）

### 4. パフォーマンス＆アクセシビリティ

- 目標: デスクトップ 900×560 で滑らかに動作（既存の敵・アイテム点光源に bloom を重ねる負荷を許容範囲に収める）
- `prefers-reduced-motion` 尊重: 炎・出口の脈動と bloom の動的強度変化を抑制する
  （`.claude/rules/design-ui-ux-principles.md` のマイクロアニメーション規約に準拠）
- 過負荷が判明した場合に bloom 解像度／効果を段階的に落とせるよう、パラメータは lighting-config に集約しておく

## テスト戦略

- **純粋モジュール（TDD）**: `stone-texture.ts`（決定性・出力形状・値域）、`lighting-config.ts`
  （フリッカ合成・色/パラメータ導出）、`TorchFlame` のフリッカ関数
- **R3F 配線**: jsdom テスト不可。既存 `geometry.test.ts` の方針に倣い、テスト対象は純関数に限定
- **目視QA**: 実ブラウザで bloom / テクスチャ / 炎 / vignette を確認。
  ヘッドレスはカメラ真下バグ（Phase 1-2 の教訓）を踏まえスクリーンショット誤読に注意し、
  最終確認は実ブラウザで人間の目視を優先する
- CI（lint:ci → typecheck → test:coverage → build → e2e）全パス必須

## 非目標（将来候補）

- SSAO（接触陰影）、色収差、フィルムグレイン、浮遊ダスト粒子、光芒（ゴッドレイ）、
  タンジェント空間の厳密な法線マップ（B案の要素）
- P3 バランス較正（罠半径 / 敵表示秒数 / 加速上限）— 別 spec で扱う
- 難易度カーブ調整・制限時間の再調整

## 完了条件

- Bloom + Vignette が適用され、発光体（アイテム・敵・出口・炎）の光がにじむ
- 壁・床・天井が石積みテクスチャで質感を持つ
- トーチに炎メッシュがあり、bloom で揺らめく
- 旧 `getBrickColor` デッドコードが削除されている
- `prefers-reduced-motion` が尊重される
- 新規純粋モジュールのユニットテストが緑、CI 全パス
- 実ブラウザ目視で「空間の質感・照明」の改善が確認できる
