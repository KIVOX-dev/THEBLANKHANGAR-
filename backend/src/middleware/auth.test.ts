import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requireAdmin, requireAuth, requireStaff } from "./auth";
import type { SessionPayload } from "@/jwt";

function makeReq(user?: SessionPayload): Request {
  return { user } as Request;
}

describe("route guards (authorization regression)", () => {
  const customer: SessionPayload = { id: "1", name: "C", email: "c@example.com", role: "CUSTOMER" };
  const staff: SessionPayload = { id: "2", name: "S", email: "s@example.com", role: "STAFF" };
  const admin: SessionPayload = { id: "3", name: "A", email: "a@example.com", role: "ADMIN" };

  it("requireAuth rejects an unauthenticated request", () => {
    const next = vi.fn();
    requireAuth(makeReq(undefined), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  it("requireAuth allows any signed-in user", () => {
    const next = vi.fn();
    requireAuth(makeReq(customer), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("requireStaff rejects a customer", () => {
    const next = vi.fn();
    requireStaff(makeReq(customer), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it("requireStaff allows staff and admin", () => {
    for (const user of [staff, admin]) {
      const next = vi.fn();
      requireStaff(makeReq(user), {} as Response, next);
      expect(next).toHaveBeenCalledWith();
    }
  });

  it("requireAdmin rejects staff (only admins pass)", () => {
    const next = vi.fn();
    requireAdmin(makeReq(staff), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  it("requireAdmin allows an admin", () => {
    const next = vi.fn();
    requireAdmin(makeReq(admin), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});
