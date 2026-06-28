/**
 * 迷宮の残響 - 残響書庫画面
 *
 * 先人カード・断片リーダー・真相レイヤーを表示するコレクション画面。
 */
import { useState, ReactNode } from 'react';
import type { UIPhase } from '../presentation/hooks/use-game-orchestrator';
import type { MetaState } from '../domain/models/meta-state';
import { PREDECESSORS } from '../domain/constants/predecessor-defs';
import { ECHO_FRAGMENTS } from '../domain/constants/echo-fragment-defs';
import type { EchoFragment } from '../domain/models/echo';
import {
  ECHO_DEPTH_MAX, predecessorFragments, predecessorProgress,
  isPredecessorDiscovered, isPredecessorComplete, unlockedTruthLayers,
} from '../domain/services/echo-service';
import { useTextReveal } from '../presentation/hooks/use-text-reveal';
import { Page } from './Page';
import { Section } from './Section';
import { BackBtn } from './GameComponents';

interface ArchiveScreenProps {
  Particles: ReactNode;
  meta: MetaState;
  setPhase: (phase: UIPhase) => void;
}

/** 断片本文リーダー（逐次表示） */
const FragmentReader = ({ fragment, onClose }: { fragment: EchoFragment; onClose: () => void }) => {
  const { revealed } = useTextReveal(fragment.body, false);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,10,20,0.92)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'pointer' }}>
      <div style={{ maxWidth: 560, background: 'rgba(20,18,32,0.96)', border: '1px solid rgba(196,181,253,0.3)', borderRadius: 12, padding: 28 }}>
        <div style={{ fontSize: 13, color: '#c4b5fd', letterSpacing: 2, marginBottom: 16, fontFamily: 'var(--sans)' }}>{fragment.title}</div>
        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 2, whiteSpace: 'pre-wrap' }}>{revealed}</p>
        <div style={{ fontSize: 10, color: 'var(--dim)', textAlign: 'center', marginTop: 20, fontFamily: 'var(--sans)' }}>クリックで閉じる</div>
      </div>
    </div>
  );
};

/** 残響書庫画面 */
export const ArchiveScreen = ({ Particles, meta, setPhase }: ArchiveScreenProps) => {
  const [reading, setReading] = useState<EchoFragment | null>(null);
  const collected = meta.fragments;
  const truths = unlockedTruthLayers(meta.echoDepth);

  return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: 32, animation: 'fadeUp .5s ease' }}>
        <h2 style={{ fontSize: 20, color: '#c4b5fd', letterSpacing: 3, marginBottom: 12 }}>残響書庫</h2>

        {/* 真相の深度バー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontFamily: 'var(--sans)' }}>
          <span style={{ fontSize: 11, color: 'var(--dim)' }}>真相の深度</span>
          <span style={{ letterSpacing: 2, color: '#c4b5fd' }}>
            {Array.from({ length: ECHO_DEPTH_MAX }, (_, i) => (i < meta.echoDepth ? '●' : '○')).join('')}
          </span>
          <span style={{ fontSize: 11, color: 'var(--dim)' }}>{meta.echoDepth}/{ECHO_DEPTH_MAX}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 20, fontFamily: 'var(--sans)' }}>
          収集 {collected.length} / {ECHO_FRAGMENTS.length} 断片
        </div>

        {/* 真相レイヤー */}
        {truths.length > 0 && (
          <Section label="迷宮の真相" color="#c4b5fd">
            {truths.map(t => (
              <div key={t.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#c4b5fd', fontFamily: 'var(--sans)', fontWeight: 600 }}>{t.title}</div>
                <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.8, marginTop: 4 }}>{t.text}</p>
              </div>
            ))}
          </Section>
        )}

        {/* 先人カード */}
        <Section label="先人たちの残響">
          {PREDECESSORS.map(p => {
            const discovered = isPredecessorDiscovered(p.id, collected);
            const prog = predecessorProgress(p.id, collected);
            const complete = isPredecessorComplete(p.id, collected);
            return (
              <div key={p.id} className="uc" style={{ opacity: discovered ? 1 : 0.4, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: discovered ? 8 : 0 }}>
                  <span style={{ fontSize: 20, filter: discovered ? 'none' : 'grayscale(1)' }}>{discovered ? p.icon : '？'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: discovered ? p.color : '#505070', fontFamily: 'var(--sans)', fontWeight: 600 }}>
                      {discovered ? p.name : '？？？'}{complete && ' ✦'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'var(--sans)' }}>{prog.collected} / {prog.total} 断片</div>
                  </div>
                </div>
                {discovered && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 10, color: meta.revenantsDefeated.includes(p.id) ? '#fda4af' : '#505070', fontFamily: 'var(--sans)' }}>
                      {meta.revenantsDefeated.includes(p.id) ? '亡霊：撃破済' : '亡霊：未遭遇'}
                    </div>
                    {predecessorFragments(p.id).map(f => {
                      const has = collected.includes(f.id);
                      return (
                        <button key={f.id} disabled={!has} onClick={() => has && setReading(f)}
                          style={{ textAlign: 'left', fontSize: 12, fontFamily: 'var(--sans)', padding: '6px 10px', borderRadius: 6, cursor: has ? 'pointer' : 'default',
                            background: has ? 'rgba(196,181,253,0.08)' : 'rgba(20,20,35,0.3)', border: `1px solid ${has ? 'rgba(196,181,253,0.3)' : 'rgba(40,40,60,0.2)'}`,
                            color: has ? 'var(--text)' : '#505070' }}>
                          {has ? `▣ ${f.title}` : `□ 第${f.floors[0]}層で出会う残響`}
                        </button>
                      );
                    })}
                    {complete && <div style={{ fontSize: 11, color: p.color, lineHeight: 1.8, marginTop: 6, fontFamily: 'var(--sans)' }}>{p.summary}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </Section>

        <BackBtn onClick={() => setPhase('title')} />
      </div>
      {reading && <FragmentReader fragment={reading} onClose={() => setReading(null)} />}
    </Page>
  );
};
