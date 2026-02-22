# AQS ブラッシュアップ計画: キャラクタープロフィール & スクロール改善

## 背景

Agile Quiz Sugoroku には README で「猫エンジニア、犬PM、うさぎテスター」の3キャラクターが定義されているが、
ゲーム内に詳細プロフィールは存在せず、画像の中にのみ登場している。
また、GuideScreen 等のスクロール時にデフォルトブラウザのスクロールバーが表示され、
ダークネオンテーマと不調和を起こしている。

## 目的

1. 3キャラクターの詳細プロフィールを定義し、遊び方&チーム紹介画面に掲載する
2. 画像生成は別AIで行うため、プロンプト/仕様を分離して管理する（spec.md Part 2）
3. ゲーム全体のスクロールバーを世界観に合わせたカスタムスタイルに変更する

## フェーズ構成

### Phase 1: カスタムスクロール実装

| ファイル | 変更内容 |
|---------|---------|
| `components/styles/common.ts` | `css` インポート追加、`aqsScrollbar` ミックスイン、`ScrollablePanel` 追加 |
| `components/GuideScreen.tsx` | `Panel` → `ScrollablePanel` 置換、インライン `overflow`/`maxHeight` 削除 |
| `components/ResultScreen.tsx` | `Panel` → `ScrollablePanel` 置換 |
| `components/StudyResultScreen.tsx` | `Panel` → `ScrollablePanel` 置換 |

### Phase 2: キャラクタープロフィール実装

| ファイル | 変更内容 |
|---------|---------|
| `character-profiles.ts` (新規) | `CharacterProfile` インターフェース + 3キャラデータ |
| `images.ts` | キャラクター画像インポート + `characters` キー追加 |
| `components/GuideScreen.tsx` | TEAM セクション追加（ABOUT 直後、HOW TO PLAY 前） |

### Phase 3: 画像準備（別AI向け分離作業）

- spec.md Part 2 に5枚分の画像生成プロンプトを記載
- コード側は画像なしでも emoji フォールバックで完全動作

### Phase 4: ドキュメント更新

| ファイル | 変更内容 |
|---------|---------|
| `README.md` | キャラクタープロフィールセクション追加 |

## 技術方針

- `styled-components` の `css` ヘルパーでスクロールバーミックスインを作成
- WebKit + Firefox 両対応
- 画像は `onError` フォールバックパターンを既存コード（GuideScreen L191-219）から踏襲
- キャラクターデータは `character-profiles.ts` に分離して単一責任を維持
