# FB-5: 新キャラ アイコン デフォルメ化指示書

> ユーザーフィードバック FB-5: 新キャラ（カナタ・リク・シオン）のアイコンが他キャラと違いデフォルメ化されておらず、丸い白枠もない
> 親計画: `.docs/ah-20260404-01/feedback-20260408.md`

---

## 問題

現在の `kanata.png` `riku.png` `shion.png` (128x128) は **普通の頭身のバストアップ** をそのまま縮小しただけで、既存キャラと統一感がない。

`CharacterAvatar` コンポーネントが `borderRadius: 50%` で円形マスクをかけるため、肩や体が枠外にはみ出して見えない。

## 既存キャラのアイコン特徴

`akira.png` `hiro.png` `misaki.png` 等を分析した結果、共通パターンは以下:

1. **チビキャラ デフォルメ**（2-3 頭身、頭が大きく体が小さい）
2. **スポーツユニフォーム**（白 or テーマカラーのシャツ）
3. **笑顔 or キャラ性のある表情**
4. **頭〜胸の構図**（円形マスクに収まる）
5. **白背景 → 透過済み**
6. **中央配置**（円形マスクで切れない）

## 対象画像

- `public/assets/characters/kanata.png`
- `public/assets/characters/riku.png`
- `public/assets/characters/shion.png`

## 仕様

- **サイズ**: 128x128 PNG RGBA
- **生成時のサイズ**: 1024x1024 で生成 → 後処理で 128x128 にリサイズ
- **背景**: ピンク `#FFC0CB`（透過対策）
- **キャラの占有率**: 円形マスク（直径 128px）に収まる範囲で 80% 程度

---

## 1. kanata.png（カナタ）

- **保存先**: `public/assets/characters/kanata.png`

### プロンプト
```
chibi anime style character icon, 2-3 head body proportions,
teal-haired boy, age 16, mischievous wink and grin,
wearing teal colored v-neck sports jersey with white trim,
bust shot from chest up, character centered in frame,
character fills 70% of the frame leaving margin around edges,
solid bright pink background #FFC0CB,
1:1 square format,
no text, no decorations,
similar style to existing chibi character icons in the game
```

### キャラ性
- ティール髪の少年、いたずらっぽい表情
- ティーミング Vネックスポーツシャツ
- 性格: トリックスター、飄々

---

## 2. riku.png（リク）

- **保存先**: `public/assets/characters/riku.png`

### プロンプト
```
chibi anime style character icon, 2-3 head body proportions,
yellow-haired boy, age 16, energetic confident grin showing teeth,
wearing yellow colored v-neck sports jersey with dark trim,
bust shot from chest up, character centered in frame,
character fills 70% of the frame leaving margin around edges,
solid bright pink background #FFC0CB,
1:1 square format,
no text, no decorations,
similar style to existing chibi character icons in the game
```

### キャラ性
- 金髪の少年、エネルギッシュ
- 黄色 V ネックスポーツシャツ
- 性格: スピードスター、自信家

---

## 3. shion.png(シオン）

- **保存先**: `public/assets/characters/shion.png`

### プロンプト
```
chibi anime style character icon, 2-3 head body proportions,
silver-haired girl, age 16, calm composed expression with slight smile,
wearing dark navy v-neck sports jersey with silver-gray trim,
bust shot from chest up, character centered in frame,
character fills 70% of the frame leaving margin around edges,
solid bright pink background #FFC0CB,
1:1 square format,
no text, no decorations,
similar style to existing chibi character icons in the game
```

### キャラ性
- シルバー髪の少女、冷静
- ダークネイビー V ネックスポーツシャツ（髪色との対比）
- 性格: アナライザー、観察者

### シオン専用の注意
- 髪色がシルバー（白に近い）のため、**服を必ずダークネイビー** にする
- 背景ピンクとシルバー髪の対比でピクセル分離が容易

---

## 後処理（Claude Code 側で実施）

```bash
SRC=".docs/ah-20260404-01/作成画像"

for name in kanata riku shion; do
  # Step 1: ピンク背景透過
  convert "$SRC/${name}.png" \
    -alpha set -fuzz 15% -fill none \
    -draw "matte 0,0 floodfill" \
    -draw "matte 1023,0 floodfill" \
    -draw "matte 0,1023 floodfill" \
    -draw "matte 1023,1023 floodfill" \
    -draw "matte 1023,300 floodfill" \
    -draw "matte 1023,500 floodfill" \
    -draw "matte 1023,700 floodfill" \
    -draw "matte 0,300 floodfill" \
    -draw "matte 0,500 floodfill" \
    -draw "matte 0,700 floodfill" \
    PNG32:"/tmp/_${name}_trans.png"

  # Step 2: 128x128 にリサイズ
  convert "/tmp/_${name}_trans.png" \
    -resize 128x128 \
    PNG32:"public/assets/characters/${name}.png"

  echo "${name}: $(identify public/assets/characters/${name}.png 2>&1 | awk '{print $2,$3}')"
done
```

---

## 参考画像

AI 画像生成ツールが img2img に対応している場合、以下の既存画像を参考画像として渡すと精度が上がる:

- `public/assets/characters/akira.png` — 標準的なデフォルメスタイル
- `public/assets/characters/hiro.png` — 男子キャラの参考
- `public/assets/characters/misaki.png` — 女子キャラの参考（シオン用）

---

## 生成後のチェックリスト

- [ ] チビキャラ デフォルメ（2-3 頭身）になっている
- [ ] バストアップで頭〜胸の構図
- [ ] キャラが画面中央に配置されている
- [ ] 余白が画面の 30% 程度ある（円形マスク用）
- [ ] 背景がピンク #FFC0CB の単色である
- [ ] テキスト・装飾エフェクトが含まれていない

## 後処理後のチェックリスト

- [ ] 128x128 PNG RGBA 形式
- [ ] 円形マスク（borderRadius: 50%）をかけても顔・体が見える
- [ ] 既存アイコン（akira/hiro 等）と並べて違和感がない
- [ ] ピンクのフリンジが残っていない

---

## FB-4 との関係

カナタの **アイコン (`kanata.png`)** はこのファイル（FB-5）で対応する。
カナタの **ポートレート / VS 画像** は `asset-prompts-fb4-kanata-fix.md` で対応する。

両方の指示書を AI 画像生成ツールに渡すこと。
