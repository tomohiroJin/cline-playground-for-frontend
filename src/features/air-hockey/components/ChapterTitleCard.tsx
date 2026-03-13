/**
 * P1-06: チャプタータイトルカード
 * 章の開始時に表示される演出コンポーネント
 *
 * アニメーションシーケンス:
 *   0〜500ms   背景フェードイン
 *   500〜1000ms タイトルフェードイン
 *   1000〜1500ms サブタイトルフェードイン
 *   1500〜3500ms 待機
 *   3500〜4000ms 全体フェードアウト
 *   4000ms      onComplete() 呼び出し
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';

/** アニメーションタイミング定数（ms） */
const BG_FADE_IN_MS = 500;
const TITLE_DELAY_MS = 500;
const SUBTITLE_DELAY_MS = 1000;
const HOLD_START_MS = 1500;
const HOLD_DURATION_MS = 2000;
const FADE_OUT_START_MS = HOLD_START_MS + HOLD_DURATION_MS; // 3500
const FADE_OUT_MS = 500;
const TOTAL_DURATION_MS = FADE_OUT_START_MS + FADE_OUT_MS; // 4000

type ChapterTitleCardProps = {
  chapter: number;
  title: string;
  subtitle?: string;
  backgroundUrl?: string;
  onComplete: () => void;
};

export const ChapterTitleCard: React.FC<ChapterTitleCardProps> = ({
  chapter,
  title,
  subtitle,
  backgroundUrl,
  onComplete,
}) => {
  const [bgOpacity, setBgOpacity] = useState(0);
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [subtitleOpacity, setSubtitleOpacity] = useState(0);
  const [containerOpacity, setContainerOpacity] = useState(1);
  const isCompletedRef = useRef(false);
  const skipTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  /** 完了処理（二重呼び出し防止） */
  const completeOnce = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    onComplete();
  }, [onComplete]);

  /** 通常のアニメーションシーケンス */
  useEffect(() => {
    const bgTimer = requestAnimationFrame(() => {
      setBgOpacity(1);
    });

    const titleTimer = setTimeout(() => {
      setTitleOpacity(1);
    }, TITLE_DELAY_MS);

    const subtitleTimer = setTimeout(() => {
      setSubtitleOpacity(1);
    }, SUBTITLE_DELAY_MS);

    const fadeOutTimer = setTimeout(() => {
      setContainerOpacity(0);
    }, FADE_OUT_START_MS);

    const completeTimer = setTimeout(() => {
      completeOnce();
    }, TOTAL_DURATION_MS);

    return () => {
      cancelAnimationFrame(bgTimer);
      clearTimeout(titleTimer);
      clearTimeout(subtitleTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
      clearTimeout(skipTimerRef.current);
    };
  }, [completeOnce]);

  /** スキップ処理 */
  const handleSkip = useCallback(() => {
    if (isCompletedRef.current) return;
    setContainerOpacity(0);
    skipTimerRef.current = setTimeout(() => {
      completeOnce();
    }, FADE_OUT_MS);
  }, [completeOnce]);

  return (
    <div
      onClick={handleSkip}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        cursor: 'pointer',
        opacity: containerOpacity,
        transition: `opacity ${FADE_OUT_MS}ms ease-in-out`,
      }}
    >
      {/* 背景レイヤー */}
      <div
        data-testid="chapter-title-bg"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          ...(backgroundUrl
            ? {
                backgroundImage: `url(${backgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(10px)',
              }
            : {
                backgroundColor: '#000',
              }),
          opacity: bgOpacity,
          transition: `opacity ${BG_FADE_IN_MS}ms ease-in-out`,
        }}
      />

      {/* 暗めオーバーレイ */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* テキストコンテンツ */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          gap: '12px',
        }}
      >
        {/* 章番号 */}
        <span
          style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.7)',
            opacity: titleOpacity,
            transition: `opacity ${BG_FADE_IN_MS}ms ease-in-out`,
          }}
        >
          Chapter {chapter}
        </span>

        {/* タイトル */}
        <span
          style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#fff',
            textAlign: 'center',
            opacity: titleOpacity,
            transition: `opacity ${BG_FADE_IN_MS}ms ease-in-out`,
          }}
        >
          {title}
        </span>

        {/* サブタイトル */}
        {subtitle && (
          <span
            style={{
              fontSize: '20px',
              color: 'rgba(255, 255, 255, 0.7)',
              opacity: subtitleOpacity,
              transition: `opacity ${BG_FADE_IN_MS}ms ease-in-out`,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
