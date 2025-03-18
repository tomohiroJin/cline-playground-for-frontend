import { createNewsPublisher, createObserver } from "./fp";

/**
 * Observerパターン(関数型)のテストです。
 */
describe("関数型で実装したObserverパターンのテスト", () => {
  it("購読者を登録後、ニュースを発行したら購読者がメッセージを受け取ること", () => {
    // 1. 発行者(Subject)的なオブジェクトを作る
    const publisher = createNewsPublisher();

    // 2. 購読者(Observer)を作る
    const subscriberA = createObserver("Aさん");
    const subscriberB = createObserver("Bさん");

    // 3. 購読者を登録 (attach)
    publisher.attach(subscriberA.observerFn);
    publisher.attach(subscriberB.observerFn);

    // 4. ニュースを発行
    publisher.publishNews("ニュース1");

    // 5. 購読者がメッセージを受信しているか検証
    expect(subscriberA.getReceivedMessages()).toEqual(["ニュース1"]);
    expect(subscriberB.getReceivedMessages()).toEqual(["ニュース1"]);
  });

  it("購読者を解除したあとに発行されるニュースは受信しないこと", () => {
    const publisher = createNewsPublisher();

    const subscriberA = createObserver("Aさん");
    const subscriberB = createObserver("Bさん");

    publisher.attach(subscriberA.observerFn);
    publisher.attach(subscriberB.observerFn);

    // 最初のニュースを発行
    publisher.publishNews("ニュース1");

    // Bさんを購読解除
    publisher.detach(subscriberB.observerFn);

    // 2つ目のニュースを発行
    publisher.publishNews("ニュース2");

    // Aさん → ニュース1, ニュース2 の両方を受信
    expect(subscriberA.getReceivedMessages()).toEqual([
      "ニュース1",
      "ニュース2",
    ]);

    // Bさん → ニュース1 のみ
    // (購読解除後のニュース2は受け取っていない)
    expect(subscriberB.getReceivedMessages()).toEqual(["ニュース1"]);
  });
});
