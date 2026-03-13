// 音声 API インターフェース
// useAudio の戻り値型を明示化

/** 音符データ: [周波数, 持続時間(秒), 波形, 音量, 遅延(ms)] */
export type Note = [number, number, OscillatorType?, number?, number?];

export interface AudioApi {
  /** 移動音 */
  mv(): void;
  /** 選択音 */
  sel(): void;
  /** ティック音 */
  tick(): void;
  /** 落下音（行数に応じた音程変化） */
  fall(row: number): void;
  /** ライト音 */
  wr(): void;
  /** 死亡音 */
  die(): void;
  /** 回避音（倍率に応じた音程変化） */
  ok(mult: number): void;
  /** コンボ音（コンボ数に応じた音程変化） */
  combo(n: number): void;
  /** ニアミス音 */
  near(): void;
  /** ステージクリア音 */
  clr(): void;
  /** SS 音 */
  ss(): void;
  /** アンロック音 */
  ul(): void;
  /** エラー音 */
  er(): void;
  /** シールド音 */
  sh(): void;
  /** パーク選択音 */
  pk(): void;
  /** モディファイア音 */
  mod(): void;
  /** シーケンス再生 */
  seq(notes: readonly Note[]): void;
}
