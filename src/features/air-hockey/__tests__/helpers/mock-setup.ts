/**
 * 共通モック設定
 * - Canvas API, Audio API, Storage のモック生成を一元化
 * - 個別テストでの重複設定を排除
 */
import { NullAudioAdapter } from './null-audio';
import { InMemoryStorageAdapter } from './in-memory-storage';

/** Canvas 2D コンテキストのモックを生成する */
export function setupCanvasMock(): CanvasRenderingContext2D {
  const gradientMock = {
    addColorStop: jest.fn(),
  };

  const ctx = {
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    closePath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn().mockReturnValue({ width: 50 }),
    createLinearGradient: jest.fn().mockReturnValue(gradientMock),
    createRadialGradient: jest.fn().mockReturnValue(gradientMock),
    setTransform: jest.fn(),
    resetTransform: jest.fn(),
    translate: jest.fn(),
    rotate: jest.fn(),
    scale: jest.fn(),
    clip: jest.fn(),
    rect: jest.fn(),
    ellipse: jest.fn(),
    // プロパティ
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'center' as CanvasTextAlign,
    textBaseline: 'middle' as CanvasTextBaseline,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    lineCap: 'butt' as CanvasLineCap,
    lineJoin: 'miter' as CanvasLineJoin,
    canvas: { width: 450, height: 900 },
  } as unknown as CanvasRenderingContext2D;

  return ctx;
}

/** NullAudioAdapter を生成する */
export function setupAudioMock(): NullAudioAdapter {
  return new NullAudioAdapter();
}

/** InMemoryStorageAdapter を生成する */
export function setupStorageMock(): InMemoryStorageAdapter {
  return new InMemoryStorageAdapter();
}
