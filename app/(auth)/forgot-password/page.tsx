"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const inputClass =
  "w-full h-11 rounded-[6px] border border-border bg-surface px-4 text-[14px] text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 font-sans";

export default function ForgotPasswordPage() {
  const t = useTranslations("authUi");
  const [cabinetName, setCabinetName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cabinetName }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.error || t("errorGeneric"));
      }
    } catch {
      setError(t("errorConnection"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[480px] bg-surface rounded-[12px] border border-[0.5px] border-border p-6 shadow-sm sm:p-8">
      {sent ? (
        <div className="text-center space-y-4">
          <h2 className="text-[24px] font-serif tracking-[-0.02em] text-text-primary">
            {t("linkSentTitle")}
          </h2>
          <p className="text-[14px] font-sans text-text-body">
            {t("linkSentBody")}
          </p>
          <Link href="/connexion" className="block mt-4">
            <Button className="w-full h-11 bg-text-primary text-canvas hover:bg-black border-none">
              {t("backToSignIn")}
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-[24px] font-serif tracking-[-0.02em] text-text-primary mb-2">
              {t("forgotTitle")}
            </h2>
            <p className="text-[14px] font-sans text-text-body">
              {t("forgotSubtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary font-sans">
                {t("firmNameLabel")}
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder={t("firmNamePlaceholderTremblay")}
                value={cabinetName}
                onChange={(e) => setCabinetName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-text-primary font-sans">
                {t("emailLabel")}
              </label>
              <input
                type="email"
                className={inputClass}
                placeholder={t("emailPlaceholderGeneric")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-sans">{error}</p>
            )}

            <Button
              type="submit"
              className="h-11 w-full mt-2 bg-text-primary text-canvas hover:bg-black border-none"
              disabled={loading}
            >
              {loading ? t("sending") : t("sendLinkButton")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/connexion"
              className="text-[13px] font-medium font-sans text-text-muted hover:text-text-primary transition-colors"
            >
              {t("backToSignIn")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
