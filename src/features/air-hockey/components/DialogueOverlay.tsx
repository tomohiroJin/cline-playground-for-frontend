/**
 * ダイアログオーバーレイコンポーネント
 * US-2.4: 試合前ダイアログ / US-2.6: 試合後ダイアログ
 * P1-04: 背景画像・立ち絵・表情差分の演出強化
 *
 * セリフを1文字ずつ表示し、タップで全文表示 → 次のセリフへ進行する。
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Dialogue, DialogueExpression } from '../core/story';
import type { Character } from '../core/types';
import { CharacterAvatar } from './CharacterAvatar';

/** 1文字あたりの表示間隔（ms） */
const CHAR_INTERVAL_MS = 30;

/** 立ち絵のフェードイン時間（ms） */
const PORTRAIT_FADE_IN_MS = 300;

/** キャラ変更時のクロスフェード時間（ms） */
const PORTRAIT_CROSSFADE_MS = 200;

type DialogueOverlayProps = {
  dialogues: Dialogue[];
  characters: Record<string, Character>;
  onComplete: () => void;
  backgroundUrl?: string;
};

/** 現在のダイアログの表情に対応する立ち絵URLを取得する */
const getPortraitUrl = (
  character: Character | undefined,
  expression: DialogueExpression | undefined,
): string | undefined => {
  if (!character?.portrait) return undefined;
  const expr = expression ?? 'normal';
  return character.portrait[expr];
};

export const DialogueOverlay: React.FC<DialogueOverlayProps> = ({
  dialogues,
  characters,
  onComplete,
  backgroundUrl,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isFullyDisplayed, setIsFullyDisplayed] = useState(false);
  const [isPortraitVisible, setIsPortraitVisible] = useState(false);
  const [prevCharacterId, setPrevCharacterId] = useState<string | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const currentDialogue = dialogues[currentIndex];
  const currentCharacter = currentDialogue
    ? characters[currentDialogue.characterId]
    : undefined;
  const fullText = currentDialogue?.text ?? '';
  const fullTextRef = useRef(fullText);
  fullTextRef.current = fullText;
  const portraitUrl = getPortraitUrl(currentCharacter, currentDialogue?.expression);

  // キャラ変更検知（初回レンダリング時は undefined → false）
  const isCharacterChanged =
    prevCharacterId !== undefined && prevCharacterId !== currentDialogue?.characterId;

  // 同キャラの表情だけの切り替えか判定
  const isExpressionOnlyChange = !isCharacterChanged && prevCharacterId !== undefined;

  // 立ち絵のフェードイン制御（キャラ変更時のみフェード、同キャラ表情切り替えは即時）
  useEffect(() => {
    if (!portraitUrl) return;
    if (isExpressionOnlyChange) {
      // 同キャラの表情切り替え — フェードなしで即時表示
      setIsPortraitVisible(true);
      return;
    }
    setIsPortraitVisible(false);
    // 次のフレームでフェードインを開始
    const raf = requestAnimationFrame(() => setIsPortraitVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [portraitUrl, isExpressionOnlyChange]);

  // 前のキャラクターIDを追跡
  useEffect(() => {
    setPrevCharacterId(currentDialogue?.characterId);
  }, [currentDialogue?.characterId]);

  // 文字送りタイマー（currentIndex 変更時のみ再開）
  useEffect(() => {
    setDisplayedLength(0);
    setIsFullyDisplayed(false);
    let charCount = 0;

    timerRef.current = setInterval(() => {
      charCount += 1;
      setDisplayedLength(charCount);

      if (charCount >= fullTextRef.current.length) {
        clearInterval(timerRef.current);
        setIsFullyDisplayed(true);
      }
    }, CHAR_INTERVAL_MS);

    return () => clearInterval(timerRef.current);
  }, [currentIndex]);

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
    } else {
      onComplete();
    }
  }, [isFullyDisplayed, currentIndex, dialogues.length, fullText.length, onComplete]);

  const handleSkip = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    clearInterval(timerRef.current);
    onComplete();
  }, [onComplete]);

  // 同キャラ表情切り替え → transition なし / キャラ変更 → クロスフェード / 初回 → フェードイン
  const portraitTransition = isExpressionOnlyChange
    ? ''
    : `opacity ${isCharacterChanged ? PORTRAIT_CROSSFADE_MS : PORTRAIT_FADE_IN_MS}ms ease-in-out`;

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
        background: backgroundUrl ? 'transparent' : 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        zIndex: 100,
        cursor: 'pointer',
      }}
    >
      {/* 背景画像（backgroundUrl が指定されている場合のみ） */}
      {backgroundUrl && (
        <>
          <img
            data-testid="dialogue-background"
            src={backgroundUrl}
            alt="背景"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: -2,
            }}
          />
          {/* 暗めオーバーレイ */}
          <div
            data-testid="dialogue-bg-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.3)',
              zIndex: -1,
            }}
          />
        </>
      )}

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
          zIndex: 1,
        }}
      >
        スキップ
      </button>

      {/* 立ち絵エリア */}
      {portraitUrl ? (
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingBottom: '8px',
          overflow: 'hidden',
        }}>
          <img
            data-testid="dialogue-portrait"
            src={portraitUrl}
            alt={currentCharacter?.name ?? ''}
            style={{
              maxHeight: '60vh',
              objectFit: 'contain',
              opacity: isPortraitVisible ? 1 : 0,
              transition: portraitTransition,
            }}
          />
        </div>
      ) : (
        // 立ち絵なしのスペーサー
        <div style={{ flex: 1 }} />
      )}

      {/* テキストウィンドウ */}
      <div
        data-testid="dialogue-text-window"
        style={{
          width: '100%',
          maxWidth: '450px',
          padding: '20px',
          marginBottom: '20px',
        }}
      >
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}>
          {/* キャラ情報 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {/* portrait なしのフォールバック: アイコン表示 */}
            {currentCharacter && !currentCharacter.portrait && (
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
