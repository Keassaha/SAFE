import type { Metadata } from "next";
import { InscriptionGate } from "@/components/auth/InscriptionGate";

export const metadata: Metadata = {
  title: "Inscription — SAFE",
  description:
    "Commencez par un audit gratuit pour découvrir comment SAFE peut transformer votre cabinet.",
};

export default function InscriptionGatePage() {
  return <InscriptionGate />;
}
