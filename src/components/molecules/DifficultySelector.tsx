import React from 'react';
import {
  SelectorContainer,
  Label,
  SelectWrapper,
  StyledSelect,
  SelectArrow,
  Description,
} from './DifficultySelector.styles';

// プロパティの型定義
interface DifficultySelectorProps {
  value: number;
  onChange: (division: number) => void;
  disabled?: boolean;
}

/**
 * 難易度選択コンポーネント
 */
const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  // 難易度オプション
  const difficultyOptions = [
    { value: 2, label: '簡単 (2x2)' },
    { value: 3, label: '初級 (3x3)' },
    { value: 4, label: '普通 (4x4)' },
    { value: 5, label: '中級 (5x5)' },
    { value: 6, label: '難しい (6x6)' },
    { value: 8, label: '上級 (8x8)' },
    { value: 10, label: 'エキスパート (10x10)' },
    { value: 16, label: 'マスター (16x16)' },
    { value: 32, label: '超難関 (32x32)' },
  ];

  // 選択が変更されたときの処理
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = parseInt(event.target.value, 10);
    onChange(newValue);
  };

  // 現在選択されている難易度の説明
  const getDescription = (division: number) => {
    switch (division) {
      case 2:
        return '2x2の簡単なパズルです。初めての方におすすめ。';
      case 3:
        return '3x3の初級レベルのパズルです。';
      case 4:
        return '4x4の標準的な難易度のパズルです。';
      case 5:
        return '5x5の少し難しいパズルです。';
      case 6:
        return '6x6の難しいパズルです。集中力が必要です。';
      case 8:
        return '8x8の上級者向けパズルです。';
      case 10:
        return '10x10のエキスパート向けパズルです。';
      case 16:
        return '16x16のマスターレベルのパズルです。かなりの忍耐力が必要です。';
      case 32:
        return '32x32の超難関パズルです。本気の挑戦者のみ！';
      default:
        return '';
    }
  };

  return (
    <SelectorContainer>
      <Label htmlFor="difficulty-select">難易度を選択</Label>
      <SelectWrapper>
        <StyledSelect
          id="difficulty-select"
          value={value}
          onChange={handleChange}
          disabled={disabled}
        >
          {difficultyOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </StyledSelect>
        <SelectArrow />
      </SelectWrapper>
      <Description>{getDescription(value)}</Description>
    </SelectorContainer>
  );
};

export default DifficultySelector;
