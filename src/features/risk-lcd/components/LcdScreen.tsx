import React from 'react';
import { Screen } from './styles';

interface Props {
  children: React.ReactNode;
}

// LCD画面コンテナ（スキャンライン/反射効果は ::before / ::after で適用）
const LcdScreen: React.FC<Props> = ({ children }) => (
  <Screen>{children}</Screen>
);

export default LcdScreen;
