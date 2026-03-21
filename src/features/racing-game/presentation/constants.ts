// プレゼンテーション層定数

export const OPTIONS = Object.freeze({
  speed: [
    { label: '🐢ゆっくり', value: 2.2 },
    { label: '🚗ふつう', value: 3.2 },
    { label: '🚀はやい', value: 4.5 },
  ],
  cpu: [
    { label: '😊よわい', skill: 0.25, miss: 0.12 },
    { label: '🙂ふつう', skill: 0.5, miss: 0.05 },
    { label: '😈つよい', skill: 1.0, miss: 0 },
  ],
  laps: [1, 3, 5],
});
