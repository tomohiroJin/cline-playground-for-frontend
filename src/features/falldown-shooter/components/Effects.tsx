// エフェクトコンポーネント群

import React, { useState, useEffect } from 'react';
import { Laser, Explosion, Blast } from '../../../pages/FallingShooterPage.styles';

export const LaserEffectComponent: React.FC<{ x: number; size: number; height: number }> = ({
  x,
  size,
  height,
}) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setTimeout(() => setVisible(false), 300);
  }, []);
  return visible ? <Laser $x={x} $size={size} $height={height} /> : null;
};

export const ExplosionEffectComponent: React.FC<{ x: number; y: number; size: number }> = ({
  x,
  y,
  size,
}) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setTimeout(() => setVisible(false), 250);
  }, []);
  return visible ? <Explosion $x={x} $y={y} $size={size} /> : null;
};

export const BlastEffectComponent: React.FC<{ visible: boolean }> = ({ visible }) =>
  visible ? <Blast /> : null;
