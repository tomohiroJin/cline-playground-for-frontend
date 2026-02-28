# Antigravity 再生成仕様

## 再生成対象（3枚）

透過処理後も品質不足が予想される画像。

### 共通指示

- 「透過にしたい部分は完全な黒 `#000000` で塗る」こと
- ゲームUIやテキストを一切含めないこと
- 市松模様（チェッカーボードパターン）を描画しないこと
- 画像サイズ: 1024x1024

---

### 1. `le_overlay_injured.webp` — 負傷オーバーレイ

**完成イメージ:**
画面の端（上下左右）にひび割れと血のしたたりのエフェクト。中央部分は完全な黒（#000000）で塗りつぶし。

**Antigravity プロンプト:**
```
A dark damage overlay effect for a dungeon game. The edges of the image show cracked stone, blood splatters, and scratches radiating inward from all four sides. The center area (about 60% of the image) is filled with pure solid black (#000000). No text, no UI elements, no checkerboard pattern. Dark fantasy style with red and dark brown tones on the edges. Square format 1024x1024.
```

**禁止事項:**
- 市松模様の描画
- テキストやUI要素
- 中央部にオブジェクトを配置

---

### 2. `le_overlay_fear.webp` — 恐怖オーバーレイ

**完成イメージ:**
画面の端に紫色の霧と不気味な木の枝のシルエット。中央部分は完全な黒。

**Antigravity プロンプト:**
```
A fear overlay effect for a dark fantasy dungeon game. Purple and dark violet fog creeping in from all edges. Twisted dead tree branches and thorny vines silhouetted along the borders. The center area (about 60% of the image) is filled with pure solid black (#000000). No text, no UI elements, no game screenshots. Eerie purple and black color scheme. Square format 1024x1024.
```

**禁止事項:**
- 「FEAR」等のテキスト
- ゲームUIやスクリーンショット
- 中央部にオブジェクトを配置

---

### 3. `le_overlay_confused.webp` — 混乱オーバーレイ

**完成イメージ:**
画面の端に渦巻く紫とピンクの光のエフェクト、歪んだ幾何学模様。中央部分は完全な黒。

**Antigravity プロンプト:**
```
A confusion overlay effect for a dark fantasy dungeon game. Swirling purple and pink magical energy spirals along all edges. Distorted geometric patterns and floating arcane symbols on the borders. The center area (about 60% of the image) is filled with pure solid black (#000000). No text, no UI elements, no game screenshots, no health bars. Psychedelic purple and magenta tones on edges only. Square format 1024x1024.
```

**禁止事項:**
- ゲームUIやヘルスバー
- ゲームスクリーンショット
- 中央部にオブジェクトを配置

---

## 再生成後の処理

再生成した画像は `process_images.py` で再処理する：
```bash
python3 process_images.py
```

黒い中央部が `#000000` であれば、輝度ベースの追加処理で自然な透過が得られる。
ただし基本的には楕円グラデーションマスクで処理するため、中央が黒であれば自動的に透明になる。
