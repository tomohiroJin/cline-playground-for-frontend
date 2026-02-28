/**
 * 迷宮の残響 - イベントデータ整合性テスト
 *
 * 全163件のイベント定義について、必須フィールドの存在、
 * 条件文字列のフォーマット、チェイン参照の整合性などを検証する。
 */
import { EV } from '../events/event-data';
import { EVENT_TYPE } from '../definitions';
import type { GameEvent } from '../events/event-utils';

/** 型安全にイベントデータを扱うためキャスト */
const events = EV as GameEvent[];

/** 有効な条件文字列のパターン */
const VALID_CONDITION_PATTERN =
  /^(default|hp[><]\d+|mn[><]\d+|inf[><]\d+|status:\S+)$/;

describe('イベントデータ整合性', () => {
  it('全イベントに必須フィールド(id, fl, tp, sit, ch)が存在する', () => {
    for (const e of events) {
      expect(e.id).toBeDefined();
      expect(typeof e.id).toBe('string');
      expect(e.id.length).toBeGreaterThan(0);

      expect(e.fl).toBeDefined();
      expect(Array.isArray(e.fl)).toBe(true);
      expect(e.fl.length).toBeGreaterThan(0);

      expect(e.tp).toBeDefined();
      expect(typeof e.tp).toBe('string');
      expect(e.tp.length).toBeGreaterThan(0);

      expect(e.sit).toBeDefined();
      expect(typeof e.sit).toBe('string');
      expect(e.sit.length).toBeGreaterThan(0);

      expect(e.ch).toBeDefined();
      expect(Array.isArray(e.ch)).toBe(true);
      expect(e.ch.length).toBeGreaterThan(0);
    }
  });

  it('全選択肢にテキスト(t)とアウトカム(o)が存在する', () => {
    for (const e of events) {
      for (const choice of e.ch) {
        expect(choice.t).toBeDefined();
        expect(typeof choice.t).toBe('string');
        expect(choice.t.length).toBeGreaterThan(0);

        expect(choice.o).toBeDefined();
        expect(Array.isArray(choice.o)).toBe(true);
        expect(choice.o.length).toBeGreaterThan(0);
      }
    }
  });

  it('全アウトカムに条件(c)と結果テキスト(r)が存在する', () => {
    for (const e of events) {
      for (const choice of e.ch) {
        for (const outcome of choice.o) {
          expect(outcome.c).toBeDefined();
          expect(typeof outcome.c).toBe('string');
          expect(outcome.c.length).toBeGreaterThan(0);

          expect(outcome.r).toBeDefined();
          expect(typeof outcome.r).toBe('string');
          expect(outcome.r.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('条件文字列が有効フォーマットである', () => {
    for (const e of events) {
      for (const choice of e.ch) {
        for (const outcome of choice.o) {
          expect(outcome.c).toMatch(VALID_CONDITION_PATTERN);
        }
      }
    }
  });

  it('chain:X フラグの参照先イベントが全て存在する', () => {
    const eventIds = new Set(events.map(e => e.id));

    for (const e of events) {
      for (const choice of e.ch) {
        for (const outcome of choice.o) {
          if (outcome.fl && outcome.fl.startsWith('chain:')) {
            const chainTarget = outcome.fl.slice(6);
            expect(eventIds.has(chainTarget)).toBe(true);
          }
        }
      }
    }
  });

  it('フロア指定が 1-5 の範囲内である', () => {
    for (const e of events) {
      for (const floor of e.fl) {
        expect(floor).toBeGreaterThanOrEqual(1);
        expect(floor).toBeLessThanOrEqual(5);
      }
    }
  });

  it('イベントタイプが EVENT_TYPE に存在する', () => {
    const validTypes = Object.keys(EVENT_TYPE);

    for (const e of events) {
      expect(validTypes).toContain(e.tp);
    }
  });

  it('イベントIDが一意である', () => {
    const ids = events.map(e => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('フラグ文字列が有効フォーマットである', () => {
    const validFlag = /^(add:\S+|remove:\S+|chain:\S+|shortcut|escape)$/;
    const invalid: string[] = [];
    for (const e of events) {
      for (const ch of e.ch) {
        for (const o of ch.o) {
          if (o.fl && !validFlag.test(o.fl)) {
            invalid.push(`${e.id}: flag "${o.fl}"`);
          }
        }
      }
    }
    expect(invalid).toEqual([]);
  });

  it('各選択肢のアウトカムに少なくとも1つ default 条件が含まれる、または単一条件の場合は許容する', () => {
    const missing: string[] = [];
    for (const e of events) {
      for (const ch of e.ch) {
        const hasDefault = ch.o.some(o => o.c === 'default');
        // アウトカムが1つだけで条件付きの場合は意図的な設計として許容
        if (!hasDefault && ch.o.length > 1) {
          missing.push(`${e.id}: "${ch.t}" に default 条件がない`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('chain:X の参照先が chainOnly イベントである', () => {
    const nonChainOnly: string[] = [];
    for (const e of events) {
      for (const ch of e.ch) {
        for (const o of ch.o) {
          if (o.fl?.startsWith('chain:')) {
            const targetId = o.fl.slice(6);
            const target = events.find(ev => ev.id === targetId);
            if (target && !target.chainOnly) {
              nonChainOnly.push(`${e.id} -> ${targetId}`);
            }
          }
        }
      }
    }
    expect(nonChainOnly).toEqual([]);
  });

  it('chainOnly イベントは chain:X から参照されている', () => {
    const referencedIds = new Set<string>();
    for (const e of events) {
      for (const ch of e.ch) {
        for (const o of ch.o) {
          if (o.fl?.startsWith('chain:')) {
            referencedIds.add(o.fl.slice(6));
          }
        }
      }
    }

    const unreferenced: string[] = [];
    for (const e of events) {
      if (e.chainOnly && !referencedIds.has(e.id)) {
        unreferenced.push(e.id);
      }
    }
    expect(unreferenced).toEqual([]);
  });
});
