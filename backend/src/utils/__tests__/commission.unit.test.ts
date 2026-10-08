import { splitCommission } from '../commission';

describe('Commission Unit Tests (Task B-5)', () => {
  it('splitCommission(4900, 10) -> { commissionAmount: 490, sellerAmount: 4410 }', () => {
    const result = splitCommission(4900, 10);
    expect(result).toEqual({
      commissionAmount: 490,
      sellerAmount: 4410,
    });
  });

  it('splitCommission(1, 10) -> { commissionAmount: 0, sellerAmount: 1 } (floor remainder to seller)', () => {
    const result = splitCommission(1, 10);
    expect(result).toEqual({
      commissionAmount: 0,
      sellerAmount: 1,
    });
  });

  it('splitCommission(100, 100) -> { commissionAmount: 100, sellerAmount: 0 }', () => {
    const result = splitCommission(100, 100);
    expect(result).toEqual({
      commissionAmount: 100,
      sellerAmount: 0,
    });
  });

  it('for all inputs: commissionAmount + sellerAmount === price', () => {
    const testCases = [
      { price: 4900, percent: 10 },
      { price: 1, percent: 10 },
      { price: 100, percent: 100 },
      { price: 0, percent: 15 },
      { price: 999, percent: 13 },
      { price: 123456, percent: 7 },
      { price: 55, percent: 50 },
    ];

    for (const { price, percent } of testCases) {
      const { commissionAmount, sellerAmount } = splitCommission(
        price,
        percent,
      );
      expect(commissionAmount + sellerAmount).toBe(price);
    }
  });
});
