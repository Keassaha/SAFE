import {
  Archive,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileCheck2,
  FilePlus2,
  Files,
  FolderKanban,
  History,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { ChevronMark } from "@/components/branding/SafeLogo";
import styles from "./safe-linear-visual.module.css";

const navGroups = [
  {
    label: "Cabinet",
    items: [
      { icon: LayoutDashboard, label: "Aujourd’hui" },
      { icon: Inbox, label: "Boîte de réception", count: "3" },
      { icon: MessageSquareText, label: "Assistant SAFE", active: true },
    ],
  },
  {
    label: "Travail",
    items: [
      { icon: FolderKanban, label: "Dossiers" },
      { icon: Clock3, label: "Temps et dépenses" },
      { icon: CalendarDays, label: "Échéances" },
      { icon: Files, label: "Documents" },
    ],
  },
  {
    label: "Finances",
    items: [
      { icon: ReceiptText, label: "Facturation" },
      { icon: ShieldCheck, label: "Fidéicommis" },
    ],
  },
];

export default function SafeLinearVisualPage() {
  return (
    <main className={styles.stage}>
      <div className={styles.app}>
        <aside className={styles.sidebar}>
          <div className={styles.identity}>
            <span className={styles.avatar}>LB</span>
            <span>Lebeau & Associés</span>
            <ChevronDown size={14} />
            <button aria-label="Rechercher">
              <Search size={17} />
            </button>
            <button aria-label="Créer">
              <Plus size={18} />
            </button>
          </div>

          <nav className={styles.navigation}>
            {navGroups.map((group) => (
              <section key={group.label} className={styles.navGroup}>
                <p>
                  {group.label}
                  <ChevronDown size={12} />
                </p>
                {group.items.map(({ icon: Icon, label, count, active }) => (
                  <div
                    key={label}
                    className={`${styles.navItem} ${active ? styles.active : ""}`}
                  >
                    <Icon size={17} strokeWidth={1.8} />
                    <span>{label}</span>
                    {count && <b>{count}</b>}
                  </div>
                ))}
              </section>
            ))}
          </nav>

          <div className={styles.sidebarBottom}>
            <div className={styles.navItem}>
              <Users size={17} />
              <span>Équipe</span>
            </div>
            <div className={styles.navItem}>
              <Archive size={17} />
              <span>Archives</span>
            </div>
          </div>
        </aside>

        <section className={styles.workspace}>
          <header className={styles.topbar}>
            <div>
              Assistant SAFE
              <ChevronDown size={14} />
            </div>
            <button>
              <Search size={16} />
              Rechercher
              <kbd>⌘ K</kbd>
            </button>
            <span className={styles.user}>SL</span>
          </header>

          <div className={styles.canvas}>
            <div className={styles.notice}>
              SAFE peut maintenant préparer vos prochaines actions
              <button>Découvrir</button>
              <button className={styles.noticeClose}>Plus tard</button>
            </div>

            <div className={styles.brandWatermark} aria-hidden="true">
              <span className={styles.embossHighlight}>
                <ChevronMark size={360} tone="mono-light" animate={false} />
              </span>
              <span className={styles.embossShadow}>
                <ChevronMark size={360} tone="light" animate={false} />
              </span>
              <span className={styles.embossFace}>
                <ChevronMark size={360} tone="light" animate={false} />
              </span>
            </div>

            <div className={styles.askBox}>
              <p>Que voulez-vous préparer aujourd’hui&nbsp;?</p>
              <div className={styles.askActions}>
                <span>
                  <Sparkles size={16} />
                  Capacités
                  <ChevronDown size={13} />
                </span>
                <button aria-label="Joindre un document">
                  <Paperclip size={16} />
                </button>
                <button className={styles.send} aria-label="Envoyer">
                  <ArrowUp size={17} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.assistant}>
          <header>
            <strong>Préparer une action</strong>
            <div>
              <button aria-label="Plus d’options">
                <MoreHorizontal size={17} />
              </button>
              <button aria-label="Fermer">
                <X size={17} />
              </button>
            </div>
          </header>

          <div className={styles.assistantBody}>
            <div className={styles.assistantMark}>
              <Sparkles size={25} />
            </div>
            <h1>Bienvenue dans SAFE</h1>
            <p>Partez d’un dossier, d’une échéance ou d’un document.</p>

            <div className={styles.suggestions}>
              <button>
                <FilePlus2 size={16} />
                Ouvrir un dossier
              </button>
              <button>
                <ReceiptText size={16} />
                Préparer une facture
              </button>
              <button>
                <FileCheck2 size={16} />
                Vérifier un rapprochement
              </button>
            </div>
          </div>

          <div className={styles.composer}>
            <p>Décrivez ce que vous voulez accomplir</p>
            <div>
              <span>
                <Sparkles size={16} />
                Capacités
                <ChevronDown size={13} />
              </span>
              <button aria-label="Joindre un fichier">
                <Paperclip size={17} />
              </button>
              <button className={styles.send} aria-label="Envoyer">
                <ArrowUp size={17} />
              </button>
            </div>
          </div>
        </section>

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
    </main>
  );
}
