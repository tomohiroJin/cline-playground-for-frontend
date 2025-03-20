import React, { useRef, useState } from 'react';
import { checkImageFileSize, getImageSize } from '../../utils/puzzle-utils';
import {
  UploaderContainer,
  UploadButton,
  ErrorMessage,
  ImagePreview,
  PreviewImage,
  UploadText,
} from './ImageUploader.styles';

// プロパティの型定義
interface ImageUploaderProps {
  onImageUpload: (url: string, width: number, height: number) => void;
  maxSizeInMB?: number;
}

/**
 * 画像アップロードコンポーネント
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  maxSizeInMB = 10, // デフォルトは10MB
}) => {
  // 状態
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ファイル入力への参照
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル選択ボタンをクリックしたときの処理
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ファイルが選択されたときの処理
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // ファイルサイズをチェック
    if (!checkImageFileSize(file, maxSizeInMB)) {
      setError(`画像サイズが大きすぎます。${maxSizeInMB}MB以下の画像を選択してください。`);
      return;
    }

    try {
      // 画像のプレビューURLを作成
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);

      // 画像のサイズを取得
      const { width, height } = await getImageSize(url);

      // 親コンポーネントに通知
      onImageUpload(url, width, height);
    } catch (err) {
      setError('画像の読み込みに失敗しました。別の画像を試してください。');
      console.error(err);
    }
  };

  return (
    <UploaderContainer>
      <ImagePreview $hasImage={!!previewUrl}>
        {previewUrl ? (
          <PreviewImage src={previewUrl} alt="プレビュー" />
        ) : (
          <UploadText>画像をアップロードしてください</UploadText>
        )}
      </ImagePreview>

      <UploadButton onClick={handleButtonClick}>画像を選択</UploadButton>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </UploaderContainer>
  );
};

export default ImageUploader;
