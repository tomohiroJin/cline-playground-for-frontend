/**
 * 迷宮の残響 - スタイル定義
 *
 * LabyrinthEchoGame.tsx §7 から抽出。
 * CSS 文字列とページスタイルを提供する。
 */

export const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a0a18;--card:rgba(14,14,28,0.92);--border:rgba(80,80,130,0.2);--text:#d0d0e0;--dim:#7878a0;--bright:#f0f0ff;--sans:-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Sans',sans-serif;--serif:Georgia,'Hiragino Mincho ProN','Yu Mincho',serif}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes glow{0%,100%{text-shadow:0 0 20px rgba(99,102,241,.3)}50%{text-shadow:0 0 50px rgba(99,102,241,.6),0 0 100px rgba(99,102,241,.15)}}
@keyframes goldGlow{0%,100%{text-shadow:0 0 20px rgba(251,191,36,.3)}50%{text-shadow:0 0 50px rgba(251,191,36,.6)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes shakeX{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes ripple{0%{box-shadow:0 0 0 0 rgba(99,102,241,.4)}100%{box-shadow:0 0 0 14px rgba(99,102,241,0)}}
@keyframes breathe{0%,100%{opacity:.05}50%{opacity:.12}}
@keyframes dmgFlash{0%{background:rgba(239,68,68,.22)}100%{background:transparent}}
@keyframes healFlash{0%{background:rgba(74,222,128,.12)}100%{background:transparent}}
@keyframes glitch{0%{transform:translate(0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,2px)}80%{transform:translate(1px,-1px)}100%{transform:translate(0)}}
@keyframes statusPulse{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes floorReveal{0%{opacity:0;transform:scale(0.9)}50%{opacity:1}100%{opacity:1;transform:scale(1)}}
@keyframes endingGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
@keyframes popIn{0%{transform:scale(0.8);opacity:0}50%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes dangerPulse{0%,100%{opacity:.9}50%{opacity:.55}}
@keyframes kpPop{0%{transform:scale(1)}50%{transform:scale(1.25);color:#fbbf24}100%{transform:scale(1)}}
@keyframes bought{0%{background:rgba(74,222,128,.25);transform:scale(1.02)}100%{background:rgba(74,222,128,.06);transform:scale(1)}}
@keyframes countUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.btn{display:block;width:100%;padding:14px 18px;margin-bottom:10px;background:rgba(22,22,44,.7);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;font-family:var(--sans);cursor:pointer;text-align:left;line-height:1.65;transition:all .2s;position:relative;overflow:hidden}
.btn:hover, .btn.selected{background:rgba(40,40,70,.85);border-color:rgba(99,102,241,.35);transform:translateY(-2px);box-shadow:0 6px 24px rgba(99,102,241,.1)}
.btn:active{transform:translateY(0)}
.btn-p{background:linear-gradient(135deg,rgba(99,102,241,.14),rgba(139,92,246,.1));border-color:rgba(99,102,241,.35);color:#c4b5fd}
.btn-p:hover, .btn-p.selected{background:linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.18));border-color:rgba(99,102,241,.5);box-shadow:0 6px 28px rgba(99,102,241,.18)}
.bar-t{width:100%;height:6px;background:rgba(25,25,50,.9);border-radius:4px;overflow:hidden}
.bar-f{height:100%;border-radius:4px;transition:width .6s cubic-bezier(.4,0,.2,1)}
.tag{display:inline-flex;align-items:center;gap:4px;font-size:10px;padding:3px 10px;border-radius:5px;font-family:var(--sans);font-weight:500}
.card{max-width:640px;width:100%;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:28px 24px;position:relative;z-index:1;backdrop-filter:blur(12px)}
.divider{width:48px;height:1px;background:linear-gradient(90deg,transparent,#6366f1,transparent);margin:0 auto}
.log-e{font-size:11px;color:#707090;margin-bottom:6px;line-height:1.6;border-left:2px solid rgba(60,60,90,.25);padding:2px 0 4px 10px}
.cn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:7px;background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1));color:#a5b4fc;font-size:11px;margin-right:10px;flex-shrink:0;font-family:var(--sans);font-weight:700}
.shake{animation:shakeX .35s ease}
.dot{width:10px;height:10px;border-radius:50%;border:2px solid rgba(80,80,120,.3);transition:all .3s}
.dot.done{background:#6366f1;border-color:#6366f1;box-shadow:0 0 8px rgba(99,102,241,.5)}
.dot.now{border-color:#a5b4fc;animation:ripple 1.5s infinite}
.fb{display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:5px 14px;border-radius:20px;font-family:var(--sans);font-weight:500}
.uc{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;margin-bottom:8px;border-radius:10px;transition:all .2s;border:1px solid var(--border);background:rgba(16,16,30,.5)}
.uc:hover{border-color:rgba(99,102,241,.25)}.uc.own{background:rgba(74,222,128,.06);border-color:rgba(74,222,128,.2)}
.vignette{position:fixed;inset:0;pointer-events:none;z-index:2;transition:box-shadow 1s}
.distort{animation:glitch .1s infinite}
.dmg-overlay{position:fixed;inset:0;pointer-events:none;z-index:3;animation:dmgFlash .4s ease-out}
.heal-overlay{position:fixed;inset:0;pointer-events:none;z-index:3;animation:healFlash .5s ease-out}
.progress-wrap{position:relative;margin:20px 0;height:8px;background:rgba(20,20,50,.8);border-radius:4px;overflow:visible}
.progress-fill{height:100%;border-radius:4px;transition:width 1s cubic-bezier(.4,0,.2,1);position:relative}
.progress-glow{position:absolute;right:-2px;top:-4px;width:16px;height:16px;border-radius:50%;filter:blur(6px)}
.sec{padding:12px 16px;background:rgba(8,8,20,.4);border-radius:10px;border:1px solid rgba(50,50,80,.12);margin-bottom:20px}
.sec-hd{font-size:11px;margin-bottom:10px;font-family:var(--sans);letter-spacing:2px}
.badge{font-size:10px;font-family:var(--sans);padding:3px 8px;border-radius:5px;display:inline-block}
.tc{text-align:center}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:12px;font-family:var(--sans)}
.flex-wrap-c{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
@media(hover:none){.key-hint{display:none!important}}
`;

export const PAGE_STYLE = Object.freeze({
  minHeight: "100vh",
  background: "linear-gradient(180deg,#080818 0%,#0c0c20 40%,#080812 100%)",
  color: "var(--text)",
  fontFamily: "var(--serif)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px 16px",
  position: "relative",
});
