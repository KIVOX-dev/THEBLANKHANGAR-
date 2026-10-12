import { describe, expect, it } from "vitest";
import { computeCouponDiscount, computeTotals } from "./pricing";

describe("computeTotals", () => {
  it("charges shipping below the free-shipping threshold", () => {
    const totals = computeTotals({
      subtotal: 1000,
      shippingCharge: 79,
      freeShippingThreshold: 1499,
      taxRatePercent: 5,
    });

    expect(totals.shipping).toBe(79);
    expect(totals.tax).toBe(50); // 5% of 1000
    expect(totals.total).toBe(1000 + 79 + 50);
  });

  it("waives shipping at or above the free-shipping threshold", () => {
    const totals = computeTotals({
      subtotal: 1499,
      shippingCharge: 79,
      freeShippingThreshold: 1499,
      taxRatePercent: 5,
    });

    expect(totals.shipping).toBe(0);
  });

  it("applies a discount before computing tax and shipping eligibility", () => {
    const totals = computeTotals({
      subtotal: 1600,
      discount: 200,
      shippingCharge: 79,
      freeShippingThreshold: 1499,
      taxRatePercent: 5,
    });

    // Taxable = 1600 - 200 = 1400, below the 1499 threshold → shipping applies.
    expect(totals.discount).toBe(200);
    expect(totals.shipping).toBe(79);
    expect(totals.tax).toBe(70); // 5% of 1400
  });

  it("never lets a discount exceed the subtotal", () => {
    const totals = computeTotals({
      subtotal: 100,
      discount: 500,
      shippingCharge: 79,
      freeShippingThreshold: 1499,
      taxRatePercent: 5,
    });

    expect(totals.discount).toBe(100);
    expect(totals.tax).toBe(0);
  });

  it("never lets a negative discount reduce the total", () => {
    const totals = computeTotals({
      subtotal: 500,
      discount: -50,
      shippingCharge: 79,
      freeShippingThreshold: 1499,
      taxRatePercent: 5,
    });

    expect(totals.discount).toBe(0);
  });

  it("waives shipping once discount brings the order to zero or below", () => {
    const totals = computeTotals({
      subtotal: 100,
      discount: 100,
      shippingCharge: 79,
      freeShippingThreshold: 1499,
      taxRatePercent: 5,
    });

    expect(totals.shipping).toBe(0);
  });
});

describe("computeCouponDiscount", () => {
  it("caps a fixed discount at the subtotal", () => {
    const discount = computeCouponDiscount(
      { discountType: "FIXED", discountValue: 200, maxDiscount: null },
      150,
    );
    expect(discount).toBe(150);
  });

  it("applies a percent discount", () => {
    const discount = computeCouponDiscount(
      { discountType: "PERCENT", discountValue: 10, maxDiscount: null },
      1000,
    );
    expect(discount).toBe(100);
  });

  it("caps a percent discount at maxDiscount", () => {
    const discount = computeCouponDiscount(
      { discountType: "PERCENT", discountValue: 10, maxDiscount: 50 },
      1000,
    );
    expect(discount).toBe(50);
  });
});
