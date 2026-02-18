# 原始進化録 (PRIMAL PATH) - 画像仕様書

## スタイルガイド

### 統一スタイル

全画像は以下の統一スタイルで制作する:

- **画風**: ピクセルアート風 × 原始時代ダークファンタジー
- **タッチ**: ドット絵調の太い輪郭、レトロゲーム的な質感
- **キャラクター**: 原始人の部族戦士（槍、骨装備、毛皮の衣装）
- **色調**: ダーク背景（#0a0a12〜#1c1c2c）に映える鮮やかなアクセントカラー
- **照明**: 焚き火やマグマの暖色光源、儀式の紫光、洞窟の奥からの光
- **テーマ**: 原始文明の進化（技術・生活・儀式の三大文明）
- **雰囲気**: 神秘的で荒々しい原始の世界、進化と覚醒のロマン
- **禁則**: テキスト、ウォーターマーク、署名は含めない

### カラーパレット参照

画像のアクセントカラーはゲーム内カラーパレットと統一:

| 色名 | コード | 用途 |
|---|---|---|
| 技術 (orange) | `#f08050` | 技術文明、ATK系 |
| 生活 (green) | `#50e090` | 生活文明、HP/回復系 |
| 儀式 (purple) | `#d060ff` | 儀式文明、覚醒系 |
| 調和 (gold) | `#e0c060` | バランス、特殊進化 |
| 骨 (yellow) | `#f0c040` | 通貨（骨）、報酬 |
| 氷河 (cyan) | `#40c0f0` | 氷河バイオーム |
| 火山 (red) | `#f05050` | 火山バイオーム、ダメージ |
| 草原 (lime) | `#90e060` | 草原バイオーム |

### 画像フォーマット

- **形式**: WebP（品質 82%）
- **サイズ上限**: 300KB / 枚
- **配置先**: `src/assets/images/`
- **命名規則**: `primal_path_{category}.webp`

---

## 画像仕様（全 1 枚）

### 1. カード背景（メニュー画像）

**ファイル名**: `primal_path_card_bg.webp`
**サイズ**: 1024×1024px
**用途**: GameListPage のゲームカード背景画像（`background-size: cover`, 表示高さ 220px）

**AI 生成プロンプト**:

```
A square pixel art style illustration on a dark background (#0a0a12).
Scene: A dramatic primal fantasy landscape. In the center, a silhouette of a tribal warrior
holding a bone spear, standing before a massive bonfire. The fire casts warm orange-gold (#f0c040)
light upward. Around the warrior, three glowing pillars of civilization rise:
left pillar glows orange (#f08050) with gear/tool motifs (technology),
center pillar glows green (#50e090) with leaf/heart motifs (life),
right pillar glows purple (#d060ff) with skull/star motifs (ritual).
The ground is cracked earth with scattered bones and primitive stone tools.
Background: a dark cave opening with faint starlight above, cave wall paintings visible.
Floating particles of ember and mystical energy.
Style: chunky pixel art with visible pixels, retro game aesthetic, 16-32 bit era feel.
Color accents: gold (#f0c040), orange (#f08050), green (#50e090), purple (#d060ff).
Dramatic lighting from the bonfire. No text, no watermark.
Mood: ancient mystery, evolution, primal power awakening.
```

---

## 実装手順

画像生成後、以下の手順で適用する:

### 1. 画像配置

生成した画像を WebP 形式（品質 82%）で以下に配置:

```
src/assets/images/primal_path_card_bg.webp
```

### 2. GameListPage.tsx の変更

```typescript
// import 追加
import primalPathCardBg from '../assets/images/primal_path_card_bg.webp';

// CardImageArea の props を変更
// Before:
<CardImageArea
  $customBg="linear-gradient(135deg, #0a0a12 0%, #1c1c2c 40%, #f0c04030 100%)"
  ...
/>

// After:
<CardImageArea
  $bgImage={primalPathCardBg}
  ...
/>
```

### 3. 確認事項

- カード上での表示が適切であること（`background-size: cover`, 高さ 220px でクリッピング）
- ファイルサイズが 300KB 以下であること
- ホバー時のグロー効果と画像の調和
