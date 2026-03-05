import React from 'react';
import styled from 'styled-components';
import { StaticPageLayout } from '../components/templates/StaticPageLayout';
import { WarningBox } from '../components/atoms/HighlightBox';

/** 禁止事項リスト（アイコンマーカー付き） */
const ProhibitedList = styled.ol`
  color: var(--text-secondary);
  line-height: 1.8;
  margin: 12px 0;
  padding-left: 24px;

  li::marker {
    color: var(--accent-color);
  }
`;

/** パンくずリスト定義 */
const BREADCRUMB_ITEMS = [
  { label: 'ホーム', path: '/' },
  { label: '利用規約' },
] as const;

/**
 * 利用規約ページ
 *
 * サービスの利用規約を全7条で掲載する。
 * AIO 対策として各条文に要約を配置し、禁止事項・免責事項を強調する。
 * フェーズ 3 で条文装飾、WarningBox、パンくずリストを追加。
 */
const TermsPage: React.FC = () => {
  return (
    <StaticPageLayout
      title="利用規約"
      icon="📋"
      breadcrumbItems={BREADCRUMB_ITEMS}
      publishDate="2026-03"
      lastUpdated="2026-03-05"
    >
      <p>
        この利用規約（以下「本規約」）は、Game Platform（以下「本サイト」）の
        利用条件を定めるものです。本サイトをご利用いただく場合、
        本規約に同意いただいたものとみなします。
      </p>

      <section>
        <h3>第1条 適用</h3>
        <p>
          本規約は、ユーザーと本サイト運営者との間の本サービス利用に関する
          一切の関係に適用されるものとします。
        </p>
      </section>

      <section>
        <h3>第2条 著作権・知的財産権</h3>
        <p>
          本サイトに掲載されているコンテンツ（テキスト、画像、音声、プログラム等）の
          著作権は、本サイト運営者または正当な権利を有する第三者に帰属します。
          オープンソースとして公開している部分を除き、無断での複製、転載、改変を禁止します。
        </p>
      </section>

      <section>
        <h3>第3条 禁止事項</h3>
        <p>ユーザーは、本サイトの利用にあたり、以下の行為を行ってはならないものとします。</p>
        <ProhibitedList>
          <li>不正アクセスまたはその試み</li>
          <li>
            リバースエンジニアリング、逆コンパイル、逆アセンブル等の行為
            （オープンソースとして公開されている部分を除く）
          </li>
          <li>本サイトの運営を妨害する行為</li>
          <li>他のユーザーまたは第三者の権利を侵害する行為</li>
          <li>本サイトのコンテンツを無断で商業目的に利用する行為</li>
          <li>その他、運営者が不適切と判断する行為</li>
        </ProhibitedList>
      </section>

      <section>
        <h3>第4条 サービスの変更・中断・終了</h3>
        <p>
          本サイト運営者は、事前の通知なく、本サービスの内容を変更、中断、
          または終了することができるものとします。これによりユーザーに生じた損害について、
          運営者は一切の責任を負いません。
        </p>
      </section>

      <section>
        <h3>第5条 免責事項</h3>
        <WarningBox>
          <ul>
            <li>
              本サイトは趣味・学習目的で運営しており、コンテンツの正確性、完全性、
              有用性、動作の保証はいたしかねます。
            </li>
            <li>
              ゲームの進行データはブラウザのlocalStorageに保存されます。
              ブラウザの設定変更やキャッシュクリア等により、
              ゲームデータが消失する可能性があります。データの損失について、
              運営者は一切の責任を負いません。
            </li>
            <li>
              本サイトの利用により生じたいかなる損害についても、
              運営者は一切の責任を負いません。
            </li>
          </ul>
        </WarningBox>
      </section>

      <section>
        <h3>第6条 利用規約の変更</h3>
        <p>
          本サイト運営者は、必要と判断した場合、ユーザーに通知することなく本規約を
          変更できるものとします。変更後の利用規約は、本サイトに掲載された時点で
          効力を生じるものとし、変更後に本サイトを利用した場合、
          変更後の利用規約に同意したものとみなします。
        </p>
      </section>

      <section>
        <h3>第7条 準拠法・裁判管轄</h3>
        <p>
          本規約の解釈にあたっては日本法を準拠法とします。
          本サイトに関して紛争が生じた場合には、運営者の所在地を管轄する裁判所を
          専属的合意管轄とします。
        </p>
        <p>
          本規約に関するお問い合わせ: <a href="mailto:contact@niku9.click">contact@niku9.click</a>
        </p>
      </section>
    </StaticPageLayout>
  );
};

export default TermsPage;
