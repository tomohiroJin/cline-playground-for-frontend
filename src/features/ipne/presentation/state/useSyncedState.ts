import { Dispatch, MutableRefObject, SetStateAction, useCallback, useRef, useState } from 'react';

type SyncedSetter<T> = Dispatch<SetStateAction<T>>;

/**
 * state と ref を同じ更新経路で同期するための状態コンテナ
 */
export function useSyncedState<T>(
  initialValue: T
): [T, SyncedSetter<T>, MutableRefObject<T>] {
  const [state, setState] = useState<T>(initialValue);
  const stateRef = useRef<T>(state);

  const setSyncedState = useCallback<SyncedSetter<T>>((action: SetStateAction<T>) => {
    const nextState =
      typeof action === 'function'
        ? (action as (prevState: T) => T)(stateRef.current)
        : action;

    stateRef.current = nextState;
    setState(nextState);
  }, []);

  return [state, setSyncedState, stateRef];
}
