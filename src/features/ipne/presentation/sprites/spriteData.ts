/**
 * スプライトデータ定義・生成ユーティリティ
 *
 * コードスプライト方式：外部画像ファイルを使用せず、
 * TypeScript 内で 2D 配列（パレットインデックス）としてスプライトを定義する。
 */

/**
 * スプライト定義
 * pixels[y][x] = パレットインデックス（0 = 透明）
 */
export interface SpriteDefinition {
  width: number;
  height: number;
  pixels: number[][];
  palette: string[]; // palette[0] は常に透明
}

/**
 * 16進数カラーコードを RGBA 値に変換する
 *
 * @param hex - 16進数カラーコード（例: '#ff0000'）
 * @returns [r, g, b, a] の配列
 */
export function hexToRgba(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, 255];
}

/**
 * ピクセルデータとパレットから ImageData を生成する
 *
 * @param pixels - 2D 配列のパレットインデックス（pixels[y][x]、0 = 透明）
 * @param palette - カラーパレット配列（palette[0] は透明色として扱う）
 * @returns Canvas 描画用 ImageData
 */
export function createSprite(
  pixels: number[][],
  palette: string[]
): ImageData {
  const height = pixels.length;
  const width = pixels[0].length;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const colorIndex = pixels[y][x];
      const offset = (y * width + x) * 4;

      if (colorIndex === 0) {
        // 透明ピクセル
        data[offset] = 0;
        data[offset + 1] = 0;
        data[offset + 2] = 0;
        data[offset + 3] = 0;
      } else {
        const [r, g, b, a] = hexToRgba(palette[colorIndex]);
        data[offset] = r;
        data[offset + 1] = g;
        data[offset + 2] = b;
        data[offset + 3] = a;
      }
    }
  }

  return new ImageData(data, width, height);
}
