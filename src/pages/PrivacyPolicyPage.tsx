import React from 'react';
import { StaticPageLayout } from '../components/templates/StaticPageLayout';

/**
 * プライバシーポリシーページ
 */
const PrivacyPolicyPage: React.FC = () => {
  return (
    <StaticPageLayout title="プライバシーポリシー">
      <p>
        Game Platform（以下「本サイト」）では、ユーザーの皆さまのプライバシーを尊重し、
        以下の方針に基づいて情報を取り扱います。
      </p>

      <h3>1. 取得する情報</h3>
      <ul>
        <li>
          <strong>アクセス解析情報</strong>: 本サイトではサイト改善のため、アクセス解析ツールを使用する場合があります。
          これにより、匿名の利用状況データ（ページビュー、滞在時間等）が収集されることがあります。
        </li>
        <li>
          <strong>Cookie</strong>: 本サイトではサイトの機能提供および利用状況の分析のために Cookie を使用する場合があります。
        </li>
        <li>
          <strong>ゲーム利用状況</strong>: ゲームの進行状況やスコアなどは、ブラウザの localStorage に保存されます。
          これらのデータはお使いの端末にのみ保存され、サーバーには送信されません。
        </li>
      </ul>

      <h3>2. 利用目的</h3>
      <p>取得した情報は、以下の目的でのみ使用します。</p>
      <ul>
        <li>サイトの利用状況の分析および改善</li>
        <li>ゲーム体験の向上</li>
      </ul>

      <h3>3. 情報の第三者提供</h3>
      <p>
        取得した情報を、法令に基づく場合を除き、第三者に提供することはありません。
      </p>

      <h3>4. Cookie の設定</h3>
      <p>
        Cookie の使用を希望されない場合は、ブラウザの設定から Cookie を無効にすることができます。
        ただし、一部の機能が正常に動作しなくなる可能性があります。
      </p>

      <h3>5. 免責事項</h3>
      <p>
        本サイトからリンクされている外部サイトにおける個人情報の取り扱いについては、
        当該サイトの運営者にお問い合わせください。本サイトでは責任を負いかねます。
      </p>

      <h3>6. 改定</h3>
      <p>
        本ポリシーは、必要に応じて予告なく変更する場合があります。
        変更後のポリシーは本ページに掲載した時点で効力を生じます。
      </p>

      <h3>7. お問い合わせ</h3>
      <p>
        本ポリシーに関するお問い合わせは、下記メールアドレスまでご連絡ください。
      </p>
      <p>メール: contact@niku9.click</p>

      <p style={{ marginTop: '32px', fontSize: '0.85rem', opacity: 0.7 }}>
        制定日: 2026年3月
      </p>
    </StaticPageLayout>
  );
};

export default PrivacyPolicyPage;
