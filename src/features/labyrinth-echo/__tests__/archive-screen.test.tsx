import { render, screen, fireEvent } from '@testing-library/react';
import { ArchiveScreen } from '../components/ArchiveScreen';
import { createMetaState } from '../domain/models/meta-state';

const setup = (overrides = {}) =>
  render(<ArchiveScreen Particles={null} meta={createMetaState(overrides)} setPhase={() => undefined} />);

describe('ArchiveScreen', () => {
  it('未発見の先人は ??? 表示でカード名が隠れる', () => {
    setup({ echoDepth: 0, fragments: [] });
    // 写本師リアンも未発見 → 名前は出ず ??? が複数
    expect(screen.queryByText('写本師リアン')).toBeNull();
    expect(screen.getAllByText('？？？').length).toBeGreaterThan(0);
  });

  it('断片を1つ収集すると先人名が開示される', () => {
    setup({ echoDepth: 1, fragments: ['f_lian_1'] });
    expect(screen.getByText('写本師リアン')).toBeInTheDocument();
  });

  it('収集済み断片をクリックすると本文リーダーが開く', () => {
    setup({ echoDepth: 1, fragments: ['f_lian_1'] });
    // ボタンは "▣ 写本師の最初の頁" のため部分一致（正規表現）で取得
    fireEvent.click(screen.getByText(/写本師の最初の頁/));
    // リーダー側にもタイトルが出るため2箇所以上にマッチ
    expect(screen.getAllByText(/写本師の最初の頁/).length).toBeGreaterThan(1);
  });

  it('進捗テキストが 収集数/総数 を表示する', () => {
    setup({ echoDepth: 1, fragments: ['f_lian_1'] });
    expect(screen.getByText(/1\s*\/\s*19/)).toBeInTheDocument();
  });

  it('真相レイヤーは echoDepth に応じて開示される', () => {
    setup({ echoDepth: 1, fragments: ['f_lian_1'] });
    expect(screen.getByText('残響の正体')).toBeInTheDocument();
    expect(screen.queryByText('迷宮の意図')).toBeNull(); // depthGate3 未満
  });
});
