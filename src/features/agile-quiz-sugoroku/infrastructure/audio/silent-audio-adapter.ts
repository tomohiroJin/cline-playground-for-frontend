/**
 * 無音オーディオアダプター（テスト用）
 *
 * AudioPort の全メソッドを何もしない実装。
 * テストやサーバーサイドレンダリング時に使用。
 */
import { AudioPort } from './audio-port';

export class SilentAudioAdapter implements AudioPort {
  initialize(): void { /* 無音 */ }
  playBgm(): void { /* 無音 */ }
  stopBgm(): void { /* 無音 */ }
  playSfxCorrect(): void { /* 無音 */ }
  playSfxIncorrect(): void { /* 無音 */ }
  playSfxTick(): void { /* 無音 */ }
  playSfxTickUrgent(_remaining: number): void { /* 無音 */ }
  playSfxCombo(): void { /* 無音 */ }
  playSfxComboBreak(): void { /* 無音 */ }
  playSfxDrumroll(): void { /* 無音 */ }
  playSfxFanfare(): void { /* 無音 */ }
  playSfxAchievement(): void { /* 無音 */ }
  playSfxStart(): void { /* 無音 */ }
  playSfxResult(): void { /* 無音 */ }
}
