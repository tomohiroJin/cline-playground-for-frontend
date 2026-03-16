/**
 * ガイド画面コンポーネント（親コンポーネント）
 * 各セクションとナビゲーションを組み合わせる
 */
import React from 'react';
import { CONFIG } from '../../../constants';
import {
  PageWrapper,
  ScrollablePanel,
  Scanlines,
} from '../../styles';
import {
  GuideHeader,
  AboutSection,
  TeamSection,
  HowToPlaySection,
  RulesSection,
  ScoringSection,
  SprintPhasesSection,
  EngineerTypesSection,
  DifficultySection,
  TextSection,
} from './GuideSection';
import { GuideNavigation } from './GuideNavigation';

interface GuideScreenProps {
  onBack: () => void;
}

/**
 * 遊び方 & チーム紹介画面
 */
export const GuideScreen: React.FC<GuideScreenProps> = ({ onBack }) => {
  return (
    <PageWrapper>
      <Scanlines />
      <ScrollablePanel $fadeIn={false} style={{ maxWidth: 600 }}>
        <GuideHeader />
        <AboutSection />
        <TeamSection />
        <HowToPlaySection />
        <RulesSection />
        <ScoringSection />
        <SprintPhasesSection />
        <EngineerTypesSection />
        <DifficultySection />

        <TextSection
          title="CHALLENGE MODE"
          lines={[
            'タイトル画面の「Challenge」ボタンから挑戦できます。',
            '・1問でも不正解になると即終了のサバイバルモード',
            '・全ジャンルからランダムに出題',
            '・正解数がそのままスコアとしてハイスコア保存',
            `・制限時間は通常モードと同じ${CONFIG.timeLimit}秒`,
          ]}
        />
        <TextSection
          title="ACHIEVEMENTS"
          lines={[
            'タイトル画面の「実績」ボタンから一覧を確認できます。',
            '・全20種類の実績をコンプリートしよう',
            '・実績はBronze / Silver / Gold / Platinumの4段階のレア度',
            '・ゲームクリア時に条件を満たすと自動で獲得',
            '・繰り返しプレイで獲得できる継続系の実績もあり',
          ]}
        />
        <TextSection
          title="HISTORY"
          lines={[
            'タイトル画面の「履歴」ボタンからプレイ履歴を確認できます。',
            '・過去最大10回分のプレイ結果を保存',
            '・正答率や回答速度の推移をグラフで確認',
            '・最高グレードや獲得チームタイプの履歴表示',
          ]}
        />
        <TextSection
          title="STUDY MODE"
          lines={[
            'タイトル画面の「勉強会モード」から利用可能です。',
            '・スプリント工程別 or 個別ジャンルを選択',
            '・問題数を10問/20問/50問から選択',
            '・制限時間なしでじっくり学習',
            '・回答後すぐに解説を確認',
            '・苦手ジャンルは前回結果から自動提案',
          ]}
        />

        <GuideNavigation onBack={onBack} />
      </ScrollablePanel>
    </PageWrapper>
  );
};
