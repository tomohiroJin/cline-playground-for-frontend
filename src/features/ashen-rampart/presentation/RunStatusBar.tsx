/**
 * 灰燼の城壁 - ラン状態（上部固定）
 *
 * ライフ・進行・次ウェーブ予告・一時停止をまとめる（設計書 §9.1）。
 * 危険は赤に加えて必ずテキストでも示す（色だけに依存しない）。
 */
import React from 'react';
import styled from 'styled-components';
import type { CombatState } from '../domain/combat/combat-state';
import { nextWavePreview } from './wave-preview';
import { COLORS } from './theme';

/** 1行目（ライフ・危険・一時停止）。一時停止ボタンの最小タップ高 44px に合わせる */
export const STATUS_TOP_ROW_PX = 44;
/** 2行目（次ウェーブ予告）。2行ぶんを常に予約し、3行目以降は隠す */
export const STATUS_PREVIEW_ROW_PX = 40;
/** 3行目（ライフが減った理由・シード）。シード欄の高さ 32px に合わせる */
export const STATUS_REASON_ROW_PX = 32;
const STATUS_LINE_HEIGHT_PX = 20;

/**
 * 状態帯（反復7 段階2・設計書 §4.0 a）
 *
 * 段階1 までは flex-wrap の1行に「危険」「ライフが減った理由」を足していたため、
 * 幅によって行が増えて盤面が下がった。行の数と高さを固定したグリッドにし、
 * 一時表示は空でも同じ欄を占める。はみ出す文字は省略記号で切る（title で全文を読める）。
 */
const Bar = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: ${STATUS_TOP_ROW_PX}px ${STATUS_PREVIEW_ROW_PX}px ${STATUS_REASON_ROW_PX}px;
  align-items: center;
  column-gap: 12px;
  padding: 8px;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  border-bottom: 1px solid ${COLORS.grid};
`;

const SingleLine = styled.span`
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PreviewLine = styled.span`
  grid-column: 1 / -1;
  align-self: stretch;
  line-height: ${STATUS_LINE_HEIGHT_PX}px;
  overflow: hidden;
`;

const Life = styled.span<{ $danger: boolean }>`
  color: ${({ $danger }) => ($danger ? COLORS.dangerText : COLORS.secondary)};
  font-weight: 700;
`;

const PauseButton = styled.button`
  min-height: 44px;
  padding: 0 12px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
`;

const SeedField = styled.input`
  min-height: 32px;
  width: 90px;
  padding: 0 6px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
`;

/** ライフがこの値以下で危険表示に切り替える */
const DANGER_LIFE = 3;

interface Props {
  state: CombatState;
  isPaused: boolean;
  onTogglePause: () => void;
  /** 現在のランのシード。設計書 §4「常時表示・再現できることが分かる形で」に対応 */
  runSeed: number;
  /**
   * 直近に漏れ（敵の砦到達）が起きている最中か。
   * 共通運命の法則: 砦セルが脈動するのに HUD のライフが無音で減ると、
   * 同じ出来事が2つの別の出来事に見えてしまうため、ライフ表示を連動させる。
   */
  isLeaking?: boolean;
  /**
   * 直近にライフが減った理由（反復5・設計書 §5.4）。無ければ何も出さない。
   *
   * `state.events` は毎 tick 置き換わり1 tick（100ms）しか残らないため、
   * このコンポーネントが自前で導出すると人が読める前に消える。
   * 複数 tick 保持する責務は `useAshenRampartGame`（`overflowNotice` と同じパターン）
   * に持たせ、ここは受け取って描画するだけの純粋な表示に留める。
   */
  lifeLossReason?: string;
}

export const RunStatusBar: React.FC<Props> = ({
  state,
  isPaused,
  onTogglePause,
  runSeed,
  isLeaking = false,
  lifeLossReason,
}) => {
  const preview = nextWavePreview(state);
  const danger = state.life <= DANGER_LIFE || isLeaking;

  return (
    <Bar data-testid="run-status-bar">
      <SingleLine>
        砦 <Life $danger={danger} data-leaking={isLeaking}>残り {state.life}</Life>{' '}
        <span data-testid="danger-slot">{danger ? '危険' : ''}</span>
      </SingleLine>
      <PauseButton type="button" onClick={onTogglePause}>
        {isPaused ? '再開' : '一時停止'}
      </PauseButton>
      <PreviewLine>次: {preview}</PreviewLine>
      <SingleLine data-testid="life-loss-reason-slot" title={lifeLossReason}>
        {lifeLossReason ?? ''}
      </SingleLine>
      <span>
        <label htmlFor="ashen-rampart-run-seed">シード</label>
        <SeedField
          id="ashen-rampart-run-seed"
          type="text"
          readOnly
          value={String(runSeed)}
          onFocus={(event) => event.currentTarget.select()}
        />
      </span>
    </Bar>
  );
};
