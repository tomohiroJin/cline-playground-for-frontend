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
  50% { filter: brightness(2.5) saturate(0); }
`;

export const ritPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 #f0c04000; }
  50% { box-shadow: 0 0 8px #f0c04030; }
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

export const Screen = styled.div<{ $center?: boolean }>`
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
  overflow-y: auto;
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
