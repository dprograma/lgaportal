import crypto from "crypto";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";
const BASE = "https://api.paystack.co";

function paystackHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
  };
}

export interface InitializeParams {
  email: string;
  amount: number; // in kobo
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializeTransaction(
  params: InitializeParams
): Promise<InitializeResult> {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: paystackHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `Paystack error ${res.status}`);
  }
  const data = await res.json() as { status: boolean; data: InitializeResult };
  return data.data;
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: paystackHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `Paystack verify error ${res.status}`);
  }
  return (await res.json()) as {
    status: boolean;
    data: {
      status: string; // "success" | "failed"
      reference: string;
      amount: number;
      paid_at: string;
      customer: { email: string; first_name?: string; last_name?: string };
      metadata: Record<string, unknown>;
    };
  };
}

/** Verify the webhook signature sent by Paystack */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!PAYSTACK_SECRET || !signature) return false;
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}
