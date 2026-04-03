import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/connexion",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        cabinetName: { label: "Nom du cabinet", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.cabinetName || !credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findFirst({
          where: { email: credentials.email.toLowerCase() },
          include: { cabinet: true, employee: true },
        });
        if (!user || !user.passwordHash) return null;
        const cabinetName = credentials.cabinetName.trim().toLowerCase();
        const expectedCabinetName = user.cabinet.nom.trim().toLowerCase();
        if (cabinetName !== expectedCabinetName) return null;
        if (user.employee && user.employee.status !== "active") return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.nom,
          nom: user.nom,
          role: user.role,
          cabinetId: user.cabinetId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.cabinetId = (user as { cabinetId?: string }).cabinetId ?? "";
        token.role = (user as { role?: UserRole }).role ?? "avocat";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id;
        (session.user as { cabinetId: string }).cabinetId = token.cabinetId;
        (session.user as { role: string }).role = token.role;
      }
      return session;
    },
  },
};

export type { NextAuthOptions };
