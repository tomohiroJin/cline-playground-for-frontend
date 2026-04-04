/**
 * ペアマッチ（2v2）チーム設定画面
 * - P1（固定: アキラ）+ P2/P3/P4 のキャラクター選択
 * - 難易度選択（かんたん / ふつう / むずかしい）
 * - フィールド / 勝利スコアはタイトル画面の設定値を使用
 */
import React, { useState, useCallback, useMemo } from 'react';
import type { Character } from '../core/types';
import type { TeamRole } from '../core/character-ai-profiles';
import { getCharacterAiProfile } from '../core/character-ai-profiles';
import { ALWAYS_UNLOCKED_IDS } from '../core/characters';
import { screenLayout } from './screen-layout';
import { teamSetupStyles as styles } from './team-setup-screen-styles';

/** teamRole → バッジ表示のマッピング */
const ROLE_BADGE: Record<TeamRole, { icon: string; color: string; label: string }> = {
  attacker: { icon: '⚔️', color: '#e74c3c', label: '攻撃型' },
  defender: { icon: '🛡️', color: '#3498db', label: '守備型' },
  balanced: { icon: '⚖️', color: '#f39c12', label: 'バランス型' },
};

/** キャラ ID からロールバッジを取得 */
const getRoleBadge = (characterId: string) => {
  const profile = getCharacterAiProfile(characterId);
  return ROLE_BADGE[profile.teamRole];
};

/** ロールバッジコンポーネント */
const RoleBadge: React.FC<{ characterId: string; size?: number }> = ({ characterId, size = 16 }) => {
  const badge = getRoleBadge(characterId);
  return (
    <span
      data-testid="role-badge"
      title={badge.label}
      aria-label={badge.label}
      style={{
        fontSize: `${size}px`,
        lineHeight: 1,
        flexShrink: 0,
        background: `${badge.color}22`,
        borderRadius: '4px',
        padding: '1px 3px',
      }}
    >
      {badge.icon}
    </span>
  );
};

/** スロット識別子 */
type SlotId = 'p2' | 'p3' | 'p4';

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
  enemy1ControlType?: 'cpu' | 'human';
  onEnemy1ControlTypeChange?: (t: 'cpu' | 'human') => void;
  enemy2ControlType?: 'cpu' | 'human';
  onEnemy2ControlTypeChange?: (t: 'cpu' | 'human') => void;
  gamepadConnected?: number;
  onStart: () => void;
  onBack: () => void;
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
        <img src={character.icon} alt={character.name} width={36} height={36} style={styles.slotIcon} />
        <div style={styles.slotInfo}>
          <span style={styles.slotLabel}>{label}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={styles.slotName}>{character.name}</span>
            <RoleBadge characterId={character.id} size={14} />
          </span>
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
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={c.icon} alt={c.name} width={32} height={32} style={styles.gridCardIcon(locked)} />
                    {locked && <span style={styles.lockOverlay}>🔒</span>}
                    <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: '12px', lineHeight: 1 }}>
                      <RoleBadge characterId={c.id} size={12} />
                    </span>
                  </div>
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

/** CPU/人間 切り替えトグル（全プレイヤー共通） */
const ControlToggle: React.FC<{
  label: string;
  humanLabel: string;
  controlType: 'cpu' | 'human';
  onChange: (t: 'cpu' | 'human') => void;
  canEnable?: boolean;
  disabledHint?: string;
}> = ({ label, humanLabel, controlType, onChange, canEnable = true, disabledHint }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', marginTop: '4px' }}>
    <span style={{ fontSize: '12px', color: '#888' }}>{label} 操作:</span>
    <div style={styles.controlToggle}>
      <button style={styles.controlButton(controlType === 'cpu')} onClick={() => onChange('cpu')}>CPU</button>
      <button
        style={{ ...styles.controlButton(controlType === 'human'), opacity: canEnable ? 1 : 0.4 }}
        onClick={() => { if (canEnable) onChange('human'); }}
        title={!canEnable ? (disabledHint ?? 'ゲームパッドを接続してください') : undefined}
      >{humanLabel}</button>
    </div>
  </div>
);

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
  enemy1ControlType,
  onEnemy1ControlTypeChange,
  enemy2ControlType,
  onEnemy2ControlTypeChange,
  gamepadConnected = 0,
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
        {/* チーム1 */}
        <div style={styles.teamSection(TEAM1_COLOR)} data-testid="team1-section">
          <div style={styles.teamTitle(TEAM1_COLOR)}>チーム1（下）</div>
          {/* P1: 固定 */}
          <div style={styles.slotRowFixed} data-testid="slot-p1">
            <img src={playerCharacter.icon} alt={playerCharacter.name} style={styles.slotIcon} />
            <div style={styles.slotInfo}>
              <span style={styles.slotLabel}>P1: ⌨️ 矢印キー / 🖱️ マウス</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={styles.slotName}>{playerCharacter.name}</span>
                <RoleBadge characterId={playerCharacter.id} size={14} />
              </span>
            </div>
          </div>
          {/* P2: CPU/人間切り替え */}
          <ControlToggle
            label="P2"
            humanLabel="⌨️ WASD / 👆 タッチ"
            controlType={allyControlType}
            onChange={onAllyControlTypeChange}
          />
          <CharacterSlot
            label={allyControlType === 'cpu' ? 'P2: CPU' : 'P2: ⌨️ WASD / 👆 タッチ'}
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
          {/* P3: CPU/ゲームパッド切り替え */}
          {onEnemy1ControlTypeChange && (
            <ControlToggle
              label="P3"
              humanLabel="🎮 コントローラー 1"
              controlType={enemy1ControlType ?? 'cpu'}
              onChange={onEnemy1ControlTypeChange}
              canEnable={gamepadConnected >= 1}
            />
          )}
          <CharacterSlot
            label={enemy1ControlType === 'human' ? 'P3: 🎮 コントローラー 1' : 'P3: CPU'}
            character={enemyCharacter1}
            slotId="p3"
            isOpen={openSlot === 'p3'}
            onToggle={() => toggleSlot('p3')}
            allCharacters={allCharacters}
            unlockedSet={unlockedSet}
            selectedCharacterId={enemyCharacter1.id}
            onSelect={(c) => handleSelect('p3', c)}
          />
          {/* P4: CPU/ゲームパッド切り替え */}
          {onEnemy2ControlTypeChange && (
            <ControlToggle
              label="P4"
              humanLabel="🎮 コントローラー 2"
              controlType={enemy2ControlType ?? 'cpu'}
              onChange={onEnemy2ControlTypeChange}
              canEnable={gamepadConnected >= 2}
            />
          )}
          <CharacterSlot
            label={enemy2ControlType === 'human' ? 'P4: 🎮 コントローラー 2' : 'P4: CPU'}
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
