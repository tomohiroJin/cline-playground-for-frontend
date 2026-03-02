import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** パスとタイトルの対応表 */
const TITLE_MAP: Record<string, string> = {
  '/': 'Game Platform',
  '/puzzle': 'Picture Puzzle | Game Platform',
  '/air-hockey': 'Air Hockey | Game Platform',
  '/racing': 'Racing Game | Game Platform',
  '/falling-shooter': 'Falldown Shooter | Game Platform',
  '/maze-horror': 'Labyrinth of Shadows | Game Platform',
  '/non-brake-descent': 'Non-Brake Descent | Game Platform',
  '/deep-sea-shooter': 'Deep Sea Interceptor | Game Platform',
  '/ipne': 'IPNE | Game Platform',
  '/agile-quiz-sugoroku': 'Agile Quiz Sugoroku | Game Platform',
  '/labyrinth-echo': '迷宮の残響 | Game Platform',
  '/risk-lcd': 'RISK LCD | Game Platform',
  '/keys-and-arms': 'KEYS & ARMS | Game Platform',
  '/primal-path': '原始進化録 - PRIMAL PATH | Game Platform',
  '/about': 'サイトについて | Game Platform',
  '/privacy-policy': 'プライバシーポリシー | Game Platform',
  '/terms': '利用規約 | Game Platform',
  '/contact': 'お問い合わせ | Game Platform',
};

const DEFAULT_TITLE = 'Game Platform';

/**
 * 現在のルートに応じて document.title を動的に設定するフック
 */
export const useDocumentTitle = (): void => {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = TITLE_MAP[pathname] ?? DEFAULT_TITLE;
  }, [pathname]);
};
