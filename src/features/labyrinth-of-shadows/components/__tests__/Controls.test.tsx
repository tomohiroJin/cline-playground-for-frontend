import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Controls } from '../Controls';

describe('Controls 加速ボタン', () => {
  test('押下で仮想キー e が立ち、離すと解除される', () => {
    const keysRef = { current: {} as Record<string, boolean> };
    render(
      <Controls keysRef={keysRef} hiding={false} energy={100} stamina={100}
        sprinting={false} speedCharges={1} boostActive={false} />
    );
    const btn = screen.getByText(/加速/).closest('button')!;
    fireEvent.pointerDown(btn);
    expect(keysRef.current['e']).toBe(true);
    fireEvent.pointerUp(btn);
    expect(keysRef.current['e']).toBe(false);
  });

  test('加速中はボタンが「加速中!」表示になる', () => {
    const keysRef = { current: {} as Record<string, boolean> };
    render(
      <Controls keysRef={keysRef} hiding={false} energy={100} stamina={100}
        sprinting={false} speedCharges={0} boostActive={true} />
    );
    expect(screen.getByText(/加速中/)).toBeInTheDocument();
  });
});
