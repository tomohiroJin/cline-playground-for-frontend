# 再生成が必要な 4 枚の画像指示書

> 前回のレビューで軽微な問題が検出された画像の再生成指示です。
> 共通スタイルは `asset-prompts.md` を参照してください。

---

## 1. riku-vs.png（リク VS 画像）

### 問題点
- Tシャツに「RUN」「16」のテキストが描き込まれている
- 服装がスポーツウェアになっている（制服が望ましい）

### 仕様
- **サイズ**: 256x512（1:2 縦長）
- **形式**: PNG
- **背景**: 単色の白 `#FFFFFF`（Claude Code で透過処理する）

### プロンプト
```
anime style portrait, yellow-haired boy, age 16, confident competitive smirk,
wearing dark school uniform with yellow accents and yellow tie,
dynamic forward-leaning pose, one hand raised,
yellow theme color #f39c12,
solid white background,
1:2 vertical aspect ratio,
no text, no letters, no numbers, no words on clothing
```

### 注意点
- 服にテキストやロゴを入れないこと（`no text, no letters, no numbers, no words on clothing` を明示）
- 制服（ダークブレザー + 黄色のネクタイ/アクセント）で統一すること（riku-normal.png と同じ服装）

---

## 2. shion-happy.png（シオン happy ポートレート）

### 問題点
- normal では眼鏡なしだが、happy で眼鏡が追加されている
- 同一キャラの表情違いで外見に差異があり、別キャラと誤認される恐れ

### 仕様
- **サイズ**: 512x1024（1:2 縦長）
- **形式**: PNG
- **背景**: 単色の薄いグレー `#E0E0E0`（シオンの髪色 #bdc3c7 が白に近いため）

### プロンプト
```
anime style portrait, silver-haired girl, age 16,
subtle interested smile, slightly raised eyebrow, curious expression,
no glasses,
dark school uniform with silver accents, school emblem on chest,
half body shot,
solid light gray background #E0E0E0,
1:2 vertical aspect ratio,
no text
```

### 注意点
- **眼鏡をつけないこと**（`no glasses` を明示）
- shion-normal.png と同じ髪型・服装・外見を維持し、**表情のみ変える**こと
- 背景は白ではなく **薄いグレー #E0E0E0**（髪色とのコントラスト確保）

---

## 3. bg-tournament.webp（大会会場背景）

### 問題点
- 「AIR HOCKEY TOURNAMENT」「REGIONAL CHAMPIONSHIPS」「FINAL MATCH」等の英語テキストが多数描き込まれている
- ゲーム中はダイアログや VS 画面が重なるが、ステージ選択画面では直接見えるためテキストが邪魔になる

### 仕様
- **サイズ**: 450x900（1:2 縦長）
- **形式**: WebP（Claude Code で PNG → WebP に変換する）
- **背景**: 透過不要（そのまま使用）

### プロンプト
```
anime style interior illustration,
large school gymnasium converted to air hockey tournament venue,
multiple air hockey tables on wooden gym floor,
colorful pennant banners hanging from ceiling without any text,
electronic scoreboard showing only numbers,
crowd silhouettes cheering in the stands,
dramatic warm golden lighting from overhead lights,
vertical composition 1:2 aspect ratio,
no text, no words, no letters, no signs with writing,
atmospheric and detailed background art
```

### 注意点
- **テキストを一切入れないこと**（`no text, no words, no letters, no signs with writing` を明示）
- バナーや看板は色彩のみで表現し、文字は描かないこと
- スコアボードは数字のみ（読めない程度の小ささ）で OK
- 縦長構成（1:2）を厳守。既存の bg-gym.webp と同じアスペクト比

---

## 4. victory-ch2.png（Chapter 2 勝利カットイン）

### 問題点
- 「CONGRATULATIONS TO THE WINNERS!」等の英語テキストが描き込まれている
- VictoryCutIn コンポーネントが日本語テキストを別途表示するため、画像内テキストと重複して混乱する

### 仕様
- **サイズ**: 既存の victory-ch1.png と同じサイズ（要確認後リサイズ）
- **形式**: PNG
- **背景**: 透過不要（カットイン全面表示）

### プロンプト
```
anime style celebration illustration,
air hockey tournament victory scene,
golden trophy held up high by a team of high school students,
gold and white confetti falling,
warm golden lighting with lens flare effects,
gymnasium background blurred,
joyful triumphant atmosphere,
no text, no words, no letters, no banners with writing,
wide composition
```

### 注意点
- **テキストを一切入れないこと**（`no text, no words, no letters, no banners with writing` を明示）
- テキスト（「地区大会 優勝！」等）はアプリ側で表示するため、画像には含めない
- トロフィー + 紙吹雪 + ゴールド照明で「優勝の瞬間」を表現
- 既存の victory-ch1.png のサイズを確認して合わせる（現在 450x400 で生成済み）

---

## 後処理手順（Claude Code で実施）

```bash
# 1. riku-vs: 白背景透過 + リサイズ
convert riku-vs.png -fuzz 10% -transparent white -resize 256x512! riku-vs-final.png

# 2. shion-happy: グレー背景透過 + リサイズ
convert shion-happy.png -fuzz 15% -transparent '#E0E0E0' -resize 512x1024! shion-happy-final.png

# 3. bg-tournament: PNG → WebP 変換（リサイズ + 形式変換）
convert bg-tournament.png -resize 450x900! bg-tournament.webp

# 4. victory-ch2: サイズ確認 + 必要に応じてリサイズ
identify public/assets/cutins/victory-ch1.png  # サイズ確認
convert victory-ch2.png -resize <同サイズ>! victory-ch2-final.png
```
