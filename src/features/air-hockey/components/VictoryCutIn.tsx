/**
 * P1-07: 勝利カットイン演出
 * 章クリア時に表示される一枚絵 + テキスト演出コンポーネント
 *
 * アニメーションシーケンス:
 *   0〜300ms     黒背景フェードイン
 *   300〜1000ms  カットイン画像スケールアップ（0.8→1.0）+ フェードイン
 *   1000〜2500ms 画像表示待機
 *   2500〜3500ms テキストフェードイン
 *   3500ms〜     ユーザー入力待ち（クリック/タップ/Enter/Space）
 *   入力後 500ms 全体フェードアウト → onComplete()
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';

/** アニメーションタイミング定数（ms） */
const BG_FADE_IN_MS = 300;
const IMAGE_DELAY_MS = 300;
const IMAGE_FADE_IN_MS = 700;
const TEXT_DELAY_MS = 2500;
const TEXT_FADE_IN_MS = 1000;
const INPUT_READY_MS = 3500;
const FADE_OUT_MS = 500;

/** デフォルトメッセージ */
const DEFAULT_MESSAGE = 'TO BE CONTINUED...';

type VictoryCutInProps = {
  imageUrl: string;
  message?: string;
  onComplete: () => void;
};

export const VictoryCutIn: React.FC<VictoryCutInProps> = ({
  imageUrl,
  message = DEFAULT_MESSAGE,
  onComplete,
}) => {
  const [bgOpacity, setBgOpacity] = useState(0);
  const [imageOpacity, setImageOpacity] = useState(0);
  const [imageScale, setImageScale] = useState(0.8);
  const [textOpacity, setTextOpacity] = useState(0);
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [isInputReady, setIsInputReady] = useState(false);
  const isCompletedRef = useRef(false);
  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  /** 完了処理（二重呼び出し防止） */
  const completeOnce = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    onComplete();
  }, [onComplete]);

  /** アニメーションシーケンス */
  useEffect(() => {
    // 背景フェードイン
    const bgTimer = requestAnimationFrame(() => {
      setBgOpacity(1);
    });

    // 画像表示
    const imageTimer = setTimeout(() => {
      setImageOpacity(1);
      setImageScale(1);
    }, IMAGE_DELAY_MS);

    // テキスト表示
    const textTimer = setTimeout(() => {
      setTextOpacity(1);
    }, TEXT_DELAY_MS);

    // ユーザー入力受付開始
    const inputReadyTimer = setTimeout(() => {
      setIsInputReady(true);
    }, INPUT_READY_MS);

    return () => {
      cancelAnimationFrame(bgTimer);
      clearTimeout(imageTimer);
      clearTimeout(textTimer);
      clearTimeout(inputReadyTimer);
      clearTimeout(fadeOutTimerRef.current);
    };
  }, []);

  /** ユーザー入力によるフェードアウト→完了 */
  const handleDismiss = useCallback(() => {
    if (!isInputReady || isCompletedRef.current) return;
    setContainerOpacity(0);
    fadeOutTimerRef.current = setTimeout(() => {
      completeOnce();
    }, FADE_OUT_MS);
  }, [isInputReady, completeOnce]);

  /** キーボード入力（Enter/Space） */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDismiss]);

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        cursor: isInputReady ? 'pointer' : 'default',
        opacity: containerOpacity,
        transition: `opacity ${FADE_OUT_MS}ms ease-in-out`,
      }}
    >
      {/* 黒背景 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          opacity: bgOpacity,
          transition: `opacity ${BG_FADE_IN_MS}ms ease-in-out`,
        }}
      />

      {/* コンテンツ */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          gap: '24px',
        }}
      >
        {/* カットイン画像 */}
        <img
          src={imageUrl}
          alt="Victory"
          style={{
            maxWidth: '90%',
            maxHeight: '50vh',
            objectFit: 'contain',
            opacity: imageOpacity,
            transform: `scale(${imageScale})`,
            transition: `opacity ${IMAGE_FADE_IN_MS}ms ease-in-out, transform ${IMAGE_FADE_IN_MS}ms ease-out`,
          }}
        />

        {/* テキスト */}
        <span
          style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.9)',
            letterSpacing: '4px',
            opacity: textOpacity,
            transition: `opacity ${TEXT_FADE_IN_MS}ms ease-in-out`,
          }}
        >
          {message}
        </span>
      </div>
    </div>
  );
};
