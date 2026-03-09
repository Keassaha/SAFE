import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { AuditLogList } from "@/components/audit/AuditLogList";
import { canViewAuditLog } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { routes } from "@/lib/routes";
import { getTranslations } from "next-intl/server";

export default async function ParametresAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; cursor?: string }>;
}) {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canViewAuditLog(role as UserRole)) {
    redirect(routes.parametres);
  }
  const { entityType, cursor } = await searchParams;
  const limit = 50;
  const where: { cabinetId: string; entityType?: string; userId?: string } = { cabinetId };
  if (entityType) where.entityType = entityType;
  const fullAccess = role === "admin_cabinet" || role === "assistante";
  if (!fullAccess && userId) where.userId = userId;

  const logs = await prisma.auditLog.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    include: { user: { select: { nom: true, email: true } } },
  });
  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  const t = await getTranslations("parametres");

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={t("auditTitle")}
        description={t("auditDescription")}
        backHref={routes.parametres}
        backLabel={t("backToSettings")}
      />
      <Card>
        <CardHeader title={t("recentLogs")} />
        <CardContent className="p-0">
          <AuditLogList
            items={items.map((log) => ({
              id: log.id,
              entityType: log.entityType,
              entityId: log.entityId,
              action: log.action,
              metadata: log.metadata ? JSON.parse(log.metadata) : null,
              user: log.user,
              createdAt: log.createdAt,
            }))}
            nextCursor={nextCursor}
            entityTypeFilter={entityType}
          />
        </CardContent>
      </Card>
    </div>
  );
}
