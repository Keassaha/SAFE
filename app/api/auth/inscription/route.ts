import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signUpSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { email, password, nom, nomCabinet, adresseCabinet } = parsed.data;
    const existing = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 400 }
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const cabinet = await prisma.cabinet.create({
      data: {
        nom: nomCabinet,
        adresse: adresseCabinet ?? null,
      },
    });
    await prisma.user.create({
      data: {
        cabinetId: cabinet.id,
        email: email.toLowerCase(),
        passwordHash,
        nom,
        role: "admin_cabinet",
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la création du compte." },
      { status: 500 }
    );
  }
}
