"use client";

import { useState } from "react";
import { ArrowRight, Building2, Ellipsis, User } from "lucide-react";
import s from "../atelier.module.css";
import { blockers, events, ledger, work } from "../_data";

/**
 * PLAN 2, contenu et travail.
 *
 * Rien ici n'est encadré par réflexe. Les groupes sont créés par l'espace et la
 * typographie. Deux exceptions assumées, et une seule raison : l'objet possède
 * une autonomie réelle et porte sa propre action.
 *   - les blocages, parce que chacun porte une décision et un risque distincts;
 *   - rien d'autre.
 * La barre de synthèse, la liste de travail et la timeline vivent directement
 * dans le canvas, séparées par des filets à très faible opacité.
 */
export function Canvas({ onApprove }: { onApprove: () => void }) {
  const [selected, setSelected] = useState<string | null>("w1");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  return (
    <div className={s.canvas}>
      <header className={s.pageHead}>
        <div>
          <h1 className={s.pageTitle}>Aujourd’hui</h1>
          <p className={s.pageSub}>
            Deux éléments bloquent une opération financière. Le reste peut
            attendre demain sans conséquence.
          </p>
        </div>
      </header>

      {/* Barre de synthèse : des chiffres dans le flux, pas quatre cartes de
          même poids. Le solde en fidéicommis est lisible sans interaction. */}
      <section className={s.ledger} aria-label="Synthèse du cabinet">
        {ledger.map((item) => (
          <div key={item.label} className={s.ledgerItem}>
            <span className={s.ledgerLabel}>{item.label}</span>
            <span
              className={`${s.ledgerValue} ${
                "alerte" in item && item.alerte ? s.ledgerValueAlert : ""
              }`}
            >
              {item.valeur}
            </span>
            <span className={s.ledgerNote}>{item.note}</span>
          </div>
        ))}
      </section>

      <section className={s.section} aria-labelledby="atelier-blocages">
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle} id="atelier-blocages">
            Ce qui bloque une opération
          </h2>
          <span className={s.sectionMeta}>2 éléments</span>
        </div>
        <div className={s.blockers}>
          {blockers.map((b) => (
            <article
              key={b.id}
              className={`${s.blocker} ${b.critique ? s.blockerCritical : ""}`}
              data-plane="2"
            >
              <div className={s.blockerBody}>
                <h3 className={s.blockerTitle}>{b.titre}</h3>
                <p className={s.blockerWhy}>{b.pourquoi}</p>
                <div className={s.blockerMeta}>
                  <span>
                    {b.dossier} · <b>{b.reference}</b>
                  </span>
                  {b.montant ? (
                    <span>
                      Montant retenu <b>{b.montant}</b>
                    </span>
                  ) : null}
                  <span>{b.echeance}</span>
                </div>
              </div>
              <button
                type="button"
                className={s.chip}
                onClick={b.critique ? onApprove : undefined}
              >
                {b.action}
                <ArrowRight size={13} strokeWidth={2} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className={s.section} aria-labelledby="atelier-travail">
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle} id="atelier-travail">
            Votre travail
          </h2>
          <button type="button" className={s.linkButton}>
            Voir les 34 dossiers
          </button>
        </div>
        <div className={s.list}>
          {work.map((item) => (
            <div
              key={item.id}
              className={`${s.row} ${selected === item.id ? s.rowSelected : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(item.id);
                }
              }}
            >
              <span className={s.rowMain}>
                <span className={s.rowTitle}>{item.titre}</span>
                <span className={s.rowSource}>
                  {item.source === "Comptabilité" ? (
                    <Building2 size={12} strokeWidth={1.8} />
                  ) : (
                    <User size={12} strokeWidth={1.8} />
                  )}
                  {item.source}
                </span>
              </span>
              <Pill statut={item.statut} />
              <span className={s.rowRef}>{item.reference}</span>
              <span className={s.rowAmount}>{item.montant}</span>
              <span
                className={`${s.rowDue} ${item.enRetard ? s.rowDueLate : ""}`}
              >
                {item.echeance}
              </span>
              {/* Colonne de menu permanente : jamais de survol seul. */}
              <span style={{ position: "relative", flex: "0 0 28px" }}>
                <button
                  type="button"
                  aria-label={`Actions sur ${item.titre}`}
                  aria-expanded={menuOpen === item.id}
                  className={`${s.rowMenu} ${
                    menuOpen === item.id ? s.rowMenuOpen : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === item.id ? null : item.id);
                  }}
                >
                  <Ellipsis size={15} strokeWidth={2} />
                </button>
                {menuOpen === item.id ? (
                  <div
                    className={`${s.popover} ${s.popoverRow}`}
                    data-plane="3"
                    role="menu"
                  >
                    <button type="button" className={s.popoverItem} role="menuitem">
                      Ouvrir le dossier
                    </button>
                    <button type="button" className={s.popoverItem} role="menuitem">
                      Saisir du temps
                    </button>
                    <button type="button" className={s.popoverItem} role="menuitem">
                      Joindre un document
                    </button>
                    <div className={s.popoverSep} />
                    <button
                      type="button"
                      className={`${s.popoverItem} ${s.popoverItemDanger}`}
                      role="menuitem"
                    >
                      Retirer de ma file
                    </button>
                  </div>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={s.section} aria-labelledby="atelier-activite">
        <div className={s.sectionHead}>
          <h2 className={s.sectionTitle} id="atelier-activite">
            Activité
          </h2>
          <span className={s.sectionMeta}>Trace conservée en ajout seul</span>
        </div>
        <div className={s.timeline}>
          {events.map((e) => (
            <div key={e.id} className={s.event}>
              <span className={s.eventText}>
                <b>{e.qui}</b> {e.quoi}
              </span>
              <span className={s.eventWhen}>{e.quand}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Pill({
  statut,
}: {
  statut: { texte: string; ton: "action" | "info" | "fait" };
}) {
  const tone =
    statut.ton === "action"
      ? s.pillAction
      : statut.ton === "fait"
        ? s.pillDone
        : s.pillInfo;
  return (
    <span className={`${s.pill} ${tone}`}>
      <span className={s.dot} aria-hidden />
      {statut.texte}
    </span>
  );
}
