/**
 * ゲームHUDコンポーネント
 * ダメージオーバーレイ、タイマー、HPバー、レベル、ステータス表示等
 */
import React from 'react';
import {
  DamageOverlay,
  TimerDisplay,
  StageIndicator,
  HPBarContainer,
  HPBarFill,
  HPBarText,
  LevelBadge,
  ExperienceBar,
  ExperienceBarFill,
  StatsDisplay,
  StatRow,
  StatLabel,
  StatValue,
  PendingPointsBadge,
  PendingPointsCount,
  EnhanceButtonText,
  KeyIndicator,
  KeyIcon,
  MapToggleButton,
  HelpButton,
  KeyRequiredMessage,
} from '../../../../pages/IpnePage.styles';
import {
  Player,
  KILL_COUNT_TABLE,
  getNextKillsRequired,
  StageNumber,
} from '../../index';
import { GameTimer } from '../../application/services/timerService';
import { getElapsedTime, formatTimeShort } from '../../application/services/timerService';
import { HelpOverlayComponent } from './GameModals';

/** GameHUD の Props 定義 */
export interface GameHUDProps {
  player: Player;
  lastDamageAt: number;
  renderTime: number;
  timer: GameTimer;
  currentStage?: StageNumber;
  maxLevel: number;
  pendingLevelPoints: number;
  onOpenLevelUpModal: () => void;
  onMapToggle: () => void;
  showHelp: boolean;
  onHelpToggle: () => void;
  showKeyRequiredMessage: boolean;
}

/**
 * ゲームHUDコンポーネント
 * HP、レベル、ステータス、ボタン等の情報表示を担当
 */
export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  lastDamageAt,
  renderTime,
  timer,
  currentStage,
  maxLevel,
  pendingLevelPoints,
  onOpenLevelUpModal,
  onMapToggle,
  showHelp,
  onHelpToggle,
  showKeyRequiredMessage,
}) => {
  const hpRatio = player.maxHp === 0 ? 0 : player.hp / player.maxHp;
  const hpColor = hpRatio > 0.66 ? '#22c55e' : hpRatio > 0.33 ? '#facc15' : '#ef4444';
  const currentElapsed = getElapsedTime(timer, renderTime);

  return (
    <>
      <DamageOverlay $visible={renderTime - lastDamageAt < 150} />
      <TimerDisplay>{formatTimeShort(currentElapsed)}</TimerDisplay>
      {currentStage && <StageIndicator>STAGE {currentStage}</StageIndicator>}
      <HPBarContainer>
        <HPBarFill $ratio={hpRatio} $color={hpColor} />
        <HPBarText>
          HP {player.hp}/{player.maxHp}
        </HPBarText>
      </HPBarContainer>
      <LevelBadge>Lv.{player.level}</LevelBadge>
      <ExperienceBar>
        <ExperienceBarFill
          $ratio={
            player.level >= maxLevel
              ? 1
              : (player.killCount - (KILL_COUNT_TABLE[player.level] || 0)) /
                Math.max(1, getNextKillsRequired(player.level, player.killCount) + (player.killCount - (KILL_COUNT_TABLE[player.level] || 0)))
          }
        />
      </ExperienceBar>
      <StatsDisplay>
        <StatRow>
          <StatLabel>攻撃力</StatLabel>
          <StatValue>{player.stats.attackPower}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>攻撃距離</StatLabel>
          <StatValue>{player.stats.attackRange}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>移動速度</StatLabel>
          <StatValue>{player.stats.moveSpeed}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>攻撃速度</StatLabel>
          <StatValue>{player.stats.attackSpeed.toFixed(1)}</StatValue>
        </StatRow>
        <StatRow>
          <StatLabel>撃破数</StatLabel>
          <StatValue>{player.killCount}</StatValue>
        </StatRow>
      </StatsDisplay>
      <PendingPointsBadge
        $hasPoints={pendingLevelPoints > 0}
        onClick={onOpenLevelUpModal}
        aria-label={pendingLevelPoints > 0 ? `未割り振りポイント: ${pendingLevelPoints}` : '未割り振りポイントなし'}
      >
        <PendingPointsCount $hasPoints={pendingLevelPoints > 0}>
          ★ {pendingLevelPoints}
        </PendingPointsCount>
        <EnhanceButtonText $hasPoints={pendingLevelPoints > 0}>
          強化
        </EnhanceButtonText>
      </PendingPointsBadge>
      <KeyIndicator $hasKey={player.hasKey} aria-label={player.hasKey ? '鍵を所持' : '鍵未所持'}>
        <KeyIcon $hasKey={player.hasKey}>🔑</KeyIcon>
      </KeyIndicator>
      <MapToggleButton onClick={onMapToggle} aria-label="マップ表示切替">
        🗺️
      </MapToggleButton>
      <HelpButton onClick={onHelpToggle} aria-label="ヘルプ表示">
        H
      </HelpButton>
      {showHelp && <HelpOverlayComponent onClose={onHelpToggle} />}
      {showKeyRequiredMessage && <KeyRequiredMessage>🔑 鍵が必要です</KeyRequiredMessage>}
    </>
  );
};
