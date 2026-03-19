/**
 * 迷宮の残響 - コレクション系画面（アンロック・称号・実績）
 */
import { ReactNode } from 'react';
import type { UIPhase } from '../presentation/hooks/use-game-orchestrator';
import { DIFFICULTY } from '../domain/constants/difficulty-defs';
import { UNLOCKS } from '../domain/constants/unlock-defs';
import { UNLOCK_CATS } from '../domain/constants/unlock-defs';
import type { MetaState } from '../domain/models/meta-state';
import { TITLES } from '../domain/constants/title-defs';
import { ENDINGS } from '../domain/constants/ending-defs';
import { getUnlockedTitles, getActiveTitle } from '../domain/services/title-service';
import { Page } from './Page';
import { Section } from './Section';
import { Badge } from './Badge';
import { StatEntry, BackBtn, UnlockRow, EndingGrid } from './GameComponents';

interface UnlocksScreenProps {
  Particles: ReactNode;
  meta: MetaState;
  lastBought: string | null;
  doUnlock: (uid: string) => void;
  setPhase: (phase: UIPhase) => void;
}

/** アンロック画面 */
export const UnlocksScreen = ({ Particles, meta, lastBought, doUnlock, setPhase }: UnlocksScreenProps) => (
  <Page particles={Particles}>
    <div className="card" style={{ marginTop: 32, animation: "fadeUp .5s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, color: "#c4b5fd", letterSpacing: 3 }}>知見の継承</h2>
        <span key={meta.kp} style={{ fontSize: 14, color: "#fbbf24", fontFamily: "var(--sans)", fontWeight: 700, animation: "kpPop .3s ease" }}>◈ {meta.kp}pt</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 20, fontFamily: "var(--sans)", lineHeight: 1.7 }}>探索で得た知見を恒久的なアビリティとして解放する。</p>
      {UNLOCK_CATS.map(cat => {
        const items = UNLOCKS.filter(u => (u.category ?? "basic") === cat.key);
        if (items.length === 0) return null;
        return (
          <div key={cat.key} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: cat.color, letterSpacing: 3, marginBottom: 10, fontFamily: "var(--sans)", fontWeight: 600, borderBottom: `1px solid ${cat.color}30`, paddingBottom: 6 }}>── {cat.label} ──</div>
            {items.map(u => {
              const own = meta.unlocked.includes(u.id);
              const af  = meta.kp >= u.cost;
              const trophyLocked = u.category === "trophy" && u.difficultyRequirement && !(meta.clearedDifficulties as readonly string[]).includes(u.difficultyRequirement) && !meta.endings?.includes(u.difficultyRequirement);
              const achieveLocked = u.category === "achieve" && u.achievementCondition && !u.achievementCondition(meta);
              const gateLocked = u.gateRequirement && !meta.clearedDifficulties?.includes(u.gateRequirement);
              const locked = !!(trophyLocked || achieveLocked || gateLocked);
              const lockDesc = gateLocked ? `${DIFFICULTY.find(d=>d.id===u.gateRequirement)?.name ?? u.gateRequirement}をクリアして解放`
                : achieveLocked ? u.achievementDescription
                : trophyLocked ? `${DIFFICULTY.find(d=>d.id===u.difficultyRequirement)?.name ?? u.difficultyRequirement}難度をクリアして解放`
                : u.description;
              const descText = locked && !own ? lockDesc : u.description;
              return (
                <UnlockRow key={u.id} icon={u.icon} name={u.name} desc={descText} own={own} locked={locked} justBought={lastBought === u.id}
                  right={
                    own ? null
                    : locked ? <span style={{ fontSize: 10, color: "#505070", fontFamily: "var(--sans)" }}>🔒</span>
                    : u.cost === 0 ? <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "var(--sans)" }}>自動解放</span>
                    : <button onClick={() => doUnlock(u.id)} disabled={!af} style={{ padding: "7px 16px", fontSize: 12, borderRadius: 8, fontFamily: "var(--sans)", cursor: af ? "pointer" : "default", background: af ? "rgba(99,102,241,.15)" : "rgba(20,20,35,.3)", border: `1px solid ${af ? "rgba(99,102,241,.4)" : "rgba(40,40,60,.2)"}`, color: af ? "#a5b4fc" : "#353555", transition: "all .2s", fontWeight: 600 }}>{u.cost}pt</button>
                  }
                />
              );
            })}
          </div>
        );
      })}
      <div style={{ fontSize: 10, color: "#505070", fontFamily: "var(--sans)", textAlign: "center", marginTop: 16, marginBottom: 8, lineHeight: 1.7 }}>
        {meta.unlocked.length}/{UNLOCKS.length} 解放済
        {meta.unlocked.length === UNLOCKS.length && <span style={{ color: "#4ade80", marginLeft: 8 }}>── 全解放達成 ──</span>}
      </div>
       <BackBtn onClick={() => setPhase("title")} />
    </div>
  </Page>
);

interface TitlesScreenProps {
  Particles: ReactNode;
  meta: MetaState;
  updateMeta: (updater: (prev: MetaState) => Partial<MetaState>) => void;
  setPhase: (phase: UIPhase) => void;
}

/** 称号選択画面 */
export const TitlesScreen = ({ Particles, meta, updateMeta, setPhase }: TitlesScreenProps) => {
  const unlocked = getUnlockedTitles(meta);
  const active = getActiveTitle(meta);
  return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: 32, animation: "fadeUp .5s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, color: "#c4b5fd", letterSpacing: 3 }}>称号</h2>
          <span style={{ fontSize: 12, color: active.color, fontFamily: "var(--sans)" }}>{active.icon} {active.name}</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 20, fontFamily: "var(--sans)", lineHeight: 1.7 }}>獲得した称号をタイトル画面に表示できる。条件を満たすと新しい称号が解放される。</p>
        {TITLES.map(t => {
          const isUnlocked = unlocked.includes(t);
          const isActive = active.id === t.id;
          return (
            <div key={t.id} className={`uc ${isActive ? "own" : ""}`} style={{ opacity: isUnlocked ? 1 : 0.35, cursor: isUnlocked ? "pointer" : "default" }}
              onClick={() => { if (isUnlocked) updateMeta(() => ({ activeTitle: t.id })); }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20, filter: isUnlocked ? "none" : "grayscale(1)" }}>{isUnlocked ? t.icon : "?"}</span>
                <div>
                  <div style={{ fontSize: 14, color: isActive ? t.color : isUnlocked ? "var(--text)" : "#505070", fontFamily: "var(--sans)", fontWeight: 600 }}>
                    {isActive && "▸ "}{isUnlocked ? t.name : "???"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2, fontFamily: "var(--sans)" }}>
                    {isUnlocked ? t.desc : "条件を満たすと解放"}
                  </div>
                </div>
              </div>
              {isUnlocked && !isActive && <span style={{ fontSize: 10, color: "#818cf8", fontFamily: "var(--sans)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(99,102,241,.3)", background: "rgba(99,102,241,.08)" }}>選択</span>}
              {isActive && <span style={{ fontSize: 10, color: t.color, fontFamily: "var(--sans)", fontWeight: 700 }}>使用中</span>}
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: "var(--dim)", textAlign: "center", marginTop: 12, fontFamily: "var(--sans)" }}>{unlocked.length} / {TITLES.length} 解放済</div>
        <BackBtn onClick={() => setPhase("title")} />
      </div>
    </Page>
  );
};

interface RecordsScreenProps {
  Particles: ReactNode;
  meta: MetaState;
  setPhase: (phase: UIPhase) => void;
}

/** 実績・記録画面 */
export const RecordsScreen = ({ Particles, meta, setPhase }: RecordsScreenProps) => {
  const unlockedTitles = getUnlockedTitles(meta);
  const survivalRate = meta.runs > 0 ? Math.round(meta.escapes / meta.runs * 100) : 0;
  return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: 32, animation: "fadeUp .5s ease" }}>
        <h2 style={{ fontSize: 20, color: "#c4b5fd", letterSpacing: 3, marginBottom: 20 }}>実績・記録</h2>
        <Section label="累計記録">
          <div className="grid-2">
            <StatEntry label="探索回数" color="#818cf8" value={meta.runs} />
            <StatEntry label="生還回数" color="#4ade80" value={meta.escapes} />
            <StatEntry label="死亡回数" color="#f87171" value={meta.totalDeaths ?? 0} />
            <StatEntry label="生還率" color={survivalRate > 30 ? "#4ade80" : "#f87171"} value={`${survivalRate}%`} />
            <StatEntry label="最深到達" color="#fbbf24" value={`第${meta.bestFloor}層`} />
            <StatEntry label="累計イベント" color="#c084fc" value={meta.totalEvents} />
            <StatEntry label="知見ポイント" color="#fbbf24" value={`◈ ${meta.kp}pt`} />
            <StatEntry label="継承解放数" color="#60a5fa" value={`${meta.unlocked.length}/${UNLOCKS.length}`} />
          </div>
        </Section>
        <Section label="難易度クリア">
          <div className="flex-wrap-c" style={{ gap: 8 }}>
            {DIFFICULTY.map(d => {
              const cleared = meta.clearedDifficulties?.includes(d.id);
              return <span key={d.id} style={{ fontSize: 11, fontFamily: "var(--sans)", padding: "4px 12px", borderRadius: 6, background: cleared ? `${d.color}15` : "rgba(30,30,50,.5)", border: `1px solid ${cleared ? `${d.color}40` : "rgba(40,40,60,.3)"}`, color: cleared ? d.color : "#353555" }}>{d.icon} {d.name} {cleared ? "✓" : "─"}</span>;
            })}
          </div>
        </Section>
        <Section label={`エンディング回収 (${meta.endings?.length ?? 0}/${ENDINGS.length})`}>
          <EndingGrid endings={ENDINGS} collected={meta.endings} />
        </Section>
        <Section label="難易度クリア報酬" color="#f97316">
          {UNLOCKS.filter(u => u.category === "trophy").map(u => {
            const own = meta.unlocked.includes(u.id);
            return <UnlockRow key={u.id} icon={u.icon} name={own ? u.name : "???"} desc={own ? u.description : `${DIFFICULTY.find(d=>d.id===u.difficultyRequirement)?.name ?? u.difficultyRequirement}難度をクリアして解放`} own={own} locked={!own}
              right={own ? <span style={{ fontSize: 10, color: "#4ade80" }}>達成</span> : <span style={{ fontSize: 10, color: "#505070" }}>🔒</span>} />;
          })}
        </Section>
        <Section label="実績解放" color="#4ade80">
          {UNLOCKS.filter(u => u.category === "achieve").map(u => {
            const own = meta.unlocked.includes(u.id);
            return <UnlockRow key={u.id} icon={u.icon} name={own ? u.name : "???"} desc={own ? u.description : u.achievementDescription} own={own} locked={!own}
              right={own ? <span style={{ fontSize: 10, color: "#4ade80" }}>達成</span> : <span style={{ fontSize: 10, color: "#505070" }}>🔒</span>} />;
          })}
        </Section>
        <Section label={`称号 (${unlockedTitles.length}/${TITLES.length})`} color="#c084fc">
          <div className="flex-wrap-c">
            {TITLES.map(t => <Badge key={t.id} got={unlockedTitles.includes(t)} color={t.color} label={`${t.icon} ${t.name}`} />)}
          </div>
        </Section>
        <BackBtn onClick={() => setPhase("title")} />
      </div>
    </Page>
  );
};
