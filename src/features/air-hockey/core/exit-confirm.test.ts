/**
 * S6-8a: ゲーム終了確認ダイアログのモード別メッセージ
 */
import { getExitConfirmMessage } from './exit-confirm';

describe('getExitConfirmMessage', () => {
  it('2v2-local モードでは「チーム設定がリセットされます」を返す', () => {
    expect(getExitConfirmMessage('2v2-local')).toBe('チーム設定がリセットされます');
  });

  it('story モードでは「進行中のステージが中断されます」を返す', () => {
    expect(getExitConfirmMessage('story')).toBe('進行中のステージが中断されます');
  });

  it('free モードでは「対戦が中断されます」を返す', () => {
    expect(getExitConfirmMessage('free')).toBe('対戦が中断されます');
  });

  it('2p-local モードでは「対戦が中断されます」を返す', () => {
    expect(getExitConfirmMessage('2p-local')).toBe('対戦が中断されます');
  });
});
