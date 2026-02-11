# KEYS & ARMS 移植事前分析（Phase 0）

## 1. 元実装棚卸し

- ファイル: `.tmp/keys-and-arms.html`
- 総行数: 2522
- 主要構成:
  - HTML: 本体シェル、canvas、仮想D-pad/ACT/RSTボタン
  - CSS: LCD筐体風スタイル、レスポンシブ縮小
  - JavaScript:
    - ユーティリティ（乱数/描画ヘルパ）
    - パーティクル/ポップアップ共通処理
    - 入力管理（`kd`/`jp`）
    - 音声（Web Audio API）
    - ステージ別ロジック（Cave / Grass / Boss）
    - エンディング表示（Normal / True）
    - 30TPS固定tick + `requestAnimationFrame`

## 2. 状態遷移図

```text
title
  └─(start)→ cave
cave
  ├─(clear)→ transition("STAGE 2") → grass
  └─(hp <= 0)→ over
grass
  ├─(clear)→ transition("STAGE 3") → boss
  └─(hp <= 0)→ over
boss
  ├─(clear & loop=1)→ ending1
  ├─(clear & true条件)→ trueEnd
  ├─(clear & それ以外)→ transition("LOOP n") → cave
  └─(hp <= 0)→ over
over
  └─(act)→ title
ending1
  ├─(act)→ transition("LOOP 2") → cave
  └─(esc)→ title
trueEnd
  ├─(act)→ transition("LOOP 4 — BEYOND") → cave
  └─(esc)→ title
```

## 3. sprite / 描画分割単位

- `render/sprites.ts`
  - 主人公各姿勢、敵、アイコン、背景小物のピクセル配列
- `render/effects.ts`
  - パーティクル、ポップアップ、画面シェイク、ヒットフラッシュ
- `render/renderer.ts`
  - 共通描画（背景・HUD）
  - ステージ描画（`drawCave` / `drawGrass` / `drawBoss`）
  - スクリーン描画（`drawTitle` / `drawOver` / `drawEnding1` / `drawTrueEnd`）

## 4. 移植時の制約

- 描画順序は元実装互換を維持（背景→オブジェクト→エフェクト→HUD）
- 音声はユーザー操作後に初期化
- localStorageキーは競合回避して再定義
- 入力は keyboard + pointer で共通イベントモデルに寄せる
