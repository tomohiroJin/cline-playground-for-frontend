/**
 * Observer（監視者）を表すインターフェースです。
 * Subject(発行者)からの更新通知を受け取るため、updateメソッドを持ちます。
 */
export interface Observer {
  /**
   * Subjectから新しい情報を受け取るメソッドです。
   * @param message - 通知内容（ニュース記事など）
   */
  update(message: string): void;
}

/**
 * Subject（発行者）を表すインターフェースです。
 * Observer(監視者)の登録・解除、および更新通知を行います。
 */
export interface Subject {
  /**
   * 監視者(Observer)を登録します。
   * @param observer - 登録するObserver
   */
  attach(observer: Observer): void;

  /**
   * 登録済みの監視者(Observer)を解除します。
   * @param observer - 解除するObserver
   */
  detach(observer: Observer): void;

  /**
   * 登録している監視者全員に更新通知を送ります。
   */
  notify(): void;
}

/**
 * ニュースを発行するSubjectの具体的実装クラスです。
 * 登録されたObserverに向けて新しいニュース記事を通知します。
 */
export class NewsPublisher implements Subject {
  private observers: Observer[] = [];
  private latestNews: string = "";

  /**
   * Observerを登録します。
   * @param observer - 登録したいObserver
   */
  public attach(observer: Observer): void {
    this.observers.push(observer);
  }

  /**
   * 登録済みObserverを解除します。
   * @param observer - 解除したいObserver
   */
  public detach(observer: Observer): void {
    this.observers = this.observers.filter((o) => o !== observer);
  }

  /**
   * 登録中のObserver全員へ、最新ニュースを通知します。
   */
  public notify(): void {
    for (const observer of this.observers) {
      observer.update(this.latestNews);
    }
  }

  /**
   * 新しいニュースを発行し、Observerに通知します。
   * @param news - 新しいニュース記事
   */
  public publishNews(news: string): void {
    this.latestNews = news;
    this.notify();
  }
}

/**
 * ニュースを購読するObserverの具体的実装クラスです。
 * 最新のニュースを受け取ると、コンソールや内部変数に保持します。
 */
export class NewsSubscriber implements Observer {
  private name: string;
  private receivedNews: string[] = [];

  /**
   * コンストラクタ
   * @param name - 購読者の名前
   */
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Subjectから通知を受け取るメソッドです。
   * @param message - 新しいニュースの記事内容
   */
  public update(message: string): void {
    this.receivedNews.push(message);
    console.log(`[${this.name}] 新しいニュースを受信: ${message}`);
  }

  /**
   * 受信履歴を取得します。
   * @returns 現在までに受信したニュースの配列
   */
  public getReceivedNews(): string[] {
    return this.receivedNews;
  }

  /**
   * 購読者の名前を取得します。
   * @returns 購読者の名前
   */
  public getName(): string {
    return this.name;
  }
}
