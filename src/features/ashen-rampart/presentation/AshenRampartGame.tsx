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
import { BattleAnnouncer } from './BattleAnnouncer';
import { nextWavePreview } from './wave-preview';
import { RunSummary } from './RunSummary';
import { COLORS } from './theme';
import { HEADER_CLEARANCE } from './layout-constants';

export { HEADER_CLEARANCE };

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 70vh;
  padding-top: ${HEADER_CLEARANCE};
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

/**
 * 拒否理由の色トーン
 *
 * 拒否は「不便」であって砦が削られる「本当の危険」ではないため、赤は使わない。
 * 赤（danger / dangerText）はライフが削られる場面に予約されている
 * （theme.ts）。手札溢れ通知（HandArea.tsx の Notice）も同じ理由で opportunity
 * を使っており、それと揃えた。
 *
 * この定数から色（RejectionNotice の color）と data-tone 属性の両方を導出する。
 * 片方だけを変更できてしまうと「テストは緑だが検証している中身が違う」欠陥に
 * なるため、出どころを1つに絞っている。
 */
const REJECTION_NOTICE_TONE = 'opportunity' as const;

/** 拒否理由。盤面直下に置く（原因は盤面クリックなので視線が盤面にあるため） */
const RejectionNotice = styled.p`
  margin: 4px 0 0;
  color: ${COLORS[REJECTION_NOTICE_TONE]};
  text-align: center;
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
  // 集計は「勝敗の理由」を記録した後にだけ出す。
  // 判定項目1 の問いは「戦闘中に読めたか」であり、集計を先に見せると
  // 盤面で読めなかった場合でもリザルトが答えを教えてしまう（設計書 §8.2）
  const [summaryUnlocked, setSummaryUnlocked] = useState(false);

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

  // 決着後に再挑戦（同デッキ別シード・構築画面へ戻る）したとき、決着入力の状態を
  // リセットする。RunView はランをまたいで再マウントされない（同デッキ別シードは
  // this コンポーネント内で state を差し替えるだけ）ため、outcome の変化を見て検知する
  useEffect(() => {
    if (game.state.outcome !== 'playing') return;
    setNoteText('');
    setNoteSaved(false);
    setCopyStatus('idle');
    setSummaryUnlocked(false);
  }, [game.state.outcome]);

  const handleNoteSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    const trimmed = noteText.trim();
    if (trimmed.length === 0) return;
    game.noteRun(trimmed);
    setNoteSaved(true);
    setSummaryUnlocked(true);
  };

  const handleCopyLog = (): void => {
    void copyLogToClipboard(game.exportLogJson()).then((ok) => {
      setCopyStatus(ok ? 'copied' : 'failed');
    });
  };

  const isLevyBlocked = game.isPaused || game.state.outcome !== 'playing';

  return (
    <Layout data-testid="ashen-rampart-layout" data-header-clearance={HEADER_CLEARANCE}>
      <LevyChoice options={game.levyOptions} onChoose={game.chooseLevy} disabled={isLevyBlocked} />
      <RunStatusBar
        state={game.state}
        isPaused={game.isPaused}
        onTogglePause={game.togglePause}
        runSeed={game.runSeed}
        isLeaking={game.effects.some((e) => e.kind === 'leak')}
      />
      <Center>
        <BattleAnnouncer message={game.announcement} />
        <BoardWrapper>
          <BoardGrid
            map={PLAINS_MAP}
            state={game.state}
            placeableCells={game.placeableCells}
            effects={game.effects}
            onCellClick={game.interactCell}
          />
          <CountdownDisplay tick={game.state.tick} />
        </BoardWrapper>
        {game.rejectionNotice && (
          <RejectionNotice data-tone={REJECTION_NOTICE_TONE}>{game.rejectionNotice}</RejectionNotice>
        )}
        <EnemyLegend />
        {game.state.outcome !== 'playing' && (
          <Result>
            <p>{game.state.outcome === 'won' ? '砦は守られた' : '城壁は灰燼に帰した'}</p>
            <NoteForm onSubmit={handleNoteSubmit}>
              <NoteLabel htmlFor="ashen-rampart-run-note">
                勝敗の理由を記録する（記録すると集計が開きます）
              </NoteLabel>
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

            {summaryUnlocked && (
              <>
                <RunSummary view={game.summary} />
                <ActionRow>
                  <ActionButton type="button" onClick={() => game.restart()}>
                    同じデッキで別のシードに挑む
                  </ActionButton>
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
              </>
            )}
          </Result>
        )}
      </Center>
      <HandArea
        state={game.state}
        selectedIndex={game.selectedIndex}
        onSelect={game.selectCard}
        onDiscard={game.discardCard}
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
    // 指摘4: 直前に組んだデッキ・シードを引き継ぐ（20枚を毎回組み直させない）
    return (
      <DeckBuilder
        onStart={handleBuilderStart}
        initialCards={cards}
        initialSeedText={seed !== undefined ? String(seed) : ''}
      />
    );
  }
  if (phase === 'briefing') {
    return <StartOverlay preview={FIRST_WAVE_PREVIEW} onStart={handleBriefingStart} />;
  }
  return <RunView cards={cards} seed={seed} onRebuild={handleRebuild} />;
};
