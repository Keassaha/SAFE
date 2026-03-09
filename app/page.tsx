import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SafeLogo } from "@/components/branding/SafeLogo";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

const featureCards = [
  {
    title: "Gain de temps operationnel",
    description:
      "SAFE automatise les etapes repetitives entre la fiche de temps, la preparation et l'emission des factures.",
    bullets: ["Moins de saisie manuelle", "Moins d'aller-retour", "Plus de temps pour les dossiers"],
    icon: FolderOpen,
  },
  {
    title: "Reduction des erreurs",
    description:
      "Les montants, heures facturees et elements de facturation sont consolides plus proprement a partir des fiches de temps.",
    bullets: ["Facturation plus fiable", "Moins d'oublis", "Meilleure coherence des donnees"],
    icon: Clock3,
  },
  {
    title: "Vitesse d'execution",
    description:
      "Passez plus vite de l'enregistrement du temps a une facture prete a etre validee et envoyee.",
    bullets: ["Execution rapide", "Cycle de facturation accelere", "Suivi en temps reel"],
    icon: BarChart3,
  },
] as const;

const steps = [
  {
    title: "Créez votre cabinet",
    description: "Ajoutez le nom du cabinet, configurez votre compte principal et ouvrez votre espace SAFE.",
  },
  {
    title: "Ajoutez vos clients et dossiers",
    description: "Centralisez les dossiers juridiques, les contacts clients et les informations essentielles.",
  },
  {
    title: "Enregistrez vos heures",
    description: "Suivez les heures facturables par dossier, par avocat et par activité.",
  },
  {
    title: "Facturez et analysez",
    description: "Générez vos factures et suivez la santé financière du cabinet dans un seul tableau de bord.",
  },
] as const;

const trustItems = [
  "SAFE, systeme automatise de facturation et d'exploitation",
  "Adapté aux cabinets de 1 a 5 avocats",
  "Securite des donnees et espace dedie par cabinet",
  "Automatisation de la facture a partir d'une fiche de temps",
] as const;

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-neutral-page safe-landing-glow">
      <header className="border-b border-neutral-border safe-glass-topbar">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary-500/30">
            <SafeLogo variant="light" className="w-[150px] sm:w-[180px]" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/connexion"
              className="text-sm font-medium text-neutral-muted transition hover:text-primary-800"
            >
              Connexion
            </Link>
            <Link href="/connexion?tab=signup">
              <Button>Créer votre cabinet</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-16 px-4 py-12 md:gap-24 md:py-20">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-800">
              <BriefcaseBusiness className="h-4 w-4" aria-hidden />
              SAFE, systeme automatise de facturation et d&apos;exploitation
            </div>

            <h1 className="mb-6 text-4xl font-semibold tracking-tight text-neutral-text-primary md:text-5xl">
              Generez vos factures automatiquement a partir des fiches de temps
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-8 text-neutral-muted">
              SAFE aide les cabinets juridiques a gagner du temps, reduire les erreurs
              de facturation et executer plus vite, en transformant les fiches de temps
              en factures prêtes a valider dans un seul systeme.
            </p>

            <div className="mb-8 flex flex-wrap gap-4">
              <Link href="/connexion?tab=signup">
                <Button className="px-6 py-3">Creer votre cabinet</Button>
              </Link>
              <Link href="/onboarding">
                <Button variant="secondary" className="px-6 py-3">
                  Voir l&apos;automatisation
                </Button>
              </Link>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {[
                { value: "-22 h", label: "de travail administratif / mois" },
                { value: "-98 %", label: "d'erreurs de saisie ciblees" },
                { value: "2 min", label: "pour produire une facture" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-2xl bg-white/75 p-4 shadow-sm ring-1 ring-neutral-border/60">
                  <p className="text-2xl font-semibold text-primary-800">{metric.value}</p>
                  <p className="mt-1 text-sm leading-5 text-neutral-muted">{metric.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 text-sm text-neutral-muted sm:grid-cols-2">
              {trustItems.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" aria-hidden />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="card-glass overflow-hidden rounded-[28px] border border-white/50 p-4 shadow-2xl">
              <Image
                src="/safe-hero-dashboard.png"
                alt="Apercu premium de SAFE montrant la generation automatique de factures a partir des fiches de temps"
                width={1200}
                height={675}
                className="h-auto w-full rounded-[22px] object-cover shadow-lg"
                priority
                unoptimized
              />
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary-800">
              Pourquoi SAFE se demarque
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-text-primary">
              L&apos;avantage concurrentiel: la facture automatique a partir d&apos;une fiche de temps
            </h2>
            <p className="mt-3 text-base leading-7 text-neutral-muted">
              SAFE ne se contente pas de stocker vos donnees. Il automatise le passage
              du temps enregistre vers une facture exploitable, pour un cabinet plus rapide,
              plus fiable et plus rentable.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <Card key={feature.title} className="safe-hover-lift">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-800">
                    <feature.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-primary-800">{feature.title}</h3>
                  <p className="mb-4 text-sm leading-6 text-neutral-muted">
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    {feature.bullets.map((bullet) => (
                      <div key={bullet} className="flex items-start gap-2 text-sm text-neutral-text-primary">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" aria-hidden />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="card-glass overflow-hidden rounded-[28px] border border-white/50 p-4 shadow-xl">
              <Image
                src="/safe-automation-flow.png"
                alt="Schema montrant la conversion d'une fiche de temps en facture automatiquement dans SAFE"
                width={1200}
                height={675}
                className="h-auto w-full rounded-[22px] object-cover"
                unoptimized
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary-800">
              Automatisation concrete
            </p>
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-neutral-text-primary">
              De la fiche de temps a la facture, sans friction inutile
            </h2>
            <p className="mb-6 text-base leading-7 text-neutral-muted">
              Une fois les heures saisies, SAFE structure l&apos;information pour accelerer
              la preparation de la facture. Le cabinet gagne en vitesse d&apos;execution,
              tout en reduisant les oublis et les erreurs humaines.
            </p>

            <div className="space-y-3">
              {[
                "Les heures facturees sont centralisees plus rapidement",
                "La preparation de la facture devient plus coherente",
                "Le cabinet emet plus vite et suit mieux sa performance",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-4 shadow-sm ring-1 ring-neutral-border/60">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" aria-hidden />
                  <p className="text-sm leading-6 text-neutral-text-primary">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary-800">
              Comment ca marche
            </p>
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-neutral-text-primary">
              Passez de la creation du cabinet a la facturation en quelques etapes
            </h2>
            <p className="max-w-xl text-base leading-7 text-neutral-muted">
              SAFE vous guide de la configuration initiale jusqu&apos;au suivi de la
              performance du cabinet, sans complexite inutile.
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="card-glass flex gap-4 rounded-2xl border border-white/50 p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-700 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-text-primary">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-neutral-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-primary-900 px-6 py-10 text-white shadow-2xl md:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
                Confiance et credibilite
              </p>
              <h2 className="mb-4 text-3xl font-semibold tracking-tight">
                Faites confiance a un systeme qui transforme vos fiches de temps en execution plus rapide
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "Gestion des dossiers",
                  "Gestion des heures facturables",
                  "Rapports financiers",
                  "Securite des donnees",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-white/88">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/connexion?tab=signup">
                <Button className="w-full px-6 py-3">Essayer SAFE gratuitement</Button>
              </Link>
              <Link href="/onboarding">
                <Button variant="secondary" className="w-full px-6 py-3">
                  Voir le parcours SAFE
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-border bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-neutral-muted md:flex-row md:items-center md:justify-between">
          <div>
            <SafeLogo variant="light" className="mb-3 w-[130px]" />
            <p>Systeme automatise de facturation et d&apos;exploitation pour cabinets juridiques.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <span>Securite des donnees</span>
            <span>Support</span>
            <span>Politique de confidentialite</span>
            <span>Conditions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
