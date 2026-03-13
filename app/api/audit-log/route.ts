import { NextResponse } from "next/server";
import { getSessionOrRespond } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { canViewAuditLog, canViewFullAuditLog } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await getSessionOrRespond();
  if (auth instanceof NextResponse) return auth;
  const { session, cabinetId } = auth;
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!canViewAuditLog(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType") ?? undefined;
  const entityId = searchParams.get("entityId") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const cursor = searchParams.get("cursor") ?? undefined;

  const where: { cabinetId: string; entityType?: string; entityId?: string; userId?: string } = {
    cabinetId,
  };
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (!canViewFullAuditLog(role) && userId) {
    where.userId = userId;
  }

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

  return NextResponse.json({
    items: items.map((log) => ({
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      userId: log.userId,
      user: log.user,
      ip: log.ip,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    })),
    nextCursor,
  });
}
