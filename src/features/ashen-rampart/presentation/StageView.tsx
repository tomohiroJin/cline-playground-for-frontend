/**
 * 灰燼の城壁 - 1ステージの戦闘画面（反復7 段階1・設計書 §3.2）
 *
 * 反復6 までの RunView（単発ラン）を遠征の1ステージに縮めたもの。
 * 勝敗理由の記録・集計・再挑戦・ログのコピーは遠征の結果画面
 * （ExpeditionSummary）へ移した。ステージごとに出すと、遠征の途中で
 * 集計が答えを教えてしまう（反復5 Task 12 の「記録してから集計」と同じ理由）。
 *
 * **ステージが変わるたびに key を変えて再マウントすること**（ExpeditionView）。
 * フックの ref（選択中カード・通知・集計）がステージをまたいで残らないようにする。
 */
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import type { StageMap } from '../domain/board/stage-map';
import type { CombatState } from '../domain/combat/combat-state';
import type { StageResult } from '../domain/expedition/expedition-state';
import { useAshenRampartGame } from './useAshenRampartGame';
import { RunStatusBar } from './RunStatusBar';
import { BoardGrid } from './BoardGrid';
import { HandArea } from './HandArea';
import { BoardInfoSlot } from './BoardInfoSlot';
import { EnemyLegend } from './EnemyLegend';
import { LevyChoice } from './LevyChoice';
import { BattleAnnouncer } from './BattleAnnouncer';
import { CountdownDisplay } from './CountdownDisplay';
import { COLORS } from './theme';
import { HEADER_CLEARANCE } from './layout-constants';

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 70vh;
  padding-top: ${HEADER_CLEARANCE};
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
`;

/**
 * 盤面・盤面の下の枠・凡例・決着
 *
 * `flex: 1` を持たせない（反復7 段階2・設計書 §4.0 a）。持たせると、中身が
 * Layout の min-height（70vh）未満のとき手札が伸びた分だけ Center が縮み、
 * 手札の上端が上がる。
 */
const Center = styled.div`
  padding: 12px;
`;

const BoardWrapper = styled.div`
  position: relative;
`;

const Result = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  padding: 16px;
`;

const ActionButton = styled.button`
  min-height: 44px;
  padding: 0 16px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

/** 決着ボタンの文言。勝って次のステージがあるときだけ獲得へ進む */
export const SETTLE_TO_OFFER_LABEL = '獲得へ進む';
export const SETTLE_TO_SUMMARY_LABEL = '遠征の結果へ';

export interface StageViewProps {
  cards: readonly string[];
  seed: number;
  map: StageMap;
  initialState: CombatState;
  expeditionId: string;
  stageIndex: number;
  /** 最終ステージか。決着ボタンの文言を決める */
  isFinalStage: boolean;
  /** 盤面の上に出す遠征の帯（ExpeditionBar） */
  banner?: React.ReactNode;
  onSettled: (result: StageResult) => void;
}

export const StageView: React.FC<StageViewProps> = ({
  cards,
  seed,
  map,
  initialState,
  expeditionId,
  stageIndex,
  isFinalStage,
  banner,
  onSettled,
}) => {
  const game = useAshenRampartGame({ cards, seed, map, initialState, expeditionId, stageIndex });
  // 決着ボタンは押すと無効にする（PR #211 Fix B）。二重クリックで settleStage が
  // 再描画前に2回呼ばれると advanceStage が非'stage'フェーズに対して走るため、
  // OfferChoice と同じ考え方でUI側からも二重送信の経路を断つ
  const [isSettled, setIsSettled] = useState(false);

  // スペースキーで一時停止（設計書 §9.6）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // 入力要素にフォーカスがある間はスペースを奪わない
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)
      ) {
        return;
      }
      if (event.code !== 'Space') return;
      event.preventDefault();
      game.togglePause();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game]);

  const isLevyBlocked = game.isPaused || game.state.outcome !== 'playing';

  return (
    <Layout data-testid="ashen-rampart-layout" data-header-clearance={HEADER_CLEARANCE}>
      {/* 徴発は構築・獲得の両プールから外れており（availability: 'retired'）遠征では描画されない。
          盤面の上に残すが高さは変わらない（反復7 段階2 §4.0 a。§3.5 により徴発の UI は触らない） */}
      <LevyChoice options={game.levyOptions} onChoose={game.chooseLevy} disabled={isLevyBlocked} />
      {banner}
      <RunStatusBar
        state={game.state}
        isPaused={game.isPaused}
        onTogglePause={game.togglePause}
        runSeed={game.runSeed}
        isLeaking={game.effects.some((e) => e.kind === 'leak')}
        lifeLossReason={game.lifeLossReason}
      />
      <Center>
        <BattleAnnouncer message={game.announcement} />
        <BoardWrapper data-testid="board-wrapper">
          <BoardGrid
            map={game.map}
            state={game.state}
            placeableCells={game.placeableCells}
            effects={game.effects}
            onCellClick={game.interactCell}
            inspectedPlate={game.inspectedPlate}
          />
          <CountdownDisplay tick={game.state.tick} />
        </BoardWrapper>
        <BoardInfoSlot
          rejectionNotice={game.rejectionNotice}
          inspectedPlate={game.inspectedPlate}
          // 選択中に開いたパネルでは再点火チップを出さない（反復7 段階2・§4.3 #4）
          isDuringCardSelection={game.selectedIndex !== null}
        />
        <EnemyLegend />
        {game.state.outcome !== 'playing' && (
          <Result>
            <p>{game.state.outcome === 'won' ? '砦は守られた' : '城壁は灰燼に帰した'}</p>
            <ActionButton
              type="button"
              disabled={isSettled}
              onClick={() => {
                setIsSettled(true);
                onSettled({ won: game.state.outcome === 'won', lifeLeft: game.state.life });
              }}
            >
              {game.state.outcome === 'won' && !isFinalStage ? SETTLE_TO_OFFER_LABEL : SETTLE_TO_SUMMARY_LABEL}
            </ActionButton>
          </Result>
        )}
      </Center>
      <HandArea
        state={game.state}
        selectedIndex={game.selectedIndex}
        onSelect={game.selectCard}
        onDiscard={game.discardCard}
        overflowNotice={game.overflowNotice}
      />
    </Layout>
  );
};
