"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToastActions } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion/variants";

type PlanId = "free" | "pro" | "team" | "enterprise";

const PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "1 workspace",
      "5 team members",
      "100 stories/month",
      "Basic scoring",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 15000,
    priceYearly: 150000,
    features: [
      "Unlimited workspaces",
      "15 team members",
      "Unlimited stories",
      "Advanced scoring",
      "Signal updates",
      "Email support",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    priceMonthly: 45000,
    priceYearly: 450000,
    features: [
      "Everything in Pro",
      "50 team members",
      "Horizon PI Planning",
      "Risk Analysis",
      "Priority support",
      "SSO (coming soon)",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      "Everything in Team",
      "Unlimited team members",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option",
    ],
  },
} as const;

const DEMO_SUBSCRIPTION = {
  plan: "team" as PlanId,
  status: "active" as const,
  currentPeriodEnd: "2026-05-20T00:00:00Z",
  workspaceName: "Interswitch Group",
};

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function PlanCard({
  planId,
  name,
  priceMonthly,
  features,
  currentPlan,
  billingInterval,
  onSelect,
  isLoading,
}: {
  planId: PlanId;
  name: string;
  priceMonthly: number;
  features: readonly string[];
  currentPlan: PlanId;
  billingInterval: "monthly" | "yearly";
  onSelect: (planId: PlanId) => void;
  isLoading: boolean;
}) {
  const isCurrentPlan = planId === currentPlan;
  const isEnterprise = planId === "enterprise";
  const isFree = planId === "free";

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "relative rounded-lg border p-6 bg-surface-01",
        isCurrentPlan ? "border-iris" : "border-border",
        planId === "team" && !isCurrentPlan && "ring-1 ring-iris/30"
      )}
    >
      {planId === "team" && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="excellent" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="text-xs">
            Current Plan
          </Badge>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{name}</h3>
        {!isEnterprise && !isFree ? (
          <div className="mt-2">
            <span className="text-3xl font-bold font-mono text-text-primary">
              {formatNaira(priceMonthly)}
            </span>
            <span className="text-text-secondary">/month</span>
            {billingInterval === "yearly" && (
              <div className="text-xs text-jade mt-1">
                Save 17% with yearly billing
              </div>
            )}
          </div>
        ) : isEnterprise ? (
          <div className="mt-2">
            <span className="text-2xl font-bold text-text-primary">
              Custom Pricing
            </span>
          </div>
        ) : (
          <div className="mt-2">
            <span className="text-3xl font-bold font-mono text-text-primary">
              Free
            </span>
          </div>
        )}
      </div>

      <ul className="space-y-2 mb-6">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-jade mt-0.5 shrink-0" />
            <span className="text-text-secondary">{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrentPlan ? (
        <Button variant="secondary" className="w-full" disabled>
          Current Plan
        </Button>
      ) : isEnterprise ? (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => onSelect(planId)}
        >
          Contact Sales
        </Button>
      ) : isFree ? (
        <Button variant="secondary" className="w-full" disabled>
          Downgrade
        </Button>
      ) : (
        <Button
          className="w-full"
          onClick={() => onSelect(planId)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Upgrade to {name}
            </>
          )}
        </Button>
      )}
    </motion.div>
  );
}

export default function DemoBillingPage() {
  const toast = useToastActions();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const subscription = DEMO_SUBSCRIPTION;
  const currentPlan = subscription.plan;

  const handleSelectPlan = async (planId: PlanId) => {
    if (planId === "enterprise") {
      toast.info(
        "Demo Mode",
        "In production, this would open your email client to contact sales"
      );
      return;
    }

    setSelectedPlan(planId);
    setIsLoading(true);

    // Simulate checkout process
    await new Promise((r) => setTimeout(r, 1500));

    setIsLoading(false);
    setSelectedPlan(null);
    toast.info(
      "Demo Mode",
      "In production, this would redirect to Paystack checkout"
    );
  };

  return (
    <div>
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription plan and billing details"
        actions={
          <Link href="/demo/settings">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
        }
      />

      {/* Current Plan Status */}
      <div className="mb-8 p-6 rounded-lg border border-border bg-surface-01">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-semibold text-text-primary">
                {subscription.workspaceName}
              </h2>
              <Badge
                variant={subscription.status === "active" ? "excellent" : "default"}
              >
                {PLANS[currentPlan].name}
              </Badge>
            </div>
            {subscription.status === "active" && subscription.currentPeriodEnd && (
              <p className="text-sm text-text-secondary">
                Your subscription renews on{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </p>
            )}
          </div>
          {subscription.status === "active" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-text-tertiary"
              onClick={() =>
                toast.info("Demo Mode", "Payment management is disabled in demo mode")
              }
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Payment
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setBillingInterval("monthly")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            billingInterval === "monthly"
              ? "bg-surface-03 text-text-primary"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingInterval("yearly")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            billingInterval === "yearly"
              ? "bg-surface-03 text-text-primary"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          Yearly
          <span className="ml-2 text-xs text-jade">Save 17%</span>
        </button>
      </div>

      {/* Plans Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(
          ([planId, plan]) => (
            <PlanCard
              key={planId}
              planId={planId}
              name={plan.name}
              priceMonthly={plan.priceMonthly}
              features={plan.features}
              currentPlan={currentPlan}
              billingInterval={billingInterval}
              onSelect={handleSelectPlan}
              isLoading={isLoading && selectedPlan === planId}
            />
          )
        )}
      </motion.div>

      {/* FAQ Section */}
      <div className="mt-12 max-w-2xl">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-surface-01 border border-border">
            <h3 className="text-sm font-medium text-text-primary mb-1">
              Can I change my plan later?
            </h3>
            <p className="text-sm text-text-secondary">
              Yes, you can upgrade or downgrade your plan at any time. Changes
              take effect immediately, and we&apos;ll prorate any differences.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface-01 border border-border">
            <h3 className="text-sm font-medium text-text-primary mb-1">
              What payment methods do you accept?
            </h3>
            <p className="text-sm text-text-secondary">
              We accept all major cards, bank transfers, and USSD payments
              through Paystack. All payments are processed securely in Nigerian
              Naira (NGN).
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface-01 border border-border">
            <h3 className="text-sm font-medium text-text-primary mb-1">
              Is there a free trial?
            </h3>
            <p className="text-sm text-text-secondary">
              The Free plan is always available with core features. For paid
              plans, we offer a 14-day money-back guarantee if you&apos;re not
              satisfied.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
