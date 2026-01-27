// jest-dom の拡張マッチャーを追加
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextEncoder, TextDecoder });

// requestAnimationFrame / cancelAnimationFrame Polyfill
if (typeof window !== 'undefined') {
  if (!window.requestAnimationFrame) {
    Object.defineProperty(window, 'requestAnimationFrame', {
      value: (callback: FrameRequestCallback) => {
        return setTimeout(() => callback(Date.now()), 0);
      },
      writable: true,
    });
  }
  if (!window.cancelAnimationFrame) {
    Object.defineProperty(window, 'cancelAnimationFrame', {
      value: (id: number) => {
        clearTimeout(id);
      },
      writable: true,
    });
  }
}

// HTMLCanvasElement.prototype.getContext のモック
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Array(100 * 100 * 4).fill(0) })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => []),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    strokeRect: jest.fn(),
    fillText: jest.fn(),
    ellipse: jest.fn(),
    roundRect: jest.fn(),
    lineCap: '',
    lineJoin: '',
    lineWidth: 0,
    strokeStyle: '',
    fillStyle: '',
    font: '',
    textAlign: '',
    textBaseline: '',
    globalAlpha: 1,
    shadowColor: '',
    shadowBlur: 0,
    setLineDash: jest.fn(),
  })),
});
