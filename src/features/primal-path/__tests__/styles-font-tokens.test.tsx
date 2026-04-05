/**
 * フォントサイズの CSS 変数化テスト
 *
 * styles.ts の主要コンポーネントがハードコードのフォントサイズではなく
 * CSS 変数（var(--fs-*)）を使用していることを検証する。
 */
import React from 'react';
import { render } from '@testing-library/react';
import {
  GameContainer, Title, SubTitle, GameButton, StatText,
  LogContainer, SpeedBtn, SurrenderBtn, AllyBadge, TierHeader,
  TreeNodeBox, SkillBtn, TabBtn,
} from '../styles';

/** レンダリング後の全 CSS 文字列を取得するヘルパー */
function renderAndGetCss(ui: React.ReactElement): string {
  const { unmount } = render(ui);
  const styles = Array.from(document.head.querySelectorAll('style'));
  const css = styles.map(s => s.textContent).join('');
  unmount();
  return css;
}

describe('フォントサイズ CSS 変数化', () => {
  it('Title が var(--fs-title) を使用する', () => {
    const css = renderAndGetCss(<GameContainer><Title>テスト</Title></GameContainer>);
    expect(css).toContain('var(--fs-title');
  });

  it('SubTitle が var(--fs-subtitle) を使用する', () => {
    const css = renderAndGetCss(<GameContainer><SubTitle>テスト</SubTitle></GameContainer>);
    expect(css).toContain('var(--fs-subtitle');
  });

  it('GameButton が var(--fs-button) を使用する', () => {
    const css = renderAndGetCss(<GameContainer><GameButton>テスト</GameButton></GameContainer>);
    expect(css).toContain('var(--fs-button');
  });

  it('StatText が var(--fs-panel) を使用する', () => {
    const css = renderAndGetCss(<GameContainer><StatText>テスト</StatText></GameContainer>);
    expect(css).toContain('var(--fs-panel');
  });

  it('LogContainer が var(--fs-tiny) を使用する', () => {
    const css = renderAndGetCss(<GameContainer><LogContainer>テスト</LogContainer></GameContainer>);
    expect(css).toContain('var(--fs-tiny');
  });

  it('SpeedBtn が var(--fs-tiny) を使用する', () => {
    const css = renderAndGetCss(<GameContainer><SpeedBtn>テスト</SpeedBtn></GameContainer>);
    expect(css).toContain('var(--fs-tiny');
  });

  it('SurrenderBtn が var(--fs-tiny) を使用する', () => {
    const css = renderAndGetCss(<GameContainer><SurrenderBtn>テスト</SurrenderBtn></GameContainer>);
    expect(css).toContain('var(--fs-tiny');
  });

  it('AllyBadge が var(--fs-tiny) を使用する', () => {
    const css = renderAndGetCss(<GameContainer><AllyBadge>テスト</AllyBadge></GameContainer>);
    expect(css).toContain('var(--fs-tiny');
  });

  it('TierHeader が var(--fs-panel) を使用する', () => {
    const css = renderAndGetCss(<GameContainer><TierHeader>テスト</TierHeader></GameContainer>);
    expect(css).toContain('var(--fs-panel');
  });

  it('TreeNodeBox が var(--fs-panel) を使用する', () => {
    const css = renderAndGetCss(<GameContainer><TreeNodeBox>テスト</TreeNodeBox></GameContainer>);
    expect(css).toContain('var(--fs-panel');
  });

  it('SkillBtn が var(--fs-panel) を使用する', () => {
    const css = renderAndGetCss(<GameContainer><SkillBtn>テスト</SkillBtn></GameContainer>);
    expect(css).toContain('var(--fs-panel');
  });

  it('TabBtn が var(--fs-panel) を使用する', () => {
    const css = renderAndGetCss(<GameContainer><TabBtn>テスト</TabBtn></GameContainer>);
    expect(css).toContain('var(--fs-panel');
  });
});
