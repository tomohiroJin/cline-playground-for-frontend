import React from 'react';
import { Config } from '../../config';
import { Cloud, Building } from '../../types';

// ===== パララックス深度表現の定数 =====
/** 雲のサイズがこの値以下を「遠景」と判定する閾値 */
const CLOUD_FAR_SIZE_THRESHOLD = 30;
/** 遠景の雲に適用するぼかし（feGaussianBlur の stdDeviation） */
const CLOUD_FAR_BLUR = 1.5;
/** 遠景の雲の色合い（わずかに青みがかった霞） */
const CLOUD_FAR_COLOR = '#d8e8ff';
/** 近景の雲の色（白） */
const CLOUD_NEAR_COLOR = '#ffffff';
/** ビルの高さがこれ以下を「遠景ビル」と判定する閾値（px） */
const BUILDING_FAR_HEIGHT_THRESHOLD = 120;
/** 遠景ビルの透明度 */
const BUILDING_FAR_OPACITY = 0.55;
/** 遠景ビルの色補正（霞がかった青みがかった暗さ） */
const BUILDING_FAR_COLOR_OVERLAY = 'rgba(80,100,140,0.35)';
/** カメラY座標に対するビルのパララックス係数（0.1 = 遠景感） */
const BUILDING_PARALLAX_FACTOR = 0.1;
/** ビルパララックスの折り返し周期（px） */
const BUILDING_PARALLAX_CYCLE = 50;

// ===== 雲の描画コンポーネント =====
export const CloudRenderer: React.FC<{ clouds: Cloud[] }> = React.memo(({ clouds }) => {
  // 雲のサイズで遠近を判定し、遠景は淡く・ぼかして霞感を演出する
  // Cloud 型を変えずに描画係数のみで奥行きを表現する
  return (
    <g>
      <defs>
        {/* 遠景の雲用ぼかしフィルタ */}
        <filter id="cloudFarBlur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={CLOUD_FAR_BLUR} />
        </filter>
      </defs>
      {clouds.map((cloud, index) => {
        // サイズが小さいほど遠景（奥）と判定
        const isFar = cloud.size < CLOUD_FAR_SIZE_THRESHOLD;
        // 遠景は元の opacity をさらに下げて霞感を増す（近景はそのまま）
        const depthOpacity = isFar ? cloud.opacity * 0.65 : cloud.opacity;
        // 遠景は青みがかった白、近景は純白
        const cloudColor = isFar ? CLOUD_FAR_COLOR : CLOUD_NEAR_COLOR;
        return (
          <g
            key={index}
            opacity={depthOpacity}
            filter={isFar ? 'url(#cloudFarBlur)' : undefined}
          >
            <ellipse cx={cloud.x} cy={cloud.y} rx={cloud.size} ry={cloud.size * 0.5} fill={cloudColor} />
            <ellipse
              cx={cloud.x - cloud.size * 0.4}
              cy={cloud.y + 5}
              rx={cloud.size * 0.6}
              ry={cloud.size * 0.35}
              fill={cloudColor}
            />
            <ellipse
              cx={cloud.x + cloud.size * 0.4}
              cy={cloud.y + 3}
              rx={cloud.size * 0.5}
              ry={cloud.size * 0.3}
              fill={cloudColor}
            />
            {/* 近景の雲のみ上面ハイライト（立体感） */}
            {!isFar ? (
              <ellipse
                cx={cloud.x}
                cy={cloud.y - cloud.size * 0.1}
                rx={cloud.size * 0.7}
                ry={cloud.size * 0.25}
                fill="rgba(255,255,255,0.5)"
              />
            ) : undefined}
          </g>
        );
      })}
    </g>
  );
}) as React.FC<{ clouds: Cloud[] }>;
CloudRenderer.displayName = 'CloudRenderer';

// ===== ビルの描画コンポーネント =====
export const BuildingRenderer: React.FC<{ buildings: Building[]; camY: number }> = React.memo(({ buildings, camY }) => {
  // Building 型を変えずに高さで遠近感を判定する。
  // 遠景ビルは透明度を下げ、霞がかった色オーバーレイを重ねて奥行きを演出する。
  return (
    <g>
      {buildings.map((building, index) => {
        const by = Config.screen.height - building.height + (camY * BUILDING_PARALLAX_FACTOR) % BUILDING_PARALLAX_CYCLE;
        // 高さが低いほど遠景（奥）と判定
        const isFar = building.height < BUILDING_FAR_HEIGHT_THRESHOLD;
        const buildingOpacity = isFar ? BUILDING_FAR_OPACITY : 1;
        return (
          <g key={index} opacity={buildingOpacity}>
            {/* ビル本体 */}
            <rect x={building.x} y={by} width={building.width} height={building.height + 100} fill={building.color} />
            {/* 遠景ビルには霞オーバーレイを重ねる */}
            {isFar ? (
              <rect
                x={building.x}
                y={by}
                width={building.width}
                height={building.height + 100}
                fill={BUILDING_FAR_COLOR_OVERLAY}
              />
            ) : undefined}
            {/* ビル側面の明暗（立体感: 右端を暗くして面の向きを演出） */}
            <rect
              x={building.x + building.width - 4}
              y={by}
              width="4"
              height={building.height + 100}
              fill="rgba(0,0,0,0.2)"
            />
            {/* 窓 */}
            {Array.from({ length: building.windows }, (_, wi) =>
              Array.from({ length: Math.floor(building.width / 12) }, (_, wj) => (
                <rect
                  key={`${wi}-${wj}`}
                  x={building.x + 4 + wj * 12}
                  y={by + 10 + wi * 25}
                  width={6}
                  height={12}
                  fill={building.windowLit[wi]?.[wj] ? '#ffee88' : '#334'}
                  opacity={isFar ? 0.5 : 0.8}
                />
              ))
            )}
          </g>
        );
      })}
    </g>
  );
}) as React.FC<{ buildings: Building[]; camY: number }>;
BuildingRenderer.displayName = 'BuildingRenderer';
