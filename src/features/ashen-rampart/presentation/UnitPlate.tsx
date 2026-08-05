/**
 * 灰燼の城壁 - 設置物の台座
 *
 * 形＝役割、サイズ＝コスト、文字＝個体の3重符号を描く（設計書 §4）。
 * 敵マーカーが「動く小さな塗り」なのに対し、台座は「固定された大きな枠」で
 * 図と地を分ける。クリックは下のセルボタンが受けるため pointer-events を持たない。
 *
 * z 順序: 台座(0) < エフェクト(1) < 状態バー(2) < 敵マーカー(3)。
 * 台座はセルの地であり、攻撃エフェクトを隠してはならない。
 *
 * **形（Shape）と文字（Glyph）を別の要素に分ける。** clip-path は子孫まで切るため、
 * 形と文字を同じ要素に載せると、最小幅360px（セル約37px）では下向き三角の
 * ベースライン付近や四芒星の上端で文字が大きく欠ける。設計 Risk 1 の退避策は
 * 「読めなければ文字を主・形を従に降格する」であり、その退避先である文字自体が
 * 劣化してはならない（最終レビュー指摘G）。
 */
import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import type { PlateModel } from './board-plates';
import { getRoleClipPath, roleLabelOf } from './unit-visual';
import { COLORS } from './theme';

/** 配置された瞬間だけ小さく現れる。置けたことのフィードバック */
const popIn = keyframes`
  from { transform: translate(-50%, -50%) scale(0.7); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
`;

/** 撃った瞬間だけ脈動させる。装飾ではなく「今起きたこと」の合図 */
const firePulse = keyframes`
  from { opacity: 0.95; }
  to { opacity: 0.45; }
`;

const PLATE_BACKGROUND = 'rgba(232, 222, 210, 0.14)';

/** 石壁の横長プレート。セル辺に対する幅・高さの割合（%） */
const WIDE_WIDTH_PCT = 90;
const WIDE_HEIGHT_PCT = 45;

/**
 * 台座の枠。位置・大きさ・動きだけを持ち、clip-path は持たない
 *
 * 動きをここに置くのは、形と文字が一体で現れ・脈動するようにするため。
 */
const Plate = styled.div<{
  $left: number;
  $top: number;
  $widthCqw: number;
  $heightCqw: number;
  $firing: boolean;
}>`
  position: absolute;
  left: ${({ $left }) => $left}%;
  top: ${({ $top }) => $top}%;
  transform: translate(-50%, -50%);
  width: ${({ $widthCqw }) => $widthCqw}cqw;
  height: ${({ $heightCqw }) => $heightCqw}cqw;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.secondary};
  line-height: 1;
  z-index: 0;
  pointer-events: none;
  animation: ${popIn} 200ms ease-out;

  ${({ $firing }) =>
    $firing
      ? css`
          /*
            発射時は脈動を加える。

            【重要】popIn は $firing の両分岐で animation-name のリストに含め続けること。
            CSS Animations 仕様では、animation-name 計算値が変わるとき、
            名前が一度リストから消えて再登場すると「新たに追加された」扱いになり、
            アニメーションが再生し直される。

            もし $firing 分岐から popIn を外すと、$firing が false に戻ったとき
            popIn が再度リストに現れ、敵に当たるたびに台座が拡大縮小して
            現れ直す（ポップインが何度もリピート）という欠陥が発生する。

            これを防ぐには、animation-name がリストから一度も消えないよう、
            両分岐に popIn を含める（= 名前の継続性を保つ）。

            実時間: popIn 200ms + firePulse 300ms (150ms × alternate 2)
            の並行実行で 300ms（全体制約内）。
          */
          animation: ${popIn} 200ms ease-out, ${firePulse} 150ms ease-out alternate 2;
        `
      : ''}

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** 役割を表す形。clip-path はこの要素だけに掛け、文字には掛けない */
const Shape = styled.div<{ $wide: boolean; $clipPath?: string }>`
  position: absolute;
  inset: 0;
  background: ${PLATE_BACKGROUND};
  border: 1px solid ${COLORS.secondary};
  border-radius: ${({ $wide, $clipPath }) => ($wide ? '4px' : $clipPath ? '0' : '50%')};
  ${({ $clipPath }) => ($clipPath ? css`clip-path: ${$clipPath};` : '')}
`;

/**
 * 個体を表す文字。Shape の外側（兄弟）なので clip-path に切られない
 *
 * position: relative で Shape より前面に出す。
 */
const Glyph = styled.span`
  position: relative;
  font-size: 12px;
`;

interface Props {
  plate: PlateModel;
  /** 盤面のセル数 */
  columns: number;
  rows: number;
}

export const UnitPlate: React.FC<Props> = ({ plate, columns, rows }) => {
  const { visual, pos } = plate;
  // sizePct は「セル辺に対する割合」だが、cqw は「盤面幅に対する割合」。
  // セル辺は盤面幅の 1/columns なので、両者を掛けて cqw へ換算する。
  // 単位を混ぜると横長プレートだけ縮尺が狂うため、ここで一度に確定させる。
  const cellCqw = 100 / columns;
  const widthCqw = ((visual.isWide ? WIDE_WIDTH_PCT : visual.sizePct) / 100) * cellCqw;
  const heightCqw = ((visual.isWide ? WIDE_HEIGHT_PCT : visual.sizePct) / 100) * cellCqw;
  const clipPath = getRoleClipPath(visual.role);
  return (
    <Plate
      data-testid={`unit-plate-${pos.x}-${pos.y}`}
      data-role={visual.role}
      aria-label={`${roleLabelOf(visual.role)} ${visual.name}`}
      $left={((pos.x + 0.5) / columns) * 100}
      $top={((pos.y + 0.44) / rows) * 100}
      $widthCqw={widthCqw}
      $heightCqw={heightCqw}
      $firing={plate.isFiring}
    >
      <Shape
        data-testid={`unit-shape-${pos.x}-${pos.y}`}
        data-mark="shape"
        aria-hidden="true"
        $wide={visual.isWide}
        $clipPath={clipPath}
      />
      <Glyph data-mark="glyph">{visual.glyph}</Glyph>
    </Plate>
  );
};
