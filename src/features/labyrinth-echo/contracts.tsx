// @ts-nocheck
/**
 * 迷宮の残響 - 契約・エラーハンドリング
 *
 * LabyrinthEchoGame.tsx §1 から抽出。
 * safeSync / safeAsync / ErrorBoundary を提供する。
 */
import { Component } from "react";

/** 同期コールバックの安全実行 */
export const safeSync = (fn, ctx) => {
  try { return fn(); }
  catch (e) { console.error(`[${ctx}]`, e.message); return null; }
};

/** 非同期コールバックの安全実行 */
export const safeAsync = async (fn, ctx) => {
  try { return await fn(); }
  catch (e) { console.error(`[${ctx}]`, e.message); return null; }
};

/** React エラーバウンダリ */
export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("[ErrorBoundary]", error, info.componentStack); }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight: "100vh", background: "#0a0a18", color: "#f87171", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: "sans-serif" }}>
        <h2 style={{ marginBottom: 16, letterSpacing: 4 }}>エラーが発生しました</h2>
        <p style={{ color: "#808098", fontSize: 13, marginBottom: 24, textAlign: "center", maxWidth: 400, lineHeight: 1.8 }}>
          ゲームデータの読み込み中にエラーが発生しました。<br />ページを再読み込みしてください。
        </p>
        <pre style={{ fontSize: 11, color: "#706080", background: "rgba(20,20,40,.8)", padding: 16, borderRadius: 8, maxWidth: "90vw", overflow: "auto", marginBottom: 24 }}>
          {this.state.error.message}
        </pre>
        <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
          style={{ padding: "10px 24px", background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.4)", color: "#a5b4fc", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
          再読み込み
        </button>
      </div>
    );
    return this.props.children;
  }
}
