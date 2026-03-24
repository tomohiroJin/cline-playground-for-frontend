/**
 * フリー対戦 CPU キャラクター選択画面
 * - 難易度に対応するデフォルトキャラがプリ選択される
 * - 図鑑未解放キャラはロック表示
 */
import React, { useState, useCallback } from 'react';
import type { Character, Difficulty } from '../core/types';

/** 難易度→デフォルトキャラ ID のマッピング */
const DEFAULT_CHARACTER_BY_DIFFICULTY: Record<Difficulty, string> = {
  easy: 'rookie',
  normal: 'regular',
  hard: 'ace',
};

/** フリー対戦キャラ（常に解放済み） */
const ALWAYS_UNLOCKED_IDS = new Set(['rookie', 'regular', 'ace']);

type FreeBattleCharacterSelectProps = {
  characters: Character[];
  unlockedIds: string[];
  difficulty: Difficulty;
  onConfirm: (character: Character) => void;
  onBack: () => void;
};

// ── スタイル ──────────────────────────────────
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: '16px',
    boxSizing: 'border-box' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#e67e22',
  },
  backButton: {
    background: 'none',
    border: '1px solid #555',
    color: '#ccc',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '16px',
  },
  card: (isSelected: boolean, isLocked: boolean, color: string) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '12px 4px',
    borderRadius: '8px',
    border: isSelected ? `2px solid ${color}` : '2px solid transparent',
    backgroundColor: isLocked ? '#2a2a3e' : '#16213e',
    opacity: isLocked ? 0.5 : 1,
    cursor: isLocked ? 'not-allowed' : 'pointer',
  }),
  cardIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#333',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  cardName: {
    fontSize: '12px',
    textAlign: 'center' as const,
  },
  detail: {
    padding: '12px',
    backgroundColor: '#16213e',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  detailName: {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    marginBottom: '4px',
  },
  confirmButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    backgroundColor: '#e67e22',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: 'auto',
  },
};

export const FreeBattleCharacterSelect: React.FC<FreeBattleCharacterSelectProps> = ({
  characters,
  unlockedIds,
  difficulty,
  onConfirm,
  onBack,
}) => {
  // デフォルト選択: 難易度に対応するキャラ
  const defaultCharId = DEFAULT_CHARACTER_BY_DIFFICULTY[difficulty];
  const defaultChar = characters.find(c => c.id === defaultCharId) ?? characters[0];
  const [selected, setSelected] = useState<Character>(defaultChar);

  const unlockedSet = new Set(unlockedIds);

  const isUnlocked = useCallback(
    (character: Character): boolean =>
      ALWAYS_UNLOCKED_IDS.has(character.id) || unlockedSet.has(character.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unlockedIds]
  );

  const handleSelect = useCallback((character: Character) => {
    if (isUnlocked(character)) {
      setSelected(character);
    }
  }, [isUnlocked]);

  const handleConfirm = useCallback(() => {
    onConfirm(selected);
  }, [onConfirm, selected]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>戻る</button>
        <span style={styles.title}>対戦相手を選べ！</span>
        <div style={{ width: '60px' }} />
      </div>

      <div style={styles.grid}>
        {characters.map(character => {
          const locked = !isUnlocked(character);
          const isSelected = selected.id === character.id;
          return (
            <button
              key={character.id}
              style={styles.card(isSelected, locked, character.color)}
              onClick={() => handleSelect(character)}
              disabled={locked}
            >
              <div style={styles.cardIcon}>
                {locked ? '🔒' : character.name[0]}
              </div>
              <span style={styles.cardName}>{character.name}</span>
            </button>
          );
        })}
      </div>

      <div style={styles.detail}>
        <div style={styles.detailName}>{selected.name}</div>
      </div>

      <button style={styles.confirmButton} onClick={handleConfirm}>
        対戦開始！
      </button>
    </div>
  );
};
