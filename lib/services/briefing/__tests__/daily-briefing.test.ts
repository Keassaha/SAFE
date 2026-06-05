import { describe, it, expect, vi, beforeEach } from "vitest";

const { securityMock, unbilledMock, agingMock } = vi.hoisted(() => ({
  securityMock: vi.fn(),
  unbilledMock: vi.fn(),
  agingMock: vi.fn(),
}));
vi.mock("@/lib/services/security/security-alerts", () => ({ getSecurityAlerts: securityMock }));
vi.mock("@/lib/services/finance/unbilled-time", () => ({ getUnbilledTimeReport: unbilledMock }));
vi.mock("@/lib/services/finance/receivables-aging", () => ({ getReceivablesAging: agingMock }));

import { getDailyBriefing } from "@/lib/services/briefing/daily-briefing";

beforeEach(() => {
  securityMock.mockReset();
  unbilledMock.mockReset();
  agingMock.mockReset();
});

describe("getDailyBriefing — composition Finance + Sécurité", () => {
  it("agrège les chiffres clés et limite le top créances à 3", async () => {
    securityMock.mockResolvedValue({ summary: { nbCritiques: 2, nbAvertissements: 1 } });
    unbilledMock.mockResolvedValue({ totals: { montantTotal: 5000, montantDormant: 1200 } });
    agingMock.mockResolvedValue({
      totals: { enRetard: 3000, totalDu: 4000 },
      clients: [
        { clientId: "a", montantEnRetard: 1000 },
        { clientId: "b", montantEnRetard: 800 },
        { clientId: "c", montantEnRetard: 600 },
        { clientId: "d", montantEnRetard: 400 },
        { clientId: "e", montantEnRetard: 0 },
      ],
    });

    const r = await getDailyBriefing("cab1");

    expect(r.security.summary).toEqual({ nbCritiques: 2, nbAvertissements: 1 });
    expect(r.finance.aFacturer).toBe(5000);
    expect(r.finance.dormant).toBe(1200);
    expect(r.finance.creancesEnRetard).toBe(3000);
    expect(r.finance.creancesTotal).toBe(4000);
    expect(r.finance.topCreances.map((c) => c.clientId)).toEqual(["a", "b", "c"]); // top 3, exclut le 0
  });
});
