/**
 * 遊び方 & チーム紹介画面
 */
import React from 'react';
import { useKeys } from '../hooks';
import { COLORS, FONTS, CONFIG, ENGINEER_TYPES, GRADES, PHASE_GENRE_MAP } from '../constants';
import { TAG_MAP } from '../questions/tag-master';
import { AQS_IMAGES } from '../images';
import {
  PageWrapper,
  Panel,
  SectionBox,
  SectionTitle,
  Button,
  HotkeyHint,
  Scanlines,
  Divider,
} from './styles';

interface GuideScreenProps {
  onBack: () => void;
}

const PHASE_DISPLAY = [
  { phase: 'planning', label: 'プランニング', icon: '📋' },
  { phase: 'impl1', label: '実装', icon: '⌨️' },
  { phase: 'test1', label: 'テスト', icon: '🧪' },
  { phase: 'refinement', label: 'リファインメント', icon: '🔧' },
  { phase: 'review', label: 'レビュー', icon: '📊' },
  { phase: 'emergency', label: '緊急対応', icon: '🚨' },
];

export const GuideScreen: React.FC<GuideScreenProps> = ({ onBack }) => {
  useKeys((e) => {
    if (e.key === 'Escape') {
      onBack();
    }
  });

  return (
    <PageWrapper>
      <Scanlines />
      <Panel $fadeIn={false} style={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              color: COLORS.accent,
              letterSpacing: 3,
              fontFamily: FONTS.mono,
              fontWeight: 700,
            }}
          >
            GUIDE & TEAM
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.text2, marginTop: 6 }}>
            遊び方 & チーム紹介
          </div>
          <Divider />
        </div>

        {/* ゲーム概要 */}
        <SectionBox>
          <SectionTitle>ABOUT</SectionTitle>
          <div style={{ fontSize: 12.5, color: COLORS.text, lineHeight: 1.8 }}>
            アジャイル・クイズすごろくは、スクラム・設計原則・テスト・CI/CD・障害対応など
            ソフトウェア開発の知識を楽しく学べるクイズゲームです。
            全306問・16ジャンルの4択クイズに挑戦しましょう。
          </div>
        </SectionBox>

        {/* 遊び方 */}
        <SectionBox>
          <SectionTitle>HOW TO PLAY</SectionTitle>
          <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
            <div>1. タイトル画面で「Sprint Start」を押してゲーム開始</div>
            <div>2. {CONFIG.sprintCount}つのスプリントをそれぞれ7イベントずつ進行</div>
            <div>3. 各イベントで4択クイズに{CONFIG.timeLimit}秒以内に回答</div>
            <div>4. スプリント終了ごとに振り返り画面で成績確認</div>
            <div>5. 全スプリント完了後、総合結果とエンジニアタイプを発表</div>
          </div>
        </SectionBox>

        {/* ルール */}
        <SectionBox>
          <SectionTitle>RULES</SectionTitle>
          <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
            <div>⏱️ <strong>制限時間</strong>: 各問題{CONFIG.timeLimit}秒。時間切れは不正解扱い</div>
            <div>⚠️ <strong>技術的負債</strong>: 実装・テスト・リファインメントで不正解だと負債が蓄積</div>
            <div>🚨 <strong>緊急対応</strong>: 負債が溜まるほど緊急イベント発生率が上昇</div>
            <div>🔥 <strong>コンボ</strong>: 連続正解でコンボボーナス。連鎖を維持しよう</div>
          </div>
        </SectionBox>

        {/* スコアリング */}
        <SectionBox>
          <SectionTitle>SCORING</SectionTitle>
          <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
            <div>総合スコア = 正答率 × 50% + 安定度 × 30% + 速度 × 20%</div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GRADES.map((g) => (
                <span
                  key={g.grade}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    border: `1px solid ${g.color}44`,
                    color: g.color,
                    fontSize: 11,
                    fontFamily: FONTS.mono,
                    fontWeight: 700,
                  }}
                >
                  {g.grade} ({g.min}+) {g.label}
                </span>
              ))}
            </div>
          </div>
        </SectionBox>

        {/* スプリント工程とジャンル */}
        <SectionBox>
          <SectionTitle>SPRINT PHASES & GENRES</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PHASE_DISPLAY.map(({ phase, label, icon }) => {
              const tags = PHASE_GENRE_MAP[phase] ?? [];
              return (
                <div
                  key={phase}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '6px 8px',
                    background: `${COLORS.bg}99`,
                    borderRadius: 6,
                    border: `1px solid ${COLORS.border}33`,
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1.4 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text2, marginBottom: 4 }}>
                      {label}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      {tags.map((tagId) => {
                        const tag = TAG_MAP.get(tagId);
                        return (
                          <span
                            key={tagId}
                            style={{
                              fontSize: 10,
                              padding: '1px 6px',
                              borderRadius: 3,
                              background: `${tag?.color ?? COLORS.accent}15`,
                              color: tag?.color ?? COLORS.accent,
                              border: `1px solid ${tag?.color ?? COLORS.accent}22`,
                            }}
                          >
                            {tag?.name ?? tagId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionBox>

        {/* チーム紹介 */}
        <SectionBox>
          <SectionTitle>ENGINEER TYPES</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ENGINEER_TYPES.map((type) => {
              const imgSrc = AQS_IMAGES.types[type.id as keyof typeof AQS_IMAGES.types];
              return (
                <div
                  key={type.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px',
                    background: `${type.color}08`,
                    borderRadius: 10,
                    border: `1px solid ${type.color}22`,
                    alignItems: 'center',
                  }}
                >
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={type.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          const emoji = document.createElement('div');
                          emoji.textContent = type.emoji;
                          emoji.style.fontSize = '32px';
                          emoji.style.minWidth = '48px';
                          emoji.style.textAlign = 'center';
                          parent.prepend(emoji);
                        }
                      }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `2px solid ${type.color}`,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 32, minWidth: 48, textAlign: 'center', flexShrink: 0 }}>
                      {type.emoji}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: type.color, marginBottom: 4 }}>
                      {type.name}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.6 }}>
                      {type.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionBox>

        {/* 勉強会モード */}
        <SectionBox>
          <SectionTitle>STUDY MODE</SectionTitle>
          <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
            <div>タイトル画面の「勉強会モード」から利用可能です。</div>
            <div>・スプリント工程別 or 個別ジャンルを選択</div>
            <div>・問題数を10問/20問/全問から選択</div>
            <div>・制限時間なしでじっくり学習</div>
            <div>・回答後すぐに解説を確認</div>
            <div>・苦手ジャンルは前回結果から自動提案</div>
          </div>
        </SectionBox>

        {/* 戻るボタン */}
        <div style={{ textAlign: 'center' }}>
          <Button $color={COLORS.accent} onClick={onBack}>
            ← タイトルに戻る
            <HotkeyHint>[Esc]</HotkeyHint>
          </Button>
        </div>
      </Panel>
    </PageWrapper>
  );
};
