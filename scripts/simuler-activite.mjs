/**
 * Simulateur d'activité de cabinet.
 *
 * Fabrique un cabinet vivant : clients, dossiers, heures, factures, paiements.
 * Rien n'est écrit à la main. Tout est ENGENDRÉ :
 *
 *   - les noms se composent à partir de vocabulaires courts et combinatoires,
 *     pas d'une liste de vingt-cinq personnes recopiées ;
 *   - les montants se DÉDUISENT du travail saisi (minutes × taux → sous-total
 *     → taxes → total), jamais tirés au hasard. C'est ce qui rend la
 *     simulation crédible : les chiffres de la facture correspondent aux
 *     heures du dossier ;
 *   - les dates remontent depuis aujourd'hui, donc le jeu vieillit tout seul.
 *
 * Le tirage est déterministe : même graine, même cabinet. On peut donc rejouer,
 * comparer, et décrire un cas précis sans capture d'écran.
 *
 * Usage :
 *   node --env-file=.env.local scripts/simuler-activite.mjs
 *
 * Paramètres (variables d'environnement) :
 *   CABINET        nom exact du cabinet visé        (défaut « Cabinet Demo »)
 *   EMAIL_CONTACT  boîte qui reçoit tous les envois (défaut « ptiahou@gmail.com »)
 *   NB_CLIENTS     nombre de clients à créer        (défaut 25)
 *   MOIS           profondeur d'historique en mois  (défaut 8)
 *   GRAINE         graine du tirage                 (défaut 20260812)
 *   PURGER         « oui » pour effacer l'activité simulée précédente
 *
 * Toutes les adresses pointent vers EMAIL_CONTACT en sous-adressage
 * (`contact+abc@…`), afin que les envois et les rappels arrivent réellement
 * dans une seule boîte tout en restant distinguables.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CABINET = process.env.CABINET ?? "Cabinet Demo";
const EMAIL_CONTACT = process.env.EMAIL_CONTACT ?? "ptiahou@gmail.com";
const NB_CLIENTS = Number(process.env.NB_CLIENTS ?? 25);
const MOIS = Number(process.env.MOIS ?? 8);
const GRAINE = Number(process.env.GRAINE ?? 20260812);
const PURGER = (process.env.PURGER ?? "").toLowerCase() === "oui";

/** Marque tout ce que ce script crée, pour pouvoir le retirer sans toucher au reste. */
const MARQUE = "[simulation]";

/* ────────────────────────── Tirage déterministe ────────────────────────── */

function generateur(graine) {
  let a = graine >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const alea = generateur(GRAINE);
const entre = (min, max) => min + Math.floor(alea() * (max - min + 1));
const parmi = (liste) => liste[Math.floor(alea() * liste.length)];
const chance = (p) => alea() < p;

/* ─────────────────────── Vocabulaires combinatoires ────────────────────── */

const PRENOMS = ["Amélie", "Jean-Christophe", "Sophie", "Marc", "Karine", "Étienne",
  "Nadia", "Félix", "Josée", "Simon", "Catherine", "Olivier", "Manon", "Vincent"];
const NOMS = ["Tremblay", "Gagnon", "Roy", "Côté", "Bouchard", "Lafleur", "Girard",
  "Morin", "Beaulieu", "Fortin", "Sirois", "Lévesque", "Pelletier", "Dubois"];
const FORMES = ["inc.", "s.e.n.c.", "ltée"];
const ACTIVITES = ["Constructions", "Groupe immobilier", "Coopérative", "Transport",
  "Clinique", "Ateliers", "Gestion", "Services", "Distribution", "Fiducie"];
const LIEUX = ["Rive-Sud", "Northfield", "Sainte-Foy", "Longueuil", "Outremont",
  "Rosemont", "Verdun", "Laurentides", "Beauport", "Hochelaga"];
/* `type` est une énumération du schéma : on s'y tient, sinon la création
   échoue et les filtres par matière ne trouveraient rien. */
const MATIERES = [
  { type: "litige_civil", libelle: "litige civil", actes: ["Analyse du dossier", "Rédaction de la mise en demeure", "Conférence de gestion"] },
  { type: "immobilier", libelle: "immobilier", actes: ["Vérification des titres", "Rédaction de l'acte", "Séance de signature"] },
  { type: "droit_famille", libelle: "droit de la famille", actes: ["Rencontre client", "Rédaction de la demande", "Médiation"] },
  { type: "corporate", libelle: "droit corporatif", actes: ["Convention entre actionnaires", "Négociation", "Clôture"] },
  { type: "immigration", libelle: "immigration", actes: ["Montage du dossier", "Dépôt de la demande", "Suivi auprès du ministère"] },
];

/* Taxes du Québec. Elles ne sont pas décoratives : les totaux doivent tomber
   juste, sinon la simulation ment sur la seule chose qui compte ici. */
const TPS = 0.05;
const TVQ = 0.09975;
const arrondi = (n) => Math.round(n * 100) / 100;

const JOUR = 86_400_000;
const ilYa = (jours) => new Date(Date.now() - jours * JOUR);
const dans = (jours) => new Date(Date.now() + jours * JOUR);

/* ──────────────────────────────── Exécution ────────────────────────────── */

async function main() {
  console.log(`\n🎬 Simulation d'activité — ${CABINET}`);
  console.log("─".repeat(64));

  const cabinet = await prisma.cabinet.findFirst({ where: { nom: CABINET } });
  if (!cabinet) {
    console.error(`❌ Cabinet « ${CABINET} » introuvable. Créez-le avant de simuler.`);
    process.exitCode = 1;
    return;
  }

  const avocats = await prisma.user.findMany({
    where: { cabinetId: cabinet.id, role: { in: ["avocat", "admin_cabinet"] } },
    select: { id: true, nom: true },
  });
  if (avocats.length === 0) {
    console.error("❌ Aucun avocat dans ce cabinet : les heures n'auraient pas d'auteur.");
    process.exitCode = 1;
    return;
  }

  if (PURGER) {
    const cibles = await prisma.client.findMany({
      where: { cabinetId: cabinet.id, notesConfidentielles: { contains: MARQUE } },
      select: { id: true },
    });
    const ids = cibles.map((c) => c.id);
    if (ids.length) {
      await prisma.trustTransaction.deleteMany({ where: { clientId: { in: ids } } });
      await prisma.payment.deleteMany({ where: { clientId: { in: ids } } });
      await prisma.timeEntry.deleteMany({ where: { clientId: { in: ids } } });
      await prisma.invoice.deleteMany({ where: { clientId: { in: ids } } });
      await prisma.dossier.deleteMany({ where: { clientId: { in: ids } } });
      await prisma.client.deleteMany({ where: { id: { in: ids } } });
    }
    console.log(`[0] Purge : ${ids.length} client(s) de simulation retiré(s)`);
  }

  const [local, domaine] = EMAIL_CONTACT.split("@");
  let compteur = { clients: 0, dossiers: 0, heures: 0, factures: 0, paiements: 0, mouvements: 0 };
  const annee = new Date().getFullYear();

  /*
   * La numérotation suit celle du produit, elle ne s'en invente pas une.
   *
   * `lib/dossiers/numero.ts` et `lib/facturation/invoice-numero-format.ts`
   * écrivent tous deux `ANNÉE-XXX`, séquence sur TROIS chiffres. Une simulation
   * qui pose `2026-0011` fabrique des numéros que l'application ne produirait
   * jamais, et le registre se met à mélanger deux conventions sous les yeux du
   * cabinet.
   *
   * La séquence part du MAX analysé, pas d'un `count()` : c'est la règle
   * anti-réemploi des deux services. Un enregistrement supprimé ne rend jamais
   * son numéro, et pour les factures la séquence émise doit rester sans trou.
   */
  const suite = (numeros) => {
    let max = 0;
    for (const n of numeros) {
      const m = /^(\d{4})-(\d+)$/.exec(n ?? "");
      if (m && Number(m[1]) === annee) max = Math.max(max, Number(m[2]));
    }
    return max;
  };
  const numeroter = (sequence) => `${annee}-${String(sequence).padStart(3, "0")}`;

  let numeroFacture =
    suite(
      (await prisma.invoice.findMany({ where: { cabinetId: cabinet.id }, select: { numero: true } }))
        .map((f) => f.numero),
    ) + 1;
  let numeroDossier =
    suite(
      (await prisma.dossier.findMany({
        where: { cabinetId: cabinet.id },
        select: { numeroDossier: true },
      })).map((d) => d.numeroDossier),
    ) + 1;

  for (let i = 0; i < NB_CLIENTS; i++) {
    const morale = chance(0.4);
    const jeton = `c${String(i + 1).padStart(2, "0")}`;
    /* Sous-adressage : tout arrive dans EMAIL_CONTACT, chaque client reste
       identifiable dans la boîte, et les rappels sont réellement vérifiables. */
    const email = `${local}+${jeton}@${domaine}`;

    const prenom = morale ? null : parmi(PRENOMS);
    const nom = morale ? null : parmi(NOMS);
    const raisonSociale = morale ? `${parmi(ACTIVITES)} ${parmi(LIEUX)} ${parmi(FORMES)}` : null;

    /* Le statut suit une distribution, pas un tirage plat : un cabinet réel a
       une grande majorité de clients actifs. */
    const statut = chance(0.84) ? "actif" : chance(0.6) ? "inactif" : "archive";

    /* Le solde fiduciaire se décide avant la création : il faut le poser sur le
       client ET l'appuyer sur de vrais mouvements, sinon les deux sources se
       contredisent.

       ⚠ PLUS AUCUN SOLDE NÉGATIF, décision CEO du 2026-08-30.

       Ce script produisait volontairement un découvert sur le quatrième client
       (`i === 3 ? -1725`), au motif qu'un manquement à B-1 r.5 « doit exister
       pour être visible à l'écran ». L'intention se défendait, mais elle a deux
       conséquences que personne ne voulait :

       - le rapprochement du cabinet de démonstration ne peut JAMAIS être
         certifié, `reconciliation-service.ts` refusant de certifier par-dessus
         une carte débitrice. Le cabinet vitrine est donc, par construction, un
         cabinet non conforme ;
       - la vitrine s'appuie sur ces chiffres. Elle affichait un agrégat qui
         masquait le découvert, ce qui est exactement ce que le garde-fou
         interdit.

       Qui veut éprouver le garde-fou le fait par un test, pas par le jeu de
       démonstration. Le solde tiré est donc nul ou positif, jamais négatif. */
    const soldeFiducie = chance(0.35) ? entre(5, 240) * 100 : 0;

    const client = await prisma.client.create({
      data: {
        cabinetId: cabinet.id,
        typeClient: morale ? "personne_morale" : "personne_physique",
        status: statut,
        raisonSociale,
        prenom,
        nom,
        email,
        telephone: `${parmi(["514", "418", "450", "819", "581"])} 555-${String(entre(100, 999)).padStart(4, "0")}`,
        langue: chance(0.85) ? "fr" : "en",
        assignedLawyerId: parmi(avocats).id,
        /* Une part des clients détient des sommes en fidéicommis. Un seul cas
           négatif est produit : c'est un manquement à B-1 r.5, il doit exister
           pour être visible à l'écran, mais il reste une exception. */
        trustAccountBalance: soldeFiducie,
        notesConfidentielles: `${MARQUE} client engendré, graine ${GRAINE}`,
      },
    });
    compteur.clients++;

    if (soldeFiducie > 0) {
      /* Un dépôt, et pour une carte sur trois un retrait de débours par-dessus.
         Le registre garde ainsi de la vie — un cabinet réel paie des débours
         depuis le fidéicommis — sans jamais pouvoir passer sous zéro.

         L'INVARIANT tient par construction et non par un tirage heureux : le
         dépôt vaut le solde visé PLUS le retrait, donc la carte finit
         exactement à `soldeFiducie`, qui est strictement positif. */
      const retrait = chance(0.33) ? entre(1, Math.max(1, Math.floor(soldeFiducie / 200))) * 100 : 0;
      const depot = soldeFiducie + retrait;
      await prisma.trustTransaction.create({
        data: {
          cabinetId: cabinet.id,
          clientId: client.id,
          date: ilYa(entre(30, MOIS * 30)),
          amount: depot,
          type: "deposit",
          description: "Provision reçue du client",
          note: MARQUE,
        },
      });
      compteur.mouvements++;
      if (retrait > 0) {
        await prisma.trustTransaction.create({
          data: {
            cabinetId: cabinet.id,
            clientId: client.id,
            date: ilYa(entre(1, 25)),
            amount: -retrait,
            type: "withdrawal",
            description: "Débours payés pour le client",
            note: MARQUE,
          },
        });
        compteur.mouvements++;
      }
    }

    const nbDossiers = statut === "actif" ? entre(1, 3) : entre(0, 1);
    for (let d = 0; d < nbDossiers; d++) {
      const matiere = parmi(MATIERES);
      const ouvertIlYa = entre(20, MOIS * 30);
      const dossier = await prisma.dossier.create({
        data: {
          cabinetId: cabinet.id,
          clientId: client.id,
          numeroDossier: numeroter(numeroDossier++),
          intitule: `${morale ? raisonSociale.split(" ").slice(0, 2).join(" ") : nom} — ${matiere.libelle}`,
          type: matiere.type,
          statut: chance(0.8) ? "actif" : "cloture",
          dateOuverture: ilYa(ouvertIlYa),
          avocatResponsableId: parmi(avocats).id,
        },
      });
      compteur.dossiers++;

      /* Les heures d'abord, la facture ensuite : c'est le travail qui produit
         le montant, jamais l'inverse. */
      const taux = parmi([225, 250, 275, 300, 350]);
      const nbEntrees = entre(2, 7);
      let minutesFacturables = 0;
      for (let h = 0; h < nbEntrees; h++) {
        const minutes = entre(2, 16) * 15;
        const facturable = chance(0.88);
        if (facturable) minutesFacturables += minutes;
        await prisma.timeEntry.create({
          data: {
            cabinetId: cabinet.id,
            userId: parmi(avocats).id,
            clientId: client.id,
            dossierId: dossier.id,
            date: ilYa(entre(1, ouvertIlYa)),
            dureeMinutes: minutes,
            tauxHoraire: taux,
            montant: arrondi((minutes / 60) * taux),
            description: parmi(matiere.actes),
            facturable,
            statut: "valide",
          },
        });
        compteur.heures++;
      }

      /* Deux dossiers sur trois ont été facturés. Le reste alimente le travail
         non facturé, qui doit apparaître quelque part à l'écran. */
      if (minutesFacturables > 0 && chance(0.66)) {
        const sousTotal = arrondi((minutesFacturables / 60) * taux);
        const tps = arrondi(sousTotal * TPS);
        const tvq = arrondi(sousTotal * TVQ);
        const total = arrondi(sousTotal + tps + tvq);

        const emiseIlYa = entre(3, Math.min(ouvertIlYa, MOIS * 30));
        const echeance = new Date(ilYa(emiseIlYa).getTime() + 30 * JOUR);
        const enRetard = echeance.getTime() < Date.now();

        /* Trois destins possibles, et ils produisent chacun un cas à vérifier :
           payée, partiellement payée, impayée en retard (donc relançable). */
        const destin = enRetard ? parmi(["payee", "partielle", "retard", "payee"]) : parmi(["payee", "envoyee", "partielle"]);
        const montantPaye =
          destin === "payee" ? total : destin === "partielle" ? arrondi(total * (entre(25, 70) / 100)) : 0;

        const statutHerite =
          destin === "payee" ? "payee"
          : destin === "partielle" ? "partiellement_payee"
          : destin === "retard" ? "en_retard"
          : "envoyee";
        /* Doctrine `INVOICE_STATUS_NORMALIZATION` :
           - `invoiceStatus` porte le CYCLE DE VIE. `OVERDUE` ne doit jamais
             être écrit : le retard se DÉRIVE de la date d'échéance, sinon il
             devient faux dès le lendemain. Une facture en retard est donc
             `ISSUED` avec une échéance passée.
           - `paymentStatus` porte le RÈGLEMENT, et c'est lui que lisent les
             écrans de facturation. L'omettre laissait 31 factures en `UNPAID`,
             dont onze intégralement payées. */
        const statutCanonique = destin === "payee" ? "PAID" : "ISSUED";
        const statutReglement =
          destin === "payee" ? "PAID" : destin === "partielle" ? "PARTIAL" : "UNPAID";

        const facture = await prisma.invoice.create({
          data: {
            cabinetId: cabinet.id,
            clientId: client.id,
            dossierId: dossier.id,
            numero: numeroter(numeroFacture++),
            dateEmission: ilYa(emiseIlYa),
            dateEcheance: echeance,
            statut: statutHerite,
            invoiceStatus: statutCanonique,
            paymentStatus: statutReglement,
            subtotalTaxable: sousTotal,
            subtotalFees: sousTotal,
            subtotalBeforeTax: sousTotal,
            tps,
            tvq,
            montantTotal: total,
            montantPaye,
            balanceDue: arrondi(total - montantPaye),
            internalNote: MARQUE,
          },
        });
        compteur.factures++;

        if (montantPaye > 0) {
          await prisma.payment.create({
            data: {
              cabinetId: cabinet.id,
              clientId: client.id,
              invoiceId: facture.id,
              montant: montantPaye,
              datePaiement: ilYa(Math.max(1, emiseIlYa - entre(2, 25))),
              method: parmi(["virement", "cheque", "carte", "autre"]),
              note: MARQUE,
            },
          });
          compteur.paiements++;
        }
      }
    }
  }

  console.log(`[1] Clients    : ${compteur.clients}  (tous joignables à ${EMAIL_CONTACT})`);
  console.log(`[2] Dossiers   : ${compteur.dossiers}`);
  console.log(`[3] Heures     : ${compteur.heures}`);
  console.log(`[4] Factures   : ${compteur.factures}`);
  console.log(`[5] Paiements  : ${compteur.paiements}`);
  console.log(`[6] Fidéicommis: ${compteur.mouvements} mouvement(s)`);

  /* ── GARDE-FOU DE SORTIE ──────────────────────────────────────────────────
     On ne se fie pas au raisonnement ci-dessus : on VÉRIFIE. Le script relit
     les mouvements qu'il vient d'écrire et refuse de se terminer normalement
     si une carte-client est débitrice.

     Un découvert ne se voit pas dans les compteurs : il faut le chercher carte
     par carte, parce qu'un total sain peut masquer un compte à −200 $ compensé
     par un autre à +200 $. C'est le raisonnement de `reconciliation-service.ts`,
     et le simulateur se doit de le tenir aussi. */
  const mouvements = await prisma.trustTransaction.findMany({
    where: { cabinetId: cabinet.id },
    select: { clientId: true, amount: true },
  });
  const cartes = new Map();
  for (const m of mouvements) cartes.set(m.clientId, (cartes.get(m.clientId) ?? 0) + m.amount);
  const debitrices = [...cartes.entries()].filter(([, solde]) => solde < -0.005);
  if (debitrices.length > 0) {
    throw new Error(
      `${debitrices.length} carte(s)-client(s) débitrice(s) : ` +
        debitrices.map(([id, solde]) => `${id} (${solde.toFixed(2)} $)`).join(", ") +
        ". Le rapprochement ne pourrait pas être certifié.",
    );
  }
  console.log(`[7] Contrôle   : ${cartes.size} carte(s)-client(s), aucune débitrice`);
  console.log("─".repeat(64));
  console.log(`✅ Activité simulée. Graine ${GRAINE} : rejouer donne le même cabinet.`);
  console.log(`   Retirer : PURGER=oui node --env-file=.env.local scripts/simuler-activite.mjs\n`);
}

main()
  .catch((e) => {
    console.error("❌", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
