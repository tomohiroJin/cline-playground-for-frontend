# KEYS & ARMS

## 概要

既存ブラウザ実装の挙動を `src/features/keys-and-arms/` へ段階移植中です。

## 現在の実装状態

- `KeysAndArmsPage` から旧埋め込みフレーム実装を撤廃
- React + TypeScript のゲームコンポーネントを導入
- 入力/保存/音/更新/描画の基礎モジュールを作成

## 既知の未完了項目

- Stage 1/2/3 の詳細ロジック（敵・当たり判定・演出）
- 元HTMLと同等のスプライト群
- BGM/SFX のタイミング完全一致
- 同等性レポート `parity-report.md` の PASS 化

## 主要ファイル

```text
src/features/keys-and-arms/
  KeysAndArmsGame.tsx
  constants.ts
  types.ts
  input.ts
  storage.ts
  audio.ts
  engine/
    update.ts
    transitions.ts
    scoring.ts
    collision.ts
  render/
    renderer.ts
    sprites.ts
    effects.ts
```
