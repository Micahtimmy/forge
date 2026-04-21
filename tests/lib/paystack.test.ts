import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";

// Mock environment variables
const mockSecretKey = "sk_test_xxxxxxxxxxxxxxxxxxxx";

vi.stubEnv("PAYSTACK_SECRET_KEY", mockSecretKey);
vi.stubEnv("PAYSTACK_PRO_MONTHLY_PLAN", "PLN_pro_monthly");
vi.stubEnv("PAYSTACK_PRO_YEARLY_PLAN", "PLN_pro_yearly");
vi.stubEnv("PAYSTACK_TEAM_MONTHLY_PLAN", "PLN_team_monthly");
vi.stubEnv("PAYSTACK_TEAM_YEARLY_PLAN", "PLN_team_yearly");

// Import after setting env vars
const {
  PLANS,
  formatNaira,
  verifyWebhookSignature,
  createCustomer,
  initializeTransaction,
  verifyTransaction,
  createSubscription,
  getSubscription,
  cancelSubscription,
} = await import("@/lib/billing/paystack");

describe("Paystack Integration", () => {
  describe("PLANS configuration", () => {
    it("has free plan with correct structure", () => {
      expect(PLANS.free).toMatchObject({
        id: "free",
        name: "Free",
        priceMonthly: 0,
        priceYearly: 0,
      });
      expect(PLANS.free.features).toContain("1 workspace");
      expect(PLANS.free.features).toContain("5 team members");
    });

    it("has pro plan with correct pricing in kobo", () => {
      expect(PLANS.pro).toMatchObject({
        id: "pro",
        name: "Pro",
        priceMonthly: 1500000, // 15,000 NGN
        priceYearly: 15000000, // 150,000 NGN
      });
    });

    it("has team plan with correct pricing in kobo", () => {
      expect(PLANS.team).toMatchObject({
        id: "team",
        name: "Team",
        priceMonthly: 4500000, // 45,000 NGN
        priceYearly: 45000000, // 450,000 NGN
      });
    });

    it("has enterprise plan with custom pricing", () => {
      expect(PLANS.enterprise).toMatchObject({
        id: "enterprise",
        name: "Enterprise",
        priceMonthly: 0,
        priceYearly: 0,
      });
      expect(PLANS.enterprise.features).toContain("Unlimited team members");
    });

    it("yearly plans are discounted (2 months free)", () => {
      // Pro: 15,000 * 12 = 180,000 -> 150,000 (2 months free)
      expect(PLANS.pro.priceYearly).toBe(PLANS.pro.priceMonthly * 10);

      // Team: 45,000 * 12 = 540,000 -> 450,000 (2 months free)
      expect(PLANS.team.priceYearly).toBe(PLANS.team.priceMonthly * 10);
    });
  });

  describe("formatNaira", () => {
    it("converts kobo to Naira and formats correctly", () => {
      expect(formatNaira(100)).toBe("₦1.00");
      expect(formatNaira(1500000)).toBe("₦15,000.00");
      expect(formatNaira(4500000)).toBe("₦45,000.00");
    });

    it("handles zero amount", () => {
      expect(formatNaira(0)).toBe("₦0.00");
    });

    it("handles small amounts", () => {
      expect(formatNaira(50)).toBe("₦0.50");
    });

    it("handles large amounts", () => {
      expect(formatNaira(100000000)).toBe("₦1,000,000.00");
    });
  });

  describe("verifyWebhookSignature", () => {
    it("returns true for valid signature", () => {
      const payload = JSON.stringify({ event: "charge.success", data: {} });
      const validSignature = createHmac("sha512", mockSecretKey)
        .update(payload)
        .digest("hex");

      expect(verifyWebhookSignature(payload, validSignature)).toBe(true);
    });

    it("returns false for invalid signature", () => {
      const payload = JSON.stringify({ event: "charge.success", data: {} });
      const invalidSignature = "invalid_signature_hash";

      expect(verifyWebhookSignature(payload, invalidSignature)).toBe(false);
    });

    it("returns false for tampered payload", () => {
      const originalPayload = JSON.stringify({ event: "charge.success", data: {} });
      const tamperedPayload = JSON.stringify({ event: "charge.success", data: { tampered: true } });

      const signature = createHmac("sha512", mockSecretKey)
        .update(originalPayload)
        .digest("hex");

      expect(verifyWebhookSignature(tamperedPayload, signature)).toBe(false);
    });

    it("handles empty payload", () => {
      const payload = "";
      const signature = createHmac("sha512", mockSecretKey)
        .update(payload)
        .digest("hex");

      expect(verifyWebhookSignature(payload, signature)).toBe(true);
    });
  });

  describe("API operations", () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      vi.stubGlobal("fetch", mockFetch);
      mockFetch.mockReset();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    describe("createCustomer", () => {
      it("creates a customer with required params", async () => {
        const mockCustomer = {
          id: 123,
          customer_code: "CUS_xxx",
          email: "test@example.com",
          first_name: null,
          last_name: null,
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ status: true, data: mockCustomer }),
        });

        const result = await createCustomer({ email: "test@example.com" });

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.paystack.co/customer",
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              Authorization: `Bearer ${mockSecretKey}`,
              "Content-Type": "application/json",
            }),
          })
        );
        expect(result).toEqual(mockCustomer);
      });

      it("creates a customer with all params", async () => {
        const mockCustomer = {
          id: 123,
          customer_code: "CUS_xxx",
          email: "test@example.com",
          first_name: "John",
          last_name: "Doe",
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ status: true, data: mockCustomer }),
        });

        await createCustomer({
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe",
          phone: "+2341234567890",
          metadata: { workspaceId: "ws_123" },
        });

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.paystack.co/customer",
          expect.objectContaining({
            body: expect.stringContaining('"first_name":"John"'),
          })
        );
      });

      it("throws on API error", async () => {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ status: false, message: "Invalid email" }),
        });

        await expect(createCustomer({ email: "invalid" })).rejects.toThrow(
          "Invalid email"
        );
      });
    });

    describe("initializeTransaction", () => {
      it("initializes a transaction", async () => {
        const mockTransaction = {
          authorization_url: "https://checkout.paystack.com/xxx",
          access_code: "xxx",
          reference: "ref_xxx",
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ status: true, data: mockTransaction }),
        });

        const result = await initializeTransaction({
          email: "test@example.com",
          amount: 1500000,
        });

        expect(result).toEqual(mockTransaction);
        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.paystack.co/transaction/initialize",
          expect.objectContaining({
            method: "POST",
          })
        );
      });

      it("uses NGN as default currency", async () => {
        mockFetch.mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              status: true,
              data: { authorization_url: "", access_code: "", reference: "" },
            }),
        });

        await initializeTransaction({
          email: "test@example.com",
          amount: 1500000,
        });

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.currency).toBe("NGN");
      });

      it("includes default payment channels", async () => {
        mockFetch.mockResolvedValueOnce({
          json: () =>
            Promise.resolve({
              status: true,
              data: { authorization_url: "", access_code: "", reference: "" },
            }),
        });

        await initializeTransaction({
          email: "test@example.com",
          amount: 1500000,
        });

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody.channels).toEqual(["card", "bank", "ussd", "bank_transfer"]);
      });
    });

    describe("verifyTransaction", () => {
      it("verifies a successful transaction", async () => {
        const mockVerification = {
          id: 123,
          status: "success",
          reference: "ref_xxx",
          amount: 1500000,
          currency: "NGN",
          channel: "card",
          paid_at: "2024-01-15T10:30:00.000Z",
          customer: { id: 1, customer_code: "CUS_xxx", email: "test@example.com" },
          authorization: {
            authorization_code: "AUTH_xxx",
            card_type: "visa",
            last4: "4081",
            exp_month: "12",
            exp_year: "2025",
            bank: "Test Bank",
            reusable: true,
          },
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ status: true, data: mockVerification }),
        });

        const result = await verifyTransaction("ref_xxx");

        expect(result.status).toBe("success");
        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.paystack.co/transaction/verify/ref_xxx",
          expect.objectContaining({
            method: "GET",
          })
        );
      });
    });

    describe("createSubscription", () => {
      it("creates a subscription", async () => {
        const mockSubscription = {
          id: 123,
          subscription_code: "SUB_xxx",
          email_token: "token_xxx",
          status: "active",
          amount: 1500000,
          next_payment_date: "2024-02-15T00:00:00.000Z",
          plan: {
            plan_code: "PLN_xxx",
            name: "Pro Monthly",
            amount: 1500000,
            interval: "monthly",
          },
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ status: true, data: mockSubscription }),
        });

        const result = await createSubscription({
          customerCode: "CUS_xxx",
          planCode: "PLN_xxx",
        });

        expect(result.subscription_code).toBe("SUB_xxx");
        expect(result.status).toBe("active");
      });
    });

    describe("getSubscription", () => {
      it("fetches subscription details", async () => {
        const mockSubscription = {
          id: 123,
          subscription_code: "SUB_xxx",
          status: "active",
        };

        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ status: true, data: mockSubscription }),
        });

        const result = await getSubscription("SUB_xxx");

        expect(result.subscription_code).toBe("SUB_xxx");
        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.paystack.co/subscription/SUB_xxx",
          expect.any(Object)
        );
      });
    });

    describe("cancelSubscription", () => {
      it("cancels a subscription", async () => {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ status: true, message: "Subscription disabled" }),
        });

        const result = await cancelSubscription("SUB_xxx", "token_xxx");

        expect(result).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.paystack.co/subscription/disable",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining('"code":"SUB_xxx"'),
          })
        );
      });

      it("throws on failure", async () => {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ status: false, message: "Invalid token" }),
        });

        await expect(cancelSubscription("SUB_xxx", "invalid")).rejects.toThrow(
          "Invalid token"
        );
      });
    });
  });
});
