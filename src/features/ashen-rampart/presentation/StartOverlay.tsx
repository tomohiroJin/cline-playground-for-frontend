/**
 * 灰燼の城壁 - 開始前オーバーレイ
 *
 * 「何の説明もカウントダウンもなしだと焦る」への対応。
 * リアルタイムの緊張感は保ちたいので、説明は静止した状態で先に済ませる。
 */
import React from 'react';
import styled from 'styled-components';
import { COLORS } from './theme';
import { HEADER_CLEARANCE } from './layout-constants';

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  padding: 24px;
  padding-top: ${HEADER_CLEARANCE};
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  min-height: 60vh;
`;

const List = styled.ul`
  margin: 0;
  padding-left: 20px;
  line-height: 1.8;
`;

const StartButton = styled.button`
  min-height: 44px;
  padding: 0 20px;
  background: ${COLORS.opportunity};
  color: ${COLORS.dominant};
  border: none;
  border-radius: 4px;
  font-weight: 700;
  cursor: pointer;
`;

interface Props {
  /** 第1ウェーブの予告文字列 */
  preview: string;
  onStart: () => void;
}

export const StartOverlay: React.FC<Props> = ({ preview, onStart }) => (
  <Panel data-testid="ashen-rampart-start-overlay" data-header-clearance={HEADER_CLEARANCE}>
    <h2>砦を守る</h2>
    <p>敵を通すとライフが減ります。0 になると敗北です。</p>
    <List>
      <li>カードを選んで盤面に置きます。置ける場所は琥珀色で示されます</li>
      <li>燠火はクリックで再点火できます（マナも配置の間隔も消費しません）</li>
      <li>カード未選択時、盤面の設置物をクリックで範囲と能力が表示されます</li>
      <li>スペースキーで一時停止できます。盤面と手札は見られますが、置くことはできません</li>
    </List>
    <p>最初の波: {preview}</p>
    <StartButton type="button" onClick={onStart}>
      開始
    </StartButton>
  </Panel>
);
