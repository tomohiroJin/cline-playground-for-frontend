/**
 * 灰燼の城壁 - 遠征の結果画面（反復7 段階1・設計書 §3.2）
 *
 * **振り返りを記録するまで結果を伏せる。** 反復5 Task 12 の「勝敗理由を記録してから
 * 集計」を遠征単位へ移したもの。結果（獲得した札・到達した層）を先に見せると、
 * 振り返り（反復7の判定項目8・9(a) の材料）が結果に引きずられる。
 *
 * 敵対的検証（PR #211 Fix C）: 見出しに `expeditionHeadline` を直接出すと、
 * 記録前でも勝敗と到達層が読めてしまい、docstring の意図と矛盾していた。
 * 記録前は勝敗・到達層のどちらも読めない `EXPEDITION_ENDED_HEADING` だけを出し、
 * 記録後（`isUnlocked`）に初めて `expeditionHeadline` の結果行を開く。
 *
 * 「説明をもう一度見る」は反復1 から持ち越した minor（5回目）を閉じる導線。
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { getCardDefinition } from '../domain/cards/card-pool';
import { currentStage, type ExpeditionState } from '../domain/expedition/expedition-state';
import { copyLogToClipboard } from './copy-log';
import { COLORS } from './theme';
import { HEADER_CLEARANCE } from './layout-constants';

export const COPY_LOG_LABEL = '判定用の記録をコピー（3遠征分まとまっています）';

/** 振り返りを記録するまで出す見出し。勝敗・到達層のどちらも読めない文言にする */
export const EXPEDITION_ENDED_HEADING = '遠征が終わった';

export const expeditionHeadline = (exp: ExpeditionState): string =>
  exp.outcome === 'cleared' ? '遠征を踏破した' : `遠征は層${currentStage(exp)?.tier ?? '?'} で潰えた`;

const Layout = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  padding-top: ${HEADER_CLEARANCE};
  color: ${COLORS.secondary};
  background: ${COLORS.dominant};
  min-height: 70vh;
`;

const NoteForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 420px;
`;

const NoteInput = styled.textarea`
  min-height: 60px;
  padding: 8px;
  background: ${COLORS.dominant};
  color: ${COLORS.secondary};
  border: 1px solid ${COLORS.secondary};
  border-radius: 4px;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
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

export interface ExpeditionSummaryProps {
  expedition: ExpeditionState;
  onNote: (text: string) => void;
  exportLogJson: () => string;
  onRetry: () => void;
  onRebuild: () => void;
  onShowBriefing: () => void;
}

type CopyStatus = 'idle' | 'copied' | 'failed';

const acquiredText = (exp: ExpeditionState): string =>
  exp.acquired.length === 0 ? 'なし' : exp.acquired.map((id) => getCardDefinition(id).name).join('、');

export const ExpeditionSummary: React.FC<ExpeditionSummaryProps> = ({
  expedition,
  onNote,
  exportLogJson,
  onRetry,
  onRebuild,
  onShowBriefing,
}) => {
  const [noteText, setNoteText] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    // ボタンの disabled だけに頼らない（Minor 2）。textarea を readOnly にしても
    // フォーム自体の送信経路が塞がるとは限らないため、ここでも二重記録を防ぐ
    if (isUnlocked) return;
    const trimmed = noteText.trim();
    if (trimmed.length === 0) return;
    onNote(trimmed);
    setIsUnlocked(true);
  };

  const handleCopy = (): void => {
    void copyLogToClipboard(exportLogJson()).then((ok) => setCopyStatus(ok ? 'copied' : 'failed'));
  };

  return (
    <Layout data-testid="ashen-rampart-expedition-summary">
      <h2>{isUnlocked ? expeditionHeadline(expedition) : EXPEDITION_ENDED_HEADING}</h2>
      <NoteForm onSubmit={handleSubmit}>
        <label htmlFor="ashen-rampart-expedition-note">遠征の振り返りを記録する（記録すると結果が開きます）</label>
        <NoteInput
          id="ashen-rampart-expedition-note"
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
          readOnly={isUnlocked}
        />
        {/* 記録後は再送信できないよう disabled にする（Minor 2）。
            記録済みかどうかは isUnlocked の1箇所だけで判断し、textarea の
            readOnly と食い違わないようにする */}
        <ActionButton type="submit" disabled={isUnlocked}>
          記録する
        </ActionButton>
      </NoteForm>
      {isUnlocked && (
        <>
          <Feedback>記録しました</Feedback>
          <p>獲得した札: {acquiredText(expedition)}</p>
          <ActionRow>
            <ActionButton type="button" onClick={handleCopy}>
              {COPY_LOG_LABEL}
            </ActionButton>
            <ActionButton type="button" onClick={onRetry}>
              同じデッキで別のシードに挑む
            </ActionButton>
            <ActionButton type="button" onClick={onRebuild}>
              デッキを組み直す
            </ActionButton>
            <ActionButton type="button" onClick={onShowBriefing}>
              説明をもう一度見る
            </ActionButton>
          </ActionRow>
          {copyStatus === 'copied' && <Feedback>判定用の記録をコピーしました</Feedback>}
          {copyStatus === 'failed' && <Feedback>コピーに失敗しました。コンソールに出力しています</Feedback>}
        </>
      )}
    </Layout>
  );
};
