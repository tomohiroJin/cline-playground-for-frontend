/**
 * Observer（監視者）として呼び出される関数の型定義です。
 * たとえば新しいニュースを受信するなどの通知を受け取る際に呼ばれます。
 *
 * @param message - Subject(発行者)から送られてくる通知内容
 */
export type ObserverFn = (message: string) => void;

/**
 * Observer（監視者）を管理し、通知を行うSubjectを作成します。
 * (クラスではなく、関数内のクロージャでObserver一覧を管理します)
 */
export function createSubject() {
  // 監視者を格納する配列(クロージャに閉じ込める)
  let observers: ObserverFn[] = [];

  return {
    /**
     * Observer(購読者)を登録します。
     * @param observer - 登録するObserver関数
     */
    attach(observer: ObserverFn) {
      observers = [...observers, observer];
    },

    /**
     * 登録済みObserver(購読者)を解除します。
     * @param observer - 解除したいObserver関数
     */
    detach(observer: ObserverFn) {
      observers = observers.filter((o) => o !== observer);
    },

    /**
     * 登録しているObserver(購読者)全員に新しい情報を通知します。
     * @param message - 通知するメッセージ(新しいニュースなど)
     */
    notify(message: string) {
      observers.forEach((observerFn) => observerFn(message));
    },
  };
}

/**
 * 購読者(Observer)を生成します。
 *
 * @param name - 購読者の名前
 * @returns 購読者(ObserverFn) と 受け取ったメッセージを参照する関数を持つオブジェクト
 */
export function createObserver(name: string) {
  // この購読者が受け取ったメッセージを蓄積しておく配列
  let receivedMessages: string[] = [];

  // Observerとして呼ばれる関数
  const observerFn: (message: string) => void = (message) => {
    receivedMessages = [...receivedMessages, message];
    console.log(`[${name}] メッセージを受信: ${message}`);
  };

  return {
    observerFn,
    /**
     * この購読者が受け取ったすべてのメッセージを取得します。
     * @returns 受信したメッセージの配列
     */
    getReceivedMessages(): string[] {
      return receivedMessages;
    },
  };
}

/**
 * ニュースを発行する処理をまとめた関数です。
 * ここではSubjectの配列やmapを作るなどの発行管理を行っても良いでしょう。
 */
export function createNewsPublisher() {
  // ここでは単純に1つのSubjectを作り、ニュースを発行するだけの例
  const subject = createSubject();

  return {
    ...subject,
    /**
     * 新しいニュースを発行し、購読者に通知します。
     * @param news - 発行するニュースの内容
     */
    publishNews(news: string) {
      // Observer全員に通知
      subject.notify(news);
    },
  };
}
