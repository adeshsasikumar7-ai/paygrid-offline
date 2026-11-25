// Pure billing rules mirrored from the server-side _process_events function.
export type Billing = "prepaid" | "postpaid";

export function unitsFromPower(powerW: number, intervalS: number): number {
  return (powerW * intervalS) / 3_600_000;
}

export function applyPrepaidUsage(balance: number, units: number, rate: number) {
  const next = Math.max(balance - units * rate, 0);
  return { balance: next, relayOn: next > 0 };
}

export function applyPostpaidUsage(units: number, addUnits: number, rate: number) {
  const total = units + addUnits;
  return { units: total, due: Math.round(total * rate * 10000) / 10000 };
}

export function applyPayment(billing: Billing, current: number, amount: number) {
  if (!(amount > 0) || amount > 100000) throw new Error("Invalid amount");
  return billing === "prepaid" ? current + amount : Math.max(current - amount, 0);
}
