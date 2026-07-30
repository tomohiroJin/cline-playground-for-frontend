/**
 * 灰燼の城壁 - ゲーム画面
 *
 * 「構築 → 説明 → ラン」の3画面を遷移する（設計書 §5・§6）。
 * カード選択・ドロー・徴発などのドメイン状態を持つフックは、デッキが
 * 確定してからマウントする RunView にだけ呼ばせる（cards が決まる前に
 * フックを呼べないため）。
 *
 * 三層レイアウト（上部=ラン状態 / 中央=盤面 / 下部=手札と資源）。
 * 同時に走査する枠を7以内に収める（設計書 §9.1）。
 */
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { PLAINS_WAVES } from '../domain/combat/waves';
import { useAshenRampartGame } from './useAshenRampartGame';
import { RunStatusBar } from './RunStatusBar';
import { BoardGrid } from './BoardGrid';
import { HandArea } from './HandArea';
import { EnemyLegend } from './EnemyLegend';
import { DeckBuilder } from './DeckBuilder';
import { StartOverlay } from './StartOverlay';
import { CountdownDisplay } from './CountdownDisplay';
import { LevyChoice } from './LevyChoice';
import { nextWavePreview } from './wave-preview';
import { COLORS } from './theme';

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 70vh;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
`;

const Center = styled.div`
  flex: 1;
  padding: 12px;
`;

const BoardWrapper = styled.div`
  position: relative;
`;

const Result = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  padding: 16px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
`;

const NoteForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  width: 100%;
  max-width: 420px;
`;

const NoteLabel = styled.label`
  align-self: flex-start;
`;

const NoteInput = styled.textarea`
  width: 100%;
  min-height: 60px;
  padding: 8px;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
`;

const ActionButton = styled.button`
  min-height: 44px;
  padding: 0 16px;
  background: transparent;
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
  cursor: pointer;
`;

const Feedback = styled.p`
  margin: 0;
  color: ${COLORS.opportunity};
`;

/** 2回目以降のブリーフィング（StartOverlay）をスキップするための既読フラグ */
const BRIEFING_SEEN_KEY = 'ashen-rampart:briefing-seen-v1';

const readBriefingSeen = (): boolean => {
  try {
    return localStorage.getItem(BRIEFING_SEEN_KEY) === '1';
  } catch (e) {
    console.error('ブリーフィング既読フラグの読み込みに失敗しました', e);
    return false;
  }
};

const markBriefingSeen = (): void => {
  try {
    localStorage.setItem(BRIEFING_SEEN_KEY, '1');
  } catch (e) {
    console.error('ブリーフィング既読フラグの保存に失敗しました', e);
  }
};

/**
 * ブリーフィング画面用の第1ウェーブ予告
 *
 * tick に -1 を渡すことで「ラン開始前（tick 0 より前）」を表す。
 * createCombatState が行うカウントダウン分のオフセット計算をここで
 * 重複実装しなくても、素直に wave1（先頭の非空ウェーブ）が選ばれる。
 */
const FIRST_WAVE_PREVIEW = nextWavePreview({ waves: PLAINS_WAVES, tick: -1 });

/**
 * 計測ログをクリップボードへコピーする
 *
 * Clipboard API が使えない環境（対応ブラウザ外・権限拒否）では例外を握り潰さず、
 * コンソールへ出力してユーザーに手動コピーの手段を残す（記録が失われて終わる事態を避ける）。
 */
const copyLogToClipboard = async (json: string): Promise<boolean> => {
  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      throw new Error('Clipboard API が利用できません');
    }
    await navigator.clipboard.writeText(json);
    return true;
  } catch (e) {
    console.error('計測ログのクリップボードコピーに失敗しました', e);
    console.log(json);
    return false;
  }
};

interface RunViewProps {
  cards: string[];
  seed?: number;
  /** 決着後にデッキを組み直せるよう、構築画面へ戻すためのコールバック */
  onRebuild: () => void;
}

/** ラン本体。cards が確定してからマウントされる */
const RunView: React.FC<RunViewProps> = ({ cards, seed, onRebuild }) => {
  const game = useAshenRampartGame({ cards, seed });
  const [noteText, setNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  // スペースキーで一時停止（設計書 §9.6）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // 入力要素にフォーカスがある間はスペースを奪わない。決着画面の勝敗理由
      // テキストエリアに入力中、打つたびに一時停止がトグルしてしまう不具合の修正
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)
      ) {
        return;
      }
      if (event.code !== 'Space') return;
      event.preventDefault();
      game.togglePause();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game]);

  const handleNoteSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    const trimmed = noteText.trim();
    if (trimmed.length === 0) return;
    game.noteRun(trimmed);
    setNoteSaved(true);
  };

  const handleCopyLog = (): void => {
    void copyLogToClipboard(game.exportLogJson()).then((ok) => {
      setCopyStatus(ok ? 'copied' : 'failed');
    });
  };

  return (
    <Layout>
      <LevyChoice options={game.levyOptions} onChoose={game.chooseLevy} />
      <RunStatusBar
        state={game.state}
        isPaused={game.isPaused}
        onTogglePause={game.togglePause}
      />
      <Center>
        <BoardWrapper>
          <BoardGrid
            map={PLAINS_MAP}
            state={game.state}
            placeableCells={game.placeableCells}
            onCellClick={game.interactCell}
          />
          <CountdownDisplay tick={game.state.tick} />
        </BoardWrapper>
        <EnemyLegend />
        {game.state.outcome !== 'playing' && (
          <Result>
            <p>{game.state.outcome === 'won' ? '砦は守られた' : '城壁は灰燼に帰した'}</p>
            <ActionRow>
              <ActionButton type="button" onClick={onRebuild}>
                もう一度挑む
              </ActionButton>
              <ActionButton type="button" onClick={handleCopyLog}>
                計測ログをコピー
              </ActionButton>
            </ActionRow>
            {copyStatus === 'copied' && <Feedback>計測ログをコピーしました</Feedback>}
            {copyStatus === 'failed' && (
              <Feedback>コピーに失敗しました。コンソールに出力しています</Feedback>
            )}
            <NoteForm onSubmit={handleNoteSubmit}>
              <NoteLabel htmlFor="ashen-rampart-run-note">勝敗の理由を記録する</NoteLabel>
              <NoteInput
                id="ashen-rampart-run-note"
                value={noteText}
                onChange={(event) => {
                  setNoteText(event.target.value);
                  setNoteSaved(false);
                }}
              />
              <ActionButton type="submit">記録する</ActionButton>
              {noteSaved && <Feedback>記録しました</Feedback>}
            </NoteForm>
          </Result>
        )}
      </Center>
      <HandArea
        state={game.state}
        selectedIndex={game.selectedIndex}
        onSelect={game.selectCard}
        overflowNotice={game.overflowNotice}
      />
    </Layout>
  );
};

type Phase = 'building' | 'briefing' | 'running';

export const AshenRampartGame: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('building');
  const [cards, setCards] = useState<string[]>([]);
  const [seed, setSeed] = useState<number | undefined>(undefined);

  const handleBuilderStart = (chosenCards: string[], chosenSeed?: number): void => {
    setCards(chosenCards);
    setSeed(chosenSeed);
    setPhase(readBriefingSeen() ? 'running' : 'briefing');
  };

  const handleBriefingStart = (): void => {
    markBriefingSeen();
    setPhase('running');
  };

  const handleRebuild = (): void => {
    setPhase('building');
  };

  if (phase === 'building') {
    return <DeckBuilder onStart={handleBuilderStart} />;
  }
  if (phase === 'briefing') {
    return <StartOverlay preview={FIRST_WAVE_PREVIEW} onStart={handleBriefingStart} />;
  }
  return <RunView cards={cards} seed={seed} onRebuild={handleRebuild} />;
};
