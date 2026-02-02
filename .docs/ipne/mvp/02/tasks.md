# タスク一覧・進捗管理（IPNE MVP2）

## 進捗サマリー

| フェーズ | 状況 | 完了タスク |
|---------|------|-----------|
| フェーズ0: 型定義・テスト準備 | 🟡 進行中 | 2/3 |
| フェーズ1: プレイヤー拡張 | ✅ 完了 | 2/2 |
| フェーズ2: 敵基本システム | ✅ 完了 | 3/3 |
| フェーズ3: 敵AI | ✅ 完了 | 5/5 |
| フェーズ4: 戦闘システム | ✅ 完了 | 3/3 |
| フェーズ5: アイテムシステム | ✅ 完了 | 2/2 |
| フェーズ6: UI・演出 | ✅ 完了 | 3/3 |
| フェーズ7: 統合・バランス調整 | 🟡 進行中 | 1/4 |
| **合計** | **84%** | **21/25** |

---

## フェーズ0: 型定義・テスト準備（TDD起点）

### Task 0.1: types.ts 拡張
**ファイル**: `src/features/ipne/types.ts`

- [x] Player型拡張
  - [x] `hp: number` フィールド追加
  - [x] `maxHp: number` フィールド追加
  - [x] `direction: DirectionValue` フィールド追加
  - [x] `isInvincible: boolean` フィールド追加
  - [x] `invincibleUntil: number` フィールド追加
  - [x] `attackCooldownUntil: number` フィールド追加
- [x] EnemyType 定義 (`'patrol' | 'charge' | 'flee'`)
- [x] EnemyState 定義 (`'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'return' | 'knockback'`)
- [x] Enemy型 定義
  - [x] id, x, y, type, hp, maxHp, damage, speed
  - [x] detectionRange, chaseRange, state
  - [x] patrolPath, patrolIndex, homePosition
  - [x] lastKnownPlayerPos, knockbackUntil, knockbackDirection
- [x] ItemType 定義 (`'health_small' | 'health_large'`)
- [x] Item型 定義 (id, x, y, type, healAmount)
- [x] CombatState型 定義（必要に応じて）
- [x] GameState拡張（enemies, items 配列追加）

### Task 0.2: テストユーティリティ作成
**ファイル**: `src/features/ipne/__tests__/testUtils.ts`

- [x] `createTestMap()` - テスト用マップ生成ヘルパー
- [x] `createTestPlayer()` - テスト用プレイヤー生成ヘルパー（HP付き）
- [x] `createTestEnemy()` - テスト用敵生成ヘルパー
- [x] `createTestItem()` - テスト用アイテム生成ヘルパー

### Task 0.3: 既存テスト確認
- [ ] `npm test` 実行で既存テストが通ることを確認
- [ ] 型変更によるコンパイルエラーがないことを確認

---

## フェーズ1: プレイヤー拡張

### Task 1.1: player.ts 拡張
**ファイル**: `src/features/ipne/player.ts`

- [x] `createPlayer()` 関数の拡張
  - [x] HP初期化（hp: 12, maxHp: 12）
  - [x] 向き初期化（direction: 'down'）
  - [x] 無敵時間初期化（isInvincible: false, invincibleUntil: 0）
  - [x] 攻撃クールダウン初期化（attackCooldownUntil: 0）
- [x] `updatePlayerDirection()` 関数追加
  - [x] 移動時に向きを更新
- [x] `damagePlayer()` 関数追加
  - [x] HP減少処理
  - [x] 無敵時間設定
  - [x] HP0でゲームオーバーフラグ
- [x] `healPlayer()` 関数追加
  - [x] HP回復（最大HPを超えない）
- [x] `isPlayerInvincible()` 関数追加
  - [x] 現在時刻と比較して無敵判定
- [x] `canPlayerAttack()` 関数追加
  - [x] クールダウン判定
- [x] `setAttackCooldown()` 関数追加
  - [x] 攻撃後のクールダウン設定

### Task 1.2: player.test.ts 拡張
**ファイル**: `src/features/ipne/__tests__/player.test.ts`

- [x] HP初期化テスト
- [x] ダメージ計算テスト
  - [x] 正常にHPが減少する
  - [x] HP0以下にならない（最低0）
- [x] 回復計算テスト
  - [x] 正常にHPが回復する
  - [x] 最大HPを超えない
- [x] 向き更新テスト
  - [x] 移動方向に応じて向きが更新される
- [x] 無敵時間テスト
  - [x] 被ダメージ後に無敵状態になる
  - [x] 時間経過で無敵が解除される
- [x] 攻撃クールダウンテスト
  - [x] 攻撃後にクールダウンが設定される
  - [x] クールダウン中は攻撃不可

---

## フェーズ2: 敵基本システム

### Task 2.1: enemy.ts 新規作成
**ファイル**: `src/features/ipne/enemy.ts`

- [x] `ENEMY_CONFIGS` 定数定義
  - [x] 巡回型パラメータ（HP:3, damage:1, speed:3, detectionRange:5, chaseRange:8）
  - [x] 突進型パラメータ（HP:2, damage:2, speed:5, detectionRange:6, chaseRange:10）
  - [x] 逃走型パラメータ（HP:1, damage:0, speed:4, detectionRange:4）
  - [x] ボスパラメータ（HP:10, damage:3, speed:4, detectionRange:8, chaseRange:15）
- [x] `generateEnemyId()` 関数（一意ID生成）
- [x] `createEnemy()` 関数（種類別パラメータ設定）
- [x] `createPatrolEnemy()` 関数
- [x] `createChargeEnemy()` 関数
- [x] `createFleeEnemy()` 関数
- [x] `createBoss()` 関数
- [x] `isEnemyAlive()` 関数
- [x] `damageEnemy()` 関数
- [x] `applyKnockbackToEnemy()` 関数

### Task 2.2: enemySpawner.ts 新規作成
**ファイル**: `src/features/ipne/enemySpawner.ts`

- [x] `SPAWN_CONFIG` 定数定義
  - [x] 合計敵数: 25 + ボス1
  - [x] 構成: 巡回型15、突進型8、逃走型2
- [x] `spawnEnemies()` 関数（Room配列から敵配置）
  - [x] スタート部屋には配置しない
  - [x] ゴール部屋にボスを配置
  - [x] 部屋サイズに応じて1〜3体配置
- [x] `getSpawnPositionsForRoom()` 関数
  - [x] 部屋内の床タイルから配置位置を選択
- [x] `distributeEnemyTypes()` 関数
  - [x] 各部屋への敵種類割り当て

### Task 2.3: enemy.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/enemy.test.ts`

- [x] 敵生成テスト
  - [x] 各種類の敵が正しく生成される
  - [x] パラメータが正しく設定される
- [x] 敵ID一意性テスト
- [x] ダメージテスト
  - [x] HP減少が正しい
  - [x] HP0で死亡判定
- [x] ノックバックテスト

---

## フェーズ3: 敵AI

### Task 3.1: enemyAI.ts 新規作成（共通ロジック）
**ファイル**: `src/features/ipne/enemyAI.ts`

- [x] `AI_CONFIG` 定数定義
  - [x] 移動更新間隔: 200ms
  - [x] 追跡タイムアウト: 3000ms
- [x] `updateEnemyAI()` 関数（メイン更新）
  - [x] 状態に応じた振る舞い分岐
- [x] `detectPlayer()` 関数
  - [x] マンハッタン距離で視認判定
  - [x] 壁越しは視認不可（オプション：簡易版は距離のみ）
- [x] `shouldChase()` 関数
  - [x] 視認範囲内かつ追跡距離内
- [x] `shouldStopChase()` 関数
  - [x] 追跡距離を超えた
  - [x] 一定時間見失った
- [x] `moveEnemyTowards()` 関数
  - [x] 目標位置に向かって1ステップ移動
  - [x] 壁衝突判定

### Task 3.2: 巡回型AI
**ファイル**: `src/features/ipne/enemyAI.ts`

- [x] `updatePatrolEnemy()` 関数
  - [x] 巡回状態: パスに沿って移動
  - [x] 追跡状態: プレイヤーを追う
  - [x] 帰還状態: 初期位置に戻る
- [x] `generatePatrolPath()` 関数
  - [x] 初期位置から4〜8タイルの往復パス生成
- [x] `getNextPatrolPoint()` 関数
  - [x] 現在のインデックスから次の目標を取得

### Task 3.3: 突進型AI
**ファイル**: `src/features/ipne/enemyAI.ts`

- [x] `updateChargeEnemy()` 関数
  - [x] 待機状態: その場で待機
  - [x] 追跡状態: 直線的にプレイヤーに接近
- [x] `getDirectPathToPlayer()` 関数
  - [x] プレイヤー方向への直線経路計算

### Task 3.4: 逃走型AI
**ファイル**: `src/features/ipne/enemyAI.ts`

- [x] `updateFleeEnemy()` 関数
  - [x] 待機状態: その場で待機
  - [x] 逃走状態: プレイヤーから離れる
- [x] `calculateFleeDirection()` 関数
  - [x] プレイヤーと反対方向を計算

### Task 3.5: enemyAI.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/enemyAI.test.ts`

- [x] 視認判定テスト
  - [x] 範囲内で視認成功
  - [x] 範囲外で視認失敗
- [x] 追跡開始テスト
- [x] 追跡中断テスト
  - [x] 距離超過で中断
  - [x] タイムアウトで中断
- [x] 巡回移動テスト
  - [x] パスに沿って移動
  - [x] 端で折り返し
- [x] 逃走移動テスト
  - [x] プレイヤーと反対方向に移動

---

## フェーズ4: 戦闘システム

### Task 4.1: combat.ts 新規作成
**ファイル**: `src/features/ipne/combat.ts`

- [x] `COMBAT_CONFIG` 定数定義
  - [x] プレイヤー攻撃力: 1
  - [x] 攻撃クールダウン: 500ms
  - [x] ノックバック距離: 1タイル
  - [x] ノックバック時間: 200ms
  - [x] 無敵時間: 1000ms
- [x] `playerAttack()` 関数
  - [x] クールダウンチェック
  - [x] 攻撃範囲内の敵を取得
  - [x] ダメージ適用
  - [x] ノックバック適用
  - [x] クールダウン設定
- [x] `getAttackTarget()` 関数
  - [x] プレイヤーの前方1タイルの敵を取得
- [x] `processEnemyContact()` 関数
  - [x] 接触判定（同じタイル）
  - [x] 無敵チェック
  - [x] ダメージ適用
- [x] `applyKnockback()` 関数
  - [x] 方向に応じた移動計算
  - [x] 壁衝突で停止
- [x] `isKnockbackComplete()` 関数
  - [x] 時間経過でノックバック終了判定

### Task 4.2: collision.ts 拡張
**ファイル**: `src/features/ipne/collision.ts`

- [x] `checkEnemyCollision()` 関数
  - [x] プレイヤーと敵の衝突判定
- [x] `getEnemyAtPosition()` 関数
  - [x] 指定位置の敵を取得
- [x] `getEnemiesInRange()` 関数
  - [x] 範囲内の敵リストを取得

### Task 4.3: combat.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/combat.test.ts`

- [x] プレイヤー攻撃テスト
  - [x] 前方1タイルの敵にダメージ
  - [x] 範囲外の敵にはダメージなし
  - [x] クールダウン中は攻撃不可
- [x] 接触ダメージテスト
  - [x] 同じタイルで接触判定
  - [x] 敵のdamage値分ダメージ
  - [x] 無敵中はダメージなし
- [x] ノックバックテスト
  - [x] 攻撃方向に1タイル移動
  - [x] 壁があれば停止

---

## フェーズ5: アイテムシステム

### Task 5.1: item.ts 新規作成
**ファイル**: `src/features/ipne/item.ts`

- [x] `ITEM_CONFIGS` 定数定義
  - [x] 小回復: healAmount: 2
  - [x] 大回復: healAmount: 5
- [x] `SPAWN_CONFIG` 定数定義
  - [x] 小回復: 8個
  - [x] 大回復: 3個
- [x] `generateItemId()` 関数
- [x] `createItem()` 関数
- [x] `createHealthSmall()` 関数
- [x] `createHealthLarge()` 関数
- [x] `spawnItems()` 関数
  - [x] Room配列から配置位置を決定
  - [x] 敵と重ならない位置を選択
- [x] `canPickupItem()` 関数
  - [x] プレイヤーとアイテムの位置一致判定
- [x] `pickupItem()` 関数
  - [x] アイテム取得処理
  - [x] 回復効果適用
  - [x] アイテム削除

### Task 5.2: item.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/item.test.ts`

- [x] アイテム生成テスト
  - [x] 各種類が正しく生成される
  - [x] パラメータが正しい
- [x] 取得判定テスト
  - [x] 同じタイルで取得可能
  - [x] 離れていると取得不可
- [x] 効果適用テスト
  - [x] HP回復が正しい
  - [x] 最大HPを超えない

---

## フェーズ6: UI・演出

### Task 6.1: IpnePage.tsx 拡張（状態管理・ゲームループ）
**ファイル**: `src/pages/IpnePage.tsx`

- [x] 状態追加
  - [x] `enemies: Enemy[]` state
  - [x] `items: Item[]` state
  - [x] `isGameOver: boolean` state
- [x] ゲームループ更新（useEffect内）
  - [x] 敵AI更新処理（200ms間隔）
  - [x] 敵衝突判定
  - [x] アイテム取得判定
  - [x] ゲームオーバー判定
- [x] `handleAttack()` 関数追加
  - [x] スペースキー / 攻撃ボタンで発火
  - [x] playerAttack() 呼び出し
  - [x] 敵リスト更新
- [x] ゲーム初期化時の敵・アイテム生成
  - [x] spawnEnemies() 呼び出し
  - [x] spawnItems() 呼び出し

### Task 6.2: IpnePage.tsx 拡張（描画）
**ファイル**: `src/pages/IpnePage.tsx`

- [x] `drawEnemies()` 関数追加
  - [x] 種類別の色分け
  - [x] ボスは大きく表示
  - [x] ノックバック中は点滅
- [x] `drawItems()` 関数追加
  - [x] 種類別の形状・色
- [x] `drawPlayerWithDirection()` 関数修正
  - [x] 向きを視覚的に表示（三角形 or 矢印）
  - [x] 無敵時間中は点滅
- [x] `drawAttackEffect()` 関数追加
  - [x] 攻撃時に前方タイルをハイライト
- [x] `drawHPBar()` 関数追加
  - [x] 画面左上にHP表示
  - [x] 色はHP割合で変化（緑→黄→赤）
- [x] `drawDamageOverlay()` 関数追加
  - [x] ダメージ時に画面全体を赤くフラッシュ
- [x] ゲームオーバー画面追加
  - [x] 「GAME OVER」表示
  - [x] リトライボタン
  - [x] タイトルへ戻るボタン

### Task 6.3: IpnePage.styles.ts 拡張
**ファイル**: `src/pages/IpnePage.styles.ts`

- [x] `HPBarContainer` スタイル追加
- [x] `HPBar` スタイル追加（色変化対応）
- [x] `AttackButton` スタイル追加（D-pad中央用）
- [x] `GameOverContainer` スタイル追加
- [x] `GameOverTitle` スタイル追加
- [x] `GameOverButton` スタイル追加
- [x] `DamageOverlay` スタイル追加

---

## フェーズ7: 統合・バランス調整

### Task 7.1: index.ts 更新
**ファイル**: `src/features/ipne/index.ts`

- [x] 新規モジュールのエクスポート追加
  - [x] enemy.ts
  - [x] enemySpawner.ts
  - [x] enemyAI.ts
  - [x] combat.ts
  - [x] item.ts
- [x] 新規型のエクスポート追加
  - [x] Enemy, EnemyType, EnemyState
  - [x] Item, ItemType
  - [x] 戦闘関連型

### Task 7.2: バランス調整
- [x] 敵配置数の調整
  - [x] プレイ体験に基づいて増減
- [x] 敵パラメータの微調整
  - [x] 視認範囲
  - [x] 追跡範囲
  - [x] 速度
  - [x] ダメージ
- [x] アイテム配置数の調整
  - [X] 回復量とバランスを確認

### Task 7.3: プレイテスト検証（手動）

> **MVP2の本質：「危険がある中で探索する体験が成立するか」を検証**

- [x] プレイ時間計測（目標：5〜7分）
- [x] 以下の評価観点をチェック
  - [x] 敵を避ける選択が生まれたか
  - [x] 戦闘が「必須」になっていないか
  - [x] HPを見て行動を変えたか
  - [x] 理不尽に感じる瞬間がないか
- [x] NG例の確認
  - [x] 敵が多すぎて探索できない → 敵数減少
  - [x] 戦わないと進めない → 配置調整
  - [x] 被弾が頻発してストレス → 速度・範囲調整

### Task 7.4: テスト・検証
- [x] 全テスト実行 `npm test`
- [x] TypeScriptコンパイル確認 `npx tsc --noEmit`
- [x] 手動動作確認
  - [x] 敵がマップ上に表示される
  - [x] 敵AIが正しく動作する
  - [x] 攻撃で敵を倒せる
  - [x] 接触でダメージを受ける
  - [x] アイテムで回復できる
  - [x] ゲームオーバーが発生する
  - [x] クリアできる

---

## 依存関係

```
フェーズ0 → フェーズ1 → フェーズ4
         ↘ フェーズ2 → フェーズ3 ↗
         ↘ フェーズ5 ↗
                    ↘ フェーズ6 → フェーズ7
```

- フェーズ0（型定義・テスト準備）は最初に完了
- フェーズ1（プレイヤー拡張）、フェーズ2（敵基本）、フェーズ5（アイテム）は並行可能
- フェーズ3（敵AI）はフェーズ2の完了後
- フェーズ4（戦闘）はフェーズ1・2・3の完了後
- フェーズ6（UI・演出）は全機能実装後
- フェーズ7（統合・調整）は最後

---

## 注意事項

- **既存のMVP1コードを直接拡張・改修**（新規ページ追加ではない）
- 敵は「判断を迫る存在」として配置（理不尽な難易度は避ける）
- 戦っても避けてもクリアできるバランスを目指す
- テストファーストで進める
- 評価観点（ルート選択変化、プレッシャー）を常に意識
