import React from 'react';
import type { SaveData, SfxType } from '../types';
import type { GameAction } from '../hooks';
import { TREE, TIER_UNLOCK, TIER_NAMES, CAT_CL } from '../constants';
import { getTB, tbSummary } from '../game-logic';
import { Screen, SubTitle, Divider, GameButton, TreeNodeBox, TierHeader, Gc } from '../styles';

interface Props {
  save: SaveData;
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
  showOverlay: (icon: string, text: string, ms?: number) => Promise<void>;
}

export const TreeScreen: React.FC<Props> = ({ save, dispatch, playSfx, showOverlay }) => {
  const tb = getTB(save.tree);
  let totalN = 0, boughtN = 0;
  TREE.forEach(nd => {
    if (save.clears >= (TIER_UNLOCK[nd.t] || 0)) { totalN++; if (save.tree[nd.id]) boughtN++; }
  });
  const summary = tbSummary(tb);

  const handleBuy = async (nodeId: string, nodeName: string) => {
    playSfx('evo');
    dispatch({ type: 'BUY_TREE_NODE', nodeId });
    await showOverlay('✨', nodeName + ' 習得！', 600);
  };

  return (
    <Screen>
      <div style={{ fontSize: 22, marginTop: 4 }}>🦴</div>
      <SubTitle>永続文明ツリー</SubTitle>
      <Divider />
      <div style={{ fontSize: 14, color: '#f0c040', margin: '4px 0' }}>
        所持：<span style={{ fontSize: 16 }}>{save.bones}</span> 骨
      </div>
      <div style={{ fontSize: 9, color: '#605848', marginBottom: 2 }}>
        取得 {boughtN}/{totalN} ・クリア{save.clears}回
      </div>
      {boughtN > 0 && summary.length > 0 && (
        <div style={{ fontSize: 8, color: '#605848', marginBottom: 4, textAlign: 'center' }}>
          効果: {summary.join(' / ')}
        </div>
      )}

      {[1, 2, 3, 4, 5, 6, 7, 8].map(tier => {
        const req = TIER_UNLOCK[tier] || 0;
        const unlocked = save.clears >= req;
        const nodes = TREE.filter(nd => nd.t === tier);
        if (!nodes.length) return null;
        const tBought = nodes.filter(nd => !!save.tree[nd.id]).length;

        return (
          <React.Fragment key={tier}>
            <TierHeader $locked={!unlocked}>
              ── {TIER_NAMES[tier]}{unlocked ? ` (${tBought}/${nodes.length})` : ''} ──
              {req > 0 && !unlocked && ` 🔒${req}クリア`}
            </TierHeader>
            {!unlocked ? (
              <div style={{ fontSize: 9, color: '#401820', textAlign: 'center', marginBottom: 4 }}>{req}回クリアで解放</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
                {nodes.map(nd => {
                  const bought = !!save.tree[nd.id];
                  const locked = !!(nd.r && !save.tree[nd.r]);
                  const canBuy = !bought && !locked && save.bones >= nd.c;
                  const req2 = nd.r ? TREE.find(x => x.id === nd.r) : null;
                  const cc = CAT_CL[nd.cat] || '#f0c040';

                  return (
                    <TreeNodeBox
                      key={nd.id}
                      $bought={bought}
                      $locked={locked}
                      $canBuy={canBuy}
                      style={{ cursor: canBuy ? 'pointer' : 'default', borderLeft: `2px solid ${bought ? '#2a5a2a' : cc}` }}
                      onClick={() => { if (canBuy) handleBuy(nd.id, nd.n); }}
                    >
                      <div style={{ color: bought ? '#50a050' : cc, fontSize: 9 }}>{nd.n}</div>
                      <div style={{ fontSize: 7, color: '#605848', margin: '1px 0' }}>{nd.d}</div>
                      {req2 && !bought && <div style={{ fontSize: 7, color: '#444' }}>要:{req2.n}</div>}
                      <div style={{ fontSize: 8, color: bought ? '#3a6a3a' : canBuy ? '#f0c040' : '#444' }}>
                        {bought ? '✓' : `🦴${nd.c}`}
                      </div>
                    </TreeNodeBox>
                  );
                })}
              </div>
            )}
          </React.Fragment>
        );
      })}

      <GameButton style={{ marginTop: 8 }} onClick={() => { playSfx('click'); dispatch({ type: 'RETURN_TO_TITLE' }); }}>
        ◀ もどる
      </GameButton>
    </Screen>
  );
};
