# タスク一覧・進捗管理（IPNE MVP3）

## 進捗サマリー

| フェーズ | 状況 | 完了タスク |
|---------|------|-----------:|
| フェーズ0: 型定義・テスト準備 | ✅ 完了 | 3/3 |
| フェーズ1: 職業システム | ✅ 完了 | 2/2 |
| フェーズ2: 成長システム | ✅ 完了 | 2/2 |
| フェーズ3: プレイヤー拡張 | ✅ 完了 | 2/2 |
| フェーズ4: 壁ギミック | ✅ 完了 | 2/2 |
| フェーズ5: 罠システム | ✅ 完了 | 2/2 |
| フェーズ6: 敵AI拡張 | ✅ 完了 | 2/2 |
| フェーズ7: アイテム拡張 | ✅ 完了 | 2/2 |
| フェーズ8: マップ生成拡張 | ✅ 完了 | 2/2 |
| フェーズ9: UI・演出統合 | ✅ 完了 | 4/4 |
| フェーズ10: バランス調整・検証 | ✅ 完了 | 6/6 |
| **合計** | **100%** | **29/29** |

---

## フェーズ0: 型定義・テスト準備（TDD起点）

### Task 0.1: types.ts 拡張
**ファイル**: `src/features/ipne/types.ts`

- [x] 職業関連型定義
  - [x] `PlayerClass` 定数 (`'warrior' | 'thief'`)
  - [x] `PlayerClassValue` 型
  - [x] `ClassConfig` インターフェース
- [x] 成長関連型定義
  - [x] `StatType` 定数 (`'attackPower' | 'attackRange' | 'moveSpeed' | 'attackSpeed' | 'healBonus'`)
  - [x] `StatTypeValue` 型
  - [x] `PlayerStats` インターフェース（attackSpeed, healBonus 追加）
  - [x] `LevelUpChoice` インターフェース
- [x] 罠関連型定義
  - [x] `TrapType` 定数 (`'damage' | 'slow' | 'teleport'`)
  - [x] `TrapTypeValue` 型
  - [x] `TrapState` 定数 (`'hidden' | 'revealed' | 'triggered'`)
  - [x] `TrapStateValue` 型
  - [x] `Trap` インターフェース
- [x] 壁関連型定義
  - [x] `WallType` 定数 (`'normal' | 'breakable' | 'passable' | 'invisible'`)
  - [x] `WallTypeValue` 型
  - [x] `WallState` 定数 (`'intact' | 'damaged' | 'broken' | 'revealed'`)
  - [x] `WallStateValue` 型
  - [x] `Wall` インターフェース
- [x] 敵関連型拡張
  - [x] `EnemyType` に `'ranged'` 追加
  - [x] `FLEE` を `SPECIMEN` にリネーム
- [x] アイテム関連型拡張
  - [x] `ItemType` に `'health_full' | 'level_up' | 'map_reveal'` 追加
- [x] Player型拡張
  - [x] `playerClass: PlayerClassValue` 追加
  - [x] `level: number` 追加
  - [x] `killCount: number` 追加（レベルアップ判定に使用）
  - [x] `stats: PlayerStats` 追加（attackSpeed, healBonus 含む）
  - [x] `slowedUntil: number` 追加
- [x] GameState拡張
  - [x] `traps: Trap[]` 追加
  - [x] `walls: Wall[]` 追加
  - [x] `isLevelUpPending: boolean` 追加

### Task 0.2: テストユーティリティ更新
**ファイル**: `src/features/ipne/__tests__/testUtils.ts`

- [x] `createTestTrap()` - テスト用罠生成ヘルパー
- [x] `createTestWall()` - テスト用壁生成ヘルパー
- [x] `createTestPlayerWithClass()` - 職業付きプレイヤー生成ヘルパー
- [x] `createTestPlayerWithStats()` - 能力値付きプレイヤー生成ヘルパー

### Task 0.3: 既存テスト確認
- [x] `npm test` 実行で既存テストが通ることを確認
- [x] 型変更によるコンパイルエラーがないことを確認
- [x] `npx tsc --noEmit` でTypeScriptエラーがないことを確認

---

## フェーズ1: 職業システム

### Task 1.1: class.ts 新規作成
**ファイル**: `src/features/ipne/class.ts`

- [x] `CLASS_CONFIGS` 定数定義
  - [x] 戦士設定（trapVisibility: 'none', wallVisibility: 'none'）
  - [x] 盗賊設定（trapVisibility: 'faint', wallVisibility: 'faint'）
- [x] `getClassConfig()` 関数
  - [x] 職業に応じた設定を返す
- [x] `canSeeTrap()` 関数
  - [x] 職業と罠状態から可視性を判定
- [x] `canSeeSpecialWall()` 関数
  - [x] 職業と壁状態から可視性を判定
- [x] `getTrapAlpha()` 関数
  - [x] 職業に応じた罠の透明度を返す（戦士:0, 盗賊:0.3）
- [x] `getWallAlpha()` 関数
  - [x] 職業に応じた特殊壁の透明度を返す

### Task 1.2: class.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/class.test.ts`

- [x] 職業設定取得テスト
  - [x] 戦士の設定が正しい
  - [x] 盗賊の設定が正しい
- [x] 罠可視性テスト
  - [x] 戦士は未発見罠が見えない
  - [x] 盗賊は未発見罠が見える（半透明）
  - [x] 両職業で発見済み罠が見える
- [x] 特殊壁可視性テスト
  - [x] 戦士は未発見特殊壁が見えない
  - [x] 盗賊は未発見特殊壁が見える（半透明）

---

## フェーズ2: 成長システム

### Task 2.1: progression.ts 新規作成
**ファイル**: `src/features/ipne/progression.ts`

- [x] `KILL_COUNT_TABLE` 定数定義
  - [x] 各レベルの必要累計撃破数
- [x] `STAT_LIMITS` 定数定義
  - [x] 各能力の上限値（attackSpeed: 0.5, healBonus: 5 追加）
- [x] `LEVEL_UP_CHOICES` 定数定義
  - [x] 5択の選択肢効果（攻撃力/攻撃距離/移動速度/攻撃速度/回復量）
- [x] `getKillCountForLevel()` 関数
  - [x] レベルに必要な撃破数を返す
- [x] `getLevelFromKillCount()` 関数
  - [x] 撃破数から現在レベルを計算
- [x] `shouldLevelUp()` 関数
  - [x] レベルアップ判定（撃破数ベース）
- [x] `applyLevelUpChoice()` 関数
  - [x] 選択に応じて能力値を上昇（attackSpeed は -0.1）
- [x] `canChooseStat()` 関数
  - [x] 能力値が上限に達していないか確認
- [x] `getNextKillsRequired()` 関数
  - [x] 次レベルまでの必要撃破数を返す

### Task 2.2: progression.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/progression.test.ts`

- [x] 撃破数テーブルテスト
  - [x] 各レベルの必要撃破数が正しい
- [x] レベル計算テスト
  - [x] 撃破数からレベルが正しく計算される
  - [x] 境界値でのレベル判定が正しい
- [x] レベルアップ判定テスト
  - [x] 撃破数が足りるとレベルアップ可能
  - [x] 最大レベルではレベルアップ不可
- [x] 能力値上昇テスト（5択）
  - [x] 攻撃力上昇が正しい（+1）
  - [x] 攻撃距離上昇が正しい（+1、上限3）
  - [x] 移動速度上昇が正しい（+1、上限8）
  - [x] 攻撃速度上昇が正しい（-0.1、上限0.5）
  - [x] 回復量上昇が正しい（+1、上限+5）

---

## フェーズ3: プレイヤー拡張

### Task 3.1: player.ts 拡張
**ファイル**: `src/features/ipne/player.ts`

- [x] `createPlayer()` 関数の拡張
  - [x] 職業パラメータ追加
  - [x] レベル初期化（level: 1）
  - [x] killCount初期化（0）
  - [x] 職業別能力値初期化
    - [x] 戦士: { attackPower: 2, attackRange: 1, moveSpeed: 4, attackSpeed: 1.0, healBonus: 0 }
    - [x] 盗賊: { attackPower: 1, attackRange: 1, moveSpeed: 6, attackSpeed: 1.0, healBonus: 0 }
  - [x] slowedUntil初期化（0）
- [x] `incrementKillCount()` 関数追加
  - [x] 撃破数インクリメント
  - [x] レベルアップ判定・フラグ設定
- [x] `processLevelUp()` 関数追加
  - [x] 選択に応じた能力値上昇（5択対応）
  - [x] レベルインクリメント
- [x] `getEffectiveMoveSpeed()` 関数追加
  - [x] 基本速度と速度低下状態を考慮した実効速度
- [x] `getEffectiveAttackCooldown()` 関数追加
  - [x] attackSpeed を考慮した実効クールダウン計算
- [x] `getEffectiveHeal()` 関数追加
  - [x] healBonus を考慮した回復量計算
- [x] `applySlowEffect()` 関数追加
  - [x] 速度低下効果の適用
- [x] `isSlowed()` 関数追加
  - [x] 速度低下状態の判定

### Task 3.2: player.test.ts 拡張
**ファイル**: `src/features/ipne/__tests__/player.test.ts`

- [x] 初期化テスト（拡張）
  - [x] 職業が正しく設定される
  - [x] 戦士の初期能力値が正しい（attackPower: 2, moveSpeed: 4）
  - [x] 盗賊の初期能力値が正しい（attackPower: 1, moveSpeed: 6）
- [x] 撃破数テスト
  - [x] 撃破数が正しく加算される
  - [x] レベルアップ条件で正しくフラグが立つ
- [x] レベルアップテスト（5択）
  - [x] 攻撃力が正しく上昇する
  - [x] 攻撃速度が正しく減少する（クールダウン短縮）
  - [x] 回復量が正しく上昇する
  - [x] レベルがインクリメントされる
- [x] 攻撃速度テスト
  - [x] 実効クールダウンが正しく計算される
- [x] 回復量テスト
  - [x] healBonus が回復に適用される
- [x] 速度低下テスト
  - [x] 速度低下が正しく適用される
  - [x] 時間経過で解除される
  - [x] 実効速度が正しく計算される

---

## フェーズ4: 壁ギミック

### Task 4.1: wall.ts 新規作成
**ファイル**: `src/features/ipne/wall.ts`

- [x] `WALL_CONFIGS` 定数定義
  - [x] 通常壁設定
  - [x] 破壊可能壁設定（HP: 3）
  - [x] すり抜け可能壁設定
  - [x] 透明壁設定
- [x] `createWall()` 関数
- [x] `createBreakableWall()` 関数
- [x] `createPassableWall()` 関数
- [x] `createInvisibleWall()` 関数
- [x] `damageWall()` 関数
  - [x] HP減少
  - [x] 破壊判定
- [x] `isWallPassable()` 関数
  - [x] 壁種類と状態から通過可否を判定
- [x] `isWallBlocking()` 関数
  - [x] 壁が通行を妨げるか判定
- [x] `revealWall()` 関数
  - [x] 壁を発見済み状態に
- [x] `getWallAt()` 関数
  - [x] 指定位置の壁を取得

### Task 4.2: wall.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/wall.test.ts`

- [x] 壁生成テスト
  - [x] 各種類の壁が正しく生成される
- [x] 破壊可能壁テスト
  - [x] ダメージでHPが減少する
  - [x] HP0で破壊状態になる
  - [x] 破壊後は通過可能
- [x] すり抜け可能壁テスト
  - [x] 最初から通過可能
  - [x] 発見済みに変更可能
- [x] 透明壁テスト
  - [x] 通過不可
  - [x] 接触で発見済みになる
- [x] 通過判定テスト
  - [x] 各壁種類・状態で正しく判定

---

## フェーズ5: 罠システム

### Task 5.1: trap.ts 新規作成
**ファイル**: `src/features/ipne/trap.ts`

- [x] `TRAP_CONFIGS` 定数定義
  - [x] ダメージ床設定（damage: 2）
  - [x] 移動妨害床設定（slowDuration: 3000ms, slowRate: 0.5, cooldown: 5000ms）
  - [x] テレポート罠設定（cooldown: 8000ms）
- [x] `generateTrapId()` 関数
- [x] `resetTrapIdCounter()` 関数
- [x] `createTrap()` 関数
- [x] `createDamageTrap()` 関数
- [x] `createSlowTrap()` 関数
- [x] `createTeleportTrap()` 関数
- [x] `triggerTrap()` 関数
  - [x] 罠種類に応じた効果発動
  - [x] 状態をtriggered/revealedに変更
- [x] `canTriggerTrap()` 関数
  - [x] 発動可能か判定（1回限り罠はtriggered状態でfalse）
- [x] `getTrapAt()` 関数
  - [x] 指定位置の罠を取得
- [x] `revealTrap()` 関数
  - [x] 罠を発見済み状態に

### Task 5.2: trap.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/trap.test.ts`

- [x] 罠生成テスト
  - [x] 各種類の罠が正しく生成される
  - [x] 罠IDが一意である
- [x] ダメージ床テスト
  - [x] 発動でダメージが計算される
  - [x] 1回限りで再発動不可
- [x] 移動妨害床テスト
  - [x] 発動で速度低下時間が返される
  - [x] クールダウン後に再発動可能
- [x] テレポート罠テスト
  - [x] 発動でテレポート先が返される
  - [x] クールダウン後に再発動可能
- [x] 発見状態テスト
  - [x] 発動で発見済みになる
  - [x] revealTrapで発見済みになる

---

## フェーズ6: 敵AI拡張

### Task 6.1: enemy.ts 拡張
**ファイル**: `src/features/ipne/enemy.ts`

- [x] `ENEMY_CONFIGS` に遠距離型追加
  - [x] HP: 2, damage: 1, speed: 3
  - [x] detectionRange: 7, attackRange: 4, chaseRange: 10
- [x] `FLEE` を `SPECIMEN` にリネーム（フェーズ0で実施済み）
- [x] `createRangedEnemy()` 関数追加

### Task 6.2: enemyAI.ts 拡張
**ファイル**: `src/features/ipne/enemyAI.ts`

- [x] `updateRangedEnemy()` 関数追加
  - [x] 理想距離維持ロジック（RANGED_PREFERRED_DISTANCE: 3）
  - [x] 接近時の後退ロジック
  - [x] 遠距離攻撃射程内での待機ロジック
- [x] `updateEnemyAI()` 関数の更新
  - [x] RANGED タイプのディスパッチ追加

### Task 6.3: enemyAI.test.ts 拡張
**ファイル**: `src/features/ipne/__tests__/enemyAI.test.ts`

- [x] 遠距離型AIテスト
  - [x] 遠距離攻撃型敵が正しく生成される
  - [x] プレイヤーが近すぎると後退する
  - [x] プレイヤーが攻撃射程外だと接近する
  - [x] 適切な距離を保っている場合はその場に留まる
  - [x] プレイヤーを見失ったら帰還する

---

## フェーズ7: アイテム拡張

### Task 7.1: item.ts 拡張
**ファイル**: `src/features/ipne/item.ts`

- [x] `ITEM_CONFIGS` に新アイテム追加（フェーズ0で実施済み）
  - [x] HP全回復設定
  - [x] 即レベルアップ設定
  - [x] 地図設定
- [x] `createHealthFull()` 関数追加
- [x] `createLevelUpItem()` 関数追加
- [x] `createMapRevealItem()` 関数追加
- [x] `pickupItem()` 関数の拡張
  - [x] HP全回復効果
  - [x] 即レベルアップ効果（triggerLevelUp フラグ）
  - [x] 地図効果（triggerMapReveal フラグ）
- [x] `ItemPickupResult` 型追加
  - [x] effectType, triggerLevelUp, triggerMapReveal

### Task 7.2: item.test.ts 拡張
**ファイル**: `src/features/ipne/__tests__/item.test.ts`

- [x] アイテム生成テスト
  - [x] 各種類のアイテムが正しく生成される
- [x] HP全回復テスト
  - [x] HPがmaxHpまで回復する
- [x] 即レベルアップテスト
  - [x] レベルアップフラグが立つ
- [x] 地図テスト
  - [x] マップ公開フラグが立つ

---

## フェーズ8: マップ生成拡張

### Task 8.1: gimmickPlacement.ts 新規作成
**ファイル**: `src/features/ipne/gimmickPlacement.ts`

- [x] `DEFAULT_GIMMICK_CONFIG` 定数定義
  - [x] 罠配置数: 10
  - [x] 罠種類比率（damage: 0.4, slow: 0.3, teleport: 0.3）
  - [x] 壁配置数: 6
  - [x] 壁種類比率（breakable: 0.5, passable: 0.3, invisible: 0.2）
- [x] `placeTrap()` 関数追加
  - [x] 通路・部屋に罠を配置
  - [x] 除外位置を避ける
- [x] `placeWalls()` 関数追加
  - [x] 壁に隣接する位置に特殊壁を配置
  - [x] 除外位置を避ける
- [x] `placeGimmicks()` 関数追加
  - [x] 罠と壁を同時に配置
  - [x] 罠と壁が重複しない

### Task 8.2: gimmickPlacement.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/gimmickPlacement.test.ts`

- [x] 罠配置テスト
  - [x] 指定数の罠が配置される
  - [x] 除外位置には罠が配置されない
  - [x] 罠IDが一意である
  - [x] 罠種類が比率に従って配置される
- [x] 特殊壁配置テスト
  - [x] 指定数の特殊壁が配置される
  - [x] 除外位置には壁が配置されない
  - [x] 壁種類が比率に従って配置される
- [x] ギミック配置テスト
  - [x] 罠と壁が両方配置される
  - [x] 罠と壁が同じ位置に配置されない
  - [x] 除外位置には何も配置されない

---

## フェーズ9: UI・演出統合

### Task 9.1: IpnePage.tsx 拡張（職業選択）
**ファイル**: `src/pages/IpnePage.tsx`

- [x] 職業選択画面コンポーネント追加
  - [x] 職業カード（戦士・盗賊）
  - [x] 職業説明テキスト
  - [x] 選択ボタン
- [x] 画面遷移追加
  - [x] TITLE → CLASS_SELECT → PROLOGUE
- [x] 選択した職業でゲーム開始

### Task 9.2: IpnePage.tsx 拡張（レベルアップUI）
**ファイル**: `src/pages/IpnePage.tsx`

- [x] レベルアップオーバーレイコンポーネント追加
  - [x] 5択選択UI（攻撃力/攻撃距離/移動速度/攻撃速度/回復量）
  - [x] 現在値・上昇量表示
  - [x] 上限到達時のグレーアウト
- [x] ゲーム一時停止処理
  - [x] レベルアップ中はゲームループ停止
- [x] 選択後のゲーム再開処理

### Task 9.3: IpnePage.tsx 拡張（描画・表示）
**ファイル**: `src/pages/IpnePage.tsx`

- [x] `drawTraps()` 関数追加
  - [x] 職業に応じた可視性処理
  - [x] 罠種類別の色分け
- [x] `drawSpecialWalls()` 関数追加
  - [x] 職業に応じた可視性処理
  - [x] 壁種類別の表示
- [x] `drawPlayerStats()` 関数追加
  - [x] レベル・能力値・撃破数表示
- [x] `drawRangedAttack()` 関数追加
  - [x] 遠距離攻撃エフェクト
- [x] 既存描画関数の更新
  - [x] 敵描画に遠距離型追加
  - [x] アイテム描画に新アイテム追加

### Task 9.4: IpnePage.styles.ts 拡張
**ファイル**: `src/pages/IpnePage.styles.ts`

- [x] `ClassSelectContainer` スタイル追加
- [x] `ClassCard` スタイル追加
- [x] `LevelUpOverlay` スタイル追加
- [x] `LevelUpChoice` スタイル追加
- [x] `StatsDisplay` スタイル追加
- [x] `ExperienceBar` スタイル追加

---

## フェーズ10: バランス調整・検証

### Task 10.1: index.ts 更新
**ファイル**: `src/features/ipne/index.ts`

- [x] 新規モジュールのエクスポート追加
  - [x] progression.ts
  - [x] class.ts
  - [x] trap.ts
  - [x] wall.ts
  - [x] gimmickPlacement.ts
- [x] 新規型のエクスポート追加
  - [x] PlayerClass, PlayerClassValue
  - [x] StatType, StatTypeValue, PlayerStats
  - [x] TrapType, TrapTypeValue, TrapState, TrapStateValue, Trap
  - [x] WallType, WallTypeValue, WallState, WallStateValue, Wall

### Task 10.2: バランス調整（2026-02-03 実施）
- [x] 敵パラメータ調整
  - [x] パトロール: HP 3→4
  - [x] チャージ: HP 2→3
  - [x] レンジド: HP 2→3, 速度 3→1.5（遅め）
  - [x] スペシメン: 速度 6→4（逃げ足調整）
  - [x] ボス: 速度 5→1.5（重量感）
- [x] 敵スポーン調整
  - [x] パトロール: 13→10
  - [x] チャージ: 8→6
  - [x] レンジド: 0→5（追加）
- [x] 罠パラメータ調整
  - [x] ダメージ罠: damage 2→3, reusable: true, cooldown: 5000ms
  - [x] 移動妨害罠: slowDuration 3000→6000ms
  - [x] テレポート罠: reusable: true, cooldown: 8000ms
- [x] アイテム配置数調整
  - [x] 大回復: 3→4
  - [x] 全回復: 0→1（追加）
  - [x] レベルアップ: 0→2（追加）
  - [x] マップ公開: 0→1（追加）

### Task 10.3: 破壊可能壁への攻撃実装（2026-02-03 実施）
**ファイル**: `src/features/ipne/combat.ts`, `src/pages/IpnePage.tsx`

- [x] combat.ts拡張
  - [x] PlayerAttackResultにwalls, hitWallプロパティ追加
  - [x] getAttackableWall関数追加
  - [x] playerAttack関数に壁引数追加
  - [x] 敵がいない場合に破壊可能壁を攻撃する処理
- [x] IpnePage.tsx更新
  - [x] handleAttackでwallsを渡すよう修正
  - [x] 攻撃結果のwallsを反映

### Task 10.4: テスト更新（2026-02-03 実施）
- [x] enemy.test.ts - HP・速度の新値に対応
- [x] combat.test.ts - 壁攻撃テスト追加
- [x] trap.test.ts - 再使用・新値テスト追加

### Task 10.5: プレイテスト検証（手動）

> **MVP3の本質：「判断が重なり合う状態を作る」**

- [x] プレイ時間計測（目標：5〜10分）
- [ ] 以下の評価観点をチェック
  - [x] レベルアップ選択に意味があったか
  - [x] 職業選択がプレイスタイルを変えたか
  - [ ] 罠を「利用しよう」と思ったか
  - [x] 繰り返しプレイで新しい発見があったか
- [x] NG例の確認
  - [x] 常に同じ能力を上げてしまう → 選択肢のバランス調整
  - [x] 職業差を感じない → 可視性の差を強化
  - [X] 罠を全て避けるだけ → 利用メリットの追加

### Task 10.6: テスト・検証
- [x] 全テスト実行 `npm test` （443テスト通過）
- [x] TypeScriptコンパイル確認 `npx tsc --noEmit`
- [x] 手動動作確認
  - [x] 職業選択が機能する
  - [x] レベルアップが機能する
  - [x] 罠が正しく動作する
  - [x] 特殊壁が正しく動作する
  - [x] 遠距離型敵が正しく動作する
  - [x] 新アイテムが正しく動作する
  - [x] 職業で見え方が異なる
  - [x] クリア・ゲームオーバーが発生する
  - [x] レンジド敵がマップに出現する
  - [x] 破壊可能壁を攻撃でダメージを与えられる
  - [x] 全回復・レベルアップ・マップ公開アイテムが出現する
  - [x] 罠が再使用される（クールダウン後に再発動）

---

## 依存関係図

```
フェーズ0（型定義）
    ↓
    ├── フェーズ1（職業） ─────────┐
    ├── フェーズ2（成長） ─────────┤
    │                             ↓
    │                       フェーズ3（プレイヤー拡張）
    │                             ↓
    ├── フェーズ4（壁） ──────────┐
    ├── フェーズ5（罠） ──────────┤
    │                             ↓
    │                       フェーズ8（マップ生成）
    │                             ↓
    ├── フェーズ6（敵AI） ────────┐
    ├── フェーズ7（アイテム） ────┤
    │                             ↓
    └────────────────────────→ フェーズ9（UI・演出）
                                  ↓
                            フェーズ10（バランス・検証）
```

- フェーズ0（型定義）は最初に完了
- フェーズ1（職業）、フェーズ2（成長）は並行可能
- フェーズ3（プレイヤー拡張）はフェーズ1・2の完了後
- フェーズ4（壁）、フェーズ5（罠）は並行可能
- フェーズ6（敵AI）、フェーズ7（アイテム）は並行可能
- フェーズ8（マップ生成）はフェーズ4・5の完了後
- フェーズ9（UI・演出）は全機能実装後
- フェーズ10（バランス・検証）は最後

---

## 注意事項

- **既存のMVP2コードを直接拡張・改修**（新規ページ追加ではない）
- 職業差は「情報取得能力」と「初期能力値」の差として表現
- 罠は「利用・判断対象」として設計（単なる障害ではない）
- テストファーストで進める
- 評価観点（判断の重なり合い、繰り返し価値）を常に意識
- コメント・docstringは日本語で記述
