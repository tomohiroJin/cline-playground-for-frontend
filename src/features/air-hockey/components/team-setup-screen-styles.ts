/**
 * TeamSetupScreen のスタイル定義
 * コンポーネントロジックから分離して保守性を向上
 */
import { screenLayout } from './screen-layout';

export const teamSetupStyles = {
  scrollArea: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  teamSection: (teamColor: string) => ({
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '12px',
    borderLeft: `3px solid ${teamColor}`,
  }),
  teamTitle: (teamColor: string) => ({
    fontSize: '16px',
    fontWeight: 'bold' as const,
    marginBottom: '8px',
    color: teamColor,
  }),
  slotRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  slotRowFixed: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    borderRadius: '6px',
    marginBottom: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    cursor: 'default',
  },
  slotIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  slotLabel: {
    fontSize: '12px',
    color: '#888',
  },
  slotName: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  slotInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
  },
  changeHint: {
    fontSize: '11px',
    color: '#666',
    marginLeft: 'auto',
  },
  // キャラ選択グリッド
  gridContainer: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  gridCard: (isSelected: boolean, isLocked: boolean, color: string) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    borderRadius: '6px',
    border: isSelected ? `2px solid ${color}` : '2px solid #444',
    backgroundColor: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
    cursor: isLocked ? 'not-allowed' : 'pointer',
    opacity: isLocked ? 0.4 : 1,
    position: 'relative' as const,
  }),
  gridCardIcon: (isLocked: boolean) => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    marginBottom: '2px',
    ...(isLocked ? { filter: 'grayscale(100%) brightness(0.5)' } : {}),
  }),
  gridCardName: {
    fontSize: '10px',
    color: '#ddd',
    textAlign: 'center' as const,
  },
  lockOverlay: {
    position: 'absolute' as const,
    top: '2px',
    right: '2px',
    fontSize: '10px',
  },
  // CPU/人間 トグル
  controlToggle: {
    display: 'flex',
    gap: '4px',
    marginLeft: 'auto',
  },
  controlButton: (isActive: boolean) => ({
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: isActive ? 'rgba(230, 126, 34, 0.3)' : 'transparent',
    color: isActive ? '#e67e22' : '#aaa',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    minWidth: '44px',
    minHeight: '44px',
  }),
  controlHint: {
    fontSize: '11px',
    color: '#888',
    padding: '4px 8px',
    fontStyle: 'italic' as const,
  },
  // 開始ボタン
  startButton: {
    ...screenLayout.actionButton,
    background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    marginTop: '12px',
  },
};
