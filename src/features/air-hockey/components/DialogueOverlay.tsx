/**
 * ダイアログオーバーレイコンポーネント
 * US-2.4: 試合前ダイアログ / US-2.6: 試合後ダイアログ
 *
 * セリフを1文字ずつ表示し、タップで全文表示 → 次のセリフへ進行する。
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Dialogue } from '../core/story';
import type { Character } from '../core/types';
import { CharacterAvatar } from './CharacterAvatar';

/** 1文字あたりの表示間隔（ms） */
const CHAR_INTERVAL_MS = 30;

type DialogueOverlayProps = {
  dialogues: Dialogue[];
  characters: Record<string, Character>;
  onComplete: () => void;
};

export const DialogueOverlay: React.FC<DialogueOverlayProps> = ({
  dialogues,
  characters,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isFullyDisplayed, setIsFullyDisplayed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const currentDialogue = dialogues[currentIndex];
  const currentCharacter = currentDialogue
    ? characters[currentDialogue.characterId]
    : undefined;
  const fullText = currentDialogue?.text ?? '';

  // 文字送りタイマー
  useEffect(() => {
    if (isFullyDisplayed) return;

    setDisplayedLength(0);
    let charCount = 0;

    timerRef.current = setInterval(() => {
      charCount += 1;
      setDisplayedLength(charCount);

      if (charCount >= fullText.length) {
        clearInterval(timerRef.current);
        setIsFullyDisplayed(true);
      }
    }, CHAR_INTERVAL_MS);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, fullText.length, isFullyDisplayed]);

  const handleClick = useCallback(() => {
    if (!isFullyDisplayed) {
      // 文字送り中 → 全文表示
      clearInterval(timerRef.current);
      setDisplayedLength(fullText.length);
      setIsFullyDisplayed(true);
      return;
    }

    // 全文表示済み → 次のセリフ or 完了
    if (currentIndex < dialogues.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFullyDisplayed(false);
    } else {
      onComplete();
    }
  }, [isFullyDisplayed, currentIndex, dialogues.length, fullText.length, onComplete]);

  const handleSkip = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    clearInterval(timerRef.current);
    onComplete();
  }, [onComplete]);

  return (
    <div
      data-testid="dialogue-overlay"
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        zIndex: 100,
        cursor: 'pointer',
      }}
    >
      {/* スキップボタン */}
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          padding: '6px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '0.85rem',
        }}
      >
        スキップ
      </button>

      {/* ダイアログボックス */}
      <div style={{
        width: '100%',
        maxWidth: '450px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}>
          {/* キャラ情報 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {currentCharacter && (
              <CharacterAvatar character={currentCharacter} size={48} />
            )}

            {/* キャラ名 */}
            <span style={{
              color: currentCharacter?.color ?? 'white',
              fontWeight: 'bold',
              fontSize: '0.95rem',
            }}>
              {currentCharacter?.name ?? '???'}
            </span>
          </div>

          {/* セリフテキスト */}
          <p
            data-testid="dialogue-text"
            style={{
              color: 'white',
              fontSize: '1rem',
              lineHeight: 1.6,
              minHeight: '3em',
              margin: 0,
            }}
          >
            {fullText.slice(0, displayedLength)}
          </p>

          {/* 進行インジケーター */}
          <div style={{
            textAlign: 'right',
            marginTop: '8px',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '0.75rem',
          }}>
            {isFullyDisplayed && currentIndex < dialogues.length - 1 && '▼ タップで次へ'}
            {isFullyDisplayed && currentIndex === dialogues.length - 1 && '▼ タップで閉じる'}
          </div>
        </div>
      </div>
    </div>
  );
};
