import React, { useRef, useState } from 'react';
import { checkFileSize, getImageSize } from '../../utils/puzzle-utils';
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
  /**
   * プレビューURLの状態
   */
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  /**
   * エラーメッセージの状態
   */
  const [error, setError] = useState<string | null>(null);

  /**
   * ファイル入力の参照
   */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * ファイルサイズを検証する関数
   *
   * @param file - 検証するファイル
   * @param maxSizeInMB - 最大サイズ（MB）
   * @returns バリデーション結果
   */
  const validateFileSize = (file: File, maxSizeInMB: number): boolean => {
    if (!checkFileSize(file, maxSizeInMB)) {
      setError(`画像サイズが大きすぎます。${maxSizeInMB}MB以下の画像を選択してください。`);
      return false;
    }
    return true;
  };

  /**
   * ファイルを処理する関数
   *
   * @param file - 処理するファイル
   */
  const processFile = async (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);

      const { width, height } = await getImageSize(url);
      onImageUpload(url, width, height);
    } catch {
      setError('画像の読み込みに失敗しました。別の画像を試してください。');
    }
  };

  /**
   * ボタンがクリックされたときの処理
   */
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * ファイルが変更されたときの処理
   *
   * @param event - イベント
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // ファイルサイズを検証
    if (!validateFileSize(file, maxSizeInMB)) return;

    // ファイルを処理
    await processFile(file);
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
