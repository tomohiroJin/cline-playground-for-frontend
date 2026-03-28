import styled, { css } from 'styled-components';

/** ステータスボックスの共通スタイル */
const statusBoxBase = css`
  padding: var(--space-3) var(--space-4);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  margin: var(--space-3) 0;
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  font-size: var(--font-size-sm);
`;

/** ハイライトボックス（重要情報の強調） */
export const HighlightBox = styled.div`
  ${statusBoxBase}
  background: var(--color-state-info-bg);
  border-left: 3px solid var(--color-accent-primary);
`;

/** 警告ボックス（免責事項・注意喚起用） */
export const WarningBox = styled.div`
  ${statusBoxBase}
  background: var(--color-state-warning-bg);
  border-left: 3px solid var(--color-state-warning);
`;
