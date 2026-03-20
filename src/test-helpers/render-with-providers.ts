/**
 * テスト用レンダリングヘルパー
 *
 * Jotai Provider 付きのレンダリングラッパー。
 */
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'jotai';

/**
 * Jotai Provider でラップしてレンダリングする
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(Provider, null, children);

  return render(ui, { wrapper: Wrapper, ...options });
};
