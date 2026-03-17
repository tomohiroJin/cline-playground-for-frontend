/**
 * ガイドセクションコンポーネント
 * ゲーム説明の各セクションを表示する再利用可能コンポーネント
 */
import React from 'react';
import { COLORS, FONTS, CONFIG } from '../../../constants';
import {
  SectionBox,
  SectionTitle,
  Divider,
} from '../../styles';

// 分割ファイルから再エクスポート
export { TeamSection, TeamTypesSection } from './GuideSectionTeam';
export { ScoringSection, SprintPhasesSection, DifficultySection } from './GuideSectionRules';

/** ガイドヘッダー */
export const GuideHeader: React.FC = () => (
  <div style={{ textAlign: 'center', marginBottom: 20 }}>
    <div style={{
      fontSize: 10,
      color: COLORS.accent,
      letterSpacing: 3,
      fontFamily: FONTS.mono,
      fontWeight: 700,
    }}>
      GUIDE & TEAM
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text2, marginTop: 6 }}>
      遊び方 & チーム紹介
    </div>
    <Divider />
  </div>
);

/** ゲーム概要セクション */
export const AboutSection: React.FC = () => (
  <SectionBox>
    <SectionTitle>ABOUT</SectionTitle>
    <div style={{ fontSize: 12.5, color: COLORS.text, lineHeight: 1.8 }}>
      アジャイル・クイズすごろくは、スクラム・設計原則・テスト・CI/CD・障害対応など
      ソフトウェア開発の知識を楽しく学べるクイズゲームです。
      全366問・16ジャンルの4択クイズに挑戦しましょう。
    </div>
  </SectionBox>
);

/** 遊び方セクション */
export const HowToPlaySection: React.FC = () => (
  <SectionBox>
    <SectionTitle>HOW TO PLAY</SectionTitle>
    <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
      <div>1. タイトル画面でスプリント数を選び「Sprint Start」を押してゲーム開始</div>
      <div>2. 選んだ数のスプリント（デフォルト{CONFIG.sprintCount}）をそれぞれ7イベントずつ進行</div>
      <div>3. 各イベントで4択クイズに制限時間内に回答（難易度で変動）</div>
      <div>4. スプリント終了ごとに振り返り画面で成績確認</div>
      <div>5. 全スプリント完了後、総合結果とチームタイプを発表</div>
    </div>
  </SectionBox>
);

/** ルールセクション */
export const RulesSection: React.FC = () => (
  <SectionBox>
    <SectionTitle>RULES</SectionTitle>
    <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
      <div>⏱️ <strong>制限時間</strong>: 難易度により8〜20秒（Normal: {CONFIG.timeLimit}秒）。時間切れは不正解扱い</div>
      <div>⚠️ <strong>技術的負債</strong>: 実装・テスト・リファインメントで不正解だと負債が蓄積</div>
      <div>🚨 <strong>緊急対応</strong>: 負債が溜まるほど緊急イベント発生率が上昇</div>
      <div>🔥 <strong>コンボ</strong>: 連続正解でコンボボーナス。連鎖を維持しよう</div>
    </div>
  </SectionBox>
);

/** テキストセクション（チャレンジモード、実績、履歴、勉強会共用） */
export const TextSection: React.FC<{ title: string; lines: string[] }> = ({ title, lines }) => (
  <SectionBox>
    <SectionTitle>{title}</SectionTitle>
    <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  </SectionBox>
);
