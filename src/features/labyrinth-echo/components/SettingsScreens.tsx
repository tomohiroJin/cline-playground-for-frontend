// @ts-nocheck
/**
 * 迷宮の残響 - 設定・リセット確認画面
 */
import { UNLOCKS } from '../game-logic';
import { ENDINGS, TITLES, getUnlockedTitles } from '../definitions';
import { Page } from './Page';
import { Section } from './Section';
import { BackBtn } from './GameComponents';

/** 設定画面 */
export const SettingsScreen = ({ Particles, eventCount, audioOn, toggleAudio, setPhase }) => (
  <Page particles={Particles}>
    <div className="card" style={{ marginTop: 32, animation: "fadeUp .5s ease" }}>
      <h2 style={{ fontSize: 20, color: "#c4b5fd", letterSpacing: 3, marginBottom: 20 }}>設定</h2>
      <Section label="サウンド">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontFamily: "var(--sans)", color: "var(--text)" }}>効果音</span>
          <button onClick={toggleAudio} style={{
            padding: "6px 18px", borderRadius: 20, fontSize: 12, fontFamily: "var(--sans)", fontWeight: 600, cursor: "pointer", transition: "all .2s", border: "1px solid",
            background: audioOn ? "rgba(74,222,128,.12)" : "rgba(40,40,60,.5)",
            borderColor: audioOn ? "rgba(74,222,128,.3)" : "rgba(60,60,90,.3)",
            color: audioOn ? "#4ade80" : "var(--dim)",
          }}>{audioOn ? "♪ ON" : "♪ OFF"}</button>
        </div>
      </Section>
      <Section>
        <div style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--sans)", fontWeight: 600, marginBottom: 8 }}>ゲーム情報</div>
        <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--sans)", lineHeight: 1.8 }}>
          <div>バージョン: v6</div>
          <div>イベント数: {eventCount}</div>
          <div>エンディング: {ENDINGS.length}種</div>
          <div>知見の継承: {UNLOCKS.length}種</div>
          <div>称号: {TITLES.length}種</div>
        </div>
      </Section>
      <div className="sec" style={{ background: "rgba(60,10,10,.2)", border: "1px solid rgba(248,113,113,.15)" }}>
        <div style={{ fontSize: 13, color: "#f87171", fontFamily: "var(--sans)", fontWeight: 600, marginBottom: 8 }}>⚠ データリセット</div>
        <p style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--sans)", lineHeight: 1.8, marginBottom: 12 }}>
          全ての進行データ（探索回数、知見ポイント、解放済みアビリティ、称号、エンディング記録、難易度クリア記録）を完全に消去し、初期状態に戻します。この操作は取り消せません。
        </p>
        <button className="btn tc" style={{ color: "#f87171", borderColor: "rgba(248,113,113,.3)" }} onClick={() => setPhase("reset_confirm1")}>
          データを初期化する…
        </button>
      </div>
      <BackBtn onClick={() => setPhase("title")} />
    </div>
  </Page>
);

/** リセット確認ステップ1 */
export const ResetConfirm1Screen = ({ Particles, meta, setPhase }) => (
  <Page particles={Particles}>
    <div className="card tc" style={{ marginTop: "10vh", animation: "fadeUp .5s ease", borderColor: "rgba(248,113,113,.2)" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 20, color: "#f87171", letterSpacing: 3, marginBottom: 12 }}>本当に初期化しますか？</h2>
      <p style={{ fontSize: 12, color: "var(--dim)", fontFamily: "var(--sans)", lineHeight: 1.8, marginBottom: 8 }}>
        以下のデータが全て失われます：
      </p>
      <div style={{ fontSize: 11, fontFamily: "var(--sans)", color: "#f87171", lineHeight: 1.8, marginBottom: 20, textAlign: "left", padding: "8px 16px", background: "rgba(248,113,113,.05)", borderRadius: 8, border: "1px solid rgba(248,113,113,.1)" }}>
        <div>• 探索 {meta.runs}回分の記録</div>
        <div>• 知見ポイント ◈ {meta.kp}pt</div>
        <div>• 解放済みアビリティ {meta.unlocked.length}個</div>
        <div>• エンディング回収 {meta.endings?.length ?? 0}種</div>
        <div>• 難易度クリア記録 {meta.clearedDiffs?.length ?? 0}種</div>
        <div>• 称号 {getUnlockedTitles(meta).length}種</div>
      </div>
      <button className="btn tc" style={{ color: "#f87171", borderColor: "rgba(248,113,113,.4)", fontWeight: 700 }} onClick={() => setPhase("reset_confirm2")}>
        それでも初期化する
      </button>
      <button className="btn btn-p tc" style={{ marginTop: 8 }} onClick={() => setPhase("settings")}>やめる</button>
    </div>
  </Page>
);

/** リセット確認ステップ2（最終） */
export const ResetConfirm2Screen = ({ Particles, setPhase, resetMeta }) => (
  <Page particles={Particles}>
    <div className="card tc" style={{ marginTop: "10vh", animation: "fadeUp .5s ease", borderColor: "rgba(248,113,113,.4)" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔥</div>
      <h2 style={{ fontSize: 22, color: "#ff0040", letterSpacing: 3, marginBottom: 16, animation: "pulse 2s infinite" }}>最終確認</h2>
      <p style={{ fontSize: 14, color: "#f87171", fontFamily: "var(--sans)", lineHeight: 1.8, marginBottom: 24, fontWeight: 600 }}>
        この操作は取り消せません。<br />全てのデータが完全に消去されます。
      </p>
      <button className="btn tc" style={{ color: "#ff0040", borderColor: "rgba(255,0,64,.5)", background: "rgba(255,0,64,.08)", fontWeight: 700, fontSize: 14, padding: "14px" }} onClick={async () => {
        await resetMeta();
        setPhase("title");
      }}>
        完全に初期化する
      </button>
      <button className="btn btn-p tc" style={{ marginTop: 12, fontSize: 14, padding: "14px" }} onClick={() => setPhase("settings")}>やめて戻る</button>
    </div>
  </Page>
);
