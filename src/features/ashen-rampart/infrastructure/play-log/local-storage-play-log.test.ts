/**
 * 行動ログ localStorage アダプタのテスト
 *
 * 追記・エクスポート・破損データのフォールバック・書き込み失敗の握り潰しを検証する。
 */
import { LocalStoragePlayLog, PLAY_LOG_STORAGE_KEY } from './local-storage-play-log';
import type { PlayLogEventBody } from '../../application/ports/play-log-port';

const runStarted: PlayLogEventBody = {
  kind: 'run_started',
  runId: 'r1',
  iteration: 1,
  seed: 1,
  deckCards: ['arrow-tower'],
};

describe('LocalStoragePlayLog', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it('record した イベントが exportAll で at 付きで取り出せる', () => {
    const log = new LocalStoragePlayLog();
    log.record(runStarted);
    const exported = log.exportAll();
    expect(exported.version).toBe(4);
    expect(exported.events).toHaveLength(1);
    expect(exported.events[0]).toMatchObject(runStarted);
    expect(typeof exported.events[0].at).toBe('number');
  });

  it('record は localStorage に永続化する（別インスタンスから読める）', () => {
    new LocalStoragePlayLog().record(runStarted);
    const exported = new LocalStoragePlayLog().exportAll();
    expect(exported.events).toHaveLength(1);
  });

  it('複数イベントは記録順に追記される', () => {
    const log = new LocalStoragePlayLog();
    log.record(runStarted);
    log.record({ kind: 'card_drawn', runId: 'r1', cardId: 'arrow-tower', tick: 10 });
    expect(log.exportAll().events.map((e) => e.kind)).toEqual(['run_started', 'card_drawn']);
  });

  it('破損データが保存されている場合は空ログにフォールバックする', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    localStorage.setItem(PLAY_LOG_STORAGE_KEY, 'broken-json');
    expect(new LocalStoragePlayLog().exportAll()).toEqual({ version: 4, events: [] });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('version が数値でない場合は空ログにフォールバックする', () => {
    localStorage.setItem(
      PLAY_LOG_STORAGE_KEY,
      JSON.stringify({ version: '1', events: [runStarted] })
    );
    expect(new LocalStoragePlayLog().exportAll()).toEqual({ version: 4, events: [] });
  });

  it('書き込みに失敗してもエラーを投げない', () => {
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });
    expect(() => new LocalStoragePlayLog().record(runStarted)).not.toThrow();
  });

  it('スキーマは v4 で、キーも v4 になる', () => {
    const log = new LocalStoragePlayLog();
    log.record({ kind: 'run_note', runId: 'r1', text: 'テスト' });
    expect(PLAY_LOG_STORAGE_KEY).toBe('ashen-rampart:play-log-v4');
    expect(log.exportAll().version).toBe(4);
  });

  it('v3 のキーに残っていた旧データは読みに行かず、v4 は空から始まって壊れない', () => {
    // v3 時代のキー名を直書きする（PLAY_LOG_STORAGE_KEY は既に v4 を指すため、
    // 旧データを再現するには文字列で直接書く必要がある）
    localStorage.setItem('ashen-rampart:play-log-v3', JSON.stringify({ version: 3, events: [runStarted] }));
    const log = new LocalStoragePlayLog();
    // v4 キーには何もないため、v3 の内容とは無関係に空ログから始まる
    expect(log.exportAll()).toEqual({ version: 4, events: [] });
    log.record(runStarted);
    expect(log.exportAll().events).toHaveLength(1);
    // v3 のキーは触れられず、そのまま残っている（移行処理は無いため）
    expect(localStorage.getItem('ashen-rampart:play-log-v3')).not.toBeNull();
  });
});
