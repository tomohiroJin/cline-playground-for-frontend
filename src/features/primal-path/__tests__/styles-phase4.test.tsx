/**
 * Phase 4: 個別画面レイアウト調整テスト
 *
 * - BattleLog max-height が GameShell 高さに連動
 * - SkillBtn のサイズ拡大
 * - prefers-reduced-motion 対応
 * - 天候パーティクルの動的高さ
 */
import React from 'react';
import { render } from '@testing-library/react';
import { GameContainer, LogContainer, SkillBtn, BattleFixedBottom } from '../styles';

function renderAndGetCss(ui: React.ReactElement): string {
  const { unmount } = render(ui);
  const styles = Array.from(document.head.querySelectorAll('style'));
  const css = styles.map(s => s.textContent).join('');
  unmount();
  return css;
}

describe('Phase 4: 個別画面レイアウト調整', () => {
  it('LogContainer が --game-height に連動した max-height を持つ', () => {
    const css = renderAndGetCss(
      <GameContainer><LogContainer>テスト</LogContainer></GameContainer>
    );
    expect(css).toContain('--game-height');
  });

  it('SkillBtn が min-width: 120px, min-height: 52px を持つ', () => {
    const css = renderAndGetCss(
      <GameContainer><SkillBtn>テスト</SkillBtn></GameContainer>
    );
    expect(css).toContain('min-width:120px');
    expect(css).toContain('min-height:52px');
  });

  it('BattleFixedBottom が拡大されたパディングを持つ', () => {
    const css = renderAndGetCss(
      <GameContainer><BattleFixedBottom>テスト</BattleFixedBottom></GameContainer>
    );
    expect(css).toContain('10px 0 8px');
  });

  it('prefers-reduced-motion メディアクエリが含まれる', () => {
    const css = renderAndGetCss(
      <GameContainer>テスト</GameContainer>
    );
    expect(css).toContain('prefers-reduced-motion');
  });
});
