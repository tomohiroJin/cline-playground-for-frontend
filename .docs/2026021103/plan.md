# KEYS & ARMS 完全移植計画

## 方針: カプセル化エンジンアプローチ

元の JS 2,458行を **1つのクロージャ関数 `createEngine()` に丸ごと格納**し、
React は薄いラッパーとしてのみ機能する。

## アーキテクチャ

```
KeysAndArmsPage.tsx (既存書き換え)
  └→ KeysAndArmsGame.tsx (新規: Canvas + ゲームボーイ風UI)
       └→ engine.ts (新規: 元JS 2,458行をクロージャに格納)
       └→ styles.ts (新規: 元CSS → styled-components)
```

## 元コードからの改変箇所（10箇所未満）

| # | 元コード | 移植後 | 理由 |
|---|---------|--------|------|
| 1 | `document.getElementById('cv')` | 引数 `canvas` | DOM依存除去 |
| 2 | `cv.getContext('2d')` | `canvas.getContext('2d')` | 同上 |
| 3 | `addEventListener('resize', resize)` | 削除（React側で管理） | クリーンアップ |
| 4 | `addEventListener('keydown', ...)` | 削除（React側で管理） | React DOM |
| 5 | `addEventListener('keyup', ...)` | 削除（React側で管理） | React DOM |
| 6 | `querySelectorAll('[data-key]')` | 削除（React側で管理） | React DOM |
| 7 | `requestAnimationFrame(frame)` (初回) | `start()` メソッド内に移動 | ライフサイクル |
| 8 | `AudioContext\|webkitAudioContext` | `(window as any)` キャスト | TypeScript |
| 9 | resize内の `innerWidth/innerHeight` | 引数canvas経由 | React ref |

## 実装フェーズ

### Phase 0: ドキュメント作成
### Phase 1: 骨格 + 全コード移植
### Phase 2: テスト・ビルド確認
