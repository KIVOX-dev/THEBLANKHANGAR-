import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { signSession, verifySession } from "./jwt";
import { BCRYPT_COST } from "./utils";

describe("session tokens", () => {
  it("round-trips a signed session", async () => {
    const payload = { id: "user_1", name: "Ada Lovelace", email: "ada@example.com", role: "CUSTOMER" as const };
    const token = await signSession(payload);
    const verified = await verifySession(token);
    expect(verified).toEqual(payload);
  });

  it("rejects a tampered token", async () => {
    const token = await signSession({
      id: "user_1",
      name: "Ada",
      email: "ada@example.com",
      role: "CUSTOMER",
    });
    const tampered = `${token.slice(0, -1)}${token.at(-1) === "a" ? "b" : "a"}`;
    expect(await verifySession(tampered)).toBeNull();
  });

  it("rejects garbage input", async () => {
    expect(await verifySession("not-a-jwt")).toBeNull();
  });
});

describe("password hashing (SEC-P3-01 regression)", () => {
  it("hashes at the configured cost factor of 12", async () => {
    const hash = await bcrypt.hash("Sup3rSecret!", BCRYPT_COST);
    // bcrypt hash format: $2a$<cost>$<salt+hash>
    const cost = Number(hash.split("$")[2]);
    expect(cost).toBe(12);
  });

  it("still verifies a legacy hash produced at cost 10", async () => {
    // Guards against a rehash breaking existing users' passwords.
    const legacyHash = await bcrypt.hash("Sup3rSecret!", 10);
    expect(await bcrypt.compare("Sup3rSecret!", legacyHash)).toBe(true);
    expect(await bcrypt.compare("wrong-password", legacyHash)).toBe(false);
  });
});
