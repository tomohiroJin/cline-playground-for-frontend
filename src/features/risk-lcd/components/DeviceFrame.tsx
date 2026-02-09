import React from 'react';
import { Device, Brand, Brand2, Bezel } from './styles';

interface Props {
  children: React.ReactNode;
  controls?: React.ReactNode;
}

// ゲーム機筐体コンポーネント（ベゼル/ブランドロゴ/画面枠）
const DeviceFrame: React.FC<Props> = ({ children, controls }) => (
  <Device>
    <Brand>RISK LCD</Brand>
    <Brand2>LIQUID CRYSTAL DANGER</Brand2>
    <Bezel>{children}</Bezel>
    {controls}
  </Device>
);

export default DeviceFrame;
