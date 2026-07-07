# Picture Puzzle ギャラリー化 フェーズ2「収蔵コレクション」設計書

> 親設計書: `2026-07-07-picture-puzzle-gallery-brushup-design.md`（全4フェーズの俯瞰）
> 本書はフェーズ2の実装レベル設計。フェーズ1（PR #158、main マージ済）の続き。

## 1. 目的

パズルを解くたびに絵を自分の美術館に「収蔵」していく達成感を可視化する。
既存の「クリア履歴／ベストスコア」を美術館メタファーの**収蔵目録**へ再設計する。

**★方針: 新規永続データを足さない。** 既存の `PuzzleRecord`（`puzzle_records`）・
累計クリア（`puzzle_total_clears`）・`themes`（6室15点）の読み替えのみで実現する。

## 2. スコープと安全境界（親設計書 §4 を厳守）

picture-puzzle 専用コードのみ変更し、他12ゲームへ波及させない。

- 触ってよい: `src/pages/PuzzlePage.tsx` / `src/components/*`(puzzle 専用) /
  `src/components/molecules/*` / `src/domain/*`(新規 collection のみ) / `src/store/atoms.ts`
- 触らない: `src/styles/GlobalStyle.ts` / `src/styles/tokens/*` / `src/App.tsx` /
  `src/pages/GameListPage.tsx` / `src/features/*`
- 新規ビューは `PuzzlePageContainer` 配下に置き、`gallery-theme.ts` のトーンを自動適用する。

## 3. データ基盤（調査で確定した事実）

- **結合キー**: `PuzzleRecord.imageId` == `themes[].images[].id`（filename から拡張子除去で一致）。
- **収蔵判定**: `clearCount > 0` の imageId = 収蔵済み。
- **粒度のミスマッチ**: レコードは imageId × division 粒度。1作品を複数難易度でクリアすると
  複数レコードになるため、「作品」単位に集約する読み替えが必要（本フェーズの主要な新規ロジック）。
- **展示室構成**: 6室・計15点。
  | themeId | 名前 | 画像数 | アンロック条件 |
  |---|---|---|---|
  | illustration-gallery | イラストギャラリー | 2 | always |
  | world-scenery | 世界の風景 | 2 | always |
  | nostalgia | ノスタルジー | 2 | always |
  | sea-and-sky | 海と空 | 3 | clearCount ≥ 5 |
  | four-seasons | 四季 | 3 | clearCount ≥ 10 |
  | mystery | ミステリー | 3 | 他5テーマ全クリア |
- **制約**: 初収蔵日は未保持（`lastClearDate`＝最終クリア日のみ）。目録の日付表示は
  lastClearDate で代用し、「初収蔵日」は表示しない（新規保存を避けるため）。

## 4. 設計判断（本フェーズで確定）

1. **収蔵目録ビューの配置＝独立フルスクリーンビュー**（推奨案）。
   `PuzzlePage.tsx` に第4のビュー状態 `showCollection` を追加し、タイトル画面「入館する」の
   隣に「収蔵目録を見る」導線を置く。美術館の展示室を巡る没入体験にする。既存
   `ClearHistoryList`（ベストスコア／履歴）は目録内へ統合する。
2. **名誉学芸員ゴール＝段階ゴール**（推奨案）。
   - 第1目標: 全15点**収蔵**（各1回クリア）
   - 最上位: 全15点**★★★鑑定収蔵**
   - 目録上部に2段プログレスで併記し、近い目標と遠い目標を両立させ継続動機を保つ。

## 5. アーキテクチャ

### ドメイン層（新規・純粋関数）

`src/domain/collection/collection-service.ts`（UI 非依存・テスト容易）:

```
aggregateByArtwork(records: PuzzleRecord[]): ArtworkStatus[]
  同一 imageId を集約: clearCount 合算 / bestScore=max / bestRank=最高 /
  bestTime=min / bestMoves=min / lastClearDate=最新

buildRoomCollections(themes, records, totalClears): RoomCollection[]
  展示室ごとに { themeId, name, isUnlocked, unlockHint, collected/total, artworks[] } を構築
  アンロック判定は既存 theme-unlock-service を再利用

evaluateCuratorGoal(themes, records): CuratorGoal
  { collected: n/15, appraised3star: m/15, isHonorary: boolean }
```

型は `src/types/` または `src/domain/collection/types.ts` に定義（`ArtworkStatus`,
`RoomCollection`, `CuratorGoal`）。既存 `PuzzleRank` を再利用する。

### プレゼンテーション層（新規コンポーネント・gallery テーマ配下）

```
CollectionView.tsx（中核ビュー）
├─ CuratorGoalBanner.tsx  … 名誉学芸員への2段プログレス（収蔵コンプ / ★★★コンプ）
├─ RoomWall.tsx（展示室ごと）
│   ├─ RoomHeader         … 展示室名 + 収蔵率バー（ThemeSelector の計算を流用）
│   └─ ArtworkFrame.tsx[] … 3状態を描画
│        収蔵済み: ArtFrame で額装した画像 + 鑑定評価（★）+ ベスト実績
│        未収蔵  : 空フレーム（プレースホルダ）
│        未開館室: 「あと○点で開館」表示（室単位）
└─ 既存 ClearHistoryList の内容（ベストスコア/履歴）を折り畳みで統合
```

- 額装は既存 `ArtFrame`（フェーズ1）を再利用する。
- スタイルは各 `.styles.ts` に分離し、色は `galleryTokens` を参照する。

### 画面遷移 / データフロー

`PuzzlePage.tsx` に `showCollection` 状態を追加（`showTitle`/`gameStarted` と同様の分岐）:

```
タイトル ──「収蔵目録を見る」──▶ CollectionView ──「戻る」──▶ タイトル
```

データは既存の読込フロー（gameStarted / ビュー変化時に atoms から取得）を流用し、
`recordStorage.getAll()` + `themes` + `totalClearsStorage.get()` を collection-service に渡す。
新規 localStorage キー・新規 use-case は追加しない（読み取り専用の派生計算のため）。

## 6. エラー処理・エッジケース

- レコード0件: 全フレーム空 +「最初の一枚を収蔵しましょう」訴求。
- 未開館展示室: 室ヘッダにアンロック条件文言（theme-unlock-service の条件を読み替え）。
  室内の作品フレームは伏せる or シルエット表示。
- 集約時の null/空配列（bestMoves=null 等）を安全に畳む。
- 同一作品を複数難易度でクリア: 集約して1フレーム。ベスト実績は最良値を表示。

## 7. テスト方針（TDD・親設計書 §6 準拠）

- `collection-service.test.ts`: 集約・収蔵率・ゴール判定（ドメイン 90%+）。
  代表ケース: 0件 / 一部収蔵 / 全収蔵 / 全★★★ / 複数難易度集約 / 未開館室。
- `CollectionView.test.tsx` ほか: 3状態フレーム描画・空状態・導線・戻る操作。
- 回帰: 他ゲーム1本以上をブラウザで開き背景・配色・タイポが従来どおりか確認（親 §4 手順）。

## 8. 受け入れ基準

- [ ] 既存の履歴・ベストスコアが目録として正しく表示される。
- [ ] 展示室ごとの収蔵率・全体収蔵率が正しく算出される。
- [ ] ★★★再収蔵で鑑定評価が更新される。
- [ ] 名誉学芸員の2段プログレス（収蔵コンプ／★★★コンプ）が正しく表示される。
- [ ] 既存 localStorage データを壊さない（新規キー追加なし）。
- [ ] 他12ゲームの見た目に影響しない（gallery テーマ局所適用の維持）。

## 9. アウトオブスコープ（YAGNI）

- 初収蔵日・達成日時の記録（新規永続データが必要なため見送り）。
- 難易度ごとの収蔵バッジの細分表示（作品単位に集約して簡潔に保つ）。
- 収蔵目録の共有・エクスポート（フェーズ管理外）。
