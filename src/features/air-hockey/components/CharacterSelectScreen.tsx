/**
 * キャラクター選択画面
 * - 2P 対戦時に各プレイヤーがキャラクターを選択する
 * - フィールド・勝利スコアの設定も行う
 */
import React, { useState, useCallback, useMemo } from 'react';
import type { Character, FieldConfig } from '../core/types';
import type { TwoPlayerConfig } from '../application/use-cases/two-player-battle';
import type { PlayerSlot } from '../domain/contracts/input';
import { WIN_SCORE_OPTIONS } from '../core/config';

/** キャラクター選択画面の Props */
type CharacterSelectScreenProps = {
  characters: Character[];
  unlockedFieldIds: string[];
  fields: readonly FieldConfig[];
  onStartBattle: (config: TwoPlayerConfig) => void;
  onBack: () => void;
};

/** デフォルト勝利スコア */
const DEFAULT_WIN_SCORE = 3;

// ── スタイル定数 ─────────────────────────────
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
  vsPanel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  playerPanel: (isActive: boolean, color: string) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    border: isActive ? `3px solid ${color}` : '3px solid #333',
    backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
    cursor: 'pointer',
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
  sectionTitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '8px',
    borderBottom: '1px solid #333',
    paddingBottom: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: `repeat(4, min(90px, calc((100vw - 64px) / 4)))`,
    gap: `${GRID_GAP}px`,
    justifyContent: 'center',
    marginBottom: '16px',
  },
  card: (isSelected: boolean, color: string) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '8px',
    border: isSelected ? `2px solid ${color}` : '2px solid #444',
    backgroundColor: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
    cursor: 'pointer',
    transition: 'transform 0.1s, border-color 0.2s',
    aspectRatio: '1',
  }),
  cardIcon: {
    width: `${CARD_ICON_SIZE}px`,
    height: `${CARD_ICON_SIZE}px`,
    borderRadius: '50%',
    objectFit: 'cover' as const,
    marginBottom: '4px',
  },
  cardName: {
    fontSize: '10px',
    color: '#ddd',
    textAlign: 'center' as const,
  },
  settingsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    padding: '0 8px',
  },
  settingsLabel: {
    fontSize: '13px',
    color: '#aaa',
  },
  settingsSelect: {
    backgroundColor: '#2a2a4a',
    color: '#fff',
    border: '1px solid #555',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '13px',
  },
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

export function CharacterSelectScreen({
  characters,
  unlockedFieldIds,
  fields,
  onStartBattle,
  onBack,
}: CharacterSelectScreenProps) {
  // アンロック済みフィールドのフィルタ
  const availableFields = useMemo(
    () => fields.filter(f => unlockedFieldIds.includes(f.id)),
    [fields, unlockedFieldIds]
  );

  // 選択状態
  const [player1, setPlayer1] = useState<Character>(characters[0]);
  const [player2, setPlayer2] = useState<Character>(characters[1] ?? characters[0]);
  const [activeSlot, setActiveSlot] = useState<PlayerSlot>('player1');
  const [selectedField, setSelectedField] = useState<FieldConfig>(availableFields[0] ?? fields[0]);
  const [winScore, setWinScore] = useState(DEFAULT_WIN_SCORE);

  // キャラクター選択ハンドラ
  const handleCharacterSelect = useCallback((character: Character) => {
    if (activeSlot === 'player1') {
      setPlayer1(character);
    } else {
      setPlayer2(character);
    }
  }, [activeSlot]);

  // 対戦開始ハンドラ
  const handleStartBattle = useCallback(() => {
    onStartBattle({
      player1Character: player1,
      player2Character: player2,
      field: selectedField,
      winScore,
    });
  }, [onStartBattle, player1, player2, selectedField, winScore]);

  // キャラクターが選択中か判定
  const isCharacterSelected = (character: Character) => {
    if (activeSlot === 'player1') return character.id === player1.id;
    return character.id === player2.id;
  };

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← 戻る
        </button>
        <span style={styles.title}>2P 対戦</span>
        <div style={{ width: '60px' }} />
      </div>

      {/* 1P vs 2P パネル */}
      <div style={styles.vsPanel}>
        <div
          style={styles.playerPanel(activeSlot === 'player1', player1.color)}
          onClick={() => setActiveSlot('player1')}
          role="button"
          tabIndex={0}
        >
          <span style={styles.playerLabel}>1P</span>
          <img
            src={player1.icon}
            alt={player1.name}
            style={styles.playerIcon}
          />
          <span style={styles.playerName}>{player1.name}</span>
        </div>

        <span style={styles.vsText}>VS</span>

        <div
          style={styles.playerPanel(activeSlot === 'player2', player2.color)}
          onClick={() => setActiveSlot('player2')}
          role="button"
          tabIndex={0}
        >
          <span style={styles.playerLabel}>2P</span>
          <img
            src={player2.icon}
            alt={player2.name}
            style={styles.playerIcon}
          />
          <span style={styles.playerName}>{player2.name}</span>
        </div>
      </div>

      {/* キャラクターグリッド */}
      <div style={styles.sectionTitle}>キャラクター選択</div>
      <div style={styles.grid}>
        {characters.map(character => (
          <div
            key={character.id}
            style={styles.card(isCharacterSelected(character), character.color)}
            onClick={() => handleCharacterSelect(character)}
            role="button"
            tabIndex={0}
          >
            <img
              src={character.icon}
              alt={character.name}
              style={styles.cardIcon}
            />
            <span style={styles.cardName}>{character.name}</span>
          </div>
        ))}
      </div>

      {/* 設定 */}
      <div style={styles.sectionTitle}>設定</div>
      <div style={styles.settingsRow}>
        <span style={styles.settingsLabel}>フィールド</span>
        <select
          style={styles.settingsSelect}
          value={selectedField.id}
          onChange={e => {
            const found = fields.find(f => f.id === e.target.value);
            if (found) setSelectedField(found);
          }}
        >
          {availableFields.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>
      <div style={styles.settingsRow}>
        <span style={styles.settingsLabel}>勝利スコア</span>
        <select
          style={styles.settingsSelect}
          value={winScore}
          onChange={e => setWinScore(Number(e.target.value))}
        >
          {WIN_SCORE_OPTIONS.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {/* 対戦開始ボタン */}
      <button style={styles.startButton} onClick={handleStartBattle}>
        対戦開始！
      </button>
    </div>
  );
}
