import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { isRateLimited } from "@/lib/rate-limit";
import { isCompteDesactive } from "@/lib/auth/compte-desactive";

/** Intervalle de revalidation des droits portés par le JWT (rôle, cabinet, statut). */
const SESSION_REVALIDATION_INTERVAL_MS = 15 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
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

        // Rate limiting: 5 tentatives par minute par email
        if (await isRateLimited(`login-${credentials.email.toLowerCase()}`, 5, 60_000)) {
          throw new Error("Trop de tentatives. Réessayez dans une minute.");
        }

        const user = await prisma.user.findFirst({
          where: { email: credentials.email.toLowerCase() },
          include: { cabinet: true, employee: true },
        });
        if (!user || !user.passwordHash) return null;
        const cabinetName = credentials.cabinetName.trim().toLowerCase();
        const expectedCabinetName = user.cabinet.nom.trim().toLowerCase();
        if (cabinetName !== expectedCabinetName) return null;
        // Compte désactivé : la connexion s'arrête ici. Vaut pour TOUS les
        // comptes, y compris ceux sans fiche employé, que l'acceptation d'une
        // invitation crée. Voir `User.desactiveLe`.
        if (isCompteDesactive(user)) return null;
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
        token.checkedAt = Date.now();
        return token;
      }

      // Rafraîchissement des droits (audit 2026-07-28, §M1).
      //
      // Les sessions sont des JWT de 30 jours. Sans ce contrôle, `role` et
      // `cabinetId` restaient figés à la connexion : une rétrogradation, une
      // désactivation d'employé, une suppression de compte ou une réinitialisation
      // de mot de passe n'avaient aucun effet avant l'expiration naturelle du jeton.
      //
      // On relit l'utilisateur au plus une fois par intervalle pour ne pas ajouter
      // une requête à chaque rendu.
      const checkedAt = typeof token.checkedAt === "number" ? token.checkedAt : 0;
      if (Date.now() - checkedAt < SESSION_REVALIDATION_INTERVAL_MS) {
        return token;
      }

      if (!token.id) {
        token.revoked = true;
        return token;
      }

      const current = await prisma.user.findUnique({
        where: { id: token.id },
        select: {
          role: true,
          cabinetId: true,
          sessionsValidFrom: true,
          desactiveLe: true,
          employee: { select: { status: true } },
        },
      });

      // Compte supprimé, désactivé, ou employé désactivé : la session ne vaut
      // plus rien. La désactivation ne doit pas attendre les trente jours du
      // jeton : c'est tout l'intérêt de la revalidation périodique.
      if (
        !current ||
        isCompteDesactive(current) ||
        (current.employee && current.employee.status !== "active")
      ) {
        token.revoked = true;
        return token;
      }

      // Mot de passe réinitialisé ou droits changés depuis l'émission du jeton.
      const issuedAtMs = typeof token.iat === "number" ? token.iat * 1000 : 0;
      if (current.sessionsValidFrom && issuedAtMs < current.sessionsValidFrom.getTime()) {
        token.revoked = true;
        return token;
      }

      token.role = current.role;
      token.cabinetId = current.cabinetId;
      token.checkedAt = Date.now();
      return token;
    },
    async session({ session, token }) {
      // Session révoquée : on retire l'utilisateur. Toutes les gardes de l'app
      // (`getSessionOrRespond`, layouts, middleware) traitent l'absence de
      // `session.user` comme une non-authentification.
      if (token.revoked) {
        delete (session as { user?: unknown }).user;
        return session;
      }
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
