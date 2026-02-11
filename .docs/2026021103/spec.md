# KEYS & ARMS 移植仕様

## 受け入れ基準

1. title → cave → grass → boss → ending 進行可能
2. HP 減少と game over 遷移が元実装と一致
3. スコア加算が元実装と一致
4. ending1 / trueEnd 分岐条件が元実装と一致
5. キーボード・タッチ入力に固着なし
6. BGM/SFX がユーザー操作後に有効化
7. ハイスコアが localStorage キー `kaG` で保存・復元
8. App ルートと GameListPage から起動可能
9. `npm test` と `npm run build` が成功
10. 実装コードに `iframe` 参照が残っていない

## 制約

- 元HTMLに存在しないゲームルールの追加禁止
- 進行条件の簡略化・変更禁止
- スプライト/演出の省略や置換禁止
- localStorage キーの変更禁止（`kaG` のまま維持）
- ゲームバランスの調整禁止
- UIデザインの変更禁止
- 不要な TypeScript 型の厳密化禁止

## 技術仕様

- engine.ts: `createEngine(canvas: HTMLCanvasElement): Engine`
- Engine インターフェース: `start()`, `stop()`, `resize()`, `handleKeyDown(key)`, `handleKeyUp(key)`
- React ラッパー: useRef + 空依存 useEffect でマウント時のみ engine 生成
- フォント: 'Press Start 2P' — public/index.html でプリロード
