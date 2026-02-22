# AQS ブラッシュアップ仕様書

## Part 1: キャラクタープロフィールデータ仕様

### CharacterProfile インターフェース

```typescript
export interface CharacterProfile {
  id: string;
  name: string;
  animal: string;
  role: string;
  color: string;
  emoji: string;
  personality: string;
  skills: string[];
  catchphrase: string;
  trivia: string;
}
```

### キャラクターデータ

#### 猫エンジニア ネコ (neko)

| 項目 | 値 |
|------|-----|
| ID | `neko` |
| 名前 | ネコ |
| 動物 | オレンジ三毛猫 |
| 役職 | フルスタックエンジニア |
| テーマカラー | `COLORS.accent` (#4d9fff) |
| 絵文字 | 🐱 |
| 性格 | 好奇心旺盛で新技術に飛びつく。夜型で深夜にコードが冴える。気まぐれだがハマると集中力がすごい。 |
| スキル | TypeScript, React, Node.js, 設計原則, リファクタリング |
| 決め台詞 | 「にゃるほど、こう書けばキレイに動くにゃ！」 |
| トリビア | キーボードの上で寝るのが好き。お気に入りのエディタは VS Code（猫テーマ）。 |

#### 犬PM イヌ (inu)

| 項目 | 値 |
|------|-----|
| ID | `inu` |
| 名前 | イヌ |
| 動物 | ビーグル犬 |
| 役職 | PO / スクラムマスター |
| テーマカラー | `COLORS.green` (#34d399) |
| 絵文字 | 🐶 |
| 性格 | 忠実で責任感が強い。チームの雰囲気を常に気にかける。おやつ（進捗）が大好き。 |
| スキル | スクラム運営, バックログ管理, ファシリテーション, 見積もり, ステークホルダー調整 |
| 決め台詞 | 「よし、今日のデイリーは15分で終わらせるワン！」 |
| トリビア | 毎朝のデイリースクラムには必ず5分前に着席。手帳型のバックログを常に携帯。 |

#### うさぎテスター ウサギ (usagi)

| 項目 | 値 |
|------|-----|
| ID | `usagi` |
| 名前 | ウサギ |
| 動物 | 白うさぎ |
| 役職 | QAエンジニア |
| テーマカラー | `COLORS.cyan` (#22d3ee) |
| 絵文字 | 🐰 |
| 性格 | 慎重で細部に目が行く。バグを見つけると耳がピンと立つ。静かだが鋭い指摘をする。 |
| スキル | テスト設計, 自動テスト, CI/CD, バグ分析, 品質メトリクス |
| 決め台詞 | 「このエッジケース、見逃してないぴょん？」 |
| トリビア | テスト自動化率100%が夢。人参ジュースを飲みながらテストケースを書く。 |

---

## Part 2: 画像生成プロンプト（別AI向け・分離実行可能）

### 共通スタイルガイド

- **画風**: フラットデザイン × かわいい（カワイイ）イラスト
- **タッチ**: クリーンなベクター調、丸みを帯びた柔らかいライン
- **背景**: ダークブルー (#060a12〜#0c1220) にネオンアクセントカラー
- **禁則**: テキスト、ウォーターマーク、署名は含めない
- **フォーマット**: WebP（品質82%）、各300KB以下

### 画像一覧

#### 1. aqs_char_neko.webp (512x512)

**用途**: 猫エンジニアのポートレート

**プロンプト**:
> Cute flat-design vector illustration of an orange tabby cat character as a full-stack engineer.
> The cat wears a hoodie and headphones around neck, sitting at a glowing monitor with code on screen.
> Dark navy blue background (#060a12) with bright blue (#4d9fff) neon accents and subtle glow effects.
> Kawaii style, rounded soft lines, no text or watermarks.

#### 2. aqs_char_inu.webp (512x512)

**用途**: 犬PMのポートレート

**プロンプト**:
> Cute flat-design vector illustration of a beagle dog character as a scrum master / product owner.
> The dog wears a neat shirt and holds a clipboard with sticky notes. Kanban board in background.
> Dark navy blue background (#060a12) with bright green (#34d399) neon accents and subtle glow effects.
> Kawaii style, rounded soft lines, no text or watermarks.

#### 3. aqs_char_usagi.webp (512x512)

**用途**: うさぎテスターのポートレート

**プロンプト**:
> Cute flat-design vector illustration of a white rabbit character as a QA engineer / tester.
> The rabbit wears glasses and a lab coat, examining a magnifying glass over a bug icon.
> Dark navy blue background (#060a12) with bright cyan (#22d3ee) neon accents and subtle glow effects.
> Kawaii style, rounded soft lines, no text or watermarks.

#### 4. aqs_char_team.webp (1024x512)

**用途**: チームバナー（3キャラ集合）

**プロンプト**:
> Wide banner illustration of three cute animal characters working together in an agile team.
> Left: orange tabby cat engineer at computer. Center: beagle dog scrum master with board.
> Right: white rabbit tester with magnifying glass. All in kawaii flat-design style.
> Dark navy blue background with colorful neon accents (blue, green, cyan).
> Rounded soft lines, no text or watermarks. Team collaboration atmosphere.

#### 5. aqs_char_group.webp (512x512)

**用途**: コンパクトグループ画像

**プロンプト**:
> Compact group illustration of three cute animal characters: orange tabby cat, beagle dog, and white rabbit.
> Standing together as a team, kawaii flat-design style.
> Dark navy blue background (#060a12) with multicolor neon accents.
> Rounded soft lines, no text or watermarks.

### 配置先

`src/assets/images/` に配置。`images.ts` の `characters` キーでインポート管理。

---

## Part 3: カスタムスクロール仕様

### CSS 仕様

#### WebKit (Chrome, Safari, Edge)

```css
&::-webkit-scrollbar {
  width: 6px;
}
&::-webkit-scrollbar-track {
  background: transparent;
}
&::-webkit-scrollbar-thumb {
  background: COLORS.border2;  /* #263050 */
  border-radius: 3px;
}
&::-webkit-scrollbar-thumb:hover {
  background: COLORS.accent + '66';  /* #4d9fff40% */
}
```

#### Firefox

```css
scrollbar-width: thin;
scrollbar-color: COLORS.border2 transparent;
```

### 適用対象画面

| 画面 | コンポーネント | 適用方法 |
|------|---------------|---------|
| GuideScreen | `ScrollablePanel` | `Panel` → `ScrollablePanel` 置換 |
| ResultScreen | `ScrollablePanel` | `Panel` → `ScrollablePanel` 置換 |
| StudyResultScreen | `ScrollablePanel` | `Panel` → `ScrollablePanel` 置換 |

### ScrollablePanel 仕様

- `Panel` を継承（extends）
- `overflow-y: auto`
- `max-height: 90vh`
- `aqsScrollbar` ミックスイン適用
