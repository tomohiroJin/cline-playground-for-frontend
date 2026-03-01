"""迷宮の残響 — 画像透過処理検証スクリプト

処理結果を自動検証:
- アルファチャネル存在チェック
- 中央領域の透明率
- 端領域の不透明率
- ファイルサイズ妥当性
- 形式検証
"""

import os
import sys

from PIL import Image

# プロジェクトルートからの相対パス
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "..", ".."))
IMAGES_DIR = os.path.join(PROJECT_ROOT, "src", "assets", "images")

# 検証対象
OVERLAY_FILES = [
    "le_overlay_injured.webp",
    "le_overlay_bleeding.webp",
    "le_overlay_fear.webp",
    "le_overlay_curse.webp",
    "le_overlay_confused.webp",
]

NEAR_FILES = [
    "le_bg_1_near.webp",
    "le_bg_2_near.webp",
    "le_bg_3_near.webp",
    "le_bg_4_near.webp",
    "le_bg_5_near.webp",
]

TITLE_MID_FILE = "le_title_mid.webp"


def get_region_alpha_stats(
    img: Image.Image,
    x1: int,
    y1: int,
    x2: int,
    y2: int,
) -> dict:
    """指定領域のアルファチャネル統計を計算する。"""
    pixels = img.load()
    total = 0
    transparent_count = 0  # alpha < 32
    opaque_count = 0  # alpha > 224

    for y in range(y1, y2):
        for x in range(x1, x2):
            _r, _g, _b, a = pixels[x, y]
            total += 1
            if a < 32:
                transparent_count += 1
            if a > 224:
                opaque_count += 1

    return {
        "total": total,
        "transparent_count": transparent_count,
        "opaque_count": opaque_count,
        "transparent_ratio": transparent_count / total if total > 0 else 0,
        "opaque_ratio": opaque_count / total if total > 0 else 0,
    }


def verify_image(
    filepath: str,
    category: str,
    center_transparent_min: float,
    edge_opaque_min: float,
) -> list[str]:
    """1枚の画像を検証し、問題点のリストを返す。"""
    issues: list[str] = []
    filename = os.path.basename(filepath)

    if not os.path.exists(filepath):
        issues.append(f"ファイルが見つかりません: {filename}")
        return issues

    # ファイルサイズチェック
    file_size = os.path.getsize(filepath)
    if file_size < 1024:
        issues.append(f"ファイルサイズが小さすぎます: {file_size} bytes")

    # 画像読み込みと形式チェック
    img = Image.open(filepath)
    if img.format != "WEBP":
        issues.append(f"形式が WEBP ではありません: {img.format}")

    # アルファチャネル存在チェック
    if img.mode != "RGBA":
        issues.append(f"アルファチャネルがありません (mode={img.mode})")
        return issues

    width, height = img.size

    # 中央領域の透明率チェック
    center_margin_x = int(width * 0.35)
    center_margin_y = int(height * 0.35)
    center_stats = get_region_alpha_stats(
        img,
        center_margin_x,
        center_margin_y,
        width - center_margin_x,
        height - center_margin_y,
    )

    if center_stats["transparent_ratio"] < center_transparent_min:
        issues.append(
            f"中央の透明率が不足: {center_stats['transparent_ratio']:.1%} "
            f"(最低 {center_transparent_min:.0%} 必要)"
        )

    # 端領域の不透明率チェック（上端10%）
    edge_height = max(int(height * 0.10), 1)
    top_stats = get_region_alpha_stats(img, 0, 0, width, edge_height)
    if top_stats["opaque_ratio"] < edge_opaque_min:
        issues.append(
            f"上端の不透明率が不足: {top_stats['opaque_ratio']:.1%} "
            f"(最低 {edge_opaque_min:.0%} 必要)"
        )

    return issues


def main() -> None:
    """全画像の検証を実行する。"""
    print("=" * 60)
    print("迷宮の残響 — 画像透過処理検証")
    print("=" * 60)

    all_pass = True
    total = 0
    passed = 0

    # オーバーレイ画像
    print("\n--- オーバーレイ画像 ---")
    for filename in OVERLAY_FILES:
        total += 1
        filepath = os.path.join(IMAGES_DIR, filename)
        issues = verify_image(
            filepath,
            category="overlay",
            center_transparent_min=0.90,
            edge_opaque_min=0.60,
        )

        if issues:
            all_pass = False
            print(f"  [NG] {filename}")
            for issue in issues:
                print(f"       - {issue}")
        else:
            passed += 1
            print(f"  [OK] {filename}")

    # 近景レイヤー画像
    print("\n--- 近景レイヤー画像 ---")
    for filename in NEAR_FILES:
        total += 1
        filepath = os.path.join(IMAGES_DIR, filename)
        issues = verify_image(
            filepath,
            category="near",
            center_transparent_min=0.80,
            edge_opaque_min=0.60,
        )

        if issues:
            all_pass = False
            print(f"  [NG] {filename}")
            for issue in issues:
                print(f"       - {issue}")
        else:
            passed += 1
            print(f"  [OK] {filename}")

    # タイトル中景
    print("\n--- タイトル中景 ---")
    total += 1
    filepath = os.path.join(IMAGES_DIR, TITLE_MID_FILE)
    # 輝度ベースの場合、透明/不透明の分布は画像内容に依存するため基準を緩和
    issues = verify_image(
        filepath,
        category="title_mid",
        center_transparent_min=0.20,
        edge_opaque_min=0.01,
    )

    if issues:
        all_pass = False
        print(f"  [NG] {TITLE_MID_FILE}")
        for issue in issues:
            print(f"       - {issue}")
    else:
        passed += 1
        print(f"  [OK] {TITLE_MID_FILE}")

    # 結果サマリー
    print("\n" + "=" * 60)
    if all_pass:
        print(f"全検証パス: {passed}/{total} 枚")
    else:
        print(f"検証結果: {passed}/{total} 枚パス")
        print("NG項目を確認してください。")
        sys.exit(1)
    print("=" * 60)


if __name__ == "__main__":
    main()
