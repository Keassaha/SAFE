"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { SafeLogo } from "@/components/branding/SafeLogo";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Suspense } from "react";

function ResetPasswordContent() {
  const t = useTranslations("authUi");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full h-11 rounded-safe border border-white/35 bg-white/78 px-4 text-sm text-neutral-text-primary placeholder:text-neutral-muted outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("errorPasswordsMismatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("errorPasswordTooShort"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || t("errorGeneric"));
      }
    } catch {
      setError(t("errorConnection"));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-neutral-text-primary">
          {t("invalidLinkTitle")}
        </h2>
        <p className="text-sm text-neutral-muted">
          {t("invalidLinkBody")}
        </p>
        <Link href="/forgot-password">
          <Button variant="secondary">{t("requestAgainButton")}</Button>
        </Link>
      </div>
    );
  }

  return success ? (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-semibold text-neutral-text-primary">
        {t("passwordChangedTitle")}
      </h2>
      <p className="text-sm text-neutral-muted">
        {t("passwordChangedBody")}
      </p>
      <Link href="/connexion">
        <Button className="mt-4">{t("signInButton")}</Button>
      </Link>
    </div>
  ) : (
    <>
      <h2 className="text-xl font-semibold text-neutral-text-primary mb-2">
        {t("newPasswordTitle")}
      </h2>
      <p className="text-sm text-neutral-muted mb-6">
        {t("newPasswordSubtitle")}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-text-primary mb-1">
            {t("newPasswordLabel")}
          </label>
          <input
            type="password"
            className={inputClass}
            placeholder={t("minCharsPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-text-primary mb-1">
            {t("confirmPasswordLabel")}
          </label>
          <input
            type="password"
            className={inputClass}
            placeholder={t("repeatPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("saving") : t("changePasswordButton")}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("authUi");
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <SafeLogo className="mx-auto mb-4" />
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
          <Suspense fallback={<p>{t("loading")}</p>}>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
