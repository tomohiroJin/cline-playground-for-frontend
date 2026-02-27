import React from 'react';
import type { SfxType } from '../types';
import type { GameAction } from '../hooks';
import { Screen, SubTitle, Divider, GameButton, GamePanel } from '../styles';

interface Props {
  dispatch: React.Dispatch<GameAction>;
  playSfx: (t: SfxType) => void;
}

export const HowToPlayScreen: React.FC<Props> = ({ dispatch, playSfx }) => (
  <Screen>
    <div style={{ fontSize: 22, marginTop: 8 }}>📜</div>
    <SubTitle>あそびかた</SubTitle>
    <Divider />
    <GamePanel style={{ fontSize: 10, lineHeight: 1.9, padding: '10px 12px' }}>
      <p style={{ color: '#f0c040', fontSize: 11, marginBottom: 2 }}>🌍 基本ルール</p>
      <p>3バイオーム踏破→最終ボス。進化選択→自動戦闘。</p>
      <br />
      <p style={{ color: '#f0c040', fontSize: 11, marginBottom: 2 }}>⚡ 三大文明</p>
      <p><span style={{ color: '#f08050' }}>■技術</span> 攻撃特化 氷河有利</p>
      <p><span style={{ color: '#50e090' }}>■生活</span> 回復安定 草原有利</p>
      <p><span style={{ color: '#d060ff' }}>■儀式</span> 自傷高火力 火山有利</p>
      <br />
      <p style={{ color: '#f0c040', fontSize: 11, marginBottom: 2 }}>✦ バイオーム相性</p>
      <p>最も高い文明がバイオームと合致すると<span style={{ color: '#50e090' }}>ATK×1.2〜1.3</span>のボーナス！進化・バイオーム選択画面で確認できます。</p>
      <br />
      <p style={{ color: '#f0c040', fontSize: 11, marginBottom: 2 }}>🔥 覚醒システム</p>
      <p>文明Lv4で<span style={{ color: '#f0c040' }}>小覚醒</span>（各文明固有バフ）</p>
      <p>文明Lv5で<span style={{ color: '#f0c040' }}>大覚醒</span>（最終進化形態）</p>
      <p>全文明Lv3以上で<span style={{ color: '#e0c060' }}>調和・小覚醒</span></p>
      <p>全文明Lv4以上で<span style={{ color: '#e0c060' }}>調和・大覚醒</span></p>
      <br />
      <p style={{ color: '#f0c040', fontSize: 11, marginBottom: 2 }}>✦ アクティブスキル</p>
      <p>文明Lv3以上でスキルが解放されます。</p>
      <p><span style={{ color: '#f08050' }}>🔥炎の爆発</span>（技術Lv3）敵に固定ダメージ</p>
      <p><span style={{ color: '#50e090' }}>🌿自然の癒し</span>（生活Lv3）HP回復+仲間回復</p>
      <p><span style={{ color: '#d060ff' }}>💀血の狂乱</span>（儀式Lv3）ATK×2（HP消費）</p>
      <p><span style={{ color: '#e0c060' }}>🛡️盾の壁</span>（調和Lv4）被ダメ半減</p>
      <p>バトル中に画面下部のボタンで発動。クールダウンあり。</p>
      <br />
      <p style={{ color: '#f0c040', fontSize: 11, marginBottom: 2 }}>⏩ 戦闘速度</p>
      <p>速度ボタン（×1/×2/×4/×8）で自動戦闘のスピードを変更。</p>
      <p>⏸ボタンで一時停止。速度設定はセッション中のラン間で保持されます。</p>
      <br />
      <p style={{ color: '#f0c040', fontSize: 11, marginBottom: 2 }}>⚔ 戦闘のコツ</p>
      <p>降伏すると骨が半減。復活ツリーで死亡時に復活可能。</p>
      <p>仲間は文明Lv2/4/6で加入。盾役はダメージを吸収。</p>
      <p>倒れた仲間はバイオーム踏破時に骨を使って復活可能。</p>
      <p>レア進化「魂呼びの儀」「再誕の祈り」でも蘇生。</p>
      <br />
      <p style={{ color: '#f0c040', fontSize: 11, marginBottom: 2 }}>🦴 骨と文明ツリー</p>
      <p>死亡/クリアで骨獲得。永続強化。<br />難易度クリアで上位ティアが解放！</p>
    </GamePanel>
    <GameButton style={{ marginTop: 4 }} onClick={() => { playSfx('click'); dispatch({ type: 'RETURN_TO_TITLE' }); }}>
      ◀ もどる
    </GameButton>
  </Screen>
);
