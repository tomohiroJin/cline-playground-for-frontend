import React, { useState, useEffect, useRef } from 'react';
import type { RunState, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { aliveAllies } from '../game-logic';
import { StatLine, CivLevelsDisplay, AwakeningBadges, AllyList } from './shared';
import { IFS } from '../constants/ui';
import { Screen, SubTitle, Divider, GameButton, GamePanel, StatText, Gc, BiomeBg } from '../styles';

/** カウントダウン秒数 */
const COUNTDOWN_SECONDS = 3;

interface Props {
  run: RunState;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

export const PreFinalScreen: React.FC<Props> = ({ run, dispatch, playSfx }) => {
  const aliveA = aliveAllies(run.al).length;
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef = useRef(false);

  // カウントダウン開始（0未満にならないようガード）
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // カウントダウン完了で自動開始（二重発火防止）
  useEffect(() => {
    if (countdown === 0 && !firedRef.current) {
      firedRef.current = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      playSfx('boss');
      dispatch({ type: 'GO_FINAL_BOSS' });
    }
  }, [countdown, dispatch, playSfx]);

  const handleGoNow = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    playSfx('boss');
    dispatch({ type: 'GO_FINAL_BOSS' });
  };

  return (
    <Screen $center>
      <BiomeBg $biome="final" />
      <div style={{ fontSize: 26 }}>⚡</div>
      <SubTitle>全バイオーム踏破！</SubTitle>
      <Divider />
      <GamePanel style={{ textAlign: 'center', padding: 14 }}>
        <div style={{ fontSize: 15, color: '#f0c040', marginBottom: 10, letterSpacing: 1 }}>最終決戦の準備</div>
        <StatText style={{ fontSize: IFS.lg }}>
          <StatLine run={run} /> 会心 <Gc>{(run.cr * 100).toFixed(0)}%</Gc>
        </StatText>
        <StatText>🦴 {run.bE} <CivLevelsDisplay run={run} /> 👥 仲間{aliveA}体</StatText>
        {run.awoken.length > 0 && (
          <StatText style={{ marginTop: 4 }}><AwakeningBadges awoken={run.awoken} /></StatText>
        )}
        {run.burn > 0 && <StatText style={{ marginTop: 2, color: '#f08050' }}>🔥 火傷付与中</StatText>}
      </GamePanel>
      <AllyList allies={run.al} mode="evo" />

      {/* カウントダウン表示 */}
      {countdown > 0 && (
        <div style={{ fontSize: IFS.xl, color: '#f0c040', marginTop: 8, letterSpacing: 1 }}>
          最終戦開始まで…{countdown}
        </div>
      )}

      <GameButton
        style={{ marginTop: 10, minWidth: 190, borderColor: '#f0c04060', color: '#f0c040', fontSize: IFS.xl }}
        onClick={handleGoNow}
      >
        ⚡ すぐに挑む
      </GameButton>
    </Screen>
  );
};
