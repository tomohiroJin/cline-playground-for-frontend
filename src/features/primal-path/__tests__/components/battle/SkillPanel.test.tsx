/**
 * SkillPanel コンポーネントテスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkillPanel } from '../../../components/battle/SkillPanel';
import type { ASkillDef, ASkillId, SkillSt } from '../../../types';

describe('SkillPanel', () => {
  const mockOnUseSkill = jest.fn<void, [ASkillId]>();

  const mockSkills: ASkillDef[] = [
    {
      id: 'fB' as ASkillId,
      nm: '炎の爆発',
      ic: '🔥',
      ds: '全体に炎ダメージ',
      cd: 3,
      fx: { t: 'dmgAll', bd: 10, mul: 2 },
      ct: 'tech',
      rL: 3,
    },
  ];

  const defaultSk: SkillSt = { avl: ['fB' as ASkillId], cds: {}, bfs: [] };

  beforeEach(() => {
    mockOnUseSkill.mockClear();
  });

  it('スキルが表示される', () => {
    // Arrange & Act
    render(<SkillPanel skills={mockSkills} sk={defaultSk} onUseSkill={mockOnUseSkill} />);

    // Assert
    expect(screen.getByText(/炎の爆発/)).toBeInTheDocument();
  });

  it('クールダウン中のスキルにCD表示がある', () => {
    // Arrange
    const sk: SkillSt = { avl: ['fB' as ASkillId], cds: { fB: 2 } as SkillSt['cds'], bfs: [] };

    // Act
    render(<SkillPanel skills={mockSkills} sk={sk} onUseSkill={mockOnUseSkill} />);

    // Assert
    expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
  });

  it('スキルクリックでonUseSkillが呼ばれる', () => {
    // Arrange
    render(<SkillPanel skills={mockSkills} sk={defaultSk} onUseSkill={mockOnUseSkill} />);

    // Act
    fireEvent.click(screen.getByText(/炎の爆発/).closest('button')!);

    // Assert
    expect(mockOnUseSkill).toHaveBeenCalledWith('fB');
  });

  it('スキルが空なら何も表示しない', () => {
    // Arrange & Act
    const { container } = render(<SkillPanel skills={[]} sk={defaultSk} onUseSkill={mockOnUseSkill} />);

    // Assert
    expect(container.innerHTML).toBe('');
  });
});
