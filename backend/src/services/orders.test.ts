import { describe, expect, it } from "vitest";
import type { OrderStatus } from "@prisma/client";
import { assertValidTransition, OrderError } from "./orders";

describe("assertValidTransition (COM-P2-01 regression)", () => {
  it("allows the next sequential step in ORDER_FLOW", () => {
    expect(() => assertValidTransition("PLACED", "CONFIRMED")).not.toThrow();
    expect(() => assertValidTransition("CONFIRMED", "PACKED")).not.toThrow();
    expect(() => assertValidTransition("OUT_FOR_DELIVERY", "DELIVERED")).not.toThrow();
  });

  it("rejects skipping ahead", () => {
    expect(() => assertValidTransition("PLACED", "SHIPPED")).toThrow(OrderError);
    expect(() => assertValidTransition("PLACED", "DELIVERED")).toThrow(OrderError);
  });

  it("rejects backward moves", () => {
    expect(() => assertValidTransition("SHIPPED", "CONFIRMED")).toThrow(OrderError);
    expect(() => assertValidTransition("PACKED", "PLACED")).toThrow(OrderError);
  });

  it("allows cancelling from any in-flight status", () => {
    const inFlight: OrderStatus[] = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"];
    for (const status of inFlight) {
      expect(() => assertValidTransition(status, "CANCELLED")).not.toThrow();
    }
  });

  it("rejects RETURNED from a status that was never delivered", () => {
    expect(() => assertValidTransition("PLACED", "RETURNED")).toThrow(OrderError);
    expect(() => assertValidTransition("SHIPPED", "RETURNED")).toThrow(OrderError);
  });

  it("rejects any move off a terminal status, including DELIVERED", () => {
    // DELIVERED was already terminal in the original implementation (no return flow was
    // ever reachable through it) — preserved as-is rather than adding a new admin flow.
    expect(() => assertValidTransition("CANCELLED", "CONFIRMED")).toThrow(OrderError);
    expect(() => assertValidTransition("DELIVERED", "CANCELLED")).toThrow(OrderError);
    expect(() => assertValidTransition("DELIVERED", "RETURNED")).toThrow(OrderError);
    expect(() => assertValidTransition("RETURNED", "PLACED")).toThrow(OrderError);
  });

  it("allows re-submitting the same status as a no-op (e.g. editing a note)", () => {
    expect(() => assertValidTransition("SHIPPED", "SHIPPED")).not.toThrow();
    expect(() => assertValidTransition("CANCELLED", "CANCELLED")).not.toThrow();
  });
});
