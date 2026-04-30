"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
  ChevronDown,
  HelpCircle,
  Building2,
  Users,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";
import type { PlanId } from "@/lib/billing/paystack";

interface SubscriptionData {
  plan: PlanId;
  status: "active" | "cancelled" | "past_due" | null;
  currentPeriodEnd: string | null;
  workspaceName: string;
}

const PLANS = {
  free: {
    id: "free",
    name: "Free",
    description: "For individuals getting started",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      { text: "1 Workspace", included: true },
      { text: "5 Team Members", included: true },
      { text: "100 Stories per Month", included: true },
      { text: "Basic Story Scoring", included: true },
      { text: "Community Support", included: true },
      { text: "Signal Updates", included: false },
      { text: "Horizon Planning", included: false },
      { text: "Priority Support", included: false },
    ],
    cta: "Get Started",
    popular: false,
  },
  growth: {
    id: "pro",
    name: "Growth",
    description: "For growing teams",
    priceMonthly: 29,
    priceYearly: 290,
    features: [
      { text: "Unlimited Workspaces", included: true },
      { text: "15 Team Members", included: true },
      { text: "Unlimited Stories", included: true },
      { text: "Advanced AI Scoring", included: true },
      { text: "Signal Updates", included: true },
      { text: "Email Integration", included: true },
      { text: "Email Support", included: true },
      { text: "Horizon Planning", included: false },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      { text: "Everything in Growth", included: true },
      { text: "Unlimited Team Members", included: true },
      { text: "Horizon PI Planning", included: true },
      { text: "AI Risk Analysis", included: true },
      { text: "Custom Integrations", included: true },
      { text: "SSO/SAML", included: true },
      { text: "Dedicated Support", included: true },
      { text: "SLA Guarantee", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
} as const;

const FAQS = [
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When you upgrade, you'll be charged the prorated difference for the remainder of your billing cycle. When you downgrade, your new plan will take effect at the end of your current billing period.",
  },
  {
    question: "What happens if I downgrade?",
    answer:
      "Your current features will remain active until the end of your billing period. After that, you'll be moved to your new plan. If you exceed the limits of your new plan (e.g., team members), you'll need to remove members before the downgrade takes effect.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! The Growth plan includes a 14-day free trial with full access to all features. No credit card required to start. If you don't upgrade by the end of your trial, you'll be moved to the Free plan.",
  },
  {
    question: "How does per-seat billing work?",
    answer:
      "Each plan includes a certain number of team members. If you need more seats, contact our sales team for a custom Enterprise plan. We offer volume discounts for larger teams.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express), as well as wire transfers for Enterprise customers. All payments are processed securely through Stripe.",
  },
  {
    question: "Do you offer discounts for non-profits or startups?",
    answer:
      "Yes! We offer 50% off for verified non-profit organizations and early-stage startups (pre-Series A). Contact our sales team with proof of status to apply for the discount.",
  },
];

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

function PlanCard({
  plan,
  currentPlan,
  billingInterval,
  onSelect,
  isLoading,
}: {
  plan: (typeof PLANS)[keyof typeof PLANS];
  currentPlan: string;
  billingInterval: "monthly" | "yearly";
  onSelect: (planId: string) => void;
  isLoading: boolean;
}) {
  const isCurrentPlan = plan.id === currentPlan;
  const isEnterprise = plan.id === "enterprise";
  const isFree = plan.id === "free";
  const price = billingInterval === "yearly" ? plan.priceYearly : plan.priceMonthly;
  const monthlyEquivalent = billingInterval === "yearly" ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "relative rounded-xl border p-6 bg-surface-01 flex flex-col",
        isCurrentPlan ? "border-iris ring-2 ring-iris/20" : "border-border",
        plan.popular && !isCurrentPlan && "border-jade ring-2 ring-jade/20"
      )}
    >
      {plan.popular && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="excellent" className="text-xs shadow-lg">
            <Sparkles className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="iris" className="text-xs shadow-lg">
            <Check className="w-3 h-3 mr-1" />
            Current Plan
          </Badge>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
        <p className="text-sm text-text-secondary mt-1">{plan.description}</p>
      </div>

      <div className="mb-6">
        {isEnterprise ? (
          <div>
            <span className="text-3xl font-bold text-text-primary">Custom</span>
            <p className="text-sm text-text-secondary mt-1">Contact us for pricing</p>
          </div>
        ) : isFree ? (
          <div>
            <span className="text-4xl font-bold font-mono text-text-primary">$0</span>
            <span className="text-text-secondary ml-1">/month</span>
          </div>
        ) : (
          <div>
            <span className="text-4xl font-bold font-mono text-text-primary">
              {formatUSD(monthlyEquivalent)}
            </span>
            <span className="text-text-secondary ml-1">/month</span>
            {billingInterval === "yearly" && (
              <div className="text-sm text-jade mt-1">
                {formatUSD(price)}/year (Save 17%)
              </div>
            )}
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-6 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check
              className={cn(
                "w-4 h-4 mt-0.5 shrink-0",
                feature.included ? "text-jade" : "text-text-tertiary"
              )}
            />
            <span
              className={cn(
                feature.included ? "text-text-secondary" : "text-text-tertiary line-through"
              )}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <Button variant="secondary" className="w-full" disabled>
          Current Plan
        </Button>
      ) : isEnterprise ? (
        <a
          href="mailto:sales@forgeapp.dev"
          className={cn(
            "w-full inline-flex items-center justify-center font-medium rounded-md transition-colors",
            "px-4 py-2.5 text-sm",
            "bg-surface-03 text-text-primary border border-border hover:border-border-strong hover:bg-surface-04"
          )}
        >
          <Building2 className="w-4 h-4 mr-2" />
          Contact Sales
        </a>
      ) : (
        <Button
          className="w-full"
          variant={plan.popular ? "primary" : "secondary"}
          onClick={() => onSelect(plan.id)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {plan.cta}
              {!isFree && <Zap className="w-4 h-4 ml-2" />}
            </>
          )}
        </Button>
      )}
    </motion.div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg bg-surface-01">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <span className="text-sm font-medium text-text-primary">{question}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-text-tertiary transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="px-4 pb-4"
        >
          <p className="text-sm text-text-secondary">{answer}</p>
        </motion.div>
      )}
    </div>
  );
}

export default function BillingPage() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "yearly"
  );
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: subscription, isLoading } = useQuery<SubscriptionData>({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetch("/api/billing/subscription");
      if (!res.ok) throw new Error("Failed to fetch subscription");
      return res.json();
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({
      planId,
      interval,
    }: {
      planId: string;
      interval: "monthly" | "yearly";
    }) => {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Checkout failed");
      }

      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.authorization_url;
    },
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    checkoutMutation.mutate({ planId, interval: billingInterval });
  };

  const currentPlan = subscription?.plan || "free";

  return (
    <div>
      <PageHeader
        title="Billing and Subscription"
        description="Manage your subscription plan and billing details"
        actions={
          <Link href="/settings">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        }
      />

      {/* Current Plan Status */}
      {isLoading ? (
        <div className="mb-8 p-6 rounded-xl border border-border bg-surface-01">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      ) : (
        <div className="mb-8 p-6 rounded-xl border border-border bg-surface-01">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-semibold text-text-primary">
                  {subscription?.workspaceName || "Your Workspace"}
                </h2>
                <Badge
                  variant={
                    subscription?.status === "active" ? "excellent" : "default"
                  }
                >
                  {Object.values(PLANS).find((p) => p.id === currentPlan)?.name || "Free"}
                </Badge>
              </div>
              {subscription?.status === "active" &&
                subscription?.currentPeriodEnd && (
                  <p className="text-sm text-text-secondary">
                    Your subscription renews on{" "}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" }
                    )}
                  </p>
                )}
              {subscription?.status === "cancelled" && (
                <p className="text-sm text-amber">
                  Your subscription has been cancelled
                </p>
              )}
              {subscription?.status === "past_due" && (
                <p className="text-sm text-coral">
                  Payment failed. Please update your payment method.
                </p>
              )}
              {!subscription?.status && currentPlan === "free" && (
                <p className="text-sm text-text-secondary">
                  Upgrade to unlock advanced features and unlimited usage
                </p>
              )}
            </div>
            {subscription?.status === "active" && (
              <Button variant="ghost" size="sm" className="text-text-tertiary">
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Payment
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="inline-flex items-center rounded-lg bg-surface-02 p-1">
          <button
            onClick={() => setBillingInterval("monthly")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all",
              billingInterval === "monthly"
                ? "bg-surface-01 text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval("yearly")}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
              billingInterval === "yearly"
                ? "bg-surface-01 text-text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            Yearly
            <Badge variant="excellent" size="sm">
              Save 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {checkoutMutation.error && (
        <div className="mb-6 p-4 rounded-lg bg-coral-dim border border-coral-border text-coral text-sm">
          {checkoutMutation.error.message}
        </div>
      )}

      {/* Plans Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {Object.values(PLANS).map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
            billingInterval={billingInterval}
            onSelect={handleSelectPlan}
            isLoading={checkoutMutation.isPending && selectedPlan === plan.id}
          />
        ))}
      </motion.div>

      {/* Feature Comparison Highlights */}
      <div className="mb-12 p-6 rounded-xl border border-border bg-surface-01">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-iris" />
          What's Included in Each Plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-medium">
              <Users className="w-4 h-4 text-text-tertiary" />
              Team Size
            </div>
            <p className="text-sm text-text-secondary">
              Free: 5 members | Growth: 15 members | Enterprise: Unlimited
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-medium">
              <Shield className="w-4 h-4 text-text-tertiary" />
              AI Features
            </div>
            <p className="text-sm text-text-secondary">
              Free: Basic scoring | Growth: Advanced AI + Signal | Enterprise: Full suite
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-medium">
              <HelpCircle className="w-4 h-4 text-text-tertiary" />
              Support
            </div>
            <p className="text-sm text-text-secondary">
              Free: Community | Growth: Email | Enterprise: Dedicated + SLA
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-text-primary mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <FAQItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </div>
  );
}
