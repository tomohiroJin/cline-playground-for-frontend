/**
 * 原始進化録 - PRIMAL PATH - 契約・エラーハンドリング
 *
 * Labyrinth Echo contracts.tsx パターン準拠。
 */
import { Component, type ReactNode } from 'react';

/** 不変条件アサーション */
export function invariant(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`[PrimalPath] ${msg}`);
}

/** 同期コールバックの安全実行 */
export const safeSync = <T,>(fn: () => T, ctx: string): T | null => {
  try {
    return fn();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${ctx}]`, msg);
    return null;
  }
};

/** React エラーバウンダリ */
interface EBProps { children: ReactNode }
interface EBState { error: Error | null }

export class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }
  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0a0a12', color: '#f87171',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 32, fontFamily: "'Courier New', monospace",
        }}>
          <h2 style={{ marginBottom: 16, letterSpacing: 4 }}>エラーが発生しました</h2>
          <p style={{
            color: '#808068', fontSize: 13, marginBottom: 24,
            textAlign: 'center', maxWidth: 400, lineHeight: 1.8,
          }}>
            ゲームデータの読み込み中にエラーが発生しました。<br />ページを再読み込みしてください。
          </p>
          <pre style={{
            fontSize: 11, color: '#706080', background: 'rgba(20,20,30,.8)',
            padding: 16, borderRadius: 8, maxWidth: '90vw', overflow: 'auto', marginBottom: 24,
          }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{
              padding: '10px 24px', background: 'rgba(240,192,64,.15)',
              border: '1px solid rgba(240,192,64,.4)', color: '#f0c040',
              borderRadius: 4, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
            }}
          >
            再読み込み
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
