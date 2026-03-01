"""迷宮の残響 — 画像透過処理スクリプト

3種類の透過処理を実行:
1. 楕円グラデーションマスク（オーバーレイ用 × 5枚）
2. 矩形ビネットマスク（near レイヤー用 × 5枚）
3. 輝度ベースアルファ（タイトル中景 × 1枚）
"""

import math
import os
import sys

from PIL import Image, ImageFilter

# プロジェクトルートからの相対パス
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "..", ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, "src", "assets", "images")

# 出力品質
WEBP_QUALITY = 82


# --- 楕円グラデーションマスク ---

OVERLAY_FILES = [
    "le_overlay_injured.webp",
    "le_overlay_bleeding.webp",
    "le_overlay_fear.webp",
    "le_overlay_curse.webp",
    "le_overlay_confused.webp",
]

# 中央28%は完全透明、外側62%から完全不透明
OVERLAY_INNER_RADIUS = 0.28
OVERLAY_OUTER_RADIUS = 0.62


def apply_elliptical_mask(img: Image.Image) -> Image.Image:
    """楕円グラデーションマスクを適用する。

    中央を透明にし、端のエフェクトを残す。
    コサイン補間で滑らかなフェードを実現。
    """
    img = img.convert("RGBA")
    width, height = img.size
    cx, cy = width / 2, height / 2

    # アルファチャネルを操作
    pixels = img.load()
    for y in range(height):
        for x in range(width):
            # 楕円距離（正規化）
            dx = (x - cx) / cx
            dy = (y - cy) / cy
            d = math.sqrt(dx * dx + dy * dy)

            if d < OVERLAY_INNER_RADIUS:
                alpha = 0
            elif d > OVERLAY_OUTER_RADIUS:
                alpha = 255
            else:
                # コサイン補間
                t = (d - OVERLAY_INNER_RADIUS) / (
                    OVERLAY_OUTER_RADIUS - OVERLAY_INNER_RADIUS
                )
                alpha = int((1 - math.cos(math.pi * t)) / 2 * 255)

            r, g, b, a = pixels[x, y]
            # 既存のアルファと合成
            pixels[x, y] = (r, g, b, min(a, alpha))

    return img


# --- 矩形ビネットマスク ---

NEAR_FILES = [
    "le_bg_1_near.webp",
    "le_bg_2_near.webp",
    "le_bg_3_near.webp",
    "le_bg_4_near.webp",
    "le_bg_5_near.webp",
]

# 中央50%が透明領域、フェード幅22%
NEAR_INNER_RATIO = 0.50
NEAR_FEATHER = 0.22
NEAR_CORNER_BOOST = 1.3


def apply_rect_vignette_mask(img: Image.Image) -> Image.Image:
    """矩形ビネットマスクを適用する。

    フレーム的な効果。中央を透明にし、端にシーン要素を残す。
    四隅は不透明度を強化。
    """
    img = img.convert("RGBA")
    width, height = img.size

    # 矩形の内側境界
    inner_left = width * (1 - NEAR_INNER_RATIO) / 2
    inner_right = width - inner_left
    inner_top = height * (1 - NEAR_INNER_RATIO) / 2
    inner_bottom = height - inner_top

    # フェード幅（ピクセル単位）
    feather_x = width * NEAR_FEATHER
    feather_y = height * NEAR_FEATHER

    pixels = img.load()
    for y in range(height):
        for x in range(width):
            # X方向の距離（内側矩形の端からの距離）
            if x < inner_left:
                fx = (inner_left - x) / feather_x
            elif x > inner_right:
                fx = (x - inner_right) / feather_x
            else:
                fx = 0.0

            # Y方向の距離
            if y < inner_top:
                fy = (inner_top - y) / feather_y
            elif y > inner_bottom:
                fy = (y - inner_bottom) / feather_y
            else:
                fy = 0.0

            # 四隅ブースト
            corner_factor = 1.0
            if fx > 0 and fy > 0:
                corner_factor = NEAR_CORNER_BOOST

            # 合成距離
            d = max(fx, fy) * corner_factor
            d = min(d, 1.0)

            if d <= 0:
                alpha = 0
            elif d >= 1.0:
                alpha = 255
            else:
                # コサイン補間
                alpha = int((1 - math.cos(math.pi * d)) / 2 * 255)

            r, g, b, a = pixels[x, y]
            pixels[x, y] = (r, g, b, min(a, alpha))

    return img


# --- 輝度ベースアルファ ---

TITLE_MID_FILE = "le_title_mid.webp"
LUMINANCE_DARK_THRESHOLD = 25
LUMINANCE_BRIGHT_THRESHOLD = 55
LUMINANCE_BLUR_RADIUS = 2


def apply_luminance_alpha(img: Image.Image) -> Image.Image:
    """輝度ベースのアルファチャネルを適用する。

    暗い部分を透明にし、明るい構造物を残す。
    アルファチャネルにガウシアンブラーを適用してジャギーを低減。
    """
    img = img.convert("RGBA")
    width, height = img.size

    # 輝度からアルファマスクを作成
    alpha_mask = Image.new("L", (width, height))
    src_pixels = img.load()
    mask_pixels = alpha_mask.load()

    for y in range(height):
        for x in range(width):
            r, g, b, _a = src_pixels[x, y]
            # ITU-R BT.601 輝度
            luminance = 0.299 * r + 0.587 * g + 0.114 * b

            if luminance <= LUMINANCE_DARK_THRESHOLD:
                alpha = 0
            elif luminance >= LUMINANCE_BRIGHT_THRESHOLD:
                alpha = 255
            else:
                # 線形補間
                t = (luminance - LUMINANCE_DARK_THRESHOLD) / (
                    LUMINANCE_BRIGHT_THRESHOLD - LUMINANCE_DARK_THRESHOLD
                )
                alpha = int(t * 255)

            mask_pixels[x, y] = alpha

    # ガウシアンブラーでジャギー低減
    alpha_mask = alpha_mask.filter(
        ImageFilter.GaussianBlur(radius=LUMINANCE_BLUR_RADIUS)
    )

    # アルファチャネルを適用
    img.putalpha(alpha_mask)
    return img


# --- メイン処理 ---


def process_file(filepath: str, processor, label: str) -> bool:
    """1枚の画像を処理して上書き保存する。"""
    if not os.path.exists(filepath):
        print(f"  [スキップ] {os.path.basename(filepath)} — ファイルが見つかりません")
        return False

    original_size = os.path.getsize(filepath)
    img = Image.open(filepath)
    original_dimensions = img.size

    # 処理実行
    result = processor(img)

    # WebP で保存（アルファチャネル付き）
    result.save(filepath, "WEBP", quality=WEBP_QUALITY)
    new_size = os.path.getsize(filepath)

    ratio = new_size / original_size * 100 if original_size > 0 else 0
    print(
        f"  [完了] {os.path.basename(filepath)} "
        f"({original_dimensions[0]}x{original_dimensions[1]}) "
        f"— {original_size // 1024}KB → {new_size // 1024}KB ({ratio:.0f}%)"
    )
    return True


def main() -> None:
    """全画像の透過処理を実行する。"""
    print("=" * 60)
    print("迷宮の残響 — 画像透過処理")
    print("=" * 60)

    success_count = 0
    total_count = 0

    # 1. オーバーレイ画像（楕円グラデーションマスク）
    print("\n--- オーバーレイ画像（楕円グラデーションマスク）---")
    for filename in OVERLAY_FILES:
        total_count += 1
        filepath = os.path.join(IMAGES_DIR, filename)
        if process_file(filepath, apply_elliptical_mask, "楕円マスク"):
            success_count += 1

    # 2. 近景レイヤー画像（矩形ビネットマスク）
    print("\n--- 近景レイヤー画像（矩形ビネットマスク）---")
    for filename in NEAR_FILES:
        total_count += 1
        filepath = os.path.join(IMAGES_DIR, filename)
        if process_file(filepath, apply_rect_vignette_mask, "矩形ビネット"):
            success_count += 1

    # 3. タイトル中景（輝度ベースアルファ）
    print("\n--- タイトル中景（輝度ベースアルファ）---")
    total_count += 1
    filepath = os.path.join(IMAGES_DIR, TITLE_MID_FILE)
    if process_file(filepath, apply_luminance_alpha, "輝度ベース"):
        success_count += 1

    # 結果サマリー
    print("\n" + "=" * 60)
    print(f"処理完了: {success_count}/{total_count} 枚")
    if success_count < total_count:
        print(f"  スキップ: {total_count - success_count} 枚")
        sys.exit(1)
    print("=" * 60)


if __name__ == "__main__":
    main()
