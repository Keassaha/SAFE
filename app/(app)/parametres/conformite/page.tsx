import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import { resolveProvince } from "@/lib/compliance/rules";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveEnforcement } from "@/lib/services/identity/identity-gate";
import {
  updateIdentityProofRequirement,
  updateIdentityGateEnforcement,
} from "./actions";
import type { UserRole } from "@prisma/client";
import { routes } from "@/lib/routes";

/**
 * Réglages de conformité — identité.
 *
 * Deux leviers volontairement placés sur la même page, parce qu'ils se répondent :
 * on n'active pas le blocage sans savoir si la pièce est exigée, et on ne lève pas
 * l'exigence de pièce sans savoir si le blocage est actif.
 */
export default async function ParametresConformitePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const sp = await searchParams;
  const { cabinetId, role } = await requireCabinetAndUser();
  const canManage = canManageCabinetSettings(role as UserRole);

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: {
      identityProofRequired: true,
      identityProofWaivedAt: true,
      identityProofWaiverReason: true,
      identityGateEnforcedFrom: true,
    },
  });
  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const enforcement = resolveEnforcement(cabinet?.identityGateEnforcedFrom ?? null, new Date());

  const waiver = province === "QC" ? "B-1 r.5, art. 22" : "By-Law 7.1, s. 23(13)";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conformité — identité du client"
        backHref={routes.parametres}
        backLabel="Retour aux paramètres"
      />

      {sp.error === "reason_required" && (
        <p className="rounded-safe border border-status-error/30 bg-status-error/5 px-3 py-2 text-sm text-status-error">
          Un motif d'au moins 10 caractères est requis pour lever l'exigence de pièce
          justificative. Ce motif devient la réponse du cabinet en cas d'inspection.
        </p>
      )}
      {sp.success && (
        <p className="rounded-safe border border-primary-500/30 bg-primary-500/5 px-3 py-2 text-sm">
          Réglage enregistré.
        </p>
      )}

      {/* ── 1. Blocage des mouvements de fonds ─────────────────────────────── */}
      <Card>
        <CardHeader title="Blocage des mouvements de fonds sans vérification d'identité" />
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-muted">
            {province === "QC"
              ? "Au Québec, la vérification d'identité doit être faite au plus tard au moment où l'avocat reçoit des fonds (B-1 r.5, art. 26(1)). Une fois la date ci-dessous atteinte, SAFE refuse tout dépôt ou retrait fidéicommis pour une personne physique non vérifiée."
              : "In Ontario, verification follows the first funds movement (By-Law 7.1, s. 23(5)-(6)): 30 days for an organization. Once the date below is reached, SAFE refuses further trust movements for a client whose verification is overdue."}
          </p>

          <div className="rounded-safe border border-neutral-border bg-neutral-50/60 px-3 py-2 text-sm">
            <strong>État actuel : </strong>
            {enforcement.mode === "OBSERVING" && (
              <span>
                observation. Le contrôle s'exécute et journalise, mais ne bloque rien.
                <span className="block text-xs text-amber-700 mt-1">
                  Écart de conformité ouvert : aucune date d'application n'est fixée.
                </span>
              </span>
            )}
            {enforcement.mode === "GRACE" && (
              <span>
                régularisation en cours — application dans {enforcement.daysUntilEnforcement} jour(s),
                le {enforcement.enforcedFrom.toISOString().slice(0, 10)}.
              </span>
            )}
            {enforcement.mode === "ENFORCING" && (
              <span>
                appliqué depuis le {enforcement.enforcedFrom.toISOString().slice(0, 10)}.
              </span>
            )}
          </div>

          {canManage && (
            <form action={updateIdentityGateEnforcement} className="space-y-3">
              <Input
                label="Appliquer le blocage à partir du"
                name="enforcedFrom"
                type="date"
                defaultValue={
                  cabinet?.identityGateEnforcedFrom?.toISOString().slice(0, 10) ?? ""
                }
              />
              <p className="text-xs text-neutral-muted">
                Laisser vide pour rester en observation. Une date, plutôt qu'un interrupteur,
                oblige à répondre « à partir de quand » — et rend l'absence de décision visible.
              </p>
              <Button type="submit">Enregistrer</Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ── 2. Exigence de pièce justificative ─────────────────────────────── */}
      <Card>
        <CardHeader title="Pièce justificative de la vérification d'identité" />
        <CardContent className="space-y-4">
          <p className="text-sm text-neutral-muted">
            Par défaut, une identité ne peut être marquée « vérifiée » qu'avec une pièce
            déposée dans SAFE, ou une confirmation manuelle indiquant où la pièce est
            conservée ({waiver}).
          </p>
          <p className="text-sm text-neutral-muted">
            Lever cette exigence permet d'enregistrer une vérification sans aucune preuve.
            <strong> Cela ne dispense pas de conserver la pièce au dossier</strong> : le
            règlement l'exige toujours. Cela dispense seulement de la déposer ici.
          </p>

          <div className="rounded-safe border border-neutral-border bg-neutral-50/60 px-3 py-2 text-sm">
            <strong>État actuel : </strong>
            {cabinet?.identityProofRequired ? (
              <span>pièce exigée.</span>
            ) : (
              <span>
                exigence levée
                {cabinet?.identityProofWaivedAt
                  ? ` le ${cabinet.identityProofWaivedAt.toISOString().slice(0, 10)}`
                  : ""}
                .
                {cabinet?.identityProofWaiverReason && (
                  <span className="block text-xs text-neutral-muted mt-1">
                    Motif consigné : {cabinet.identityProofWaiverReason}
                  </span>
                )}
              </span>
            )}
          </div>

          {canManage && (
            <form action={updateIdentityProofRequirement} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                  Exiger une pièce justificative
                </label>
                <select
                  name="identityProofRequired"
                  defaultValue={cabinet?.identityProofRequired ? "true" : "false"}
                  className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90"
                >
                  <option value="true">Oui — recommandé</option>
                  <option value="false">Non — lever l'exigence</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                  Motif (obligatoire pour lever)
                </label>
                <textarea
                  name="reason"
                  rows={2}
                  defaultValue={cabinet?.identityProofWaiverReason ?? ""}
                  placeholder="Ex. : les pièces d'identité sont conservées au dossier papier et numérisées dans notre système documentaire."
                  className="w-full px-3 py-2 rounded-safe border border-neutral-border bg-white/90"
                />
                <p className="mt-1 text-xs text-neutral-muted">
                  Ce motif est horodaté, attribué à votre compte, et apparaît dans la piste
                  d'audit. Il devient la réponse du cabinet si un inspecteur demande pourquoi
                  une vérification a été enregistrée sans pièce.
                </p>
              </div>
              <Button type="submit">Enregistrer</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
