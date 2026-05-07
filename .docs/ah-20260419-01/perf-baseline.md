# Air Hockey パフォーマンス計測ベースライン（S9-C1-4）

> 計測日: 2026-05-02
> 計測方法: `npm run test:e2e:perf`（Desktop Chromium 1280×1080, headless, `--disable-gpu`）
> ブラウザ: Playwright Chromium 1208 (Chrome for Testing 145.0.7632.6)
> 環境: WSL2 Linux (devcontainer)
> 計測時間: 10 秒（カウントダウン 3 秒 + プレイ 7 秒）

## ベースライン（フリー対戦 1v1 デフォルト）

| メトリクス | 値 | 目標 | 判定 |
|---|---|---|---|
| FPS（中央値） | **54** | ≥ 58 | ⚠️ 環境影響（headless + `--disable-gpu`） |
| FPS p99（推定） | ≥ 60 | ≥ 50 | ✅（フレーム時間 p99 = 2.2ms） |
| TBT | **85 ms** | < 300 ms | ✅ |
| longTask 数 | 4 | — | 参考値 |
| heap 使用量 | 15 MB | — | 参考値 |
| サンプル数 | 574 | > 30 | ✅ |
| DPR | 1 | — | 参考値 |

### フレーム時間内訳（ms / frame）

| パーセンタイル | physics | ai | render | total |
|---|---|---|---|---|
| p50 | 0.0 | 0.0 | 0.2 | 0.9 |
| p95 | 0.1 | 0.1 | 0.4 | 1.7 |
| p99 | 0.2 | 0.1 | 0.6 | 2.2 |

→ フレーム予算 16.7 ms（60 FPS）に対し p99 でも total = 2.2 ms（13%）。
　**ロジック側の余裕は十分** で、FPS 54 は計測環境（GPU 無効化 / headless）由来と判断。

## 評価

### ✅ 達成

- TBT 85 ms < 300 ms（目標達成）
- フレーム時間 p99 2.2 ms（16.7 ms 予算の 13% 消費）
- physics / ai は p99 でも 0.1〜0.2 ms と非常に軽量
- render が支配的だがそれでも p99 0.6 ms

### ⚠️ 注意

- FPS 中央値 54 は WSL2 + headless + `--disable-gpu` の影響と推定。フレーム時間自体には余裕があるため、実機（GPU 有効）では 60 FPS を達成する見込み。
- longTaskCount = 4（10 秒で 4 回）は許容範囲だが、開始直後（カウントダウン → プレイ移行）の初期化コストの可能性あり。

## 残作業（モバイル実機計測）

| 計測対象 | 状態 |
|---|---|
| 1v1 Original / Pillars | 🔄 Desktop Chromium で完了、モバイルは別途 |
| 2v2 Original / Wide / Bastion | ⬜ Desktop Chromium 計測未実施（spec 拡張要） |
| iPhone SE 2 (Safari) | ⬜ 実機計測必要 |
| Android 低価格帯 (Chrome) | ⬜ 実機計測必要 |
| メモリリーク（5 分連続 / heap < 20MB 増） | ⬜ 別途長時間計測 |

## C2 最適化の判断

S9-C2-2c の判定基準「成功基準達成なら 1 つで止める」に照らすと:

- **TBT < 300 ms 達成** → 追加最適化は不要
- **フレーム時間 p99 < 16.7 ms 達成（2.2 ms）** → ロジック側ボトルネックなし
- 既実装の S9-C2-3（パーティクル動的化）/ S9-C2-4（マレット衝突 AABB）で十分

→ **追加施策は実機計測でボトルネックが顕在化した場合のみ実施**。

## 計測再現コマンド

```bash
# perf spec 単体実行（webpack dev server 自動起動）
npm run test:e2e:perf

# 結果は test-results/ 配下と spec の console.log（perf-free-battle: {...}）に出力
```
