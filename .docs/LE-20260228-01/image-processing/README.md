# 迷宮の残響 — 画像透過処理

## 概要

Antigravity で生成された画像のうち、透過が必要な11枚を Python + Pillow で透過変換する。

AI画像生成ツールは透過画像を直接生成できないため、以下の2段階アプローチで対応：
1. 既存画像に対するプログラム的な透過処理
2. 品質不足の画像は Antigravity で再生成 → 再度スクリプトで透過変換

## 前提条件

- Python 3.x
- Pillow (`pip install Pillow`)

## 手順フロー

```
1. process_images.py 実行 → 11枚を透過処理
2. verify_images.py 実行 → 処理結果を自動検証
3. 目視確認 → 品質不足の画像を特定
4. (必要に応じて) Antigravity で再生成 → 再度処理
5. npm run build → ビルド確認
```

## 透過処理の3パターン

| パターン | 対象 | 枚数 | 概要 |
|---------|------|------|------|
| 楕円グラデーションマスク | `le_overlay_*.webp` | 5枚 | 中央透明、端のエフェクト残す |
| 矩形ビネットマスク | `le_bg_*_near.webp` | 5枚 | 中央透明、フレーム的効果 |
| 輝度ベースアルファ | `le_title_mid.webp` | 1枚 | 暗部を透明に |

## 関連ドキュメント

- [01-diagnosis.md](./01-diagnosis.md) — 現状診断
- [02-regeneration-specs.md](./02-regeneration-specs.md) — 再生成仕様
- [03-processing-specs.md](./03-processing-specs.md) — 透過処理技術仕様
- [04-checklist.md](./04-checklist.md) — チェックリスト
