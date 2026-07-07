import React from 'react';
import { render, screen } from '@testing-library/react';
import { ArtFrame } from './ArtFrame';

describe('ArtFrame', () => {
  it('子要素を額縁の中に描画する', () => {
    render(
      <ArtFrame>
        <img alt="作品" src="art.webp" />
      </ArtFrame>
    );
    const frame = screen.getByTestId('art-frame');
    expect(frame).toContainElement(screen.getByAltText('作品'));
  });

  it('className を外側へ引き継ぐ', () => {
    render(<ArtFrame className="hero">中身</ArtFrame>);
    expect(screen.getByTestId('art-frame')).toHaveClass('hero');
  });
});
