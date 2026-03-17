/**
 * カテゴリ別正答率バーコンポーネント
 */
import React from 'react';
import { CategoryStats } from '../domain/types';
import { CATEGORY_NAMES, getColorByThreshold } from '../constants';
import {
  CategoryBarContainer,
  CategoryBadge,
  CategoryName,
  CategoryValue,
} from './styles';

interface CategoryBarProps {
  cats: CategoryStats;
}

/** カテゴリバー */
export const CategoryBar: React.FC<CategoryBarProps> = ({ cats }) => {
  const keys = Object.keys(cats);
  if (!keys.length) return null;

  return (
    <CategoryBarContainer>
      {keys.map((k) => {
        const c = cats[k];
        const rate = c.total ? Math.round((c.correct / c.total) * 100) : 0;
        const color = getColorByThreshold(rate, 70, 50);
        return (
          <CategoryBadge key={k} $color={color}>
            <CategoryName>{CATEGORY_NAMES[k] ?? k} </CategoryName>
            <CategoryValue $color={color}>{rate}%</CategoryValue>
          </CategoryBadge>
        );
      })}
    </CategoryBarContainer>
  );
};
