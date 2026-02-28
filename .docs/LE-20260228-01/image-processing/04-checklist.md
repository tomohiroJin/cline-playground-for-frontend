# 画像透過処理チェックリスト

## 工程1: スクリプト作成

- [ ] `process_images.py` 作成
- [ ] `verify_images.py` 作成
- [ ] ドキュメント一式作成

## 工程2: 透過処理実行

- [ ] `process_images.py` 実行
- [ ] `verify_images.py` で自動検証パス

### 個別画像確認

#### オーバーレイ（楕円グラデーションマスク）
- [ ] `le_overlay_injured.webp` — 中央透明、端にひび割れ効果
- [ ] `le_overlay_bleeding.webp` — 中央透明、端に血飛沫
- [ ] `le_overlay_fear.webp` — 中央透明、端に紫の霧
- [ ] `le_overlay_curse.webp` — 中央透明、端にルーン文字
- [ ] `le_overlay_confused.webp` — 中央透明、端に渦巻き効果

#### 近景レイヤー（矩形ビネットマスク）
- [ ] `le_bg_1_near.webp` — 中央透明、端にダンジョン要素
- [ ] `le_bg_2_near.webp` — 中央透明、端にスチームパンク要素
- [ ] `le_bg_3_near.webp` — 中央透明、端にキノコ森要素
- [ ] `le_bg_4_near.webp` — 中央透明、端にゴシック図書館要素
- [ ] `le_bg_5_near.webp` — 中央透明、端に有機ホラー要素

#### タイトル中景（輝度ベースアルファ）
- [ ] `le_title_mid.webp` — 暗部透明、廃墟構造物が残る

## 工程3: 品質確認

- [ ] 各画像を目視確認
- [ ] 再生成が必要な画像を特定（候補: injured, fear, confused）

## 工程4: 再生成（必要な場合）

- [ ] Antigravity で再生成
- [ ] 再生成画像に `process_images.py` 再実行
- [ ] 再検証

## 工程5: 最終検証

- [ ] `npm run build` 成功
- [ ] パララックス背景: far → mid → near の3層重なり確認
- [ ] ステータスオーバーレイ: 端エフェクト＋中央透過確認
- [ ] タイトル: far(星雲) → mid(廃墟) の2層重なり確認
