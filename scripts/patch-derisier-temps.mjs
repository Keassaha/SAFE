/**
 * One-off patch — ensures "temps" is visible in the sidebar for Me Derisier.
 *
 * Context: initial seeds hid the "temps" tab. In forfait mode the page now
 * renders as a Task Register (Fiche de temps) — visible capture of tasks +
 * fees per matter. This script aligns the existing CabinetInterface row with
 * the updated seed files.
 *
 * Usage: node scripts/patch-derisier-temps.mjs
 * Idempotent.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseArray(raw, fallback = []) {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

async function patch(cabinetId, label) {
  const iface = await prisma.cabinetInterface.findUnique({ where: { cabinetId } });
  if (!iface) {
    console.log(`   ⏭  ${label}: no CabinetInterface row`);
    return;
  }

  const active = parseArray(iface.ongletsActifs);
  const hidden = parseArray(iface.ongletsMasques);

  const nextActive = active.includes("temps") ? active : [...active, "temps"];
  const nextHidden = hidden.filter((id) => id !== "temps");

  const changedActive = nextActive.length !== active.length;
  const changedHidden = nextHidden.length !== hidden.length;

  if (!changedActive && !changedHidden) {
    console.log(`   ✅ ${label}: already correct`);
    return;
  }

  await prisma.cabinetInterface.update({
    where: { cabinetId },
    data: {
      ongletsActifs: JSON.stringify(nextActive),
      ongletsMasques: JSON.stringify(nextHidden),
    },
  });
  console.log(`   🔧 ${label}: updated`);
  if (changedActive) console.log(`      + added "temps" to ongletsActifs`);
  if (changedHidden) console.log(`      − removed "temps" from ongletsMasques`);
}

async function main() {
  console.log("🔧 Patching Derisier Law CabinetInterface — unhide \"temps\" tab\n");

  const cabinets = await prisma.cabinet.findMany({
    where: { nom: { contains: "Derisier" } },
    select: { id: true, nom: true },
  });

  if (cabinets.length === 0) {
    console.log("   ⚠️  No Derisier cabinet found.");
    return;
  }

  for (const c of cabinets) {
    await patch(c.id, `${c.nom} (${c.id})`);
  }

  console.log("\n✅ Done.");
}

main()
  .catch((e) => {
    console.error("❌ Patch failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
