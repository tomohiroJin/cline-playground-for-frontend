import styled, { keyframes, css } from 'styled-components';

// ── LCD カラーパレット ──
export const LCD = {
  bg: '#94a770',
  on: 'rgba(24,28,18,.92)',
  ghost: 'rgba(24,28,18,.065)',
  warn: 'rgba(24,28,18,.36)',
  dim: 'rgba(24,28,18,.16)',
} as const;

// ── フォント ──
export const FONT = {
  lcd: "'Silkscreen', monospace",
  ui: "'Orbitron', sans-serif",
  emo: "'Courier New', Courier, monospace",
} as const;

// ── キーフレーム ──
export const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.12; }
`;

export const shieldPulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

export const popUp = keyframes`
  0% { transform: translate(-50%, 0); opacity: 1; }
  100% { transform: translate(-50%, -30px); opacity: 0; }
`;

export const flashDamage = keyframes`
  0%, 100% { opacity: 0; }
  50% { opacity: 0.85; }
`;

export const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
`;

export const ghostBlink = keyframes`
  0%, 62% { opacity: 0.35; }
  63%, 100% { opacity: 0; }
`;

// ── 筐体 ──
export const Device = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(420px, 97vw);
  height: min(720px, 97vh);
  background: linear-gradient(175deg, #c0c1b9, #9fa098 55%, #8b8c85);
  border-radius: 26px;
  box-shadow:
    0 0 0 2.5px #585858,
    0 0 0 4.5px #1e1e1e,
    0 10px 36px rgba(0, 0, 0, 0.7),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 10px;

  @media (max-height: 640px) {
    padding: 4px 6px;
    border-radius: 18px;
  }
`;

export const Brand = styled.div`
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 6px;
  color: #454545;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
  margin: 1px 0 2px;

  @media (max-height: 640px) {
    font-size: 10px;
    margin: 0 0 1px;
  }
`;

export const Brand2 = styled.div`
  font-size: 6.5px;
  letter-spacing: 3px;
  color: #777;
  margin-top: -1px;
  margin-bottom: 2px;
  font-family: ${FONT.ui};

  @media (max-height: 640px) {
    font-size: 5px;
    margin-bottom: 1px;
  }
`;

export const Bezel = styled.div`
  width: 100%;
  flex: 1;
  min-height: 0;
  background: #363636;
  border-radius: 12px;
  padding: 4px;
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.6),
    0 1px 0 rgba(255, 255, 255, 0.1);
`;

// ── LCD 画面 ──
export const Screen = styled.div`
  width: 100%;
  height: 100%;
  background: ${LCD.bg};
  border-radius: 9px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 1px 6px rgba(0, 0, 0, 0.07);

  /* スキャンライン */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 1.5px,
      rgba(0, 0, 0, 0.011) 1.5px,
      rgba(0, 0, 0, 0.011) 3px
    );
    pointer-events: none;
    z-index: 200;
  }

  /* 反射エフェクト */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at 22% 16%,
      rgba(255, 255, 255, 0.07),
      transparent 48%
    );
    pointer-events: none;
    z-index: 201;
  }
`;

// ── コントロールボタン ──
export const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 5px 2px 0;
  margin-top: 5px;

  @media (max-height: 640px) {
    padding: 3px 1px 0;
    margin-top: 3px;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
`;

const buttonBase = css`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: radial-gradient(circle at 36% 34%, #565656, #262626);
  box-shadow:
    0 3px 5px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 2px #464646;
  color: #c6c6c6;
  font-family: ${FONT.ui};
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 50ms;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: translateY(2px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5), 0 0 0 2px #464646;
    background: radial-gradient(circle at 36% 34%, #464646, #1a1a1a);
  }

  @media (max-height: 640px) {
    width: 42px;
    height: 42px;
    font-size: 15px;
  }
`;

export const DirButton = styled.button`
  ${buttonBase}
`;

export const ActionButton = styled.button`
  ${buttonBase}
  width: 56px;
  height: 56px;
  background: radial-gradient(circle at 36% 34%, #c33, #680e0e);
  box-shadow:
    0 3px 5px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 160, 160, 0.15),
    0 0 0 2px #863030;

  &:active {
    background: radial-gradient(circle at 36% 34%, #a22, #4a0808);
  }

  @media (max-height: 640px) {
    width: 48px;
    height: 48px;
  }
`;

export const ButtonLabel = styled.div`
  font-size: 6px;
  color: #888;
  text-align: center;
  font-family: ${FONT.ui};
  letter-spacing: 1px;
`;

// ── 画面レイヤー共通 ──
export const Layer = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  display: ${({ $active }) => ($active ? 'flex' : 'none')};
  flex-direction: column;
  z-index: 10;
  overflow: hidden;
`;

// ── リストパネル共通 ──
export const ListPanelWrap = styled(Layer)`
  padding: 8px;
  gap: 0;
  position: relative;
  height: 100%;
`;

export const LpHeader = styled.div`
  font-family: ${FONT.ui};
  font-weight: 700;
  font-size: 9px;
  letter-spacing: 3px;
  color: ${LCD.on};
  text-align: center;
  padding-bottom: 4px;
  border-bottom: 2px solid ${LCD.ghost};
  width: 100%;
  flex-shrink: 0;
`;

export const LpSub = styled.div`
  font-family: ${FONT.lcd};
  font-size: 8px;
  color: ${LCD.on};
  text-align: center;
  margin: 2px 0;
  flex-shrink: 0;
`;

export const LpScrollWrap = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

export const LpList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 2px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const LpArrow = styled.div<{ $dir: 'up' | 'down'; $visible: boolean }>`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: ${LCD.warn};
  pointer-events: none;
  z-index: 5;
  font-family: ${FONT.ui};
  font-weight: 900;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.15s;
  ${({ $dir }) => ($dir === 'up' ? 'top: 0;' : 'bottom: 0;')}
`;

export const LpFooter = styled.div`
  font-size: 7px;
  color: ${LCD.warn};
  text-align: center;
  padding-top: 4px;
  border-top: 2px solid ${LCD.ghost};
  width: 100%;
  flex-shrink: 0;
`;

export const ListItem = styled.div<{
  $selected?: boolean;
  $locked?: boolean;
  $owned?: boolean;
}>`
  border: 2px solid ${LCD.ghost};
  padding: 5px 8px;
  cursor: pointer;
  flex-shrink: 0;
  ${({ $selected }) =>
    $selected &&
    css`
      border-color: ${LCD.on};
      background: rgba(24, 28, 18, 0.03);
    `}
  ${({ $locked }) =>
    $locked &&
    css`
      opacity: 0.25;
      cursor: default;
    `}
  ${({ $owned }) =>
    $owned &&
    css`
      opacity: 0.3;
      cursor: default;
    `}
`;

export const LiName = styled.div`
  font-family: ${FONT.ui};
  font-weight: 700;
  font-size: 7.5px;
  color: ${LCD.on};
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 3px;
`;

export const LiDesc = styled.div`
  font-family: ${FONT.lcd};
  font-size: 6.5px;
  color: ${LCD.warn};
  line-height: 1.3;
  margin-top: 1px;
`;

export const LiDesc2 = styled.div`
  font-family: ${FONT.lcd};
  font-size: 6.5px;
  color: ${LCD.dim};
  line-height: 1.3;
`;

export const LiCost = styled.div`
  font-family: ${FONT.lcd};
  font-size: 7px;
  color: ${LCD.on};
  margin-top: 1px;
`;

export const LiTag = styled.span<{ $warn?: boolean }>`
  font-family: ${FONT.lcd};
  font-size: 5.5px;
  color: ${({ $warn }) => ($warn ? LCD.warn : LCD.on)};
  border: 1px solid ${({ $warn }) => ($warn ? LCD.warn : LCD.on)};
  padding: 0 3px;
`;

// ── キャラクターアート ──
export const ArtZone = styled.div<{
  $here?: boolean;
  $danger?: boolean;
  $hit?: boolean;
  $safeGlow?: boolean;
}>`
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-top: 2px solid ${LCD.ghost};
  position: relative;
  transition: background 0.08s, border-color 0.08s;
  overflow: hidden;
  padding: 2px 0;

  ${({ $danger }) =>
    $danger &&
    css`
      background: rgba(24, 28, 18, 0.08);
      border-top-color: ${LCD.on};
    `}
  ${({ $hit }) =>
    $hit &&
    css`
      background: rgba(24, 28, 18, 0.22);
      border-top-color: ${LCD.on};
    `}
  ${({ $safeGlow }) =>
    $safeGlow &&
    css`
      border-top-color: ${LCD.dim};
    `}
`;

export const ArtText = styled.pre<{ $here?: boolean; $danger?: boolean; $hit?: boolean }>`
  font-family: ${FONT.lcd};
  font-size: 9.5px;
  line-height: 1.2;
  color: ${LCD.ghost};
  white-space: pre;
  text-align: center;
  letter-spacing: 0.5px;
  transition: color 0.08s;
  padding: 2px 0;
  margin: 0;

  ${({ $here }) =>
    $here &&
    css`
      color: ${LCD.on};
    `}
  ${({ $danger }) =>
    $danger &&
    css`
      animation: ${blink} 0.3s steps(1) infinite;
    `}
  ${({ $hit }) =>
    $hit &&
    css`
      color: ${LCD.on};
    `}

  @media (max-height: 640px) {
    font-size: 6.5px;
  }
`;

// ── エモーションパネル ──
export const EmoZone = styled.div`
  flex: 1;
  min-height: 0;
  border-top: 2px solid ${LCD.on};
  background: rgba(24, 28, 18, 0.018);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 0;
  width: 100%;
  position: relative;
`;

export const EmoArt = styled.pre`
  font-family: ${FONT.emo};
  font-size: 8px;
  line-height: 1.25;
  color: ${LCD.on};
  white-space: pre;
  text-align: center;
  letter-spacing: 0;
  transition: color 0.08s, transform 0.15s;
  transform-origin: center center;
  margin: 0;
`;

// ── ポップアップテキスト ──
export const PopText = styled.div`
  position: absolute;
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 18px;
  color: ${LCD.on};
  pointer-events: none;
  z-index: 50;
  left: 50%;
  top: 2px;
  animation: ${popUp} 0.6s ease-out forwards;
`;

// ── フラッシュオーバーレイ ──
export const FlashOverlay = styled.div<{ $active: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 90;
  background: ${LCD.on};
  opacity: 0;
  pointer-events: none;
  ${({ $active }) =>
    $active &&
    css`
      animation: ${flashDamage} 0.11s steps(1) 5;
    `}
`;

// ── ゲームフィールド ──
export const GameField = styled.div<{ $shaking?: boolean }>`
  flex: 3;
  display: flex;
  min-height: 0;
  position: relative;

  ${({ $shaking }) =>
    $shaking &&
    css`
      animation: ${shake} 0.08s ease-in-out 3;
    `}
`;

export const LaneCol = styled.div<{ $shelter?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid ${LCD.ghost};

  &:last-child {
    border-right: none;
  }

  ${({ $shelter }) =>
    $shelter &&
    css`
      background: repeating-linear-gradient(
        180deg,
        transparent,
        transparent 3px,
        rgba(24, 28, 18, 0.012) 3px,
        rgba(24, 28, 18, 0.012) 6px
      );
    `}
`;

export const LaneHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  border-bottom: 1px solid ${LCD.warn};
  flex-shrink: 0;
  gap: 3px;

  @media (max-height: 640px) {
    height: 14px;
  }
`;

export const MultLabel = styled.span<{
  $here?: boolean;
  $restricted?: boolean;
  $shelter?: boolean;
}>`
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 14px;
  color: ${LCD.dim};
  transition: color 0.08s;

  ${({ $here }) =>
    $here &&
    css`
      color: ${LCD.on};
    `}
  ${({ $restricted }) =>
    $restricted &&
    css`
      text-decoration: line-through;
      color: ${LCD.ghost} !important;
    `}
  ${({ $shelter }) =>
    $shelter &&
    css`
      color: ${LCD.warn};
      font-size: 11px;
      animation: ${shieldPulse} 2s ease-in-out infinite;
    `}

  @media (max-height: 640px) {
    font-size: 11px;
  }
`;

export const LaneLabel = styled.span`
  font-size: 6px;
  color: ${LCD.dim};
  font-family: ${FONT.ui};
`;

export const SegsCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

export const Segment = styled.div<{
  $state?: 'ghost' | 'warn' | 'danger' | 'impact' | 'safe' | 'near' | 'fake' | 'shield' | 'shieldWarn' | 'ghostPlayer';
}>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 26px;
  color: ${LCD.ghost};
  transition: color 0.06s, font-size 0.06s;

  ${({ $state }) => {
    switch ($state) {
      case 'warn':
        return css`
          color: ${LCD.warn};
          animation: ${blink} 0.18s steps(1) infinite;
        `;
      case 'danger':
        return css`color: ${LCD.on};`;
      case 'impact':
        return css`
          color: ${LCD.on};
          font-size: 34px;
          @media (max-height: 640px) { font-size: 26px; }
        `;
      case 'safe':
        return css`
          color: ${LCD.dim};
          font-size: 9px;
          letter-spacing: 1px;
          font-weight: 700;
        `;
      case 'near':
        return css`
          color: ${LCD.dim};
          font-size: 8px;
          letter-spacing: 1px;
          font-weight: 700;
        `;
      case 'fake':
        return css`
          color: ${LCD.warn};
          font-size: 7px;
          animation: ${blink} 0.25s steps(1) infinite;
        `;
      case 'shield':
        return css`color: rgba(24, 28, 18, 0.04);`;
      case 'shieldWarn':
        return css`
          color: rgba(24, 28, 18, 0.12);
          font-size: 18px;
          @media (max-height: 640px) { font-size: 14px; }
        `;
      case 'ghostPlayer':
        return css`
          color: ${LCD.dim};
          font-size: 18px;
          animation: ${ghostBlink} 0.8s steps(1) infinite;
          @media (max-height: 640px) { font-size: 14px; }
        `;
      default:
        return '';
    }
  }}

  @media (max-height: 640px) {
    font-size: 20px;
  }
`;

// ── ビートバー ──
export const BeatBarBg = styled.div`
  width: 100%;
  height: 4px;
  flex-shrink: 0;
  background: ${LCD.ghost};
  overflow: hidden;
`;

export const BeatBarFill = styled.div<{ $visible?: boolean; $animate?: boolean }>`
  height: 100%;
  background: ${LCD.on};
  width: 0%;
  opacity: ${({ $visible }) => ($visible ? 1 : 0.4)};
  ${({ $animate }) =>
    $animate &&
    css`
      transition: width linear;
    `}
`;

// ── HUD ──
export const Hud = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 8px;
  height: 32px;
  flex-shrink: 0;
  border-bottom: 2px solid ${LCD.on};
  background: rgba(24, 28, 18, 0.025);

  @media (max-height: 640px) {
    height: 26px;
    padding: 1px 6px;
  }
`;

export const HudScore = styled.div`
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 26px;
  color: ${LCD.on};
  line-height: 1;
  letter-spacing: 2px;

  @media (max-height: 640px) {
    font-size: 20px;
  }
`;

export const HudMid = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const HudCombo = styled.div<{ $visible: boolean }>`
  font-family: ${FONT.ui};
  font-weight: 800;
  font-size: 11px;
  color: ${LCD.on};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.1s;
  line-height: 1;
`;

export const HudPerks = styled.div`
  font-size: 9px;
  color: ${LCD.warn};
  line-height: 1;
`;

export const HudRight = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

export const HudStage = styled.div`
  font-family: ${FONT.ui};
  font-size: 13px;
  color: ${LCD.on};
  font-weight: 900;
  letter-spacing: 2px;

  @media (max-height: 640px) {
    font-size: 11px;
  }
`;

export const HudCycle = styled.div`
  font-size: 10px;
  color: ${LCD.on};
  font-weight: 700;

  @media (max-height: 640px) {
    font-size: 9px;
  }
`;

export const HudShield = styled.div<{ $empty?: boolean }>`
  font-family: ${FONT.ui};
  font-size: 10px;
  color: ${LCD.on};

  ${({ $empty }) =>
    $empty &&
    css`
      color: ${LCD.ghost};
      text-decoration: line-through;
    `}
`;

// ── アナウンス（ステージ開始） ──
export const AnnounceOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 80;
  background: ${LCD.bg};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const AnnTitle = styled.div`
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 26px;
  color: ${LCD.on};
  letter-spacing: 4px;
  animation: ${blink} 0.4s steps(1) 3;
`;

export const AnnSub = styled.div`
  font-size: 9px;
  color: ${LCD.warn};
  margin-top: 4px;
  letter-spacing: 2px;
`;

export const AnnDetail = styled.div`
  font-size: 8px;
  color: ${LCD.on};
  margin-top: 8px;
  text-align: center;
  line-height: 1.5;
  font-weight: 700;
  letter-spacing: 1px;
`;

export const AnnMod = styled.div`
  font-size: 7px;
  color: ${LCD.dim};
  margin-top: 4px;
  letter-spacing: 1px;
`;

// ── パーク選択 ──
export const PerkOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 85;
  background: ${LCD.bg};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px;
  gap: 3px;
`;

export const PerkTitle = styled.div`
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 13px;
  color: ${LCD.on};
  letter-spacing: 3px;
`;

export const PerkSub = styled.div`
  font-size: 7px;
  color: ${LCD.warn};
  letter-spacing: 2px;
  margin-bottom: 6px;
`;

export const PerkChoices = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  flex: 1;
  justify-content: center;
`;

export const PerkCard = styled.div<{ $selected?: boolean }>`
  border: 2px solid ${LCD.ghost};
  padding: 9px;
  cursor: pointer;
  transition: all 0.08s;

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: ${LCD.on};
      background: rgba(24, 28, 18, 0.035);
    `}
`;

export const PerkName = styled.div`
  font-family: ${FONT.ui};
  font-weight: 700;
  font-size: 10px;
  color: ${LCD.on};
  letter-spacing: 1px;
  margin-bottom: 2px;
`;

export const PerkDesc = styled.div`
  font-size: 8px;
  color: ${LCD.warn};
  line-height: 1.4;
`;

export const PerkType = styled.div`
  font-size: 7px;
  color: ${LCD.dim};
  margin-top: 2px;
`;

export const PerkFooter = styled.div`
  font-size: 7px;
  color: ${LCD.warn};
  letter-spacing: 1px;
`;

export const PerkSummary = styled.div`
  font-size: 7px;
  color: ${LCD.dim};
  text-align: center;
  line-height: 1.3;
  margin-top: 2px;
`;

// ── タイトル画面 ──
export const TitleLayer = styled(Layer)`
  align-items: center;
  justify-content: center;
  gap: 3px;
`;

export const TitleText = styled.div`
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 44px;
  line-height: 1;
  letter-spacing: 3px;
  color: ${LCD.on};
  text-align: center;

  @media (max-height: 640px) {
    font-size: 32px;
  }
`;

export const TitleSub = styled.div`
  font-family: ${FONT.lcd};
  font-size: 7px;
  letter-spacing: 4px;
  color: ${LCD.warn};
  margin-bottom: 12px;
`;

export const TitlePt = styled.div`
  font-family: ${FONT.lcd};
  position: absolute;
  top: 8px;
  right: 11px;
  font-size: 8px;
  color: ${LCD.warn};
`;

export const TitleBest = styled.div`
  font-family: ${FONT.lcd};
  position: absolute;
  top: 8px;
  left: 11px;
  font-size: 7px;
  color: ${LCD.dim};
`;

export const TitleMenu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 190px;
`;

export const TitleMenuItem = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 2px solid ${LCD.ghost};
  cursor: pointer;

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: ${LCD.on};
      background: rgba(24, 28, 18, 0.03);
    `}
`;

export const MenuArrow = styled.span<{ $visible: boolean }>`
  font-family: ${FONT.lcd};
  font-size: 10px;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  color: ${LCD.on};
`;

export const MenuLabel = styled.span`
  font-family: ${FONT.lcd};
  font-size: 10px;
  color: ${LCD.on};
`;

export const TitleHow = styled.div`
  font-family: ${FONT.lcd};
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 6.5px;
  color: ${LCD.dim};
  text-align: center;
  line-height: 1.5;
  width: 92%;
`;

// ── リザルト画面 ──
export const ResultLayer = styled(Layer)`
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 12px;
`;

export const ResultTitle = styled.div`
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 15px;
  color: ${LCD.on};
  letter-spacing: 3px;
`;

export const ResultRank = styled.div`
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 48px;
  color: ${LCD.on};
  line-height: 1;
`;

export const ResultComment = styled.div`
  font-family: ${FONT.lcd};
  font-size: 8px;
  color: ${LCD.warn};
  text-align: center;
  line-height: 1.5;
  max-width: 220px;
`;

export const ResultStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  max-width: 200px;
  padding: 6px 0;
  border-top: 2px solid ${LCD.ghost};
  border-bottom: 2px solid ${LCD.ghost};
`;

export const ResultRow = styled.div`
  font-family: ${FONT.lcd};
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: ${LCD.on};
`;

export const ResultPt = styled.div`
  font-family: ${FONT.ui};
  font-weight: 700;
  font-size: 13px;
  color: ${LCD.on};
  letter-spacing: 2px;
`;

export const ResultPerks = styled.div`
  font-size: 7px;
  color: ${LCD.warn};
  max-width: 220px;
  text-align: center;
  line-height: 1.3;
`;

export const ResultHint = styled.div`
  font-size: 7px;
  color: ${LCD.dim};
  letter-spacing: 2px;
  margin-top: 2px;
`;

// ── デイリー画面 ──
export const DailyLayer = styled(Layer)`
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
`;

export const DailyTitle = styled.div`
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 16px;
  color: ${LCD.on};
  letter-spacing: 3px;
`;

export const DailyDate = styled.div`
  font-family: ${FONT.lcd};
  font-size: 11px;
  color: ${LCD.on};
  letter-spacing: 2px;
`;

export const DailyModifier = styled.div`
  font-family: ${FONT.lcd};
  font-size: 8px;
  color: ${LCD.warn};
  text-align: center;
  line-height: 1.5;
  margin: 4px 0;
`;

export const DailyStatus = styled.div`
  font-family: ${FONT.lcd};
  font-size: 9px;
  color: ${LCD.dim};
  letter-spacing: 1px;
`;

export const DailyAction = styled.div<{ $selected?: boolean }>`
  font-family: ${FONT.lcd};
  font-size: 10px;
  color: ${LCD.on};
  padding: 8px 16px;
  border: 2px solid ${LCD.ghost};
  cursor: pointer;
  text-align: center;

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: ${LCD.on};
      background: rgba(24, 28, 18, 0.03);
    `}
`;

// ── チュートリアル画面 ──
export const TutorialLayer = styled(Layer)`
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px;
`;

export const TutorialStep = styled.div`
  font-family: ${FONT.lcd};
  font-size: 8px;
  color: ${LCD.dim};
  letter-spacing: 2px;
`;

export const TutorialTitle = styled.div`
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 14px;
  color: ${LCD.on};
  letter-spacing: 2px;
`;

export const TutorialBody = styled.div`
  font-family: ${FONT.lcd};
  font-size: 9px;
  color: ${LCD.warn};
  text-align: center;
  line-height: 1.6;
  max-width: 220px;
`;

export const TutorialAction = styled.div<{ $selected?: boolean }>`
  font-family: ${FONT.lcd};
  font-size: 10px;
  color: ${LCD.on};
  padding: 8px 16px;
  border: 2px solid ${LCD.ghost};
  cursor: pointer;
  text-align: center;
  margin-top: 8px;

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: ${LCD.on};
      background: rgba(24, 28, 18, 0.03);
    `}
`;

// ── シェアボタン ──
export const ShareRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 4px;
`;

export const ShareButton = styled.div`
  font-family: ${FONT.lcd};
  font-size: 8px;
  color: ${LCD.on};
  padding: 4px 12px;
  border: 2px solid ${LCD.on};
  cursor: pointer;
  letter-spacing: 1px;

  &:active {
    background: rgba(24, 28, 18, 0.08);
  }
`;

// ── ゴースト表示 ──
export const GhostSegment = styled.div`
  position: absolute;
  font-family: ${FONT.ui};
  font-weight: 900;
  font-size: 18px;
  color: ${LCD.dim};
  animation: ${ghostBlink} 0.8s steps(1) infinite;
  pointer-events: none;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
`;
