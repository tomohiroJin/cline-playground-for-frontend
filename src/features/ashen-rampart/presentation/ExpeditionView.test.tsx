/**
 * 灰燼の城壁 - ExpeditionView のステージ跨ぎ遷移テスト（Fix Round 2）
 *
 * `AshenRampartGame.test.tsx` の統合テストは無配置で遠征を進めるため、
 * 層1 を突破できず（Fix Round 1 の探索結果・探索・実測とも 1〜500 のどの
 * シードでも速攻型・重厚型ともに無配置では層1 を突破できなかった）、
 * ステージ2・3 への遷移や `isFinalStage` を決定的に検査できない。
 *
 * ここでは `StageView` を軽量スタブに差し替え、勝敗を
 * 「勝ったことにする」「負けたことにする」ボタンで即座に決着させることで、
 * ExpeditionView が持つ「決着 → 獲得3択 → 次ステージ（新しい key で再マウント）」
 * の配線だけを、ステージ内部の戦闘ロジックに依存せず検査する。
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpeditionView } from './ExpeditionView';
import { markBriefingSeen } from './briefing-seen';
import { PRESET_DECKS } from '../domain/cards/card-pool';
import type { StageViewProps } from './StageView';

/** StageView スタブの実マウント回数。beforeEach でリセットする（"mock" 接頭辞は jest.mock のホイスト制約による） */
let mockStageViewMounts = 0;

jest.mock('./StageView', () => {
  // jest.mock はファイル先頭へホイストされるため、外側の import を直接参照できない。
  // useEffect だけをこの場で読み込む（マウント回数の計測に使う）
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- ホイスト制約のためモック内で読み込む
  const { useEffect } = require('react') as typeof import('react');
  const StageView = (props: StageViewProps): React.ReactElement => {
    useEffect(() => {
      mockStageViewMounts += 1;
    }, []);
    return (
      <div>
        {props.banner}
        <p>{`ステージ番号:${props.stageIndex}`}</p>
        <p>{`最終:${String(props.isFinalStage)}`}</p>
        <button type="button" onClick={() => props.onSettled({ won: true, lifeLeft: 10 })}>
          勝ったことにする
        </button>
        <button type="button" onClick={() => props.onSettled({ won: false, lifeLeft: 0 })}>
          負けたことにする
        </button>
      </div>
    );
  };
  return { StageView };
});

// PRESET_DECKS.swift.cards は readonly string[]。Props.cards は string[] を要求するため複製する
const SWIFT_CARDS = [...PRESET_DECKS.swift!.cards];
const SEED = 42;

/** 獲得の3択から先頭のカードを選ぶ */
const chooseFirstOffer = (): void => {
  fireEvent.click(screen.getAllByRole('button', { name: / を加える$/ })[0]!);
};

describe('ExpeditionView（Fix Round 2: ステージ跨ぎの遷移を決定的に検査する）', () => {
  beforeEach(() => {
    localStorage.clear();
    // ブリーフィング（説明画面）を既読にしてスキップし、最初からステージ画面にする
    markBriefingSeen();
    mockStageViewMounts = 0;
  });

  it('勝つと獲得の3択が出て、選ぶとステージ番号1 の StageView が新しくマウントされる', () => {
    render(<ExpeditionView cards={SWIFT_CARDS} seed={SEED} onRetry={jest.fn()} onRebuild={jest.fn()} />);
    expect(screen.getByText('ステージ番号:0')).toBeInTheDocument();
    expect(screen.getByText('最終:false')).toBeInTheDocument();
    // banner（ExpeditionBar）がスタブ経由で描画されていることも確認する
    expect(screen.getByRole('status', { name: '遠征の進み具合' })).toBeInTheDocument();
    expect(mockStageViewMounts).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: '勝ったことにする' }));
    expect(screen.getAllByRole('button', { name: / を加える$/ }).length).toBeGreaterThan(0);

    chooseFirstOffer();

    expect(screen.getByText('ステージ番号:1')).toBeInTheDocument();
    expect(screen.getByText('最終:false')).toBeInTheDocument();
    expect(mockStageViewMounts).toBe(2);
  });

  it('2回勝って獲得すると最終ステージ（最終:true）になり、そこで勝つと「遠征を踏破した」が出る', () => {
    render(<ExpeditionView cards={SWIFT_CARDS} seed={SEED} onRetry={jest.fn()} onRebuild={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '勝ったことにする' }));
    chooseFirstOffer();
    expect(screen.getByText('ステージ番号:1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '勝ったことにする' }));
    chooseFirstOffer();
    expect(screen.getByText('ステージ番号:2')).toBeInTheDocument();
    expect(screen.getByText('最終:true')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '勝ったことにする' }));

    expect(screen.getByText('遠征を踏破した')).toBeInTheDocument();
  });

  it('層1 で負けると獲得を経ずに「遠征は層1 で潰えた」が出る', () => {
    render(<ExpeditionView cards={SWIFT_CARDS} seed={SEED} onRetry={jest.fn()} onRebuild={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '負けたことにする' }));

    expect(screen.getByText('遠征は層1 で潰えた')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: / を加える$/ })).not.toBeInTheDocument();
  });

  it('獲得の画面に辞退の手段が出ない（ボタンは「…を加える」だけ）', () => {
    render(<ExpeditionView cards={SWIFT_CARDS} seed={SEED} onRetry={jest.fn()} onRebuild={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '勝ったことにする' }));

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => {
      expect(button).toHaveAccessibleName(/ を加える$/);
    });
  });
});
