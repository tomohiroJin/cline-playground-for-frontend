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
    src: '/images/default/mountain_landscape.jpg',
    alt: '山の風景',
  },
  {
    id: 2,
    src: '/images/default/forest_landscape.jpg',
    alt: '森の風景',
  },
  {
    id: 3,
    src: '/images/default/beach_landscape.jpg',
    alt: '海辺の風景',
  },
  {
    id: 4,
    src: '/images/default/cat_office.png',
    alt: '猫のオフィス',
  },
  {
    id: 5,
    src: '/images/default/digital_boy.png',
    alt: 'デジタル時代の少年',
  },
  {
    id: 6,
    src: '/images/default/playful_doodle.png',
    alt: '遊び心の落書き',
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
