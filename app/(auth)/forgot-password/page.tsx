"use client";

import { useState } from "react";
import { SafeLogo } from "@/components/branding/SafeLogo";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const inputClass =
  "w-full h-11 rounded-safe border border-white/35 bg-white/78 px-4 text-sm text-neutral-text-primary placeholder:text-neutral-muted outline-none transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/25";

export default function ForgotPasswordPage() {
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
        setError(data.error || "Erreur");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <SafeLogo className="mx-auto mb-4" />
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-neutral-text-primary">
                Email envoyé
              </h2>
              <p className="text-sm text-neutral-muted">
                Si un compte existe avec cet email, vous recevrez un lien de
                réinitialisation dans quelques minutes.
              </p>
              <Link href="/connexion">
                <Button variant="secondary" className="mt-4">
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-neutral-text-primary mb-2">
                Mot de passe oublié
              </h2>
              <p className="text-sm text-neutral-muted mb-6">
                Entrez votre email et le nom de votre cabinet pour recevoir un
                lien de réinitialisation.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-text-primary mb-1">
                    Nom du cabinet
                  </label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Cabinet Tremblay"
                    value={cabinetName}
                    onChange={(e) => setCabinetName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-text-primary mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Envoi..." : "Envoyer le lien"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  href="/connexion"
                  className="text-sm text-primary-600 hover:underline"
                >
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
