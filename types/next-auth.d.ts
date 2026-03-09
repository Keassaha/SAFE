import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    nom: string;
    role: UserRole;
    cabinetId: string;
  }

  interface Session {
    user: User & {
      id: string;
      cabinetId: string;
      role: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    cabinetId: string;
    role: UserRole;
  }
}
