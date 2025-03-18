import { NewsPublisher, NewsSubscriber } from "./oo";

/**
 * Observerパターンのオブジェクト指向実装に関するテストです。
 */
describe("ニュース発行者(NewsPublisher)と購読者(NewsSubscriber)のテスト", () => {
  it("購読者を登録後、新しいニュースが発行されたら購読者が受信すること", () => {
    const publisher = new NewsPublisher();
    const subscriberA = new NewsSubscriber("Aさん");
    const subscriberB = new NewsSubscriber("Bさん");

    // 購読者を登録
    publisher.attach(subscriberA);
    publisher.attach(subscriberB);

    // 新しいニュースを発行
    publisher.publishNews("ニュース1");

    // それぞれの購読者がニュースを受信しているかチェック
    expect(subscriberA.getReceivedNews()).toEqual(["ニュース1"]);
    expect(subscriberB.getReceivedNews()).toEqual(["ニュース1"]);
  });

  it("購読解除した購読者にはニュースが届かないこと", () => {
    const publisher = new NewsPublisher();
    const subscriberA = new NewsSubscriber("Aさん");
    const subscriberB = new NewsSubscriber("Bさん");

    publisher.attach(subscriberA);
    publisher.attach(subscriberB);

    // ニュースを1件発行する
    publisher.publishNews("ニュース1");

    // Bさんを購読解除
    publisher.detach(subscriberB);

    // ニュースをもう1件発行する
    publisher.publishNews("ニュース2");

    // Aさんは「ニュース1」「ニュース2」の両方を受信
    expect(subscriberA.getReceivedNews()).toEqual(["ニュース1", "ニュース2"]);
    // Bさんは「ニュース1」は受信しているが、2回目以降は受信しない
    expect(subscriberB.getReceivedNews()).toEqual(["ニュース1"]);
  });
});
