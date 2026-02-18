import React from 'react';
import type { DailyData, ModDef } from '../types';
import { MODS } from '../constants';
import { SeededRand, dateToSeed, getDailyId } from '../utils/seeded-random';
import {
  DailyLayer,
  DailyTitle,
  DailyDate,
  DailyModifier,
  DailyStatus,
  DailyAction,
} from './styles';

interface Props {
  active: boolean;
  dailyData: DailyData | null;
  onStart?: () => void;
  onBack?: () => void;
}

// デイリーのモディファイアをプレビュー（シードから決定論的に取得）
function getDailyMod(): ModDef | null {
  const id = getDailyId();
  const rng = new SeededRand(dateToSeed(id));
  // ステージ1以降で60%の確率でモディファイア付与（announce のロジックと同等）
  // デイリーでは必ずモディファイアを表示（ステージ0でもシードから決定）
  if (rng.chance(0.6)) {
    return rng.pick(MODS);
  }
  return null;
}

// デイリー条件表示画面
const DailyScreen: React.FC<Props> = ({ active, dailyData, onStart, onBack }) => {
  const dailyId = getDailyId();
  const mod = getDailyMod();

  return (
    <DailyLayer $active={active}>
      <DailyTitle>★ DAILY CARTRIDGE ★</DailyTitle>
      <DailyDate>{dailyId}</DailyDate>

      <DailyModifier>
        {mod ? (
          <>
            TODAY&apos;S MODIFIER:
            <br />
            ▶ {mod.nm}
            <br />
            {mod.ds}
          </>
        ) : (
          'NO MODIFIER TODAY'
        )}
      </DailyModifier>

      {dailyData?.played ? (
        <DailyStatus>BEST: {dailyData.bestScore}</DailyStatus>
      ) : (
        <DailyStatus>PLAYED: ---</DailyStatus>
      )}

      <DailyAction $selected onClick={onStart}>
        ▶ START DAILY
      </DailyAction>
      <DailyAction onClick={onBack}>
        ◁ BACK
      </DailyAction>
    </DailyLayer>
  );
};

export default DailyScreen;
