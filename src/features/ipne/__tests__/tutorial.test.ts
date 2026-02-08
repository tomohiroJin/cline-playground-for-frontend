/**
 * チュートリアルシステムのテスト
 */
import {
  TUTORIAL_STEPS,
  initTutorial,
  isTutorialCompleted,
  saveTutorialCompleted,
  advanceTutorialStep,
  skipTutorial,
  toggleTutorialVisibility,
  getCurrentTutorialStep,
  getTutorialText,
  shouldAdvanceTutorial,
  getTutorialStepIndex,
  getTutorialProgress,
  setTutorialStorageProvider,
  resetTutorialStorageProvider,
} from '../tutorial';
import { TutorialStepType, TutorialStepTypeValue } from '../types';
import { STORAGE_KEYS } from '../record';
import { StorageProvider } from '../infrastructure/storage/StorageProvider';

describe('tutorial', () => {
  // テスト前にローカルストレージをクリア
  beforeEach(() => {
    localStorage.clear();
    resetTutorialStorageProvider();
  });

  describe('TUTORIAL_STEPS', () => {
    test('ステップが定義されていること', () => {
      expect(TUTORIAL_STEPS.length).toBeGreaterThan(0);
    });

    test('各ステップに必要なプロパティがあること', () => {
      for (const step of TUTORIAL_STEPS) {
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.text).toBeDefined();
      }
    });

    test('移動、攻撃、マップ、アイテム、罠、ゴールのステップがあること', () => {
      const stepIds = TUTORIAL_STEPS.map(step => step.id);

      expect(stepIds).toContain(TutorialStepType.MOVEMENT);
      expect(stepIds).toContain(TutorialStepType.ATTACK);
      expect(stepIds).toContain(TutorialStepType.MAP);
      expect(stepIds).toContain(TutorialStepType.ITEM);
      expect(stepIds).toContain(TutorialStepType.TRAP);
      expect(stepIds).toContain(TutorialStepType.GOAL);
    });
  });

  describe('initTutorial', () => {
    test('初回起動時は未完了状態で可視化されること', () => {
      const state = initTutorial();

      expect(state.isCompleted).toBe(false);
      expect(state.currentStep).toBe(0);
      expect(state.isVisible).toBe(true);
    });

    test('完了後は非表示で完了状態になること', () => {
      saveTutorialCompleted();

      const state = initTutorial();

      expect(state.isCompleted).toBe(true);
      expect(state.isVisible).toBe(false);
    });
  });

  describe('isTutorialCompleted', () => {
    test('未完了の場合falseを返すこと', () => {
      expect(isTutorialCompleted()).toBe(false);
    });

    test('完了後はtrueを返すこと', () => {
      saveTutorialCompleted();
      expect(isTutorialCompleted()).toBe(true);
    });
  });

  describe('saveTutorialCompleted', () => {
    test('完了状態を保存すること', () => {
      saveTutorialCompleted();

      expect(localStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED)).toBe('true');
    });
  });

  describe('advanceTutorialStep', () => {
    test('次のステップに進むこと', () => {
      const state = initTutorial();
      const advanced = advanceTutorialStep(state);

      expect(advanced.currentStep).toBe(1);
      expect(advanced.isCompleted).toBe(false);
    });

    test('最後のステップ後は完了になること', () => {
      let state = initTutorial();

      // 全ステップを進める
      for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
        state = advanceTutorialStep(state);
      }

      expect(state.isCompleted).toBe(true);
      expect(state.isVisible).toBe(false);
      expect(isTutorialCompleted()).toBe(true);
    });
  });

  describe('skipTutorial', () => {
    test('チュートリアルをスキップすること', () => {
      const state = initTutorial();
      const skipped = skipTutorial(state);

      expect(skipped.isCompleted).toBe(true);
      expect(skipped.isVisible).toBe(false);
      expect(isTutorialCompleted()).toBe(true);
    });
  });

  describe('toggleTutorialVisibility', () => {
    test('表示/非表示を切り替えること', () => {
      const state = initTutorial();
      expect(state.isVisible).toBe(true);

      const hidden = toggleTutorialVisibility(state);
      expect(hidden.isVisible).toBe(false);

      const visible = toggleTutorialVisibility(hidden);
      expect(visible.isVisible).toBe(true);
    });
  });

  describe('getCurrentTutorialStep', () => {
    test('現在のステップを取得すること', () => {
      const state = initTutorial();
      const step = getCurrentTutorialStep(state);

      expect(step).toBeDefined();
      expect(step?.id).toBe(TUTORIAL_STEPS[0].id);
    });

    test('完了後はundefinedを返すこと', () => {
      const state = skipTutorial(initTutorial());
      const step = getCurrentTutorialStep(state);

      expect(step).toBeUndefined();
    });
  });

  describe('getTutorialText', () => {
    test('タイトルとテキストを取得すること', () => {
      const state = initTutorial();
      const text = getTutorialText(state);

      expect(text).toBeDefined();
      expect(text?.title).toBe(TUTORIAL_STEPS[0].title);
      expect(text?.text).toBe(TUTORIAL_STEPS[0].text);
    });

    test('完了後はundefinedを返すこと', () => {
      const state = skipTutorial(initTutorial());
      const text = getTutorialText(state);

      expect(text).toBeUndefined();
    });
  });

  describe('shouldAdvanceTutorial', () => {
    test('条件に一致する場合はtrueを返すこと', () => {
      const state = initTutorial();
      const step = getCurrentTutorialStep(state);

      expect(shouldAdvanceTutorial(state, step?.condition || '')).toBe(true);
    });

    test('条件に一致しない場合はfalseを返すこと', () => {
      const state = initTutorial();

      expect(shouldAdvanceTutorial(state, 'invalid_action')).toBe(false);
    });
  });

  describe('getTutorialStepIndex', () => {
    test('ステップIDからインデックスを取得すること', () => {
      expect(getTutorialStepIndex(TutorialStepType.MOVEMENT)).toBe(0);
    });

    test('存在しないIDの場合は-1を返すこと', () => {
      expect(getTutorialStepIndex('invalid' as unknown as TutorialStepTypeValue)).toBe(-1);
    });
  });

  describe('getTutorialProgress', () => {
    test('初期状態では0を返すこと', () => {
      const state = initTutorial();
      expect(getTutorialProgress(state)).toBe(0);
    });

    test('進行に応じた値を返すこと', () => {
      let state = initTutorial();
      state = advanceTutorialStep(state);

      const progress = getTutorialProgress(state);
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThan(1);
    });

    test('完了後は1を返すこと', () => {
      const state = skipTutorial(initTutorial());
      expect(getTutorialProgress(state)).toBe(1);
    });
  });

  describe('storage provider injection', () => {
    test('注入したStorageProviderに完了状態を保存すること', () => {
      const memoryStore = new Map<string, string>();
      const provider: StorageProvider = {
        getItem: (key: string) => memoryStore.get(key) ?? null,
        setItem: (key: string, value: string) => {
          memoryStore.set(key, value);
        },
        removeItem: (key: string) => {
          memoryStore.delete(key);
        },
      };
      setTutorialStorageProvider(provider);

      saveTutorialCompleted();

      expect(memoryStore.get(STORAGE_KEYS.TUTORIAL_COMPLETED)).toBe('true');
      expect(localStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED)).toBeNull();
    });
  });
});
