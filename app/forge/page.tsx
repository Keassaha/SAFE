import type { Metadata } from "next";
import ForgeApp from "./ForgeApp";

export const metadata: Metadata = {
  title: "Forge | Product command",
  description: "Le poste de commandement qui relie décisions, capacité et exécution.",
};

export default function ForgePage() {
  return <ForgeApp />;
}
