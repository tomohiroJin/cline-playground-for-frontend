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

/**
 * デフォルト画像選択コンポーネントのプロパティ
 */
type DefaultImageSelectorProps = {
  onImageSelect: (url: string, width: number, height: number) => void;
};

/**
 * エラーハンドリング関数
 *
 * @param error - エラーオブジェクト
 * @returns {void}
 */
const handleImageLoadError = (error: unknown) => {
  console.error('デフォルト画像の読み込みに失敗しました:', error);
};

/**
 * 画像サイズを取得し、親コンポーネントに通知する
 *
 * @param image - 画像オブジェクト
 * @param onImageSelect - 画像選択時のコールバック関数
 * @returns {Promise<void>}
 */
const fetchImageDetailsAndNotify = async (
  image: { id: number; src: string },
  onImageSelect: (url: string, width: number, height: number) => void
) => {
  try {
    const fullPath = `${window.location.origin}${image.src}`;
    const { width, height } = await getImageSize(fullPath);
    onImageSelect(fullPath, width, height);
  } catch (err) {
    handleImageLoadError(err);
  }
};

/**
 * デフォルト画像選択コンポーネント
 */
const DefaultImageSelector: React.FC<DefaultImageSelectorProps> = ({ onImageSelect }) => {
  // 選択された画像のID
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);

  // 画像が選択されたときの処理
  const handleImageSelect = async (image: { id: number; src: string }) => {
    setSelectedImageId(image.id);
    await fetchImageDetailsAndNotify(image, onImageSelect);
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
