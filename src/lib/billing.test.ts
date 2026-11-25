import { describe, expect, it } from "vitest";
import { applyPayment, applyPostpaidUsage, applyPrepaidUsage, unitsFromPower } from "./billing";

describe("billing", () => {
  it("1000 W for one hour is 1 unit", () => expect(unitsFromPower(1000, 3600)).toBe(1));
  it("prepaid deducts units x rate", () => expect(applyPrepaidUsage(120, 2, 6.5).balance).toBe(107));
  it("prepaid relay trips at zero", () => expect(applyPrepaidUsage(5, 1, 6.5)).toEqual({ balance: 0, relayOn: false }));
  it("postpaid due = units x rate", () => expect(applyPostpaidUsage(42.5, 0, 6.5).due).toBe(276.25));
  it("prepaid payment adds to balance", () => expect(applyPayment("prepaid", 15, 50)).toBe(65));
  it("postpaid payment never goes below zero", () => expect(applyPayment("postpaid", 100, 150)).toBe(0));
  it("rejects zero amount", () => expect(() => applyPayment("prepaid", 10, 0)).toThrow());
});
