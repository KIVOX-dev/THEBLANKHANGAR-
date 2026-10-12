
export type PaymentIntent = {
  reference: string;
  provider: string;
  amount: number;
  currency: "INR";
  /** Extra fields the client checkout needs (e.g. Razorpay order id + key id). */
  clientPayload: Record<string, string | number>;
};

export type PaymentVerification = {
  paid: boolean;
  reference: string;
};

export interface PaymentProvider {
  readonly name: string;
  /** Called when the order is created, before the customer is asked to pay. */
  createIntent(input: { orderNumber: string; amount: number }): Promise<PaymentIntent>;
  /** Called after the customer completes the provider's flow. */
  verify(input: {
    orderNumber: string;
    reference: string;
    signature?: string;
  }): Promise<PaymentVerification>;
}

/**
 * Stand-in provider used until real Razorpay keys are configured. It mints a
 * reference and reports success immediately, so the whole order lifecycle
 * (creation → payment → confirmation → tracking) is exercisable end to end.
 */
class MockPaymentProvider implements PaymentProvider {
  readonly name = "MOCK";

  async createIntent({ orderNumber, amount }: { orderNumber: string; amount: number }) {
    return {
      reference: `mock_${orderNumber.toLowerCase()}`,
      provider: this.name,
      amount,
      currency: "INR" as const,
      clientPayload: { mock: 1 },
    };
  }

  async verify({ reference }: { reference: string }) {
    return { paid: true, reference };
  }
}

/**
 * Razorpay is wired to the same interface. `PAYMENT_PROVIDER=razorpay` plus the
 * key env vars is all it takes to switch — no changes to checkout or the order service.
 */
class RazorpayProvider implements PaymentProvider {
  readonly name = "RAZORPAY";

  constructor(
    private readonly keyId: string,
    private readonly keySecret: string,
  ) {}

  async createIntent({ orderNumber, amount }: { orderNumber: string; amount: number }) {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // paise
        currency: "INR",
        receipt: orderNumber,
      }),
    });

    if (!res.ok) throw new Error(`Razorpay order creation failed (${res.status})`);

    const order = (await res.json()) as { id: string };
    return {
      reference: order.id,
      provider: this.name,
      amount,
      currency: "INR" as const,
      clientPayload: { razorpayOrderId: order.id, keyId: this.keyId },
    };
  }

  async verify({
    reference,
    signature,
  }: {
    orderNumber: string;
    reference: string;
    signature?: string;
  }) {
    if (!signature) return { paid: false, reference };

    const { createHmac } = await import("node:crypto");
    const expected = createHmac("sha256", this.keySecret).update(reference).digest("hex");

    return { paid: expected === signature, reference };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const configured = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (configured === "razorpay" && keyId && keySecret) {
    return new RazorpayProvider(keyId, keySecret);
  }

  return new MockPaymentProvider();
}
