/**
 * GameShell / GameContainer / Screen のレイアウトテスト
 *
 * styled-components は jsdom で CSS を <style> タグに注入するため、
 * getComputedStyle では値が取得できない。
 * ここでは生成された CSS 文字列の検証を行う。
 */
import React from 'react';
import { render } from '@testing-library/react';
import { GameContainer, GameShell, Screen } from '../styles';

describe('GameShell レイアウト', () => {
  it('GameShell がレンダリングできる', () => {
    const { container } = render(
      <GameContainer>
        <GameShell data-testid="shell">テスト</GameShell>
      </GameContainer>
    );
    const shell = container.querySelector('[data-testid="shell"]');
    expect(shell).toBeTruthy();
  });

  it('GameShell に style タグ内で width: 720px が含まれる', () => {
    render(
      <GameContainer>
        <GameShell>テスト</GameShell>
      </GameContainer>
    );
    const styleTag = document.head.querySelector('style');
    expect(styleTag).toBeTruthy();
    const css = styleTag!.textContent || '';
    expect(css).toContain('width:720px');
    expect(css).toContain('height:960px');
  });

  it('Screen コンポーネントが var(--sp-screen-pad) パディングを使用する', () => {
    render(
      <GameContainer>
        <Screen>テスト</Screen>
      </GameContainer>
    );
    const styleTag = document.head.querySelector('style');
    const css = styleTag!.textContent || '';
    expect(css).toContain('--sp-screen-pad');
  });

  it('GameShell に dvh フォールバック付きモバイルスタイルが含まれる', () => {
    render(
      <GameContainer>
        <GameShell>テスト</GameShell>
      </GameContainer>
    );
    const styles = Array.from(document.head.querySelectorAll('style'));
    const css = styles.map(s => s.textContent).join('');
    expect(css).toContain('100dvh');
  });
});
