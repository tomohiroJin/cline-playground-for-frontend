import React from 'react';
import { StaticPageLayout } from '../components/templates/StaticPageLayout';

/**
 * サイトについてページ
 */
const AboutPage: React.FC = () => {
  return (
    <StaticPageLayout title="サイトについて">
      <h3>Game Platform とは</h3>
      <p>
        Game Platform は、ブラウザだけで遊べる無料のゲームプラットフォームです。
        ユーザー登録やアプリのインストールは不要。サイトにアクセスするだけで、すぐにゲームを楽しめます。
      </p>

      <h3>特徴</h3>
      <ul>
        <li>ブラウザだけで遊べる — インストール不要</li>
        <li>完全無料 — 課金要素はありません</li>
        <li>13種類のゲーム — パズル、シューティング、RPG、レース、ホラーなど多彩なジャンル</li>
        <li>ユーザー登録不要 — 個人情報の入力なしでプレイ可能</li>
      </ul>

      <h3>免責事項</h3>
      <ul>
        <li>本サイトは趣味・学習目的で運営しており、動作環境やパフォーマンスの保証はいたしません。</li>
        <li>一部のゲームには激しい光の点滅や効果音が含まれます。体調にご注意のうえご利用ください。</li>
        <li>サービス内容は予告なく変更・終了する場合があります。</li>
      </ul>

      <h3>運営者情報</h3>
      <p>運営: niku9.click</p>
    </StaticPageLayout>
  );
};

export default AboutPage;
