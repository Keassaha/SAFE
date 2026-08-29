"use client";

/**
 * SAFE — La fiche dossier, à la disposition de la fiche client.
 *
 * Demande CEO du 2026-08-27 : « je voulais que la disposition soit la même,
 * juste avec les détails d'un dossier ».
 *
 * ── Ce que ça remplace ───────────────────────────────────────────────────────
 * Neuf blocs empilés sur une seule colonne, qu'il fallait parcourir en entier
 * pour trouver quoi que ce soit. Le cartable, qui EST la structure du dossier,
 * arrivait en dernier.
 *
 * ── Le patron, repris de la fiche client ─────────────────────────────────────
 * En-tête avec retour, titre et rangée d'actions, puis UNE grande carte qui
 * porte des onglets. Rien n'est inventé ici : c'est
 * `components/clients/registry/ClientProfileTabs.tsx`, transposé.
 *
 * ── Pourquoi des panneaux en ReactNode ───────────────────────────────────────
 * La page est un composant SERVEUR : navette, pièces et documents s'y rendent
 * avec des données de base. Les recevoir déjà rendus évite de rendre cliente
 * toute la fiche pour un seul `useState` d'onglet.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, FolderOpen, Inbox, MessagesSquare, FileText } from "lucide-react";
import { tMicro } from "@/lib/motion";

type OngletId = "apercu" | "cartable" | "pieces" | "communications" | "documents";

interface Props {
  apercu: React.ReactNode;
  cartable: React.ReactNode;
  /** Onglet a part depuis le 2026-08-27, demande CEO : ce qu'on ATTEND du
   *  client ne se lit pas au milieu de ce qu'on a deja classe. */
  pieces: React.ReactNode;
  communications: React.ReactNode;
  documents: React.ReactNode;
  nbSections: number;
  nbDocuments: number;
  nbPieces: number;
}

export function DossierProfile({
  apercu,
  cartable,
  pieces,
  communications,
  documents,
  nbSections,
  nbDocuments,
  nbPieces,
}: Props) {
  const [actif, setActif] = useState<OngletId>("apercu");

  /* L'ordre est celui que le CEO a dicté : vue d'ensemble, cartable, pieces,
     notes internes, documents. Le cartable passe de la NEUVIEME place a la
     deuxieme, ce qui etait le probleme P1 du document de refonte.

     « Notes internes » et non « Communications », demande CEO du 2026-08-27.
     Le mot etait faux dans un cabinet : une communication, c'est ce qu'on
     echange avec le client, la partie adverse ou le tribunal, et ca se classe
     dans la section « Correspondance » du cartable. Ce fil-ci ne sort jamais du
     cabinet : c'est l'adjointe et l'avocate qui se parlent. Deux choses qui se
     ressemblaient de loin portaient le meme nom. */
  const onglets: { id: OngletId; label: string; count?: number; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "apercu", label: "Vue d'ensemble", Icon: ClipboardList },
    { id: "cartable", label: "Cartable", count: nbSections, Icon: FolderOpen },
    { id: "pieces", label: "Pièces attendues", count: nbPieces, Icon: Inbox },
    { id: "communications", label: "Notes internes", Icon: MessagesSquare },
    { id: "documents", label: "Documents", count: nbDocuments, Icon: FileText },
  ];

  const panneaux: Record<OngletId, React.ReactNode> = {
    apercu,
    cartable,
    pieces,
    communications,
    documents,
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-si-line bg-si-surface">
      <nav className="relative flex gap-1 border-b border-si-line px-2" aria-label="Sections du dossier">
        {onglets.map((o) => {
          const estActif = actif === o.id;
          const Icon = o.Icon;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setActif(o.id)}
              aria-current={estActif ? "page" : undefined}
              className={`relative -mb-px flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                estActif ? "text-si-ink-strong" : "text-si-muted hover:text-si-ink"
              }`}
            >
              {estActif && (
                <motion.span
                  layoutId="dossier-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-si-ink-strong"
                  transition={tMicro}
                  aria-hidden
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{o.label}</span>
              {o.count != null && <span className="relative z-10 text-si-muted">({o.count})</span>}
            </button>
          );
        })}
      </nav>

      {/* Le cartable s'ouvre DIRECTEMENT, sans carte fermee a cliquer : demande
          CEO du 2026-08-27. Il porte sa propre mise en page a deux volets, donc
          il ne prend pas le rembourrage des autres panneaux. */}
      <div className={actif === "cartable" ? "" : "p-6"}>{panneaux[actif]}</div>
    </div>
  );
}
