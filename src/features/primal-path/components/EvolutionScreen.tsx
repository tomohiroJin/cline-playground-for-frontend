import React, { useMemo } from 'react';
import type { RunState, Evolution, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { BIO, TC, TN, CIV_TYPES, SYNERGY_TAG_INFO } from '../constants';
import { effATK, simEvo, civLvs, civLv, awkInfo, calcSynergies } from '../game-logic';
import { ProgressBar, StatPreview, CivBadge, AwakeningBadges, CivLevelsDisplay, StatLine, AffinityBadge, AllyList, SynergyBadges, SpeedControl, renderParticles } from './shared';
import { IFS } from '../constants/ui';
import { Screen, SubTitle, EvoCard, GamePanel, GameButton, StatText, SpeedBar, Gc, BiomeBg, WeatherParticles } from '../styles';

interface Props {
  run: RunState;
  evoPicks: Evolution[];
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  battleSpd: number;
}

export const EvolutionScreen: React.FC<Props> = ({ run, evoPicks, dispatch, playSfx, battleSpd }) => {
  const m = BIO[run.cBT as keyof typeof BIO];
  const lvs = civLvs(run);
  const nxtA = awkInfo(run);
  const curA = effATK(run);
  const activeSynergies = calcSynergies(run.evs);
  const biomeForBg = run.cBT as string;
  const particles = useMemo(() => renderParticles(biomeForBg), [biomeForBg]);

  // maxEvo 到達判定
  const isMaxEvoReached = run.maxEvo !== undefined && run.evs.length >= run.maxEvo;

  const handlePick = (ev: Evolution) => {
    const before = calcSynergies(run.evs);
    const after = calcSynergies([...run.evs, ev]);
    if (after.length > before.length) playSfx('synergy');
    playSfx('evo');
    dispatch({ type: 'SELECT_EVO', evo: ev });
  };

  return (
    <Screen>
      <BiomeBg $biome={biomeForBg} />
      <WeatherParticles $biome={biomeForBg}>
        {particles}
      </WeatherParticles>
      <div style={{ fontSize: 16, marginTop: 2 }}>⚡</div>
      <SubTitle style={{ fontSize: IFS.xl }}>{isMaxEvoReached ? '進化上限' : '進化を選べ'}</SubTitle>
      {m && <ProgressBar current={run.cW} max={run.wpb + 1} label={`${m.ic} ${m.nm}`} />}
      <StatText style={{ marginBottom: 2 }}>
        <CivLevelsDisplay run={run} /> <AwakeningBadges awoken={run.awoken} />
        <AffinityBadge biome={run.cBT} levels={lvs} />
      </StatText>

      {nxtA.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 3 }}>
          {nxtA.map((a, i) => (
            <span key={i} style={{
              fontSize: IFS.xs, color: a.cl, background: a.cl + '10',
              border: `1px solid ${a.cl}30`, padding: '1px 4px', borderRadius: 6,
            }}>
              {a.nm} {a.need}
            </span>
          ))}
        </div>
      )}

      {/* シナジー状況 */}
      <SynergyBadges synergies={activeSynergies} showCount />

      {/* maxEvo 到達時: 進化選択肢の代わりにスキップUIを表示 */}
      {isMaxEvoReached && (
        <GamePanel style={{ textAlign: 'center', padding: 12, marginTop: 6 }}>
          <div style={{ fontSize: IFS.lg, color: '#f08050', marginBottom: 6 }}>
            進化上限に達しました（{run.evs.length}/{run.maxEvo}）
          </div>
          <GameButton
            style={{ minWidth: 160 }}
            onClick={() => { playSfx('click'); dispatch({ type: 'SKIP_EVO' }); }}
          >
            ⚔️ バトルへ
          </GameButton>
        </GamePanel>
      )}

      {!isMaxEvoReached && evoPicks.map((ev, i) => {
        const sim = simEvo(run, ev);
        const lvUp = { ...lvs, [ev.t]: lvs[ev.t] + 1 };
        return (
          <EvoCard key={i} $rare={!!ev.r} onClick={() => handlePick(ev)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: IFS.lg, color: '#f0c040' }}>{ev.r ? '★ ' : ''}{ev.n}</span>{' '}
                <span style={{ fontSize: IFS.sm, color: '#908870' }}>{ev.d}</span>
                <span style={{
                  fontSize: IFS.xs, padding: '0 4px', borderRadius: 6, marginLeft: 3,
                  background: TC[ev.t] + '20', color: TC[ev.t], border: `1px solid ${TC[ev.t]}40`,
                }}>
                  {TN[ev.t]} Lv{lvUp[ev.t]}
                </span>
              </div>
              <CivBadge type={ev.t} />
            </div>
            <div style={{ marginTop: 3 }}>
              <StatPreview label="ATK" current={curA} next={sim.atk} max={Math.max(curA, sim.atk, 50)} color="#f08050" />
              <StatPreview label="HP" current={run.hp} next={sim.hp} max={Math.max(sim.mhp, run.mhp)} color="#55ee55" />
              <StatPreview label="DEF" current={run.def} next={sim.def} max={Math.max(run.def, sim.def, 20)} color="#50c8e8" />
              {sim.cr !== run.cr && (
                <StatPreview label="会心" current={Math.round(run.cr * 100)} next={Math.round(sim.cr * 100)} max={Math.max(Math.round(sim.cr * 100), 30)} color="#f0c040" />
              )}
              {ev.e.aHL && <div style={{ fontSize: IFS.xs, color: '#50e090', marginTop: 1 }}>💚 仲間HP+{ev.e.aHL}</div>}
              {ev.e.bb && <div style={{ fontSize: IFS.xs, color: '#e0c060', marginTop: 1 }}>🦴 骨+{ev.e.bb}</div>}
              {ev.e.revA && <div style={{ fontSize: IFS.xs, color: '#d060ff', marginTop: 1 }}>✨ 仲間蘇生 HP{ev.e.revA}%</div>}
              {ev.tags && ev.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
                  {ev.tags.map(tag => {
                    const info = SYNERGY_TAG_INFO[tag];
                    // 取得後のタグ数を計算
                    const curCount = run.evs.filter(e2 => e2.tags?.includes(tag)).length;
                    const nextCount = curCount + 1;
                    const isNew = nextCount === 2;
                    return (
                      <span key={tag} style={{
                        fontSize: IFS.xs, color: info.cl, padding: '0 3px', borderRadius: 4,
                        background: isNew ? info.cl + '30' : info.cl + '10',
                        border: `1px solid ${info.cl}${isNew ? '60' : '25'}`,
                      }}>
                        {info.ic}{info.nm} {curCount}→{nextCount}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </EvoCard>
        );
      })}

      {(() => {
        const hints: React.ReactNode[] = [];
        if (run.al.length < run.mxA) {
          const nxtLvs = [2, 4, 6];
          CIV_TYPES.forEach(t => {
            const lv = civLv(run, t);
            nxtLvs.forEach(nl => {
              if (lv < nl && lv + 1 === nl) {
                hints.push(
                  <span key={`${t}-${nl}`} style={{ fontSize: IFS.xs, color: TC[t] }}>{TN[t]}Lv{nl}で仲間加入 </span>
                );
              }
            });
          });
        }
        return null; // hints rendered inside panel below
      })()}

      <GamePanel style={{ marginTop: 3, padding: '4px 8px' }}>
        <StatText>
          <StatLine run={run} /> 会心 <Gc>{(run.cr * 100).toFixed(0)}%</Gc> 🦴 <Gc>{run.bE}</Gc>
        </StatText>
        <AllyList allies={run.al} mode="evo" />
      </GamePanel>

      {/* 速度切替（進化選択中も速度変更可能） */}
      <SpeedBar>
        <SpeedControl battleSpd={battleSpd} dispatch={dispatch} />
      </SpeedBar>
    </Screen>
  );
};
