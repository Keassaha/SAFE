import { SafeLogo } from "@/components/branding/SafeLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen auth-container px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_520px] lg:items-center">
          <div className="hidden text-white lg:block">
            <div className="max-w-lg">
              <div className="mb-6">
                <SafeLogo variant="dark" className="shrink-0" />
              </div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
                SAFE
              </p>
              <h1 className="mb-4 text-4xl font-semibold tracking-tight text-white">
                Système de gestion pour cabinets d&apos;avocats
              </h1>
              <p className="text-base leading-7 text-white/78">
                Créez votre cabinet, invitez vos employées et connectez chaque membre de
                l&apos;équipe avec le nom du cabinet, son courriel et son mot de passe.
              </p>
            </div>
          </div>
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  );
}
