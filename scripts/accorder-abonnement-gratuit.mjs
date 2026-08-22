/**
 * Accorde un accès gratuit à un ou plusieurs cabinets, pour une durée donnée.
 *
 * POURQUOI CE SCRIPT EXISTE
 *
 * Le seul écrivain de `Cabinet.stripeSubscriptionStatus` est le webhook Stripe
 * (`lib/services/stripe-subscription.ts`). Il n'existe aucune façon d'accorder un
 * accès gratuit depuis l'application. Or l'offre fondatrice en prévoit plusieurs,
 * et les comptes de démonstration en ont besoin en permanence.
 *
 * CE QU'IL FAIT, EXACTEMENT
 *
 * La garde d'accès ne regarde qu'une chose (`lib/services/subscription-state.ts`) :
 *   active = stripeSubscriptionStatus ∈ { "active", "trialing" }
 *
 * On pose donc `trialing`, pas `active`. C'est le mot juste : un accès gratuit
 * avec une fin connue est un essai, pas un abonnement payé. Le jour où un vrai
 * paiement Stripe s'attache au cabinet, le webhook écrase proprement ces valeurs.
 *
 * SÉCURITÉ
 *
 *   - Aucun cabinet n'est touché sans être nommé. Pas de joker, pas de "tous".
 *   - Simulation par défaut. Rien n'est écrit sans --apply.
 *   - L'état avant et après est imprimé pour chaque cabinet.
 *
 * USAGE
 *
 *   node scripts/accorder-abonnement-gratuit.mjs --list
 *   node scripts/accorder-abonnement-gratuit.mjs --cabinet=dadie-avocat-qc-2026 --mois=6
 *   node scripts/accorder-abonnement-gratuit.mjs --cabinet=... --mois=6 --apply
 *
 * Un cabinet se désigne par son id, son courriel, ou un fragment de son nom.
 * `--plan=` est optionnel : sans lui, le forfait technique existant n'est pas touché.
 * Rappel : les paliers de `PLANS` (lib/stripe.ts) ne sont appliqués nulle part au
 * runtime, mais `cabinet` reste le palier attendu pour un cabinet avec fidéicommis.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const LIST = args.includes("--list");
const FORCE = args.includes("--force");
const MOIS = Number(readFlag("--mois") ?? 6);
const PLAN = readFlag("--plan");
const CIBLES = args
  .filter((a) => a.startsWith("--cabinet="))
  .map((a) => a.slice("--cabinet=".length).trim())
  .filter(Boolean);

function readFlag(name) {
  const hit = args.find((a) => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1).trim() : null;
}

function money(d) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

/** Ajoute N mois sans déborder (31 janvier + 1 mois → 28/29 février). */
function ajouterMois(date, mois) {
  const d = new Date(date.getTime());
  const jour = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + mois);
  const dernierJour = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(jour, dernierJour));
  return d;
}

async function main() {
  if (LIST) {
    const cabinets = await prisma.cabinet.findMany({
      orderBy: { nom: "asc" },
      select: {
        id: true, nom: true, email: true, plan: true,
        stripeSubscriptionStatus: true, stripeTrialEnd: true, stripeCurrentPeriodEnd: true,
        _count: { select: { users: true } },
      },
    });
    console.log(`\n${cabinets.length} cabinet(s) :\n`);
    for (const c of cabinets) {
      const etat = ["active", "trialing"].includes(c.stripeSubscriptionStatus ?? "")
        ? "ACTIF  "
        : "BLOQUÉ ";
      console.log(
        `  ${etat} ${c.id}\n` +
        `          ${c.nom}${c.email ? `  <${c.email}>` : ""}\n` +
        `          forfait=${c.plan}  statut=${c.stripeSubscriptionStatus ?? "aucun"}  ` +
        `fin=${money(c.stripeTrialEnd ?? c.stripeCurrentPeriodEnd)}  utilisateurs=${c._count.users}\n`
      );
    }
    return;
  }

  if (CIBLES.length === 0) {
    console.error(
      "Aucun cabinet nommé.\n" +
      "  --list                      pour voir les cabinets et leur état\n" +
      "  --cabinet=<id|courriel|nom> pour en désigner un (répétable)\n" +
      "  --mois=6                    durée de l'accès (défaut : 6)\n" +
      "  --apply                     pour écrire réellement\n" +
      "  --force                     autorise à RACCOURCIR un accès déjà plus long\n"
    );
    process.exitCode = 1;
    return;
  }

  const maintenant = new Date();
  const fin = ajouterMois(maintenant, MOIS);

  console.log(
    `\n${APPLY ? "ÉCRITURE RÉELLE" : "SIMULATION (ajoutez --apply pour écrire)"}\n` +
    `Accès gratuit de ${MOIS} mois, jusqu'au ${money(fin)}.\n`
  );

  let touches = 0;
  for (const cible of CIBLES) {
    const cabinet = await prisma.cabinet.findFirst({
      where: {
        OR: [
          { id: cible },
          { email: cible },
          { nom: { contains: cible, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, nom: true, email: true, plan: true,
        stripeSubscriptionStatus: true, stripeTrialEnd: true,
        stripeCurrentPeriodEnd: true, stripeCancelAtPeriodEnd: true,
      },
    });

    if (!cabinet) {
      console.log(`  ✗ « ${cible} » : introuvable. Rien n'est touché.\n`);
      continue;
    }

    console.log(`  ${cabinet.nom}  [${cabinet.id}]`);
    console.log(
      `     avant : statut=${cabinet.stripeSubscriptionStatus ?? "aucun"}  ` +
      `forfait=${cabinet.plan}  fin=${money(cabinet.stripeTrialEnd ?? cabinet.stripeCurrentPeriodEnd)}`
    );
    console.log(
      `     après : statut=trialing  forfait=${PLAN ?? cabinet.plan}  fin=${money(fin)}`
    );

    // Garde anti-raccourcissement : un cabinet déjà couvert plus loin que la
    // nouvelle échéance perdrait des jours d'accès. Ce n'est presque jamais
    // l'intention, et ça se verrait seulement le jour où l'avocate est bloquée.
    const finActuelle = cabinet.stripeTrialEnd ?? cabinet.stripeCurrentPeriodEnd;
    if (finActuelle && finActuelle > fin && !FORCE) {
      console.log(
        `     ✗ IGNORÉ : ce cabinet est déjà couvert jusqu'au ${money(finActuelle)}, ` +
        `soit plus loin que ${money(fin)}.\n` +
        "       Ajoutez --force uniquement si vous voulez vraiment raccourcir son accès.\n"
      );
      continue;
    }

    if (APPLY) {
      await prisma.cabinet.update({
        where: { id: cabinet.id },
        data: {
          stripeSubscriptionStatus: "trialing",
          stripeTrialEnd: fin,
          stripeCurrentPeriodEnd: fin,
          stripeCancelAtPeriodEnd: false,
          ...(PLAN ? { plan: PLAN } : {}),
        },
      });
      console.log("     ✓ écrit");
      touches += 1;
    }
    console.log("");
  }

  if (APPLY) {
    console.log(`${touches} cabinet(s) mis à jour. L'effet est immédiat au prochain chargement de page.\n`);
  }
}

main()
  .catch((e) => {
    console.error("Échec :", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
