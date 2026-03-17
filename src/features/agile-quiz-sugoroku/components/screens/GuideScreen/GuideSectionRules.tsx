/**
 * ガイドセクション: スプリント工程・難易度・スコアリング関連
 */
import React from 'react';
import { COLORS, FONTS, GRADES, PHASE_GENRE_MAP } from '../../../constants';
import { TAG_MAP } from '../../../questions/tag-master';
import { SectionBox, SectionTitle } from '../../styles';

/** フェーズ表示設定 */
const PHASE_DISPLAY = [
  { phase: 'planning', label: 'プランニング', icon: '📋' },
  { phase: 'impl1', label: '実装', icon: '⌨️' },
  { phase: 'test1', label: 'テスト', icon: '🧪' },
  { phase: 'refinement', label: 'リファインメント', icon: '🔧' },
  { phase: 'review', label: 'レビュー', icon: '📊' },
  { phase: 'emergency', label: '緊急対応', icon: '🚨' },
];

/** スコアリングセクション */
export const ScoringSection: React.FC = () => (
  <SectionBox>
    <SectionTitle>SCORING</SectionTitle>
    <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
      <div>総合スコア = 正答率 × 50% + 安定度 × 30% + 速度 × 20%</div>
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {GRADES.map((g) => (
          <span
            key={g.grade}
            style={{
              padding: '3px 10px', borderRadius: 4,
              border: `1px solid ${g.color}44`, color: g.color,
              fontSize: 11, fontFamily: FONTS.mono, fontWeight: 700,
            }}
          >
            {g.grade} ({g.min}+) {g.label}
          </span>
        ))}
      </div>
    </div>
  </SectionBox>
);

/** スプリント工程とジャンルセクション */
export const SprintPhasesSection: React.FC = () => (
  <SectionBox>
    <SectionTitle>SPRINT PHASES & GENRES</SectionTitle>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {PHASE_DISPLAY.map(({ phase, label, icon }) => {
        const tags = PHASE_GENRE_MAP[phase] ?? [];
        return (
          <div
            key={phase}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '6px 8px', background: `${COLORS.bg}99`,
              borderRadius: 6, border: `1px solid ${COLORS.border}33`,
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
                        fontSize: 10, padding: '1px 6px', borderRadius: 3,
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
);

/** 難易度セクション */
export const DifficultySection: React.FC = () => (
  <SectionBox>
    <SectionTitle>DIFFICULTY</SectionTitle>
    <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
      <div>タイトル画面で4段階の難易度を選択できます。</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {[
        { name: 'Easy', color: COLORS.green, desc: '制限時間20秒 / 負債0.5倍 / ヒント機能付き' },
        { name: 'Normal', color: COLORS.accent, desc: '制限時間15秒 / 標準設定' },
        { name: 'Hard', color: COLORS.orange, desc: '制限時間10秒 / 負債2倍 / 緊急対応+20% / グレードボーナス1.1倍' },
        { name: 'Extreme', color: '#f06070', desc: '制限時間8秒 / 負債3倍 / 1ミスで負債+15 / グレードボーナス1.2倍' },
      ].map(d => (
        <div key={d.name} style={{
          padding: '6px 10px', borderRadius: 6,
          background: `${d.color}08`, border: `1px solid ${d.color}22`,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: d.color, fontFamily: FONTS.mono, minWidth: 56 }}>
            {d.name}
          </span>
          <span style={{ fontSize: 11, color: COLORS.muted }}>{d.desc}</span>
        </div>
      ))}
    </div>
  </SectionBox>
);
