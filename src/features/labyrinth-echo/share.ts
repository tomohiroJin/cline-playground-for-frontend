/**
 * 迷宮の残響 - シェアカード生成
 */
import { LE_IMAGES } from './images';

export interface ShareData {
  status: "clear" | "gameover";
  title: string;       // エンディング名 or 死因
  diffName: string;
  floor: number;
  floorName: string;
  events: number;
  kp: number;
  bgImgUrl?: string;   // 背景画像URL
}

/**
 * 探索結果をCanvasに描画し、Data URL (PNG) として返す
 */
export const generateShareCard = async (data: ShareData): Promise<string> => {
  const cn = document.createElement("canvas");
  cn.width = 1200;
  cn.height = 630;
  const ctx = cn.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context init failed");

  // 1. 背景描画
  if (data.bgImgUrl) {
    try {
      const img = new Image();
      img.src = data.bgImgUrl;
      await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
      ctx.drawImage(img, 0, 0, cn.width, cn.height);
    } catch (e) {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, cn.width, cn.height);
    }
  } else {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, cn.width, cn.height);
  }

  // 背景を暗くするグレーオーバーレイ
  ctx.fillStyle = "rgba(10, 10, 24, 0.75)";
  ctx.fillRect(0, 0, cn.width, cn.height);

  // 2. タイトルロゴ風
  ctx.font = "bold 60px 'sans-serif'";
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillText("迷宮の残響", 60, 100);

  // 3. メイン結果テキスト
  ctx.font = "bold 90px 'sans-serif'";
  const isClear = data.status === "clear";
  ctx.fillStyle = isClear ? "#fbbf24" : "#f87171";
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 30;
  ctx.fillText(data.title, 60, 240);
  ctx.shadowBlur = 0;

  // 4. データ
  ctx.font = "40px 'sans-serif'";
  ctx.fillStyle = "#e2e8f0";
  let y = 350;
  const dy = 60;
  ctx.fillText(`難易度: ${data.diffName}`, 60, y); y += dy;
  ctx.fillText(`到達層: 第${data.floor}層 (${data.floorName})`, 60, y); y += dy;
  ctx.fillText(`通過イベント: ${data.events}件`, 60, y); y += dy;
  ctx.fillText(`獲得知見: ${data.kp}pt`, 60, y);

  // 5. 下部装飾
  ctx.fillStyle = "#818cf8";
  ctx.font = "30px 'sans-serif'";
  ctx.fillText("TEXT EXPLORATION × JUDGMENT × ROGUELITE", 60, 580);

  return cn.toDataURL("image/png");
};

/**
 * ダウンロード実行またはシェア機能呼び出し
 */
export const shareCard = async (data: ShareData) => {
  try {
    const dataUrl = await generateShareCard(data);
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "labyrinth-echo-result.png", { type: "image/png" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: '迷宮の残響 探索結果',
        text: `【迷宮の残響】探索結果: ${data.title} (#迷宮の残響)`,
        files: [file]
      });
    } else {
      // ダウンロードフォールバック（DOM に追加しないと一部ブラウザで動作しない）
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "labyrinth-echo-result.png";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch (error) {
    console.error("シェアに失敗しました", error);
    alert("画像の生成またはシェアに失敗しました。");
  }
};
