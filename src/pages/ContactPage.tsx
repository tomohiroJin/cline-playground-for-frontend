import React, { useMemo } from 'react';
import styled from 'styled-components';
import { StaticPageLayout } from '../components/templates/StaticPageLayout';

/** コンタクトカード */
const ContactCard = styled.div`
  background: rgba(0, 210, 255, 0.05);
  border: 1px solid rgba(0, 210, 255, 0.2);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  margin: 24px 0;
`;

/** メールアイコン */
const EmailIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 12px;
`;

/** メールアドレス表示 */
const EmailAddress = styled.div`
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 16px;
`;

/** メール送信ボタン */
const EmailButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #00d2ff, #a855f7);
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s, transform 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    color: #fff;
    text-decoration: none;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;

/** パンくずリスト定義 */
const BREADCRUMB_ITEMS = [
  { label: 'ホーム', path: '/' },
  { label: 'お問い合わせ' },
] as const;

/**
 * お問い合わせページ
 *
 * メールアドレスのみの案内。スパム防止のため、
 * メールアドレスは JavaScript で動的に組み立てる。
 * AIO 対策として連絡先情報を結論ファーストで配置。
 * フェーズ 3 でコンタクトカード、メールボタン、パンくずリストを追加。
 */
const ContactPage: React.FC = () => {
  // スパム防止: メールアドレスを動的に組み立て
  const email = useMemo(() => {
    const user = 'contact';
    const domain = 'niku9.click';
    return `${user}@${domain}`;
  }, []);

  return (
    <StaticPageLayout
      title="お問い合わせ"
      icon="✉️"
      breadcrumbItems={BREADCRUMB_ITEMS}
      publishDate="2026-03"
      lastUpdated="2026-03-05"
    >
      <section>
        <h3>お問い合わせ方法</h3>
        <p>
          本サイトに関するお問い合わせは、以下のメールアドレスまでご連絡ください。
        </p>
        <ContactCard>
          <EmailIcon>📧</EmailIcon>
          <EmailAddress>{email}</EmailAddress>
          <EmailButton href={`mailto:${email}`}>
            メールを送信
          </EmailButton>
        </ContactCard>
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
