/**
 * ゲームからプラットフォームに戻った際に全音声を停止するユーティリティ
 *
 * AudioContext コンストラクタをプロキシして全インスタンスを追跡し、
 * stopAllAudio() で一括停止する。Tone.js の Transport にも対応。
 */

/** 追跡中の全 AudioContext インスタンス */
const trackedContexts = new Set<AudioContext>();

/** オリジナルの AudioContext コンストラクタ */
let OriginalAudioContext: typeof AudioContext | undefined;

/** トラッカーがインストール済みかどうか */
let isInstalled = false;

/**
 * AudioContext コンストラクタをラップし、生成されたインスタンスを追跡する
 * アプリ起動時に1度だけ呼び出す
 */
export const installAudioContextTracker = (): void => {
  if (isInstalled) return;
  isInstalled = true;

  OriginalAudioContext = window.AudioContext;

  // AudioContext コンストラクタをプロキシで上書き
  window.AudioContext = new Proxy(OriginalAudioContext, {
    construct(target, args) {
      const instance = new target(...(args as ConstructorParameters<typeof AudioContext>));
      trackedContexts.add(instance);
      return instance;
    },
  });
};

/**
 * 追跡中の全 AudioContext を suspend し、Tone.js の Transport も停止する
 * ゲームページからの離脱時に呼び出す
 */
export const stopAllAudio = async (): Promise<void> => {
  // 全 AudioContext を suspend → close
  const promises: Promise<void>[] = [];
  for (const ctx of trackedContexts) {
    if (ctx.state !== 'closed') {
      promises.push(
        ctx.suspend().then(() => ctx.close()).catch(() => {
          // 既に閉じている場合などのエラーを無視
        })
      );
    }
  }
  trackedContexts.clear();

  // Tone.js の Transport を停止（Tone.js が読み込まれている場合のみ）
  try {
    const Tone = await import('tone').catch(() => undefined);
    if (Tone) {
      Tone.getTransport().stop();
      Tone.getTransport().cancel();
    }
  } catch {
    // Tone.js が利用できない場合は無視
  }

  await Promise.all(promises);
};
