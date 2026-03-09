"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import type { CalendarEventType, CalendarEventStatus } from "@prisma/client";

export interface CreateEventInput {
  title: string;
  description?: string;
  type: CalendarEventType;
  date: string;
  startTime?: string;
  endTime?: string;
  allDay?: boolean;
  location?: string;
  clientId?: string;
  dossierId?: string;
  assigneeId?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: CalendarEventStatus;
}

export async function createCalendarEvent(input: CreateEventInput) {
  const { cabinetId, userId } = await requireCabinetAndUser();

  if (!input.title?.trim()) {
    return { error: "Le titre est requis" };
  }

  if (input.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, cabinetId },
      select: { id: true },
    });
    if (!client) return { error: "Client introuvable" };
  }

  if (input.dossierId) {
    const dossier = await prisma.dossier.findFirst({
      where: { id: input.dossierId, cabinetId },
      select: { id: true },
    });
    if (!dossier) return { error: "Dossier introuvable" };
  }

  const event = await prisma.calendarEvent.create({
    data: {
      cabinetId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      type: input.type,
      date: new Date(input.date),
      startTime: input.startTime || null,
      endTime: input.endTime || null,
      allDay: input.allDay ?? false,
      location: input.location?.trim() || null,
      clientId: input.clientId || null,
      dossierId: input.dossierId || null,
      assigneeId: input.assigneeId || null,
      createdById: userId,
    },
  });

  revalidatePath("/gestion/lextrack");
  return { id: event.id };
}

export async function updateCalendarEvent(eventId: string, input: UpdateEventInput) {
  const { cabinetId } = await requireCabinetAndUser();

  const existing = await prisma.calendarEvent.findFirst({
    where: { id: eventId, cabinetId },
  });
  if (!existing) return { error: "Événement introuvable" };

  const data: Parameters<typeof prisma.calendarEvent.update>[0]["data"] = {};

  if (input.title !== undefined) data.title = input.title.trim();
  if (input.description !== undefined) data.description = input.description?.trim() || null;
  if (input.type !== undefined) data.type = input.type;
  if (input.status !== undefined) data.status = input.status;
  if (input.date !== undefined) data.date = new Date(input.date);
  if (input.startTime !== undefined) data.startTime = input.startTime || null;
  if (input.endTime !== undefined) data.endTime = input.endTime || null;
  if (input.allDay !== undefined) data.allDay = input.allDay;
  if (input.location !== undefined) data.location = input.location?.trim() || null;
  if (input.clientId !== undefined) data.clientId = input.clientId || null;
  if (input.dossierId !== undefined) data.dossierId = input.dossierId || null;
  if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId || null;

  await prisma.calendarEvent.update({
    where: { id: eventId },
    data,
  });

  revalidatePath("/gestion/lextrack");
  return { ok: true };
}

export async function deleteCalendarEvent(eventId: string) {
  const { cabinetId } = await requireCabinetAndUser();

  const existing = await prisma.calendarEvent.findFirst({
    where: { id: eventId, cabinetId },
  });
  if (!existing) return { error: "Événement introuvable" };

  await prisma.calendarEvent.delete({ where: { id: eventId } });

  revalidatePath("/gestion/lextrack");
  return { ok: true };
}
