// @react-three/postprocessing のスタブ。
// 後処理エフェクトは R3F/WebGL 依存で jsdom テスト不可のため、
// ページのインポートツリーが ESM 解決で失敗しないよう no-op に差し替える。
const React = require('react');
const noop = () => null;
module.exports = {
  EffectComposer: ({ children }) => React.createElement(React.Fragment, null, children),
  Bloom: noop,
  Vignette: noop,
};
