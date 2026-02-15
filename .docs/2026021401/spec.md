# 迷宮の残響 — 画像生成仕様（AI画像生成者向け）

## 1. 画像一覧（全26枚）

| # | ファイル名 | カテゴリ | 用途画面 | アスペクト比 | 推奨解像度 |
|---|---|---|---|---|---|
| 1 | `le_title.webp` | タイトル | TitleScreen | 16:9 | 1280×720 |
| 2 | `le_diff_easy.webp` | 難易度 | DiffSelectScreen | 16:9 | 800×450 |
| 3 | `le_diff_normal.webp` | 難易度 | DiffSelectScreen | 16:9 | 800×450 |
| 4 | `le_diff_hard.webp` | 難易度 | DiffSelectScreen | 16:9 | 800×450 |
| 5 | `le_diff_abyss.webp` | 難易度 | DiffSelectScreen | 16:9 | 800×450 |
| 6 | `le_floor_1.webp` | フロア | FloorIntroScreen | 16:9 | 1024×576 |
| 7 | `le_floor_2.webp` | フロア | FloorIntroScreen | 16:9 | 1024×576 |
| 8 | `le_floor_3.webp` | フロア | FloorIntroScreen | 16:9 | 1024×576 |
| 9 | `le_floor_4.webp` | フロア | FloorIntroScreen | 16:9 | 1024×576 |
| 10 | `le_floor_5.webp` | フロア | FloorIntroScreen | 16:9 | 1024×576 |
| 11 | `le_event_exploration.webp` | イベント | EventResultScreen | 3:2 | 600×400 |
| 12 | `le_event_encounter.webp` | イベント | EventResultScreen | 3:2 | 600×400 |
| 13 | `le_event_trap.webp` | イベント | EventResultScreen | 3:2 | 600×400 |
| 14 | `le_event_rest.webp` | イベント | EventResultScreen | 3:2 | 600×400 |
| 15 | `le_ending_abyss_perfect.webp` | ED | VictoryScreen | 4:3 | 800×600 |
| 16 | `le_ending_abyss_clear.webp` | ED | VictoryScreen | 4:3 | 800×600 |
| 17 | `le_ending_hard_clear.webp` | ED | VictoryScreen | 4:3 | 800×600 |
| 18 | `le_ending_perfect.webp` | ED | VictoryScreen | 4:3 | 800×600 |
| 19 | `le_ending_scholar.webp` | ED | VictoryScreen | 4:3 | 800×600 |
| 20 | `le_ending_iron.webp` | ED | VictoryScreen | 4:3 | 800×600 |
| 21 | `le_ending_battered.webp` | ED | VictoryScreen | 4:3 | 800×600 |
| 22 | `le_ending_madness.webp` | ED | VictoryScreen | 4:3 | 800×600 |
| 23 | `le_ending_cursed.webp` | ED | VictoryScreen | 4:3 | 800×600 |
| 24 | `le_ending_veteran.webp` | ED | VictoryScreen | 4:3 | 800×600 |
| 25 | `le_ending_standard.webp` | ED | VictoryScreen | 4:3 | 800×600 |
| 26 | `le_gameover.webp` | GO | GameOverScreen | 4:3 | 800×600 |

---

## 2. 画像スタイルガイド

### 共通ベーススタイル（全26枚共通）

**物語的写実主義の要素:**
- 温かみのある写実的な人物描写
- 物語性のある構図（一枚絵でストーリーが伝わる）
- 光と影の繊細なコントラスト
- 人間の表情と感情の豊かな描写

**ダンジョンファンタジーの要素:**
- ファンタジー世界の重厚な雰囲気
- ダンジョン・迷宮の石造りの質感
- 甲冑・革鎧・武器のリアルなディテール
- ドラマチックなライティング（松明・魔法の光）

**融合ルール:**
- 主人公: 10代後半の若い冒険者、短い茶髪、革鎧＋ダークブルーのフード付きクローク＋ブーツ＋小さな鞄＋消えかけの松明
- タッチ: 油絵調の筆致、デジタルで鮮明な仕上がり
- 色調: ダークベース + 各シーンのテーマカラーのアクセント
- テキスト/ウォーターマーク/署名: 一切含めない
- 全画像で同一の主人公キャラクターを使用（一貫性）

### AI画像生成ベースプロンプト

```
[COMMON BASE]
Oil painting illustration blending warm narrative realism
(reminiscent of classic adventure novel illustrations) with
classic dungeon-crawl fantasy art. Rich oil paint textures, dramatic
chiaroscuro lighting, detailed stonework and fantasy equipment. Painterly
brushstrokes visible. A young adventurer (late teens, short brown hair)
wearing worn leather armor, a dark blue hooded cloak, and sturdy boots,
carrying a small satchel and an extinguished torch.
Dark atmospheric dungeon setting. No text, no watermark, no signature.
```

---

## 3. 各画像の個別プロンプト

### タイトル画面

```
[COMMON BASE]
A lone young adventurer stands at the threshold of an ancient stone dungeon
entrance. Massive carved stone archway with eroded runes. Faint blue
mystical light emanates from within the darkness. The adventurer looks into
the void with a mix of determination and trepidation. Cinematic wide shot,
the figure small against the enormous entrance. Evening sky behind them.
Mood: ominous anticipation. --ar 16:9
```

---

### 難易度カード（4枚）

**探索者（easy）:**
```
[COMMON BASE]
A peaceful torchlit dungeon corridor with warm golden light. The young
adventurer walks confidently through a safe passage. Moss grows on weathered
stones, small harmless creatures scurry away. Gentle atmosphere, like the
opening chapter of an adventure novel. Green accent lighting from
bioluminescent moss.
Mood: calm, inviting, safe exploration. --ar 16:9
```

**挑戦者（normal）:**
```
[COMMON BASE]
The adventurer stands at a branching corridor, sword drawn, weighing options.
Two paths diverge into darkness. Balanced composition with equal light and
shadow. Cobwebs and claw marks on the walls hint at danger. Purple-blue
accent lighting from distant magical glow.
Mood: focused determination, calculated risk, balanced tension. --ar 16:9
```

**求道者（hard）:**
```
[COMMON BASE]
An inferno-like dungeon corridor with cracks revealing molten orange glow.
The adventurer pushes forward through intense heat, shield raised. Sweat and
grime on their face, expression grim but resolute. Amber and orange dominant.
Falling debris, crumbling architecture. Ascetic warrior aesthetic.
Mood: intense, perilous, burning determination. --ar 16:9
```

**修羅（abyss）:**
```
[COMMON BASE]
Absolute darkness broken only by faint crimson glow. Scattered bones and
broken weapons litter the ground. The adventurer barely visible, surrounded
by overwhelming shadow. Skull motifs carved into walls. Deep red and black
palette. The torch has gone out, only the adventurer's eyes reflect dim
red light.
Mood: pure dread, fatal, point of no return. --ar 16:9
```

---

### フロアイントロ（5枚）

**第1層 — 表層回廊（テーマカラー: #60a5fa）:**
```
[COMMON BASE]
A grand stone corridor with high arched ceilings. Blue-tinted torches line
the walls in iron sconces. Fresh air still flows from the entrance behind.
The stonework is ancient but intact. Water trickles down carved channels.
Cool blue color palette (#60a5fa accent).
Mood: initial unease, deceptively calm. --ar 16:9
```

**第2層 — 灰色の迷路（テーマカラー: #a0a0b8）:**
```
[COMMON BASE]
An endless maze of identical grey stone corridors. All light sources dead
except the adventurer's weakening torch. Thick fog along the floor.
Featureless oppressive walls. Desaturated grey (#a0a0b8 accent). Identical
passages stretch in every direction.
Mood: isolation, disorientation, creeping fear in silence. --ar 16:9
```

**第3層 — 深淵の間（テーマカラー: #c084fc）:**
```
[COMMON BASE]
An impossible space where geometry defies logic. Staircases lead to ceilings,
doorways open to walls. Purple crystalline formations pulse with eldritch
light. The adventurer on a floating platform looking at an inverted room.
Purple and violet (#c084fc accent). Escher-like architecture.
Mood: surreal, mind-bending, sanity-threatening. --ar 16:9
```

**第4層 — 忘却の底（テーマカラー: #f472b6）:**
```
[COMMON BASE]
A dreamlike landscape where stone walls dissolve into pink mist. Fragments
of memories float in the air: half-visible faces, objects, scenes. The
adventurer's form slightly transparent, becoming part of the mist. Soft pink
and magenta (#f472b6 accent). Cherry blossom-like particles drift.
Mood: bittersweet, losing oneself, melancholic beauty. --ar 16:9
```

**第5層 — 迷宮の心臓（テーマカラー: #fbbf24）:**
```
[COMMON BASE]
A colossal underground cathedral. Walls pulse with golden light like a
heartbeat. An enormous organic-mechanical structure dominates the center —
the literal heart of the labyrinth. Ancient runes blaze with golden fire.
The adventurer dwarfed by scale. Gold and amber (#fbbf24 accent).
Mood: awe, finality, confrontation with the source. --ar 16:9
```

---

### イベントタイプ（4枚）

**探索（exploration / テーマカラー: #38bdf8）:**
```
[COMMON BASE]
Close-up of the adventurer examining ancient wall carvings by torchlight.
One hand traces carved symbols, the other holds a flickering torch. Dust
motes in the beam. Discovery and curiosity in their expression. Cyan-blue
accent (#38bdf8). Aspect ratio 3:2.
Mood: intellectual curiosity, careful investigation.
```

**遭遇（encounter / テーマカラー: #fbbf24）:**
```
[COMMON BASE]
The adventurer face-to-face with a cloaked mysterious figure in a circular
chamber. Neither aggressive nor friendly. Amber torchlight between them
creates dramatic shadows. The stranger's face hidden in hood shadow. Amber
accent (#fbbf24). Aspect ratio 3:2.
Mood: tense standoff, uncertain outcome, pivotal moment.
```

**罠（trap / テーマカラー: #f87171）:**
```
[COMMON BASE]
The adventurer's foot pressing a pressure plate as crossbow bolts launch from
wall slits. Frozen moment of danger. Dynamic composition with motion blur on
bolts. The adventurer twists to dodge. Red accent (#f87171). Aspect ratio 3:2.
Mood: sudden danger, adrenaline, split-second survival.
```

**安息（rest / テーマカラー: #4ade80）:**
```
[COMMON BASE]
A small hidden alcove with a tiny campfire. The adventurer sits against the
wall, bandaging a wound. Flask of water nearby. Warm orange firelight creates
a circle of safety. Green accent (#4ade80) from healing herbs. Aspect ratio 3:2.
Mood: brief respite, healing, quiet moment of peace.
```

---

### エンディング（11枚）

**修羅の覇者（abyss_perfect / #ff0040）:**
```
[COMMON BASE]
The adventurer atop the defeated heart of the labyrinth, bathed in red and
gold light. Perfect condition, armor gleaming, commanding posture. Crown-like
golden aura. The labyrinth crumbles in awe. Aspect ratio 4:3.
Colors: crimson (#ff0040) and gold.
Mood: absolute triumph, the dungeon itself fears this conqueror.
```

**修羅を超えし者（abyss_clear / #ef4444）:**
```
[COMMON BASE]
The adventurer exhausted but victorious in aftermath of destruction. Blood-red
sky through cracked ceiling. Weapon planted in ground for support. Battle
scars but unbowed. Aspect ratio 4:3. Colors: deep red (#ef4444), black, ember.
Mood: hard-won victory against impossible odds.
```

**求道の果て（hard_clear / #f59e0b）:**
```
[COMMON BASE]
The adventurer emerges from the dungeon at sunset. Mountain path behind,
golden twilight ahead. Visible scars but serene expression. Walking stick
from dungeon bone. Aspect ratio 4:3. Colors: amber (#f59e0b), warm sunset.
Mood: profound achievement, ascetic enlightenment.
```

**完全なる帰還（perfect / #fde68a）:**
```
[COMMON BASE]
The adventurer walks through a golden archway into pure light. Not a scratch.
Ancient knowledge in their gaze. The labyrinth seals shut behind. Aspect 4:3.
Colors: warm gold (#fde68a), white light, pristine.
Mood: flawless victory, complete mastery.
```

**知識の導き（scholar / #fbbf24）:**
```
[COMMON BASE]
The adventurer in a vast underground library, holding a glowing ancient tome.
Light streams from pages, illuminating a path. Bookshelves impossibly high.
Knowledge symbols float in air. Aspect 4:3. Colors: amber (#fbbf24), browns.
Mood: wisdom's reward, knowledge as ultimate weapon.
```

**不屈の生還（iron / #f97316）:**
```
[COMMON BASE]
The adventurer charging through a collapsing tunnel. Injured and bleeding but
eyes burning with will. Status ailments visible (bandaged wounds) but fighting
through. Fire in their wake. Aspect 4:3. Colors: orange (#f97316), flame red.
Mood: willpower over adversity, unbreakable spirit.
```

**満身創痍の脱出（battered / #ef4444）:**
```
[COMMON BASE]
The adventurer crawling toward distant exit light. Armor broken, body battered,
reaching with trembling hand toward the light. Last ounce of strength. Aspect 4:3.
Colors: red (#ef4444), dark, sliver of white exit light.
Mood: desperate survival, barely alive, one more step to salvation.
```

**狂気の淵より（madness / #a78bfa）:**
```
[COMMON BASE]
The adventurer walking out of the dungeon, but reality is fractured. Half normal
exit, half hallucinatory purple nightmare. Distant thousand-yard stare.
Double-exposure effect. Aspect 4:3. Colors: purple (#a78bfa), surreal desaturation.
Mood: fragile sanity, barely-coherent reality.
```

**呪われし帰還者（cursed / #fb923c）:**
```
[COMMON BASE]
The adventurer emerging at night. Dark curse marks glow orange on arms and neck.
Shadow tendrils cling from darkness behind. Haunted relief expression. Out but
changed forever. Aspect 4:3. Colors: orange (#fb923c), dark, cursed glow.
Mood: tainted victory, the dungeon's permanent mark.
```

**歴戦の探索者（veteran / #c084fc）:**
```
[COMMON BASE]
The adventurer sitting on dungeon steps outside, removing helmet. Numerous scars,
well-worn repaired equipment. Weary but satisfied smile. Sunset behind. A younger
adventurer approaches for guidance. Aspect 4:3. Colors: purple (#c084fc), twilight.
Mood: earned wisdom, seasoned survivor.
```

**生還（standard / #4ade80）:**
```
[COMMON BASE]
The adventurer stepping out of dungeon entrance into daylight. Simple composition:
darkness behind, light ahead. Deep breath of fresh air. First sunrise in forever.
Green grass underfoot. Aspect 4:3. Colors: green (#4ade80), morning light.
Mood: relief, simple victory, alive and grateful.
```

---

### ゲームオーバー（1枚）

```
[COMMON BASE]
The adventurer collapsed on dungeon floor. Torch nearby, flame guttering out.
Darkness closes in. Single beam of light from above illuminates fallen form.
Equipment scattered. Aspect 4:3.
Colors: desaturated grey, fading warm light to cold darkness.
Mood: defeat, fading consciousness, but light above suggests knowledge for next time.
```

---

## 4. 画像仕様

| 項目 | 値 |
|---|---|
| フォーマット | WebP |
| 品質 | 82% |
| 個別サイズ上限 | 300KB（既存 IPNE 画像 176KB〜346KB に準拠） |
| 全体サイズ予算 | 26枚 × 300KB = 最大 7.8MB |
| 変換方法 | PNG 生成 → `cwebp -q 82 input.png -o output.webp` |
| 格納場所 | `src/assets/images/` |
| 命名規則 | `le_` + カテゴリ + `_` + ID + `.webp` |

---

## 5. ディレクトリ構造

```
src/assets/images/
  le_title.webp                    # タイトル画面
  le_diff_easy.webp                # 難易度: 探索者
  le_diff_normal.webp              # 難易度: 挑戦者
  le_diff_hard.webp                # 難易度: 求道者
  le_diff_abyss.webp               # 難易度: 修羅
  le_floor_1.webp                  # 表層回廊
  le_floor_2.webp                  # 灰色の迷路
  le_floor_3.webp                  # 深淵の間
  le_floor_4.webp                  # 忘却の底
  le_floor_5.webp                  # 迷宮の心臓
  le_event_exploration.webp        # イベント: 探索
  le_event_encounter.webp          # イベント: 遭遇
  le_event_trap.webp               # イベント: 罠
  le_event_rest.webp               # イベント: 安息
  le_ending_abyss_perfect.webp     # ED: 修羅の覇者
  le_ending_abyss_clear.webp       # ED: 修羅を超えし者
  le_ending_hard_clear.webp        # ED: 求道の果て
  le_ending_perfect.webp           # ED: 完全なる帰還
  le_ending_scholar.webp           # ED: 知識の導き
  le_ending_iron.webp              # ED: 不屈の生還
  le_ending_battered.webp          # ED: 満身創痍の脱出
  le_ending_madness.webp           # ED: 狂気の淵より
  le_ending_cursed.webp            # ED: 呪われし帰還者
  le_ending_veteran.webp           # ED: 歴戦の探索者
  le_ending_standard.webp          # ED: 生還
  le_gameover.webp                 # ゲームオーバー
```

---

## 6. README 追記内容

`src/features/labyrinth-echo/README.md` に以下を追記:

```markdown
### 画像アセット

#### スタイルガイド

全シナリオ画像は統一スタイルで制作:

- **画風**: 温かみのある物語的写実主義 × 重厚なダンジョンファンタジーアート
- **タッチ**: 油絵調の筆致 + 重厚なダンジョンファンタジー
- **主人公**: 10代後半の若い冒険者、革鎧・フード付きクローク・ブーツ着用
- **照明**: ドラマチックなキアロスクーロ（松明・魔法光源の明暗対比）
- **色調**: ダークベース + 各シーンのテーマカラーアクセント
- **禁則**: テキスト、ウォーターマーク、署名は含めない

#### 画像一覧（26枚）

| カテゴリ | 枚数 | ファイル名パターン | 用途画面 |
|---|---|---|---|
| タイトル | 1 | `le_title.webp` | TitleScreen |
| 難易度 | 4 | `le_diff_{id}.webp` | DiffSelectScreen |
| フロア | 5 | `le_floor_{n}.webp` | FloorIntroScreen |
| イベント | 4 | `le_event_{type}.webp` | EventResultScreen |
| エンディング | 11 | `le_ending_{id}.webp` | VictoryScreen |
| ゲームオーバー | 1 | `le_gameover.webp` | GameOverScreen |

#### 画像仕様

- **フォーマット**: WebP（品質82%）
- **サイズ上限**: 300KB/枚
- **配置**: `src/assets/images/`（Webpack バンドル）
- **管理**: `src/features/labyrinth-echo/images.ts` で一元管理
```

---

## 7. コード変更箇所

### 新規ファイル

- `src/features/labyrinth-echo/images.ts` — 画像 import マッピング一元管理

### 変更ファイル（6ファイル）

| ファイル | 変更内容 |
|---|---|
| `components/TitleScreen.tsx` | タイトル背景画像追加（h1の上） |
| `components/GameComponents.tsx` | DiffCard にカードヘッダー画像追加（L116付近） |
| `components/FloorIntroScreen.tsx` | フロア名の上に画像追加 |
| `components/EventResultScreen.tsx` | イベントタイプタグ横に小画像追加 |
| `components/EndScreens.tsx` | VictoryScreen にエンディング画像、GameOverScreen にゲームオーバー画像追加 |
| `README.md` | 画像スタイルガイドセクション追記 |
