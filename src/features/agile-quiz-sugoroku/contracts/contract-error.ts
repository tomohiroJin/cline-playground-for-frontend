/**
 * 契約違反エラー
 *
 * DbC（Design by Contract）の不変条件・事前条件・事後条件が
 * 満たされなかった場合に投げるカスタムエラー。
 */
export class ContractViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContractViolationError';
  }
}

/**
 * 契約アサーション
 *
 * 条件が false の場合に ContractViolationError を投げる。
 */
export function assertContract(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new ContractViolationError(message);
  }
}
