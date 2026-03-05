import React, { useMemo } from 'react';
import { StaticPageLayout } from '../components/templates/StaticPageLayout';

/**
 * お問い合わせページ
 *
 * メールアドレスのみの案内。スパム防止のため、
 * メールアドレスは JavaScript で動的に組み立てる。
 * AIO 対策として連絡先情報を結論ファーストで配置。
 */
const ContactPage: React.FC = () => {
  // スパム防止: メールアドレスを動的に組み立て
  const email = useMemo(() => {
    const user = 'contact';
    const domain = 'niku9.click';
    return `${user}@${domain}`;
  }, []);

  return (
    <StaticPageLayout title="お問い合わせ" publishDate="2026-03" lastUpdated="2026-03-05">
      <section>
        <h3>お問い合わせ方法</h3>
        <p>
          本サイトに関するお問い合わせは、以下のメールアドレスまでご連絡ください。
        </p>
        <p>
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      </section>

      <section>
        <h3>注記</h3>
        <ul>
          <li>スパム防止のため、お問い合わせフォームは設置しておりません。</li>
          <li>返信までにお時間をいただく場合がございます。あらかじめご了承ください。</li>
          <li>お問い合わせ内容によっては、返信いたしかねる場合がございます。</li>
        </ul>
      </section>
    </StaticPageLayout>
  );
};

export default ContactPage;
