/**
 * 迷宮の残響 - 残響圧エスカレーション定数
 *
 * 残響圧（Echo Pressure）1レベルあたりの難易度増分を定義する。
 */
import { ECHO_DEPTH_MAX } from '../services/echo-service';

/** 選択可能な最大残響圧（echoDepth の上限に一致） */
export const PRESSURE_MAX = ECHO_DEPTH_MAX;

/** 圧1レベルあたりの dmgMult 増分 */
export const DMG_MULT_PER_LEVEL = 0.05;
