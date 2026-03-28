/**
 * フリー対戦 CPU キャラクター選択画面
 * - 2P 対戦の CharacterSelectScreen とスタイルを統一
 * - 難易度に対応するデフォルトキャラがプリ選択される
 * - 図鑑未解放キャラはロック表示
 */
import React, { useState, useCallback } from 'react';
import type { Character, Difficulty } from '../core/types';
import { PLAYER_CHARACTER, ALWAYS_UNLOCKED_IDS } from '../core/characters';

/** 難易度→デフォルトキャラ ID のマッピング */
const DEFAULT_CHARACTER_BY_DIFFICULTY: Record<Difficulty, string> = {
  easy: 'rookie',
  normal: 'regular',
  hard: 'ace',
};

type FreeBattleCharacterSelectProps = {
  characters: Character[];
  unlockedIds: string[];
  difficulty: Difficulty;
  onConfirm: (character: Character) => void;
  onBack: () => void;
};

// ── スタイル定数（2P 対戦と統一） ───────────────
const PANEL_ICON_SIZE = 48;
const CARD_ICON_SIZE = 42;
const GRID_GAP = 10;

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    padding: '16px',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
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
  // VS パネル（プレイヤー vs 選択キャラ）
  vsPanel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  playerPanel: (isHighlighted: boolean, color: string) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    border: isHighlighted ? `3px solid ${color}` : '3px solid #333',
    backgroundColor: isHighlighted ? 'rgba(255,255,255,0.05)' : 'transparent',
    minWidth: '120px',
    transition: 'border-color 0.2s',
  }),
  playerLabel: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    marginBottom: '4px',
  },
  playerIcon: {
    width: `${PANEL_ICON_SIZE}px`,
    height: `${PANEL_ICON_SIZE}px`,
    borderRadius: '50%',
    objectFit: 'cover' as const,
    marginBottom: '4px',
  },
  playerName: {
    fontSize: '12px',
    color: '#ccc',
  },
  vsText: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#e74c3c',
  },
  // セクションタイトル
  sectionTitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '8px',
    borderBottom: '1px solid #333',
    paddingBottom: '4px',
  },
  // キャラグリッド
  grid: {
    display: 'grid',
    gridTemplateColumns: `repeat(4, min(90px, calc((100vw - 64px) / 4)))`,
    gap: `${GRID_GAP}px`,
    justifyContent: 'center',
    marginBottom: '16px',
  },
  card: (isSelected: boolean, isLocked: boolean, color: string) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '8px',
    border: isSelected ? `2px solid ${color}` : '2px solid #444',
    backgroundColor: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
    cursor: isLocked ? 'not-allowed' : 'pointer',
    transition: 'transform 0.1s, border-color 0.2s',
    aspectRatio: '1',
    opacity: isLocked ? 0.4 : 1,
    position: 'relative' as const,
  }),
  cardIcon: (isLocked: boolean) => ({
    width: `${CARD_ICON_SIZE}px`,
    height: `${CARD_ICON_SIZE}px`,
    borderRadius: '50%',
    objectFit: 'cover' as const,
    marginBottom: '4px',
    ...(isLocked ? { filter: 'grayscale(100%) brightness(0.5)' } : {}),
  }),
  lockOverlay: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    fontSize: '12px',
  },
  cardName: {
    fontSize: '10px',
    color: '#ddd',
    textAlign: 'center' as const,
  },
  // 開始ボタン
  startButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #e67e22, #d35400)',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold' as const,
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
      {/* ヘッダー */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← 戻る
        </button>
        <span style={styles.title}>対戦相手を選べ！</span>
        <div style={{ width: '60px' }} />
      </div>

      {/* プレイヤー vs CPU パネル */}
      <div style={styles.vsPanel}>
        <div style={styles.playerPanel(true, PLAYER_CHARACTER.color)}>
          <span style={styles.playerLabel}>あなた</span>
          <img
            src={PLAYER_CHARACTER.icon}
            alt={PLAYER_CHARACTER.name}
            style={styles.playerIcon}
          />
          <span style={styles.playerName}>{PLAYER_CHARACTER.name}</span>
        </div>

        <span style={styles.vsText}>VS</span>

        <div style={styles.playerPanel(true, selected.color)}>
          <span style={styles.playerLabel}>CPU</span>
          <img
            src={selected.icon}
            alt={selected.name}
            style={styles.playerIcon}
          />
          <span style={styles.playerName}>{selected.name}</span>
        </div>
      </div>

      {/* キャラクターグリッド */}
      <div style={styles.sectionTitle}>キャラクター選択</div>
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
              <img
                src={character.icon}
                alt={character.name}
                style={styles.cardIcon(locked)}
              />
              {locked && <span style={styles.lockOverlay}>🔒</span>}
              <span style={styles.cardName}>{character.name}</span>
            </button>
          );
        })}
      </div>

      {/* 対戦開始ボタン */}
      <button style={styles.startButton} onClick={handleConfirm}>
        対戦開始！
      </button>
    </div>
  );
};
