/**
 * AudioContext 追跡・全音声停止ユーティリティ
 *
 * 各ゲームが独自に生成する AudioContext をプロキシで追跡し、
 * ゲームページ離脱時に一括停止する仕組みを提供する。
 */

/** 追跡中の AudioContext インスタンスを保持する Set */
const trackedContexts = new Set<AudioContext>();

/** 多重インストール防止フラグ */
let isInstalled = false;

/**
 * AudioContext コンストラクタを Proxy で上書きし、生成されたインスタンスを追跡する。
 * アプリ起動時に1度だけ呼び出すこと。
 */
export const installAudioContextTracker = (): void => {
  if (isInstalled) return;

  const OriginalAudioContext = window.AudioContext;
  window.AudioContext = new Proxy(OriginalAudioContext, {
    construct(target, args) {
      const instance = new target(
        ...(args as ConstructorParameters<typeof AudioContext>)
      );
      trackedContexts.add(instance);
      return instance;
    },
  });

  isInstalled = true;
};

/**
 * 追跡中の全 AudioContext を suspend し、Tone.js の Transport も停止する。
 *
 * close() ではなく suspend() のみ行う理由:
 * SPAではモジュールキャッシュが残るため、ゲーム側が AudioContext を
 * シングルトンとして保持している場合、close() すると再訪問時に
 * 復帰できなくなる。suspend() なら resume() で再開可能。
 *
 * エラーは無視する（既に停止している場合等）。
 */
export const stopAllAudio = async (): Promise<void> => {
  // 追跡中の AudioContext を一時停止
  const suspendPromises = Array.from(trackedContexts).map(async (ctx) => {
    try {
      if (ctx.state === 'running') {
        await ctx.suspend();
      }
    } catch {
      // 既に停止している等のエラーは無視
    }
  });

  await Promise.all(suspendPromises);

  // Tone.js の Transport を停止（利用可能な場合のみ）
  try {
    const Tone = await import('tone');
    const transport = Tone.getTransport();
    transport.stop();
    transport.cancel();
  } catch {
    // Tone.js が読み込めない場合は無視
  }
};
