/**
 * RelatedTags コンポーネントのテスト
 *
 * TAG_MAP の実値を使用して検証する。
 * 'scrum' → 'スクラム', 'agile' → 'アジャイル原則'
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RelatedTags } from '../presentation/components/RelatedTags';

describe('RelatedTags', () => {
  it('タグの表示名をチップとして描画する', () => {
    render(<RelatedTags tags={['scrum', 'agile']} />);
    // TAG_MAP の実値: scrum → 'スクラム', agile → 'アジャイル原則'
    expect(screen.getByText(/#スクラム/)).toBeInTheDocument();
    expect(screen.getByText(/#アジャイル原則/)).toBeInTheDocument();
  });

  it('タグが空なら何も描画しない', () => {
    const { container } = render(<RelatedTags tags={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('onTagClick 非指定時はボタンではなく span として描画する', () => {
    render(<RelatedTags tags={['scrum']} />);
    // ボタンは存在しない
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    // スパンとして描画されている
    expect(screen.getByText(/#スクラム/)).toBeInTheDocument();
  });

  it('onTagClick 指定時はチップがボタンになりクリックで id を返す', () => {
    const handler = jest.fn();
    render(<RelatedTags tags={['scrum']} onTagClick={handler} />);
    screen.getByRole('button', { name: /#スクラム/ }).click();
    expect(handler).toHaveBeenCalledWith('scrum');
  });

  it('未知の tagId はそのまま表示する', () => {
    render(<RelatedTags tags={['unknown-tag']} />);
    expect(screen.getByText(/#unknown-tag/)).toBeInTheDocument();
  });

  it('複数タグを onTagClick ありで描画しそれぞれのボタンが正しい id を返す', () => {
    const handler = jest.fn();
    render(<RelatedTags tags={['scrum', 'testing']} onTagClick={handler} />);
    screen.getByRole('button', { name: /#スクラム/ }).click();
    expect(handler).toHaveBeenCalledWith('scrum');
    handler.mockClear();
    // TAG_MAP の実値: testing → 'テスト'
    screen.getByRole('button', { name: /#テスト/ }).click();
    expect(handler).toHaveBeenCalledWith('testing');
  });
});
