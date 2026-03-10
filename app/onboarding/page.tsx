"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { useTranslations } from "next-intl";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const STEPS = [
    { id: 1 as const, title: t("step1"), short: t("step1Short") },
    { id: 2 as const, title: t("step2"), short: t("step2Short") },
    { id: 3 as const, title: t("step3"), short: t("step3Short") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-neutral-page to-accent-50/30 flex flex-col">
      <header className="safe-glass-topbar border-b border-neutral-border/50 h-14 flex items-center justify-between px-4 md:px-6 shrink-0">
        <Link href="/" className="text-lg font-semibold text-primary-800">
          SAFE
        </Link>
        <Link
          href="/tableau-de-bord"
          className="text-sm text-neutral-muted hover:text-primary-800 transition-colors"
        >
          {t("skipToDashboard")}
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex justify-center gap-2 mb-8 md:mb-10">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className="flex flex-col items-center gap-1 group"
                aria-current={step === s.id ? "step" : undefined}
                aria-label={`${t("step1Short")} ${s.id} : ${s.title}`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                    step === s.id
                      ? "bg-primary-600 scale-110 shadow-sm"
                      : "bg-neutral-border group-hover:bg-primary-200"
                  }`}
                />
                <span className="text-[10px] md:text-xs text-neutral-muted hidden sm:inline">
                  {s.short}
                </span>
              </button>
            ))}
          </div>

          {step === 1 && (
            <section className="text-center transition-opacity duration-200">
              <div className="mx-auto mb-6 md:mb-8 w-full max-w-md">
                <Image
                  src="/images/onboarding/onboarding-welcome.png"
                  alt=""
                  width={960}
                  height={540}
                  className="w-full h-auto rounded-safe-lg"
                  priority
                  unoptimized
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-text-primary tracking-tight mb-3">
                {t("welcomeTitle")}
              </h1>
              <p className="text-neutral-muted text-base md:text-lg max-w-xl mx-auto mb-8 md:mb-10">
                {t("welcomeDescription")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10 text-left">
                {[
                  { title: t("addClients"), desc: t("addClientsDesc"), Icon: Users },
                  { title: t("trackHours"), desc: t("trackHoursDesc"), Icon: Clock },
                  { title: t("generateInvoices"), desc: t("generateInvoicesDesc"), Icon: FileText },
                ].map((card) => (
                  <Card key={card.title}>
                    <CardContent className="p-5 md:p-6 flex gap-3 md:gap-4 items-start">
                      <div className="w-10 h-10 rounded-lg bg-primary-800 flex items-center justify-center text-white shrink-0">
                        <card.Icon className="w-6 h-6" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-primary-800 text-sm md:text-base">
                          {card.title}
                        </h2>
                        <p className="text-neutral-muted text-xs md:text-sm mt-0.5">
                          {card.desc}
                        </p>
                      </div>
                      <span
                        className="w-5 h-5 rounded-full bg-accent-400 flex items-center justify-center text-white text-xs shrink-0"
                        aria-hidden
                      >
                        ✓
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-2">
                {t("start")} <span aria-hidden>→</span>
              </Button>
            </section>
          )}

          {step === 2 && (
            <section className="text-center transition-opacity duration-200">
              <div className="mx-auto mb-6 md:mb-8 w-full max-w-md">
                <Image
                  src="/images/onboarding/onboarding-clients.png"
                  alt=""
                  width={960}
                  height={540}
                  className="w-full h-auto rounded-safe-lg"
                  unoptimized
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-text-primary tracking-tight mb-3">
                {t("clientsTitle")}
              </h1>
              <p className="text-neutral-muted text-base md:text-lg max-w-xl mx-auto mb-8 md:mb-10">
                {t("clientsDescription")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
                <Link
                  href="/clients/nouveau"
                  className="rounded-safe-md safe-glass-panel border border-white/40 p-6 text-left hover:border-primary-200 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-800 mb-4 group-hover:bg-primary-200 transition-colors">
                    👤
                  </div>
                  <h2 className="font-semibold text-neutral-text-primary mb-1">
                    {t("addClient")}
                  </h2>
                  <p className="text-sm text-neutral-muted">
                    {t("addClientDesc")}
                  </p>
                </Link>
                <Link
                  href="/dossiers/nouveau"
                  className="rounded-safe-md safe-glass-panel border border-white/40 p-6 text-left hover:border-primary-200 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center text-primary-800 mb-4 group-hover:bg-primary-200 transition-colors">
                    📁
                  </div>
                  <h2 className="font-semibold text-neutral-text-primary mb-1">
                    {t("createMatter")}
                  </h2>
                  <p className="text-sm text-neutral-muted">
                    {t("createMatterDesc")}
                  </p>
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button type="button" variant="tertiary" onClick={() => setStep(1)}>
                  {tc("back")}
                </Button>
                <Button type="button" onClick={() => setStep(3)}>
                  {tc("next")}
                </Button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="text-center transition-opacity duration-200">
              <div className="mx-auto mb-6 md:mb-8 w-full max-w-md">
                <Image
                  src="/images/onboarding/onboarding-time.png"
                  alt=""
                  width={960}
                  height={540}
                  className="w-full h-auto rounded-safe-lg"
                  unoptimized
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-text-primary tracking-tight mb-3">
                {t("timeTitle")}
              </h1>
              <p className="text-neutral-muted text-base md:text-lg max-w-xl mx-auto mb-8 md:mb-10">
                {t("timeDescription")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-10">
                <Link
                  href="/temps"
                  className="rounded-safe-md safe-glass-panel border border-white/40 p-6 text-left hover:border-primary-200 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center text-accent-800 mb-4 group-hover:bg-accent-200 transition-colors">
                    ⏱
                  </div>
                  <h2 className="font-semibold text-neutral-text-primary mb-1">
                    {t("enterTime")}
                  </h2>
                  <p className="text-sm text-neutral-muted">
                    {t("enterTimeDesc")}
                  </p>
                </Link>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button type="button" variant="tertiary" onClick={() => setStep(2)}>
                  {tc("back")}
                </Button>
                <Link href="/tableau-de-bord">
                  <Button>{t("goToDashboard")}</Button>
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="py-4 text-center">
        <p className="text-xs text-neutral-muted">
          {t("footerText")}
        </p>
      </footer>
    </div>
  );
}
