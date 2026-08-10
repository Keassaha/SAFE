import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import {
  buildDossierListWhere,
  getDossierListOrderBy,
  DOSSIER_LIST_PAGE_SIZE,
} from "@/lib/dossiers/query";
import s from "../v2.module.css";
import {
  StatusPill,
  STATUT_LABELS,
  statutTone,
  clientDisplayName,
  dateShortFR,
} from "../_components/primitives";

export const metadata: Metadata = {
  title: "Dossiers | SAFE",
};

/**
 * Liste des dossiers v2 — données réelles (mêmes helpers que la liste legacy :
 * lib/dossiers/query.ts). Recherche serveur via GET ?q=.
 */
export default async function DossiersV2Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { cabinetId, userId, role } = await requireCabinetAndUser();

  const where = buildDossierListWhere(cabinetId, {
    q: q ?? null,
    restrictToUserId: role === "avocat" ? userId : null,
    excludeClosedByDefault: true,
  });

  const [dossiers, total] = await Promise.all([
    prisma.dossier.findMany({
      where,
      orderBy: getDossierListOrderBy("dateOuverture", "desc"),
      take: DOSSIER_LIST_PAGE_SIZE,
      select: {
        id: true,
        reference: true,
        numeroDossier: true,
        intitule: true,
        statut: true,
        dateOuverture: true,
        client: {
          select: {
            typeClient: true,
            raisonSociale: true,
            prenom: true,
            nom: true,
          },
        },
        avocatResponsable: { select: { nom: true } },
      },
    }),
    prisma.dossier.count({ where }),
  ]);

  return (
    <>
      <section className={s.matterHeader} aria-labelledby="dossiers-title">
        <div className={s.titleRow}>
          <div>
            <h1 id="dossiers-title">Dossiers</h1>
            <p>
              {total} dossier{total > 1 ? "s" : ""} en cours
              {q ? ` · recherche « ${q} »` : ""}
            </p>
          </div>
        </div>
      </section>

      <div className={s.content}>
        <form method="GET" className={s.listToolbar}>
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Rechercher par référence, intitulé, client…"
            className={s.searchInput}
            aria-label="Rechercher un dossier"
          />
          <button type="submit" className={s.secondaryButton}>
            Rechercher
          </button>
        </form>

        {dossiers.length === 0 ? (
          <div className={s.emptyState}>
            <h2>Aucun dossier trouvé</h2>
            <p>
              {q
                ? "Aucun résultat pour cette recherche."
                : "Aucun dossier en cours dans le cabinet."}
            </p>
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>N° dossier</th>
                  <th>Intitulé</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th>Ouverture</th>
                </tr>
              </thead>
              <tbody>
                {dossiers.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Link href={`/v2/dossiers/${d.id}`} className={s.rowLink}>
                        {d.numeroDossier ?? d.reference ?? "—"}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/v2/dossiers/${d.id}`} className={s.rowLink}>
                        {d.intitule}
                      </Link>
                    </td>
                    <td>{clientDisplayName(d.client)}</td>
                    <td>
                      <StatusPill tone={statutTone(d.statut)}>
                        {STATUT_LABELS[d.statut] ?? d.statut}
                      </StatusPill>
                    </td>
                    <td>{dateShortFR(d.dateOuverture)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
