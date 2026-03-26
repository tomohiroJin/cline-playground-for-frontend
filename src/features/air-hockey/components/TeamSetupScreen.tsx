/**
 * ペアマッチ（2v2）チーム確認画面
 * チーム構成を表示して対戦開始
 * Field / Win Score はタイトル画面の設定値をそのまま使用する
 * レイアウトは CharacterSelectScreen と同パターン（フルスクリーン + ヘッダー中央タイトル）
 */
import React from 'react';

type TeamSetupScreenProps = {
  onStart: () => void;
  onBack: () => void;
};

// ── スタイル定数 ─────────────────────────────
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: '16px',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#e67e22',
  },
  backButton: {
    background: 'none',
    border: '1px solid #555',
    color: '#ccc',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  spacer: {
    width: '60px',
  },
  teamSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
  },
  teamTitle: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    marginBottom: '8px',
    color: '#e67e22',
  },
  memberList: {
    fontSize: '0.9rem',
    color: '#ccc',
    lineHeight: 1.8,
    paddingLeft: '8px',
  },
  startButton: {
    width: '100%',
    padding: '14px',
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: '#fff',
    background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '16px',
  },
};

export const TeamSetupScreen: React.FC<TeamSetupScreenProps> = ({
  onStart,
  onBack,
}) => (
  <div style={styles.container}>
    {/* ヘッダー */}
    <div style={styles.header}>
      <button style={styles.backButton} onClick={onBack}>
        ← 戻る
      </button>
      <span style={styles.title}>ペアマッチ</span>
      <div style={styles.spacer} />
    </div>

    {/* チーム1 */}
    <div style={styles.teamSection}>
      <div style={styles.teamTitle}>チーム1（下）</div>
      <div style={styles.memberList}>
        <div>P1: あなた</div>
        <div>P2: CPU（味方）</div>
      </div>
    </div>

    {/* チーム2 */}
    <div style={styles.teamSection}>
      <div style={styles.teamTitle}>チーム2（上）</div>
      <div style={styles.memberList}>
        <div>P3: CPU（敵1）</div>
        <div>P4: CPU（敵2）</div>
      </div>
    </div>

    {/* 対戦開始ボタン */}
    <button style={styles.startButton} onClick={onStart}>
      対戦開始！
    </button>
  </div>
);
