import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import { getRegisters, type RegisterId } from "@/lib/compliance/registers";
import { loadRegister } from "@/lib/services/fideicommis/register-service";
import { RegistersScreen } from "@/components/conformite/RegistersScreen";

/**
 * Registres réglementaires.
 *
 * Art. 30 B-1 r.5 · par. 21(2) By-Law 9 : copie papier produite immédiatement sur
 * demande. Le moteur de rendu existait depuis CH-04 ; il n'avait pas d'écran.
 *
 * Seuls les registres applicables à la province sont proposés. En montrer d'autres
 * ferait croire à un cabinet qu'il a une obligation qu'il n'a pas.
 */

export default async function RegistresPage({
  searchParams,
}: {
  searchParams: Promise<{ registre?: string; periode?: string }>;
}) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-si-danger-ink">Vous n&apos;avez pas accès à la comptabilité en fidéicommis.</p>
      </div>
    );
  }

  const params = await searchParams;
  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const definitions = getRegisters(province);

  const known = new Set(definitions.map((d) => d.id));
  const selectedId = (
    params.registre && known.has(params.registre as RegisterId)
      ? params.registre
      : definitions[0]?.id
  ) as RegisterId | undefined;

  const periode = params.periode && /^\d{4}-\d{2}$/.test(params.periode) ? params.periode : null;

  let rendered = null;
  let error: string | null = null;

  if (selectedId) {
    try {
      const r = await loadRegister({
        cabinetId,
        registerId: selectedId,
        periode,
        generatedBy: userId,
      });
      rendered = {
        id: r.definition.id,
        titleFr: r.definition.titleFr,
        reference: r.definition.reference,
        noteFr: r.definition.noteFr ?? null,
        periodLabel: r.header.periodLabel,
        accountLabel: r.header.accountLabel,
        generatedAt: r.header.generatedAt.toISOString(),
        columns: r.columns.map((c) => ({
          key: c.key,
          labelFr: c.labelFr,
          align: c.align,
          money: c.money ?? false,
          reference: c.reference,
        })),
        // Les cellules sont formatées côté serveur par le même code que le CSV et
        // l'impression : l'écran, le fichier et la copie papier portent la même
        // chaîne, au caractère près.
        rows: r.rows.map((row) => {
          const out: Record<string, string> = {};
          for (const c of r.columns) out[c.key] = formatCell(row[c.key], c.money ?? false);
          return out;
        }),
        totals: r.totals,
        rowCount: r.rowCount,
        fingerprint: r.fingerprint,
      };
    } catch (e) {
      error = e instanceof Error ? e.message : "Registre indisponible.";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registres"
        description="Les livres que le règlement impose de tenir, prêts à imprimer."
        backHref={routes.inspection}
        backLabel="Retour à l'inspection"
      />

      <RegistersScreen
        province={province}
        registers={definitions.map((d) => ({
          id: d.id,
          titleFr: d.titleFr,
          reference: d.reference,
          noteFr: d.noteFr ?? null,
        }))}
        selectedId={selectedId ?? ""}
        periode={periode}
        rendered={rendered}
        error={error}
      />
    </div>
  );
}

/** Même règle de formatage que le CSV et l'impression : une seule vérité affichée. */
function formatCell(value: unknown, isMoney: boolean): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "boolean") return value ? "oui" : "non";
  if (typeof value === "number") {
    return isMoney
      ? value.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : String(value);
  }
  return String(value);
}
