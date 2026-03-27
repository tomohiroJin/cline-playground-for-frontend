/**
 * ペアマッチ（2v2）チーム設定画面
 * - P1（固定: アキラ）+ P2/P3/P4 のキャラクター選択
 * - 難易度選択（かんたん / ふつう / むずかしい）
 * - フィールド / 勝利スコアはタイトル画面の設定値を使用
 */
import React, { useState, useCallback } from 'react';
import type { Character, Difficulty } from '../core/types';
import { screenLayout } from './screen-layout';

/** スロット識別子 */
type SlotId = 'p2' | 'p3' | 'p4';

/** 難易度の表示ラベル */
const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'かんたん',
  normal: 'ふつう',
  hard: 'むずかしい',
};

/** 難易度一覧 */
const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/** フリー対戦キャラ（常に解放済み） */
const ALWAYS_UNLOCKED_IDS = new Set(['rookie', 'regular', 'ace']);

type TeamSetupScreenProps = {
  allCharacters: Character[];
  unlockedIds: string[];
  playerCharacter: Character;
  allyCharacter: Character;
  enemyCharacter1: Character;
  enemyCharacter2: Character;
  onAllyChange: (c: Character) => void;
  onEnemy1Change: (c: Character) => void;
  onEnemy2Change: (c: Character) => void;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onStart: () => void;
  onBack: () => void;
};

// ── スタイル ─────────────────────────────────
const styles = {
  scrollArea: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  teamSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '12px',
  },
  teamTitle: {
    fontSize: '16px',
    fontWeight: 'bold' as const,
    marginBottom: '8px',
    color: '#e67e22',
  },
  slotRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  slotRowFixed: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    borderRadius: '6px',
    marginBottom: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    opacity: 0.7,
  },
  slotIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  slotLabel: {
    fontSize: '12px',
    color: '#888',
  },
  slotName: {
    fontSize: '14px',
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  slotInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
  },
  changeHint: {
    fontSize: '11px',
    color: '#666',
    marginLeft: 'auto',
  },
  // キャラ選択グリッド
  gridContainer: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
  },
  gridCard: (isSelected: boolean, isLocked: boolean, color: string) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    borderRadius: '6px',
    border: isSelected ? `2px solid ${color}` : '2px solid #444',
    backgroundColor: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
    cursor: isLocked ? 'not-allowed' : 'pointer',
    opacity: isLocked ? 0.4 : 1,
    position: 'relative' as const,
  }),
  gridCardIcon: (isLocked: boolean) => ({
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    marginBottom: '2px',
    ...(isLocked ? { filter: 'grayscale(100%) brightness(0.5)' } : {}),
  }),
  gridCardName: {
    fontSize: '10px',
    color: '#ddd',
    textAlign: 'center' as const,
  },
  lockOverlay: {
    position: 'absolute' as const,
    top: '2px',
    right: '2px',
    fontSize: '10px',
  },
  // 難易度セクション
  difficultySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '12px',
  },
  difficultyTitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '8px',
  },
  difficultyRow: {
    display: 'flex',
    gap: '8px',
  },
  difficultyButton: (isActive: boolean) => ({
    flex: 1,
    padding: '10px 8px',
    borderRadius: '6px',
    border: isActive ? '2px solid #e67e22' : '2px solid #444',
    backgroundColor: isActive ? 'rgba(230, 126, 34, 0.2)' : 'transparent',
    color: isActive ? '#e67e22' : '#aaa',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
  }),
  // 開始ボタン
  startButton: {
    ...screenLayout.actionButton,
    background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    marginTop: '12px',
  },
};

/** キャラクタースロット表示 */
const CharacterSlot: React.FC<{
  label: string;
  character: Character;
  slotId: SlotId;
  isOpen: boolean;
  onToggle: () => void;
  allCharacters: Character[];
  unlockedIds: string[];
  selectedCharacterId: string;
  onSelect: (character: Character) => void;
}> = ({ label, character, slotId, isOpen, onToggle, allCharacters, unlockedIds, selectedCharacterId, onSelect }) => {
  const unlockedSet = new Set(unlockedIds);
  const isUnlocked = (c: Character) => ALWAYS_UNLOCKED_IDS.has(c.id) || unlockedSet.has(c.id);

  return (
    <div>
      <div
        style={styles.slotRow}
        data-testid={`slot-${slotId}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
      >
        <img src={character.icon} alt={character.name} style={styles.slotIcon} />
        <div style={styles.slotInfo}>
          <span style={styles.slotLabel}>{label}</span>
          <span style={styles.slotName}>{character.name}</span>
        </div>
        <span style={styles.changeHint}>{isOpen ? '▲' : '変更 ▼'}</span>
      </div>
      {isOpen && (
        <div style={styles.gridContainer} data-testid={`character-grid-${slotId}`}>
          <div style={styles.grid}>
            {allCharacters.map(c => {
              const locked = !isUnlocked(c);
              const isSelected = selectedCharacterId === c.id;
              return (
                <button
                  key={c.id}
                  data-testid={`char-select-${c.id}`}
                  style={styles.gridCard(isSelected, locked, c.color)}
                  onClick={() => { if (!locked) onSelect(c); }}
                  disabled={locked}
                >
                  <img src={c.icon} alt={c.name} style={styles.gridCardIcon(locked)} />
                  {locked && <span style={styles.lockOverlay}>🔒</span>}
                  <span style={styles.gridCardName}>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const TeamSetupScreen: React.FC<TeamSetupScreenProps> = ({
  allCharacters,
  unlockedIds,
  playerCharacter,
  allyCharacter,
  enemyCharacter1,
  enemyCharacter2,
  onAllyChange,
  onEnemy1Change,
  onEnemy2Change,
  difficulty,
  onDifficultyChange,
  onStart,
  onBack,
}) => {
  const [openSlot, setOpenSlot] = useState<SlotId | undefined>(undefined);

  const toggleSlot = useCallback((slotId: SlotId) => {
    setOpenSlot(prev => prev === slotId ? undefined : slotId);
  }, []);

  // キャラ選択後にパネルを閉じる
  const handleSelect = useCallback((slotId: SlotId, character: Character) => {
    if (slotId === 'p2') onAllyChange(character);
    else if (slotId === 'p3') onEnemy1Change(character);
    else onEnemy2Change(character);
    setOpenSlot(undefined);
  }, [onAllyChange, onEnemy1Change, onEnemy2Change]);

  return (
    <div style={screenLayout.container}>
      {/* ヘッダー */}
      <div style={screenLayout.header}>
        <button style={screenLayout.backButton} onClick={onBack}>
          ← 戻る
        </button>
        <span style={screenLayout.title}>ペアマッチ設定</span>
        <div style={screenLayout.spacer} />
      </div>

      {/* スクロールエリア */}
      <div style={styles.scrollArea}>
        {/* チーム1 */}
        <div style={styles.teamSection}>
          <div style={styles.teamTitle}>チーム1（下）</div>
          {/* P1: 固定 */}
          <div style={styles.slotRowFixed}>
            <img src={playerCharacter.icon} alt={playerCharacter.name} style={styles.slotIcon} />
            <div style={styles.slotInfo}>
              <span style={styles.slotLabel}>P1: あなた</span>
              <span style={styles.slotName}>{playerCharacter.name}</span>
            </div>
          </div>
          {/* P2: 味方 CPU */}
          <CharacterSlot
            label="P2: パートナー（CPU）"
            character={allyCharacter}
            slotId="p2"
            isOpen={openSlot === 'p2'}
            onToggle={() => toggleSlot('p2')}
            allCharacters={allCharacters}
            unlockedIds={unlockedIds}
            selectedCharacterId={allyCharacter.id}
            onSelect={(c) => handleSelect('p2', c)}
          />
        </div>

        {/* チーム2 */}
        <div style={styles.teamSection}>
          <div style={styles.teamTitle}>チーム2（上）</div>
          {/* P3: 敵 CPU 1 */}
          <CharacterSlot
            label="P3: 敵1（CPU）"
            character={enemyCharacter1}
            slotId="p3"
            isOpen={openSlot === 'p3'}
            onToggle={() => toggleSlot('p3')}
            allCharacters={allCharacters}
            unlockedIds={unlockedIds}
            selectedCharacterId={enemyCharacter1.id}
            onSelect={(c) => handleSelect('p3', c)}
          />
          {/* P4: 敵 CPU 2 */}
          <CharacterSlot
            label="P4: 敵2（CPU）"
            character={enemyCharacter2}
            slotId="p4"
            isOpen={openSlot === 'p4'}
            onToggle={() => toggleSlot('p4')}
            allCharacters={allCharacters}
            unlockedIds={unlockedIds}
            selectedCharacterId={enemyCharacter2.id}
            onSelect={(c) => handleSelect('p4', c)}
          />
        </div>

        {/* 難易度 */}
        <div style={styles.difficultySection}>
          <div style={styles.difficultyTitle}>CPU 難易度</div>
          <div style={styles.difficultyRow}>
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                style={styles.difficultyButton(d === difficulty)}
                onClick={() => onDifficultyChange(d)}
              >
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 対戦開始ボタン */}
      <button style={styles.startButton} onClick={onStart}>
        対戦開始！
      </button>
    </div>
  );
};
