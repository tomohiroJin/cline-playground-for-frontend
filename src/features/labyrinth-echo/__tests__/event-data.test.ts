/**
 * 迷宮の残響 - イベントデータ整合性テスト
 *
 * 全163件のイベント定義について、必須フィールドの存在、
 * 条件文字列のフォーマット、チェイン参照の整合性などを検証する。
 *
 * テスト内のループを排除し、it.each / 配列メソッドによるデータ駆動テストに変換。
 */
import { EV } from '../events/event-data';
import { EVENT_TYPE } from '../domain/constants/event-type-defs';
import type { GameEvent } from '../events/event-utils';

/** 型安全にイベントデータを扱うためキャスト */
const events = EV as GameEvent[];

/** 有効な条件文字列のパターン */
const VALID_CONDITION_PATTERN =
  /^(default|hp[><]\d+|mn[><]\d+|inf[><]\d+|status:\S+)$/;

/** 有効なフラグ文字列のパターン */
const VALID_FLAG_PATTERN = /^(add:\S+|remove:\S+|chain:\S+|shortcut|escape)$/;

/** 全イベントID */
const eventIds = events.map(e => e.id);

/** 有効なイベントタイプ */
const validTypes = Object.keys(EVENT_TYPE);

// ── 事前集計（テスト本体でのループを排除するためのデータ準備） ──

/** 全アウトカムの条件文字列を収集 */
const allConditions = events.flatMap(e =>
  e.ch.flatMap(ch => ch.o.map(o => ({ eventId: e.id, choiceText: ch.t, condition: o.c }))),
);

/** フラグ付きアウトカムを収集 */
const allFlags = events.flatMap(e =>
  e.ch.flatMap(ch => ch.o
    .filter(o => o.fl !== undefined)
    .map(o => ({ eventId: e.id, flag: o.fl! }))),
);

/** chain: フラグの参照先を収集 */
const chainReferences = allFlags
  .filter(f => f.flag.startsWith('chain:'))
  .map(f => ({ ...f, targetId: f.flag.slice(6) }));

/** chainOnlyイベントのID */
const chainOnlyIds = events.filter(e => e.chainOnly).map(e => e.id);

/** chain: から参照されているID */
const referencedChainIds = new Set(chainReferences.map(r => r.targetId));

/** 複数アウトカムでdefaultなし */
const missingDefaults = events.flatMap(e =>
  e.ch
    .filter(ch => ch.o.length > 1 && !ch.o.some(o => o.c === 'default'))
    .map(ch => `${e.id}: "${ch.t}"`),
);

describe('イベントデータ整合性', () => {
  describe('正常系 - 必須フィールド', () => {
    it.each(events.map(e => [e.id, e] as const))(
      'イベント "%s" にid, fl, tp, sit, chが存在する',
      (_id, e) => {
        expect(e.id).toBeDefined();
        expect(typeof e.id).toBe('string');
        expect(e.id.length).toBeGreaterThan(0);
        expect(e.fl).toBeDefined();
        expect(Array.isArray(e.fl)).toBe(true);
        expect(e.fl.length).toBeGreaterThan(0);
        expect(e.tp).toBeDefined();
        expect(typeof e.tp).toBe('string');
        expect(e.sit).toBeDefined();
        expect(typeof e.sit).toBe('string');
        expect(e.ch).toBeDefined();
        expect(Array.isArray(e.ch)).toBe(true);
        expect(e.ch.length).toBeGreaterThan(0);
      },
    );

    it('全選択肢にテキスト(t)とアウトカム(o)が存在する', () => {
      const invalid = events.flatMap(e =>
        e.ch
          .filter(ch => !ch.t || !Array.isArray(ch.o) || ch.o.length === 0)
          .map(ch => `${e.id}: choice "${ch.t}"`),
      );
      expect(invalid).toEqual([]);
    });

    it('全アウトカムに条件(c)と結果テキスト(r)が存在する', () => {
      const invalid = events.flatMap(e =>
        e.ch.flatMap(ch =>
          ch.o
            .filter(o => !o.c || !o.r)
            .map(o => `${e.id}: outcome c="${o.c}" r="${o.r}"`),
        ),
      );
      expect(invalid).toEqual([]);
    });
  });

  describe('正常系 - フォーマット検証', () => {
    it('全条件文字列が有効フォーマットである', () => {
      const invalid = allConditions.filter(({ condition }) => !VALID_CONDITION_PATTERN.test(condition));
      expect(invalid).toEqual([]);
    });

    it('全フラグ文字列が有効フォーマットである', () => {
      const invalid = allFlags.filter(({ flag }) => !VALID_FLAG_PATTERN.test(flag));
      expect(invalid).toEqual([]);
    });

    it('全フロア指定が1-5の範囲内である', () => {
      const outOfRange = events.flatMap(e =>
        e.fl.filter(f => f < 1 || f > 5).map(f => `${e.id}: floor ${f}`),
      );
      expect(outOfRange).toEqual([]);
    });

    it('全イベントタイプがEVENT_TYPEに存在する', () => {
      const unknownTypes = events.filter(e => !validTypes.includes(e.tp)).map(e => `${e.id}: tp="${e.tp}"`);
      expect(unknownTypes).toEqual([]);
    });
  });

  describe('正常系 - 一意性と参照整合性', () => {
    it('イベントIDが一意である', () => {
      expect(new Set(eventIds).size).toBe(eventIds.length);
    });

    it('chain:Xフラグの参照先イベントが全て存在する', () => {
      const eventIdSet = new Set(eventIds);
      const missing = chainReferences.filter(r => !eventIdSet.has(r.targetId));
      expect(missing).toEqual([]);
    });

    it('chain:Xの参照先がchainOnlyイベントである', () => {
      const nonChainOnly = chainReferences.filter(r => {
        const target = events.find(e => e.id === r.targetId);
        return target && !target.chainOnly;
      });
      expect(nonChainOnly).toEqual([]);
    });

    it('chainOnlyイベントはchain:Xから参照されている', () => {
      const unreferenced = chainOnlyIds.filter(id => !referencedChainIds.has(id));
      expect(unreferenced).toEqual([]);
    });
  });

  describe('正常系 - フォールバック保証', () => {
    it('複数アウトカムを持つ選択肢にはdefault条件が含まれる', () => {
      expect(missingDefaults).toEqual([]);
    });
  });
});
