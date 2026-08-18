"use client";

/**
 * Extrait navigable de SAFE, posé dans le cadre du hero.
 *
 * Remplace la capture JPEG qui s'y trouvait. Une capture vieillit en silence :
 * elle ne suit ni la palette, ni les libellés, ni les chiffres du produit.
 *
 * Le balisage est dessiné dans une boîte logique fixe de 1000x563, mise à
 * l'échelle par `transform` depuis ExperienceCinema : même espace de
 * coordonnées que le canvas d'assemblage, donc les papiers se rangent
 * exactement là où les blocs apparaissent.
 *
 * Interactivité : la barre de menu ouvre ses sous-menus et change d'écran. Le
 * câblage se fait par délégation dans ExperienceCinema (`data-ha-*`), comme la
 * maquette `#demo` plus bas dans la page.
 *
 * CHIFFRES : relevés en base sur le Cabinet Demo (Me Camille Roy), pas
 * inventés. Voir docs/journal si la donnée de démonstration change.
 */

/* ── Menus ────────────────────────────────────────────────────────────────
   Repris de components/layout/SidebarNav.tsx pour que la vitrine montre la
   même arborescence que le produit. `screen` marque les entrées réellement
   navigables dans l'extrait ; les autres restent visibles mais inertes, et
   l'en-tête annonce que c'est un extrait. */
import { SafeMark } from "@/components/branding/SafeLogo";

const MENUS: {
  id: string;
  label: string;
  screen?: string;
  groupe?: string;
  items?: { label: string; screen?: string }[];
}[] = [
  { id: "dash", label: "Tableau de bord", screen: "dash" },
  {
    id: "pratique",
    label: "Pratique",
    groupe: "Dossiers et clients",
    items: [
      { label: "Clients", screen: "clients" },
      { label: "Dossiers" },
      { label: "Agenda" },
      { label: "File assistante" },
      { label: "Employés" },
      { label: "Mon temps et ma paye" },
    ],
  },
  {
    id: "finances",
    label: "Finances",
    groupe: "Argent et conformité",
    items: [
      { label: "Facturation", screen: "facturation" },
      { label: "Comptabilité" },
      { label: "Comptes en fidéicommis", screen: "comptes" },
      { label: "Inspection" },
      { label: "Conformité" },
      { label: "Temps" },
    ],
  },
  {
    id: "outils",
    label: "Outils",
    groupe: "Production",
    items: [{ label: "Édition" }, { label: "Rapports" }, { label: "Import SAFE" }],
  },
  { id: "parametres", label: "Paramètres" },
];

/** Créances réelles, triées par échéance (les 6 plus anciennes). */
const CREANCES: { num: string; client: string; total: string; solde: string; ech: string; etat: "retard" | "partiel" }[] = [
  { num: "2026-011", client: "Tremblay", total: "1 616,83 $", solde: "1 616,83 $", ech: "24/01", etat: "retard" },
  { num: "2026-003", client: "Groupe immobilier Sainte-Foy ltée", total: "2 917,50 $", solde: "1 517,10 $", ech: "29/04", etat: "partiel" },
  { num: "2026-021", client: "Lévesque", total: "1 293,47 $", solde: "672,60 $", ech: "15/05", etat: "partiel" },
  { num: "2026-025", client: "Bouchard", total: "948,54 $", solde: "350,96 $", ech: "24/05", etat: "partiel" },
  { num: "2026-002", client: "Pelletier", total: "5 533,18 $", solde: "5 533,18 $", ech: "11/06", etat: "retard" },
  { num: "2026-004", client: "Groupe immobilier Sainte-Foy ltée", total: "1 911,46 $", solde: "955,73 $", ech: "14/06", etat: "partiel" },
];

export function HeroLiveApp() {
  return (
    <div id="hero-app" role="group" aria-label="Extrait navigable de SAFE : tableau de bord du cabinet">
      {/* ── Barre de navigation ── */}
      <div className="ha-nav">
        {/* Le repère de la barre est le VRAI repère, pas une pastille verte.
            C'est là que l'ouverture du téléphone dépose le logo qu'elle vient
            d'assembler : si les deux ne sont pas le même dessin, le geste se
            termine sur un objet qui n'existe pas (retour CEO du 18 août 2026). */}
        <span className="ha-brand">
          <span className="mark" aria-hidden>
            <SafeMark size={17} />
          </span>
          SAFE
        </span>
        <span className="ha-cab">Me Camille Roy · Cabinet Demo</span>

        <div className="ha-menu">
          {MENUS.map((m) => (
            <div
              key={m.id}
              className={"ha-item safe-zoom-menu" + (m.id === "dash" ? " on" : "")}
              data-ha-menu={m.id}
              {...(m.screen ? { "data-ha-screen": m.screen } : {})}
              role="button"
              tabIndex={0}
              aria-expanded={m.items ? false : undefined}
            >
              {m.label}
              {m.items ? <i className="car" aria-hidden /> : null}
              {m.items ? (
                <div className="ha-drop">
                  <b>{m.groupe}</b>
                  {m.items.map((it) => (
                    <a
                      key={it.label}
                      className={it.screen ? "safe-zoom-menu" : "inerte"}
                      {...(it.screen ? { "data-ha-screen": it.screen } : {})}
                      role="button"
                      tabIndex={it.screen ? 0 : -1}
                      aria-disabled={it.screen ? undefined : true}
                    >
                      {it.label}
                      {it.screen ? <span aria-hidden>→</span> : null}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="ha-right">
          <span className="ha-search">Rechercher un client…</span>
          <span className="ha-lang"><span className="on">FR</span><span>EN</span></span>
          <span className="ha-avatar">CR</span>
        </div>
      </div>

      {/* ── Bandeau d'état ── */}
      <div className="ha-strip">
        <span className="s"><i aria-hidden />Dossiers actifs <b>42</b></span>
        <span className="s"><i aria-hidden />Clients actifs <b>24</b></span>
        <span className="s warn"><i aria-hidden />Fidéicommis <b>À rapprocher</b></span>
        <span className="date">Extrait navigable · ouvrez un menu</span>
      </div>

      <div className="ha-body">
        {/* ── Écran · Tableau de bord ── */}
        <div className="ha-screen on" data-ha-pane="dash">
          <div className="ha-card">
            <p className="ha-kicker">Lecture rapide</p>
            <p className="ha-h">Vos chiffres, en langage simple</p>
            {/* Chaque tuile se soulève ET ouvre un écran : le zoom souple ne
               promet jamais un geste qui n'existe pas. */}
            <div className="ha-tiles">
              {[
                { lab: "Facturation", sub: "Facturé", val: "87 115,20 $", ecran: "facturation" },
                { lab: "Encaissements", sub: "Encaissé", val: "49 055,00 $", ecran: "facturation" },
                { lab: "Créances", sub: "Reste à recevoir", val: "38 060,20 $", ecran: "facturation", amber: true },
                { lab: "Fidéicommis", sub: "Fidéicommis client", val: "0,00 $", ecran: "comptes" },
              ].map((t) => (
                <div
                  key={t.lab}
                  className={"ha-tile safe-zoom" + (t.amber ? " amber" : "")}
                  data-ha-screen={t.ecran}
                  role="button"
                  tabIndex={0}
                  aria-label={`${t.lab} : ${t.val}. Ouvrir l'écran.`}
                >
                  <p className="lab">{t.lab}</p>
                  <p className="sub">{t.sub}</p>
                  <p className="val">{t.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="ha-cols">
            <div className="ha-card">
              <p className="ha-kicker">À traiter maintenant</p>
              <p className="ha-h">Dix-sept factures attendent un paiement</p>
              <p className="ha-mini">
                Onze sont en retard. Le rapprochement du fidéicommis n&apos;a pas encore été fait ce mois-ci.
              </p>
              <span className="ha-act safe-zoom" data-ha-screen="facturation" role="button" tabIndex={0}>
                Voir les créances
              </span>
              <p className="ha-kicker" style={{ marginTop: 12 }}>Ensuite</p>
              <div style={{ marginTop: 3 }}>
                <div className="ha-kv"><span className="k">Rapprocher le fidéicommis</span><span className="v">Ce mois</span></div>
                <div className="ha-kv"><span className="k">Relancer Pelletier · 2026-002</span><span className="v">5 533,18 $</span></div>
              </div>
            </div>
            <div className="ha-card">
              <p className="ha-ptitle">Lecture financière</p>
              <div className="ha-kv"><span className="k">Taux d&apos;encaissement</span><span className="v">56 %</span></div>
              <div className="ha-kv"><span className="k">Factures émises</span><span className="v">31</span></div>
              <div className="ha-kv"><span className="k">En retard</span><span className="v">11</span></div>
              <div className="ha-kv"><span className="k">Partiellement payées</span><span className="v">9</span></div>
              <p className="ha-ptitle" style={{ marginTop: 12 }}>Activité récente</p>
              <div className="ha-kv"><span className="k">Paiement reçu · 2026-025</span><span className="v">597,58 $</span></div>
              <div className="ha-kv"><span className="k">Facture émise · 2026-031</span><span className="v">2 104,00 $</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Facturation ── */}
        <div className="ha-screen" data-ha-pane="facturation">
          <div className="ha-card">
            <p className="ha-kicker">Facturation</p>
            <p className="ha-h">Créances · 38 060,20 $</p>
            <p className="ha-mini">
              Dix-sept factures émises et non réglées. Les six plus anciennes ci-dessous.
            </p>
            <table className="ha-tbl" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Facture</th><th>Client</th><th>Échéance</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ textAlign: "right" }}>Solde dû</th>
                  <th>État</th>
                </tr>
              </thead>
              <tbody>
                {CREANCES.map((f) => (
                  <tr key={f.num}>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11.5 }}>{f.num}</td>
                    <td>{f.client}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11.5 }}>{f.ech}</td>
                    <td className="num">{f.total}</td>
                    <td className="num">{f.solde}</td>
                    <td>
                      <span className={"ha-tag " + (f.etat === "retard" ? "late" : "part")}>
                        {f.etat === "retard" ? "En retard" : "Partielle"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Aging : c'est la lecture qui sert à prioriser les relances.
             Montants relevés en base, pas arrondis à la louche. */}
          <div className="ha-card" style={{ marginTop: 11 }}>
            <p className="ha-ptitle">Ancienneté des créances</p>
            <div className="ha-aging">
              {[
                ["Courant", "11 717,55 $", false],
                ["1 à 30 j", "14 546,50 $", false],
                ["31 à 60 j", "2 105,48 $", true],
                ["61 à 90 j", "6 556,74 $", true],
                ["90 j et plus", "3 133,93 $", true],
              ].map(([lab, val, chaud]) => (
                <div className="ag" key={lab as string}>
                  <span className="l">{lab as string}</span>
                  <span className={"m" + (chaud ? " chaud" : "")}>{val as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Écran · Clients ── */}
        <div className="ha-screen" data-ha-pane="clients">
          <div className="ha-card">
            <p className="ha-kicker">Clients</p>
            <p className="ha-h">24 clients actifs</p>
            <p className="ha-mini">Les huit qui doivent le plus, solde dû décroissant.</p>
            <table className="ha-tbl" style={{ marginTop: 9 }}>
              <thead>
                <tr>
                  <th>Client</th><th>Type</th><th>Dossiers</th>
                  <th style={{ textAlign: "right" }}>Solde dû</th><th>État</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Distribution Rive-Sud ltée", "Personne morale", "2", "5 633,78 $"],
                  ["Pelletier", "Particulier", "3", "5 533,18 $"],
                  ["Gagnon", "Particulier", "1", "4 139,10 $"],
                  ["Lévesque", "Particulier", "2", "3 815,74 $"],
                  ["Clinique Longueuil inc.", "Personne morale", "3", "3 701,63 $"],
                  ["Groupe immobilier Sainte-Foy ltée", "Personne morale", "2", "2 472,83 $"],
                  ["Fiducie Outremont ltée", "Personne morale", "2", "2 443,22 $"],
                  ["Fortin", "Particulier", "2", "2 414,47 $"],
                ].map(([nom, type, doss, solde]) => (
                  <tr key={nom}>
                    <td>{nom}</td>
                    <td style={{ color: "var(--si-muted)" }}>{type}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11.5 }}>{doss}</td>
                    <td className="num">{solde}</td>
                    <td><span className="ha-tag">Actif</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Écran · Comptes en fidéicommis ── */}
        <div className="ha-screen" data-ha-pane="comptes">
          <div className="ha-card">
            <p className="ha-kicker">Comptes en fidéicommis</p>
            <p className="ha-h">Aucune somme détenue en fiducie</p>
            <p className="ha-mini">
              Le cabinet ne détient présentement aucun fonds client. Le rapprochement reste
              exigé chaque mois, même à solde nul : c&apos;est la preuve qui est demandée en
              inspection, pas le montant.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Solde fiducie global</span><span className="v">0,00 $</span></div>
              <div className="ha-kv"><span className="k">Comptes ouverts</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Dernier rapprochement</span><span className="v">À faire</span></div>
              <div className="ha-kv"><span className="k">Écart constaté</span><span className="v">0,00 $</span></div>
            </div>
            <span className="ha-act safe-zoom" data-ha-screen="dash" role="button" tabIndex={0}>
              Retour au tableau de bord
            </span>
          </div>

          {/* À solde nul, l'écran ne raconte rien s'il n'affiche qu'un zéro.
             Ce qui compte alors, c'est la preuve que le contrôle a été fait. */}
          <div className="ha-card" style={{ marginTop: 11 }}>
            <p className="ha-ptitle">Ce qui est conservé pour l&apos;inspection</p>
            <div className="ha-kv"><span className="k">Rapprochement mensuel, même à solde nul</span><span className="v">Exigé</span></div>
            <div className="ha-kv"><span className="k">Registre des sommes reçues et versées</span><span className="v">Tenu</span></div>
            <div className="ha-kv"><span className="k">Journal d&apos;administration</span><span className="v">Tenu</span></div>
            <div className="ha-kv"><span className="k">Piste d&apos;audit non modifiable</span><span className="v">Active</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
