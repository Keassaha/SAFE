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
  { id: "aujourdhui", label: "Aujourd\u2019hui", screen: "aujourdhui" },
  { id: "dash", label: "Tableau de bord", screen: "dash" },
  {
    id: "pratique",
    label: "Pratique",
    groupe: "Dossiers et clients",
    items: [
      { label: "Clients", screen: "clients" },
      { label: "Dossiers", screen: "dossiers" },
      { label: "Agenda", screen: "agenda" },
      { label: "File assistante", screen: "file-assistante" },
      { label: "Employ\u00e9s", screen: "employes" },
      { label: "Mon temps et ma paye", screen: "mes-heures" },
    ],
  },
  {
    id: "finances",
    label: "Finances",
    groupe: "Argent et conformit\u00e9",
    items: [
      { label: "Facturation", screen: "facturation" },
      { label: "Comptabilit\u00e9", screen: "comptabilite" },
      { label: "Comptes en fid\u00e9icommis", screen: "comptes" },
      { label: "Inspection", screen: "inspection" },
      { label: "Conformit\u00e9", screen: "conformite" },
      { label: "Temps", screen: "temps" },
    ],
  },
  {
    id: "outils",
    label: "Outils",
    groupe: "Production",
    items: [
      { label: "Partage du patrimoine familial", screen: "patrimoine" },
      { label: "\u00c9dition", screen: "edition" },
      { label: "Rapports", screen: "rapports" },
      { label: "Importation", screen: "import" },
    ],
  },
  { id: "parametres", label: "Param\u00e8tres", screen: "parametres" },
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
        <span className="s"><i aria-hidden />Dossiers actifs <b>43</b></span>
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
                { lab: "Fidéicommis", sub: "Sommes détenues", val: "89 275,00 $", ecran: "comptes" },
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

        {/* ── Écran · Aujourd'hui ──
           L'accueil de l'adjointe : ce qui doit être traité dans la journée,
           avant d'ouvrir un dossier pour le découvrir. */}
        <div className="ha-screen" data-ha-pane="aujourdhui">
          <div className="ha-card">
            <p className="ha-kicker">Aujourd&apos;hui</p>
            <p className="ha-h">Trois choses attendent une décision</p>
            <p className="ha-mini">
              Ce qui remonte ici vient des dossiers, des factures et du fidéicommis. Rien n&apos;est
              saisi deux fois.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Rapprocher le fidéicommis</span><span className="v">Ce mois</span></div>
              <div className="ha-kv"><span className="k">Onze factures en retard</span><span className="v">38 060,20 $</span></div>
              <div className="ha-kv"><span className="k">Temps non facturé à porter</span><span className="v">118 881,25 $</span></div>
            </div>
            <span className="ha-act safe-zoom" data-ha-screen="facturation" role="button" tabIndex={0}>
              Ouvrir la facturation
            </span>
          </div>
          <div className="ha-cols">
            <div className="ha-card">
              <p className="ha-ptitle">Le cabinet en un coup d&apos;œil</p>
              <div className="ha-kv"><span className="k">Dossiers actifs</span><span className="v">43</span></div>
              <div className="ha-kv"><span className="k">Clients actifs</span><span className="v">24</span></div>
              <div className="ha-kv"><span className="k">Entrées de temps</span><span className="v">218</span></div>
            </div>
            <div className="ha-card">
              <p className="ha-ptitle">Ce qui a bougé</p>
              <div className="ha-kv"><span className="k">Paiement reçu · 2026-025</span><span className="v">597,58 $</span></div>
              <div className="ha-kv"><span className="k">Facture émise · 2026-031</span><span className="v">2 104,00 $</span></div>
              <div className="ha-kv"><span className="k">Retrait fidéicommis · ce mois</span><span className="v">2 925,00 $</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Dossiers ── */}
        <div className="ha-screen" data-ha-pane="dossiers">
          <div className="ha-card">
            <p className="ha-kicker">Dossiers</p>
            <p className="ha-h">50 dossiers, dont 43 actifs</p>
            <p className="ha-mini">Répartition des dossiers actifs par domaine de pratique.</p>
            <table className="ha-tbl" style={{ marginTop: 9 }}>
              <thead>
                <tr><th>Domaine</th><th>Actifs</th><th style={{ textAlign: "right" }}>Part</th></tr>
              </thead>
              <tbody>
                {[
                  ["Immobilier", "13", "30 %"],
                  ["Litige civil", "10", "23 %"],
                  ["Droit corporatif", "9", "21 %"],
                  ["Immigration", "6", "14 %"],
                  ["Droit de la famille", "5", "12 %"],
                ].map(([d, n, part]) => (
                  <tr key={d}>
                    <td>{d}</td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: 11.5 }}>{n}</td>
                    <td className="num">{part}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="ha-mini" style={{ marginTop: 9 }}>
              Sept dossiers clôturés. À l&apos;ouverture, SAFE prépare une structure adaptée au
              domaine.
            </p>
          </div>
        </div>

        {/* ── Écran · Agenda ── */}
        <div className="ha-screen" data-ha-pane="agenda">
          <div className="ha-card">
            <p className="ha-kicker">Agenda</p>
            <p className="ha-h">Aucune échéance inscrite</p>
            <p className="ha-mini">
              Le calendrier du cabinet réunit les événements et les échéances des dossiers. Ce
              cabinet de démonstration n&apos;en a encore inscrit aucune : l&apos;écran montre ce
              qu&apos;il montrerait, un état vide, plutôt qu&apos;un contenu inventé.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Événements au calendrier</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Échéances de dossier</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Rappels automatiques</span><span className="v">Actifs</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · File assistante ── */}
        <div className="ha-screen" data-ha-pane="file-assistante">
          <div className="ha-card">
            <p className="ha-kicker">File assistante</p>
            <p className="ha-h">La file de travail de l&apos;adjointe</p>
            <p className="ha-mini">
              Ce que l&apos;adjointe a préparé et qui attend la lecture de l&apos;avocate : une
              facture à approuver, un dossier prêt pour révision, un document à signer.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">En attente de révision</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Prêt à envoyer</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Retourné pour correction</span><span className="v">0</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Employés ── */}
        <div className="ha-screen" data-ha-pane="employes">
          <div className="ha-card">
            <p className="ha-kicker">Employés</p>
            <p className="ha-h">Deux accès, aucune fiche de paye</p>
            <p className="ha-mini">
              Un accès donne un rôle, et le rôle décide de ce que la personne voit. La fiche
              d&apos;employé, elle, sert à la paye et n&apos;est ouverte que si le cabinet la tient
              dans SAFE.
            </p>
            <table className="ha-tbl" style={{ marginTop: 9 }}>
              <thead><tr><th>Personne</th><th>Rôle</th><th style={{ textAlign: "right" }}>Fiche de paye</th></tr></thead>
              <tbody>
                <tr><td>Me Camille Roy</td><td style={{ color: "var(--si-muted)" }}>Avocate</td><td className="num">—</td></tr>
                <tr><td>Adjointe du cabinet</td><td style={{ color: "var(--si-muted)" }}>Assistante</td><td className="num">—</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Écran · Mon temps et ma paye ── */}
        <div className="ha-screen" data-ha-pane="mes-heures">
          <div className="ha-card">
            <p className="ha-kicker">Mon temps et ma paye</p>
            <p className="ha-h">Vos heures, soumises depuis votre poste</p>
            <p className="ha-mini">
              Chaque personne saisit ses heures et les soumet pour la période. L&apos;écran
              n&apos;affiche rien tant qu&apos;aucune fiche d&apos;employé n&apos;est liée au compte.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Période en cours</span><span className="v">Août 2026</span></div>
              <div className="ha-kv"><span className="k">Heures soumises</span><span className="v">0,0 h</span></div>
              <div className="ha-kv"><span className="k">Fiche liée au compte</span><span className="v">Aucune</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Temps ── */}
        <div className="ha-screen" data-ha-pane="temps">
          <div className="ha-card">
            <p className="ha-kicker">Temps</p>
            <p className="ha-h">118 881,25 $ de temps non facturé</p>
            <p className="ha-mini">
              Cent quatre-vingt-quinze entrées facturables attendent d&apos;être portées à une
              facture. Le temps est inscrit une fois, au moment où il se fait.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Entrées au total</span><span className="v">218</span></div>
              <div className="ha-kv"><span className="k">Dont facturables non facturées</span><span className="v">195</span></div>
              <div className="ha-kv"><span className="k">Heures consignées</span><span className="v">494,3 h</span></div>
              <div className="ha-kv"><span className="k">Heures à facturer</span><span className="v">442,0 h</span></div>
            </div>
            <span className="ha-act safe-zoom" data-ha-screen="facturation" role="button" tabIndex={0}>
              Porter à une facture
            </span>
          </div>
        </div>

        {/* ── Écran · Comptabilité ── */}
        <div className="ha-screen" data-ha-pane="comptabilite">
          <div className="ha-card">
            <p className="ha-kicker">Comptabilité</p>
            <p className="ha-h">Le journal du cabinet</p>
            <p className="ha-mini">
              Revenus, dépenses, taxes et écritures se tiennent ici. Ce cabinet de démonstration
              n&apos;a pas encore saisi de dépense ni d&apos;écriture manuelle : ses revenus
              viennent des factures.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Revenus facturés</span><span className="v">87 115,20 $</span></div>
              <div className="ha-kv"><span className="k">Encaissé</span><span className="v">49 055,00 $</span></div>
              <div className="ha-kv"><span className="k">Dépenses du cabinet</span><span className="v">0,00 $</span></div>
              <div className="ha-kv"><span className="k">Écritures manuelles</span><span className="v">0</span></div>
            </div>
            <p className="ha-mini" style={{ marginTop: 9 }}>
              L&apos;export vers un logiciel comptable externe reste disponible en tout temps.
            </p>
          </div>
        </div>

        {/* ── Écran · Inspection ── */}
        <div className="ha-screen" data-ha-pane="inspection">
          <div className="ha-card">
            <p className="ha-kicker">Inspection</p>
            <p className="ha-h">Ce qu&apos;un inspecteur demande, au même endroit</p>
            <p className="ha-mini">
              Rapport mensuel, registres, journal d&apos;administration, livre des honoraires et
              trousse. Rassemblés ici plutôt qu&apos;éparpillés dans le fidéicommis.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Rapport mensuel du fidéicommis</span><span className="v">Disponible</span></div>
              <div className="ha-kv"><span className="k">Registre des sommes reçues et versées</span><span className="v">Tenu</span></div>
              <div className="ha-kv"><span className="k">Journal d&apos;administration</span><span className="v">Tenu</span></div>
              <div className="ha-kv"><span className="k">Piste d&apos;audit non modifiable</span><span className="v">Active</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Conformité ── */}
        <div className="ha-screen" data-ha-pane="conformite">
          <div className="ha-card">
            <p className="ha-kicker">Conformité</p>
            <p className="ha-h">Ce qui est vérifié, et ce qui reste à faire</p>
            <p className="ha-mini">
              SAFE soutient la tenue, la vérification et la traçabilité. La responsabilité
              professionnelle demeure celle du cabinet.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Solde de fidéicommis négatif</span><span className="v">Aucun</span></div>
              <div className="ha-kv"><span className="k">Fonds dormant</span><span className="v">Aucun</span></div>
              <div className="ha-kv"><span className="k">Rapprochement du mois</span><span className="v">À faire</span></div>
              <div className="ha-kv"><span className="k">Numérotation des factures</span><span className="v">Sans trou</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Partage du patrimoine familial ── */}
        <div className="ha-screen" data-ha-pane="patrimoine">
          <div className="ha-card">
            <p className="ha-kicker">Outils · Partage du patrimoine familial</p>
            <p className="ha-h">La valeur à partager, article par article</p>
            <p className="ha-mini">
              Le calcul suit les articles du Code civil, avec la déduction de plus-value que les
              tableurs manquent une fois sur deux. Chaque montant renvoie à sa disposition.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Résidence familiale</span><span className="v">Incluse</span></div>
              <div className="ha-kv"><span className="k">Déduction de plus-value</span><span className="v">Calculée</span></div>
              <div className="ha-kv"><span className="k">Régime de retraite</span><span className="v">Inclus</span></div>
              <div className="ha-kv"><span className="k">Quand le droit ne tranche pas</span><span className="v">L&apos;outil s&apos;arrête</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Édition ── */}
        <div className="ha-screen" data-ha-pane="edition">
          <div className="ha-card">
            <p className="ha-kicker">Édition</p>
            <p className="ha-h">Deux documents en préparation</p>
            <p className="ha-mini">
              Les documents se rédigent dans SAFE et restent rattachés à leur dossier, avec leur
              source et leur version.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Documents en préparation</span><span className="v">2</span></div>
              <div className="ha-kv"><span className="k">Pièces classées au dossier</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Cartables par domaine</span><span className="v">Montés</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Rapports ── */}
        <div className="ha-screen" data-ha-pane="rapports">
          <div className="ha-card">
            <p className="ha-kicker">Rapports</p>
            <p className="ha-h">Activité, honoraires, encaissement</p>
            <p className="ha-mini">
              Sur la période choisie, et exportables. Ce sont les mêmes chiffres que les écrans,
              jamais un second calcul.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Taux d&apos;encaissement</span><span className="v">56 %</span></div>
              <div className="ha-kv"><span className="k">Facturé sur la période</span><span className="v">87 115,20 $</span></div>
              <div className="ha-kv"><span className="k">Encaissé sur la période</span><span className="v">49 055,00 $</span></div>
              <div className="ha-kv"><span className="k">Reste à recevoir</span><span className="v">38 060,20 $</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Importation ── */}
        <div className="ha-screen" data-ha-pane="import">
          <div className="ha-card">
            <p className="ha-kicker">Importation</p>
            <p className="ha-h">Vos données arrivent depuis un fichier</p>
            <p className="ha-mini">
              Clients, dossiers et historiques se reprennent depuis un tableur. La mise en route
              est faite par nous : vous envoyez ce que vous avez, dans l&apos;état où c&apos;est.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Importations effectuées</span><span className="v">0</span></div>
              <div className="ha-kv"><span className="k">Formats acceptés</span><span className="v">CSV, Excel</span></div>
              <div className="ha-kv"><span className="k">Contrôle avant écriture</span><span className="v">Systématique</span></div>
            </div>
          </div>
        </div>

        {/* ── Écran · Paramètres ── */}
        <div className="ha-screen" data-ha-pane="parametres">
          <div className="ha-card">
            <p className="ha-kicker">Paramètres</p>
            <p className="ha-h">Le cabinet, sa facture, ses accès</p>
            <p className="ha-mini">
              Numéros de taxes, apparence de la facture, mode de facturation, équipe et
              permissions. Configuré avec vous à la mise en route.
            </p>
            <div style={{ marginTop: 11 }}>
              <div className="ha-kv"><span className="k">Province de pratique</span><span className="v">Québec</span></div>
              <div className="ha-kv"><span className="k">TPS · TVQ</span><span className="v">5 % · 9,975 %</span></div>
              <div className="ha-kv"><span className="k">Mode de facturation</span><span className="v">Horaire</span></div>
              <div className="ha-kv"><span className="k">Interface</span><span className="v">Français · English</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
