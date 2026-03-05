import styled from 'styled-components';

/** ハイライトボックス（重要情報の強調） */
export const HighlightBox = styled.div`
  background: rgba(0, 210, 255, 0.08);
  border-left: 3px solid var(--accent-color);
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  margin: 12px 0;
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 0.9rem;
`;

/** 警告ボックス（免責事項・注意喚起用） */
export const WarningBox = styled.div`
  background: rgba(255, 193, 7, 0.08);
  border-left: 3px solid #ffc107;
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  margin: 12px 0;
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 0.9rem;
`;
