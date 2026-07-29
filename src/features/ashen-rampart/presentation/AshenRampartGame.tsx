/**
 * 灰燼の城壁 - ゲーム画面（作り直し中のプレースホルダ）
 *
 * リアルタイム・デッキ PoC への作り替え中。実装が揃うまでの暫定表示。
 */
import React from 'react';
import styled from 'styled-components';

const Placeholder = styled.div`
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e8ded2;
  background: #1a1614;
  text-align: center;
  padding: 24px;
`;

export const AshenRampartGame: React.FC = () => (
  <Placeholder>
    <p>灰燼の城壁は改修中です。</p>
  </Placeholder>
);
