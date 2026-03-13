import { describe, it, expect } from "vitest";
import { signInSchema, signUpSchema } from "../auth";

describe("signInSchema", () => {
  it("valide un formulaire connexion correct", () => {
    const result = signInSchema.safeParse({
      cabinetName: "Cabinet Dupont",
      email: "user@example.com",
      password: "secret",
    });
    expect(result.success).toBe(true);
  });

  it("rejette si cabinetName vide", () => {
    const result = signInSchema.safeParse({
      cabinetName: "",
      email: "user@example.com",
      password: "secret",
    });
    expect(result.success).toBe(false);
  });

  it("rejette si email invalide", () => {
    const result = signInSchema.safeParse({
      cabinetName: "Cabinet",
      email: "invalid",
      password: "secret",
    });
    expect(result.success).toBe(false);
  });

  it("rejette si password vide", () => {
    const result = signInSchema.safeParse({
      cabinetName: "Cabinet",
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("valide un formulaire inscription correct", () => {
    const result = signUpSchema.safeParse({
      email: "admin@cabinet.com",
      password: "password123",
      nom: "Dupont",
      nomCabinet: "Cabinet Dupont",
      adresseCabinet: "123 rue Example",
    });
    expect(result.success).toBe(true);
  });

  it("rejette si mot de passe < 8 caractères", () => {
    const result = signUpSchema.safeParse({
      email: "admin@cabinet.com",
      password: "short",
      nom: "Dupont",
      nomCabinet: "Cabinet Dupont",
    });
    expect(result.success).toBe(false);
  });

  it("accepte adresseCabinet optionnelle", () => {
    const result = signUpSchema.safeParse({
      email: "admin@cabinet.com",
      password: "password123",
      nom: "Dupont",
      nomCabinet: "Cabinet Dupont",
    });
    expect(result.success).toBe(true);
  });
});
