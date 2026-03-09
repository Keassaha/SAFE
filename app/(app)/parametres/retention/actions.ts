"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageRetentionPolicies } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

export async function createRetentionPolicy(formData: FormData) {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canManageRetentionPolicies(role as UserRole)) {
    redirect("/parametres");
  }
  const documentType = (formData.get("documentType") as string)?.trim();
  const retentionYears = Number(formData.get("retentionYears"));
  const legalBasis = (formData.get("legalBasis") as string)?.trim() || undefined;
  if (!documentType || Number.isNaN(retentionYears) || retentionYears < 1) {
    redirect("/parametres/retention?error=invalid");
  }
  await prisma.documentRetentionPolicy.upsert({
    where: {
      cabinetId_documentType: { cabinetId, documentType },
    },
    create: {
      cabinetId,
      documentType,
      retentionYears,
      legalBasis,
    },
    update: {
      retentionYears,
      legalBasis,
    },
  });
  revalidatePath("/parametres/retention");
  redirect("/parametres/retention");
}

export async function deleteRetentionPolicy(id: string) {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canManageRetentionPolicies(role as UserRole)) {
    redirect("/parametres");
  }
  await prisma.documentRetentionPolicy.deleteMany({
    where: { id, cabinetId },
  });
  revalidatePath("/parametres/retention");
  redirect("/parametres/retention");
}
