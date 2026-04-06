"use client";

import Link from "next/link";
import { Users, Clock, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function StyleGuidePage() {
  return (
    <div className="min-h-screen bg-neutral-page">
      {/* Top bar — design system preview */}
      <header className="safe-glass-topbar sticky top-0 z-10 border-b border-neutral-border/50 h-14 flex items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold text-primary-800">
          SAFE
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-neutral-muted hover:text-primary-800 transition-colors"
          >
            Retour à l&apos;app
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        <section>
          <h1 className="text-3xl font-bold text-neutral-text-primary tracking-tight mb-2">
            SAFE Design System
          </h1>
          <p className="text-neutral-muted text-lg">
            Guide de style et composants — LegalTech. Minimal, premium, calme.
          </p>
        </section>

        {/* Buttons — Design system: Primary (1 par section), Secondary (outline), Tertiary (texte) */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-text-primary border-b border-neutral-border pb-2 tracking-tight">
            Boutons
          </h2>
          <p className="text-sm text-neutral-muted">
            Primary : action principale. Secondary : contour, action alternative. Tertiary : texte seul. Danger : action destructive.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primaire</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="tertiary">Tertiaire</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-text-primary border-b border-neutral-border pb-2 tracking-tight">
            Champs de formulaire
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-text-secondary">
                Texte
              </label>
              <input
                type="text"
                placeholder="Placeholder"
                className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 backdrop-blur-sm text-neutral-text-primary placeholder:text-neutral-muted focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-text-secondary">
                Recherche
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted" aria-hidden>
                  🔍
                </span>
                <input
                  type="search"
                  placeholder="Search for clients, cases, invoices…"
                  className="w-full h-10 pl-9 pr-3 rounded-safe border-0 bg-white/60 backdrop-blur-md text-neutral-text-primary placeholder:text-neutral-muted focus:ring-2 focus:ring-primary-500/30 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-text-secondary">
                Select
              </label>
              <select
                className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all"
              >
                <option>Option A</option>
                <option>Option B</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-text-secondary">
                Date
              </label>
              <input
                type="date"
                className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-text-secondary">
              Textarea
            </label>
            <textarea
              rows={3}
              placeholder="Description…"
              className="w-full px-3 py-2 rounded-safe border border-neutral-border bg-white/90 backdrop-blur-sm text-neutral-text-primary placeholder:text-neutral-muted focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all resize-y min-h-[80px]"
            />
          </div>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-text-primary border-b border-neutral-border pb-2 tracking-tight">
            Cartes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-safe-md bg-white/80 backdrop-blur-md border border-white/50 shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-border">
                <h3 className="text-lg font-semibold text-neutral-text-primary tracking-tight">Standard</h3>
              </div>
              <div className="p-6">
                <p className="text-neutral-muted text-sm">
                  Carte standard avec bordure et ombre douce.
                </p>
              </div>
            </div>
            <div className="rounded-safe-md safe-glass-panel border border-white/40 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-border/50">
                <h3 className="text-lg font-semibold text-neutral-text-primary tracking-tight">Glass</h3>
              </div>
              <div className="p-6">
                <p className="text-neutral-muted text-sm">
                  Effet verre : flou + transparence.
                </p>
              </div>
            </div>
            <div className="rounded-safe-md bg-white/80 backdrop-blur-md border border-white/50 shadow-md overflow-hidden">
              <div className="p-6">
                <p className="text-sm font-medium text-neutral-muted mb-1">KPI</p>
                <p className="text-2xl font-semibold text-primary-800">124</p>
                <p className="text-neutral-muted text-sm mt-1">Clients</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sidebar + Topbar preview */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-text-primary border-b border-neutral-border pb-2 tracking-tight">
            Barre latérale & barre supérieure
          </h2>
          <div className="flex rounded-safe-lg overflow-hidden shadow-lg border border-neutral-border">
            <aside className="w-sidebar min-h-[280px] safe-glass-sidebar bg-gradient-to-b from-primary-900 via-primary-800 to-primary-700 flex flex-col py-4">
              <div className="px-4 pb-4 border-b border-white/10">
                <span className="text-lg font-semibold text-white">SAFE</span>
              </div>
              <nav className="flex-1 p-2 space-y-1 mt-2">
                {["Dashboard", "Clients", "Cases", "Time Tracking", "Invoices"].map((label, i) => (
                  <div
                    key={label}
                    className={`px-3 py-2 rounded-safe-sm text-sm ${
                      i === 0 ? "bg-primary-700/90 text-white" : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </nav>
              <div className="px-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                  <div>
                    <p className="text-sm font-medium text-white">Utilisateur</p>
                    <p className="text-xs text-white/70">Profil</p>
                  </div>
                </div>
              </div>
            </aside>
            <div className="flex-1 bg-neutral-surface min-h-[280px] flex flex-col">
              <div className="safe-glass-topbar h-14 flex items-center px-6 border-b border-neutral-border/50">
                <div className="flex-1 max-w-md">
                  <input
                    type="search"
                    placeholder="Search for clients, cases, invoices…"
                    className="w-full h-9 px-3 rounded-safe-sm bg-white/60 backdrop-blur-md text-sm placeholder:text-neutral-muted border-0 focus:ring-2 focus:ring-primary-500/30 outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button type="button" className="w-9 h-9 rounded-safe-sm flex items-center justify-center hover:bg-black/5 text-neutral-muted">
                    +
                  </button>
                  <div className="w-8 h-8 rounded-full bg-primary-200" />
                  <div className="w-8 h-8 rounded-full bg-accent-200" />
                </div>
              </div>
              <div className="p-4 flex-1">
                <p className="text-sm text-neutral-muted">Zone de contenu principale</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tables */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-text-primary border-b border-neutral-border pb-2 tracking-tight">
            Tableaux
          </h2>
          <div className="rounded-safe-lg overflow-hidden border border-neutral-border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-neutral-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-muted uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-muted uppercase tracking-wider">
                      Dossier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-muted uppercase tracking-wider">
                      Montant
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border">
                  {[
                    { client: "Martin & Associés", dossier: "Dupont c. XYZ", montant: "2 450 $" },
                    { client: "Cabinet Lefebvre", dossier: "Contrat 2024", montant: "1 200 $" },
                    { client: "Société ABC", dossier: "Litige commercial", montant: "5 800 $" },
                  ].map((row, i) => (
                    <tr
                      key={i}
                      className={`hover:bg-neutral-surface transition-colors ${
                        i % 2 === 1 ? "bg-neutral-surface/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-neutral-text-primary">{row.client}</td>
                      <td className="px-4 py-3 text-sm text-neutral-text-secondary">{row.dossier}</td>
                      <td className="px-4 py-3 text-sm font-medium text-neutral-text-primary">{row.montant}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-text-primary border-b border-neutral-border pb-2 tracking-tight">
            Badges & statuts
          </h2>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full px-3 py-0.5 text-xs font-medium bg-neutral-surface text-neutral-text-secondary">
              Default
            </span>
            <span className="rounded-full px-3 py-0.5 text-xs font-medium bg-status-success-bg text-status-success">
              Payé
            </span>
            <span className="rounded-full px-3 py-0.5 text-xs font-medium bg-status-warning-bg text-status-warning">
              En attente
            </span>
            <span className="rounded-full px-3 py-0.5 text-xs font-medium bg-status-error-bg text-status-error">
              Refusé
            </span>
            <span className="rounded-full px-3 py-0.5 text-xs font-medium text-status-overdue">
              En retard
            </span>
          </div>
        </section>

        {/* Charts placeholders */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-text-primary border-b border-neutral-border pb-2 tracking-tight">
            Graphiques (placeholders)
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-safe-md bg-white/80 backdrop-blur-md border border-white/50 shadow-md p-6">
              <h3 className="text-sm font-medium text-neutral-muted mb-4 tracking-tight">Donut</h3>
              <div className="h-40 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full border-8 border-primary-600 border-t-primary-300" />
              </div>
              <p className="text-center text-sm text-neutral-muted mt-2">Billable Hours</p>
            </div>
            <div className="rounded-safe-md bg-white/80 backdrop-blur-md border border-white/50 shadow-md p-6">
              <h3 className="text-sm font-medium text-neutral-muted mb-4 tracking-tight">Barres / Ligne</h3>
              <div className="h-40 flex items-end justify-around gap-2 px-4">
                {[40, 65, 45, 80, 55, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-primary-700 to-primary-400 max-w-[40px]"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="text-center text-sm text-neutral-muted mt-2">Trust Account</p>
            </div>
          </div>
        </section>

        {/* Onboarding components */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-text-primary border-b border-neutral-border pb-2 tracking-tight">
            Onboarding
          </h2>
          <div className="rounded-safe-lg overflow-hidden bg-gradient-to-br from-primary-50 to-accent-50/30 p-8 md:p-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-neutral-text-primary mb-2 tracking-tight">
                Welcome to SAFE
              </h3>
              <p className="text-neutral-muted max-w-xl mx-auto">
                Your secure legal accounting workspace to manage clients, cases, and finances seamlessly.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                { title: "Add Clients", desc: "Create and manage client profiles.", Icon: Users },
                { title: "Track Billable Hours", desc: "Log time per case with rates.", Icon: Clock },
                { title: "Generate Invoices", desc: "Create professional invoices.", Icon: FileText },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-safe-md bg-white/90 backdrop-blur-sm border border-white/60 shadow-md p-6 flex gap-4"
                >
                  <div className="w-10 h-10 rounded-safe-sm bg-primary-800 flex items-center justify-center text-white shrink-0">
                    <card.Icon className="w-6 h-6" aria-hidden />
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary-800 tracking-tight">{card.title}</h4>
                    <p className="text-sm text-neutral-muted mt-1">{card.desc}</p>
                  </div>
                  <span className="ml-auto w-5 h-5 rounded-full bg-accent-400 flex items-center justify-center text-white" aria-hidden>
                    <Check className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4">
              <Button className="px-6 py-3 flex items-center gap-2">
                Get Started <span aria-hidden>→</span>
              </Button>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              <span className="w-2 h-2 rounded-full bg-primary-600" aria-hidden />
              <span className="w-2 h-2 rounded-full border-2 border-neutral-border bg-transparent" aria-hidden />
              <span className="w-2 h-2 rounded-full border-2 border-neutral-border bg-transparent" aria-hidden />
            </div>
          </div>
        </section>

        {/* Hero card (Trust balance style) */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-text-primary border-b border-neutral-border pb-2 tracking-tight">
            Carte héro (Trust Balance)
          </h2>
          <div className="rounded-safe-lg overflow-hidden safe-glass-panel bg-gradient-hero-trust border border-white/20 min-h-[140px] flex flex-col justify-between p-6">
            <div>
              <p className="text-white/90 text-sm font-medium">Trust Balance</p>
              <p className="text-3xl font-bold text-white mt-1">9 245,50 $</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-safe bg-primary-700 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                Checking
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-safe bg-accent-500 text-white text-sm font-medium hover:bg-accent-400 transition-colors"
              >
                Savings
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
