/**
 * 戦闘ログコンポーネント
 * バトル中のイベントログを表示
 */
import React, { useRef, useEffect } from 'react';
import type { LogEntry } from '../../types';
import { LOG_COLORS } from '../../constants';
import { LogContainer, LogLine } from '../../styles';

/** 表示する最大ログ行数 */
const MAX_LOG_LINES = 40;

export interface BattleLogProps {
  log: readonly LogEntry[];
}

export const BattleLog: React.FC<BattleLogProps> = ({ log }) => {
  const logRef = useRef<HTMLDivElement>(null);

  // 自動スクロール
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log.length]);

  return (
    <LogContainer ref={logRef}>
      {log.slice(-MAX_LOG_LINES).map((l, i) => (
        <LogLine key={i} $color={LOG_COLORS[l.c]}>{l.x}</LogLine>
      ))}
    </LogContainer>
  );
};
