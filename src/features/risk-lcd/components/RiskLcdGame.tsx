import React, { useRef, useEffect } from 'react';
import { useStore, useAudio, useInput, useGameEngine } from '../hooks';
import { decodeShareUrl } from '../utils/share';
import { getDailyId } from '../utils/seeded-random';
import { isValidDailyGhost } from '../utils/ghost';
import DeviceFrame from './DeviceFrame';
import LcdScreen from './LcdScreen';
import ControlButtons from './ControlButtons';
import TitleScreen from './TitleScreen';
import DailyScreen from './DailyScreen';
import TutorialScreen from './TutorialScreen';
import StyleListScreen from './StyleListScreen';
import UnlockShopScreen from './UnlockShopScreen';
import HelpScreen from './HelpScreen';
import GameScreen from './GameScreen';
import ResultScreen from './ResultScreen';

// 全画面を統合するメインコンポーネント（画面ルーティング）
const RiskLcdGame: React.FC = () => {
  const store = useStore();
  const audio = useAudio();
  const { state: rs, dispatch, selectAndAct, getLaneInfo, loadShareData } = useGameEngine(store, audio);
  const screenRef = useRef<HTMLDivElement>(null);

  useInput(dispatch, screenRef);

  // マウント時に URL クエリをチェック
  useEffect(() => {
    try {
      const search = window.location.search;
      if (!search) return;
      const params = decodeShareUrl(search);
      if (params) {
        loadShareData(params);
      }
    } catch {
      // パース失敗時は何もしない
    }
  }, [loadShareData]);

  return (
    <DeviceFrame controls={<ControlButtons onInput={dispatch} />}>
      <LcdScreen>
        <div ref={screenRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* タイトル画面 */}
          <TitleScreen
            active={rs.screen === 'T'}
            menuIndex={rs.menuIndex}
            pts={store.data.pts}
            best={store.data.best}
            onMenuClick={selectAndAct}
          />

          {/* デイリー画面 */}
          <DailyScreen
            active={rs.screen === 'D'}
            dailyData={store.getDailyData()}
            hasGhost={isValidDailyGhost(rs.shareData, getDailyId())}
            onStart={() => dispatch('act')}
            onBack={() => dispatch('back')}
          />

          {/* チュートリアル画面 */}
          <TutorialScreen
            active={rs.screen === 'TU'}
            step={rs.tutorialStep ?? 0}
            onNext={() => dispatch('act')}
            onBack={() => dispatch('back')}
          />

          {/* スタイル選択画面 */}
          <StyleListScreen
            active={rs.screen === 'Y'}
            selectedIndex={rs.listIndex}
            ownedStyles={store.data.sty}
            equippedStyles={store.data.eq}
            maxSlots={store.maxSlots()}
            onItemClick={selectAndAct}
          />

          {/* ショップ画面 */}
          <UnlockShopScreen
            active={rs.screen === 'H'}
            selectedIndex={rs.listIndex}
            pts={store.data.pts}
            ownedStyles={store.data.sty}
            ownedUnlocks={store.data.ui}
            onItemClick={selectAndAct}
          />

          {/* ヘルプ画面 */}
          <HelpScreen active={rs.screen === 'HP'} selectedIndex={rs.listIndex} />

          {/* ゲーム画面 */}
          <GameScreen
            active={rs.screen === 'G'}
            rs={rs}
            getLaneInfo={getLaneInfo}
            onPerkClick={selectAndAct}
          />

          {/* リザルト画面 */}
          <ResultScreen
            active={rs.screen === 'R'}
            game={rs.game}
            hasGold={store.hasUnlock('gold')}
            equippedStyles={store.data.eq}
          />
        </div>
      </LcdScreen>
    </DeviceFrame>
  );
};

export default RiskLcdGame;
