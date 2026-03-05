import React from 'react';
import { StaticPageLayout } from '../components/templates/StaticPageLayout';
import { ABOUT_FAQ_ITEMS } from '../constants/game-seo-data';
import { useFaqSchema } from '../hooks/useFaqSchema';

/**
 * サイトについてページ
 *
 * サイトの概要、特徴、FAQ、免責事項、運営者情報を掲載する。
 * AIO 対策として結論ファースト構造、FAQ セクション、E-E-A-T シグナルを強化。
 */
const AboutPage: React.FC = () => {
  // FAQPage スキーマを <head> に動的挿入
  useFaqSchema(ABOUT_FAQ_ITEMS);

  return (
    <StaticPageLayout title="サイトについて" publishDate="2026-03" lastUpdated="2026-03-05">
      <section>
        <h3>Game Platform とは</h3>
        <p>
          Game Platform は 13 種類の無料ブラウザゲームが楽しめるプラットフォームです。
        </p>
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
          パズル / シューティング / RPG / レース / ホラー / ストラテジー / アクション / クイズ
          など、幅広いジャンルの 13 種類のゲームを提供しています。
        </p>
      </section>

      <section>
        <h3>よくある質問</h3>
        <dl>
          {ABOUT_FAQ_ITEMS.map((faq) => (
            <React.Fragment key={faq.question}>
              <dt>{faq.question}</dt>
              <dd>{faq.answer}</dd>
            </React.Fragment>
          ))}
        </dl>
      </section>

      <section>
        <h3>免責事項</h3>
        <ul>
          <li>
            本サイトは趣味・学習目的で運営しており、動作環境やパフォーマンスの保証はいたしかねます。
          </li>
          <li>
            一部のゲームには激しい光の点滅や効果音が含まれます。体調に不安のある方はご注意ください。
          </li>
          <li>サービス内容は予告なく変更・終了する可能性があります。</li>
        </ul>
      </section>

      <section>
        <h3>運営者情報</h3>
        <p>本サイトは趣味・学習目的で個人運営しているゲームプラットフォームです。</p>
        <ul>
          <li>サイト名: niku9.click</li>
          <li>URL: https://niku9.click/</li>
          <li>メール: <a href="mailto:contact@niku9.click">contact@niku9.click</a></li>
          <li>使用技術: React / TypeScript / Web Audio API</li>
        </ul>
      </section>
    </StaticPageLayout>
  );
};

export default AboutPage;
