/**
 * 原始進化録 - PRIMAL PATH - スタイル定義
 */
import styled, { keyframes, css } from 'styled-components';

/* ===== Keyframes ===== */

export const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
`;

export const flashDmg = keyframes`
  0%, 100% { filter: none; }
  50% { filter: brightness(2) sepia(1) hue-rotate(-20deg); }
`;

export const flashHeal = keyframes`
  0%, 100% { filter: none; }
  50% { filter: brightness(1.5) sepia(1) hue-rotate(80deg); }
`;

export const barPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

export const rareGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px #f0c04015; }
  50% { box-shadow: 0 0 16px #f0c04040, 0 0 24px #f0c04020; }
`;

export const fadeOut = keyframes`
  to { opacity: 0.15; transform: scale(0.8); }
`;

export const flashHit = keyframes`
  0%, 100% { filter: none; }
  25% { filter: brightness(4) saturate(0.2) drop-shadow(0 0 8px #ff4040); }
  60% { filter: brightness(1.8) sepia(0.6) hue-rotate(-30deg) drop-shadow(0 0 4px #ff6040); }
`;

export const ritPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 #f0c04000; }
  50% { box-shadow: 0 0 8px #f0c04030; }
`;

export const pausePulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

export const ovFadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const ovFadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

/* ===== Game Container ===== */

export const GameContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #0a0a12;
  font-family: 'Courier New', monospace;
  image-rendering: pixelated;
`;

export const GameShell = styled.div`
  width: 480px;
  height: 720px;
  background: #12121e;
  position: relative;
  overflow: hidden;
  border: 2px solid #2a2a3e;
  box-shadow: 0 0 30px #0006;

  @media (max-width: 500px) {
    width: 100vw;
    height: 100vh;
    border: none;
  }
`;

/* ===== Screen (generic phase container) ===== */

export const Screen = styled.div<{ $center?: boolean; $noScroll?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #e0d8c8;
  padding: 10px 14px;
  overflow-y: ${p => p.$noScroll ? 'hidden' : 'auto'};
  z-index: 1;
  ${p => p.$center && 'justify-content: center;'}

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
`;

/* ===== Overlay ===== */

export const OverlayWrap = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: ${p => p.$visible ? 'flex' : 'none'};
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #000d;
  z-index: 20;
  gap: 8px;
  animation: ${p => p.$visible ? ovFadeIn : ovFadeOut} 0.2s;
`;

export const OverlayIcon = styled.div`
  font-size: 48px;
  filter: drop-shadow(0 0 12px #f0c04040);
`;

export const OverlayText = styled.div`
  font-size: 16px;
  color: #f0c040;
  text-shadow: 0 0 14px #f0c04060;
  text-align: center;
  padding: 0 24px;
  line-height: 1.6;
`;

/* ===== Common Elements ===== */

export const Title = styled.h1`
  font-size: 22px;
  color: #f0c040;
  text-shadow: 0 0 12px #f0c04060, 2px 2px #503800;
  letter-spacing: 3px;
  margin: 4px 0;
`;

export const SubTitle = styled.h2`
  font-size: 14px;
  color: #f0c040;
  margin: 6px 0;
`;

export const Divider = styled.div`
  width: 50%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #f0c04040, transparent);
  margin: 8px 0;
`;

export const GameButton = styled.button<{ $off?: boolean }>`
  background: linear-gradient(180deg, #1c1c2c, #141420);
  color: #c0b898;
  border: 1px solid #333;
  padding: 8px 18px;
  margin: 3px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  min-width: 110px;
  text-align: center;
  border-radius: 2px;
  transition: all 0.12s;
  user-select: none;

  &:hover {
    border-color: #f0c040;
    color: #f0c040;
    box-shadow: 0 0 8px #f0c04020;
  }
  &:active { transform: scale(0.96); }

  ${p => p.$off && css`
    opacity: 0.3;
    pointer-events: none;
  `}
`;

export const GamePanel = styled.div`
  background: linear-gradient(180deg, #0e0e16, #0a0a12);
  border: 1px solid #262636;
  padding: 8px;
  margin: 4px 0;
  width: 100%;
  border-radius: 3px;
`;

export const StatText = styled.div`
  font-size: 10px;
  color: #908870;
  margin: 2px 0;
`;

export const EvoCard = styled.button<{ $rare?: boolean }>`
  background: linear-gradient(180deg, #14141e, #0e0e16);
  border: 2px solid #2a2a3a;
  padding: 8px 8px 6px;
  width: 100%;
  cursor: pointer;
  text-align: left;
  border-radius: 4px;
  transition: all 0.18s;
  margin: 2px 0;
  color: inherit;
  font-family: inherit;

  &:hover {
    border-color: #f0c040;
    box-shadow: 0 4px 12px #0008;
    transform: translateY(-1px);
  }

  ${p => p.$rare && css`
    border-color: #f0c04060;
    box-shadow: 0 0 10px #f0c04015;
    animation: ${rareGlow} 2.5s infinite;
  `}
`;

export const TreeNodeBox = styled.div<{ $bought?: boolean; $locked?: boolean; $canBuy?: boolean }>`
  background: linear-gradient(180deg, #14141e, #0e0e16);
  border: 1px solid #262636;
  padding: 5px 6px;
  font-size: 10px;
  text-align: center;
  min-width: 84px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.12s;

  &:hover { border-color: #f0c040; }

  ${p => p.$bought && css`
    border-color: #2a5a2a;
    background: linear-gradient(180deg, #0c160c, #081008);
  `}
  ${p => p.$locked && css`
    opacity: 0.15;
    cursor: not-allowed;
    &:hover { border-color: #262636; }
  `}
  ${p => p.$canBuy && css`
    border-color: #f0c04040;
    animation: ${pulse} 2s infinite;
  `}
`;

export const LogContainer = styled.div`
  font-size: 9px;
  color: #808068;
  max-height: 100px;
  overflow-y: auto;
  width: 100%;
  padding: 4px 6px;
  background: #08080c;
  border: 1px solid #1a1a22;
  border-radius: 3px;
  margin: 3px 0;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
`;

export const LogLine = styled.div<{ $color?: string }>`
  margin: 1px 0;
  padding: 2px 0;
  border-bottom: 1px solid #fff1;
  color: ${p => p.$color || '#808068'};
`;

export const SpeedBar = styled.div`
  display: flex;
  gap: 2px;
  align-items: center;
  margin: 2px 0;
`;

export const SpeedBtn = styled.button<{ $active?: boolean }>`
  background: #0c0c14;
  border: 1px solid #262636;
  color: #605848;
  font-size: 9px;
  padding: 1px 6px;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.1s;
  font-family: inherit;

  ${p => p.$active && css`
    border-color: #f0c040;
    color: #f0c040;
    box-shadow: 0 0 6px #f0c04040;
    text-shadow: 0 0 4px #f0c04060;
  `}
  &:hover {
    border-color: #f0c040;
    color: #f0c040;
  }
`;

export const SurrenderBtn = styled.button`
  font-size: 8px;
  color: #403828;
  background: none;
  border: 1px solid #262636;
  padding: 1px 6px;
  cursor: pointer;
  border-radius: 2px;
  font-family: inherit;
  margin-left: auto;

  &:hover {
    color: #f05050;
    border-color: #f05050;
  }
`;

export const AllyBadge = styled.div<{ $dead?: boolean }>`
  background: #0c0c14;
  border: 1px solid #262636;
  padding: 3px 6px;
  font-size: 9px;
  text-align: center;
  min-width: 62px;
  border-radius: 3px;

  ${p => p.$dead && css`
    opacity: 0.2;
    border-color: #401020;
  `}
`;

export const AllyRow = styled.div`
  display: flex;
  gap: 4px;
  margin: 4px 0;
  flex-wrap: wrap;
  justify-content: center;
`;

export const TierHeader = styled.div<{ $locked?: boolean }>`
  font-size: 10px;
  color: ${p => p.$locked ? '#401020' : '#605848'};
  margin: 8px 0 3px;
  padding-bottom: 3px;
  border-bottom: 1px solid #1a1a22;
  width: 100%;
  text-align: center;
  letter-spacing: 2px;
`;

export const RunStatRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #605848;
  padding: 2px 8px;
  width: 100%;
`;

/* ===== Color utility classes ===== */

export const Tc = styled.span`color: #f08050;`;
export const Lc = styled.span`color: #50e090;`;
export const Rc = styled.span`color: #d060ff;`;
export const Gc = styled.span`color: #f0c040;`;
export const Xc = styled.span`color: #f05050;`;
export const Cc = styled.span`color: #50c8e8;`;
export const Wc = styled.span`color: #e0d8c8;`;
export const Bc = styled.span`color: #e0c060;`;

export const PausedOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: #f0c040;
  text-shadow: 0 0 16px #f0c04060, 0 0 32px #f0c04030;
  letter-spacing: 8px;
  animation: ${pausePulse} 1.5s ease-in-out infinite;
  pointer-events: none;
  z-index: 10;
`;

export const awkFlash = keyframes`
  0% { opacity: 0; }
  15% { opacity: 0.9; }
  100% { opacity: 0; }
`;

export const AwkFlashOverlay = styled.div<{ $cl?: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${p => p.$cl || '#f0c040'};
  pointer-events: none;
  z-index: 15;
  animation: ${awkFlash} 0.6s ease-out forwards;
`;

export const EnemySprite = styled.canvas<{ $hit?: boolean; $burn?: boolean }>`
  border: 1px solid ${p => p.$burn ? '#ff4020' : '#222'};
  border-radius: 3px;
  background: #08080c;
  flex-shrink: 0;
  image-rendering: pixelated;
  transition: border-color 0.3s;
  ${p => p.$burn && css`box-shadow: 0 0 10px #ff402050, inset 0 0 6px #ff402030;`}
  ${p => p.$hit && css`animation: ${flashHit} 0.4s ease-out, ${shake} 0.3s ease-out;`}
`;

export const popupFloat = keyframes`
  0% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
  15% { transform: translateX(-50%) translateY(-6px) scale(1.2); opacity: 1; }
  100% { transform: translateX(-50%) translateY(-44px) scale(0.85); opacity: 0; }
`;

export const PopupText = styled.span`
  position: absolute;
  top: 35%;
  transform: translateX(-50%);
  font-weight: bold;
  font-family: 'Courier New', monospace;
  pointer-events: none;
  text-shadow:
    0 0 8px currentColor,
    0 0 3px currentColor,
    0 1px 2px #000,
    0 -1px 2px #000,
    1px 0 2px #000,
    -1px 0 2px #000;
  animation: ${popupFloat} 0.9s ease-out forwards;
  z-index: 5;
`;

export const PopupContainer = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 5;
`;

export const skillPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 transparent; }
  50% { box-shadow: 0 0 10px #f0c04050, 0 0 4px #f0c04030; }
`;

/* バトル画面の固定下部領域（スキルバー配置用） */
export const BattleFixedBottom = styled.div`
  flex-shrink: 0;
  width: 100%;
  padding: 6px 0 4px;
  background: linear-gradient(180deg, transparent, #12121e 8px);
`;

/* バトル画面のスクロール領域 */
export const BattleScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
`;

export const SkillBar = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
`;

export const SkillBtn = styled.button<{ $off?: boolean }>`
  background: linear-gradient(180deg, #1a1a28, #12121c);
  border: 1px solid #444;
  color: #e0d8c8;
  font-size: 14px;
  padding: 10px 16px;
  cursor: pointer;
  border-radius: 4px;
  font-family: inherit;
  transition: all 0.12s;
  min-width: 96px;
  min-height: 44px;
  animation: ${skillPulse} 2s ease-in-out infinite;

  &:hover {
    border-color: #f0c040;
    color: #f0c040;
    box-shadow: 0 0 10px #f0c04040;
  }
  &:active { transform: scale(0.95); }

  ${p => p.$off && css`
    opacity: 0.35;
    pointer-events: none;
    filter: grayscale(0.8);
    animation: none;
  `}
`;

/* ===== 背景演出 ===== */

/** バイオーム別背景グラデーション */
const BIOME_BG: Record<string, string> = {
  grassland: 'linear-gradient(180deg, #0a1a0a 0%, #0e1e10 30%, #12221a 70%, #162818 100%)',
  glacier: 'linear-gradient(180deg, #0a0e1a 0%, #0e1428 30%, #101830 70%, #0c1020 100%)',
  volcano: 'linear-gradient(180deg, #1a0a0a 0%, #1e0e08 30%, #221210 70%, #281610 100%)',
  final: 'linear-gradient(180deg, #12081a 0%, #1a0c22 30%, #100818 70%, #0a0410 100%)',
};

export const BiomeBg = styled.div<{ $biome: string }>`
  position: absolute;
  inset: 0;
  background: ${p => BIOME_BG[p.$biome] || '#12121e'};
  z-index: 0;
  pointer-events: none;
`;

/** 降雪キーフレーム */
export const snowfall = keyframes`
  0% { transform: translateY(-10px) translateX(0); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.6; }
  100% { transform: translateY(720px) translateX(20px); opacity: 0; }
`;

/** 火の粉キーフレーム */
export const ember = keyframes`
  0% { transform: translateY(720px) translateX(0); opacity: 0; }
  10% { opacity: 0.9; }
  80% { opacity: 0.5; }
  100% { transform: translateY(-20px) translateX(-15px); opacity: 0; }
`;

/** 草原の胞子キーフレーム */
export const spore = keyframes`
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  20% { opacity: 0.4; }
  80% { opacity: 0.3; }
  100% { transform: translateY(-60px) translateX(30px); opacity: 0; }
`;

/** 天候パーティクル */
export const WeatherParticles = styled.div<{ $biome: string }>`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;

  &::before, &::after {
    content: '';
    position: absolute;
    pointer-events: none;
  }

  /* 氷河: 雪パーティクル */
  ${p => p.$biome === 'glacier' && css`
    & > span {
      position: absolute;
      width: 2px;
      height: 2px;
      background: rgba(200, 220, 255, 0.7);
      border-radius: 50%;
      animation: ${snowfall} linear infinite;
      box-shadow: 0 0 3px rgba(200, 220, 255, 0.4);
    }
  `}

  /* 火山: 火の粉パーティクル */
  ${p => p.$biome === 'volcano' && css`
    & > span {
      position: absolute;
      width: 2px;
      height: 2px;
      background: rgba(255, 140, 40, 0.8);
      border-radius: 50%;
      animation: ${ember} linear infinite;
      box-shadow: 0 0 4px rgba(255, 100, 20, 0.5);
    }
  `}

  /* 草原: 胞子パーティクル */
  ${p => p.$biome === 'grassland' && css`
    & > span {
      position: absolute;
      width: 1px;
      height: 1px;
      background: rgba(120, 200, 100, 0.5);
      border-radius: 50%;
      animation: ${spore} linear infinite;
      box-shadow: 0 0 2px rgba(120, 200, 100, 0.3);
    }
  `}
`;

/** チャレンジタイマー */
export const TimerDisplay = styled.div<{ $urgent?: boolean }>`
  font-size: 12px;
  color: ${p => p.$urgent ? '#f05050' : '#f0c040'};
  text-shadow: 0 0 6px ${p => p.$urgent ? '#f0505060' : '#f0c04040'};
  font-weight: bold;
  text-align: center;
  padding: 2px 8px;
  ${p => p.$urgent && css`animation: ${barPulse} 0.8s ease-in-out infinite;`}
`;
