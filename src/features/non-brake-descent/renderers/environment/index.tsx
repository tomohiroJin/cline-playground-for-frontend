import React from 'react';
import { Config } from '../../config';
import { Cloud, Building } from '../../types';

// 雲の描画コンポーネント
export const CloudRenderer: React.FC<{ clouds: Cloud[] }> = React.memo(({ clouds }) => (
  <g>
    {clouds.map((cloud, index) => (
      <g key={index} opacity={cloud.opacity}>
        <ellipse cx={cloud.x} cy={cloud.y} rx={cloud.size} ry={cloud.size * 0.5} fill="#fff" />
        <ellipse
          cx={cloud.x - cloud.size * 0.4}
          cy={cloud.y + 5}
          rx={cloud.size * 0.6}
          ry={cloud.size * 0.35}
          fill="#fff"
        />
        <ellipse
          cx={cloud.x + cloud.size * 0.4}
          cy={cloud.y + 3}
          rx={cloud.size * 0.5}
          ry={cloud.size * 0.3}
          fill="#fff"
        />
      </g>
    ))}
  </g>
)) as React.FC<{ clouds: Cloud[] }>;

// ビルの描画コンポーネント
export const BuildingRenderer: React.FC<{ buildings: Building[]; camY: number }> = React.memo(({ buildings, camY }) => (
  <g>
    {buildings.map((building, index) => {
      const by = Config.screen.height - building.height + (camY * 0.1) % 50;
      return (
        <g key={index}>
          <rect x={building.x} y={by} width={building.width} height={building.height + 100} fill={building.color} />
          {Array.from({ length: building.windows }, (_, wi) =>
            Array.from({ length: Math.floor(building.width / 12) }, (_, wj) => (
              <rect
                key={`${wi}-${wj}`}
                x={building.x + 4 + wj * 12}
                y={by + 10 + wi * 25}
                width={6}
                height={12}
                fill={building.windowLit[wi]?.[wj] ? '#ffee88' : '#334'}
                opacity={0.8}
              />
            ))
          )}
        </g>
      );
    })}
  </g>
)) as React.FC<{ buildings: Building[]; camY: number }>;
