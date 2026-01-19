import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { usePuzzle } from './usePuzzle';
import { Provider } from 'jotai';
import * as domainPuzzle from '../domain/puzzle';
import { PuzzleDomainState, toPieceId, toCoordinate } from '../domain/types';

// Mock domain functions
jest.mock('../domain/puzzle', () => ({
  generateBoard: jest.fn(() => ({
    pieces: [],
    division: 2,
    emptyPosition: { row: 0, col: 0 }, // Dummy
    completed: false,
  })),
  shuffleBoard: jest.fn(),
  movePiece: jest.fn(),
  solveBoard: jest.fn(),
}));

const mockPiece = (id: number, r: number, c: number, isEmpty: boolean) => ({
  id: toPieceId(id),
  correctPosition: { row: toCoordinate(r), col: toCoordinate(c) },
  currentPosition: { row: toCoordinate(r), col: toCoordinate(c) },
  isEmpty,
});

const mockState: PuzzleDomainState = {
  pieces: [
    mockPiece(1, 0, 0, false),
    mockPiece(2, 0, 1, false),
    mockPiece(3, 1, 0, false),
    mockPiece(0, 1, 1, true), // Empty at 1,1
  ],
  division: 2,
  emptyPosition: { row: toCoordinate(1), col: toCoordinate(1) },
  completed: false,
};

// Wrapper for Jotai Provider
const renderHookWithJotai = <Result, Props>(
  callback: (props: Props) => Result,
  initialProps?: Props
) => {
  return renderHook(callback, {
    wrapper: ({ children }: { children: React.ReactNode }) => <Provider>{children}</Provider>,
    initialProps,
  });
};

describe('usePuzzle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (domainPuzzle.generateBoard as jest.Mock).mockReturnValue(mockState);
    (domainPuzzle.shuffleBoard as jest.Mock).mockReturnValue(mockState);
  });

  it('initializePuzzle calls generateBoard and shuffleBoard', () => {
    const { result } = renderHookWithJotai(() => usePuzzle());

    act(() => {
      result.current.setImageUrl('test.jpg');
    });

    act(() => {
      result.current.initializePuzzle();
    });

    expect(domainPuzzle.generateBoard).toHaveBeenCalled();
    expect(domainPuzzle.shuffleBoard).toHaveBeenCalled();
    expect(result.current.pieces).toEqual(mockState.pieces);
  });

  it('movePiece calls domain movePiece', () => {
    const { result } = renderHookWithJotai(() => usePuzzle());

    // Setup initial state
    act(() => {
      result.current.setImageUrl('test.jpg');
      result.current.initializePuzzle();
    });

    const newState = { ...mockState, completed: false }; // New object reference
    (domainPuzzle.movePiece as jest.Mock).mockReturnValue({ ok: true, value: newState });

    act(() => {
      result.current.movePiece(1);
    });

    expect(domainPuzzle.movePiece).toHaveBeenCalled();
  });

  it('solvePuzzle calls solveBoard', () => {
    const { result } = renderHookWithJotai(() => usePuzzle());

    // Setup initial state
    act(() => {
      result.current.setImageUrl('test.jpg');
      result.current.initializePuzzle();
    });

    const solvedState = { ...mockState, completed: true };
    (domainPuzzle.solveBoard as jest.Mock).mockReturnValue(solvedState);

    act(() => {
      result.current.solvePuzzle();
    });

    expect(domainPuzzle.solveBoard).toHaveBeenCalled();
    expect(result.current.completed).toBe(true);
  });
});
