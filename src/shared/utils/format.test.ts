import { formatElapsedTime } from './format';

describe('formatElapsedTime', () => {
  describe('正常系', () => {
    it('0秒を00:00にフォーマットする', () => {
      expect(formatElapsedTime(0)).toBe('00:00');
    });

    it('59秒を00:59にフォーマットする', () => {
      expect(formatElapsedTime(59)).toBe('00:59');
    });

    it('60秒を01:00にフォーマットする', () => {
      expect(formatElapsedTime(60)).toBe('01:00');
    });

    it('90秒を01:30にフォーマットする', () => {
      expect(formatElapsedTime(90)).toBe('01:30');
    });

    it('3661秒を61:01にフォーマットする', () => {
      expect(formatElapsedTime(3661)).toBe('61:01');
    });
  });
});
