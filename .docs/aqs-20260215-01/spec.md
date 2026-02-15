# Agile Quiz Sugoroku - 画像仕様書

## スタイルガイド

### 統一スタイル

全画像は以下の統一スタイルで制作する:

- **画風**: フラットデザイン × かわいい（カワイイ）イラスト
- **タッチ**: クリーンなベクター調、丸みを帯びた柔らかいライン
- **キャラクター**: デフォルメされたかわいい動物キャラクター（猫エンジニア、犬PM、うさぎテスターなど）
- **色調**: ダークブルー背景（#060a12〜#0c1220）に映える鮮やかなアクセントカラー
- **照明**: フラットでソフト、淡いグロー効果
- **テーマ**: アジャイル開発・ソフトウェアエンジニアリング（カンバンボード、コードエディタ、ターミナル等のモチーフ）
- **雰囲気**: テック感がありつつも親しみやすく、楽しい学習体験を演出
- **禁則**: テキスト、ウォーターマーク、署名は含めない

### カラーパレット参照

画像のアクセントカラーは各用途に合わせてゲーム内カラーパレットと統一:

| 色名 | コード | 用途 |
|---|---|---|
| accent (blue) | `#4d9fff` | 基調色、プランニング |
| purple | `#a78bfa` | 実装系イベント |
| cyan | `#22d3ee` | テスト1 |
| yellow | `#f0b040` | リファインメント、成長曲線型 |
| green | `#34d399` | テスト2、安定運用型 |
| orange | `#fb923c` | レビュー、火消し職人 |
| red | `#f06070` | 緊急対応、技術的負債型 |
| muted | `#5e6e8a` | デフォルト型 |

### 画像フォーマット

- **形式**: WebP（品質 82%）
- **サイズ上限**: 300KB / 枚
- **解像度**: 512×512px（イベント・タイプ）、1024×512px（背景・装飾）
- **配置先**: `src/assets/images/`
- **命名規則**: `aqs_{category}_{id}.webp`

---

## 画像仕様（全 22 枚）

### 1. タイトル背景

**ファイル名**: `aqs_title.webp`
**サイズ**: 1024×512px
**用途**: TitleScreen の背景画像（`opacity: 0.15` + `filter: blur(2px)`）

**AI 生成プロンプト**:

```
A wide panoramic illustration in cute flat vector style on a dark blue (#060a12) background.
Scene: A cheerful agile workspace — a large kanban board with colorful sticky notes in the center,
surrounded by cute animal characters (a cat developer with headphones typing on a laptop,
a dog product owner pointing at the board, a rabbit tester with a magnifying glass).
Floating elements: code brackets {}, sprint arrows, small gear icons, and sparkles.
Color accents: bright blue (#4d9fff), green (#34d399), purple (#a78bfa), orange (#fb923c).
Soft glow effects around key elements. No text, no watermark.
Mood: energetic, fun, tech-meets-cute.
```

---

### 2. スプリント開始

**ファイル名**: `aqs_sprint_start.webp`
**サイズ**: 1024×512px
**用途**: SprintStartScreen の装飾画像（パネル上部または背景）

**AI 生成プロンプト**:

```
A wide illustration in cute flat vector style on a dark navy (#0c1220) background.
Scene: A starting line scene — cute animal characters lined up at a sprint start line,
a cat engineer stretching, a dog scrum master holding a whistle, a rabbit tester warming up.
Behind them: a large numbered board showing "SPRINT" with lanes and milestones ahead.
Elements: countdown timer floating above, small rocket icons, determination sparkles.
Color accents: blue (#4d9fff) for the track lines, green (#34d399) for the go signal.
Soft gradient glow. No text, no watermark.
Mood: anticipation, readiness, fun team energy.
```

---

### 3. イベントアイコン: プランニング

**ファイル名**: `aqs_event_planning.webp`
**サイズ**: 512×512px
**用途**: QuizScreen EventCard のイベントアイコン（📋 のフォールバック）

**AI 生成プロンプト**:

```
A square icon illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute cat character wearing glasses, sitting at a desk with a large clipboard/planning board.
The board shows colorful user story cards arranged neatly. A small pointer stick in hand.
Floating elements: small lightbulb, checkmark icons, tiny calendar.
Primary color accent: blue (#4d9fff) glow around the planning board.
Circular composition centered for use as a round icon.
Clean, bold outlines. No text, no watermark.
```

---

### 4. イベントアイコン: 実装（1回目）

**ファイル名**: `aqs_event_impl1.webp`
**サイズ**: 512×512px
**用途**: QuizScreen EventCard のイベントアイコン（⌨️ のフォールバック）

**AI 生成プロンプト**:

```
A square icon illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute cat engineer with headphones, enthusiastically typing on a glowing keyboard.
A code editor screen behind showing colorful syntax-highlighted code lines.
Floating elements: curly braces {}, small function icons, coffee cup steam.
Primary color accent: purple (#a78bfa) glow around the screen and keyboard.
Circular composition centered for use as a round icon.
Clean, bold outlines. No text, no watermark.
Mood: focused, creative energy, first attempt excitement.
```

---

### 5. イベントアイコン: テスト（1回目）

**ファイル名**: `aqs_event_test1.webp`
**サイズ**: 512×512px
**用途**: QuizScreen EventCard のイベントアイコン（🧪 のフォールバック）

**AI 生成プロンプト**:

```
A square icon illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute rabbit character wearing a lab coat, holding a test tube with glowing cyan liquid.
Behind: a terminal screen showing test output with green checkmarks and progress bars.
Floating elements: magnifying glass, small bug icons being caught, checkmark badges.
Primary color accent: cyan (#22d3ee) glow around the test tube and terminal.
Circular composition centered for use as a round icon.
Clean, bold outlines. No text, no watermark.
Mood: careful, investigative, discovery.
```

---

### 6. イベントアイコン: リファインメント

**ファイル名**: `aqs_event_refinement.webp`
**サイズ**: 512×512px
**用途**: QuizScreen EventCard のイベントアイコン（🔧 のフォールバック）

**AI 生成プロンプト**:

```
A square icon illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute dog character wearing an apron, carefully adjusting gears and polishing
a small golden wrench. Behind: organized shelves with neatly arranged backlog cards.
Floating elements: sparkle effects, small sorting arrows, refinement polish glints.
Primary color accent: yellow (#f0b040) glow around the wrench and gears.
Circular composition centered for use as a round icon.
Clean, bold outlines. No text, no watermark.
Mood: meticulous, organized, satisfying improvement.
```

---

### 7. イベントアイコン: 実装（2回目）

**ファイル名**: `aqs_event_impl2.webp`
**サイズ**: 512×512px
**用途**: QuizScreen EventCard のイベントアイコン（⌨️ のフォールバック）

**AI 生成プロンプト**:

```
A square icon illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute cat engineer (same as impl1 but with a determined expression), dual-wielding
a keyboard and mouse. Two code editor screens floating showing diff/patch view.
Floating elements: merge arrows, git branch icons, small fix badges.
Primary color accent: purple (#a78bfa) glow, slightly more intense than impl1.
Circular composition centered for use as a round icon.
Clean, bold outlines. No text, no watermark.
Mood: determined, fixing issues, second-round refinement energy.
```

---

### 8. イベントアイコン: テスト（2回目）

**ファイル名**: `aqs_event_test2.webp`
**サイズ**: 512×512px
**用途**: QuizScreen EventCard のイベントアイコン（✅ のフォールバック）

**AI 生成プロンプト**:

```
A square icon illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute rabbit character (same as test1 but with a confident smile), holding up
a large green checkmark shield. Behind: a dashboard showing all-green test results.
Floating elements: shield icons, green check badges, small celebration confetti.
Primary color accent: green (#34d399) glow around the shield and dashboard.
Circular composition centered for use as a round icon.
Clean, bold outlines. No text, no watermark.
Mood: confident, thorough, final verification satisfaction.
```

---

### 9. イベントアイコン: スプリントレビュー

**ファイル名**: `aqs_event_review.webp`
**サイズ**: 512×512px
**用途**: QuizScreen EventCard のイベントアイコン（📊 のフォールバック）

**AI 生成プロンプト**:

```
A square icon illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute dog character standing at a presentation podium, pointing at a large
screen showing charts (bar chart, pie chart). Audience of small cute animal silhouettes watching.
Floating elements: star ratings, thumbs-up icons, small trophy.
Primary color accent: orange (#fb923c) glow around the charts and podium.
Circular composition centered for use as a round icon.
Clean, bold outlines. No text, no watermark.
Mood: proud, sharing achievements, team celebration.
```

---

### 10. イベントアイコン: 緊急対応

**ファイル名**: `aqs_event_emergency.webp`
**サイズ**: 512×512px
**用途**: QuizScreen EventCard のイベントアイコン（🚨 のフォールバック）

**AI 生成プロンプト**:

```
A square icon illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute cat character in a firefighter helmet, rushing with a fire extinguisher
toward a comically smoking server rack. Red warning lights flashing.
Floating elements: alarm sirens, exclamation marks, small flame icons.
Primary color accent: red (#f06070) glow, pulsating alert effect around the scene.
Circular composition centered for use as a round icon.
Clean, bold outlines. No text, no watermark.
Mood: urgent but still cute, controlled chaos, heroic response.
```

---

### 11. 振り返り

**ファイル名**: `aqs_retro.webp`
**サイズ**: 1024×512px
**用途**: RetrospectiveScreen の背景装飾（`opacity: 0.12` + `filter: blur(2px)`）

**AI 生成プロンプト**:

```
A wide panoramic illustration in cute flat vector style on a dark navy (#0c1220) background.
Scene: A cozy retrospective meeting room — cute animal characters sitting in a circle on bean bags.
A whiteboard behind them divided into three columns (Good / Challenge / Action).
The cat is writing on the board, the dog is nodding thoughtfully, the rabbit is pointing at an item.
Elements: warm lamp light, cup of tea, sticky notes floating gently, thought bubbles.
Color accents: blue (#4d9fff) for the board frame, green/yellow/red for column headers.
Soft, warm ambient glow. No text, no watermark.
Mood: reflective, warm, collaborative growth.
```

---

### 12. エンジニアタイプ: 安定運用型

**ファイル名**: `aqs_type_stable.webp`
**サイズ**: 512×512px
**用途**: ResultScreen TypeCard（🛡️ のフォールバック）

**AI 生成プロンプト**:

```
A square portrait illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A calm, reliable-looking cute cat knight holding a large sturdy shield with a green
gem in the center. Wearing neat, polished armor. Standing firmly on solid ground.
Behind: a stable, well-maintained server infrastructure glowing softly.
Floating elements: shield icons, stability graphs, small green check badges.
Primary color accent: green (#34d399) glow around the shield and character.
Circular composition centered for use as a round avatar.
Clean, bold outlines. No text, no watermark.
Mood: reliable, steady, trustworthy guardian.
```

---

### 13. エンジニアタイプ: 火消し職人

**ファイル名**: `aqs_type_firefighter.webp`
**サイズ**: 512×512px
**用途**: ResultScreen TypeCard（🔥 のフォールバック）

**AI 生成プロンプト**:

```
A square portrait illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A heroic cute cat wearing a firefighter coat and helmet, confidently dual-wielding
a fire extinguisher and a debugging tool (wrench). Flames being extinguished around them.
Behind: a dramatic scene of a server room with small controlled flames turning to steam.
Floating elements: flame-to-checkmark transitions, heroic sparkles, alarm bells silenced.
Primary color accent: orange (#fb923c) glow with red (#f06070) flame accents.
Circular composition centered for use as a round avatar.
Clean, bold outlines. No text, no watermark.
Mood: brave, capable, crisis hero with swagger.
```

---

### 14. エンジニアタイプ: 成長曲線型

**ファイル名**: `aqs_type_growth.webp`
**サイズ**: 512×512px
**用途**: ResultScreen TypeCard（📈 のフォールバック）

**AI 生成プロンプト**:

```
A square portrait illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute cat character climbing a steep upward-trending growth chart like a mountain.
Starting from a small, humble base and reaching toward a glowing peak. Wearing hiking gear
with a backpack. Expression shows determination turning to joy.
Behind: a gradient from dim to bright, representing progress over time.
Floating elements: small level-up arrows, experience point sparkles, milestone flags.
Primary color accent: yellow (#f0b040) glow along the growth curve.
Circular composition centered for use as a round avatar.
Clean, bold outlines. No text, no watermark.
Mood: determined, improving, inspiring growth journey.
```

---

### 15. エンジニアタイプ: 高速レスポンス

**ファイル名**: `aqs_type_speed.webp`
**サイズ**: 512×512px
**用途**: ResultScreen TypeCard（⚡ のフォールバック）

**AI 生成プロンプト**:

```
A square portrait illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute cat character in a dynamic running/dashing pose, surrounded by lightning bolts
and speed lines. Wearing futuristic goggles and a sleek tech suit.
Behind: a blurred background suggesting extreme speed, with quick-flash code snippets.
Floating elements: lightning bolts, stopwatch at fast time, blur trails, spark effects.
Primary color accent: purple (#a78bfa) glow with electric highlights.
Circular composition centered for use as a round avatar.
Clean, bold outlines. No text, no watermark.
Mood: lightning-fast, intuitive, exhilarating speed.
```

---

### 16. エンジニアタイプ: 技術的負債と共に生きる人

**ファイル名**: `aqs_type_debt.webp`
**サイズ**: 512×512px
**用途**: ResultScreen TypeCard（💀 のフォールバック）

**AI 生成プロンプト**:

```
A square portrait illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute cat character trudging forward with a comically large backpack overflowing
with tangled cables, legacy code scrolls, and TODO sticky notes. Despite the burden,
the character has a determined, slightly weary but undefeated expression.
Behind: a trail of scattered technical debt artifacts (deprecated signs, warning triangles).
Floating elements: chain links, weight symbols, small skull-and-crossbones badges (cute version).
Primary color accent: red (#f06070) glow around the debt artifacts.
Circular composition centered for use as a round avatar.
Clean, bold outlines. No text, no watermark.
Mood: resilient, burdened but pushing forward, dark humor.
```

---

### 17. エンジニアタイプ: 無難に回すエンジニア

**ファイル名**: `aqs_type_default.webp`
**サイズ**: 512×512px
**用途**: ResultScreen TypeCard（⚙️ のフォールバック）

**AI 生成プロンプト**:

```
A square portrait illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A calm, composed cute cat character in a comfortable hoodie, sitting at a clean desk
with a well-organized setup (one monitor, mechanical keyboard, tidy cables).
Methodically working with a steady pace. A small gear icon floating above their head.
Behind: a smooth, consistent progress bar and peaceful workspace.
Floating elements: small gear cogs, steady heartbeat line, routine arrows.
Primary color accent: muted blue-gray (#5e6e8a) with subtle blue (#4d9fff) highlights.
Circular composition centered for use as a round avatar.
Clean, bold outlines. No text, no watermark.
Mood: steady, reliable, quietly competent, zen-like calm.
```

---

### 18. グレード演出

**ファイル名**: `aqs_grade_celebration.webp`
**サイズ**: 512×512px
**用途**: ResultScreen GradeCircle の背景装飾

**AI 生成プロンプト**:

```
A square illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A celebratory scene — a large circular medal/badge frame in the center (empty center
for grade letter overlay). Surrounded by cute animal characters cheering and throwing confetti.
Ribbons, streamers, and firework sparkles radiating from the medal.
The medal frame has a golden-bronze metallic look with soft bevels.
Floating elements: stars, confetti pieces, small trophy icons, celebration sparkles.
Color accents: gold (#f0b040), with rainbow-lite highlights (green, blue, purple, orange).
Circular composition centered. No text, no watermark.
Mood: triumphant, celebratory, achievement unlocked.
```

---

### 19. ビルド成功

**ファイル名**: `aqs_build_success.webp`
**サイズ**: 1024×512px
**用途**: ResultScreen の BUILD SUCCESS 演出背景

**AI 生成プロンプト**:

```
A wide illustration in cute flat vector style on a dark blue (#060a12) background.
Scene: A deployment celebration — a cute cat engineer pressing a big green deploy button,
a rocket launching upward from a laptop screen, trailing sparkles and confetti.
Other animal characters cheering around. A large green checkmark forming in the sky.
Elements: rocket trails, version tag (v1.0.0 style badge without text), deployment pipeline
visualization showing all green stages.
Color accents: green (#34d399) dominant, with blue (#4d9fff) and orange (#fb923c) highlights.
Soft celebration glow. No text, no watermark.
Mood: triumphant, mission accomplished, team celebration.
```

---

### 20. フィードバック: 正解

**ファイル名**: `aqs_correct.webp`
**サイズ**: 512×512px
**用途**: QuizScreen ResultBanner の正解時アイコン

**AI 生成プロンプト**:

```
A square icon illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute cat character jumping with joy, arms raised in celebration.
A large green glowing checkmark behind them. Small confetti and sparkle particles around.
Expression: big happy eyes, wide smile, ears perked up.
Primary color accent: green (#34d399) glow radiating from the checkmark.
Circular composition centered for use as a banner icon.
Clean, bold outlines. No text, no watermark.
Mood: pure joy, correct answer celebration, instant gratification.
```

---

### 21. フィードバック: 不正解

**ファイル名**: `aqs_incorrect.webp`
**サイズ**: 512×512px
**用途**: QuizScreen ResultBanner の不正解時アイコン

**AI 生成プロンプト**:

```
A square icon illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute cat character with a slightly embarrassed/disappointed but encouraging expression.
Head tilted, one paw behind head in a "whoops" gesture. A soft red X mark behind them,
but with a small "try again" sparkle.
Expression: sympathetic eyes, small sheepish smile, not devastated.
Primary color accent: red (#f06070) glow from the X, but softened.
Circular composition centered for use as a banner icon.
Clean, bold outlines. No text, no watermark.
Mood: gentle disappointment, encouraging "that's okay", learning moment.
```

---

### 22. フィードバック: タイムアップ

**ファイル名**: `aqs_timeup.webp`
**サイズ**: 512×512px
**用途**: QuizScreen ResultBanner のタイムアップ時アイコン

**AI 生成プロンプト**:

```
A square icon illustration in cute flat vector style on a dark blue (#060a12) background.
Subject: A cute cat character looking up at a large hourglass/timer that has just run out.
Sand at the bottom, the cat reaching toward it with a "just missed it!" expression.
A clock face showing time expired behind them.
Expression: surprised, slightly panicked but still cute, wide eyes.
Primary color accent: yellow (#f0b040) glow from the hourglass/timer.
Circular composition centered for use as a banner icon.
Clean, bold outlines. No text, no watermark.
Mood: "almost made it!", time pressure, gentle urgency.
```

---

## コンポーネント統合仕様

### TitleScreen.tsx

**画像**: `aqs_title.webp`
**統合方法**: PageWrapper 内に absolute 配置の背景画像レイヤー

```tsx
// 背景画像レイヤー（ParticleEffect の後、Panel の前）
<div style={{
  position: 'absolute',
  inset: 0,
  backgroundImage: `url(${AQS_IMAGES.title})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: 0.15,
  filter: 'blur(2px)',
  pointerEvents: 'none',
}} />
```

**フォールバック**: 背景のため不要（画像がなくても既存の radial gradient が表示される）

---

### SprintStartScreen.tsx

**画像**: `aqs_sprint_start.webp`
**統合方法**: パネル上部に装飾画像として配置

```tsx
// Panel 内、スプリント番号の上に配置
<div style={{
  width: '100%',
  height: 120,
  backgroundImage: `url(${AQS_IMAGES.sprintStart})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: 0.3,
  borderRadius: 8,
  marginBottom: 16,
}} />
```

**フォールバック**: 背景装飾のため不要

---

### QuizScreen.tsx - イベントアイコン

**画像**: `aqs_event_{id}.webp`（8 枚）
**統合方法**: EventCard 内の EventIcon を画像に置換

```tsx
const [imgError, setImgError] = useState(false);
const eventImageSrc = AQS_IMAGES.events[event.id as keyof typeof AQS_IMAGES.events];

// EventIcon 内
{!imgError && eventImageSrc ? (
  <img
    src={eventImageSrc}
    alt={event.nm}
    onError={() => setImgError(true)}
    style={{
      width: 44,
      height: 44,
      borderRadius: '50%',
      objectFit: 'cover',
    }}
  />
) : (
  <EventIcon>{event.ic}</EventIcon>
)}
```

**フォールバック**: 絵文字アイコン（`event.ic`）にフォールバック

---

### QuizScreen.tsx - フィードバック画像

**画像**: `aqs_correct.webp`, `aqs_incorrect.webp`, `aqs_timeup.webp`
**統合方法**: ResultBanner 内にアイコン画像を追加

```tsx
const feedbackKey = selectedAnswer === -1 ? 'timeup' : selectedAnswer === quiz.a ? 'correct' : 'incorrect';
const feedbackSrc = AQS_IMAGES.feedback[feedbackKey];

// ResultBanner 内
<img
  src={feedbackSrc}
  alt=""
  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
  style={{
    width: 48,
    height: 48,
    borderRadius: '50%',
    objectFit: 'cover',
    marginBottom: 8,
  }}
/>
```

**フォールバック**: `display: none` で非表示にし、既存のテキスト表示を維持

---

### RetrospectiveScreen.tsx

**画像**: `aqs_retro.webp`
**統合方法**: PageWrapper 内に absolute 配置の背景画像レイヤー

```tsx
// 背景画像レイヤー
<div style={{
  position: 'absolute',
  inset: 0,
  backgroundImage: `url(${AQS_IMAGES.retro})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: 0.12,
  filter: 'blur(2px)',
  pointerEvents: 'none',
}} />
```

**フォールバック**: 背景のため不要

---

### ResultScreen.tsx - エンジニアタイプ

**画像**: `aqs_type_{id}.webp`（6 枚）
**統合方法**: TypeCard 内の TypeEmoji を画像に置換

```tsx
const [typeImgError, setTypeImgError] = useState(false);
const typeImageSrc = AQS_IMAGES.types[engineerType.id as keyof typeof AQS_IMAGES.types];

// TypeCard 内
{!typeImgError && typeImageSrc ? (
  <img
    src={typeImageSrc}
    alt={engineerType.n}
    onError={() => setTypeImgError(true)}
    style={{
      width: 80,
      height: 80,
      borderRadius: '50%',
      objectFit: 'cover',
      border: `3px solid ${engineerType.co}`,
    }}
  />
) : (
  <TypeEmoji>{engineerType.em}</TypeEmoji>
)}
```

**フォールバック**: 絵文字（`engineerType.em`）にフォールバック

**前提**: `EngineerType` に `id` フィールドを追加:

```typescript
// types.ts
export interface EngineerType {
  id: string;   // 追加
  n: string;
  em: string;
  co: string;
  d: string;
  c: (stats: ClassifyStats) => boolean;
}

// constants.ts - ENGINEER_TYPES に id を追加
{ id: 'stable', n: '安定運用型エンジニア', em: '🛡️', ... },
{ id: 'firefighter', n: '火消し職人エンジニア', em: '🔥', ... },
{ id: 'growth', n: '成長曲線型エンジニア', em: '📈', ... },
{ id: 'speed', n: '高速レスポンスエンジニア', em: '⚡', ... },
{ id: 'debt', n: '技術的負債と共に生きる人', em: '💀', ... },
{ id: 'default', n: '無難に回すエンジニア', em: '⚙️', ... },
```

---

### ResultScreen.tsx - グレード演出

**画像**: `aqs_grade_celebration.webp`
**統合方法**: GradeCircle の背後に演出画像を配置

```tsx
// GradeCircle の親コンテナに relative を設定
<div style={{ position: 'relative', display: 'inline-block' }}>
  <img
    src={AQS_IMAGES.gradeCelebration}
    alt=""
    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    style={{
      position: 'absolute',
      inset: -20,
      width: 'calc(100% + 40px)',
      height: 'calc(100% + 40px)',
      objectFit: 'contain',
      opacity: 0.3,
      pointerEvents: 'none',
    }}
  />
  <GradeCircle $color={grade.c}>{grade.g}</GradeCircle>
</div>
```

**フォールバック**: `display: none`（演出なしでグレード表示は維持）

---

### ResultScreen.tsx - ビルド成功

**画像**: `aqs_build_success.webp`
**統合方法**: BuildSuccess テキスト付近に装飾画像として配置

```tsx
<img
  src={AQS_IMAGES.buildSuccess}
  alt=""
  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
  style={{
    width: '100%',
    height: 60,
    objectFit: 'cover',
    opacity: 0.2,
    borderRadius: 4,
    marginBottom: 4,
  }}
/>
<BuildSuccess>BUILD SUCCESS</BuildSuccess>
```

**フォールバック**: `display: none`（テキスト表示は維持）
