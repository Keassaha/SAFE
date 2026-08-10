import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileCheck2,
  Files,
  FolderKanban,
  History,
  Inbox,
  LayoutDashboard,
  ReceiptText,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SafeMark } from "@/components/branding/SafeLogo";
import styles from "../safe-linear-visual.module.css";

const attention = [
  {
    tone: "gold",
    label: "À valider avant 11 h",
    title: "Projet de facture · Dossier Tremblay",
    meta: "6 850,00 $ · 32,7 h · préparée par Marie B.",
  },
  {
    tone: "red",
    label: "Échéance dans 2 jours",
    title: "Produire les pièces P-8 à P-12",
    meta: "Succession Lavoie · Cour supérieure",
  },
  {
    tone: "green",
    label: "Prêt pour révision",
    title: "Mise en demeure · Hydro-Québec",
    meta: "Version 3 · commentaires de Jean G.",
  },
];

const day = [
  {
    time: "09:30",
    title: "Audience de gestion",
    detail: "Tremblay c. Services Nord · Salle 3.12",
    tag: "Palais de justice",
  },
  {
    time: "11:00",
    title: "Révision avec Me Gauthier",
    detail: "Stratégie · Succession Lavoie",
    tag: "30 min",
  },
  {
    time: "16:00",
    title: "Délai interne",
    detail: "Autoriser la facture du dossier Tremblay",
    tag: "Aujourd’hui",
  },
];

const nav = [
  { icon: LayoutDashboard, label: "Vue d’ensemble", active: true },
  { icon: Inbox, label: "Boîte de réception", count: "3" },
  { icon: FolderKanban, label: "Dossiers" },
  { icon: Clock3, label: "Temps et dépenses" },
  { icon: CalendarDays, label: "Échéances" },
  { icon: Files, label: "Documents" },
  { icon: ReceiptText, label: "Facturation" },
  { icon: ShieldCheck, label: "Fidéicommis" },
];

export default function SafePrincipalDashboardPage() {
  return (
    <main className={styles.stage}>
      <div className={styles.app}>
        <aside className={styles.sidebar}>
          <div className={styles.dashboardBrand}>
            <span>
              <SafeMark size={22} tone="light" />
            </span>
            <div>
              <strong>SAFE</strong>
              <small>Lebeau & Associés</small>
            </div>
            <ChevronDown size={14} />
          </div>

          <nav className={styles.dashboardNav}>
            <p>Cabinet</p>
            {nav.slice(0, 2).map(({ icon: Icon, label, active, count }) => (
              <div key={label} className={`${styles.navItem} ${active ? styles.active : ""}`}>
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
                {count && <b>{count}</b>}
              </div>
            ))}
            <p>Travail</p>
            {nav.slice(2, 6).map(({ icon: Icon, label }) => (
              <div key={label} className={styles.navItem}>
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
              </div>
            ))}
            <p>Finances</p>
            {nav.slice(6).map(({ icon: Icon, label }) => (
              <div key={label} className={styles.navItem}>
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
              </div>
            ))}
          </nav>

          <div className={styles.sidebarBottom}>
            <div className={styles.navItem}>
              <Users size={17} />
              <span>Équipe</span>
            </div>
          </div>
        </aside>

        <section className={styles.workspace}>
          <header className={styles.topbar}>
            <div>
              Vue d’ensemble
              <ChevronDown size={14} />
            </div>
            <button>
              <Search size={16} />
              Rechercher
              <kbd>⌘ K</kbd>
            </button>
            <span className={styles.user}>SL</span>
          </header>

          <div className={styles.dashboardCanvas}>
            <div className={styles.dashboardEngraved} aria-hidden="true">
              <span className={styles.embossHighlight}>
                <SafeMark size={430} tone="mono-light" />
              </span>
              <span className={styles.embossShadow}>
                <SafeMark size={430} tone="light" />
              </span>
              <span className={styles.embossFace}>
                <SafeMark size={430} tone="light" />
              </span>
            </div>

            <div className={styles.dashboardHeading}>
              <div>
                <p>Vendredi 24 juillet</p>
                <h1>Bonjour Sophie.</h1>
                <span>Trois décisions demandent votre attention aujourd’hui.</span>
              </div>
              <button>
                <Clock3 size={16} />
                Saisir du temps
              </button>
            </div>

            <section className={styles.executiveNumbers}>
              <article>
                <span>Revenus encaissés · juillet</span>
                <strong>42 680 $</strong>
                <p>
                  <b>+12 %</b> par rapport à juin
                </p>
              </article>
              <article>
                <span>Dépenses · juillet</span>
                <strong>14 920 $</strong>
                <p>Salaires, débours et exploitation</p>
              </article>
              <article className={styles.resultNumber}>
                <span>Résultat d’exploitation</span>
                <strong>27 760 $</strong>
                <p>
                  <b>65 %</b> de marge ce mois-ci
                </p>
              </article>
              <article>
                <span>Sommes à recevoir</span>
                <strong>24 850 $</strong>
                <p>4 factures, dont 1 en retard</p>
              </article>
            </section>

            <div className={styles.dashboardGrid}>
              <section className={styles.attentionPanel}>
                <header>
                  <div>
                    <span className={styles.attentionDot} />
                    <h2>À votre attention</h2>
                  </div>
                  <span>3 éléments</span>
                </header>
                <div className={styles.attentionList}>
                  {attention.map((item) => (
                    <article key={item.title}>
                      <span className={`${styles.signal} ${styles[item.tone]}`}>
                        {item.tone === "red" ? (
                          <AlertCircle size={15} />
                        ) : item.tone === "green" ? (
                          <FileCheck2 size={15} />
                        ) : (
                          <ReceiptText size={15} />
                        )}
                      </span>
                      <div>
                        <p>{item.label}</p>
                        <h3>{item.title}</h3>
                        <span>{item.meta}</span>
                      </div>
                      <button aria-label={`Ouvrir ${item.title}`}>
                        <ArrowRight size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.dayPanel}>
                <header>
                  <div>
                    <CalendarDays size={17} />
                    <h2>Votre journée</h2>
                  </div>
                  <button>Calendrier</button>
                </header>
                <div className={styles.timeline}>
                  {day.map((item, index) => (
                    <article key={item.time}>
                      <time>{item.time}</time>
                      <span className={index === 0 ? styles.currentPoint : ""} />
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.detail}</p>
                        <small>{item.tag}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.practiceBar}>
                <div className={styles.trustMetric}>
                  <span>Fidéicommis</span>
                  <strong>
                    <Check size={16} />
                    Rapproché
                  </strong>
                  <small>Vérifié aujourd’hui à 08:41</small>
                </div>
                <div>
                  <span>Temps non facturé</span>
                  <strong>14 620 $</strong>
                  <small>48,6 h dans 7 dossiers</small>
                </div>
                <div>
                  <span>Taux d’encaissement</span>
                  <strong>82 %</strong>
                  <small>82 % du temps saisi</small>
                </div>
              </section>
            </div>

            <div className={styles.utilityDock}>
              <button>
                <CircleHelp size={16} />
                Aide
              </button>
              <button>
                <History size={16} />
                Historique
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
