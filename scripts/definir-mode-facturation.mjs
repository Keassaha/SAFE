/**
 * Choisit le mode de facturation principal d'un cabinet : horaire, forfait ou mixte.
 *
 * POURQUOI CE SCRIPT EXISTE
 *
 * Le mode vit dans `CabinetInterface.modules.facturation.principal`, lu par
 * `getCabinetInterfaceDerived` puis distribué à toute l'application : la page
 * Temps, le formulaire de dossier, les libellés de facture.
 *
 * L'écran des réglages sait maintenant l'écrire (Paramètres → Facture), mais il
 * n'est pas encore en production. Tant qu'il ne l'est pas, ce script est la
 * seule façon de basculer un cabinet déjà installé.
 *
 * CE QU'IL FAIT, EXACTEMENT
 *
 *   horaire  le dossier porte un taux, la facture se construit à partir des heures
 *   forfait  aucun taux demandé, la facture se construit à partir des tâches
 *   mixte    les deux coexistent, une bascule apparaît à chaque ajout
 *
 * Le JSON `modules` porte aussi le régime de taxes, le profil comptable et la
 * conformité. Il est donc FUSIONNÉ, jamais remplacé : écraser la clé
 * réinitialiserait silencieusement les taxes du cabinet.
 *
 * SÉCURITÉ
 *
 *   - Aucun cabinet n'est touché sans être nommé. Pas de joker, pas de "tous".
 *   - Simulation par défaut. Rien n'est écrit sans --apply.
 *   - L'état avant et après est imprimé pour chaque cabinet.
 *
 * USAGE
 *
 *   node --env-file=.env.local scripts/definir-mode-facturation.mjs --list
 *   node --env-file=.env.local scripts/definir-mode-facturation.mjs --cabinet=cabinet-test-2026 --mode=mixte
 *   node --env-file=.env.local scripts/definir-mode-facturation.mjs --cabinet=... --mode=mixte --apply
 *
 * Pour la production, remplacer --env-file=.env.local par --env-file=.env.production.local.
 * Un cabinet se désigne par son id, son courriel, ou un fragment de son nom.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODES = ["horaire", "forfait", "mixte"];

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const LIST = args.includes("--list");
const MODE = readFlag("--mode");
const CIBLES = args
  .filter((a) => a.startsWith("--cabinet="))
  .map((a) => a.slice("--cabinet=".length).trim())
  .filter(Boolean);

function readFlag(name) {
  const hit = args.find((a) => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1).trim() : null;
}

/** Lit le mode courant sans jamais faire échouer sur un JSON abîmé. */
function lireMode(modulesJson) {
  if (!modulesJson) return { modules: {}, mode: "horaire", explicite: false };
  try {
    const modules = JSON.parse(modulesJson);
    if (!modules || typeof modules !== "object") {
      return { modules: {}, mode: "horaire", explicite: false };
    }
    const brut = modules?.facturation?.principal;
    if (brut === "forfait") return { modules, mode: "forfait", explicite: true };
    if (brut === "mixte" || brut === "mixed") return { modules, mode: "mixte", explicite: true };
    if (brut === "horaire") return { modules, mode: "horaire", explicite: true };
    return { modules, mode: "horaire", explicite: false };
  } catch {
    return { modules: {}, mode: "horaire", explicite: false };
  }
}

async function main() {
  if (LIST) {
    const cabinets = await prisma.cabinet.findMany({
      orderBy: { nom: "asc" },
      select: {
        id: true, nom: true, email: true,
        interfaceConfig: { select: { modules: true } },
        _count: { select: { users: true, timeEntries: true } },
      },
    });
    console.log(`\n${cabinets.length} cabinet(s) :\n`);
    for (const c of cabinets) {
      const { mode, explicite } = lireMode(c.interfaceConfig?.modules ?? null);
      console.log(
        `  ${mode.toUpperCase().padEnd(8)}${explicite ? " " : "*"} ${c.id}\n` +
        `             ${c.nom}${c.email ? `  <${c.email}>` : ""}\n` +
        `             utilisateurs=${c._count.users}  entrées de temps=${c._count.timeEntries}\n`
      );
    }
    console.log("  * mode par défaut, jamais écrit explicitement.\n");
    return;
  }

  if (!MODES.includes(MODE ?? "") || CIBLES.length === 0) {
    console.error(
      "Usage :\n" +
      "  --list                      pour voir les cabinets et leur mode actuel\n" +
      "  --cabinet=<id|courriel|nom> pour en désigner un (répétable)\n" +
      `  --mode=<${MODES.join("|")}>  le mode voulu\n` +
      "  --apply                     pour écrire réellement\n"
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `\n${APPLY ? "ÉCRITURE RÉELLE" : "SIMULATION (ajoutez --apply pour écrire)"}\n` +
    `Mode visé : ${MODE}\n`
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
      select: { id: true, nom: true, email: true, interfaceConfig: { select: { modules: true } } },
    });

    if (!cabinet) {
      console.log(`  ✗ « ${cible} » : introuvable. Rien n'est touché.\n`);
      continue;
    }

    const { modules, mode: avant, explicite } = lireMode(cabinet.interfaceConfig?.modules ?? null);
    console.log(`  ${cabinet.nom} (${cabinet.id})`);
    console.log(`     avant : ${avant}${explicite ? "" : " (par défaut, non écrit)"}`);

    if (avant === MODE && explicite) {
      console.log(`     après : ${MODE} — déjà à ce mode, rien à faire.\n`);
      continue;
    }

    const facturation = (modules.facturation && typeof modules.facturation === "object")
      ? modules.facturation
      : {};
    modules.facturation = { ...facturation, principal: MODE };
    const json = JSON.stringify(modules);

    console.log(`     après : ${MODE}`);
    const autresCles = Object.keys(modules).filter((k) => k !== "facturation");
    if (autresCles.length > 0) {
      console.log(`     conservé : ${autresCles.join(", ")}`);
    }

    if (APPLY) {
      await prisma.cabinetInterface.upsert({
        where: { cabinetId: cabinet.id },
        create: { cabinetId: cabinet.id, modules: json },
        update: { modules: json },
      });
      console.log("     écrit.\n");
      touches += 1;
    } else {
      console.log("     (simulation)\n");
    }
  }

  if (APPLY) {
    console.log(`${touches} cabinet(s) modifié(s).\n`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
