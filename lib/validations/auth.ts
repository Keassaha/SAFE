import { z } from "zod";

export const signInSchema = z.object({
  cabinetName: z.string().min(1, "Nom du cabinet requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const signUpSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
  nom: z.string().min(1, "Nom requis"),
  nomCabinet: z.string().min(1, "Nom du cabinet requis"),
  adresseCabinet: z.string().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
