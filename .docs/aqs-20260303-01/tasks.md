# Agile Quiz Sugoroku ブラッシュアップ (Phase 2) - タスクチェックリスト

---

## Phase 2a（完了済み）

### 1. ドキュメント作成
- [x] `.docs/aqs-20260303-01/plan.md` 作成
- [x] `.docs/aqs-20260303-01/spec.md` 作成
- [x] `.docs/aqs-20260303-01/tasks.md` 作成

### 2. TEAMメンバー順番修正
- [x] `character-profiles.ts` の配列順を タカ→イヌ→ネコ→ウサギ に変更

### 3. 画像スタイル微調整
- [x] GuideScreen: チームバナーを `height: 'auto'` に変更
- [x] GuideScreen: キャラクター画像 48→52px
- [x] GuideScreen: エンジニアタイプ画像 48→52px
- [x] ResultScreen: ビルド成功画像 60→80px + `contain`
- [x] ResultScreen: エンジニアタイプ画像 80→88px
- [x] ResultScreen: タカアバター 52→56px
- [x] `npm test` パス確認（180スイート / 2522テスト）

---

## Phase 2b（新規：ペンギン追加 & 画像統一リニューアル）

### 4. ペンギン（スクラムマスター）キャラクター追加

#### コード変更
- [ ] `character-profiles.ts` にペンギンのプロフィール追加
- [ ] `character-profiles.ts` のイヌの role を「プロダクトオーナー」に変更
- [ ] `character-profiles.ts` のイヌの skills を PO 専任に更新
- [ ] `character-profiles.ts` の配列順を最終確定: タカ→イヌ→ペンギン→ネコ→ウサギ
- [ ] `constants.ts` にペンギン用カラー `COLORS.blue`（`#4FC3F7`）追加（ウサギの cyan と被り回避）
- [ ] `images.ts` に `aqs_char_penguin` の import 追加
- [ ] `images.ts` の `AQS_IMAGES.characters` に `penguin` 追加

#### テスト
- [ ] `npm test` で全テストがパス
- [ ] ブラウザで GuideScreen にペンギンが表示される（emoji フォールバック確認）

### 5. 全キャラクター画像の統一リニューアル

#### 画像生成（ユーザー作業）
- [ ] 統一スタイルガイドラインの確認（spec.md セクション4 参照）
- [ ] `aqs_char_taka.webp` - タカ個別画像を生成
- [ ] `aqs_char_penguin.webp` - ペンギン個別画像を生成（新規）
- [ ] `aqs_char_inu.webp` - イヌ個別画像を生成
- [ ] `aqs_char_neko.webp` - ネコ個別画像を生成
- [ ] `aqs_char_usagi.webp` - ウサギ個別画像を生成
- [ ] `aqs_char_team.webp` - チームバナー（5キャラ横並び）を生成
- [ ] `aqs_char_group.webp` - グループ集合画像を生成
- [ ] `aqs_title.webp` - タイトル背景画像を生成

#### 画像配置
- [ ] 生成した画像を `src/assets/images/` に配置
- [ ] ブラウザで各画面の画像表示を目視確認
  - [ ] GuideScreen: チームバナーがつぶれずに表示される
  - [ ] GuideScreen: 5キャラ全員が統一デザインで表示される
  - [ ] ResultScreen: タカアバターが新デザインで表示される
  - [ ] TitleScreen: 背景画像が5キャラ統一デザインで表示される

### 6. 最終検証
- [ ] `npm test` で全テストがパス
- [ ] 全画面の目視確認完了

---

## 今後の実装候補（Phase 3 以降）

- [ ] すごろく要素の強化（案A: サイコロ演出 + 案B: マスの種類多様化）
- [ ] タカのイベント・フィードバック追加画像作成
