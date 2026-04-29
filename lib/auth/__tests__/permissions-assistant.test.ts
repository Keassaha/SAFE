import { describe, it, expect } from "vitest";
import {
  canViewAssistantQueue,
  canAssignSelfAsAssistant,
} from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

const ALL_ROLES: UserRole[] = ["admin_cabinet", "avocat", "assistante", "comptabilite"];

describe("canViewAssistantQueue — RBAC file assistante", () => {
  it("autorise assistante, admin_cabinet, avocat", () => {
    expect(canViewAssistantQueue("assistante")).toBe(true);
    expect(canViewAssistantQueue("admin_cabinet")).toBe(true);
    expect(canViewAssistantQueue("avocat")).toBe(true);
  });

  it("refuse comptabilite", () => {
    expect(canViewAssistantQueue("comptabilite")).toBe(false);
  });

  it("contient 3 rôles autorisés sur 4", () => {
    const allowed = ALL_ROLES.filter(canViewAssistantQueue);
    expect(allowed).toHaveLength(3);
  });
});

describe("canAssignSelfAsAssistant — droit de prendre en charge un dossier", () => {
  it("autorise assistante et admin_cabinet", () => {
    expect(canAssignSelfAsAssistant("assistante")).toBe(true);
    expect(canAssignSelfAsAssistant("admin_cabinet")).toBe(true);
  });

  it("refuse avocat (l'avocat n'est pas assigné comme assistante)", () => {
    expect(canAssignSelfAsAssistant("avocat")).toBe(false);
  });

  it("refuse comptabilite", () => {
    expect(canAssignSelfAsAssistant("comptabilite")).toBe(false);
  });
});
