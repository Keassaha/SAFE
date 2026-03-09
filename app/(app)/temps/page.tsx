import { requireCabinetAndUser } from "@/lib/auth/session";
import { TempsPageClient } from "./TempsPageClient";
import type { UserRole } from "@prisma/client";

export default async function TempsPage() {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  return (
    <TempsPageClient
      cabinetId={cabinetId}
      userId={userId}
      role={role as UserRole}
    />
  );
}
