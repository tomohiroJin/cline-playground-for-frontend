import React from 'react';
import { render, screen } from '@testing-library/react';
import { CellComponent } from '../../components/CellView';
import { POWER_TYPES } from '../../constants';

describe('CellComponent', () => {
  describe('基本描画', () => {
    test('指定された色でセルを描画すること', () => {
      const { container } = render(
        <CellComponent x={2} y={3} color="#FF6B6B" size={30} />
      );
      const cell = container.firstChild as HTMLElement;
      expect(cell).toBeInTheDocument();
    });

    test('パワーアップなしの場合アイコンを表示しないこと', () => {
      const { container } = render(
        <CellComponent x={0} y={0} color="#FF6B6B" size={30} />
      );
      expect(container.textContent).toBe('');
    });
  });

  describe('パワーアップ表示', () => {
    test('tripleパワーアップのアイコンを表示すること', () => {
      const { container } = render(
        <CellComponent x={0} y={0} color="#FF6B6B" size={30} power="triple" />
      );
      expect(container.textContent).toBe(POWER_TYPES.triple.icon);
    });

    test('bombパワーアップのアイコンを表示すること', () => {
      const { container } = render(
        <CellComponent x={0} y={0} color="#FF6B6B" size={30} power="bomb" />
      );
      expect(container.textContent).toBe(POWER_TYPES.bomb.icon);
    });

    test('pierceパワーアップのアイコンを表示すること', () => {
      const { container } = render(
        <CellComponent x={0} y={0} color="#FF6B6B" size={30} power="pierce" />
      );
      expect(container.textContent).toBe(POWER_TYPES.pierce.icon);
    });

    test('power=null の場合アイコンを表示しないこと', () => {
      const { container } = render(
        <CellComponent x={0} y={0} color="#FF6B6B" size={30} power={null} />
      );
      expect(container.textContent).toBe('');
    });
  });
});
