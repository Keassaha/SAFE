"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { SafeLogo } from "@/components/branding/SafeLogo";
import { Button } from "@/components/ui/Button";

const inputClass =
  "w-full h-11 rounded-safe border border-white/35 bg-white/78 px-4 text-sm text-neutral-text-primary placeholder:text-neutral-muted outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25";

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
  const [signupNom, setSignupNom] = useState("");
  const [signupCabinetName, setSignupCabinetName] = useState("");
  const [signupAddress, setSignupAddress] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
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
    setActiveTab(tab);
    setError("");
    if (tab === "signup") {
      setSuccess("");
    }
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "signup") {
      params.set("tab", "signup");
      params.delete("registered");
    } else {
      params.delete("tab");
    }
    const query = params.toString();
    router.replace(query ? `/connexion?${query}` : "/connexion");
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const res = await signIn("credentials", {
      cabinetName,
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Nom du cabinet, courriel ou mot de passe incorrect.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
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
    <div className="auth-card mx-auto w-full max-w-[520px] overflow-hidden border border-white/25 p-6 shadow-2xl md:p-8">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <SafeLogo variant="light" className="w-[170px]" />
        </div>
        <p className="mt-2 text-sm text-neutral-text-secondary">
          Accédez à votre espace de travail sécurisé
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 rounded-full bg-white/45 p-1 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => switchTab("signin")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTab === "signin"
              ? "bg-primary-700 text-white shadow-sm"
              : "text-neutral-text-secondary hover:text-primary-800"
          }`}
        >
          Connexion
        </button>
        <button
          type="button"
          onClick={() => switchTab("signup")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeTab === "signup"
              ? "bg-primary-700 text-white shadow-sm"
              : "text-neutral-text-secondary hover:text-primary-800"
          }`}
        >
          Inscription
        </button>
      </div>

      {dbConfigError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {dbConfigError}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {activeTab === "signin" ? (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="cabinetName" className="mb-1 block text-sm font-medium text-neutral-700">
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
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
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
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <p className="text-xs text-neutral-600">
            Les employées se connectent avec le nom exact du cabinet, leur courriel et leur mot de passe.
          </p>
          <Button type="submit" className="h-11 w-full bg-primary-700 hover:bg-primary-800">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="signupCabinetName" className="mb-1 block text-sm font-medium text-neutral-700">
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
            <label htmlFor="signupAddress" className="mb-1 block text-sm font-medium text-neutral-700">
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
            <label htmlFor="signupNom" className="mb-1 block text-sm font-medium text-neutral-700">
              Nom de l&apos;avocat responsable
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
            <label htmlFor="signupEmail" className="mb-1 block text-sm font-medium text-neutral-700">
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
            <label htmlFor="signupPassword" className="mb-1 block text-sm font-medium text-neutral-700">
              Mot de passe
            </label>
            <input
              id="signupPassword"
              type="password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              minLength={8}
              required
              className={inputClass}
            />
          </div>
          <Button type="submit" className="h-11 w-full">
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
        <div className="auth-card mx-auto w-full max-w-[520px] rounded-2xl p-8">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-white/20 animate-pulse" />
          <div className="mx-auto mb-2 h-8 w-32 rounded bg-white/30 animate-pulse" />
          <div className="mx-auto mb-6 h-4 w-60 rounded bg-white/20 animate-pulse" />
          <div className="mb-6 h-11 rounded-full bg-white/20 animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-24 rounded bg-white/20 animate-pulse" />
            <div className="h-11 rounded-xl bg-white/25 animate-pulse" />
            <div className="h-4 w-24 rounded bg-white/20 animate-pulse" />
            <div className="h-11 rounded-xl bg-white/25 animate-pulse" />
            <div className="h-4 w-28 rounded bg-white/20 animate-pulse" />
            <div className="h-11 rounded-xl bg-white/25 animate-pulse" />
            <div className="mt-2 h-11 rounded-xl bg-white/30 animate-pulse" />
          </div>
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
