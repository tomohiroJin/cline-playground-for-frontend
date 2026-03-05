# Phase 3c 画像生成プロンプト集

## 共通スタイルガイド

### デザインの特徴（既存画像から抽出）

- **アートスタイル**: かわいい/カワイイ系フラットイラスト。丸みのあるちびキャラ、クリーンなアウトライン
- **背景**: ダークネイビー（`#060a12` ～ `#0c1220`）基調。円形ビネットやグラデーション
- **ライティング**: ネオン風のグロー効果（緑=ポジティブ、赤=危険、青=ニュートラル）
- **テクスチャ**: ノイズやテクスチャなし。スムーズなグラデーション
- **形式**: WebP
- **透過**: 背景画像以外は暗い背景込みで生成（ゲームUIがダーク系のため）

### 5キャラクターの外見リファレンス

すべての画像で以下のキャラクターデザインを統一すること。

| キャラ | 動物 | 外見の特徴 | 服装 | 持ち物・小物 |
|--------|------|-----------|------|-------------|
| **タカ** | オオタカ | 金茶色の羽、鋭い目つきだがかわいい | ダークネイビーのビジネススーツ、青いネクタイ | クリップボード（グラフ付き） |
| **イヌ** | ビーグル犬 | 茶白のビーグル、垂れ耳、丸い目 | 緑のポロシャツ（骨バッジ付き） | 優先度カード（H/M/L） |
| **ペンギン** | アデリーペンギン | 黒白の体、オレンジのくちばし、ピンクのほっぺ | 水色のパーカー | 首にかけたホイッスル |
| **ネコ** | オレンジ三毛猫 | オレンジの縞模様、大きな目 | ヘッドホン着用 | ノートPC（コード画面） |
| **ウサギ** | 白うさぎ | 白い体、ピンクの耳内側、真剣な表情 | 白い白衣（ラボコート） | バグレポート、虫眼鏡 |

### 共通プロンプトベース（英語）

以下を各プロンプトの先頭に付与:

```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background (#060a12),
```

---

## A. イベント画像（8枚） — 800×450px

ゲーム中のスプリントイベントごとに表示されるイラスト。
**構成**: 該当するキャラクターが中央、アクティビティを表現。横長構図。

---

### A1. `aqs_event_planning.webp` — プランニング

**シーン**: チーム全員がホワイトボード前で計画中

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background (#060a12),
wide horizontal composition (800x450),
five cute animal characters in a planning meeting:
- a hawk in a dark business suit pointing at a whiteboard with sprint goals,
- a beagle dog in a green polo shirt holding priority cards labeled H/M/L,
- an Adélie penguin in a light blue hoodie facilitating with a whistle around its neck,
- an orange tabby cat with headphones taking notes on a laptop,
- a white rabbit in a lab coat writing acceptance criteria on sticky notes.
Whiteboard in the background with colorful sticky notes arranged in columns (To Do / In Progress / Done).
Warm meeting room lighting, neon blue accent glow on the whiteboard edges.
```

**イメージ**: イヌがバックログカードを指さし、ペンギンがファシリテーション、タカが全体を見渡す構図。ホワイトボードにカラフル付箋。

---

### A2. `aqs_event_impl1.webp` — 実装（1回目）

**シーン**: ネコがコーディング中

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background (#060a12),
wide horizontal composition (800x450),
a cute orange tabby cat with headphones sitting at a desk, intensely focused on coding.
Multiple monitors showing colorful code syntax (green, blue, orange text on dark screens).
Neon purple accent glow around the monitors.
The cat's paws are on a mechanical keyboard. A coffee mug with a paw print sits beside.
Small floating code symbols (</>  { } ;) in the air with soft purple glow.
Other team members visible in the blurred background: a beagle dog and a penguin watching.
```

**イメージ**: ネコが集中してコーディング中。モニターにはカラフルなコードが映り、紫のネオングロー。

---

### A3. `aqs_event_test1.webp` — テスト（1回目）

**シーン**: ウサギがバグ探索中

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background (#060a12),
wide horizontal composition (800x450),
a cute white rabbit in a lab coat holding a large magnifying glass, searching for bugs.
Small cute cartoon bugs (software bugs depicted as tiny ladybugs) hiding behind code blocks.
A monitor in the background showing test results: some green checkmarks and a few red X marks.
Neon cyan accent glow on the magnifying glass lens.
The rabbit has a determined, focused expression with ears perked up.
A clipboard labeled "BUG REPORT" tucked under one arm.
```

**イメージ**: ウサギが虫眼鏡でバグを探索。テスト結果のモニター（緑チェック＋赤バツ）が背景。

---

### A4. `aqs_event_refinement.webp` — リファインメント

**シーン**: チーム全員でバックログアイテムを議論

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background (#060a12),
wide horizontal composition (800x450),
five cute animal characters sitting around a table in discussion:
- a beagle dog in a green polo shirt presenting user story cards,
- a penguin in a light blue hoodie moderating the discussion,
- an orange tabby cat with headphones suggesting technical approaches,
- a white rabbit in a lab coat pointing out edge cases,
- a hawk in a business suit evaluating business value.
Table covered with colorful sticky notes being rearranged.
Story point cards (1, 2, 3, 5, 8, 13) scattered on the table.
Neon yellow accent glow. Warm collaborative atmosphere.
```

**イメージ**: テーブルを囲んで全員が議論。ストーリーポイントカードと付箋が散らばる。

---

### A5. `aqs_event_impl2.webp` — 実装（2回目）/ ペアプロ

**シーン**: ネコとウサギがペアプログラミング中

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background (#060a12),
wide horizontal composition (800x450),
a cute orange tabby cat with headphones and a white rabbit in a lab coat doing pair programming.
They sit side by side at one large monitor. The cat is typing (driver), the rabbit is pointing at
the screen suggesting improvements (navigator).
Split screen showing code on the left and test results on the right.
Neon purple and cyan dual accent glow, symbolizing the collaboration of dev and QA.
Small lightbulb icons floating above their heads indicating ideas.
```

**イメージ**: ネコ（ドライバー）とウサギ（ナビゲーター）が一つの画面でペアプロ。紫＋シアンのデュアルグロー。

---

### A6. `aqs_event_test2.webp` — テスト（2回目）/ CI/CD

**シーン**: CI/CDパイプラインが走る

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background (#060a12),
wide horizontal composition (800x450),
a cute white rabbit in a lab coat proudly watching a large monitor showing a CI/CD pipeline.
Pipeline stages displayed as connected boxes: Code → Build → Test → Deploy,
all with green checkmarks and glowing green neon accents.
A progress bar at 100% with sparkles.
The orange tabby cat with headphones gives a thumbs up in the background.
Green neon accent glow throughout. Confetti particles falling softly.
```

**イメージ**: CI/CDパイプラインが全グリーン。ウサギが誇らしげに見守る。緑のネオングロー。

---

### A7. `aqs_event_review.webp` — スプリントレビュー

**シーン**: タカと外部ステークホルダーの前でデモ

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background (#060a12),
wide horizontal composition (800x450),
five cute animal characters presenting a sprint demo.
The orange tabby cat with headphones is demonstrating the product on a large screen.
The hawk in a business suit sits in the front row watching with an approving expression.
The beagle dog in a green polo shirt stands beside the screen pointing at key features.
The penguin in a light blue hoodie and the white rabbit in a lab coat sit in the audience smiling.
Large presentation screen showing a product UI mockup with charts and features.
Neon orange accent glow. Professional but warm atmosphere.
```

**イメージ**: ネコがデモ、イヌが補足説明、タカが前列で評価。プレゼン画面が中央。

---

### A8. `aqs_event_emergency.webp` — 緊急対応

**シーン**: チーム全員が緊急対応中

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background (#060a12),
wide horizontal composition (800x450),
five cute animal characters in an emergency incident response scene.
Red alert lights and warning icons flashing around them.
The orange tabby cat is frantically typing at a keyboard debugging the issue.
The white rabbit in a lab coat is analyzing logs on a separate monitor.
The penguin in a light blue hoodie is coordinating the response, pointing directions.
The beagle dog is on a phone communicating with stakeholders.
The hawk in a business suit watches with a concerned but trusting expression.
Server rack in the background with red blinking lights and smoke.
Neon red accent glow throughout. Urgent but united atmosphere.
```

**イメージ**: 赤い警告灯。全員が各自の役割で緊急対応中。赤いネオングロー。緊迫感の中にチームワーク。

---

## B. UI画像（6枚） — 512×512px

ゲームの各シーンで表示されるフィードバック/UI用画像。
**構成**: 円形ビネット構図、キャラクター中心、感情表現が明確。

---

### B1. `aqs_correct.webp` — 正解

**現在の画像**: オレンジ猫が大きな緑チェックマークの前で喜んでジャンプ
**方針**: ペンギン（スクラムマスター）が嬉しそうにOKサイン

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
circular vignette composition (512x512),
a cute Adélie penguin in a light blue hoodie with a whistle around its neck,
happily giving an OK sign with one flipper, jumping with joy.
A large glowing green checkmark behind the penguin.
Green confetti and sparkle particles floating around.
Neon green accent glow. Cheerful celebratory mood.
Pink blush on the penguin's cheeks. Eyes closed in a happy expression.
```

**イメージ**: ペンギンがOKサインで喜ぶ。緑チェックマーク、紙吹雪。

---

### B2. `aqs_incorrect.webp` — 不正解

**現在の画像**: オレンジ猫が優しい表情でピンクXマーク背景
**方針**: ペンギンが励ましの表情

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
circular vignette composition (512x512),
a cute Adélie penguin in a light blue hoodie with a whistle around its neck,
with a gentle encouraging expression, extending one flipper forward as if to say "it's okay, try again".
A soft pink/red X mark behind the penguin, but rendered gently (not harsh).
Small heart shapes and encouraging sparkles floating around.
Soft warm pink neon accent glow. Supportive, kind atmosphere.
The penguin's eyes are open and warm, with a slight sympathetic tilt of the head.
```

**イメージ**: ペンギンが「大丈夫、次がある」と手を差し伸べる。優しいピンクのXマーク。

---

### B3. `aqs_timeup.webp` — タイムアップ

**現在の画像**: オレンジ猫が時計と砂時計に焦る
**方針**: ウサギが焦っている

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
circular vignette composition (512x512),
a cute white rabbit in a lab coat looking panicked and flustered.
A large hourglass with the last grains of sand falling, and a clock showing time's up.
The rabbit's ears are standing straight up in alarm, paws raised in surprise.
Sweat drops and exclamation marks floating around the rabbit.
Neon yellow/amber accent glow. Urgent but humorous atmosphere.
```

**イメージ**: ウサギが砂時計を見て焦る。時間切れの緊張感だがコミカル。

---

### B4. `aqs_build_success.webp` — ビルド成功

**現在の画像**: 動物たちがロケット打ち上げを祝う（※旧キャラクター）
**方針**: 正しい5キャラがハイタッチで祝う

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
square composition (512x512),
five cute animal characters celebrating a successful build:
- a hawk in a business suit,
- a beagle dog in a green polo shirt,
- an Adélie penguin in a light blue hoodie,
- an orange tabby cat with headphones,
- a white rabbit in a lab coat.
They are all high-fiving in the center, paws/flippers meeting in the middle.
A large glowing green checkmark above them.
A CI/CD pipeline icon strip at the top: Code → Build → Test → Deploy, all green.
A "v1.0.0" version tag floating nearby.
Green neon accent glow, confetti, and sparkle particles. Joyful celebration.
```

**イメージ**: 5キャラ全員がハイタッチ。ビルドパイプライン全グリーン。紙吹雪で祝福。

---

### B5. `aqs_grade_celebration.webp` — グレード表示

**現在の画像**: 紙吹雪トロフィー（※旧キャラ）
**方針**: 正しい5キャラがトロフィーを掲げる

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
square composition (512x512),
five cute animal characters celebrating with a golden trophy:
- an orange tabby cat with headphones holding the trophy high in the center,
- a hawk in a business suit, a beagle dog in a green polo, a penguin in a blue hoodie,
  and a white rabbit in a lab coat surrounding the cat, all cheering.
Golden trophy with a star on top, emitting warm golden glow.
Colorful confetti, streamers, and sparkle particles everywhere.
Neon gold/orange accent glow. Grand celebration atmosphere.
Stars and medals floating in the background.
```

**イメージ**: ネコがトロフィーを掲げ、残り4キャラが取り囲んで祝福。金色のグロー。

---

### B6. `aqs_retro.webp` — 振り返り画面

**現在の画像**: 動物たちがカフェ風スペースで付箋ボード前で振り返り（※旧キャラ混在）
**方針**: 正しい5キャラでカフェリラックス振り返り

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
square composition (512x512),
five cute animal characters in a cozy retrospective meeting:
- a hawk in a business suit sitting in an armchair sipping coffee,
- a beagle dog in a green polo shirt sitting on a cushion,
- a penguin in a light blue hoodie facilitating with sticky notes,
- an orange tabby cat with headphones reaching up to place a note on the board,
- a white rabbit in a lab coat writing on a sticky note.
A retrospective board in the background with three columns: 😊 Good / 🤔 Improve / 💡 Try.
Warm soft lighting from a table lamp. Coffee cups and snacks on a low table.
Warm amber neon accent glow. Relaxed, reflective atmosphere.
```

**イメージ**: 5キャラがカフェ風スペースで KPT ボード前でリラックス振り返り。温かい照明。

---

## C. チームタイプ画像（6枚） — 512×512px

ゲーム結果画面で表示されるチーム成熟度タイプ画像。
**構成**: 円形構図、5キャラ全員登場、タイプのテーマを象徴的に表現。

---

### C1. `aqs_type_synergy.webp` — シナジーチーム 🌟

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
circular vignette composition (512x512),
five cute animal characters (hawk in suit, beagle in green polo, penguin in blue hoodie,
orange tabby cat with headphones, white rabbit in lab coat) standing in a circle,
all placing their paws/flippers together in the center in a team huddle.
A bright golden star burst emanating from where their paws meet.
Glowing synergy energy lines connecting each character to the others.
Neon golden/white accent glow. Harmonious, powerful team aura.
Each character has a confident, united smile.
```

**イメージ**: 全員が手を合わせてシナジーの星が生まれる。金色の光。究極のチームワーク。

---

### C2. `aqs_type_resilient.webp` — レジリエントチーム 🔥

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
circular vignette composition (512x512),
five cute animal characters standing firm together in a storm.
Rain, wind lines, and lightning bolts in the background, but the five characters
(hawk in suit, beagle in green polo, penguin in blue hoodie,
orange tabby cat with headphones, white rabbit in lab coat)
are smiling confidently, standing in a V formation.
The penguin in front holds a shield glowing with blue protective energy.
Despite the storm, they are unfazed and united.
Neon orange/fire accent glow around the characters. Resilient, powerful atmosphere.
```

**イメージ**: 嵐の中でも笑顔で立つ5キャラ。ペンギンが盾を構えてチームを守る。

---

### C3. `aqs_type_evolving.webp` — 成長するチーム 📈

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
circular vignette composition (512x512),
five cute animal characters climbing ascending stairs together.
(hawk in suit, beagle in green polo, penguin in blue hoodie,
orange tabby cat with headphones, white rabbit in lab coat)
Each character is on a progressively higher step, with the hawk at the top reaching upward.
A large glowing upward arrow / growth chart line behind them, going from bottom-left to top-right.
Small seedlings growing into larger plants along the steps.
Neon green accent glow. Hopeful, progressive atmosphere.
Each step is slightly brighter than the last, symbolizing continuous improvement.
```

**イメージ**: 段々高くなる階段を5キャラが昇る。上昇グラフ。成長と改善の象徴。

---

### C4. `aqs_type_agile.webp` — アジャイルチーム ⚡

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
circular vignette composition (512x512),
five cute animal characters in dynamic running/dashing poses, moving fast together.
(hawk in suit, beagle in green polo, penguin in blue hoodie,
orange tabby cat with headphones, white rabbit in lab coat)
Speed lines and motion blur effects behind them.
Lightning bolt symbols and sprint iteration icons around them.
The cat is in the lead typing on a floating laptop while running.
Neon purple/electric blue accent glow. Fast, energetic, dynamic atmosphere.
Wind effect on their clothes and fur.
```

**イメージ**: 5キャラが風を切って走る。スピード線と雷マーク。スピード感のある構図。

---

### C5. `aqs_type_struggling.webp` — もがくチーム 💪

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
circular vignette composition (512x512),
five cute animal characters pushing forward together despite carrying heavy burdens.
(hawk in suit, beagle in green polo, penguin in blue hoodie,
orange tabby cat with headphones, white rabbit in lab coat)
They are carrying/pushing a large boulder labeled "TECH DEBT" up a hill.
Despite the strain, each character has a determined, never-give-up expression.
Some characters are sweating but smiling.
The penguin is encouraging the others from the side.
Dim but warm amber neon accent glow. Gritty but hopeful atmosphere.
A faint light visible at the top of the hill.
```

**イメージ**: 「TECH DEBT」と書かれた大岩を5キャラが協力して押し上げる。苦しいが諦めない表情。

---

### C6. `aqs_type_forming.webp` — 結成したてのチーム 🌱

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
circular vignette composition (512x512),
five cute animal characters standing in a line, looking forward with hopeful expressions.
(hawk in suit, beagle in green polo, penguin in blue hoodie,
orange tabby cat with headphones, white rabbit in lab coat)
They are standing in front of a small glowing seedling/sprout growing from the ground.
The sprout emits a soft green glow, symbolizing potential and new beginnings.
Each character has a slightly shy but excited expression, as if meeting for the first time.
Neon soft green accent glow. Fresh, hopeful, new beginning atmosphere.
Faint sparkles around the sprout suggesting unlimited potential.
```

**イメージ**: 新芽の前に並ぶ5キャラ。期待と少しの緊張。無限の可能性を感じさせる構図。

---

## D. ストーリーイラスト（8枚） — 1280×720px

ストーリー画面の背景として表示。ワイドスクリーン、映画的構図。
**構成**: 横長シネマティック、キャラクターの感情と状況が伝わるシーン。

---

### D1. `aqs_story_01.webp` — はじめまして（出会い・結成）

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
cinematic wide composition (1280x720),
five cute animal characters meeting for the first time in a modern office.
They stand in a semi-circle, introducing themselves:
- a hawk in a business suit extending a wing for a handshake,
- a beagle dog in a green polo shirt wagging its tail excitedly,
- a penguin in a light blue hoodie waving warmly,
- an orange tabby cat with headphones looking curiously at the others,
- a white rabbit in a lab coat observing carefully.
A modern office background with glass walls, a kanban board, and potted plants.
Soft neon blue ambient glow. Mix of excitement and nervousness in their expressions.
A small "SPRINT 1" label floating subtly in the corner.
```

**イメージ**: モダンオフィスで初めて顔を合わせる5キャラ。期待と緊張が混在。

---

### D2. `aqs_story_02.webp` — それぞれのやり方（衝突・混乱）

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
cinematic wide composition (1280x720),
a meeting room scene where the team is having a disagreement:
- an orange tabby cat with headphones and a white rabbit in a lab coat facing each other
  with opposing thought bubbles (cat: fast code, rabbit: quality testing),
- a beagle dog in a green polo looking worried between them,
- a penguin in a light blue hoodie stepping forward to mediate with calming gestures,
- a hawk in a business suit watching from a chair with a thoughtful expression.
Scattered sticky notes and crumpled paper on the table showing frustration.
Soft neon red-orange accent glow symbolizing tension.
Despite the conflict, no hostility — just passionate disagreement.
```

**イメージ**: ネコとウサギが意見対立。ペンギンが仲裁。イヌが心配そう。タカが見守る。

---

### D3. `aqs_story_03.webp` — 最初の壁（最初の失敗）

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
cinematic wide composition (1280x720),
a sprint review scene where the team looks disappointed.
A presentation screen in the background showing a graph trending downward.
- a hawk in a business suit giving honest but concerned feedback from a chair,
- a beagle dog in a green polo lowering its head,
- an orange tabby cat with headphones looking frustrated at its laptop,
- a white rabbit in a lab coat reviewing a bug report with concern,
- a penguin in a light blue hoodie stepping forward with a "let's reflect" gesture.
A "DEBT" meter visible on a side monitor, colored yellow/warning.
Dim, subdued neon blue glow. Somber but not hopeless atmosphere.
Small light at the end: the penguin's gesture brings a faint warm glow.
```

**イメージ**: スプリントレビュー失敗。がっかり顔。でもペンギンが振り返りを促す光がある。

---

### D4. `aqs_story_04.webp` — 変わり始める空気（気づき・変化）

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
cinematic wide composition (1280x720),
a retrospective scene where positive changes are emerging:
- a penguin in a light blue hoodie facilitating at a board full of green "improved" sticky notes,
- an orange tabby cat with headphones proudly showing test code on its laptop,
- a beagle dog in a green polo reorganizing backlog cards neatly,
- a white rabbit in a lab coat pointing at a green CI/CD dashboard,
- a hawk in a business suit nodding approvingly with a small smile.
The room is brighter than previous scenes. Small flowers and sprouts appearing around the edges.
Neon green accent glow growing stronger. Hopeful, turning-point atmosphere.
Lightbulb icons floating above the characters' heads.
```

**イメージ**: 変化の兆し。付箋がグリーンに変わり始める。ネコがテストコードを自発的に書く。

---

### D5. `aqs_story_05.webp` — 助け合いの芽（協力・支え合い）

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
cinematic wide composition (1280x720),
an emergency incident response scene showing spontaneous teamwork:
- an orange tabby cat and a white rabbit working side by side at monitors,
  the rabbit teaching the cat a testing technique (pointing at screen together),
- a hawk in a business suit on a phone, shielding the team from external pressure,
- a penguin in a light blue hoodie coordinating with calm gestures,
- a beagle dog in a green polo bringing coffee/supplies to the team.
Red alert light in one corner, but the team is calm and coordinated.
Mixed neon glow: red alert fading into warm green teamwork glow.
The scene conveys: "We help each other without being asked."
```

**イメージ**: インシデント対応中だが自然と助け合いが生まれている。赤い警告→緑のチームワーク光への変化。

---

### D6. `aqs_story_06.webp` — 自分たちのリズム（自己組織化）

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
cinematic wide composition (1280x720),
a perfectly organized team workspace where everyone works autonomously:
- an orange tabby cat and a beagle dog pair-programming at one desk,
- a white rabbit running automated tests on a large monitor showing all-green results,
- a hawk in a business suit reviewing a clean burndown chart on a tablet,
- a penguin in a light blue hoodie sitting back, relaxed, watching the team with a proud smile
  (no longer needing to intervene).
A kanban board in the background is neat and well-organized.
Smooth workflow arrows connecting each character's activity.
Neon blue/teal accent glow. Calm, harmonious, "in the zone" atmosphere.
Everything flows naturally. The team has found its rhythm.
```

**イメージ**: 自律的に動くチーム。ペンギンが介入なしで見守る。整ったカンバンボード。

---

### D7. `aqs_story_07.webp` — 嵐を超えて（試練と克服）

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
cinematic wide composition (1280x720),
five cute animal characters standing united against a metaphorical storm:
a large swirling storm cloud / tornado on the right side representing major obstacles
(requirement changes, technical challenges), with lightning and wind.
The five characters (hawk, beagle, penguin, cat, rabbit) stand in a firm line on the left,
leaning into the wind but not backing down.
The penguin leads the formation. The cat holds its laptop like a shield.
The rabbit's lab coat flutters in the wind but it stands firm.
Mixed neon glow: purple/dark storm on the right, warm golden glow emanating from the team on the left.
Dramatic, epic, but still cute. The team's bond is their strength.
```

**イメージ**: 嵐（大きな障害）に立ち向かう5キャラ。嵐 vs チームの光のコントラスト。

---

### D8. `aqs_story_08.webp` — 真のTeam（完成・絆）

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background,
cinematic wide composition (1280x720),
five cute animal characters standing together on a hilltop at sunset/golden hour:
- a hawk in a business suit,
- a beagle dog in a green polo shirt,
- a penguin in a light blue hoodie,
- an orange tabby cat with headphones,
- a white rabbit in a lab coat.
They stand shoulder to shoulder, looking forward at a golden horizon together.
Warm sunset colors (orange, gold, pink) blending with the dark navy sky above.
A completed product/rocket launching in the distant background with a trail of sparkles.
Neon warm golden accent glow. Achieved, fulfilled, bonded atmosphere.
Each character's expression shows deep satisfaction and trust in each other.
The most beautiful and emotional scene of the series.
```

**イメージ**: 夕陽を背景に5キャラが並ぶ。達成感と絆。シリーズで最も美しいシーン。

---

## E. 背景画像（5枚） — 1920×1080px

各シーンの背景として使用。キャラクターは含まない。
**構成**: フルスクリーン背景、キャラクターを上に重ねる前提で情報量を控えめに。テキストの可読性を確保するため暗めのトーン。

---

### E1. `aqs_bg_office.webp` — オフィス / チームルーム

**使用画面**: TitleScreen, GuideScreen

**プロンプト**:
```
Cute kawaii flat illustration background, no characters, clean soft style,
wide composition (1920x1080),
a modern tech office / team room interior.
Open floor plan with standing desks, ergonomic chairs, large monitors.
A kanban board on the wall with colorful sticky notes.
Potted plants and warm indirect lighting.
Color palette: dark navy base (#0c1220) with subtle blue-teal ambient lighting.
Keep the scene relatively dark and atmospheric to allow text overlay.
Soft neon blue accent lighting from monitors and LED strips.
Slightly blurred/soft focus to serve as a background layer.
```

---

### E2. `aqs_bg_planning.webp` — 会議室

**使用画面**: SprintStartScreen, planning/refinement/review イベント

**プロンプト**:
```
Cute kawaii flat illustration background, no characters, clean soft style,
wide composition (1920x1080),
a modern meeting room with a large whiteboard and glass walls.
Whiteboard covered with colorful sticky notes in organized columns.
A long table with scattered sticky notes, pens, and planning poker cards.
A projector screen on one wall showing a sprint board.
Color palette: dark navy base (#0c1220) with subtle warm amber lighting.
Keep the scene dark and atmospheric for text overlay.
Soft neon yellow/amber accent glow from the whiteboard area.
Slightly blurred/soft focus background style.
```

---

### E3. `aqs_bg_dev.webp` — 開発スペース

**使用画面**: impl1/impl2/test1/test2 イベント

**プロンプト**:
```
Cute kawaii flat illustration background, no characters, clean soft style,
wide composition (1920x1080),
a developer workspace with multiple large monitors showing code.
Screens display colorful syntax-highlighted code (dark theme with green, blue, purple text).
Mechanical keyboards, mice, and coffee mugs on desks.
Small desk plants and figurines. LED strip lighting under desks.
Color palette: dark navy base (#0c1220) with purple/cyan ambient lighting from screens.
Keep the scene dark and atmospheric for text overlay.
Soft neon purple accent glow from the monitors.
Slightly blurred/soft focus background style.
```

---

### E4. `aqs_bg_emergency.webp` — 緊急対応空間

**使用画面**: emergency イベント

**プロンプト**:
```
Cute kawaii flat illustration background, no characters, clean soft style,
wide composition (1920x1080),
a war room / incident response room with an urgent atmosphere.
Multiple monitors showing red alert dashboards, error logs, and system metrics.
Red warning lights / sirens on the walls casting red glow.
A central large screen showing a system status dashboard with red indicators.
Color palette: very dark base (#060a12) with intense red accent lighting.
Keep the scene dark and dramatic for text overlay.
Neon red accent glow from warning lights and monitors.
Slightly blurred/soft focus background style. Tense atmosphere.
```

---

### E5. `aqs_bg_retro.webp` — カフェスペース

**使用画面**: RetrospectiveScreen

**プロンプト**:
```
Cute kawaii flat illustration background, no characters, clean soft style,
wide composition (1920x1080),
a cozy cafe-style lounge space for team retrospectives.
Comfortable bean bag chairs and low sofas arranged in a circle.
A small coffee table with cups, snacks, and sticky notes.
A retrospective board on the wall (three columns with sticky notes).
Warm lighting from table lamps and string lights on the walls.
Small potted plants and books on shelves.
Color palette: dark navy base (#0c1220) with warm amber/golden ambient lighting.
Keep the scene dark but cozy for text overlay.
Soft neon warm amber accent glow. Relaxed, inviting atmosphere.
Slightly blurred/soft focus background style.
```

---

## F. エンディングイラスト（2枚） — 1280×720px

エンディングストーリー画面の背景として表示。ストーリーイラスト（D系）と同じワイドスクリーン構図。
**構成**: 横長シネマティック。共通パート（プロジェクト完了）とエピローグ（未来への旅立ち）の2枚。

---

### F1. `aqs_ending_common.webp` — プロジェクト完了（共通パート）

**使用タイミング**: 全スプリント完了後のエンディング共通パート
**シーン**: 最終スプリントレビュー後。チーム全員がプロダクト完成を祝っている

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients, dark navy background (#060a12),
cinematic wide composition (1280x720),
five cute animal characters celebrating the completion of their product together:
- a hawk in a business suit raising a glass in a toast, smiling proudly,
- a beagle dog in a green polo shirt jumping with joy, tail wagging,
- a penguin in a light blue hoodie clapping its flippers, tears of joy in its eyes,
- an orange tabby cat with headphones holding up a laptop showing "v1.0 Released!",
- a white rabbit in a lab coat throwing confetti with both paws.
They are gathered around a large monitor/screen displaying a beautiful product dashboard
with a "PROJECT COMPLETE" banner and green status indicators.
Colorful confetti, streamers, and sparkle particles filling the air.
A cake with "Thank you Team!" written on it sits on a table nearby.
Neon warm golden accent glow mixed with celebratory multicolor sparkles.
The most joyful and triumphant scene — the culmination of all their hard work.
Warm ambient lighting suggesting a late afternoon celebration.
```

**イメージ**: プロダクト完成の瞬間。5キャラ全員が最高の笑顔で祝福。紙吹雪、ケーキ、「PROJECT COMPLETE」の画面。シリーズのクライマックス。

---

### F2. `aqs_ending_epilogue.webp` — エピローグ（チームタイプ別共通背景）

**使用タイミング**: チームタイプ別エピローグの背景
**シーン**: 夕日を背景に、5人が未来を見つめる

**プロンプト**:
```
Cute kawaii flat illustration, clean outlines, soft gradients,
cinematic wide composition (1280x720),
five cute animal characters standing together on a rooftop terrace at sunset,
looking out at a city skyline bathed in golden light:
- a hawk in a business suit,
- a beagle dog in a green polo shirt,
- a penguin in a light blue hoodie,
- an orange tabby cat with headphones,
- a white rabbit in a lab coat.
They stand side by side as silhouettes against the sunset, but with enough detail
to see their expressions — peaceful, fulfilled, and looking forward to what comes next.
The sunset sky transitions from warm gold/orange at the horizon through pink/purple
to the dark navy (#060a12) at the top.
City buildings in the background with twinkling lights starting to appear.
A gentle breeze shown through subtle motion in their clothes/fur.
A road/path extending from the rooftop into the distant golden horizon,
symbolizing their continued journey together.
Neon warm golden/amber accent glow from the sunset. Soft lens flare effect.
Peaceful, hopeful, "the story continues" atmosphere.
The most emotionally moving scene — not an ending, but a new beginning.
```

**イメージ**: 夕陽のテラスに並ぶ5キャラのシルエット。金色の地平線に続く道。「物語はここで終わらない」という余韻を残すエピローグシーン。

---

## 画像ファイル名と保存先の対応表

すべて `src/assets/images/` に WebP 形式で保存。

| # | カテゴリ | ファイル名 | サイズ | 新規/差替 |
|---|---------|-----------|--------|----------|
| A1 | イベント | `aqs_event_planning.webp` | 800×450 | 差替 |
| A2 | イベント | `aqs_event_impl1.webp` | 800×450 | 差替 |
| A3 | イベント | `aqs_event_test1.webp` | 800×450 | 差替 |
| A4 | イベント | `aqs_event_refinement.webp` | 800×450 | 差替 |
| A5 | イベント | `aqs_event_impl2.webp` | 800×450 | 差替 |
| A6 | イベント | `aqs_event_test2.webp` | 800×450 | 差替 |
| A7 | イベント | `aqs_event_review.webp` | 800×450 | 差替 |
| A8 | イベント | `aqs_event_emergency.webp` | 800×450 | 差替 |
| B1 | UI | `aqs_correct.webp` | 512×512 | 差替 |
| B2 | UI | `aqs_incorrect.webp` | 512×512 | 差替 |
| B3 | UI | `aqs_timeup.webp` | 512×512 | 差替 |
| B4 | UI | `aqs_build_success.webp` | 512×512 | 差替 |
| B5 | UI | `aqs_grade_celebration.webp` | 512×512 | 差替 |
| B6 | UI | `aqs_retro.webp` | 512×512 | 差替 |
| C1 | チームタイプ | `aqs_type_synergy.webp` | 512×512 | 新規 |
| C2 | チームタイプ | `aqs_type_resilient.webp` | 512×512 | 新規 |
| C3 | チームタイプ | `aqs_type_evolving.webp` | 512×512 | 新規 |
| C4 | チームタイプ | `aqs_type_agile.webp` | 512×512 | 新規 |
| C5 | チームタイプ | `aqs_type_struggling.webp` | 512×512 | 新規 |
| C6 | チームタイプ | `aqs_type_forming.webp` | 512×512 | 新規 |
| D1 | ストーリー | `aqs_story_01.webp` | 1280×720 | 新規 |
| D2 | ストーリー | `aqs_story_02.webp` | 1280×720 | 新規 |
| D3 | ストーリー | `aqs_story_03.webp` | 1280×720 | 新規 |
| D4 | ストーリー | `aqs_story_04.webp` | 1280×720 | 新規 |
| D5 | ストーリー | `aqs_story_05.webp` | 1280×720 | 新規 |
| D6 | ストーリー | `aqs_story_06.webp` | 1280×720 | 新規 |
| D7 | ストーリー | `aqs_story_07.webp` | 1280×720 | 新規 |
| D8 | ストーリー | `aqs_story_08.webp` | 1280×720 | 新規 |
| E1 | 背景 | `aqs_bg_office.webp` | 1920×1080 | 新規 |
| E2 | 背景 | `aqs_bg_planning.webp` | 1920×1080 | 新規 |
| E3 | 背景 | `aqs_bg_dev.webp` | 1920×1080 | 新規 |
| E4 | 背景 | `aqs_bg_emergency.webp` | 1920×1080 | 新規 |
| E5 | 背景 | `aqs_bg_retro.webp` | 1920×1080 | 新規 |
| F1 | エンディング | `aqs_ending_common.webp` | 1280×720 | 新規 |
| F2 | エンディング | `aqs_ending_epilogue.webp` | 1280×720 | 新規 |

**合計**: 35枚（差替14枚 + 新規21枚）

---

## 生成時の注意事項

1. **キャラクターの一貫性**: 全画像で5キャラの服装・特徴を統一すること（上記リファレンス参照）
2. **ダーク基調**: ゲームUIがダークテーマのため、背景は暗い色で統一
3. **ネオングロー**: テーマに応じたアクセントカラーのグロー効果を必ず入れる
4. **テキスト重畳対応**: 背景画像（E系）は半透明オーバーレイを掛ける前提で、情報量を控えめに
5. **WebP形式**: PNG で生成後、WebP に変換でもOK
6. **アスペクト比厳守**: 各カテゴリで指定されたサイズ比を守る
