/**
 * VS 画面コンポーネント
 * US-2.5: 対決演出画面
 *
 * 300ms フェードイン → 2000ms 表示 → 300ms フェードアウト → onComplete
 */
import React, { useState, useEffect } from 'react';
import type { Character } from '../core/types';
import { CharacterAvatar } from './CharacterAvatar';

/** アニメーションタイミング定数 */
const FADE_IN_MS = 300;
const DISPLAY_MS = 2000;
const FADE_OUT_MS = 300;

type VsScreenProps = {
  playerCharacter: Character;
  cpuCharacter: Character;
  stageName: string;
  fieldName: string;
  onComplete: () => void;
};

export const VsScreen: React.FC<VsScreenProps> = ({
  playerCharacter,
  cpuCharacter,
  stageName,
  fieldName,
  onComplete,
}) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // フェードイン
    const fadeInTimer = requestAnimationFrame(() => {
      setOpacity(1);
    });

    // フェードアウト開始
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
    }, FADE_IN_MS + DISPLAY_MS);

    // 完了コールバック
    const completeTimer = setTimeout(() => {
      onComplete();
    }, FADE_IN_MS + DISPLAY_MS + FADE_OUT_MS);

    return () => {
      cancelAnimationFrame(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
      opacity,
      transition: `opacity ${FADE_IN_MS}ms ease-in-out`,
    }}>
      {/* 対戦表示 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '40px',
        marginBottom: '40px',
      }}>
        {/* プレイヤー */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <CharacterAvatar character={playerCharacter} size={80} showBorder showGlow />
          <span style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            textShadow: `0 0 10px ${playerCharacter.color}`,
          }}>
            {playerCharacter.name}
          </span>
        </div>

        <span style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: '3rem',
          textShadow: '0 0 20px rgba(255, 255, 255, 0.5)',
        }}>
          VS
        </span>

        {/* 対戦相手 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <CharacterAvatar character={cpuCharacter} size={80} showBorder showGlow />
          <span style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            textShadow: `0 0 10px ${cpuCharacter.color}`,
          }}>
            {cpuCharacter.name}
          </span>
        </div>
      </div>

      {/* ステージ情報 */}
      <div style={{
        textAlign: 'center',
        color: '#aaa',
        fontSize: '0.9rem',
      }}>
        <p style={{ margin: '0 0 4px 0', color: 'white', fontWeight: 'bold' }}>
          {stageName}
        </p>
        <p style={{ margin: 0 }}>
          {fieldName}
        </p>
      </div>
    </div>
  );
};
