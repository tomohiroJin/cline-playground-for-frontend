/**
 * 灰燼の城壁 - ゲーム画面
 *
 * 三層レイアウト（上部=ラン状態 / 中央=盤面 / 下部=手札と資源）。
 * 同時に走査する枠を7以内に収める（設計書 §9.1）。
 */
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { useAshenRampartGame } from './useAshenRampartGame';
import { RunStatusBar } from './RunStatusBar';
import { BoardGrid } from './BoardGrid';
import { HandArea } from './HandArea';
import { EnemyLegend } from './EnemyLegend';
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

export const AshenRampartGame: React.FC = () => {
  const game = useAshenRampartGame();
  const [noteText, setNoteText] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  // スペースキーで一時停止（設計書 §9.6）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      game.togglePause();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [game]);

  // 新しいランが始まったら決着入力の状態をリセットする
  useEffect(() => {
    if (game.state.outcome !== 'playing') return;
    setNoteText('');
    setNoteSaved(false);
    setCopyStatus('idle');
  }, [game.state.outcome]);

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
      <RunStatusBar
        state={game.state}
        isPaused={game.isPaused}
        onTogglePause={game.togglePause}
      />
      <Center>
        <BoardGrid
          map={PLAINS_MAP}
          state={game.state}
          placeableCells={game.placeableCells}
          onCellClick={game.interactCell}
        />
        <EnemyLegend />
        {game.state.outcome !== 'playing' && (
          <Result>
            <p>{game.state.outcome === 'won' ? '砦は守られた' : '城壁は灰燼に帰した'}</p>
            <ActionRow>
              <ActionButton type="button" onClick={game.restart}>
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
