import { Logo } from "@/components/brand/Logo";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas font-sans selection:bg-forest-100 selection:text-forest-600 px-4 py-8">
      {/* En-tête simple pour l'authentification */}
      <div className="w-full flex justify-between items-center max-w-6xl mx-auto mb-16 px-4">
        <Link href="/" className="inline-flex items-center gap-2 transition-transform duration-300 hover:scale-[1.02]">
          <Logo size={24} accentColor="#0A0A0A" />
          <span className="font-serif text-[19px] tracking-[-0.02em] text-text-primary mt-0.5">Safe</span>
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-12 lg:grid-cols-[1.1fr_520px] lg:items-center">
          <div className="hidden text-text-primary lg:block px-4">
            <div className="max-w-md">
              <p className="mb-4 text-[12px] font-sans font-medium uppercase tracking-[0.15em] text-forest-600">
                Espace sécurisé
              </p>
              <h1 className="mb-6 font-serif text-[42px] leading-[1.05] tracking-[-0.02em] text-text-primary">
                La plateforme financière pour les cabinets d'avocats.
              </h1>
              <p className="text-[15px] font-sans leading-[1.6] text-text-body">
                Connectez-vous pour accéder à vos dossiers, réconcilier vos fidéicommis et gérer 
                votre facturation en toute conformité.
              </p>
            </div>
          </div>
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
