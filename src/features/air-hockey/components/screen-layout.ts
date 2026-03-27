/**
 * 画面共通レイアウトスタイル
 * CharacterSelectScreen / TeamSetupScreen 等で統一パターンとして使用
 */

/** ヘッダー右側のスペーサー幅（戻るボタンとバランスを取る） */
const SPACER_WIDTH = '60px';

export const screenLayout = {
  /** フルスクリーンのフレックスコンテナ */
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
  /** ヘッダー（左: 戻るボタン、中央: タイトル、右: スペーサー） */
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  /** 画面タイトル */
  title: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#e67e22',
  },
  /** 戻るボタン */
  backButton: {
    background: 'none',
    border: '1px solid #555',
    color: '#ccc',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  /** ヘッダー右側スペーサー（中央タイトルのバランス用） */
  spacer: {
    width: SPACER_WIDTH,
  },
  /** 全幅アクションボタン */
  actionButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
  },
};
