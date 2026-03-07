/**
 * スプリント開始画面コンポーネント
 */
import React, { useMemo } from 'react';
import { useKeys } from '../hooks';
import { GameStats, DerivedStats } from '../types';
import {
  CONFIG,
  EVENTS,
  COLORS,
  getColorByThreshold,
  getInverseColorByThreshold,
} from '../constants';
import { getComboColor } from '../combo-color';
import { AQS_IMAGES } from '../images';
import { getNarrativeComment } from '../character-narrative';
import { ParticleEffect } from './ParticleEffect';
import {
  PageWrapper,
  Panel,
  SectionBox,
  SectionTitle,
  Button,
  HotkeyHint,
  Scanlines,
  SprintNumber,
  StatsGrid,
  StatBox,
  StatIcon,
  StatLabel,
  StatValue,
  WarningBox,
  EventListItem,
  EventListIcon,
  EventListName,
  EventListDescription,
} from './styles';

interface SprintStartScreenProps {
  /** スプリント番号（0始まり） */
  sprint: number;
  /** 現在のゲーム統計 */
  stats: GameStats;
  /** 派生統計 */
  derived: DerivedStats;
  /** 表示状態 */
  visible: boolean;
  /** 開始時のコールバック */
  onBegin: () => void;
}

/**
 * スプリント開始画面
 */
export const SprintStartScreen: React.FC<SprintStartScreenProps> = ({
  sprint,
  stats,
  derived,
  visible,
  onBegin,
}) => {
  // キャラクターナラティブ
  const narrative = useMemo(() => getNarrativeComment({
    sprintNumber: sprint + 1,
    phase: 'sprintStart',
    correctRate: derived.correctRate,
    debt: stats.debt,
  }), [sprint, derived.correctRate, stats.debt]);

  const narrativeCharImg = AQS_IMAGES.characters[narrative.characterId as keyof typeof AQS_IMAGES.characters];

  useKeys((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onBegin();
    }
  });

  return (
    <PageWrapper>
      <ParticleEffect />
      <Scanlines />
      <Panel $visible={visible}>
        <div style={{
          width: '100%',
          height: 120,
          backgroundImage: `url(${AQS_IMAGES.sprintStart})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
          borderRadius: 8,
          marginBottom: 16,
        }} />

        {/* スプリント番号表示 */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              fontSize: 10,
              color: COLORS.muted,
              letterSpacing: 3,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            SPRINT
          </div>
          <SprintNumber>
            {sprint + 1}
            <span style={{ fontSize: 22, color: COLORS.muted, fontWeight: 400 }}>
              /{CONFIG.sprintCount}
            </span>
          </SprintNumber>
        </div>

        {/* 2スプリント目以降はステータス表示 */}
        {sprint > 0 && (
          <SectionBox>
            <SectionTitle>STATUS</SectionTitle>
            <StatsGrid>
              <StatBox $color={getColorByThreshold(derived.correctRate, 70, 50)}>
                <StatIcon>🎯</StatIcon>
                <StatLabel>正答率</StatLabel>
                <StatValue $color={getColorByThreshold(derived.correctRate, 70, 50)}>
                  {derived.correctRate}%
                </StatValue>
              </StatBox>
              <StatBox $color={getInverseColorByThreshold(stats.debt, 10, 25)}>
                <StatIcon>⚠️</StatIcon>
                <StatLabel>負債</StatLabel>
                <StatValue $color={getInverseColorByThreshold(stats.debt, 10, 25)}>
                  {stats.debt}pt
                </StatValue>
              </StatBox>
              <StatBox $color={getComboColor(stats.maxCombo)}>
                <StatIcon>🔥</StatIcon>
                <StatLabel>Max Combo</StatLabel>
                <StatValue $color={getComboColor(stats.maxCombo)}>
                  {stats.maxCombo}
                </StatValue>
              </StatBox>
            </StatsGrid>
            {stats.debt > 15 && (
              <WarningBox>
                ⚠ 負債蓄積中 — 緊急対応の発生確率が上昇しています
              </WarningBox>
            )}
          </SectionBox>
        )}

        {/* イベント一覧 */}
        <SectionBox>
          <SectionTitle>SPRINT EVENTS</SectionTitle>
          {EVENTS.map((ev, i) => (
            <EventListItem key={i}>
              <EventListIcon>{ev.icon}</EventListIcon>
              <EventListName>{ev.name}</EventListName>
              <EventListDescription>{ev.description}</EventListDescription>
            </EventListItem>
          ))}
        </SectionBox>

        {/* キャラクターナラティブ */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          marginBottom: 16,
          background: `${COLORS.accent}08`,
          borderRadius: 8,
          border: `1px solid ${COLORS.accent}18`,
        }}>
          {narrativeCharImg ? (
            <img
              src={narrativeCharImg}
              alt=""
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />
          ) : (
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: `${COLORS.accent}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}>
              ?
            </div>
          )}
          <div style={{
            fontSize: 12,
            color: COLORS.text,
            lineHeight: 1.5,
          }}>
            {narrative.text}
          </div>
        </div>

        {/* 開始ボタン */}
        <div style={{ textAlign: 'center' }}>
          <Button onClick={onBegin} style={{ padding: '14px 44px' }}>
            ▶ Begin Sprint {sprint + 1}
            <HotkeyHint>[Enter]</HotkeyHint>
          </Button>
        </div>
      </Panel>
    </PageWrapper>
  );
};
