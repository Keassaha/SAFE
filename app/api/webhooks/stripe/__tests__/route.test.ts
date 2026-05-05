import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  constructEventMock,
  recordStripeEventMock,
  retrieveSubscriptionMock,
  applySubscriptionToCabinetMock,
  applyDeletedSubscriptionMock,
} = vi.hoisted(() => ({
  constructEventMock: vi.fn(),
  recordStripeEventMock: vi.fn(async () => true),
  retrieveSubscriptionMock: vi.fn(async () => ({
    id: "sub_1",
    customer: "cus_1",
    status: "active",
    metadata: { cabinetId: "cab1", plan: "professionnel" },
    items: { data: [{ price: { id: "price_1" }, current_period_end: 1800000000 }] },
    cancel_at_period_end: false,
    trial_end: null,
  })),
  applySubscriptionToCabinetMock: vi.fn(async () => 1),
  applyDeletedSubscriptionMock: vi.fn(async () => 1),
}));

vi.mock("@/lib/stripe", async () => {
  const actual = await vi.importActual<typeof import("@/lib/stripe")>("@/lib/stripe");
  return {
    ...actual,
    getStripe: () => ({ webhooks: { constructEvent: constructEventMock } }),
  };
});

vi.mock("@/lib/services/stripe-subscription", () => ({
  recordStripeEvent: recordStripeEventMock,
  retrieveSubscription: retrieveSubscriptionMock,
  applySubscriptionToCabinet: applySubscriptionToCabinetMock,
  applyDeletedSubscription: applyDeletedSubscriptionMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: { stripeWebhookEvent: { delete: vi.fn(async () => undefined) } },
}));

function stripeRequest() {
  return new Request("https://safe.test/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "sig_test" },
    body: "{}",
  });
}

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  constructEventMock.mockReset();
  recordStripeEventMock.mockClear().mockResolvedValue(true);
  retrieveSubscriptionMock.mockClear();
  applySubscriptionToCabinetMock.mockClear();
  applyDeletedSubscriptionMock.mockClear();
});

describe("POST /api/webhooks/stripe", () => {
  it("checkout.session.completed persiste l'abonnement depuis le webhook signé", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          subscription: "sub_1",
          customer: "cus_1",
          metadata: { cabinetId: "cab1", plan: "professionnel" },
        },
      },
    });

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(stripeRequest());

    expect(res.status).toBe(200);
    expect(retrieveSubscriptionMock).toHaveBeenCalledWith("sub_1");
    expect(applySubscriptionToCabinetMock).toHaveBeenCalledWith({
      cabinetId: "cab1",
      customerId: "cus_1",
      subscription: expect.objectContaining({ id: "sub_1" }),
    });
  });

  it("subscription.updated met à jour le statut et la période", async () => {
    const subscription = {
      id: "sub_1",
      customer: "cus_1",
      status: "past_due",
      metadata: { cabinetId: "cab1", plan: "professionnel" },
      items: { data: [{ price: { id: "price_1" }, current_period_end: 1800000000 }] },
      cancel_at_period_end: true,
      trial_end: null,
    };
    constructEventMock.mockReturnValue({
      id: "evt_2",
      type: "customer.subscription.updated",
      data: { object: subscription },
    });

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(stripeRequest());

    expect(res.status).toBe(200);
    expect(applySubscriptionToCabinetMock).toHaveBeenCalledWith({
      cabinetId: "cab1",
      customerId: "cus_1",
      subscription,
    });
  });

  it("est idempotent : un event déjà traité ne rejoue pas les effets", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_dup",
      type: "checkout.session.completed",
      data: { object: { mode: "subscription", subscription: "sub_1", customer: "cus_1" } },
    });
    recordStripeEventMock.mockResolvedValueOnce(false);

    const { POST } = await import("@/app/api/webhooks/stripe/route");
    const res = await POST(stripeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, duplicate: true });
    expect(applySubscriptionToCabinetMock).not.toHaveBeenCalled();
  });
});
