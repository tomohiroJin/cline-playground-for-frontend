/**
 * 灰燼の城壁 - リザルトパネル
 *
 * 勝敗表示に加え、反復0の計測として「勝敗の理由」の任意入力（判定項目3）と
 * 行動ログの JSON コピー（レトロでの集計用）を提供する。
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import type { RunState } from '../domain/run/run-state';

const Panel = styled.div`
  text-align: center;
  color: #e8ded2;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
`;

const NoteArea = styled.textarea`
  width: min(480px, 90%);
  min-height: 60px;
  border-radius: 6px;
  padding: 8px;
`;

interface Props {
  run: RunState;
  onRestart: () => void;
  /** 勝敗理由の記録（判定項目3。空文字では呼ばれない） */
  onNote: (text: string) => void;
  /** 行動ログの JSON 文字列を返す（開発用コピー） */
  exportLogJson: () => string;
}

export const ResultPanel: React.FC<Props> = ({ run, onRestart, onNote, exportLogJson }) => {
  const [note, setNote] = useState('');
  const [isNoted, setIsNoted] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const submitNote = () => {
    const text = note.trim();
    if (text === '') return;
    onNote(text);
    setIsNoted(true);
  };

  const copyLog = async () => {
    const json = exportLogJson();
    try {
      await navigator.clipboard.writeText(json);
      setCopyMessage('コピーしました');
    } catch {
      // クリップボード未対応環境ではコンソールに出す（開発用機能のため）
      console.log(json);
      setCopyMessage('コンソールに出力しました');
    }
  };

  return (
    <Panel>
      <h2>{run.status === 'won' ? '🏰 砦は守られた' : '💀 城壁は灰燼に帰した'}</h2>
      <p>スコア: {run.score}</p>
      {isNoted ? (
        <p>記録しました</p>
      ) : (
        <>
          <label htmlFor="run-note">勝敗の理由（ひと言）</label>
          <NoteArea
            id="run-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="なぜ勝てた/負けたと思うか（任意）"
          />
          <button onClick={submitNote}>理由を記録</button>
        </>
      )}
      <button onClick={onRestart}>もう一度挑む</button>
      <button onClick={copyLog}>計測ログをコピー</button>
      {copyMessage && <p>{copyMessage}</p>}
    </Panel>
  );
};
