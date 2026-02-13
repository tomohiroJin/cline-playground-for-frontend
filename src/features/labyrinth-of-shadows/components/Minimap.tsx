import React from 'react';
import type { Entity, Item, Enemy } from '../types';
import { MinimapContainer } from '../../../pages/MazeHorrorPage.styles';

interface MinimapProps {
  maze: number[][];
  player: Entity;
  exit: Entity;
  items: Item[];
  enemies: Enemy[];
  keys: number;
  reqKeys: number;
  explored: Record<string, boolean>;
}

export const Minimap: React.FC<MinimapProps> = ({
  maze,
  player,
  exit,
  items,
  enemies,
  keys,
  reqKeys,
  explored,
}) => (
  <MinimapContainer>
    <div style={{ position: 'relative', width: maze.length * 4, height: maze.length * 4 }}>
      {maze.map((row, y) =>
        row.map((val, x) => {
          const isExplored = explored[`${x},${y}`];
          return (
            <div
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: x * 4,
                top: y * 4,
                width: 4,
                height: 4,
                backgroundColor: val === 1 ? '#333' : isExplored ? '#1a1a2e' : '#0a0a15',
                opacity: isExplored ? 1 : 0.25,
              }}
            />
          );
        })
      )}
      {items
        .filter(i => !i.got && explored[`${i.x},${i.y}`])
        .map((item, i) => (
          <div
            key={`i${i}`}
            style={{
              position: 'absolute',
              left: item.x * 4,
              top: item.y * 4,
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: item.type === 'key' ? '#ffdd00' : '#ff8844',
            }}
          />
        ))}
      <div
        style={{
          position: 'absolute',
          left: exit.x * 4,
          top: exit.y * 4,
          width: 6,
          height: 6,
          borderRadius: 1,
          backgroundColor: keys >= reqKeys ? '#44ff88' : '#666',
        }}
      />
      {enemies
        .filter(e => e.active)
        .map((e, i) => (
          <div
            key={`e${i}`}
            style={{
              position: 'absolute',
              left: e.x * 4,
              top: e.y * 4,
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: '#ff0044',
              animation: 'pulse 0.5s infinite',
            }}
          />
        ))}
      <div
        style={{
          position: 'absolute',
          left: player.x * 4 - 1,
          top: player.y * 4 - 1,
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: '#60a5fa',
          boxShadow: '0 0 4px #60a5fa',
        }}
      />
    </div>
  </MinimapContainer>
);
