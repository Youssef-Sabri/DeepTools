export interface CommissionSplit {
  commissionAmount: number;
  sellerAmount: number;
}

/**
 * Deterministic integer split.
 * Uses Math.floor — rounding remainder always goes to seller.
 * Invariant: commissionAmount + sellerAmount === price
 */
export function splitCommission(
  price: number,
  commissionPercent: number,
): CommissionSplit {
  const commissionAmount = Math.floor((price * commissionPercent) / 100);
  const sellerAmount = price - commissionAmount;
  return { commissionAmount, sellerAmount };
}
