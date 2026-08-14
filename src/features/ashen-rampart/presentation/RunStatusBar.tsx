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

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 8px;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  border-bottom: 1px solid ${COLORS.grid};
`;

const Life = styled.span<{ $danger: boolean }>`
  color: ${({ $danger }) => ($danger ? COLORS.dangerText : COLORS.secondary)};
  font-weight: 700;
`;

const PauseButton = styled.button`
  min-height: 44px;
  padding: 0 12px;
  margin-left: auto;
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
    <Bar>
      <span>
        砦 <Life $danger={danger} data-leaking={isLeaking}>残り {state.life}</Life>
      </span>
      {danger && <span>危険</span>}
      {lifeLossReason && <span>{lifeLossReason}</span>}
      <span>次: {preview}</span>
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
      <PauseButton type="button" onClick={onTogglePause}>
        {isPaused ? '再開' : '一時停止'}
      </PauseButton>
    </Bar>
  );
};
