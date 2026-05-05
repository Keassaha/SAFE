"use client";

import { signInWithCredentialsClient } from "@/lib/auth/credentials-sign-in-client";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { SafeLogo } from "@/components/branding/SafeLogo";
import { Button } from "@/components/ui/Button";

const inputBaseClass =
  "w-full h-11 rounded-[6px] border border-border bg-surface text-[14px] text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 focus:border-forest-600 focus:ring-1 focus:ring-forest-600 font-sans";
const inputClass = `${inputBaseClass} px-4`;
const passwordInputClass = `${inputBaseClass} pl-4 pr-12`;

type AuthTab = "signin" | "signup";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/tableau-de-bord";
  const initialTab = useMemo<AuthTab>(() => {
    if (searchParams.get("tab") === "signup") return "signup";
    if (searchParams.get("registered") === "1") return "signin";
    return "signin";
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [cabinetName, setCabinetName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signupNom, setSignupNom] = useState("");
  const [signupCabinetName, setSignupCabinetName] = useState("");
  const [signupAddress, setSignupAddress] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [error, setError] = useState("");
  const [dbConfigError, setDbConfigError] = useState("");
  const [success, setSuccess] = useState(
    searchParams.get("registered") === "1"
      ? "Cabinet créé. Vous pouvez maintenant vous connecter."
      : ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    fetch("/api/auth/db-check")
      .then((res) => (res.status === 503 ? res.json() : Promise.resolve(null)))
      .then((data) => data?.error && setDbConfigError(data.error))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setSuccess("Cabinet créé. Vous pouvez maintenant vous connecter.");
    }
  }, [searchParams]);

  function switchTab(tab: AuthTab) {
    if (tab === "signup") {
      // Inscription fermée — rediriger vers la page interstitielle
      router.push("/inscription-gate");
      return;
    }
    setActiveTab(tab);
    setError("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    const query = params.toString();
    router.replace(query ? `/connexion?${query}` : "/connexion");
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const res = await signInWithCredentialsClient({
      cabinetName,
      email,
      password,
      callbackUrl,
    });
    setLoading(false);
    if (!res.ok) {
      if (res.error === "network") {
        setError("Impossible de joindre le serveur. Vérifiez que l’app tourne (ex. npm run dev).");
        return;
      }
      setError("Nom du cabinet, courriel ou mot de passe incorrect.");
      return;
    }
    window.location.assign(callbackUrl);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          nom: signupNom,
          nomCabinet: signupCabinetName,
          adresseCabinet: signupAddress || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg =
          typeof data.error === "string"
            ? data.error
            : typeof data.error === "object" && data.error !== null
              ? Object.values(data.error)
                  .flat()
                  .filter(Boolean)
                  .join(". ") || "Erreur lors de l'inscription."
              : "Erreur lors de l'inscription.";
        setError(errMsg);
        return;
      }
      setCabinetName(signupCabinetName);
      setEmail(signupEmail);
      setPassword("");
      setSignupPassword("");
      setSuccess("Cabinet créé. Connectez-vous avec le nom du cabinet, votre courriel et votre mot de passe.");
      switchTab("signin");
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[480px] bg-surface rounded-[12px] border border-[0.5px] border-border p-6 shadow-sm sm:p-8">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-[24px] font-serif tracking-[-0.02em] text-text-primary mb-2">Bienvenue</h2>
        <p className="text-[14px] font-sans text-text-body">
          Accédez à votre espace de travail sécurisé
        </p>
      </div>

      <div className="mb-8 flex p-1 bg-surface-2 border border-border rounded-[8px]">
        <button
          type="button"
          onClick={() => switchTab("signin")}
          className={`flex-1 rounded-[6px] px-4 py-2 text-[13px] font-medium transition-all ${
            activeTab === "signin"
              ? "bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-border text-text-primary"
              : "text-text-muted hover:text-text-primary border border-transparent"
          }`}
        >
          Connexion
        </button>
        <button
          type="button"
          onClick={() => switchTab("signup")}
          className={`flex-1 rounded-[6px] px-4 py-2 text-[13px] font-medium transition-all ${
            activeTab === "signup"
               ? "bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-border text-text-primary"
               : "text-text-muted hover:text-text-primary border border-transparent"
          }`}
        >
          Inscription
        </button>
      </div>

      {dbConfigError && (
        <div className="mb-4 rounded-safe border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {dbConfigError}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-safe border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-safe border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {activeTab === "signin" ? (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="cabinetName" className="mb-1.5 block text-[13px] font-medium text-text-primary font-sans">
              Nom du cabinet
            </label>
            <input
              id="cabinetName"
              type="text"
              value={cabinetName}
              onChange={(e) => setCabinetName(e.target.value)}
              required
              placeholder="Ex. Cabinet SAFE"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-text-primary font-sans">
              Courriel
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nom@cabinet.ca"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-text-primary font-sans">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className={passwordInputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[6px] text-text-muted transition-colors hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[12px] text-text-subtle font-sans leading-[1.5] max-w-[240px]">
              Les employées se connectent avec le nom exact du cabinet, courriel et mot de passe.
            </p>
            <Link href="/forgot-password" className="text-[12px] text-forest-600 hover:text-forest-700 underline underline-offset-4 whitespace-nowrap ml-2">
              Oublié ?
            </Link>
          </div>
          <Button type="submit" className="h-11 w-full mt-2 bg-text-primary text-canvas hover:bg-black border-none">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="signupCabinetName" className="mb-1.5 block text-[13px] font-medium text-text-primary font-sans">
              Nom du cabinet
            </label>
            <input
              id="signupCabinetName"
              type="text"
              value={signupCabinetName}
              onChange={(e) => setSignupCabinetName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="signupAddress" className="mb-1.5 block text-[13px] font-medium text-text-primary font-sans">
              Adresse du cabinet
            </label>
            <input
              id="signupAddress"
              type="text"
              value={signupAddress}
              onChange={(e) => setSignupAddress(e.target.value)}
              placeholder="Optionnel"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="signupNom" className="mb-1.5 block text-[13px] font-medium text-text-primary font-sans">
              Nom de l'avocat responsable
            </label>
            <input
              id="signupNom"
              type="text"
              value={signupNom}
              onChange={(e) => setSignupNom(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="signupEmail" className="mb-1.5 block text-[13px] font-medium text-text-primary font-sans">
              Courriel
            </label>
            <input
              id="signupEmail"
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="signupPassword" className="mb-1.5 block text-[13px] font-medium text-text-primary font-sans">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="signupPassword"
                type={showSignupPassword ? "text" : "password"}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className={passwordInputClass}
              />
              <button
                type="button"
                onClick={() => setShowSignupPassword((value) => !value)}
                aria-label={showSignupPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                title={showSignupPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[6px] text-text-muted transition-colors hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                {showSignupPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>
          <Button type="submit" className="h-11 w-full mt-2 bg-text-primary text-canvas hover:bg-black border-none">
            {loading ? "Création..." : "Créer le cabinet"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[480px] bg-surface rounded-[12px] border border-[0.5px] border-border p-8">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-surface-2 animate-pulse" />
          <div className="mx-auto mb-2 h-8 w-32 rounded bg-surface-2 animate-pulse" />
          <div className="mx-auto mb-6 h-4 w-60 rounded bg-surface-2 animate-pulse" />
          <div className="mb-6 h-11 rounded-full bg-surface-2 animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-24 rounded bg-surface-2 animate-pulse" />
            <div className="h-11 rounded-safe bg-surface-2 animate-pulse" />
            <div className="h-4 w-24 rounded bg-surface-2 animate-pulse" />
            <div className="h-11 rounded-safe bg-surface-2 animate-pulse" />
            <div className="h-4 w-28 rounded bg-surface-2 animate-pulse" />
            <div className="h-11 rounded-safe bg-surface-2 animate-pulse" />
            <div className="mt-2 h-11 rounded-safe bg-text-muted/20 animate-pulse" />
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
