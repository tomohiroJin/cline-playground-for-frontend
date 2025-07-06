import React from 'react';

/**
 * 難易度選択コンポーネントのプロパティ
 */
type DifficultySelectorProps = {
  value: number;
  onChange: (division: number) => void;
  disabled?: boolean;
};

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
    { value: 2, label: '簡単 (2x2)', description: '2x2の簡単なパズルです。初めての方におすすめ。' },
    { value: 3, label: '初級 (3x3)', description: '3x3の初級レベルのパズルです。' },
    { value: 4, label: '普通 (4x4)', description: '4x4の標準的な難易度のパズルです。' },
    { value: 5, label: '中級 (5x5)', description: '5x5の少し難しいパズルです。' },
    { value: 6, label: '難しい (6x6)', description: '6x6の難しいパズルです。集中力が必要です。' },
    { value: 8, label: '上級 (8x8)', description: '8x8の上級者向けパズルです。' },
    {
      value: 10,
      label: 'エキスパート (10x10)',
      description: '10x10のエキスパート向けパズルです。',
    },
    {
      value: 16,
      label: 'マスター (16x16)',
      description: '16x16のマスターレベルのパズルです。かなりの忍耐力が必要です。',
    },
    {
      value: 32,
      label: '超難関 (32x32)',
      description: '32x32の超難関パズルです。本気の挑戦者のみ！',
    },
  ];

  /**
   * 難易度変更時の処理
   *
   * @param event - イベントオブジェクト
   */
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = parseInt(event.target.value, 10);
    onChange(newValue);
  };

  return (
    <div className="flex flex-col items-center mb-5">
      <label htmlFor="difficulty-select" className="text-base mb-2 text-gray-800">
        難易度を選択
      </label>
      <div className="relative w-52">
        <select
          id="difficulty-select"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-full p-2 border rounded appearance-none bg-white text-base cursor-pointer focus:outline-none focus:border-green-500"
        >
          {difficultyOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800" />
      </div>
      <p className="text-sm text-gray-600 mt-1">
        {difficultyOptions.find(option => option.value === value)?.description || ''}
      </p>
    </div>
  );
};

export default DifficultySelector;
