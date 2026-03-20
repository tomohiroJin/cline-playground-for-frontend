/**
 * 共通モック設定のテスト
 * - 各セットアップ関数が正しいモックを返す
 * - モックが期待するインターフェースを満たす
 */
import { setupCanvasMock, setupAudioMock, setupStorageMock } from './mock-setup';
import type { AudioPort } from '../../domain/contracts/audio';
import type { GameStoragePort } from '../../domain/contracts/storage';

describe('setupCanvasMock', () => {
  it('Canvas 2D コンテキストのモックを返す', () => {
    const ctx = setupCanvasMock();

    expect(ctx.fillRect).toBeDefined();
    expect(ctx.strokeRect).toBeDefined();
    expect(ctx.beginPath).toBeDefined();
    expect(ctx.arc).toBeDefined();
    expect(ctx.fill).toBeDefined();
    expect(ctx.stroke).toBeDefined();
    expect(ctx.save).toBeDefined();
    expect(ctx.restore).toBeDefined();
    expect(ctx.clearRect).toBeDefined();
    expect(ctx.fillText).toBeDefined();
    expect(ctx.measureText).toBeDefined();
    expect(ctx.createLinearGradient).toBeDefined();
    expect(ctx.createRadialGradient).toBeDefined();
  });

  it('measureText がオブジェクトを返す', () => {
    const ctx = setupCanvasMock();
    const metrics = ctx.measureText('test');

    expect(metrics).toHaveProperty('width');
  });

  it('グラデーション生成が addColorStop を持つオブジェクトを返す', () => {
    const ctx = setupCanvasMock();
    const gradient = ctx.createLinearGradient(0, 0, 100, 100);

    expect(gradient.addColorStop).toBeDefined();
  });
});

describe('setupAudioMock', () => {
  it('NullAudioAdapter を返す', () => {
    const audio = setupAudioMock();
    // AudioPort インターフェースを満たす
    const port: AudioPort = audio;
    expect(port).toBeDefined();
  });

  it('呼び出し記録機能がある', () => {
    const audio = setupAudioMock();
    audio.playHit(5);

    expect(audio.getCallCount('playHit')).toBe(1);
  });
});

describe('setupStorageMock', () => {
  it('InMemoryStorageAdapter を返す', () => {
    const storage = setupStorageMock();
    // GameStoragePort インターフェースを満たす
    const port: GameStoragePort = storage;
    expect(port).toBeDefined();
  });

  it('デフォルト値で初期化されている', () => {
    const storage = setupStorageMock();

    expect(storage.loadAchievements()).toEqual([]);
    expect(storage.loadStoryProgress().clearedStages).toEqual([]);
  });
});
