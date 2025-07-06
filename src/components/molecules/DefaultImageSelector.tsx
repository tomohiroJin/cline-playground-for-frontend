import React, { useState, useEffect } from 'react';
import { getImageSize } from '../../utils/puzzle-utils';

// デフォルト画像の定義
const DEFAULT_IMAGES = [
  {
    id: 1,
    src: '/images/default/camel_in_the_desert.png',
    alt: '砂漠の中のキャメル',
  },
  {
    id: 2,
    src: '/images/default/chalk_drawing_kids.png',
    alt: 'チョークで落書きをする子供達',
  },
  {
    id: 3,
    src: '/images/default/hokusai_kangchenjunga.png',
    alt: 'カンチェンジュンガの北斎',
  },
  {
    id: 4,
    src: '/images/default/moonlight_dancer.png',
    alt: '月明かりのダンサー',
  },
  {
    id: 5,
    src: '/images/default/sunset_candy_shop.png',
    alt: '夕焼けの駄菓子屋',
  },
  {
    id: 6,
    src: '/images/default/midnight_times_square.png',
    alt: '真夜中のタイムズスクエア',
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
    <div className="flex flex-col items-center mb-5 w-full">
      <h3 className="mb-2 text-lg text-gray-800">デフォルト画像から選択</h3>
      <div className="grid grid-cols-3 gap-2 w-full max-w-[600px]">
        {DEFAULT_IMAGES.map(image => (
          <div
            key={image.id}
            className={`relative cursor-pointer rounded overflow-hidden border-2 transition-transform ${selectedImageId === image.id ? 'border-green-500' : 'border-transparent'} hover:scale-105 hover:shadow`}
            onClick={() => handleImageSelect(image)}
          >
            <img src={image.src} alt={image.alt} className="w-full h-[150px] object-cover block" />
            {selectedImageId === image.id && (
              <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                ✓
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DefaultImageSelector;
