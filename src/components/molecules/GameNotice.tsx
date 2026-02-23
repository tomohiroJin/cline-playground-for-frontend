import React from 'react';
import styled, { keyframes } from 'styled-components';
import { GameNoticeInfo } from '../../constants/game-notices';

interface GameNoticeProps {
  /** ゲーム注意事項情報 */
  readonly notice: GameNoticeInfo;
  /** OK ボタン押下時のコールバック */
  readonly onAccept: () => void;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  animation: ${fadeIn} 0.3s ease;
`;

const Modal = styled.div`
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 32px;
  max-width: 480px;
  width: calc(100% - 32px);
  color: #e0e0e0;
  animation: ${slideUp} 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h2`
  margin: 0 0 8px;
  font-size: 1.2rem;
  color: #fff;
`;

const GameName = styled.span`
  color: #64b5f6;
`;

const NoticeList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 16px 0;
`;

const NoticeItem = styled.li`
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.9rem;
  line-height: 1.5;

  &:last-child {
    border-bottom: none;
  }
`;

const NoticeIcon = styled.span`
  margin-right: 8px;
`;

const Disclaimer = styled.p`
  font-size: 0.75rem;
  color: #888;
  margin: 16px 0 0;
  line-height: 1.5;
`;

const AcceptButton = styled.button`
  display: block;
  width: 100%;
  margin-top: 20px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

/**
 * ゲーム注意書きモーダルコンポーネント
 */
export const GameNotice: React.FC<GameNoticeProps> = ({ notice, onAccept }) => (
  <Overlay role="dialog" aria-modal="true" aria-label="ゲーム注意事項">
    <Modal>
      <Title>
        <GameName>{notice.name}</GameName> をプレイする前に
      </Title>

      <NoticeList>
        <NoticeItem>
          <NoticeIcon>🌐</NoticeIcon>
          推奨ブラウザ: Chrome / Edge 最新版
        </NoticeItem>

        {notice.recommendedDevice === 'pc' && (
          <NoticeItem>
            <NoticeIcon>💻</NoticeIcon>
            PC でのプレイを推奨します
          </NoticeItem>
        )}

        {notice.hasAudio && (
          <NoticeItem>
            <NoticeIcon>🔊</NoticeIcon>
            このゲームは音声を使用します。音量にご注意ください
          </NoticeItem>
        )}

        {notice.hasFlashing && (
          <NoticeItem>
            <NoticeIcon>⚡</NoticeIcon>
            光の点滅表現を含みます。光に敏感な方はご注意ください
          </NoticeItem>
        )}
      </NoticeList>

      <Disclaimer>
        当サイトのゲームは学習・趣味目的で制作されたものです。
        プレイ中に体調の変化を感じた場合は、ただちに使用を中止してください。
      </Disclaimer>

      <AcceptButton onClick={onAccept} type="button">
        OK
      </AcceptButton>
    </Modal>
  </Overlay>
);
