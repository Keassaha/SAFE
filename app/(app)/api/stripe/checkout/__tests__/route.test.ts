import { beforeEach, describe, expect, it, vi } from "vitest";

const { stripeMock, prismaMock, sessionMock } = vi.hoisted(() => {
  const stripe = {
    customers: {
      create: vi.fn(async () => ({ id: "cus_new" })),
    },
    checkout: {
      sessions: {
        create: vi.fn(async () => ({ url: "https://stripe.test/checkout" })),
      },
    },
  };
  return {
    stripeMock: stripe,
    prismaMock: {
      cabinet: {
        findUnique: vi.fn(async () => ({
          id: "cab1",
          nom: "Cabinet SAFE",
          email: "admin@safe.test",
          stripeCustomerId: null,
        })),
        update: vi.fn(async () => ({ id: "cab1" })),
      },
    },
    sessionMock: vi.fn(async () => ({
      cabinetId: "cab1",
      userId: "user1",
      role: "admin_cabinet",
    })),
  };
});

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/session", () => ({ requireCabinetAndUser: sessionMock }));
vi.mock("@/lib/auth/permissions", () => ({ canManageCabinetSettings: () => true }));
vi.mock("@/lib/stripe", async () => {
  const actual = await vi.importActual<typeof import("@/lib/stripe")>("@/lib/stripe");
  return {
    ...actual,
    getStripe: () => stripeMock,
    appBaseUrl: () => "https://safe.test",
    stripePriceIdForPlan: () => "price_professionnel",
  };
});

function request(plan = "professionnel") {
  return new Request("https://safe.test/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
}

beforeEach(() => {
  stripeMock.customers.create.mockClear();
  stripeMock.checkout.sessions.create.mockClear();
  prismaMock.cabinet.findUnique.mockClear();
  prismaMock.cabinet.update.mockClear();
  sessionMock.mockClear();
});

describe("POST /api/stripe/checkout", () => {
  it("crée une session Checkout avec metadata cabinetId/userId/plan", async () => {
    const { POST } = await import("@/app/(app)/api/stripe/checkout/route");

    const res = await POST(request() as never);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://stripe.test/checkout" });

    expect(stripeMock.customers.create).toHaveBeenCalledWith({
      metadata: { cabinetId: "cab1", userId: "user1" },
      name: "Cabinet SAFE",
      email: "admin@safe.test",
    });
    expect(prismaMock.cabinet.update).toHaveBeenCalledWith({
      where: { id: "cab1" },
      data: { stripeCustomerId: "cus_new" },
    });

    const args = (stripeMock.checkout.sessions.create.mock.calls as unknown as Array<[Record<string, unknown>]>)[0][0];
    expect(args.customer).toBe("cus_new");
    expect(args.line_items).toEqual([{ price: "price_professionnel", quantity: 1 }]);
    expect(args.metadata).toEqual({ cabinetId: "cab1", userId: "user1", plan: "professionnel" });
    expect((args.subscription_data as { metadata: unknown }).metadata).toEqual({ cabinetId: "cab1", userId: "user1", plan: "professionnel" });
    expect(args.success_url).toBe("https://safe.test/parametres/abonnement?stripe=success");
  });
});
