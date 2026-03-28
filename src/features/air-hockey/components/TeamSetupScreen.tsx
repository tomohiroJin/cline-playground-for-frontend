/**
 * ペアマッチ（2v2）チーム設定画面
 * - P1（固定: アキラ）+ P2/P3/P4 のキャラクター選択
 * - 難易度選択（かんたん / ふつう / むずかしい）
 * - フィールド / 勝利スコアはタイトル画面の設定値を使用
 */
import React, { useState, useCallback, useMemo } from 'react';
import type { Character, Difficulty } from '../core/types';
import { ALWAYS_UNLOCKED_IDS } from '../core/characters';
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

/** チームカラー */
const TEAM1_COLOR = '#3498db';
const TEAM2_COLOR = '#e74c3c';

/** P2 操作タイプ */
type AllyControlType = 'cpu' | 'human';

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
  allyControlType: AllyControlType;
  onAllyControlTypeChange: (t: AllyControlType) => void;
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
  teamSection: (teamColor: string) => ({
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '12px',
    borderLeft: `3px solid ${teamColor}`,
  }),
  teamTitle: (teamColor: string) => ({
    fontSize: '16px',
    fontWeight: 'bold' as const,
    marginBottom: '8px',
    color: teamColor,
  }),
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
    cursor: 'default',
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
  // CPU/人間 トグル
  controlToggle: {
    display: 'flex',
    gap: '4px',
    marginLeft: 'auto',
  },
  controlButton: (isActive: boolean) => ({
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: isActive ? 'rgba(230, 126, 34, 0.3)' : 'transparent',
    color: isActive ? '#e67e22' : '#aaa',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    minWidth: '44px',
    minHeight: '32px',
  }),
  controlHint: {
    fontSize: '11px',
    color: '#888',
    padding: '4px 8px',
    fontStyle: 'italic' as const,
  },
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
  unlockedSet: Set<string>;
  selectedCharacterId: string;
  onSelect: (character: Character) => void;
}> = ({ label, character, slotId, isOpen, onToggle, allCharacters, unlockedSet, selectedCharacterId, onSelect }) => {
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
  allyControlType,
  onAllyControlTypeChange,
  difficulty,
  onDifficultyChange,
  onStart,
  onBack,
}) => {
  const [openSlot, setOpenSlot] = useState<SlotId | undefined>(undefined);
  const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);

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
      <div style={styles.scrollArea} data-testid="scroll-area">
        {/* 難易度（チーム構成の上に配置） */}
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

        {/* チーム1 */}
        <div style={styles.teamSection(TEAM1_COLOR)} data-testid="team1-section">
          <div style={styles.teamTitle(TEAM1_COLOR)}>チーム1（下）</div>
          {/* P1: 固定 */}
          <div style={styles.slotRowFixed} data-testid="slot-p1">
            <img src={playerCharacter.icon} alt={playerCharacter.name} style={styles.slotIcon} />
            <div style={styles.slotInfo}>
              <span style={styles.slotLabel}>P1: あなた</span>
              <span style={styles.slotName}>{playerCharacter.name}</span>
            </div>
          </div>
          {/* P2: パートナー（CPU/人間切り替え） */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>P2 操作:</span>
            <div style={styles.controlToggle}>
              <button
                style={styles.controlButton(allyControlType === 'cpu')}
                onClick={() => onAllyControlTypeChange('cpu')}
              >
                CPU
              </button>
              <button
                style={styles.controlButton(allyControlType === 'human')}
                onClick={() => onAllyControlTypeChange('human')}
              >
                人間
              </button>
            </div>
          </div>
          {allyControlType === 'human' && (
            <div style={styles.controlHint}>操作: WASD / タッチ（2本目）</div>
          )}
          <CharacterSlot
            label={allyControlType === 'cpu' ? 'P2: パートナー（CPU）' : 'P2: パートナー（人間）'}
            character={allyCharacter}
            slotId="p2"
            isOpen={openSlot === 'p2'}
            onToggle={() => toggleSlot('p2')}
            allCharacters={allCharacters}
            unlockedSet={unlockedSet}
            selectedCharacterId={allyCharacter.id}
            onSelect={(c) => handleSelect('p2', c)}
          />
        </div>

        {/* チーム2 */}
        <div style={styles.teamSection(TEAM2_COLOR)} data-testid="team2-section">
          <div style={styles.teamTitle(TEAM2_COLOR)}>チーム2（上）</div>
          {/* P3: 敵 CPU 1 */}
          <CharacterSlot
            label="P3: 敵1（CPU）"
            character={enemyCharacter1}
            slotId="p3"
            isOpen={openSlot === 'p3'}
            onToggle={() => toggleSlot('p3')}
            allCharacters={allCharacters}
            unlockedSet={unlockedSet}
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
            unlockedSet={unlockedSet}
            selectedCharacterId={enemyCharacter2.id}
            onSelect={(c) => handleSelect('p4', c)}
          />
        </div>
      </div>

      {/* 対戦開始ボタン */}
      <button style={styles.startButton} onClick={onStart}>
        対戦開始！
      </button>
    </div>
  );
};
