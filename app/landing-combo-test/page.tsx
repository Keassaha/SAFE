import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock3, FolderCheck, ReceiptText } from "lucide-react";

export const metadata: Metadata = {
  title: "SAFE | Le cabinet, enfin dans le même sens",
  description:
    "Une exploration visuelle de SAFE, le logiciel de gestion conçu pour les cabinets juridiques.",
};

const signals = [
  { value: "9:12", label: "Le temps de Me Beaulieu est saisi", icon: Clock3 },
  { value: "Prêt", label: "Le dossier Tremblay peut être facturé", icon: FolderCheck },
  { value: "0 écart", label: "Le compte en fidéicommis est rapproché", icon: ReceiptText },
];

export default function LandingComboTestPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f0df] text-[#102b21]">
      <nav className="relative z-20 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="font-serif text-[32px] leading-none tracking-[-0.04em]">
          SAFE
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="#journee" className="transition-opacity hover:opacity-60">
            Une journée avec SAFE
          </a>
          <a href="#methode" className="transition-opacity hover:opacity-60">
            Notre méthode
          </a>
        </div>

        <Link
          href="/audit-gratuit"
          className="rounded-full bg-[#153f31] px-5 py-3 text-sm font-semibold text-[#fffaf0] transition-transform hover:-translate-y-0.5"
        >
          Voir mon cabinet autrement
        </Link>
      </nav>

      <section className="relative mx-auto grid min-h-[760px] max-w-[1440px] items-center gap-6 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:px-12 lg:pb-24 lg:pt-8">
        <div className="relative z-10 max-w-[620px]">
          <p className="mb-6 inline-flex rotate-[-2deg] items-center rounded-full bg-[#efb34d] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#17362b]">
            Conçu au Québec pour les cabinets d’ici
          </p>
          <h1 className="font-serif text-[clamp(4.2rem,8vw,8.4rem)] leading-[0.78] tracking-[-0.055em]">
            Votre cabinet
            <span className="ml-[0.18em] block italic text-[#c7644f]">respire.</span>
          </h1>
          <p className="mt-9 max-w-[530px] text-lg leading-7 text-[#355348] sm:text-xl">
            Les dossiers, le temps, la facturation et la conformité avancent enfin
            ensemble. Vous gardez le jugement. SAFE remet le reste dans le bon ordre.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link
              href="/audit-gratuit"
              className="group inline-flex items-center gap-3 rounded-full bg-[#102b21] px-7 py-4 font-semibold text-[#fffaf0] transition-transform hover:-translate-y-0.5"
            >
              Faire le point gratuitement
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <span className="max-w-[190px] text-xs leading-5 text-[#5d746a]">
              20 minutes. Aucun engagement. Une réponse claire sur votre organisation.
            </span>
          </div>
        </div>

        <div className="relative -mx-8 mt-6 lg:-mr-40 lg:ml-[-12%] lg:mt-0">
          <div
            className="absolute left-[8%] top-[12%] h-[72%] w-[78%] rotate-2 rounded-[48%_52%_45%_55%/57%_43%_57%_43%] bg-[#dce6c7]"
            aria-hidden="true"
          />
          <Image
            src="/images/landing-test/safe-editorial-hero.png"
            alt="Une avocate transforme des documents éparpillés en un espace de travail organisé."
            width={1792}
            height={1024}
            priority
            className="relative h-auto w-full mix-blend-multiply"
          />
          <div className="absolute bottom-[4%] left-[8%] hidden -rotate-3 rounded-2xl border-2 border-[#17362b] bg-[#fff8e9] px-5 py-4 shadow-[5px_5px_0_#17362b] sm:block">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#c7644f]">
              Aujourd’hui
            </p>
            <p className="mt-1 font-serif text-2xl">Tout est à sa place.</p>
          </div>
        </div>
      </section>

      <section id="journee" className="bg-[#173c30] px-5 py-24 text-[#f8f0df] sm:px-8 lg:py-32">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#efb34d]">
                Mardi, 9 h 12
              </p>
              <h2 className="mt-5 max-w-[9ch] font-serif text-5xl leading-[0.95] tracking-[-0.035em] sm:text-7xl">
                Le cabinet a déjà une longueur d’avance.
              </h2>
            </div>

            <div className="border-t border-[#f8f0df]/25">
              {signals.map(({ value, label, icon: Icon }, index) => (
                <div
                  key={label}
                  className="grid grid-cols-[52px_1fr_auto] items-center gap-4 border-b border-[#f8f0df]/25 py-7 sm:grid-cols-[64px_1fr_auto]"
                >
                  <span className="font-mono text-xs text-[#a9c4b2]">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="font-serif text-3xl text-[#fff8e9] sm:text-4xl">
                      {value}
                    </p>
                    <p className="mt-1 text-sm text-[#b8c9c0]">{label}</p>
                  </div>
                  <span className="grid size-11 place-items-center rounded-full bg-[#dce6c7] text-[#173c30]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="methode" className="relative bg-[#e6a64b] px-5 py-24 sm:px-8 lg:py-32">
        <div
          className="absolute right-[-80px] top-[-60px] size-56 rotate-12 rounded-[42%_58%_65%_35%] border-[38px] border-[#c7644f]/55"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1240px]">
          <p className="text-xs font-bold uppercase tracking-[0.15em]">
            La différence SAFE
          </p>
          <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <h2 className="max-w-[13ch] font-serif text-5xl leading-[0.94] tracking-[-0.035em] sm:text-7xl">
              Moins de logiciel. Plus de cabinet.
            </h2>
            <p className="max-w-[520px] text-lg leading-7 text-[#29473b]">
              SAFE ne vous demande pas d’adapter votre pratique à une usine à écrans.
              Nous partons de votre vraie façon de travailler, puis nous retirons les
              doubles saisies, les vérifications répétitives et les suivis qui vivent
              encore dans la tête de quelqu’un.
            </p>
          </div>

          <div className="mt-16 grid overflow-hidden rounded-[34px] border-2 border-[#17362b] bg-[#fff8e9] lg:grid-cols-3">
            {[
              ["Préparer", "SAFE rassemble ce qui doit être prêt avant que vous le demandiez."],
              ["Signaler", "Les écarts et les échéances ressortent au bon moment, sans bruit."],
              ["Valider", "Votre équipe garde la décision sur chaque geste qui compte."],
            ].map(([title, copy], index) => (
              <div
                key={title}
                className="border-[#17362b] p-8 lg:border-l-2 lg:first:border-l-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">0{index + 1}</span>
                  <Check className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-16 font-serif text-4xl">{title}</h3>
                <p className="mt-4 max-w-[30ch] leading-6 text-[#486156]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#c7644f] px-5 py-24 text-[#fff8e9] sm:px-8 lg:py-32">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#f8dca9]">
              Et si le problème n’était pas votre équipe ?
            </p>
            <h2 className="mt-5 max-w-[11ch] font-serif text-5xl leading-[0.94] tracking-[-0.035em] sm:text-7xl">
              Voyons ce que votre système lui demande de porter.
            </h2>
          </div>
          <Link
            href="/audit-gratuit"
            className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-[#fff8e9] px-7 py-4 font-semibold text-[#17362b] transition-transform hover:-translate-y-0.5"
          >
            Commencer l’audit
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

      <footer className="flex flex-col gap-4 bg-[#102b21] px-5 py-8 text-sm text-[#a9c4b2] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p>SAFE Inc. Montréal, Québec</p>
        <p>Une exploration visuelle, pas une page de production.</p>
      </footer>
    </main>
  );
}
