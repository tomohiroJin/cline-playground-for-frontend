/**
 * VS 画面コンポーネント
 * P1-05: VsScreen 演出強化
 *
 * アニメーションシーケンス（合計3秒）:
 *   Phase 1 (0ms)         : グラデーション背景フェードイン
 *   Phase 2 (200〜800ms)  : キャラ左右からスライドイン（ease-out）
 *   Phase 3 (800ms)       : VS テキスト スケールアップ + バウンス
 *   Phase 4 (1000ms)      : ステージ名・フィールド名フェードイン
 *   Phase 5 (1000〜2500ms): 全要素表示で待機
 *   Phase 6 (2500〜3000ms): 全体フェードアウト
 *   Phase 7 (3000ms)      : onComplete()
 */
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import type { Character } from '../core/types';
import { AH_STRINGS } from '../core/i18n-strings';
import { AH_TOKENS } from '../core/design-tokens';
import { useReducedMotion } from '../hooks/useReducedMotion';

/** アニメーションタイミング定数 */
const CHAR_SLIDE_START_MS = 200;
const CHAR_SLIDE_DURATION_MS = 600;
const VS_TEXT_APPEAR_MS = 800;
const INFO_APPEAR_MS = 1000;
const FADE_OUT_START_MS = 2500;
const TOTAL_DURATION_MS = 3000;

/** スライドイン距離（px） */
const SLIDE_OFFSET = 256;

/** 背景グラデーションの透明度 */
const GRADIENT_ALPHA = 0.3;

/** VS用立ち絵のパスを取得 */
const getVsImageSrc = (character: Character): string => {
  return character.vsImage ?? character.icon;
};

/** HEX カラー（#RGB or #RRGGBB）を rgba 文字列に変換 */
const hexToRgba = (hex: string, alpha: number): string => {
  const normalized = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** ラベルスタイル定数（v4: AH_TOKENS を参照、Gemini M1 レビュー高優先度対応） */
const LABEL_FONT_SIZE = '12px';
const LABEL_COLOR_CPU = AH_TOKENS.label.cpu;
const TEAM1_COLOR = AH_TOKENS.team.a;
const TEAM2_COLOR = AH_TOKENS.team.b;

/**
 * 2v2 チーム対戦レイアウト（S9-A1: モバイルレスポンシブ対応）
 *
 * - 600px 以上: 横 1 列 [P1+P2] VS [P3+P4]
 * - 600px 未満: 縦積み
 *     [P1+P2]
 *        VS
 *     [P3+P4]
 */
const VsTeamsLayout = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: ${AH_TOKENS.vs.mobileBreakpoint}) {
    flex-direction: column;
    gap: 12px;
  }
`;

/** キャラクター立ち絵パネル */
const CharacterPanel: React.FC<{
  character: Character;
  translateX?: number;
  prefersReducedMotion?: boolean;
  label?: string;
  labelColor?: string;
  labelBold?: boolean;
  /** aria-label（スクリーンリーダー向け、ラベルの意味を説明） */
  labelAriaLabel?: string;
}> = ({ character, translateX = 0, prefersReducedMotion = false, label, labelColor, labelBold, labelAriaLabel }) => {
  const hasPortrait = Boolean(character.portrait);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          transform: `translateX(${translateX}px)`,
          transition: prefersReducedMotion ? 'none' : `transform ${CHAR_SLIDE_DURATION_MS}ms ease-out`,
        }}
      >
        <img
          src={getVsImageSrc(character)}
          alt={`${character.name} 立ち絵`}
          style={{
            width: hasPortrait ? 256 : 128,
            height: hasPortrait ? 512 : 128,
            objectFit: 'contain',
          }}
        />
      </div>
      <span
        style={{
          color: character.color,
          fontWeight: 'bold',
          fontSize: '24px',
          textShadow: `0 0 10px ${character.color}`,
        }}
      >
        {character.name}
      </span>
      {label && (
        <span
          aria-label={labelAriaLabel}
          style={{
            fontSize: LABEL_FONT_SIZE,
            color: labelColor ?? LABEL_COLOR_CPU,
            fontWeight: labelBold ? 'bold' : 'normal',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

/** プレイヤースロット ID（内部語彙） */
type PlayerSlotId = 'p2' | 'p3' | 'p4';

/**
 * 操作タイプからラベル情報を導出（S9-A3: 内部語彙と表示を分離）
 *
 * - 内部語彙: 'p2' / 'p3' / 'p4'
 * - 表示文字列: `AH_STRINGS.player.*`（'P2' / 'P3' / 'P4'）
 * - aria-label: `AH_STRINGS.playerAria.*`（詳細な操作説明）
 */
const resolveControlLabel = (
  controlType: 'cpu' | 'human' | undefined,
  slotId: PlayerSlotId,
  teamColor: string,
): { label?: string; labelColor?: string; labelBold?: boolean; labelAriaLabel?: string } => {
  if (controlType == null) return {};
  if (controlType === 'cpu') {
    return {
      label: AH_STRINGS.common.cpu,
      labelColor: LABEL_COLOR_CPU,
      labelAriaLabel: AH_STRINGS.playerAria.cpu,
    };
  }
  const playerKey = slotId === 'p2' ? 'p2' : slotId === 'p3' ? 'p3' : 'p4';
  const ariaKey = `${playerKey}Human` as 'p2Human' | 'p3Human' | 'p4Human';
  return {
    label: AH_STRINGS.player[playerKey],
    labelColor: teamColor,
    labelBold: true,
    labelAriaLabel: AH_STRINGS.playerAria[ariaKey],
  };
};

type VsScreenProps = {
  playerCharacter: Character;
  cpuCharacter: Character;
  stageName: string;
  fieldName: string;
  onComplete: () => void;
  /** 2v2 モード表示 */
  is2v2?: boolean;
  /** P2: 味方キャラ（2v2 時） */
  allyCharacter?: Character;
  /** P4: 敵2キャラ（2v2 時） */
  enemyCharacter2?: Character;
  /** P2 の操作タイプ（2v2 時） */
  allyControlType?: 'cpu' | 'human';
  /** P3 の操作タイプ（2v2 時） */
  enemy1ControlType?: 'cpu' | 'human';
  /** P4 の操作タイプ（2v2 時） */
  enemy2ControlType?: 'cpu' | 'human';
};

export const VsScreen: React.FC<VsScreenProps> = ({
  playerCharacter,
  cpuCharacter,
  stageName,
  fieldName,
  onComplete,
  is2v2,
  allyCharacter,
  enemyCharacter2,
  allyControlType,
  enemy1ControlType,
  enemy2ControlType,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const [bgOpacity, setBgOpacity] = useState(prefersReducedMotion ? 1 : 0);
  const [isSlideComplete, setIsSlideComplete] = useState(prefersReducedMotion);
  const [isVsVisible, setIsVsVisible] = useState(prefersReducedMotion);
  const [isInfoVisible, setIsInfoVisible] = useState(prefersReducedMotion);
  const [isFadeOut, setIsFadeOut] = useState(false);

  useEffect(() => {
    const bgTimer = requestAnimationFrame(() => setBgOpacity(1));
    const slideTimer = setTimeout(() => setIsSlideComplete(true), CHAR_SLIDE_START_MS);
    const vsTimer = setTimeout(() => setIsVsVisible(true), VS_TEXT_APPEAR_MS);
    const infoTimer = setTimeout(() => setIsInfoVisible(true), INFO_APPEAR_MS);
    const fadeOutTimer = setTimeout(() => setIsFadeOut(true), FADE_OUT_START_MS);
    const completeTimer = setTimeout(onComplete, TOTAL_DURATION_MS);

    return () => {
      cancelAnimationFrame(bgTimer);
      clearTimeout(slideTimer);
      clearTimeout(vsTimer);
      clearTimeout(infoTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const teamTranslateX = isSlideComplete ? 0 : -SLIDE_OFFSET;
  const enemyTranslateX = isSlideComplete ? 0 : SLIDE_OFFSET;
  const bgGradient = useMemo(
    () => `linear-gradient(90deg, ${hexToRgba(playerCharacter.color, GRADIENT_ALPHA)}, ${hexToRgba(cpuCharacter.color, GRADIENT_ALPHA)})`,
    [playerCharacter.color, cpuCharacter.color],
  );

  /** VS テキスト */
  const vsText = (
    <span
      style={{
        color: 'white',
        fontWeight: 'bold',
        fontSize: '72px',
        textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
        opacity: isVsVisible ? 1 : 0,
        transform: isVsVisible ? 'scale(1)' : 'scale(0.8)',
        transition: 'opacity 200ms ease-out, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      VS
    </span>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: bgGradient,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        opacity: isFadeOut ? 0 : bgOpacity,
        transition: isFadeOut
          ? 'opacity 500ms ease-in-out'
          : 'opacity 200ms ease-in-out',
      }}
    >
      {/* 対戦表示エリア */}
      {is2v2 && allyCharacter && enemyCharacter2 ? (
        /* 2v2 レイアウト: チーム1 (P1+P2) VS チーム2 (P3+P4)、S9-A1 で styled-components 化 */
        <VsTeamsLayout data-testid="vs-teams-layout">
          {/* チーム1 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: TEAM1_COLOR, fontWeight: 'bold' }}>チーム1</span>
            <div style={{ display: 'flex', gap: '12px', transform: `translateX(${teamTranslateX}px)`, transition: prefersReducedMotion ? 'none' : `transform ${CHAR_SLIDE_DURATION_MS}ms ease-out` }}>
              <CharacterPanel character={playerCharacter} prefersReducedMotion={prefersReducedMotion} />
              <CharacterPanel character={allyCharacter} prefersReducedMotion={prefersReducedMotion} {...resolveControlLabel(allyControlType, 'p2', TEAM1_COLOR)} />
            </div>
          </div>

          {vsText}

          {/* チーム2 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: TEAM2_COLOR, fontWeight: 'bold' }}>チーム2</span>
            <div style={{ display: 'flex', gap: '12px', transform: `translateX(${enemyTranslateX}px)`, transition: prefersReducedMotion ? 'none' : `transform ${CHAR_SLIDE_DURATION_MS}ms ease-out` }}>
              <CharacterPanel character={cpuCharacter} prefersReducedMotion={prefersReducedMotion} {...resolveControlLabel(enemy1ControlType, 'p3', TEAM2_COLOR)} />
              <CharacterPanel character={enemyCharacter2} prefersReducedMotion={prefersReducedMotion} {...resolveControlLabel(enemy2ControlType, 'p4', TEAM2_COLOR)} />
            </div>
          </div>
        </VsTeamsLayout>
      ) : (
        /* 1v1 レイアウト（従来） */
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
          <CharacterPanel character={playerCharacter} translateX={teamTranslateX} prefersReducedMotion={prefersReducedMotion} />
          {vsText}
          <CharacterPanel character={cpuCharacter} translateX={enemyTranslateX} prefersReducedMotion={prefersReducedMotion} />
        </div>
      )}

      {/* ステージ情報 */}
      <div style={{ textAlign: 'center', opacity: isInfoVisible ? 1 : 0, transition: 'opacity 300ms ease-in' }}>
        <p style={{ margin: '0 0 4px 0', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 'bold', fontSize: '16px' }}>
          {stageName}
        </p>
        <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)', fontSize: '16px' }}>
          {fieldName}
        </p>
      </div>
    </div>
  );
};
