# タスク一覧・進捗管理（IPNE MVP2）

## 進捗サマリー

| フェーズ | 状況 | 完了タスク |
|---------|------|-----------|
| フェーズ0: 型定義・テスト準備 | ⬜ 未着手 | 0/3 |
| フェーズ1: プレイヤー拡張 | ⬜ 未着手 | 0/2 |
| フェーズ2: 敵基本システム | ⬜ 未着手 | 0/3 |
| フェーズ3: 敵AI | ⬜ 未着手 | 0/5 |
| フェーズ4: 戦闘システム | ⬜ 未着手 | 0/3 |
| フェーズ5: アイテムシステム | ⬜ 未着手 | 0/2 |
| フェーズ6: UI・演出 | ⬜ 未着手 | 0/3 |
| フェーズ7: 統合・バランス調整 | ⬜ 未着手 | 0/4 |
| **合計** | **0%** | **0/25** |

---

## フェーズ0: 型定義・テスト準備（TDD起点）

### Task 0.1: types.ts 拡張
**ファイル**: `src/features/ipne/types.ts`

- [ ] Player型拡張
  - [ ] `hp: number` フィールド追加
  - [ ] `maxHp: number` フィールド追加
  - [ ] `direction: DirectionValue` フィールド追加
  - [ ] `isInvincible: boolean` フィールド追加
  - [ ] `invincibleUntil: number` フィールド追加
  - [ ] `attackCooldownUntil: number` フィールド追加
- [ ] EnemyType 定義 (`'patrol' | 'charge' | 'flee'`)
- [ ] EnemyState 定義 (`'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'return' | 'knockback'`)
- [ ] Enemy型 定義
  - [ ] id, x, y, type, hp, maxHp, damage, speed
  - [ ] detectionRange, chaseRange, state
  - [ ] patrolPath, patrolIndex, homePosition
  - [ ] lastKnownPlayerPos, knockbackUntil, knockbackDirection
- [ ] ItemType 定義 (`'health_small' | 'health_large'`)
- [ ] Item型 定義 (id, x, y, type, healAmount)
- [ ] CombatState型 定義（必要に応じて）
- [ ] GameState拡張（enemies, items 配列追加）

### Task 0.2: テストユーティリティ作成
**ファイル**: `src/features/ipne/__tests__/testUtils.ts`

- [ ] `createTestMap()` - テスト用マップ生成ヘルパー
- [ ] `createTestPlayer()` - テスト用プレイヤー生成ヘルパー（HP付き）
- [ ] `createTestEnemy()` - テスト用敵生成ヘルパー
- [ ] `createTestItem()` - テスト用アイテム生成ヘルパー

### Task 0.3: 既存テスト確認
- [ ] `npm test` 実行で既存テストが通ることを確認
- [ ] 型変更によるコンパイルエラーがないことを確認

---

## フェーズ1: プレイヤー拡張

### Task 1.1: player.ts 拡張
**ファイル**: `src/features/ipne/player.ts`

- [ ] `createPlayer()` 関数の拡張
  - [ ] HP初期化（hp: 12, maxHp: 12）
  - [ ] 向き初期化（direction: 'down'）
  - [ ] 無敵時間初期化（isInvincible: false, invincibleUntil: 0）
  - [ ] 攻撃クールダウン初期化（attackCooldownUntil: 0）
- [ ] `updatePlayerDirection()` 関数追加
  - [ ] 移動時に向きを更新
- [ ] `damagePlayer()` 関数追加
  - [ ] HP減少処理
  - [ ] 無敵時間設定
  - [ ] HP0でゲームオーバーフラグ
- [ ] `healPlayer()` 関数追加
  - [ ] HP回復（最大HPを超えない）
- [ ] `isPlayerInvincible()` 関数追加
  - [ ] 現在時刻と比較して無敵判定
- [ ] `canPlayerAttack()` 関数追加
  - [ ] クールダウン判定
- [ ] `setAttackCooldown()` 関数追加
  - [ ] 攻撃後のクールダウン設定

### Task 1.2: player.test.ts 拡張
**ファイル**: `src/features/ipne/__tests__/player.test.ts`

- [ ] HP初期化テスト
- [ ] ダメージ計算テスト
  - [ ] 正常にHPが減少する
  - [ ] HP0以下にならない（最低0）
- [ ] 回復計算テスト
  - [ ] 正常にHPが回復する
  - [ ] 最大HPを超えない
- [ ] 向き更新テスト
  - [ ] 移動方向に応じて向きが更新される
- [ ] 無敵時間テスト
  - [ ] 被ダメージ後に無敵状態になる
  - [ ] 時間経過で無敵が解除される
- [ ] 攻撃クールダウンテスト
  - [ ] 攻撃後にクールダウンが設定される
  - [ ] クールダウン中は攻撃不可

---

## フェーズ2: 敵基本システム

### Task 2.1: enemy.ts 新規作成
**ファイル**: `src/features/ipne/enemy.ts`

- [ ] `ENEMY_CONFIGS` 定数定義
  - [ ] 巡回型パラメータ（HP:3, damage:1, speed:3, detectionRange:5, chaseRange:8）
  - [ ] 突進型パラメータ（HP:2, damage:2, speed:5, detectionRange:6, chaseRange:10）
  - [ ] 逃走型パラメータ（HP:1, damage:0, speed:4, detectionRange:4）
  - [ ] ボスパラメータ（HP:10, damage:3, speed:4, detectionRange:8, chaseRange:15）
- [ ] `generateEnemyId()` 関数（一意ID生成）
- [ ] `createEnemy()` 関数（種類別パラメータ設定）
- [ ] `createPatrolEnemy()` 関数
- [ ] `createChargeEnemy()` 関数
- [ ] `createFleeEnemy()` 関数
- [ ] `createBoss()` 関数
- [ ] `isEnemyAlive()` 関数
- [ ] `damageEnemy()` 関数
- [ ] `applyKnockbackToEnemy()` 関数

### Task 2.2: enemySpawner.ts 新規作成
**ファイル**: `src/features/ipne/enemySpawner.ts`

- [ ] `SPAWN_CONFIG` 定数定義
  - [ ] 合計敵数: 25 + ボス1
  - [ ] 構成: 巡回型15、突進型8、逃走型2
- [ ] `spawnEnemies()` 関数（Room配列から敵配置）
  - [ ] スタート部屋には配置しない
  - [ ] ゴール部屋にボスを配置
  - [ ] 部屋サイズに応じて1〜3体配置
- [ ] `getSpawnPositionsForRoom()` 関数
  - [ ] 部屋内の床タイルから配置位置を選択
- [ ] `distributeEnemyTypes()` 関数
  - [ ] 各部屋への敵種類割り当て

### Task 2.3: enemy.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/enemy.test.ts`

- [ ] 敵生成テスト
  - [ ] 各種類の敵が正しく生成される
  - [ ] パラメータが正しく設定される
- [ ] 敵ID一意性テスト
- [ ] ダメージテスト
  - [ ] HP減少が正しい
  - [ ] HP0で死亡判定
- [ ] ノックバックテスト

---

## フェーズ3: 敵AI

### Task 3.1: enemyAI.ts 新規作成（共通ロジック）
**ファイル**: `src/features/ipne/enemyAI.ts`

- [ ] `AI_CONFIG` 定数定義
  - [ ] 移動更新間隔: 200ms
  - [ ] 追跡タイムアウト: 3000ms
- [ ] `updateEnemyAI()` 関数（メイン更新）
  - [ ] 状態に応じた振る舞い分岐
- [ ] `detectPlayer()` 関数
  - [ ] マンハッタン距離で視認判定
  - [ ] 壁越しは視認不可（オプション：簡易版は距離のみ）
- [ ] `shouldChase()` 関数
  - [ ] 視認範囲内かつ追跡距離内
- [ ] `shouldStopChase()` 関数
  - [ ] 追跡距離を超えた
  - [ ] 一定時間見失った
- [ ] `moveEnemyTowards()` 関数
  - [ ] 目標位置に向かって1ステップ移動
  - [ ] 壁衝突判定

### Task 3.2: 巡回型AI
**ファイル**: `src/features/ipne/enemyAI.ts`

- [ ] `updatePatrolEnemy()` 関数
  - [ ] 巡回状態: パスに沿って移動
  - [ ] 追跡状態: プレイヤーを追う
  - [ ] 帰還状態: 初期位置に戻る
- [ ] `generatePatrolPath()` 関数
  - [ ] 初期位置から4〜8タイルの往復パス生成
- [ ] `getNextPatrolPoint()` 関数
  - [ ] 現在のインデックスから次の目標を取得

### Task 3.3: 突進型AI
**ファイル**: `src/features/ipne/enemyAI.ts`

- [ ] `updateChargeEnemy()` 関数
  - [ ] 待機状態: その場で待機
  - [ ] 追跡状態: 直線的にプレイヤーに接近
- [ ] `getDirectPathToPlayer()` 関数
  - [ ] プレイヤー方向への直線経路計算

### Task 3.4: 逃走型AI
**ファイル**: `src/features/ipne/enemyAI.ts`

- [ ] `updateFleeEnemy()` 関数
  - [ ] 待機状態: その場で待機
  - [ ] 逃走状態: プレイヤーから離れる
- [ ] `calculateFleeDirection()` 関数
  - [ ] プレイヤーと反対方向を計算

### Task 3.5: enemyAI.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/enemyAI.test.ts`

- [ ] 視認判定テスト
  - [ ] 範囲内で視認成功
  - [ ] 範囲外で視認失敗
- [ ] 追跡開始テスト
- [ ] 追跡中断テスト
  - [ ] 距離超過で中断
  - [ ] タイムアウトで中断
- [ ] 巡回移動テスト
  - [ ] パスに沿って移動
  - [ ] 端で折り返し
- [ ] 逃走移動テスト
  - [ ] プレイヤーと反対方向に移動

---

## フェーズ4: 戦闘システム

### Task 4.1: combat.ts 新規作成
**ファイル**: `src/features/ipne/combat.ts`

- [ ] `COMBAT_CONFIG` 定数定義
  - [ ] プレイヤー攻撃力: 1
  - [ ] 攻撃クールダウン: 500ms
  - [ ] ノックバック距離: 1タイル
  - [ ] ノックバック時間: 200ms
  - [ ] 無敵時間: 1000ms
- [ ] `playerAttack()` 関数
  - [ ] クールダウンチェック
  - [ ] 攻撃範囲内の敵を取得
  - [ ] ダメージ適用
  - [ ] ノックバック適用
  - [ ] クールダウン設定
- [ ] `getAttackTarget()` 関数
  - [ ] プレイヤーの前方1タイルの敵を取得
- [ ] `processEnemyContact()` 関数
  - [ ] 接触判定（同じタイル）
  - [ ] 無敵チェック
  - [ ] ダメージ適用
- [ ] `applyKnockback()` 関数
  - [ ] 方向に応じた移動計算
  - [ ] 壁衝突で停止
- [ ] `isKnockbackComplete()` 関数
  - [ ] 時間経過でノックバック終了判定

### Task 4.2: collision.ts 拡張
**ファイル**: `src/features/ipne/collision.ts`

- [ ] `checkEnemyCollision()` 関数
  - [ ] プレイヤーと敵の衝突判定
- [ ] `getEnemyAtPosition()` 関数
  - [ ] 指定位置の敵を取得
- [ ] `getEnemiesInRange()` 関数
  - [ ] 範囲内の敵リストを取得

### Task 4.3: combat.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/combat.test.ts`

- [ ] プレイヤー攻撃テスト
  - [ ] 前方1タイルの敵にダメージ
  - [ ] 範囲外の敵にはダメージなし
  - [ ] クールダウン中は攻撃不可
- [ ] 接触ダメージテスト
  - [ ] 同じタイルで接触判定
  - [ ] 敵のdamage値分ダメージ
  - [ ] 無敵中はダメージなし
- [ ] ノックバックテスト
  - [ ] 攻撃方向に1タイル移動
  - [ ] 壁があれば停止

---

## フェーズ5: アイテムシステム

### Task 5.1: item.ts 新規作成
**ファイル**: `src/features/ipne/item.ts`

- [ ] `ITEM_CONFIGS` 定数定義
  - [ ] 小回復: healAmount: 2
  - [ ] 大回復: healAmount: 5
- [ ] `SPAWN_CONFIG` 定数定義
  - [ ] 小回復: 8個
  - [ ] 大回復: 3個
- [ ] `generateItemId()` 関数
- [ ] `createItem()` 関数
- [ ] `createHealthSmall()` 関数
- [ ] `createHealthLarge()` 関数
- [ ] `spawnItems()` 関数
  - [ ] Room配列から配置位置を決定
  - [ ] 敵と重ならない位置を選択
- [ ] `canPickupItem()` 関数
  - [ ] プレイヤーとアイテムの位置一致判定
- [ ] `pickupItem()` 関数
  - [ ] アイテム取得処理
  - [ ] 回復効果適用
  - [ ] アイテム削除

### Task 5.2: item.test.ts 新規作成
**ファイル**: `src/features/ipne/__tests__/item.test.ts`

- [ ] アイテム生成テスト
  - [ ] 各種類が正しく生成される
  - [ ] パラメータが正しい
- [ ] 取得判定テスト
  - [ ] 同じタイルで取得可能
  - [ ] 離れていると取得不可
- [ ] 効果適用テスト
  - [ ] HP回復が正しい
  - [ ] 最大HPを超えない

---

## フェーズ6: UI・演出

### Task 6.1: IpnePage.tsx 拡張（状態管理・ゲームループ）
**ファイル**: `src/pages/IpnePage.tsx`

- [ ] 状態追加
  - [ ] `enemies: Enemy[]` state
  - [ ] `items: Item[]` state
  - [ ] `isGameOver: boolean` state
- [ ] ゲームループ更新（useEffect内）
  - [ ] 敵AI更新処理（200ms間隔）
  - [ ] 敵衝突判定
  - [ ] アイテム取得判定
  - [ ] ゲームオーバー判定
- [ ] `handleAttack()` 関数追加
  - [ ] スペースキー / 攻撃ボタンで発火
  - [ ] playerAttack() 呼び出し
  - [ ] 敵リスト更新
- [ ] ゲーム初期化時の敵・アイテム生成
  - [ ] spawnEnemies() 呼び出し
  - [ ] spawnItems() 呼び出し

### Task 6.2: IpnePage.tsx 拡張（描画）
**ファイル**: `src/pages/IpnePage.tsx`

- [ ] `drawEnemies()` 関数追加
  - [ ] 種類別の色分け
  - [ ] ボスは大きく表示
  - [ ] ノックバック中は点滅
- [ ] `drawItems()` 関数追加
  - [ ] 種類別の形状・色
- [ ] `drawPlayerWithDirection()` 関数修正
  - [ ] 向きを視覚的に表示（三角形 or 矢印）
  - [ ] 無敵時間中は点滅
- [ ] `drawAttackEffect()` 関数追加
  - [ ] 攻撃時に前方タイルをハイライト
- [ ] `drawHPBar()` 関数追加
  - [ ] 画面左上にHP表示
  - [ ] 色はHP割合で変化（緑→黄→赤）
- [ ] `drawDamageOverlay()` 関数追加
  - [ ] ダメージ時に画面全体を赤くフラッシュ
- [ ] ゲームオーバー画面追加
  - [ ] 「GAME OVER」表示
  - [ ] リトライボタン
  - [ ] タイトルへ戻るボタン

### Task 6.3: IpnePage.styles.ts 拡張
**ファイル**: `src/pages/IpnePage.styles.ts`

- [ ] `HPBarContainer` スタイル追加
- [ ] `HPBar` スタイル追加（色変化対応）
- [ ] `AttackButton` スタイル追加（D-pad中央用）
- [ ] `GameOverContainer` スタイル追加
- [ ] `GameOverTitle` スタイル追加
- [ ] `GameOverButton` スタイル追加
- [ ] `DamageOverlay` スタイル追加

---

## フェーズ7: 統合・バランス調整

### Task 7.1: index.ts 更新
**ファイル**: `src/features/ipne/index.ts`

- [ ] 新規モジュールのエクスポート追加
  - [ ] enemy.ts
  - [ ] enemySpawner.ts
  - [ ] enemyAI.ts
  - [ ] combat.ts
  - [ ] item.ts
- [ ] 新規型のエクスポート追加
  - [ ] Enemy, EnemyType, EnemyState
  - [ ] Item, ItemType
  - [ ] 戦闘関連型

### Task 7.2: バランス調整
- [ ] 敵配置数の調整
  - [ ] プレイ体験に基づいて増減
- [ ] 敵パラメータの微調整
  - [ ] 視認範囲
  - [ ] 追跡範囲
  - [ ] 速度
  - [ ] ダメージ
- [ ] アイテム配置数の調整
  - [ ] 回復量とバランスを確認

### Task 7.3: プレイテスト検証（手動）

> **MVP2の本質：「危険がある中で探索する体験が成立するか」を検証**

- [ ] プレイ時間計測（目標：5〜7分）
- [ ] 以下の評価観点をチェック
  - [ ] 敵を避ける選択が生まれたか
  - [ ] 戦闘が「必須」になっていないか
  - [ ] HPを見て行動を変えたか
  - [ ] 理不尽に感じる瞬間がないか
- [ ] NG例の確認
  - [ ] 敵が多すぎて探索できない → 敵数減少
  - [ ] 戦わないと進めない → 配置調整
  - [ ] 被弾が頻発してストレス → 速度・範囲調整

### Task 7.4: テスト・検証
- [ ] 全テスト実行 `npm test`
- [ ] TypeScriptコンパイル確認 `npx tsc --noEmit`
- [ ] 手動動作確認
  - [ ] 敵がマップ上に表示される
  - [ ] 敵AIが正しく動作する
  - [ ] 攻撃で敵を倒せる
  - [ ] 接触でダメージを受ける
  - [ ] アイテムで回復できる
  - [ ] ゲームオーバーが発生する
  - [ ] クリアできる

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
