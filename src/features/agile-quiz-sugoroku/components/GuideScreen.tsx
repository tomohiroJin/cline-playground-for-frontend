/**
 * 遊び方 & チーム紹介画面
 */
import React from 'react';
import { useKeys } from '../hooks';
import { COLORS, FONTS, CONFIG, ENGINEER_TYPES, GRADES, PHASE_GENRE_MAP } from '../constants';
import { TAG_MAP } from '../questions/tag-master';
import { AQS_IMAGES } from '../images';
import { CHARACTER_PROFILES } from '../character-profiles';
import {
  PageWrapper,
  ScrollablePanel,
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
      <ScrollablePanel $fadeIn={false} style={{ maxWidth: 600 }}>
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
            全366問・16ジャンルの4択クイズに挑戦しましょう。
          </div>
        </SectionBox>

        {/* チームメンバー */}
        <SectionBox>
          <SectionTitle>TEAM</SectionTitle>
          {AQS_IMAGES.characters.team ? (
            <img
              src={AQS_IMAGES.characters.team}
              alt="チームバナー"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: 8,
                marginBottom: 12,
              }}
            />
          ) : null}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CHARACTER_PROFILES.map((char) => {
              const imgSrc = AQS_IMAGES.characters[char.id as keyof typeof AQS_IMAGES.characters];
              return (
                <div
                  key={char.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px',
                    background: `${char.color}08`,
                    borderRadius: 10,
                    border: `1px solid ${char.color}22`,
                    alignItems: 'flex-start',
                  }}
                >
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={char.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          const emoji = document.createElement('div');
                          emoji.textContent = char.emoji;
                          emoji.style.fontSize = '32px';
                          emoji.style.minWidth = '48px';
                          emoji.style.textAlign = 'center';
                          parent.prepend(emoji);
                        }
                      }}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `2px solid ${char.color}`,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 32, minWidth: 48, textAlign: 'center', flexShrink: 0 }}>
                      {char.emoji}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: char.color, marginBottom: 2 }}>
                      {char.emoji} {char.name}
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 6, fontFamily: FONTS.mono }}>
                      {char.role}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.text, lineHeight: 1.6, marginBottom: 6 }}>
                      {char.personality}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
                      {char.skills.map((skill) => (
                        <span
                          key={skill}
                          style={{
                            fontSize: 9,
                            padding: '1px 6px',
                            borderRadius: 3,
                            background: `${char.color}15`,
                            color: char.color,
                            border: `1px solid ${char.color}22`,
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: char.color, fontStyle: 'italic', lineHeight: 1.5 }}>
                      {char.catchphrase}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionBox>

        {/* 遊び方 */}
        <SectionBox>
          <SectionTitle>HOW TO PLAY</SectionTitle>
          <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
            <div>1. タイトル画面でスプリント数を選び「Sprint Start」を押してゲーム開始</div>
            <div>2. 選んだ数のスプリント（デフォルト{CONFIG.sprintCount}）をそれぞれ7イベントずつ進行</div>
            <div>3. 各イベントで4択クイズに制限時間内に回答（難易度で変動）</div>
            <div>4. スプリント終了ごとに振り返り画面で成績確認</div>
            <div>5. 全スプリント完了後、総合結果とエンジニアタイプを発表</div>
          </div>
        </SectionBox>

        {/* ルール */}
        <SectionBox>
          <SectionTitle>RULES</SectionTitle>
          <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
            <div>⏱️ <strong>制限時間</strong>: 難易度により8〜20秒（Normal: {CONFIG.timeLimit}秒）。時間切れは不正解扱い</div>
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
                        width: 52,
                        height: 52,
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

        {/* 難易度 */}
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

        {/* チャレンジモード */}
        <SectionBox>
          <SectionTitle>CHALLENGE MODE</SectionTitle>
          <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
            <div>タイトル画面の「Challenge」ボタンから挑戦できます。</div>
            <div>・1問でも不正解になると即終了のサバイバルモード</div>
            <div>・全ジャンルからランダムに出題</div>
            <div>・正解数がそのままスコアとしてハイスコア保存</div>
            <div>・制限時間は通常モードと同じ{CONFIG.timeLimit}秒</div>
          </div>
        </SectionBox>

        {/* 実績 */}
        <SectionBox>
          <SectionTitle>ACHIEVEMENTS</SectionTitle>
          <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
            <div>タイトル画面の「実績」ボタンから一覧を確認できます。</div>
            <div>・全20種類の実績をコンプリートしよう</div>
            <div>・実績はBronze / Silver / Gold / Platinumの4段階のレア度</div>
            <div>・ゲームクリア時に条件を満たすと自動で獲得</div>
            <div>・繰り返しプレイで獲得できる継続系の実績もあり</div>
          </div>
        </SectionBox>

        {/* 履歴 */}
        <SectionBox>
          <SectionTitle>HISTORY</SectionTitle>
          <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
            <div>タイトル画面の「履歴」ボタンからプレイ履歴を確認できます。</div>
            <div>・過去最大10回分のプレイ結果を保存</div>
            <div>・正答率や回答速度の推移をグラフで確認</div>
            <div>・最高グレードや獲得チームタイプの履歴表示</div>
          </div>
        </SectionBox>

        {/* 勉強会モード */}
        <SectionBox>
          <SectionTitle>STUDY MODE</SectionTitle>
          <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 2 }}>
            <div>タイトル画面の「勉強会モード」から利用可能です。</div>
            <div>・スプリント工程別 or 個別ジャンルを選択</div>
            <div>・問題数を10問/20問/50問から選択</div>
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
      </ScrollablePanel>
    </PageWrapper>
  );
};
