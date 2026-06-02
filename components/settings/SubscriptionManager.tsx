"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Check, CreditCard, ExternalLink, Sparkles } from "lucide-react";
import {
  PLANS,
  PUBLIC_CHECKOUT_PLAN_KEYS,
  canonicalPlanKey,
  type PlanKey,
} from "@/lib/stripe";
import { toIntlLocale } from "@/lib/i18n/locale";
import type { PendingOfferConfig } from "@/lib/cabinet-config";
import { Button } from "@/components/ui/Button";

interface SubscriptionManagerProps {
  currentPlan: string;
  stripeCustomerId: string | null;
  subscriptionStatus?: string | null;
  periodEnd: string | null;
  trialEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  pendingOffer?: PendingOfferConfig | null;
}

export function SubscriptionManager({
  currentPlan,
  stripeCustomerId,
  subscriptionStatus,
  periodEnd,
  trialEnd,
  cancelAtPeriodEnd = false,
  pendingOffer = null,
}: SubscriptionManagerProps) {
  const t = useTranslations("parametres");
  const tc = useTranslations("common");
  const intlLocale = toIntlLocale(useLocale());
  const [busy, setBusy] = useState<PlanKey | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const planEntries = PUBLIC_CHECKOUT_PLAN_KEYS.map((key) => [key, PLANS[key]] as const);
  const currentKey = canonicalPlanKey(currentPlan);
  const isActive = subscriptionStatus === "active" || subscriptionStatus === "trialing";
  const formattedRenewal = formatDate(periodEnd, intlLocale);
  const formattedTrialEnd = formatDate(trialEnd ?? null, intlLocale);

  async function startCheckout(plan: PlanKey) {
    setBusy(plan);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? t("subscriptionCheckoutError"));
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("subscriptionCheckoutError"));
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? t("subscriptionPortalError"));
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("subscriptionPortalError"));
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold safe-text-title">{t("subscriptionHeader")}</h2>
          <p className="text-sm safe-text-secondary mt-1">
            {t("subscriptionCurrentPlan")} :{" "}
            <strong className="safe-text-title">{PLANS[currentKey].name}</strong>
            {subscriptionStatus && (
              <span> · {t("subscriptionStripeStatus", { status: subscriptionStatus })}</span>
            )}
            {formattedRenewal && (
              <span> · {t("subscriptionRenewsOn", { date: formattedRenewal })}</span>
            )}
            {formattedTrialEnd && (
              <span> · {t("subscriptionTrialEndsOn", { date: formattedTrialEnd })}</span>
            )}
            {cancelAtPeriodEnd && <span> · {t("subscriptionCancelsAtPeriodEnd")}</span>}
          </p>
        </div>
        {stripeCustomerId && (
          <Button type="button" variant="secondary" onClick={openPortal} disabled={busy != null}>
            <ExternalLink className="h-4 w-4" aria-hidden />
            {busy === "portal" ? tc("loading") : t("subscriptionManage")}
          </Button>
        )}
      </div>

      {pendingOffer && (
        <div className="rounded-safe-lg border border-status-success/40 bg-status-success/5 px-5 py-5 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-status-success">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("subscriptionOfferBadge")}
          </div>
          <h3 className="text-lg font-semibold safe-text-title">{pendingOffer.label}</h3>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-bold safe-text-metric tabular-nums">
              {t("subscriptionOfferTrial", { months: pendingOffer.trialMonths })}
            </span>
            <span className="text-sm safe-text-secondary">
              {t("subscriptionOfferThenPrice", {
                price: new Intl.NumberFormat(intlLocale, {
                  style: "currency",
                  currency: pendingOffer.currency.toUpperCase(),
                  maximumFractionDigits: 0,
                }).format(pendingOffer.monthlyPriceCents / 100),
              })}
            </span>
          </div>
          {pendingOffer.note && (
            <p className="text-sm safe-text-secondary leading-relaxed">{pendingOffer.note}</p>
          )}
        </div>
      )}

      {!isActive && (
        <div className="flex items-start gap-3 rounded-safe-sm border border-status-warning/30 bg-status-warning/5 px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 text-status-warning shrink-0" aria-hidden />
          <p className="safe-text-secondary leading-relaxed">{t("subscriptionActivationRequired")}</p>
        </div>
      )}

      {error && (
        <div className="rounded-safe-sm border border-status-danger/30 bg-status-danger/5 px-4 py-3 text-sm text-status-danger">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {planEntries.map(([key, plan]) => {
          const isCurrent = currentKey === key;
          const monthly = new Intl.NumberFormat(intlLocale, {
            style: "currency",
            currency: plan.currency.toUpperCase(),
            maximumFractionDigits: 0,
          }).format(plan.price / 100);
          return (
            <div
              key={key}
              className={`rounded-safe-lg border p-5 ${
                isCurrent
                  ? "border-status-success/50 bg-status-success/5"
                  : "border-neutral-border/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold safe-text-title">{plan.name}</h3>
                {isCurrent && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-status-success bg-status-success/10 px-2 py-0.5 rounded-full">
                    {t("subscriptionCurrent")}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold safe-text-metric tabular-nums mt-2">
                {monthly}
                <span className="text-sm font-normal safe-text-secondary">
                  /{tc("perMonthShort")}
                </span>
              </p>
              <ul className="mt-4 space-y-2 text-sm safe-text-secondary">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-status-success shrink-0" aria-hidden />
                  {t("subscriptionFeatureUsers", { count: plan.features.maxUsers })}
                </li>
                {plan.features.trustAccounts && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-status-success shrink-0" aria-hidden />
                    {t("subscriptionFeatureTrust")}
                  </li>
                )}
                {plan.features.virtualEmployees && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-status-success shrink-0" aria-hidden />
                    {t("subscriptionFeatureVirtualEmployees")}
                  </li>
                )}
                {plan.features.advancedReports && (
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-status-success shrink-0" aria-hidden />
                    {t("subscriptionFeatureReports")}
                  </li>
                )}
              </ul>
              <Button
                type="button"
                className="mt-5 w-full"
                variant={isCurrent && isActive ? "secondary" : "primary"}
                disabled={busy != null || (isCurrent && isActive)}
                onClick={() => startCheckout(key)}
              >
                <CreditCard className="h-4 w-4" aria-hidden />
                {busy === key
                  ? tc("loading")
                  : isCurrent && isActive
                    ? t("subscriptionCurrent")
                    : t("subscriptionActivate")}
              </Button>
            </div>
          );
        })}
        <div className="rounded-safe-lg border border-neutral-border/60 p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold safe-text-title">Cabinet+</h3>
          </div>
          <p className="text-2xl font-bold safe-text-metric tabular-nums mt-2">
            Sur devis
          </p>
          <p className="mt-2 text-sm safe-text-secondary">
            6 avocats et plus, multi-bureaux, workflows hors cadre.
          </p>
          <ul className="mt-4 space-y-2 text-sm safe-text-secondary">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-status-success shrink-0" aria-hidden />
              Tout le palier Cabinet
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-status-success shrink-0" aria-hidden />
              Pipeline d&apos;onboarding 3 phases
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-status-success shrink-0" aria-hidden />
              SSO et intégrations spécialisées
            </li>
          </ul>
          <Button
            type="button"
            className="mt-5 w-full"
            variant="secondary"
            onClick={() => {
              window.location.href = "/contact";
            }}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Demander un devis
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string | null, locale: string): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
