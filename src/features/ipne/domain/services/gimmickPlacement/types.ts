import { Position } from '../../../types';

/** 連続した壁セグメント */
export interface WallSegment {
  tiles: Position[];
  direction: 'horizontal' | 'vertical';
}

/** 貫通ショートカット候補 */
export interface PenetrationCandidate {
  wallTiles: Position[];
  nearFloor: Position;
  farFloor: Position;
  thickness: number;
  saving: number;
  direction: 'horizontal' | 'vertical';
}

/** 壁候補とそのスコア */
export interface ScoredWallCandidate {
  position: Position;
  score: number;
  type: 'shortcutBlock' | 'trickWall' | 'secretPassage' | 'corridorBlock';
}

/** 複数壁候補（厚い壁対応） */
export interface MultiWallCandidate extends ScoredWallCandidate {
  wallTiles?: Position[];
}
