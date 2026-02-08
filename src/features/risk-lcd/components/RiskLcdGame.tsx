import React, { useRef } from 'react';
import { useStore, useAudio, useInput, useGameEngine } from '../hooks';
import DeviceFrame from './DeviceFrame';
import LcdScreen from './LcdScreen';
import ControlButtons from './ControlButtons';
import TitleScreen from './TitleScreen';
import StyleListScreen from './StyleListScreen';
import UnlockShopScreen from './UnlockShopScreen';
import HelpScreen from './HelpScreen';
import GameScreen from './GameScreen';
import ResultScreen from './ResultScreen';

// 全画面を統合するメインコンポーネント（画面ルーティング）
const RiskLcdGame: React.FC = () => {
  const store = useStore();
  const audio = useAudio();
  const { state: rs, dispatch, getLaneInfo } = useGameEngine(store, audio);
  const screenRef = useRef<HTMLDivElement>(null);

  useInput(dispatch, screenRef);

  return (
    <DeviceFrame>
      <LcdScreen>
        <div ref={screenRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* タイトル画面 */}
          <TitleScreen
            active={rs.screen === 'T'}
            menuIndex={rs.menuIndex}
            pts={store.data.pts}
            best={store.data.best}
          />

          {/* スタイル選択画面 */}
          <StyleListScreen
            active={rs.screen === 'Y'}
            selectedIndex={rs.listIndex}
            ownedStyles={store.data.sty}
            equippedStyles={store.data.eq}
            maxSlots={store.maxSlots()}
          />

          {/* ショップ画面 */}
          <UnlockShopScreen
            active={rs.screen === 'H'}
            selectedIndex={rs.listIndex}
            pts={store.data.pts}
            ownedStyles={store.data.sty}
            ownedUnlocks={store.data.ui}
          />

          {/* ヘルプ画面 */}
          <HelpScreen active={rs.screen === 'HP'} />

          {/* ゲーム画面 */}
          <GameScreen
            active={rs.screen === 'G'}
            rs={rs}
            getLaneInfo={getLaneInfo}
          />

          {/* リザルト画面 */}
          <ResultScreen
            active={rs.screen === 'R'}
            game={rs.game}
            hasGold={store.hasUnlock('gold')}
          />
        </div>
      </LcdScreen>
      <ControlButtons onInput={dispatch} />
    </DeviceFrame>
  );
};

export default RiskLcdGame;
