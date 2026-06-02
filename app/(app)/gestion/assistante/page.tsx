/**
 * SAFE — File de travail de l'assistante.
 *
 * Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md
 *
 * Page server qui :
 *   - applique une garde RBAC explicite (assistante / admin_cabinet / avocat)
 *   - charge la file via `getAssistantQueue` avec un scope optionnel
 *   - rend la file via `AssistantQueueView`
 */

import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewAssistantQueue, canAssignSelfAsAssistant } from "@/lib/auth/permissions";
import { getAssistantQueue } from "@/lib/dossiers/assistant-queue";
import { AssistantQueueView } from "@/components/gestion/AssistantQueueView";
import { PageHeader } from "@/components/ui/PageHeader";
import type { UserRole } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{ scope?: string }>;
}

export default async function AssistanteFilePage({ searchParams }: PageProps) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();

  // Garde RBAC explicite — la sidebar ne suffit pas.
  if (!canViewAssistantQueue(role as UserRole)) {
    notFound();
  }

  const params = await searchParams;
  const scope = params.scope === "mine" ? "mine" : "all";

  const queue = await getAssistantQueue(cabinetId, userId, {
    scopeAssistantId: scope === "mine" ? userId : null,
  });

  const canSelfAssign = canAssignSelfAsAssistant(role as UserRole);
  const t = await getTranslations("mattersUi");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("assistantQueueTitle")}
        description={t("assistantQueueDescription")}
      />
      <AssistantQueueView
        queue={queue}
        currentScope={scope}
        canSelfAssign={canSelfAssign}
      />
    </div>
  );
}
