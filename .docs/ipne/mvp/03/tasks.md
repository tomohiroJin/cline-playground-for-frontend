# タスク一覧・進捗管理（IPNE MVP3）

## 進捗サマリー

| フェーズ | 状況 | 完了タスク |
|---------|------|-----------:|
| フェーズ0: 型定義・テスト準備 | ✅ 完了 | 3/3 |
| フェーズ1: 職業システム | ⬜ 未着手 | 0/2 |
| フェーズ2: 成長システム | ⬜ 未着手 | 0/2 |
| フェーズ3: プレイヤー拡張 | ⬜ 未着手 | 0/2 |
| フェーズ4: 壁ギミック | ⬜ 未着手 | 0/2 |
| フェーズ5: 罠システム | ⬜ 未着手 | 0/2 |
| フェーズ6: 敵AI拡張 | ⬜ 未着手 | 0/2 |
| フェーズ7: アイテム拡張 | ⬜ 未着手 | 0/2 |
| フェーズ8: マップ生成拡張 | ⬜ 未着手 | 0/2 |
| フェーズ9: UI・演出統合 | ⬜ 未着手 | 0/3 |
| フェーズ10: バランス調整・検証 | ⬜ 未着手 | 0/4 |
| **合計** | **12%** | **3/26** |

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
  - [x] `TrapType` 定数 (`'damage' | 'slow' | 'alert'`)
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

- [ ] `CLASS_CONFIGS` 定数定義
  - [ ] 戦士設定（trapVisibility: 'none', wallVisibility: 'none'）
  - [ ] 盗賊設定（trapVisibility: 'faint', wallVisibility: 'faint'）
- [ ] `getClassConfig()` 関数
  - [ ] 職業に応じた設定を返す
- [ ] `canSeeTrap()` 関数
  - [ ] 職業と罠状態から可視性を判定
- [ ] `canSeeSpecialWall()` 関数
  - [ ] 職業と壁状態から可視性を判定
- [ ] `getTrapAlpha()` 関数
  - [ ] 職業に応じた罠の透明度を返す（戦士:0, 盗賊:0.3）
- [ ] `getWallAlpha()` 関数
  - [ ] 職業に応じた特殊壁の透明度を返す

### Task 1.2: class.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/class.test.ts`

- [ ] 職業設定取得テスト
  - [ ] 戦士の設定が正しい
  - [ ] 盗賊の設定が正しい
- [ ] 罠可視性テスト
  - [ ] 戦士は未発見罠が見えない
  - [ ] 盗賊は未発見罠が見える（半透明）
  - [ ] 両職業で発見済み罠が見える
- [ ] 特殊壁可視性テスト
  - [ ] 戦士は未発見特殊壁が見えない
  - [ ] 盗賊は未発見特殊壁が見える（半透明）

---

## フェーズ2: 成長システム

### Task 2.1: progression.ts 新規作成
**ファイル**: `src/features/ipne/progression.ts`

- [ ] `KILL_COUNT_TABLE` 定数定義
  - [ ] 各レベルの必要累計撃破数
- [ ] `STAT_LIMITS` 定数定義
  - [ ] 各能力の上限値（attackSpeed: 0.5, healBonus: 5 追加）
- [ ] `LEVEL_UP_CHOICES` 定数定義
  - [ ] 5択の選択肢効果（攻撃力/攻撃距離/移動速度/攻撃速度/回復量）
- [ ] `getKillCountForLevel()` 関数
  - [ ] レベルに必要な撃破数を返す
- [ ] `getLevelFromKillCount()` 関数
  - [ ] 撃破数から現在レベルを計算
- [ ] `shouldLevelUp()` 関数
  - [ ] レベルアップ判定（撃破数ベース）
- [ ] `applyLevelUpChoice()` 関数
  - [ ] 選択に応じて能力値を上昇（attackSpeed は -0.1）
- [ ] `canChooseStat()` 関数
  - [ ] 能力値が上限に達していないか確認
- [ ] `getNextKillsRequired()` 関数
  - [ ] 次レベルまでの必要撃破数を返す

### Task 2.2: progression.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/progression.test.ts`

- [ ] 撃破数テーブルテスト
  - [ ] 各レベルの必要撃破数が正しい
- [ ] レベル計算テスト
  - [ ] 撃破数からレベルが正しく計算される
  - [ ] 境界値でのレベル判定が正しい
- [ ] レベルアップ判定テスト
  - [ ] 撃破数が足りるとレベルアップ可能
  - [ ] 最大レベルではレベルアップ不可
- [ ] 能力値上昇テスト（5択）
  - [ ] 攻撃力上昇が正しい（+1）
  - [ ] 攻撃距離上昇が正しい（+1、上限3）
  - [ ] 移動速度上昇が正しい（+1、上限8）
  - [ ] 攻撃速度上昇が正しい（-0.1、上限0.5）
  - [ ] 回復量上昇が正しい（+1、上限+5）

---

## フェーズ3: プレイヤー拡張

### Task 3.1: player.ts 拡張
**ファイル**: `src/features/ipne/player.ts`

- [ ] `createPlayer()` 関数の拡張
  - [ ] 職業パラメータ追加
  - [ ] レベル初期化（level: 1）
  - [ ] killCount初期化（0）
  - [ ] 職業別能力値初期化
    - [ ] 戦士: { attackPower: 2, attackRange: 1, moveSpeed: 4, attackSpeed: 1.0, healBonus: 0 }
    - [ ] 盗賊: { attackPower: 1, attackRange: 1, moveSpeed: 6, attackSpeed: 1.0, healBonus: 0 }
  - [ ] slowedUntil初期化（0）
- [ ] `incrementKillCount()` 関数追加
  - [ ] 撃破数インクリメント
  - [ ] レベルアップ判定・フラグ設定
- [ ] `processLevelUp()` 関数追加
  - [ ] 選択に応じた能力値上昇（5択対応）
  - [ ] レベルインクリメント
- [ ] `getEffectiveMoveSpeed()` 関数追加
  - [ ] 基本速度と速度低下状態を考慮した実効速度
- [ ] `getEffectiveAttackCooldown()` 関数追加
  - [ ] attackSpeed を考慮した実効クールダウン計算
- [ ] `getEffectiveHeal()` 関数追加
  - [ ] healBonus を考慮した回復量計算
- [ ] `applySlowEffect()` 関数追加
  - [ ] 速度低下効果の適用
- [ ] `isSlowed()` 関数追加
  - [ ] 速度低下状態の判定

### Task 3.2: player.test.ts 拡張
**ファイル**: `src/features/ipne/__tests__/player.test.ts`

- [ ] 初期化テスト（拡張）
  - [ ] 職業が正しく設定される
  - [ ] 戦士の初期能力値が正しい（attackPower: 2, moveSpeed: 4）
  - [ ] 盗賊の初期能力値が正しい（attackPower: 1, moveSpeed: 6）
- [ ] 撃破数テスト
  - [ ] 撃破数が正しく加算される
  - [ ] レベルアップ条件で正しくフラグが立つ
- [ ] レベルアップテスト（5択）
  - [ ] 攻撃力が正しく上昇する
  - [ ] 攻撃速度が正しく減少する（クールダウン短縮）
  - [ ] 回復量が正しく上昇する
  - [ ] レベルがインクリメントされる
- [ ] 攻撃速度テスト
  - [ ] 実効クールダウンが正しく計算される
- [ ] 回復量テスト
  - [ ] healBonus が回復に適用される
- [ ] 速度低下テスト
  - [ ] 速度低下が正しく適用される
  - [ ] 時間経過で解除される
  - [ ] 実効速度が正しく計算される

---

## フェーズ4: 壁ギミック

### Task 4.1: wall.ts 新規作成
**ファイル**: `src/features/ipne/wall.ts`

- [ ] `WALL_CONFIGS` 定数定義
  - [ ] 通常壁設定
  - [ ] 破壊可能壁設定（HP: 3）
  - [ ] すり抜け可能壁設定
  - [ ] 透明壁設定
- [ ] `generateWallId()` 関数
- [ ] `createWall()` 関数
- [ ] `createBreakableWall()` 関数
- [ ] `createPassableWall()` 関数
- [ ] `createInvisibleWall()` 関数
- [ ] `damageWall()` 関数
  - [ ] HP減少
  - [ ] 破壊判定
- [ ] `isWallPassable()` 関数
  - [ ] 壁種類と状態から通過可否を判定
- [ ] `isWallBlocking()` 関数
  - [ ] 壁が通行を妨げるか判定
- [ ] `revealWall()` 関数
  - [ ] 壁を発見済み状態に
- [ ] `getWallAt()` 関数
  - [ ] 指定位置の壁を取得

### Task 4.2: wall.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/wall.test.ts`

- [ ] 壁生成テスト
  - [ ] 各種類の壁が正しく生成される
- [ ] 破壊可能壁テスト
  - [ ] ダメージでHPが減少する
  - [ ] HP0で破壊状態になる
  - [ ] 破壊後は通過可能
- [ ] すり抜け可能壁テスト
  - [ ] 最初から通過可能
  - [ ] 通過後に発見済みになる
- [ ] 透明壁テスト
  - [ ] 通過不可
  - [ ] 接触で発見済みになる
- [ ] 通過判定テスト
  - [ ] 各壁種類・状態で正しく判定

---

## フェーズ5: 罠システム

### Task 5.1: trap.ts 新規作成
**ファイル**: `src/features/ipne/trap.ts`

- [ ] `TRAP_CONFIGS` 定数定義
  - [ ] ダメージ床設定（damage: 2）
  - [ ] 移動妨害床設定（slowDuration: 3000ms, slowRate: 0.5）
  - [ ] 索敵反応罠設定（alertRadius: 5）
- [ ] `generateTrapId()` 関数
- [ ] `createTrap()` 関数
- [ ] `createDamageTrap()` 関数
- [ ] `createSlowTrap()` 関数
- [ ] `createAlertTrap()` 関数
- [ ] `triggerTrap()` 関数
  - [ ] 罠種類に応じた効果発動
  - [ ] 状態をtriggeredに変更
- [ ] `canTriggerTrap()` 関数
  - [ ] 発動可能か判定（1回限り罠はtriggered状態でfalse）
- [ ] `getTrapAt()` 関数
  - [ ] 指定位置の罠を取得
- [ ] `revealTrap()` 関数
  - [ ] 罠を発見済み状態に
- [ ] `applyDamageEffect()` 関数
  - [ ] ダメージ床の効果適用
- [ ] `applySlowEffect()` 関数
  - [ ] 移動妨害床の効果適用
- [ ] `applyAlertEffect()` 関数
  - [ ] 索敵反応罠の効果適用（敵を引き寄せる）

### Task 5.2: trap.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/trap.test.ts`

- [ ] 罠生成テスト
  - [ ] 各種類の罠が正しく生成される
- [ ] ダメージ床テスト
  - [ ] 発動でダメージが与えられる
  - [ ] 1回限りで再発動不可
- [ ] 移動妨害床テスト
  - [ ] 発動で速度低下が適用される
  - [ ] 効果時間が正しい
  - [ ] クールダウン後に再発動可能
- [ ] 索敵反応罠テスト
  - [ ] 発動で周囲の敵が引き寄せられる
  - [ ] 1回限りで再発動不可
- [ ] 発見状態テスト
  - [ ] 発動で発見済みになる

---

## フェーズ6: 敵AI拡張

### Task 6.1: enemy.ts 拡張
**ファイル**: `src/features/ipne/enemy.ts`

- [ ] `ENEMY_CONFIGS` に遠距離型追加
  - [ ] HP: 2, damage: 1, speed: 3
  - [ ] detectionRange: 7, attackRange: 4, chaseRange: 10
  - [ ] preferredDistance: 3〜4
- [ ] `FLEE` を `SPECIMEN` にリネーム
  - [ ] 既存コードの参照を更新
- [ ] `createRangedEnemy()` 関数追加
- [ ] `EXP_REWARDS` 定数追加（progressionと連携）

### Task 6.2: enemyAI.ts 拡張
**ファイル**: `src/features/ipne/enemyAI.ts`

- [ ] `updateRangedEnemy()` 関数追加
  - [ ] 理想距離維持ロジック
  - [ ] 接近時の後退ロジック
  - [ ] 遠距離攻撃発動ロジック
- [ ] `calculatePreferredDistance()` 関数追加
  - [ ] 理想距離の計算
- [ ] `moveAwayFromPlayer()` 関数追加
  - [ ] プレイヤーから離れる移動
- [ ] `canRangedAttack()` 関数追加
  - [ ] 遠距離攻撃可能か判定
- [ ] `executeRangedAttack()` 関数追加
  - [ ] 遠距離攻撃の実行
- [ ] `updateEnemyAI()` 関数の更新
  - [ ] RANGED タイプのディスパッチ追加
  - [ ] FLEE を SPECIMEN に変更

### Task 6.3: enemyAI.test.ts 拡張
**ファイル**: `src/features/ipne/__tests__/enemyAI.test.ts`

- [ ] 遠距離型AIテスト
  - [ ] 理想距離を維持する
  - [ ] 接近されると後退する
  - [ ] 攻撃範囲内で遠距離攻撃する
  - [ ] 攻撃クールダウンが機能する

---

## フェーズ7: アイテム拡張

### Task 7.1: item.ts 拡張
**ファイル**: `src/features/ipne/item.ts`

- [ ] `ITEM_CONFIGS` に新アイテム追加
  - [ ] HP全回復設定
  - [ ] 即レベルアップ設定
  - [ ] 地図設定
- [ ] `createHealthFullItem()` 関数追加
- [ ] `createLevelUpItem()` 関数追加
- [ ] `createMapRevealItem()` 関数追加
- [ ] `applyItemEffect()` 関数の拡張
  - [ ] HP全回復効果
  - [ ] 即レベルアップ効果（フラグ設定）
  - [ ] 地図効果（全マップ開示）
- [ ] `SPAWN_CONFIG` の更新
  - [ ] 新アイテムの配置数追加

### Task 7.2: item.test.ts 拡張
**ファイル**: `src/features/ipne/__tests__/item.test.ts`

- [ ] HP全回復テスト
  - [ ] HPが最大値まで回復する
- [ ] 即レベルアップテスト
  - [ ] レベルアップフラグが立つ
  - [ ] レベル最大時は効果なし
- [ ] 地図テスト
  - [ ] 全マップが探索済みになる

---

## フェーズ8: マップ生成拡張

### Task 8.1: mazeGenerator.ts 拡張
**ファイル**: `src/features/ipne/mazeGenerator.ts`

- [ ] `generateTraps()` 関数追加
  - [ ] ダメージ床15個配置
  - [ ] 移動妨害床10個配置
  - [ ] 索敵反応罠8個配置
  - [ ] 通路・部屋の床に配置
- [ ] `generateSpecialWalls()` 関数追加
  - [ ] 破壊可能壁20個配置（通路間の壁を置換）
  - [ ] すり抜け可能壁8個配置（行き止まりに配置）
  - [ ] 透明壁5個配置（通路の一部に配置）
- [ ] `generateMaze()` 関数の拡張
  - [ ] 罠・特殊壁生成の呼び出し追加
  - [ ] 戻り値に traps, walls を追加

### Task 8.2: mazeGenerator.test.ts 拡張
**ファイル**: `src/features/ipne/mazeGenerator.test.ts`

- [ ] 罠配置テスト
  - [ ] 指定数の罠が配置される
  - [ ] 罠が床タイルに配置される
  - [ ] スタート・ゴール付近に罠がない
- [ ] 特殊壁配置テスト
  - [ ] 指定数の特殊壁が配置される
  - [ ] 破壊可能壁が通路間の壁に配置される
  - [ ] すり抜け可能壁が行き止まりに配置される

---

## フェーズ9: UI・演出統合

### Task 9.1: IpnePage.tsx 拡張（職業選択）
**ファイル**: `src/pages/IpnePage.tsx`

- [ ] 職業選択画面コンポーネント追加
  - [ ] 職業カード（戦士・盗賊）
  - [ ] 職業説明テキスト
  - [ ] 選択ボタン
- [ ] 画面遷移追加
  - [ ] TITLE → CLASS_SELECT → PROLOGUE
- [ ] 選択した職業でゲーム開始

### Task 9.2: IpnePage.tsx 拡張（レベルアップUI）
**ファイル**: `src/pages/IpnePage.tsx`

- [ ] レベルアップオーバーレイコンポーネント追加
  - [ ] 5択選択UI（攻撃力/攻撃距離/移動速度/攻撃速度/回復量）
  - [ ] 現在値・上昇量表示
  - [ ] 上限到達時のグレーアウト
- [ ] ゲーム一時停止処理
  - [ ] レベルアップ中はゲームループ停止
- [ ] 選択後のゲーム再開処理

### Task 9.3: IpnePage.tsx 拡張（描画・表示）
**ファイル**: `src/pages/IpnePage.tsx`

- [ ] `drawTraps()` 関数追加
  - [ ] 職業に応じた可視性処理
  - [ ] 罠種類別の色分け
- [ ] `drawSpecialWalls()` 関数追加
  - [ ] 職業に応じた可視性処理
  - [ ] 壁種類別の表示
- [ ] `drawPlayerStats()` 関数追加
  - [ ] レベル・能力値・撃破数表示
- [ ] `drawRangedAttack()` 関数追加
  - [ ] 遠距離攻撃エフェクト
- [ ] 既存描画関数の更新
  - [ ] 敵描画に遠距離型追加
  - [ ] アイテム描画に新アイテム追加

### Task 9.4: IpnePage.styles.ts 拡張
**ファイル**: `src/pages/IpnePage.styles.ts`

- [ ] `ClassSelectContainer` スタイル追加
- [ ] `ClassCard` スタイル追加
- [ ] `LevelUpOverlay` スタイル追加
- [ ] `LevelUpChoice` スタイル追加
- [ ] `StatsDisplay` スタイル追加
- [ ] `ExperienceBar` スタイル追加

---

## フェーズ10: バランス調整・検証

### Task 10.1: index.ts 更新
**ファイル**: `src/features/ipne/index.ts`

- [ ] 新規モジュールのエクスポート追加
  - [ ] progression.ts
  - [ ] class.ts
  - [ ] trap.ts
  - [ ] wall.ts
- [ ] 新規型のエクスポート追加
  - [ ] PlayerClass, PlayerClassValue, ClassConfig
  - [ ] StatType, StatTypeValue, PlayerStats, LevelUpChoice
  - [ ] TrapType, TrapTypeValue, TrapState, TrapStateValue, Trap
  - [ ] WallType, WallTypeValue, WallState, WallStateValue, Wall

### Task 10.2: バランス調整
- [ ] 撃破数テーブル調整
  - [ ] レベル10到達がクリア前に可能か確認
  - [ ] 成長曲線が適切か確認
- [ ] 罠配置数・ダメージ調整
  - [ ] 罠が多すぎて理不尽でないか確認
  - [ ] 利用価値のある配置か確認
- [ ] 敵パラメータ調整
  - [ ] 遠距離型の難易度確認
  - [ ] 全体的な敵バランス確認
- [ ] アイテム配置数調整
  - [ ] 即レベルアップの価値確認
  - [ ] 地図の配置場所確認

### Task 10.3: プレイテスト検証（手動）

> **MVP3の本質：「判断が重なり合う状態を作る」**

- [ ] プレイ時間計測（目標：5〜10分）
- [ ] 以下の評価観点をチェック
  - [ ] レベルアップ選択に意味があったか
  - [ ] 職業選択がプレイスタイルを変えたか
  - [ ] 罠を「利用しよう」と思ったか
  - [ ] 繰り返しプレイで新しい発見があったか
- [ ] NG例の確認
  - [ ] 常に同じ能力を上げてしまう → 選択肢のバランス調整
  - [ ] 職業差を感じない → 可視性の差を強化
  - [ ] 罠を全て避けるだけ → 利用メリットの追加

### Task 10.4: テスト・検証
- [ ] 全テスト実行 `npm test`
- [ ] TypeScriptコンパイル確認 `npx tsc --noEmit`
- [ ] 手動動作確認
  - [ ] 職業選択が機能する
  - [ ] レベルアップが機能する
  - [ ] 罠が正しく動作する
  - [ ] 特殊壁が正しく動作する
  - [ ] 遠距離型敵が正しく動作する
  - [ ] 新アイテムが正しく動作する
  - [ ] 職業で見え方が異なる
  - [ ] クリア・ゲームオーバーが発生する

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
