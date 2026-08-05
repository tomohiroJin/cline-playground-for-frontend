/**
 * 灰燼の城壁 - カード属性バッジ
 *
 * 手札とデッキ構築で見た目が統一されることが、
 * 「組んだときに見た形が、引いたときも同じ」を実現する前提。
 * CSS は1箇所に集約し、片方だけ直す事故を防ぐ。
 */
import styled from 'styled-components';

export const CardBadge = styled.span`
  padding: 0 3px;
  border: 1px solid currentColor;
  border-radius: 2px;
  font-size: 10px;
`;
