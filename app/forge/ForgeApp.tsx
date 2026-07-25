"use client";

import {
  Activity,
  ArrowRight,
  BrainCircuit,
  CalendarRange,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  Command,
  Gauge,
  Inbox,
  LayoutList,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import styles from "./forge.module.css";

const work = [
  { id: "FOR-248", title: "Rendre les exports auditables", owner: "NK", impact: 94, confidence: 88, effort: 3, status: "En cours", due: "Aujourd’hui", team: "Platform" },
  { id: "FOR-251", title: "Réduire le délai de première valeur", owner: "AM", impact: 91, confidence: 76, effort: 5, status: "À cadrer", due: "Mar. 28", team: "Growth" },
  { id: "FOR-239", title: "Repenser les permissions invitées", owner: "JL", impact: 82, confidence: 93, effort: 2, status: "En révision", due: "Lun. 27", team: "Core" },
  { id: "FOR-255", title: "Consolider la recherche universelle", owner: "SR", impact: 78, confidence: 72, effort: 5, status: "Planifié", due: "31 juil.", team: "Platform" },
  { id: "FOR-244", title: "Instrumenter le parcours d’activation", owner: "MA", impact: 74, confidence: 81, effort: 3, status: "En cours", due: "1 août", team: "Growth" },
  { id: "FOR-231", title: "Archive des décisions par initiative", owner: "NK", impact: 66, confidence: 90, effort: 2, status: "Planifié", due: "4 août", team: "Core" },
];

const signals = [
  { label: "6 entretiens", text: "Les équipes perdent le contexte après chaque arbitrage.", tone: "amber" },
  { label: "Amplitude", text: "42 % abandonnent avant d’inviter un collègue.", tone: "red" },
  { label: "Support", text: "Les exports sont le motif no 1 des comptes Enterprise.", tone: "green" },
];

export default function ForgeApp() {
  const [query, setQuery] = useState("");
  const [assistant, setAssistant] = useState(true);
  const [sidebar, setSidebar] = useState(false);
  const [selected, setSelected] = useState(work[0].id);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (window.matchMedia("(max-width: 620px)").matches) setAssistant(false);
  }, []);

  const filtered = useMemo(
    () => work.filter((item) => `${item.id} ${item.title} ${item.team}`.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  return (
    <main className={styles.shell}>
      <aside className={`${styles.sidebar} ${sidebar ? styles.sidebarOpen : ""}`}>
        <button className={styles.workspace}>
          <span className={styles.logo}>F</span>
          <span><strong>Forge</strong><small>Northstar</small></span>
          <ChevronDown size={14} />
        </button>
        <button className={styles.quick} onClick={() => document.getElementById("forge-search")?.focus()}>
          <Search size={15} /> Rechercher <kbd>⌘ K</kbd>
        </button>
        <nav>
          <button><Inbox size={16} /> Boîte de réception <span>4</span></button>
          <button className={styles.active}><Target size={16} /> Priorités</button>
          <button><CalendarRange size={16} /> Cycles</button>
          <p>Planifier</p>
          <button><LayoutList size={16} /> Initiatives</button>
          <button><Gauge size={16} /> Capacité</button>
          <button><BrainCircuit size={16} /> Décisions</button>
          <p>Comprendre</p>
          <button><Activity size={16} /> Signaux clients <span>12</span></button>
          <button><Users size={16} /> Équipe</button>
        </nav>
        <div className={styles.sidebarFoot}>
          <span className={styles.avatar}>SC</span>
          <span>Sophie Chen</span>
          <MoreHorizontal size={15} />
        </div>
      </aside>
      {sidebar && <button className={styles.scrim} aria-label="Fermer la navigation" onClick={() => setSidebar(false)} />}

      <section className={styles.workspaceMain}>
        <header className={styles.topbar}>
          <button className={styles.mobileMenu} aria-label="Ouvrir la navigation" onClick={() => setSidebar(true)}><Menu size={17} /></button>
          <span>Priorités</span><span className={styles.slash}>/</span><strong>Cycle 14</strong>
          <div className={styles.topActions}>
            <label className={styles.search}><Search size={14} /><input id="forge-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrer" /></label>
            <button onClick={() => notify("Nouvelle priorité créée")}><Plus size={15} /> <span>Nouvelle priorité</span></button>
          </div>
        </header>

        <div className={`${styles.content} ${assistant ? "" : styles.contentWide}`}>
          <section className={styles.mainPane}>
            <div className={styles.cycleHeader}>
              <div>
                <span className={styles.eyebrow}>CYCLE 14 · 24 JUIL. AU 7 AOÛT</span>
                <h1>Ce qui mérite l’attention maintenant.</h1>
                <p>Forge classe le travail selon les preuves, la capacité disponible et le coût du retard.</p>
              </div>
              <div className={styles.cyclePulse}><strong>68%</strong><span>Confiance du cycle</span></div>
            </div>

            <section className={styles.capacity}>
              <div><span>Capacité engagée</span><strong>31 / 40 j</strong></div>
              <div className={styles.track}><i style={{ width: "77%" }} /></div>
              <p><span /> 6 j protégés pour les imprévus</p>
            </section>

            <div className={styles.tableHead}>
              <span>Priorité</span><span>Équipe</span><span>Impact</span><span>Confiance</span><span>Effort</span><span>Échéance</span>
            </div>
            <div className={styles.workList}>
              {filtered.map((item, index) => (
                <button key={item.id} className={`${styles.row} ${selected === item.id ? styles.rowSelected : ""}`} onClick={() => setSelected(item.id)}>
                  <span className={styles.priority}><b>{index + 1}</b><i><small>{item.id}</small><strong>{item.title}</strong></i></span>
                  <span>{item.team}</span>
                  <span className={styles.score}>{item.impact}</span>
                  <span className={styles.confidence}><i style={{ width: `${item.confidence}%` }} />{item.confidence}%</span>
                  <span>{item.effort} j</span>
                  <span className={item.due === "Aujourd’hui" ? styles.today : ""}>{item.due}</span>
                </button>
              ))}
              {!filtered.length && <div className={styles.empty}>Aucune priorité ne correspond à « {query} ».</div>}
            </div>

            <section className={styles.signals}>
              <header><div><CircleDot size={15} /><strong>Signaux qui changent le plan</strong></div><button>Tout relier <ArrowRight size={14} /></button></header>
              {signals.map((signal) => <article key={signal.text}><span className={styles[signal.tone]} /><b>{signal.label}</b><p>{signal.text}</p><button aria-label="Plus d’options"><MoreHorizontal size={15} /></button></article>)}
            </section>
          </section>

          {assistant && (
            <aside className={styles.copilot}>
              <header><span><Sparkles size={15} /> Note de décision</span><button aria-label="Fermer" onClick={() => setAssistant(false)}><X size={15} /></button></header>
              <div className={styles.copilotBody}>
                <span className={styles.aiLabel}>SYNTHÈSE FORGE</span>
                <h2>Les exports devraient passer en premier.</h2>
                <p>Cette priorité combine le signal Enterprise le plus fort, un effort contenu et une dépendance qui bloque deux renouvellements.</p>
                <div className={styles.rationale}>
                  <div><Check size={14} /><span><strong>Revenu protégé</strong><small>2 renouvellements · 84 k$ ARR</small></span></div>
                  <div><Check size={14} /><span><strong>Preuve convergente</strong><small>Support, ventes et 6 entretiens</small></span></div>
                  <div><Clock3 size={14} /><span><strong>Fenêtre courte</strong><small>Décision requise avant mardi</small></span></div>
                </div>
                <button className={styles.accept} onClick={() => notify("Décision ajoutée au journal")}><Check size={15} /> Consigner cette décision</button>
                <button className={styles.secondary} onClick={() => notify("Hypothèses ouvertes")}>Voir les hypothèses</button>
              </div>
              <div className={styles.prompt}><input placeholder="Demandez pourquoi…" /><button aria-label="Envoyer"><ArrowRight size={15} /></button></div>
            </aside>
          )}
        </div>
        {!assistant && <button className={styles.reopen} onClick={() => setAssistant(true)}><Sparkles size={15} /> Ouvrir la note</button>}
      </section>
      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </main>
  );
}
