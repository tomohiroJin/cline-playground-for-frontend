import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { NonBrakeDescentGame } from '../features/non-brake-descent/NonBrakeDescentGame';
import { ShareButton } from '../components/molecules/ShareButton';

const PageContainer = styled.div`
  background: var(--bg-gradient);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 10px 40px;
`;

const GameSection = styled.section`
  width: 100%;
  display: flex;
  justify-content: center;
`;

const ShareSection = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
`;

const NonBrakeDescentPage: React.FC = () => {
  const [shareScore, setShareScore] = useState(0);
  const shareText = useMemo(
    () =>
      shareScore > 0
        ? `Non-Brake Descentでスコア${shareScore}を達成！`
        : 'Non-Brake Descentをプレイ中！ハイスピード下り坂に挑戦しよう。',
    [shareScore]
  );

  return (
    <PageContainer>
      <GameSection role="region" aria-label="Non-Brake Descent ゲーム画面">
        <NonBrakeDescentGame onScoreChange={setShareScore} />
      </GameSection>
      <ShareSection>
        <ShareButton text={shareText} hashtags={['NonBrakeDescent', 'GamePlatform']} />
      </ShareSection>
    </PageContainer>
  );
};

export default NonBrakeDescentPage;
