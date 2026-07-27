# 「配置して観戦する」型ゲームの実例調査 — 観戦時間を退屈にしないために何をしているか

> Issue #183 / Epic #178（灰燼の城壁 プリプロダクション）
> 調査日: 2026-07-27
> 前提: 本調査は**実例からの帰納**であり、抽象論（MDA / Koster / Meier / Keith）を扱った
> `2026-07-26-game-design-fundamentals-research.md` の欠落（Problem 7）を埋めるもの。

---

## エグゼクティブサマリー

**中心の問いに対する答えは「観戦の時間を、退屈にしないようにしているのではなく、そもそも純粋な観戦時間をほとんど作っていない」だった。**

調査した6タイトルのうち、戦闘中にプレイヤーが何もできないのは **Mechabellum ただ1本**である。Kingdom Rush・Arknights・Thronefall は戦闘中に直接介入でき、Legion TD 2 は戦闘中も経済的な決断（傭兵送り・王強化）を続けられる。そして唯一の純粋観戦である Mechabellum ですら、戦闘フェーズを**最大1分30秒に制限し、加速ボタンと加速投票を用意し、開始と同時に霧を晴らして情報を一括開示する**という3重の管理下に置いている。

一方、灰燼の城壁の観戦時間は**塔なしで W1 18.1秒 / W2 17.1秒 / W3 28.4秒（計63.6秒）**あり、その間に描画されるのは**敵マーカーの移動と「⚔️ 戦闘中…」という固定テキストだけ**である。発射・命中・撃破・漏れの各イベントは `domain` 側で `TickEvent` として計算済みだが、**プレゼンテーション層が一度も読んでいない**。速度変更もスキップも存在しない。

したがって「単調で面白くない」という実プレイ判定は、**環③（決断）の不足より前に、環④（結果の検証・フィードバック）がコードレベルで欠落している**ことで十分に説明がつく。しかも埋めるための材料（イベント列）はすでに存在し、描画されていないだけである。

---

## 調査方法

### リサーチクエスチョン（PEO）

- **P**opulation: 「配置して観戦する」構造を持つゲーム（TD / オートバトラー / デッキ構築TD）
- **E**xposure: 敵・自軍・盤面の見せ方、観戦時間の設計、単調さの回避手法
- **O**utcome: 灰燼の城壁に適用できる具体的な設計パターン

**中心の問い**: 「配置して観戦する」型のゲームは、観戦の時間を退屈にしないために何をしているか。

### 調査対象

Mechabellum / Legion TD 2 / Thronefall / Kingdom Rush / Arknights / Slay the Spire
（調査中に **Into the Breach** を完全情報の比較対象として追加。逆に、TFT は 1v1 非対称の本作と構造が離れるため周辺参照に留めた）

### 手法と情報源の扱い

- WebSearch → 一次寄りの情報源（開発者ブログ・公式マニュアル・Dev Log）を優先して WebFetch
- **WebFetch の出力は小型モデルによる要約**であるため、**逐語引用として提示しない**。本レポートでは引用符を用いず「〜という趣旨」と記述する（[research-integrity の教訓](2026-07-26-game-design-fundamentals-research.md) に従う）
- **反証を明示的に探索**した（「この手法は効いていない」という評価。§発見7・§各節の反証欄）
- 灰燼の城壁側の現状は**推測せずコードと実測で確認**した（§9）

### 情報源の種類と数

開発者一次情報 3件（Legion TD 2 公式 HUD 記事・公式マニュアル、Mechabellum Dev Log）／設計分析記事 3件（Gamedeveloper.com、Jeremiah Franczyk、Donat Vatoci）／専門メディアレビュー 2件／ゲーム内資料系 Wiki 4件／コミュニティ議論（Steam Discussions）2件／反証系 2件。

---

## 主要な発見事項

### 発見1: 「配置して観戦する」型は、実際にはほとんど存在しない

観戦フェーズにおけるプレイヤーの操作可能性を整理すると、以下のようになる。

| ゲーム | 戦闘中にできること | 純粋観戦か |
|---|---|---|
| **Kingdom Rush** | 呪文2種（Rain of Fire / Call Reinforcements）、兵士の集結点（Rally）変更、ヒーロー操作、戦闘中も塔の建設・強化 | **いいえ** |
| **Arknights** | オペレーターのリアルタイム配置（DP は毎秒1回復）、スキルの手動発動、撤退 | **いいえ** |
| **Thronefall** | 王を直接操作して剣・弓・アビリティで戦闘に参加 | **いいえ** |
| **Legion TD 2** | ミシリウムを消費して傭兵送り・王強化（＝次ウェーブへの投資）。ウェーブバーで味方に意思表示 | 部分的 |
| **Mechabellum** | なし（配置後は完全に自動） | **はい** |
| **Slay the Spire** | （ターン制のため観戦フェーズ自体が存在しない） | — |

- Kingdom Rush の Call Reinforcements は**リチャージ 10 秒**であり、Wiki 系解説では「使わない理由がほとんどない」という趣旨で説明されている。つまり設計上、プレイヤーは**ウェーブ中ほぼ常に何かを押している**。
- Arknights の配置コスト DP は毎秒1回復する。**戦闘が始まってから資源が貯まる**ため、配置行為そのものが戦闘中の主活動になる。
- Legion TD 2 は「ユニットを動かせない」ことをジャンル的な核としつつ、公式マニュアルの趣旨として、戦闘フェーズ中に雇った傭兵は**次のウェーブの戦闘フェーズ開始時に相手を襲う**と説明されている。観戦中の行動が次の観戦に効く構造になっている。

**含意**: 「配置して観戦する」を字義通り実装したのは Mechabellum だけであり、それは**例外であって標準ではない**。灰燼の城壁は無自覚にこの最難関の形式を選んでいる。

- 出典:
  - [Call Reinforcements | Kingdom Rush Wiki](https://kingdomrushtd.fandom.com/wiki/Call_Reinforcements)（2026-07-27 アクセス）
  - [Deployment Point | Arknights Wiki](https://arknights.fandom.com/wiki/Deployment_Point)（2026-07-27 アクセス）
  - [Legion TD 2 — Game manual](https://beta.legiontd2.com/manual/)（公式・2026-07-27 アクセス）
  - [Thronefall — A Take on Minimalism](https://donatvatoci1.medium.com/thronefall-a-take-on-minimalism-trimming-the-fat-from-strategy-b76b2413a10c)（Donat Vatoci, 2024-11-01）

---

### 発見2: 唯一の純粋観戦（Mechabellum）は、観戦時間を「短く・速く・情報過多に」して管理している

Mechabellum は本作にもっとも近い構造だが、観戦を放置していない。

**(a) 時間の上限がある。** コミュニティ議論によれば、準備フェーズが最大1分30秒、**戦闘フェーズは1分〜1分30秒程度**で、1ラウンド約2分30秒〜3分、1試合6〜10ラウンドで15〜20分程度とされる（Steam Discussions・複数スレッドで概ね一致。公式仕様書ではない点に留意）。

**(b) 加速手段がある。** Dev Log で開発チームは、**終盤のラウンドが遅くなる問題を認識している**と述べ、特定条件（片側が対空手段のない相手に空軍だけを残した場合など）での**自動加速**と、両者合意による**加速投票**を導入する趣旨を書いている。加えて実装上、戦闘中に加速ボタンが出現する。

> **これは開発者自身が「観戦時間は放っておくと退屈になる」と認めている一次証言**である。本調査でもっとも直接的な回答。

**(c) 観戦の冒頭に「開示」を置く。** 準備中は戦場に**戦場の霧**がかかっており、**ラウンド開始と同時に霧が晴れて、相手が何を追加し何を強化したかが一気に見える**という趣旨の解説が複数ある。つまり観戦の最初の数秒は「答え合わせの開示」で埋められており、**視線が動く理由が設計されている**。

- 出典:
  - [Mechabellum Dev Log #1 | MechaMonarch](https://mechamonarch.com/news/mechabellum-dev-log-1/)（開発者投稿の転載。2026-07-27 アクセス）
  - [Round Duration :: Mechabellum Balancing & Suggestions](https://steamcommunity.com/app/669330/discussions/1/3833172420323304459/) / [How long do matches take?](https://steamcommunity.com/app/669330/discussions/0/3802776070754772002/)（コミュニティ、2026-07-27 アクセス）
  - [Mechabellum Tips Guide | Pro Game Guides](https://progameguides.com/mechabellum/mechabellum-tips-guide-reinforcements-research-points-specialists/)（2026-07-27 アクセス）

---

### 発見3: 観戦が面白いのは「自分の過去の決断が連鎖して見える」ときだけ

Mechabellum の観戦体験について、PC Gamer のレビューは概ね次の趣旨を述べている（**WebFetch でページ本文を取得できず、検索結果経由の要約に基づく。原文未確認**）——2ラウンド目に敵の射手から戦車を守るために買った歩兵がナパーム砲に焼かれ、守りを失った戦車がスナイパーに落とされ、前線を失ったトラックが次に落ちる、という**因果の連鎖**が観戦中に見える。プレイヤーは自分の小さなユニットに声援を送り、間違った場所に突っ込むのを見て呻く。

さらに Mechabellum では、**ラウンド終了時に生き残ったユニットの供給コスト合計が相手へのダメージになる**という趣旨の説明がある。これは「勝ったか負けたか」ではなく**「どれだけ余裕を持って勝ったか」が結果に直結する**ということであり、戦闘の中盤〜終盤にも意味が残り続ける。全滅寸前の辛勝と完勝が同じ扱いなら、決着がついた時点で見る理由が消える。

**含意**: 観戦を面白くしているのは演出そのものではなく、**「準備の決断 → 観戦中の可視の因果 → 勝ち方の程度が次に効く」という閉じた輪**である。

- 出典: [I can't stop playing this autobattling strategy masterpiece | PC Gamer](https://www.pcgamer.com/i-cant-stop-playing-this-autobattling-strategy-masterpiece/)（**本文取得失敗・検索要約経由。要再検証**）／[Mechabellum Review | MonsterVine](https://monstervine.com/2025/04/mechabellum-review/)（2025-04）

---

### 発見4: 予告（完全情報）は観戦の**前**に置かれ、観戦を「答え合わせ」に変える

- **Slay the Spire**: 敵の頭上に次の行動（intent）を表示し、攻撃なら**ダメージ量と回数**まで出す。Wiki 系解説によれば多くの場合これは正確で、Vulnerable / Weak などのデバフも反映される。
- **Legion TD 2**: 公式マニュアルの趣旨として、**敵ウェーブは毎試合まったく同じ構成・同じ順序で出現するため、先を読んで計画することが有利になる**と明記されている。画面上部に**ウェーブバー**があり、さらにそれをクリックして「送る／送られると思う」という意思表示を味方に伝えられる。
- **Into the Breach / Slay the Spire の完全情報論**: Jeremiah Franczyk（2019-03-04）は、敵の意図を事前に明かす「完全情報」が各ターンを**ミニパズル**に変え、失敗したときにプレイヤーが**ブラックボックスのせいにできなくなる**（＝失敗の原因が自分に帰属する）と論じている。ただし彼自身、**完全情報だけが両作の成功要因ではない**とはっきり留保しており、バランス・深さ・可能性空間の広さも同等に効いていると書いている。

**灰燼の城壁との関係**: 本作はすでに**固定ウェーブ**（`PLAINS_WAVES`、乱数なし）と `WavePreview` を持っており、この型の**前半分は実装済み**である。欠けているのは後半分、すなわち**予告が観戦中に検証される（答え合わせが見える）**部分である。

- 出典: [Intent | Slay the Spire Wiki](https://slaythespire.wiki.gg/wiki/Intent)／[Legion TD 2 — Game manual](https://beta.legiontd2.com/manual/)／[Perfect Information: The Killer Feature of Slay the Spire and Into the Breach](https://jeremiahgames.com/2019/03/04/perfect-information-the-killer-feature-of-slay-the-spire-and-into-the-breach/)（Jeremiah Franczyk, 2019-03-04）

---

### 発見5: 敵の見せ方 — 初見の説明、隊列による役割提示、撃破演出による個性化

- **Arknights**: 敵は Normal / Elite / Boss の3区分と 11 種の種族に分類される。Wiki の趣旨によれば、**作戦中に初めて出現する敵にはツールチップが出て、その敵が何をするかを説明する**。つまり「知らない敵が来た」瞬間に、その場で学習機会が差し込まれる。
- **Kingdom Rush**: David Harlow の設計分析（Gamedeveloper.com, 2013-10-25）は、**装甲持ちが前に立って後方のダメージディーラーを守る**という敵の隊列そのものがプレイヤーに脅威の再評価と集結点の調整を強制する、という趣旨を述べている。**陣形が脅威の読み方を教える**設計である。
- **Kingdom Rush の撃破演出**: 敵ごとに固有の死亡アニメーションがあり（火を落として自分が燃える放火魔、氷漬けになって砕けるボス等）、レビュー・TV Tropes 系の記述では**血や緑の粘液の控えめな飛散とユーモアの混在**が個性として語られている。**撃破の瞬間そのものが敵キャラクターの表現**になっている。

- 出典: [Enemy - Arknights Terra Wiki](https://arknights.wiki.gg/wiki/Enemy)／[Kingdom Rush - the wonderful Campaign level design](https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design)（David Harlow, 2013-10-25）／[Kingdom Rush Review | Netto's Game Room](https://www.nettosgameroom.com/2025/04/kingdom-rush-review.html)

---

### 発見6: 単調さの回避は「カウンター要求の更新」と「息継ぎ」と「山場」で作られている

Harlow の分析（同上）の趣旨:

1. **各ステージが新しいカウンターを要求する。** ゴブリンで基本を教え、装甲のオーク（＝魔法塔が必要）、シャーマン（＝バースト火力が必要）、オーガ（＝持続火力が必要）と、**同じ戦術の反復では通らなくなる**ように敵を追加していく。
2. **息継ぎのステージを置く。** Silveroak Forest を「ブリーザー」として中盤の難所の手前に配置し、燃え尽きを防ぎつつ新しい塔を導入する。
3. **山場を明示的に作る。** Icewind Pass の Wave 12「Dark Knight March」（ダークナイト18体＋シャドウアーチャー12体）を、対装甲とマイクロ操作を同時に要求する設計上の頂点として挙げている。

Thronefall は別の解法をとる。Donat Vatoci（2024-11-01）の趣旨によれば、資源を**金貨1種類**に絞り、決断の数を減らして1つ1つの重みを上げたうえで、**パーク・ミューテーター・武器選択**で周回ごとの差分を作っている。

**反証（重要）**: それでも両作とも単調さの批判を受けている。

- Thronefall は Steam 全体では約 10,910 件中 95% が好評だが、否定的レビューには**「敵ユニットとミッションが単調」「ボスと強化が退屈」**という趣旨のものがある。また、建設が**1ノードに1種類の建物しか置けない**方式であることが古典的な TD の配置戦略を大きく削いでいる、という批判もある。
- Kingdom Rush は「初回は非常に中毒性があるが、**クリアしてしまうと退屈**」という趣旨の評（Reviewed.com）がある。

**含意**: カウンター要求の更新は単調さを**遅らせる**が、**消しはしない**。灰燼の城壁の現状（3ウェーブ・敵3種）は、この曲線のもっとも手前にいる。

- 出典: [Kingdom Rush - the wonderful Campaign level design](https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design)／[Thronefall on Steam](https://store.steampowered.com/app/2239150/Thronefall/) と [Steam 否定的レビュー](https://steamcommunity.com/app/2239150/negativereviews/?l=english&browsefilter=toprated)／[Kingdom Rush review | Reviewed.com](https://www.reviewed.com/content/kingdom-rush-review)

---

### 発見7: 情報密度を下げて視界を空けることが、観戦の前提条件

- **Legion TD 2** の開発チームは HUD 刷新記事で、**インターフェースの影響を最小化して戦闘そのものに集中させること**、**フットプリントを小さくして戦闘を見るための画面領域を広げること**、**相互に関係する情報をまとめること**を目的として挙げている（公式・一次情報）。Warcraft III 由来の自由度を意図的に捨てて認知負荷を下げた、という趣旨も書かれている。
- **Thronefall**: ミニマルな UI と低ポリ／セルシェード表現により、混戦時でも重要な要素が背景から浮き、プレイヤーが情報を見失わない、という評が複数ある。

**含意**: 「観戦させる」なら、**観戦対象が画面の主役でなければならない**。灰燼の城壁は S1 で盤面の可読性を上げたが、盤面の下半分が空白でありながら**戦闘中の情報は盤面外に一切出ていない**（レトロ送り項目「画面下半分の空白」と整合）。

- 出典: [Legion TD 2 - First Look at the HUD](https://beta.legiontd2.com/updates/first-look-at-the-hud/)（開発元公式）／[Thronefall Review | GameLuster](https://gameluster.com/thronefall-review-holding-on-for-one-last-night/)

---

### 発見8: juice（打撃感の演出）は必要条件だが、十分条件ではない — 明確な反証がある

**肯定側**: Jan Willem Nijman（Vlambeer）の講演 "The art of screenshake"（INDIGO Classes 2013）は、同一のゲームに対して**効果音・被弾アニメーション・弾のサイズ・連射速度・銃の反動・薬莢の落下・爆発の煙・死体の残留（permanence）・カメラの動的追従**などを段階的に足していくことで手触りが劇的に変わる過程を実演したものとして広く参照されている。**「撃破の瞬間に何を起こすか」の実例カタログ**として有用。

**反証側**: 一方で、juice を**意味ある決断の欠如を覆い隠す煙幕**として批判する論がある。趣旨としては——大量の視覚効果はプレイヤーの主体性の不足を補償できない、跳ねるアニメーションを足しても操作感の根本問題は解決しない、juice はコアメカニクスを**反響させる**ものであって無関係に振りかけるものではない、という主張である。

**この反証は本作の履歴と一致する。** PR #171（空間パズル化）は機構としては正しく動作し CI も全緑だったが、実プレイでは手応えが変わらなかった。演出だけを足しても同じことが起きうる。**したがって juice は「決断が結果に効いている」ことを見せるための手段として導入し、単独の目的にしてはならない。**

- 出典: [Jan Willem Nijman - Vlambeer - "The art of screenshake" (INDIGO Classes 2013)](https://www.youtube.com/watch?v=AJdEqssNZ-U)（**動画本体は未視聴。二次的な要約に基づく**）／[The "Juice" Problem: How Exaggerated Feedback is Harming Game Design | Wayline](https://www.wayline.io/blog/the-juice-problem-how-exaggerated-feedback-is-harming-game-design)

---

## 9. 灰燼の城壁の現状（コードと実測による確認）

推測を避けるため、本作側は実際に測った。

### 9-1. 観戦時間の実測

`simulateWave` を塔なしで実行した結果（`TICK_INTERVAL_MS = 100` で換算）:

| ウェーブ | tick 数 | 実時間 |
|---|---|---|
| W1 | 181 | **18.1 秒** |
| W2 | 171 | **17.1 秒** |
| W3 | 284 | **28.4 秒** |
| 合計 | 636 | **63.6 秒** |

塔を置けば敵が早く倒れる分は短くなるが、**W3 の 28.4 秒は Mechabellum の戦闘フェーズ上限（約90秒）の約1/3に相当する長さ**である。

### 9-2. 観戦中に描画されているもの

`src/features/ashen-rampart/presentation/AshenRampartGame.tsx:65-69` は、現在の tick から **`enemies` だけ**を取り出して `BoardGrid` に渡している。同 `:116` で表示されるのは `⚔️ 戦闘中…` という固定テキストのみ。

`domain/combat/simulate-wave.ts:38-48` は、各 tick に以下のイベント列を持っている:

```ts
export type TickEvent =
  | { kind: 'shot'; towerIndex: number; targetIndex: number }
  | { kind: 'trap'; trapIndex: number; targetIndex: number }
  | { kind: 'defeat'; enemyIndex: number }
  | { kind: 'leak'; enemyIndex: number };
```

**この `events` はプレゼンテーション層から一度も参照されていない**（`grep` で確認。参照は `replayTick` 経由の `enemies` のみ）。

### 9-3. 結論

- 観戦中に起きる**視覚的変化は、敵マーカーの座標移動のみ**である
- **発射も、命中も、撃破も、砦への漏れも、ライフの減少も、何ひとつ演出されていない**
- 速度変更・スキップ・一時停止のいずれも存在しない
- 戦闘中に操作できることは**ゼロ**（発見1の表で Mechabellum と同じ最難関の形式）

**「観戦時間そのものが空白（環④の欠落）」という Issue #183 の仮説は、コードレベルで裏付けられた。** そして埋めるための材料（イベント列）はすでに計算済みで、**描画されていないだけ**である。

---

## 10. 灰燼の城壁に適用できるパターン（優先順）

コスト = 実装規模の見積り（低: 1〜2タスク / 中: 3〜5タスク / 高: 別スプリント相当）。
期待効果 = 「観戦の20秒が見るに値するようになるか」への寄与。

| # | パターン | 出典 | 具体化 | コスト | 期待効果 |
|---|---|---|---|---|---|
| **1** | **撃破・被弾・漏れの瞬間を描画する** | 発見8（screenshake）＋発見3（因果の可視化） | 既存 `TickEvent` を `BoardGrid` に渡し、`shot` は塔→敵の線、`defeat` はマーカー消滅の演出、`leak` は砦の点滅＋ライフ減少を出す。**新規ドメイン実装は不要** | **低** | **大** |
| **2** | **再生速度の変更とスキップ** | 発見2（Mechabellum の加速・加速投票） | `TICK_INTERVAL_MS` を 1x / 2x / 4x で可変にし、結果へ即座に飛ぶスキップを置く。決定的シミュレーションなので結果は不変 | **低** | 中 |
| **3** | **予告 → 観戦 → 答え合わせを閉じる** | 発見4（完全情報）＋発見3 | `WavePreview` で見せた敵種ごとに、戦闘後「予告 5体 → 撃破 5 / 漏れ 0」を対比表示。**予告を見た意味がその場で回収される** | 中 | **大** |
| **4** | **観戦中の介入を1つだけ入れる** | 発見1（KR の Reinforcements、リチャージ10秒） | 戦闘中のみ使える即時カードを1枚（例: マナ1で全敵に小ダメージ / 1体を足止め）。**フェーズ分離の企画判断を壊さない範囲での最小の介入** | 中 | **大** |
| **5** | **敵の初見ツールチップ** | 発見5（Arknights） | 初めて出現する敵種で、名前・HP・速度・特徴を1回だけ提示。S1 レトロの「地形の効果内容が未説明」も同型で解ける | 低 | 中 |
| **6** | **隊列で脅威を教える** | 発見5（KR の装甲前衛） | ウェーブ定義のスポーン順を「重装が先頭・俊足が後」等に整え、**並び順そのものが読み方を教える**ようにする。データ変更のみ | 低 | 中 |
| **7** | **勝ち方の「程度」を残す** | 発見3（残存供給コスト＝ダメージ） | 漏れ 0 と漏れ 3 を同じ扱いにせず、無失点ボーナス等で観戦終盤まで意味を残す | 中 | 中 |
| **8** | **カウンター要求の更新とブリーザー・山場** | 発見6（Harlow） | ウェーブ／ステージを増やす段階の話。**S2 では着手しない**（コンテンツ量は Yes が出てから: Epic #178 の #176 保留方針） | 高 | 大（後段） |

---

## 11. 適用しないと判断したもの

| 不採用 | 理由 |
|---|---|
| **Thronefall 型の直接操作（王を動かして戦う）** | フェーズ分離型（準備→自動戦闘観戦）は企画で確定済みの判断であり、これを崩すと「デッキ構築×TD」ではなくアクションゲームになる。#4（限定的な介入カード）で目的の大半は満たせる |
| **Mechabellum の戦場の霧による情報戦** | 相手が情報を隠しにくる 1v1 対人が前提。ソロプレイでは「隠す主体」が存在せず、単なる意地悪になる |
| **Arknights のリアルタイム配置（DP が戦闘中に貯まる）** | 準備フェーズの決断を戦闘中に溶かしてしまい、フェーズ分離の利点（じっくり考える時間）を失う |
| **juice への単独投資（演出だけを厚くする）** | 発見8 の反証と、PR #171 の実績（機構は正しいが手触りは変わらなかった）が一致。**#1 は「因果を見せるため」に行い、演出のための演出にはしない** |
| **TFT 型のマルチプレイヤー・バトルロイヤル構造** | 1人用プラットフォームの1タイトルという制約と合わない |

---

## 12. 結論と、S2 の問い

### 結論

1. **本作が選んだ「純粋観戦」は、調査対象6本中 Mechabellum 1本しか採用していない例外的な形式である。** 他の5本は観戦中に必ず何かをさせている。
2. **その唯一の例外ですら、時間上限・加速・冒頭の情報開示という3重の管理下に置いている。** 開発者自身が「終盤の遅さは問題」と一次情報で認めている。
3. **灰燼の城壁の観戦は、実測 18〜28 秒のあいだ、マーカーが動く以外に何も起きない。** イベント列は計算済みだが描画されていない。
4. **したがって「単調」の第一原因は環③（決断）ではなく環④（結果の検証・フィードバック）の欠落であり、#181（決断の穴を測るスパイク）を保留した判断は支持される。**
5. **ただし演出だけを足す解は明確に反証されている。** #1 は「準備の決断が結果に効いていることを見せる」ためにのみ行う。

### S2 の問い（提案）

> **S2「この20秒は、見るに値するか」** ［環④ 結果の検証・フィードバック］

- **スコープ**: 上表の **#1（イベント描画）／#2（速度・スキップ）／#3（予告の答え合わせ）** の3点のみ。#4（介入カード）は S2 の結果を見て S3 で判断する。
- **CoS（S1 の失敗を繰り返さないための必須条件）**:
  - **ユーザーによる実プレイ 3ラン**を CoS に含める（AI 観察だけで判定しない ← S1 最大の Problem）
  - **行動記録**を判定に使う: ①戦闘中にスキップを押したか（押した回数とウェーブ）②撃破の瞬間に気づいたか ③予告と結果の対比を見たか ④「見ていた」か「待っていた」かの自己申告
  - **事前登録した項目はすべて判定に使う**（S1 Try）
- **反証条件（作業仮説を殺す条件）**: 上記3点を実装しても**なお「観戦は待ち時間だ」と判定された場合、観戦フェーズという形式そのものを疑う**。その場合の次の分岐は「#4 の介入カードで観戦を能動化する」か「観戦を廃してターン制の解決（Slay the Spire 側）に寄せる」の二択となる。
- **中止条件**: 損切り上限 2 周。

---

## 13. 調査の限界

- **プレイ経験に基づく一次観察がない。** 調査者は対象6本のいずれもプレイしていない。記述はすべて文献・Wiki・レビュー・コミュニティ議論に依存しており、**実際の手触りは確認できていない**。特に「観戦が面白い/退屈」という主観的判断は他者の報告の受け売りである。
- **WebFetch の要約に依存した箇所がある。** 要約モデルの出力は逐語引用として扱っていないが、**要約時点での歪みは除去できていない**。特に §発見3 の PC Gamer 記事は**本文取得に失敗し、検索結果の要約のみに基づく**。重要な判断の根拠にする場合は再検証が必要。
- **Vlambeer の講演動画は未視聴。** 二次的な要約に基づく記述であり、講演内で実際に何が言われたかは確認していない。
- **Mechabellum のラウンド時間はコミュニティ発の数値**であり、公式仕様として確認したものではない。バージョンによる変動もありうる。
- **Arknights と Slay the Spire は他の4本より調査が薄い。** Arknights は敵分類と DP 機構、Slay the Spire は intent 機構に絞っており、レベルデザインやウェーブ構成の設計思想までは追えていない。
- **反証の探索は行ったが網羅ではない。** Thronefall と Kingdom Rush については単調さ批判を確認できたが、Mechabellum・Legion TD 2 の観戦フェーズに対する体系的な批判は見つけられていない（Steam 議論に散発的な「操作できない RTS のようだ」という趣旨の声はある）。

---

## 情報源一覧（すべて 2026-07-27 アクセス）

### 開発者一次情報
- [Legion TD 2 - First Look at the HUD](https://beta.legiontd2.com/updates/first-look-at-the-hud/) — 開発元公式
- [Legion TD 2 - Game manual](https://beta.legiontd2.com/manual/) — 開発元公式
- [Mechabellum Dev Log #1 | MechaMonarch](https://mechamonarch.com/news/mechabellum-dev-log-1/) — 開発者投稿の転載

### 設計分析
- [Kingdom Rush - the wonderful Campaign level design](https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design) — David Harlow, 2013-10-25
- [Perfect Information: The Killer Feature of Slay the Spire and Into the Breach](https://jeremiahgames.com/2019/03/04/perfect-information-the-killer-feature-of-slay-the-spire-and-into-the-breach/) — Jeremiah Franczyk, 2019-03-04
- [Thronefall — A Take on Minimalism & Trimming the Fat from Strategy](https://donatvatoci1.medium.com/thronefall-a-take-on-minimalism-trimming-the-fat-from-strategy-b76b2413a10c) — Donat Vatoci, 2024-11-01
- [Jan Willem Nijman - Vlambeer - "The art of screenshake"](https://www.youtube.com/watch?v=AJdEqssNZ-U) — INDIGO Classes 2013（未視聴）
- [Mechabellum Evolved Autobattlers, but One Problem Remains Unsolved | grokludo](https://grokludo.com/mechabellum-evolved-autobattlers-but-one-problem-remains-unsolved-wen-you-ge-grokludo-14/) — 2025-11-03（内容はライブサービスの content 供給問題であり、観戦設計には触れていなかった）

### 反証・批判
- [The "Juice" Problem: How Exaggerated Feedback is Harming Game Design | Wayline](https://www.wayline.io/blog/the-juice-problem-how-exaggerated-feedback-is-harming-game-design)
- [Kingdom Rush review | Reviewed.com](https://www.reviewed.com/content/kingdom-rush-review)
- [Thronefall Steam 否定的レビュー](https://steamcommunity.com/app/2239150/negativereviews/?l=english&browsefilter=toprated)

### ゲーム内資料
- [Intent | Slay the Spire Wiki](https://slaythespire.wiki.gg/wiki/Intent)
- [Enemy - Arknights Terra Wiki](https://arknights.wiki.gg/wiki/Enemy) / [Deployment Point | Arknights Wiki](https://arknights.fandom.com/wiki/Deployment_Point)
- [Call Reinforcements | Kingdom Rush Wiki](https://kingdomrushtd.fandom.com/wiki/Call_Reinforcements) / [Militia Barracks](https://kingdomrushtd.fandom.com/wiki/Militia_Barracks)
- [Mercenary - Legion TD 2 Wiki](https://legiontd2.wiki.gg/wiki/Mercenary)
- [Mechabellum Tips Guide | Pro Game Guides](https://progameguides.com/mechabellum/mechabellum-tips-guide-reinforcements-research-points-specialists/)

### レビュー・コミュニティ
- [I can't stop playing this autobattling strategy masterpiece | PC Gamer](https://www.pcgamer.com/i-cant-stop-playing-this-autobattling-strategy-masterpiece/)（本文取得失敗）
- [Mechabellum Review | MonsterVine](https://monstervine.com/2025/04/mechabellum-review/)
- [Legion TD 2 Review | TechRaptor](https://techraptor.net/gaming/reviews/legion-td-2-review)
- [Thronefall Review | GameLuster](https://gameluster.com/thronefall-review-holding-on-for-one-last-night/)
- [Kingdom Rush Review | Netto's Game Room](https://www.nettosgameroom.com/2025/04/kingdom-rush-review.html)
- [Round Duration :: Mechabellum Balancing & Suggestions](https://steamcommunity.com/app/669330/discussions/1/3833172420323304459/) / [How long do matches take?](https://steamcommunity.com/app/669330/discussions/0/3802776070754772002/)

### 本作側の一次確認（コード・実測）
- `src/features/ashen-rampart/domain/combat/simulate-wave.ts`（`TickEvent` / `CombatTick`）
- `src/features/ashen-rampart/presentation/AshenRampartGame.tsx:65-69, :116`
- `src/features/ashen-rampart/presentation/useAshenRampartGame.ts:19, :97-112`
- 観戦時間の実測: `simulateWave` を塔なしで実行（2026-07-27）
