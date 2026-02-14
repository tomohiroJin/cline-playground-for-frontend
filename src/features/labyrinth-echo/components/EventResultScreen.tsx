// @ts-nocheck
/**
 * 迷宮の残響 - イベント・結果画面
 */
import { CFG } from '../game-logic';
import { EVENT_TYPE, FLOOR_META } from '../definitions';
import { Page } from './Page';
import {
  StatBar, StatusTag, StepDots, DiffBadge,
  TypewriterText, Change, FlagIndicator, DrainDisplay, LogEntry,
} from './GameComponents';

export const EventResultScreen = ({
  Particles, vignette, overlay, shake, player, floor, floorMeta, floorColor,
  diff, step, progressPct, audioOn, toggleAudio, showLog, setShowLog, log,
  event, phase, revealed, done, ready, skip, handleChoice, resTxt, resChg, drainInfo, proceed, lowMental,
}) => {
  const evType = event ? EVENT_TYPE[event.tp] : null;
  const isChainEvent = event?.chainOnly;
  return (
    <Page particles={Particles}>
      <div className="vignette" style={vignette} />
      {overlay === "dmg" && <div className="dmg-overlay" />}
      {overlay === "heal" && <div className="heal-overlay" />}
      {/* ステータスパネル */}
      <div className={`card ${shake ? "shake" : ""}`} style={{ padding: "16px 20px", marginBottom: 12, animation: "fadeIn .3s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div className="fb" style={{ background: `${floorColor}12`, border: `1px solid ${floorColor}25`, color: floorColor }}>
              <span style={{ fontWeight: 700 }}>第{floor}層</span><span style={{ opacity: .5 }}>|</span><span>{floorMeta.name}</span>
            </div>
            <DiffBadge diff={diff} />
            {isChainEvent && <span style={{ fontSize: 9, color: "#60a5fa", fontFamily: "var(--sans)", opacity: .8 }}>連続</span>}
          </div>
          <StepDots current={step} total={CFG.EVENTS_PER_FLOOR} />
        </div>
        <StatBar label="体力" value={player.hp} max={player.maxHp} color={player.hp < player.maxHp * .25 ? "#ef4444" : "linear-gradient(90deg,#ef4444,#f87171)"} icon="❤" />
        <StatBar label="精神力" value={player.mn} max={player.maxMn} color={player.mn < player.maxMn * .25 ? "#7c3aed" : "linear-gradient(90deg,#6366f1,#818cf8)"} icon="◈" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, flexWrap: "wrap", gap: 6 }}>
          <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--sans)" }}>📖 情報: <span style={{ color: "#fbbf24", fontWeight: 700 }}>{player.inf}</span></div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{player.st.map(s => <StatusTag key={s} name={s} />)}</div>
        </div>
        <div style={{ marginTop: 10, height: 3, background: "rgba(20,20,50,.8)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: `linear-gradient(90deg,#6366f1,${floorColor})`, borderRadius: 2, transition: "width .5s" }} />
        </div>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "#404060", fontFamily: "var(--sans)" }}>全体進捗 {Math.round(progressPct)}%</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={toggleAudio} style={{ fontSize: 10, color: audioOn ? "#4ade80" : "#404060", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)", transition: "color .2s" }}>{audioOn ? "♪" : "♪×"}</button>
            <button onClick={() => setShowLog(!showLog)} style={{ fontSize: 10, color: "var(--dim)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)" }}>{showLog ? "閉じる ▲" : "ログ ▼"}</button>
          </div>
        </div>
        {showLog && <div style={{ marginTop: 8, maxHeight: 180, overflowY: "auto", background: "rgba(0,0,0,.25)", borderRadius: 8, padding: 12 }}>
          {log.length === 0
            ? <div style={{ fontSize: 11, color: "#404060", fontFamily: "var(--sans)" }}>ログなし</div>
            : log.slice().reverse().map((l, i) => <LogEntry key={i} entry={l} />)}
        </div>}
      </div>
      {/* メインイベントカード */}
      <div className={`card ${lowMental ? "distort" : ""}`} style={{ animation: "fadeUp .4s" }}>
        {phase === "event" && event && <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            {evType && <span className="tag" style={{ color: evType.colors[0], background: evType.colors[1], border: `1px solid ${evType.colors[2]}`, letterSpacing: 3, fontSize: 10, fontWeight: 600 }}>{evType.label}</span>}
            {isChainEvent && <span className="tag" style={{ color: "#60a5fa", background: "rgba(96,165,250,.08)", border: "1px solid rgba(96,165,250,.2)", fontSize: 10 }}>連鎖</span>}
            <span style={{ fontSize: 10, color: "#404060", fontFamily: "var(--sans)" }}>#{(floor - 1) * CFG.EVENTS_PER_FLOOR + step + 1}/{CFG.MAX_FLOOR * CFG.EVENTS_PER_FLOOR}</span>
          </div>
          <TypewriterText text={event.sit} revealed={revealed} done={done} ready={ready} skip={skip} />
          {done && ready && <div style={{ animation: "fadeUp .4s" }}>
            <div className="sec-hd" style={{ color: "#505078" }}>── 行動を選択 ──</div>
            {event.ch.map((c, i) => {
              const conds = c.o?.filter(o => o.c !== "default").map(o => o.c) ?? [];
              const hint = player.inf >= 15 && conds.length > 0
                ? conds[0].startsWith("hp") ? "❤" : conds[0].startsWith("mn") ? "◈" : conds[0].startsWith("inf") ? "📖" : conds[0].startsWith("status") ? "●" : null
                : null;
              return <button key={i} className="btn" onClick={() => handleChoice(i)} style={{ display: "flex", alignItems: "flex-start", animation: `slideIn .3s ease ${i * 0.08}s both` }}>
                <span className="cn">{i + 1}</span>
                <span style={{ flex: 1 }}>{c.t}</span>
                {hint && <span style={{ fontSize: 9, opacity: .4, marginLeft: 6, alignSelf: "center" }} title="条件あり">{hint}</span>}
              </button>;
            })}
          </div>}
        </>}
        {phase === "result" && <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span className="tag" style={{ color: "#fbbf24", background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)", letterSpacing: 3, fontSize: 10, fontWeight: 600 }}>結 果</span>
          </div>
          <TypewriterText text={resTxt} revealed={revealed} done={done} ready={ready} skip={skip} mb={24} minHeight={60} />
          {done && ready && resChg && <div style={{ animation: "fadeUp .3s" }}>
            {(() => {
              const net = (resChg.hp ?? 0) + (resChg.mn ?? 0) + (resChg.inf ?? 0);
              const borderClr = net > 0 ? "rgba(74,222,128,.18)" : net < 0 ? "rgba(248,113,113,.15)" : "rgba(50,50,80,.15)";
              const bgClr = net > 0 ? "rgba(74,222,128,.03)" : net < 0 ? "rgba(248,113,113,.03)" : "rgba(8,8,20,.5)";
              return (
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 12, padding: "12px 16px", background: bgClr, borderRadius: 10, border: `1px solid ${borderClr}` }}>
                  {resChg.hp !== 0  && <Change value={resChg.hp} label="HP" />}
                  {resChg.mn !== 0  && <Change value={resChg.mn} label="精神" />}
                  {resChg.inf !== 0 && <Change value={resChg.inf} label="情報" />}
                  <FlagIndicator flag={resChg.fl} />
                </div>
              );
            })()}
            <DrainDisplay drain={drainInfo} />
            {player.hp > 0 && player.mn > 0 && resChg.fl !== "escape" && (() => {
              const remaining = CFG.EVENTS_PER_FLOOR - step;
              const nextFloorFlag = step >= CFG.EVENTS_PER_FLOOR && floor < CFG.MAX_FLOOR;
              return (
                <div style={{ fontSize: 10, color: "#505070", fontFamily: "var(--sans)", marginBottom: 10, display: "flex", gap: 12, justifyContent: "center" }}>
                  {remaining > 0 && <span>この層 残り{remaining}イベント</span>}
                  {nextFloorFlag && <span style={{ color: floorColor }}>→ 第{floor + 1}層へ</span>}
                </div>
              );
            })()}
            {player.hp > 0 && player.mn > 0 && resChg.fl !== "escape" && <button className="btn btn-p tc" onClick={proceed}>先に進む</button>}
          </div>}
        </>}
      </div>
    </Page>
  );
};
