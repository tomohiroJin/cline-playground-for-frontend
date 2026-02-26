import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillGauge } from '../../components/SkillGauge';
import { SKILLS } from '../../constants';
import type { SkillType } from '../../types';

describe('SkillGauge', () => {
  const mockOnUseSkill = jest.fn();

  beforeEach(() => {
    mockOnUseSkill.mockClear();
  });

  describe('ゲージ表示', () => {
    test('チャージ率をパーセント表示すること', () => {
      render(<SkillGauge charge={50} onUseSkill={mockOnUseSkill} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    test('小数値を切り捨てて表示すること', () => {
      render(<SkillGauge charge={33.7} onUseSkill={mockOnUseSkill} />);
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    test('0%の場合も表示すること', () => {
      render(<SkillGauge charge={0} onUseSkill={mockOnUseSkill} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('スキルボタン', () => {
    test('チャージ100%未満の場合スキルボタンを表示しないこと', () => {
      render(<SkillGauge charge={99} onUseSkill={mockOnUseSkill} />);
      const skillKeys = Object.values(SKILLS).map(s => s.key);
      skillKeys.forEach(key => {
        expect(screen.queryByText(key)).not.toBeInTheDocument();
      });
    });

    test('チャージ100%の場合3つのスキルボタンを表示すること', () => {
      render(<SkillGauge charge={100} onUseSkill={mockOnUseSkill} />);
      expect(screen.getByText(SKILLS.laser.icon)).toBeInTheDocument();
      expect(screen.getByText(SKILLS.blast.icon)).toBeInTheDocument();
      expect(screen.getByText(SKILLS.clear.icon)).toBeInTheDocument();
    });

    test('スキルボタンクリック時にonUseSkillが呼ばれること', () => {
      render(<SkillGauge charge={100} onUseSkill={mockOnUseSkill} />);

      // laser ボタンを探してクリック
      const laserButton = screen.getByTitle(`${SKILLS.laser.name}: ${SKILLS.laser.desc}`);
      fireEvent.click(laserButton);
      expect(mockOnUseSkill).toHaveBeenCalledWith('laser');
    });

    test('各スキルボタンが正しいスキルタイプで呼ばれること', () => {
      render(<SkillGauge charge={100} onUseSkill={mockOnUseSkill} />);

      const skillTypes: SkillType[] = ['laser', 'blast', 'clear'];
      skillTypes.forEach(skillType => {
        const button = screen.getByTitle(
          `${SKILLS[skillType].name}: ${SKILLS[skillType].desc}`
        );
        fireEvent.click(button);
        expect(mockOnUseSkill).toHaveBeenCalledWith(skillType);
      });
    });
  });
});
