# 面白いゲームの作り方 — ゲームデザインの本質と反復開発への統合

## エグゼクティブサマリー

「面白さ」は機能の総和として設計できず、ルールの相互作用から**創発する性質**である。したがって面白さは仕様として記述できず、実際に遊んで観測することでしか確認できない。この非対称性（MDA フレームワーク）が、ゲーム開発における要求管理の失敗の根本原因である。

面白さの中身については2つの相補的な理論が支配的である。Koster は「面白さ＝パターンの学習と習得」と定義し、Meier は「ゲーム＝興味深い決断の連続」と定義する。両者は「プレイヤーが**能動的に理解し選択する**余地があるか」という一点で一致する。決断が興味深くあるためには、トレードオフ・状況依存性・結果の可視性・**十分な情報**が必要であり、このうち情報の欠落は決断そのものを消滅させる。

開発プロセス面では、プロトタイプ・垂直スライス・MVP は目的の異なる別物であり、混同が手戻りを生む。スクラムをゲーム開発に適用する場合、プリプロダクション（面白さの発見）とプロダクション（量産）を明確に分離し、プリプロ期のスプリントゴールは「機能の完成」ではなく「**仮説の検証**」として定義する必要がある。ベロシティを指標にすると、遊べないが完成した機能が積み上がる。

## 調査方法

- **リサーチクエスチョン（PEO）**
  - Population: 個人開発の小規模ブラウザゲーム（観戦型オートバトル × デッキ構築タワーディフェンス）
  - Exposure: ゲームデザインの理論的原則と、反復開発（スクラム）への統合手法
  - Outcome: 「面白さ」を早期・反復的に検証しながら開発を進める実行可能な方法論
- **調査日**: 2026-07-26
- **検索キーワード**: MDA framework / interesting decisions / theory of fun / find the fun / vertical slice vs prototype vs MVP / agile game development scrum / playtest questions / autobattler design / roguelike deckbuilder design（各英語）
- **情報源の種類と数**: 学術一次文献 1件（MDA 原論文 PDF）、業界専門メディア 3件、実務者書籍の要約・書評 3件、デザイン解説記事 4件、コミュニティ議論 1件

## 引用の扱いについて（全編に適用）

本レポート中の英文引用のうち、**原典テキストに直接当たって逐語を確認したのは MDA 原論文からの3件のみ**（発見1の3つの引用。PDF を直接読解）。

**それ以外のすべての引用は、WebFetch / WebSearch の要約モデルを経由**している。要約モデルは原文を言い換えることがあるため、**逐語である保証はない**。実際、本レポート初版には要約モデルの言い換えを原典の逐語引用として提示した箇所があり、原典に当たって捏造が判明した（詳細は「調査の限界」を参照）。

したがって、以下の引用は**「その趣旨のことが書かれている」という強さでのみ読むこと**。学術的な引用として再利用する場合は原典に当たり直すこと。

## 主要な発見事項

### 発見 1: 面白さは「作る側」と「遊ぶ側」で流れる向きが逆である

MDA フレームワークはゲームを Mechanics（ルール・実装）→ Dynamics（実行時に現れる振る舞い）→ Aesthetics（プレイヤーに生じる感情）の3層に分解する。決定的なのは方向の非対称性である。原典（PDF 2ページ目「MDA as Lens」節）の逐語は次の通り。

> "From the designer's perspective, the mechanics give rise to dynamic system behavior, which in turn leads to particular aesthetic experiences. From the player's perspective, aesthetics set the tone, which is born out in observable dynamics and eventually, operable mechanics."

開発者はメカニクスを積み上げて上位の感情が生まれることを**期待する**が、プレイヤーは感情から入り、ルールには後からしか気づかない。したがって「メカニクスを実装した」ことは「意図した感情が生まれた」ことを一切保証しない。原著者は、想定した Dynamics が実際に生じているかを**観測（プレイテスト）で確かめ**、ズレていればメカニクスを調整せよと述べている。

原典はまた、プレイヤー視点で考えることが「**feature-driven ではなく experience-driven な設計**を促す」と述べている。

> "thinking about the player encourages experience-driven (as opposed to feature-driven) design"

### 重要な留保：原典は「面白さの公式」を明示的に否定している

同論文は Aesthetics 節でこう述べる。

> "there is no Grand Unified Theory of games or formula that details the combination and proportion of elements that will result in 'fun'"

**面白さをもたらす要素の組み合わせと比率を示す公式は存在しない。** 本レポートの考察②で提示する「面白さの鎖」は、この留保の下で読まれなければならない。鎖は**作業仮説**であって、原典に裏付けられた理論ではない（考察②の但し書きを参照）。

Aesthetics（面白さの種類）は8分類が提示されている: Sensation（感覚）／Fantasy（空想）／Narrative（物語）／Challenge（挑戦）／Fellowship（社交）／Discovery（発見）／Expression（表現）／Submission（没入・暇つぶし）。「面白い」を一語で扱わず、**どの面白さを狙うのかを名指しする**ことが設計の出発点になる。

- 出典: [MDA: A Formal Approach to Game Design and Game Research (Hunicke, LeBlanc, Zubek)](https://users.cs.northwestern.edu/~hunicke/MDA.pdf) / [MDA framework - Wikipedia](https://en.wikipedia.org/wiki/MDA_framework), 2026-07-26 アクセス

### 発見 2: 面白さの正体 ① — 学習と習得（Koster）

Raph Koster は、ゲームの面白さは**パターンの学習と習得**から生じると論じる。神経生物学的には、学習や習熟そのものが報酬として知覚される。

この定義から、退屈の条件が二方向で導かれる。

- **簡単すぎる** = パターンを既に習得し、学ぶものが残っていない
- **難しすぎる** = パターンを認識すらできない

> "games get boring when the player has learned the pattern, and there is nothing new to learn"

Koster の良いゲームの定義は「プレイヤーが遊ぶのをやめる前に、そのゲームが提供しうるすべてを教え切るもの」である。難易度は一定であってはならず、この狭い帯域の中でジグザグに動く必要がある。

**含意**: 「学ぶべきパターンが存在しない」ゲームは、可読性を上げても演出を足しても面白くならない。まず**学習対象となるパターンが盤面に存在するか**を問う必要がある。

- 出典: [A Theory of Fun for Game Design 要約](https://www.shortform.com/summary/a-theory-of-fun-for-game-design-summary-raph-koster) / [公式サイト](https://www.theoryoffun.com/press.shtml), 2026-07-26 アクセス

### 発見 3: 面白さの正体 ② — 興味深い決断（Meier）

Sid Meier の「ゲームとは興味深い決断の連続である」は、面白さを**選択の質**として定義する。GDC 2012 の講演で Meier は「興味深い決断とは何か」を、むしろ**何が興味深くないか**から説明した。

**帰属についての注記（重要）**: この言葉の出典は**正確には文書化されていない**。Troy Goodfellow の追跡調査（Civilization Chronicles 経由で Meier 本人に確認）によれば、Meier は GDC の "ten rules of game design" と題した講演で「ずっと昔に一度」述べたことを認めたが、**正確な年・正確な文言は特定されていない**。流布している版も「interesting decisions」「meaningful choices」など複数ある。さらに Meier 自身が「包括的で時代に耐える定義として意図したものではない」と述べている。本レポートでは以下を**定義ではなく設計上の判断基準の一覧**として扱う。

**興味深い決断の条件**

| 条件 | 内容 |
|---|---|
| トレードオフ | 選択に意味あるコストと利益がある（速い車は操作性が悪い） |
| 状況依存性 | 同じ選択肢でも盤面の状況によって価値が変わる |
| 個性の表現 | 慎重型／攻撃型など、プレイスタイルを表現できる |
| 持続性と影響 | 決断の効果が意味ある長さ持続し、影響が理解できる |
| リスクとリターン | 損失の可能性と利得を天秤にかける |
| 時間軸 | 短期の小さな効果と長期の大きな効果の選択 |

**興味深くない決断（アンチパターン）**

- **自明な選択**: 3択のうち常に同じものを選ぶなら、それは選択ではない
- **ランダムな選択**: 判断材料がなく、選ぶ意味がない
- **情報不足**: 結果を理解できないため、決断が賭けに堕する

> "Good decisions are situational...when the decision is presented to the player, ideally it acts in an interesting way with the game situation."

- 出典: [GDC 2012: Sid Meier on how to see games as sets of interesting decisions](https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions), 2026-07-26 アクセス

### 発見 4: 情報開示は演出ではなく、決断の前提条件である

Meier の「情報不足の決断は興味深くない」は、実装上は**情報開示の設計**として現れる。この点で Slay the Spire の設計が参照点になる。

Slay the Spire の6つの中核システムのうち1つは「**敵の意図表示（enemy intent display）**」であり、プレイヤーが計画を立てられるようにするために存在する。同ゲームの解説では、深さはエンジン（戦闘処理）ではなくドラフトしたカードとレリックから生じると指摘されている。

> "an enemy intent display so players can plan"
> "Slay the Spire's apparent depth doesn't come from the engine... Everything interesting happens in the cards you drafted and relics you picked up."

**含意**: 「次に何が起きるか」が読めない状態でプレイヤーに選択させると、その選択は Meier の言う「情報不足」に該当し、興味深い決断として成立しない。可読性は UI の品質問題ではなく、**ゲームデザインの根幹**である。

- 出典: [How to Make a Deckbuilder Like Slay the Spire](https://www.summerengine.com/blog/make-a-deckbuilder-like-slay-the-spire) / [How Slay the Spire's devs use data to balance their roguelike deck-builder](https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder), 2026-07-26 アクセス
- **信頼性の注記**: 「6つの中核システム」という整理は、AI開発ツールのマーケティング系ブログによる**独自の分解**であり、開発元 Mega Crit の公式見解でも定説でもない。**Slay the Spire に敵の意図表示が存在すること自体は周知の事実**だが、それを「中核システムの1つ」と位置づける枠組みは当該ブログのもの。本レポートはこの枠組みを**例示として**用いており、権威ある設計分析としては扱わない

### 発見 5: 観戦型オートバトルの面白さは「期待 → 答え合わせ」の構造にある

プレイヤーが戦闘中に操作しないオートバトラー系の面白さは、操作の快感ではなく**予測と検証のサイクル**に宿る。

- 戦略的な組み立て（編成・配置・アップグレード）を行い、その結果を受動的に観る
- 面白さは「自分が組んだシナジーが機能するか／失敗するか」を見届ける緊張から生じる
- 完全な観戦型では、プレイヤーは「リラックスしつつ戦略的にクリーンな」立場に置かれる

> "giving up all control and just standing on the sideline, watching how the well-planned synergies of you and your opponent perform or fail"

**含意**: 観戦型は面白さを放棄する構造ではないが、成立条件が厳しい。**(a) 準備時に読めること、(b) 予測が立つこと、(c) 予測が外れうること**の3つが揃って初めて「答え合わせ」が緊張になる。どれか1つでも欠けると、観戦は単なる待ち時間になる。

- 出典: [Autobattler games - sit back and watch it（Quarter To Three フォーラム）](https://forum.quartertothree.com/t/autobattler-games-sit-back-and-watch-it/165263) / [Understanding What Auto Battler Games Are](https://ilogos.biz/auto-battler-game-development-guide/), 2026-07-26 アクセス
- **信頼性の注記**: この発見はフォーラム議論と業界ブログに依拠しており、学術的裏付けは弱い。他の発見より確度は低い（プレイヤーの自己申告に基づく）

### 発見 6: プロトタイプ・垂直スライス・MVP は目的の異なる別物である

| 用語 | 目的 | 品質 | 判定する問い |
|---|---|---|---|
| **プロトタイプ** | 単一システムの検証 | 粗い・内部用・仮素材 | このメカニクスは面白いか／技術的に成立するか |
| **MVP** | 需要の検証 | 最小限だが遊べる | プレイヤーはこれを欲しがるか |
| **垂直スライス** | 量産可能性の証明 | 最終品質（ゲームプレイ・アート・音・UI） | 出荷品質でこれを作り切れるか |

> "A prototype proves the idea can work, an MVP proves players want it, and a vertical slice proves you can build it at shipping quality."

さらに、プロトタイプは「**そのゲームを作るべきか**」を決めるためのもの、垂直スライスは「**それを作れるか**」を決めるためのものと整理される。First Playable は垂直スライスとほぼ同義で、プリプロダクションの終了とプロダクションの開始を画するマイルストーンである。

**含意**: 面白さが未確認の段階で「最終品質の垂直スライス」を作るのは順序が逆である。面白さの確認はプロトタイプの仕事であり、仮素材・粗い UI で構わない。

- 出典: [Game Dev Glossary: Prototype, Vertical Slice, First Playable, MVP, Demo（Ask a Game Dev）](https://www.tumblr.com/askagamedev/746300998961741824/game-dev-glossary-prototype-vertical-slice) / [Playable Prototype vs Vertical Slice vs MVP](https://p99soft.com/blog/playable-prototype-vs-vertical-slice-vs-mvp), 2026-07-26 アクセス

### 発見 7: スクラムをゲームに適用する鍵は、プリプロとプロダクションの分離

Clinton Keith（2003年にゲーム業界へスクラムを導入）の中核主張は次の通り。

**なぜ従来の要求管理が破綻するか**

**※以下は書評経由の要約であり、逐語引用ではない（原著未取得）。** Keith は「設計文書は知識を生まず、憶測を生む」という趣旨を述べているとされる（原文とされるのは "don't create knowledge—they create speculation"）。

リリース時点で現実が設計文書と一致しないことが常態である。したがって仕様の網羅ではなく、**Conditions of Satisfaction（満足条件）**で「完了とは何か」を定義し、実装の自由度を残す。ユーザーストーリーは厳密な仕様ではなく**会話のきっかけ**として機能する。

**プリプロダクション vs プロダクション**

- プリプロ = 発見。メカニクスのプロトタイピング、何が面白いかの探索、それを技術的にどう支えるかの見極め
- プロダクション = 量産。安定したメカニクスの上でアセットを作り込む
- **プロダクションを早く始めすぎると、未確定のアイデアに基づいてアセットを作ることになり、手戻りになる**

**面白さの発見はスケジュールできない**

「ガントチャートに『find the fun』は載せられない」（※検索結果のスニペット経由。Keith 本人の逐語かどうかは未確認）

代わりに、2〜4週ごと（可能なら毎日）にゲームを**遊べる状態に置く**という反復技法で対応する。不確実性には Spike（時間を区切った調査タスク）で対処する。

**スプリントゴールの形**

スプリントゴールは垂直スライス — プログラミング・アート・デザイン・音を横断する、完結して遊べる機能 — として定義する。これにより統合の問題が早期に露見する。分断された機能を作り続ける「ガレージの床（garage floor）」問題を防ぐ。

- 出典: [Agile Game Development with Scrum by Clinton Keith（書評・要約）](https://williammeller.com/agile-game-development-with-scrum-clinton-keith/) / [Agile Game Development with Scrum - Google Books](https://books.google.com/books/about/Agile_Game_Development_with_Scrum.html?id=OYWWRFFc29gC), 2026-07-26 アクセス
- **信頼性の注記**: 原著（Addison-Wesley, ISBN 0321618528）の本文は未取得。要約・書評経由の二次情報であり、引用の文脈が正確である保証は限定的

### 発見 8: バックログとベロシティがゲームを殺す失敗モード

アジャイル実践がゲーム開発で逆機能する典型パターンが整理されている。

- **創造性のブラックホール**: バックログを「聖典」として扱い、そこにない発想を排除する
- **ベロシティ偏重**: タスク消化量で成果を測ると、実際のプレイヤー体験に関係なく機能を量産し、「浅く凡庸な」ゲームになる
- **意思決定の断絶**: プレイヤーのフィードバックを、文脈と感情を剥ぎ取った「無菌のタスクリスト」に還元してしまう

**対策として提案されるもの**

- **ディスカバリー・スプリント**: バックログの制約から外れ、探索に専念するスプリントを設ける
- **インパクト指標**: ベロシティではなく、プレイヤーの継続・機能の実利用といった体験側の指標を見る
- **量より質**: 中途半端な機構を多数持つより、少数を磨き込む

- 出典: [The Tyranny of the Backlog: Reclaiming Fun in Agile Game Development](https://www.wayline.io/blog/tyranny-of-backlog-reclaiming-fun-agile-game-development), 2026-07-26 アクセス
- **信頼性の注記**: 業界ブログであり、記事内で引用される人物・事例の実在は未検証。主張の枠組みは他文献（発見7）と整合するが、個別の逸話は裏取りできていない

### 発見 9: プレイテストは「訊く」より「観る」— 誘導質問が結果を汚染する

Schell Games のガイドは、誘導質問（leading question）を最大の汚染源とする。

> "Leading questions suggest a 'correct' answer, which can cause testers to provide the feedback they think the developer wants to hear."

**避けるべき質問の例**: 「このチュートリアルは必要なことを教えられていますか？」「この武器は強すぎますか？」「道に迷わず進めましたか？」— いずれも望ましい答えを前提にしている。

同様に「楽しかったですか？」「ルールは分かりましたか？」といった浅い質問は、正直で客観的な答えを引き出さない。

**推奨される6問（FFW2D2）**

1. 今遊んだ中で、**最もフラストレーションを感じた**瞬間・要素は何ですか
2. 今遊んだ中で、**最も好きだった**瞬間・要素は何ですか
3. **やりたかったのにできなかった**ことはありますか
4. 魔法の杖で何でも変更・追加・削除できるとしたら、何をしますか
5. あなたはこの体験の中で**何をしていましたか**
6. このゲームを友人や家族に**どう説明しますか**

質問はプレイ中（即時反応）とプレイ後（残る印象・全体の明瞭さ）の両方で行う。観察面では、意思決定のパターン・感情的反応を直接観測することが、事後アンケートでは得られない知見を与える。

- 出典: [The Definitive Guide to Playtest Questions – Schell Games](https://schellgames.com/blog/the-definitive-guide-to-playtest-questions-for-video-game-playtesters) / [10 Insightful Playtest Questions](https://www.gamedeveloper.com/business/10-insightful-playtest-questions) / [Methods Of Playtesting - Game Design Workshop (Fullerton)](https://flylib.com/books/en/2.489.1.64/1/), 2026-07-26 アクセス

### 発見 10: 反証の探索 — 「演出（juice）を先に作る」立場は成立するか

本調査は当初、可読性・難易度を先に、演出（juice）を後に置く順序を前提にしていた。これは確認バイアスの疑いがあるため、**反対の立場を明示的に探索した**。

有力な反例候補は Martin Jonasson と Petri Purho の "Juice it or lose it"（Nordic Game Jam 2012）である。灰色の Breakout クローンに効果を1つずつ足し、見違えるほど魅力的にしていくデモとして知られる。Jan Willem Nijman（Vlambeer）の "The Art of Screenshake"（2013）も同系統である。

**検証結果: これらは順序の反証にならない。** 解説文献は juice の位置づけを次のように整理している。

> "Juice is something you add on top of a thing that already works, never a load-bearing part of whether it works at all."
> "Juicing is about taking a game that works and adding layers of satisfying bits of animation and audio to improve its feel."

"Juice it or lose it" の出発点である Breakout クローンは、**すでに機能するゲーム**である（打ち返す・崩す・跳ね返るというループが成立している）。juice はそこに乗る増幅器として働いている。

**ただし未解決の論点が残る**: あのデモで「退屈に見えるが機能するゲーム」が「楽しいゲーム」になったことを、juice が面白さを**創出した**と読む解釈は排除できない。増幅と創出の境界は、この調査では決着していない。

- 出典: [“The art of screenshake” - Jan Willem Nijman（GameDesign.gg）](https://www.gamedesign.gg/knowledge-base/game-design/game-feel-feedback/the-art-of-screenshake-jan-willem-nijman-vlambeer/) / [Game feel on the web: squash, shake, and the art of juice](https://valdemird.com/blog/game-feel-on-the-web/) / [Secrets of Game Feel and Juice](https://www.gamedesign.gg/knowledge-base/game-design/game-feel-feedback/secrets-of-game-feel-and-juice/), 2026-07-26 アクセス
- **信頼性の注記**: 原講演の映像・スライドは未取得。解説ブログ経由の二次情報である

## 分析と考察

### 横断パターン ①: すべての理論が「プレイヤーの能動性」に収束する

Koster（学習）、Meier（決断）、MDA（Dynamics の創発）、オートバトラー論（予測と答え合わせ）は、表現は違うが同じ一点を指している。**プレイヤーの頭の中で何かが起きているか**である。

- Koster: 頭の中でパターンが形成されているか
- Meier: 頭の中で天秤が動いているか
- MDA: メカニクスが Dynamics を経て感情に到達しているか
- オートバトラー: 予測が立ち、それが検証されているか

逆に言えば、画面がどれだけ賑やかでも、プレイヤーの頭の中が静かなら面白くない。演出（juice）は頭の中で起きたことを**増幅**するが、何も起きていないものを増幅しても増幅結果はゼロである。

### 横断パターン ②: 「情報 → 予測 → 決断 → 検証」という1本の鎖

発見3・4・5を統合すると、面白さは次の連鎖として成立する。

```
情報が開示される  →  予測が立つ  →  決断に意味が宿る  →  結果が検証される  →  学習が起きる
   （可読性）        （読みやすさ）      （トレードオフ）        （フィードバック）      （次の予測が良くなる）
```

この鎖は**最も弱い環で切れる**。情報が開示されなければ予測が立たず、予測が立たなければ決断は賭けになり、決断が賭けなら結果は学習にならない。

### この鎖の位置づけ（重要な但し書き）

**「面白さの鎖」は本レポートが提示する作業仮説であり、調査した文献のいずれもこの形では提唱していない。** 発見2〜5を筆者が統合したものである。

さらに、MDA 原典は「面白さをもたらす要素の組み合わせと比率を示す公式は存在しない」と明示的に述べている（発見1の留保）。したがって、この鎖を**定量的なモデル（各要素の積で面白さが決まる）として扱ってはならない**。

擁護できるのは次の範囲に限られる。

- **因果の順序**: 情報の欠落は予測を不可能にし、予測の不在は決断を賭けに変える。これは各理論から演繹できる
- **前提条件の性質**: 鎖の前段は後段の**必要条件**である。前段が欠けたまま後段に投資しても効果が現れにくい

擁護できないのは次である。

- 「乗算」という定量表現。要素に重みや点数を与えて積を論じることに根拠はない
- 「鎖の環がすべて揃えば面白くなる」という十分条件としての読み。鎖は面白さの十分条件ではない

**この仮説は実プレイで反証されうる**。たとえば環①が繋がっても体験が変わらなければ、鎖の順序が誤っているか、そもそも切れていたのは別の環である。仮説として扱い、反証されたら捨てること。

### 横断パターン ③: プロセス上の失敗は「検証されない完成」として現れる

発見7・8が共通して警告するのは、**遊べない状態で機能が完成していく**ことである。設計文書は憶測を生み、ベロシティは消化量を褒め、バックログは断片を並べる。結果として「すべてのタスクが完了し、テストが緑で、誰も面白いと感じないゲーム」が生まれる。

これを防ぐ唯一の構造的対策として全文献が一致して挙げるのが、**遊べる状態を常に維持し、各反復の終わりに実際に遊ぶ**ことである。

### 本プロジェクト（灰燼の城壁）への含意

調査結果を現状に当てはめると、以下が読み取れる（**これは解釈であり、実プレイによる検証が必要**）。

1. **鎖の最初の環が切れている**。敵種が視覚的に区別されず、次のウェーブ構成も開示されていないため、情報が不足している。Meier の基準では、この状態での配置判断は「情報不足の決断」であり定義上興味深くない。したがって射程・地形・かがり火（PR #171）がどれだけ精緻でも、決断として知覚されない。
2. **学習対象のパターンが枯れている可能性**。全3ウェーブ・敵3種・固定構成で、ライフ10に対し漏れ許容が大きい。Koster の枠組みでは「簡単すぎてパターンを学ぶ前に終わる」側の退屈に該当する。
3. **観戦型は放棄すべきではないが、成立条件を満たしていない**。発見5の3条件（読める・予測が立つ・外れうる）のうち、現状はいずれも未達である。構造の問題ではなく、条件の未達である可能性が高い。
4. **プロセス上、前回（PR #171）はまさに発見8の失敗モードを踏んでいる**。Issue を機能単位に分解し、テスト緑で完了とし、遊ぶのが最後だった。
5. **垂直スライスという語の使い方が調査結果とズレている**。Epic #178 は「平原1面を最終品質にする」意図で垂直スライスと呼んでいるが、発見6の定義では、面白さ未確認の段階で作るべきは**プロトタイプ**である。品質を上げる前に、面白さの有無を粗い状態で判定するのが正しい順序。

## 結論と推奨事項

### 結論

1. 面白さは仕様化できず創発する。ゆえに**遊んで観測する以外に確認手段はない**（発見1）
2. 面白さの中身は「学習」と「決断」であり、両者は**プレイヤーの能動性**という一点に収束する（発見2・3）
3. 決断が成立するには情報開示が前提であり、可読性は UI 品質ではなく**デザインの根幹**である（発見4）
4. 【作業仮説】面白さは「情報 → 予測 → 決断 → 検証 → 学習」の鎖として成立し、**前段は後段の必要条件**である。ただしこれは筆者の統合であり文献の裏付けはない。定量モデル（乗算）として扱ってはならず、実プレイで反証されうる（考察②）
5. プロセスの失敗は「検証されない完成」として現れ、対策は**常に遊べる状態を保ち、反復ごとに遊ぶ**ことに尽きる（発見7・8）
6. 面白さ未確認の段階で作るべきは最終品質の垂直スライスではなく、**粗いプロトタイプ**である（発見6）

### 推奨事項（スクラム設計への示唆）

調査から導かれる、本プロジェクトでスクラムを組む際の原則。

**A. プリプロダクションであることを宣言する**

現在は「面白さが未確認」の段階であり、Keith の分類ではプリプロダクションにあたる。プロダクション（コンテンツ量産・アセット作り込み・物語）に進んではならない。Epic #178 の #176/#177 が「土台確認後」に置かれているのは、この点で調査と整合している。

**B. スプリントゴールを「機能の完成」ではなく「仮説の検証」にする**

Conditions of Satisfaction（満足条件）を、実装の完了ではなく**プレイ体験の観測結果**で書く。

- 悪い例: 「敵種が形と色で判別できる」（実装したかどうかしか判定できない）
- 良い例: 「初見で敵の脅威度を判断し、それに基づいて配置を変えるという行動が観測できる」

**C. プレイテストをスプリントレビューの本体にする**

スプリントレビューでコードやテスト結果を見せるのではなく、**実際に遊び、FFW2D2 の6問に答える**（発見9）。誘導質問（「読みやすくなりましたか？」）は禁止する。個人開発では自分が唯一のテスターになるため、質問の設計だけが自己欺瞞への防波堤になる。

**D. 中止条件（kill criteria）を事前に書く**

スプリント開始前に「この結果が出たら方向を捨てる」を明文化する。事後に判断すると、投じたコストが判断を歪める。Epic #178 が「垂直スライスがどうしても面白くならない場合はコンセプト自体の見直し」を分岐点に置いているのは、この意味で正しい。ただし**何をもって「面白くならない」と判定するか**が未定義であり、そこを埋める必要がある。

**E. バックログは「体験の鎖」の順に並べる**

考察②の鎖（情報 → 予測 → 決断 → 検証 → 学習）では前段が後段の必要条件になるため、**最も弱い環から順に**着手する。機能カテゴリ（可読性・難易度・演出）ごとの分解ではなく、鎖のどこが切れているかで優先順位を決める。

ただし鎖自体が作業仮説であるため、**環を1つ繋いでも体験が変わらなかった場合は、鎖の順序または診断そのものを疑う**こと。「次の環へ進む」を既定路線にしない。

**F. 1スプリント = 1つの問い**

複数の改善を束ねると、何が効いたか分からなくなる。プリプロ期のスプリントは「この1つの問いに答える」形に絞る。

## 情報源一覧

すべて 2026-07-26 アクセス。

**一次文献**
- [MDA: A Formal Approach to Game Design and Game Research (Hunicke, LeBlanc, Zubek)](https://users.cs.northwestern.edu/~hunicke/MDA.pdf)
- [MDA: A Formal Approach to Game Design and Game Research - AAAI](https://aaai.org/papers/ws04-04-001-mda-a-formal-approach-to-game-design-and-game-research/)

**業界専門メディア**
- [GDC 2012: Sid Meier on how to see games as sets of interesting decisions - Game Developer](https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)
- [How Slay the Spire's devs use data to balance their roguelike deck-builder - Game Developer](https://www.gamedeveloper.com/design/how-i-slay-the-spire-i-s-devs-use-data-to-balance-their-roguelike-deck-builder)
- [10 Insightful Playtest Questions - Game Developer](https://www.gamedeveloper.com/business/10-insightful-playtest-questions)
- [GDC Vault - Interesting Decisions (Sid Meier)](https://www.gdcvault.com/play/1015756/Interesting)
- [Quote? Misquote? Cite? – Flash of Steel（Sid Meier 引用の帰属追跡）](https://flashofsteel.com/index.php/2008/07/07/quote-misquote-cite/)

**反証の探索（発見10）**
- [“The art of screenshake” - Jan Willem Nijman（GameDesign.gg）](https://www.gamedesign.gg/knowledge-base/game-design/game-feel-feedback/the-art-of-screenshake-jan-willem-nijman-vlambeer/)
- [Secrets of Game Feel and Juice – GameDesign.gg](https://www.gamedesign.gg/knowledge-base/game-design/game-feel-feedback/secrets-of-game-feel-and-juice/)
- [Game feel on the web: squash, shake, and the art of juice](https://valdemird.com/blog/game-feel-on-the-web/)

**書籍・実務者資料**
- [Agile Game Development with Scrum - Clinton Keith (Google Books)](https://books.google.com/books/about/Agile_Game_Development_with_Scrum.html?id=OYWWRFFc29gC)
- [Agile Game Development with Scrum by Clinton Keith（要約・書評）](https://williammeller.com/agile-game-development-with-scrum-clinton-keith/)
- [Agile Game Development: Build, Play, Repeat - Mountain Goat Software](https://www.mountaingoatsoftware.com/books/agile-game-development-build-play-repeat)
- [A Theory of Fun for Game Design 要約 (Raph Koster)](https://www.shortform.com/summary/a-theory-of-fun-for-game-design-summary-raph-koster)
- [A Theory of Fun for Game Design 公式サイト](https://www.theoryoffun.com/press.shtml)
- [Methods Of Playtesting - Game Design Workshop (Tracy Fullerton)](https://flylib.com/books/en/2.489.1.64/1/)

**デザイン解説・実務ブログ**
- [The Definitive Guide to Playtest Questions – Schell Games](https://schellgames.com/blog/the-definitive-guide-to-playtest-questions-for-video-game-playtesters)
- [Game Dev Glossary: Prototype, Vertical Slice, First Playable, MVP, Demo – Ask a Game Dev](https://www.tumblr.com/askagamedev/746300998961741824/game-dev-glossary-prototype-vertical-slice)
- [Playable Prototype vs Vertical Slice vs MVP](https://p99soft.com/blog/playable-prototype-vs-vertical-slice-vs-mvp)
- [Vertical Slice in Game Development: Definition & Examples](https://tonogameconsultants.com/vertical-slice/)
- [The Tyranny of the Backlog: Reclaiming Fun in Agile Game Development](https://www.wayline.io/blog/tyranny-of-backlog-reclaiming-fun-agile-game-development)
- [How to Make a Deckbuilder Like Slay the Spire](https://www.summerengine.com/blog/make-a-deckbuilder-like-slay-the-spire)
- [Understanding What Auto Battler Games Are](https://ilogos.biz/auto-battler-game-development-guide/)
- [Autobattler games - sit back and watch it（Quarter To Three フォーラム）](https://forum.quartertothree.com/t/autobattler-games-sit-back-and-watch-it/165263)

## 調査の限界

### 初版（2026-07-26 午前）で発生した誤りと是正（敵対的検証による）

本レポートは公開後に敵対的検証を受け、以下の重大な誤りが確認された。**同種の誤りを繰り返さないため、隠さず記録する。**

| # | 誤り | 是正 |
|---|---|---|
| 1 | **引用の捏造**。発見1で MDA 原典の逐語として提示した文（"Designers work from Mechanics up to Aesthetics..."）は**論文中に存在しない**。WebFetch の要約モデルが生成した言い換えを、原典の引用として提示していた | 原典 PDF を読み直し、逐語に差し替え |
| 2 | **典拠が自説を否定していた**。MDA 原典は「面白さの公式は存在しない」と明示的に述べているが、初版はそれを引かずに「面白さは乗算」という定量モデルを提示し、MDA を裏付けとして挙げていた | 留保を発見1に追加し、鎖を作業仮説に格下げ |
| 3 | **出典年の誤り**。Sid Meier の言葉を「GDC 1989」と断定したが、年も正確な文言も文書化されていない | 発見3に帰属の注記を追加 |
| 4 | **反証を探していなかった**。演出を後置する順序を、対立仮説を検討せずに前提にしていた | 発見10（反証の探索）を追加 |

**教訓**: 要約ツールの出力を引用符で囲んではならない。逐語引用は必ず原典に当たること。また、自説を支持する文献を引く際は、その文献が自説を否定していないかを確認すること。

### 構造的な限界

1. **書籍原典が未取得**。Koster『A Theory of Fun』、Keith『Agile Game Development with Scrum』、Fullerton『Game Design Workshop』はいずれも要約・書評経由の二次情報である。引用の文脈が原典と一致する保証はない。特に発見7の Keith の主張は、書評1件への依存度が高い
2. **MDA 論文は PDF 全文を取得したが、要約は自動抽出に依存**。8分類の名称と方向性の非対称性は複数ソースで裏が取れているが、原文の細部は再確認の余地がある
3. **オートバトラーの分析（発見5）はコミュニティ議論と業界ブログ依存**で、他の発見より確度が低い。プレイヤーの自己申告に基づき、学術的裏付けを欠く
4. **Rami Ismail のプロトタイプ論（インディー実務の一次情報）は 403 で取得できず**、業界用語集で代替した
5. **日本語文献を調査していない**。国内のゲームデザイン議論（例: 桜井政博のゲーム作るには等）は範囲外である
6. **本プロジェクトへの含意はすべて解釈であり、検証されていない**。調査は「何を確認すべきか」を示すが、「実際にそうである」ことは実プレイでしか確かめられない。これは調査結果そのものが述べている制約でもある
