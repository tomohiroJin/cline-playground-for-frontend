import React, { useState, useEffect } from 'react';
import { getImageSize } from '../../utils/puzzle-utils';
import {
  SelectorContainer,
  Title,
  ImagesGrid,
  ImageItem,
  DefaultImage,
  SelectedIndicator,
} from './DefaultImageSelector.styles';

// デフォルト画像の定義
const DEFAULT_IMAGES = [
  {
    id: 1,
    src: '/images/default/nature1.jpg',
    alt: '自然の風景1',
  },
  {
    id: 2,
    src: '/images/default/nature2.jpg',
    alt: '自然の風景2',
  },
  {
    id: 3,
    src: '/images/default/nature3.jpg',
    alt: '自然の風景3',
  },
];

// プロパティの型定義
interface DefaultImageSelectorProps {
  onImageSelect: (url: string, width: number, height: number) => void;
}

/**
 * デフォルト画像選択コンポーネント
 */
const DefaultImageSelector: React.FC<DefaultImageSelectorProps> = ({ onImageSelect }) => {
  // 選択された画像のID
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  // 画像が選択されたときの処理
  const handleImageSelect = async (image: { id: number; src: string }) => {
    try {
      // 画像のフルパスを取得
      const fullPath = `${window.location.origin}${image.src}`;

      // 画像のサイズを取得
      const { width, height } = await getImageSize(fullPath);

      // 選択状態を更新
      setSelectedImageId(image.id);

      // 親コンポーネントに通知
      onImageSelect(fullPath, width, height);
    } catch (err) {
      console.error('デフォルト画像の読み込みに失敗しました:', err);
    }
  };

  return (
    <SelectorContainer>
      <Title>デフォルト画像から選択</Title>
      <ImagesGrid>
        {DEFAULT_IMAGES.map(image => (
          <ImageItem
            key={image.id}
            $isSelected={selectedImageId === image.id}
            onClick={() => handleImageSelect(image)}
          >
            <DefaultImage src={image.src} alt={image.alt} />
            {selectedImageId === image.id && <SelectedIndicator>✓</SelectedIndicator>}
          </ImageItem>
        ))}
      </ImagesGrid>
    </SelectorContainer>
  );
};

export default DefaultImageSelector;
