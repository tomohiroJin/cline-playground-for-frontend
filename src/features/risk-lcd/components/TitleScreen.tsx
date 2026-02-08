import React from 'react';
import { MENUS } from '../constants';
import {
  TitleLayer,
  TitleText,
  TitleSub,
  TitlePt,
  TitleBest,
  TitleMenu,
  TitleMenuItem,
  MenuArrow,
  MenuLabel,
  TitleHow,
} from './styles';

interface Props {
  active: boolean;
  /** 現在選択中のメニューインデックス */
  menuIndex: number;
  /** ポイント残高 */
  pts: number;
  /** ベストスコア（0 なら非表示） */
  best: number;
}

// タイトル画面（GAME START / PLAY STYLE / UNLOCK / HELP メニュー）
const TitleScreen: React.FC<Props> = ({ active, menuIndex, pts, best }) => (
  <TitleLayer $active={active}>
    <TitlePt>PT:{pts}</TitlePt>
    {best > 0 && <TitleBest>BEST:{best}</TitleBest>}
    <TitleText>
      RISK
      <br />
      LCD
    </TitleText>
    <TitleSub>── CHOOSE YOUR FATE ──</TitleSub>
    <TitleMenu>
      {MENUS.map((label, i) => (
        <TitleMenuItem key={label} $selected={i === menuIndex}>
          <MenuArrow $visible={i === menuIndex}>▶</MenuArrow>
          <MenuLabel>{label}</MenuLabel>
        </TitleMenuItem>
      ))}
    </TitleMenu>
    <TitleHow>
      ◀▶ 移動 ─ ● 決定 ─ ▲▼ 選択
      <br />
      予告の長さはステージ毎にランダムで各レーンに割振
      <br />
      パークを重ねてビルドを構築せよ
    </TitleHow>
  </TitleLayer>
);

export default TitleScreen;
