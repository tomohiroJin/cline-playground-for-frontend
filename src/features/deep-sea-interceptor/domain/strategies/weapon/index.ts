// ============================================================================
// Deep Sea Interceptor - 武器戦略 re-export
// ============================================================================

export type { WeaponStrategy } from './weapon-strategy';
// 既存の武器関数はそのまま利用（weapon.ts から提供）
export { createBulletsForWeapon, createChargedShot } from '../../../weapon';
