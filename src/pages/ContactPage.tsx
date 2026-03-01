import React, { useMemo } from 'react';
import { StaticPageLayout } from '../components/templates/StaticPageLayout';

/**
 * お問い合わせページ
 * メールアドレスはスパム防止のため JavaScript で動的に組み立てる
 */
const ContactPage: React.FC = () => {
  // スパム防止: メールアドレスを分割して動的に組み立て
  const email = useMemo(() => {
    const user = 'contact';
    const domain = 'niku9.click';
    return `${user}@${domain}`;
  }, []);

  return (
    <StaticPageLayout title="お問い合わせ">
      <h3>メールでのお問い合わせ</h3>
      <p>
        本サイトに関するお問い合わせは、以下のメールアドレスまでご連絡ください。
      </p>
      <p>
        <a href={`mailto:${email}`}>{email}</a>
      </p>

      <h3>ご注意事項</h3>
      <ul>
        <li>スパム防止のため、お問い合わせフォームは設置しておりません。</li>
        <li>返信までにお時間をいただく場合がございます。あらかじめご了承ください。</li>
        <li>お問い合わせ内容によっては、返信いたしかねる場合がございます。</li>
      </ul>
    </StaticPageLayout>
  );
};

export default ContactPage;
