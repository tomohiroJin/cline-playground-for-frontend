/**
 * ペアマッチ（2v2）チーム確認画面
 * チーム構成を表示して対戦開始
 * Field / Win Score はタイトル画面の設定値をそのまま使用する
 */
import React from 'react';
import { screenLayout } from './screen-layout';

type TeamSetupScreenProps = {
  onStart: () => void;
  onBack: () => void;
};

// ── 画面固有スタイル ─────────────────────────────
const styles = {
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
    ...screenLayout.actionButton,
    background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    marginTop: '16px',
  },
};

export const TeamSetupScreen: React.FC<TeamSetupScreenProps> = ({
  onStart,
  onBack,
}) => (
  <div style={screenLayout.container}>
    {/* ヘッダー */}
    <div style={screenLayout.header}>
      <button style={screenLayout.backButton} onClick={onBack}>
        ← 戻る
      </button>
      <span style={screenLayout.title}>ペアマッチ</span>
      <div style={screenLayout.spacer} />
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
