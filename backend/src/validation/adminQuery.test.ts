import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  adminCustomerQuerySchema,
  adminOrderQuerySchema,
  adminProductQuerySchema,
} from "./adminQuery";

describe("adminProductQuerySchema (SEC-P2-02 regression)", () => {
  it("defaults page to 1 when omitted", () => {
    expect(adminProductQuerySchema.parse({}).page).toBe(1);
  });

  it("coerces a numeric page string", () => {
    expect(adminProductQuerySchema.parse({ page: "3" }).page).toBe(3);
  });

  it("rejects a non-numeric page instead of silently becoming NaN", () => {
    expect(() => adminProductQuerySchema.parse({ page: "not-a-number" })).toThrow(ZodError);
  });

  it("rejects a status outside the enum", () => {
    expect(() => adminProductQuerySchema.parse({ status: "DELETED" })).toThrow(ZodError);
  });

  it("accepts a valid status", () => {
    expect(adminProductQuerySchema.parse({ status: "LIVE" }).status).toBe("LIVE");
  });
});

describe("adminCustomerQuerySchema", () => {
  it("rejects a negative page", () => {
    expect(() => adminCustomerQuerySchema.parse({ page: "-1" })).toThrow(ZodError);
  });
});

describe("adminOrderQuerySchema", () => {
  it("rejects a malformed date instead of producing an Invalid Date", () => {
    expect(() => adminOrderQuerySchema.parse({ from: "12/25/2025" })).toThrow(ZodError);
  });

  it("accepts a well-formed date range", () => {
    const result = adminOrderQuerySchema.parse({ from: "2025-01-01", to: "2025-01-31" });
    expect(result.from).toBe("2025-01-01");
    expect(result.to).toBe("2025-01-31");
  });

  it("rejects a from date after the to date", () => {
    expect(() =>
      adminOrderQuerySchema.parse({ from: "2025-02-01", to: "2025-01-01" }),
    ).toThrow(ZodError);
  });
});
