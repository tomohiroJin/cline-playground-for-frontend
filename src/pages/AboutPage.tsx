import React from 'react';
import styled from 'styled-components';
import { StaticPageLayout } from '../components/templates/StaticPageLayout';
import { SectionCard } from '../components/molecules/SectionCard';
import { FaqAccordion } from '../components/molecules/FaqAccordion';
import { WarningBox } from '../components/atoms/HighlightBox';
import { ABOUT_FAQ_ITEMS } from '../constants/game-seo-data';
import { useFaqSchema } from '../hooks/useFaqSchema';

/** フィーチャーカードのグリッドコンテナ */
const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin: 16px 0 24px;
`;

/** ゲームジャンルのタグコンテナ */
const GenreTagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
`;

/** ゲームジャンルタグ */
const GenreTag = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  background: rgba(0, 210, 255, 0.08);
  border: 1px solid rgba(0, 210, 255, 0.2);
  color: var(--text-secondary);
`;

/** 警告リスト */
const WarningList = styled.ul`
  color: var(--text-secondary);
  line-height: 1.8;
  margin: 0;
  padding-left: 24px;
`;

/** 運営者情報リスト */
const InfoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 12px 0;
  color: var(--text-secondary);
  line-height: 2;
`;

/** 運営者情報アイテム */
const InfoItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/** パンくずリスト定義 */
const BREADCRUMB_ITEMS = [
  { label: 'ホーム', path: '/' },
  { label: 'サイトについて' },
] as const;

/** ゲームジャンル一覧 */
const GAME_GENRES = [
  'パズル',
  'シューティング',
  'RPG',
  'レース',
  'ホラー',
  'ストラテジー',
  'アクション',
  'クイズ',
] as const;

/** フィーチャーカードデータ */
const FEATURE_CARDS = [
  { icon: '🎮', title: '13種類のゲーム', description: '多彩なジャンル' },
  { icon: '💰', title: '完全無料', description: '課金要素なし' },
  { icon: '👤', title: '登録不要', description: 'すぐにプレイ' },
] as const;

/**
 * サイトについてページ
 *
 * サイトの概要、特徴、FAQ、免責事項、運営者情報を掲載する。
 * AIO 対策として結論ファースト構造、FAQ セクション、E-E-A-T シグナルを強化。
 * フェーズ 3 でフィーチャーカード、FAQ アコーディオン、ビジュアル装飾を追加。
 */
const AboutPage: React.FC = () => {
  // FAQPage スキーマを <head> に動的挿入
  useFaqSchema(ABOUT_FAQ_ITEMS);

  return (
    <StaticPageLayout
      title="サイトについて"
      icon="ℹ️"
      breadcrumbItems={BREADCRUMB_ITEMS}
      publishDate="2026-03"
      lastUpdated="2026-03-05"
    >
      <section>
        <h3>Game Platform とは</h3>
        <p>
          Game Platform は 13 種類の無料ブラウザゲームが楽しめるプラットフォームです。
        </p>
        <FeatureGrid>
          {FEATURE_CARDS.map((card) => (
            <SectionCard key={card.title} {...card} />
          ))}
        </FeatureGrid>
        <ul>
          <li>完全無料: 課金要素は一切ありません</li>
          <li>登録不要: アカウント作成なしですぐにプレイ</li>
          <li>インストール不要: ブラウザからワンクリックで開始</li>
          <li>多彩なジャンル: パズル、RPG、シューティング、レース、ホラー、ストラテジー</li>
        </ul>
      </section>

      <section>
        <h3>ゲームジャンル</h3>
        <p>
          幅広いジャンルの 13 種類のゲームを提供しています。
        </p>
        <GenreTagContainer>
          {GAME_GENRES.map((genre) => (
            <GenreTag key={genre}>{genre}</GenreTag>
          ))}
        </GenreTagContainer>
      </section>

      <section>
        <h3>よくある質問</h3>
        <FaqAccordion items={ABOUT_FAQ_ITEMS} />
      </section>

      <section>
        <h3>免責事項</h3>
        <WarningBox>
          <WarningList>
            <li>
              本サイトは趣味・学習目的で運営しており、動作環境やパフォーマンスの保証はいたしかねます。
            </li>
            <li>
              一部のゲームには激しい光の点滅や効果音が含まれます。体調に不安のある方はご注意ください。
            </li>
            <li>サービス内容は予告なく変更・終了する可能性があります。</li>
          </WarningList>
        </WarningBox>
      </section>

      <section>
        <h3>運営者情報</h3>
        <p>本サイトは趣味・学習目的で個人運営しているゲームプラットフォームです。</p>
        <InfoList>
          <InfoItem>
            <span aria-hidden="true">🌐</span> サイト名: niku9.click
          </InfoItem>
          <InfoItem>
            <span aria-hidden="true">📧</span> メール: <a href="mailto:contact@niku9.click">contact@niku9.click</a>
          </InfoItem>
          <InfoItem>
            <span aria-hidden="true">🔧</span> 使用技術: React / TypeScript / Web Audio API
          </InfoItem>
        </InfoList>
      </section>
    </StaticPageLayout>
  );
};

export default AboutPage;
