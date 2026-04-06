import Link from "next/link";
import { SafeLogo } from "@/components/branding/SafeLogo";

const footerLinks = [
  { label: "Fonctionnalités", href: "#fonctionnalites" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "Conformité", href: "#conformite" },
  { label: "FAQ", href: "#faq" },
];

export function Footer() {
  return (
    <footer className="bg-black/20 backdrop-blur-sm text-white/70 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <SafeLogo variant="dark" className="shrink-0" noPulse />
          </div>

          <nav className="flex flex-wrap items-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/connexion"
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              Connexion
            </Link>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} SAFE &middot; Tous droits r&eacute;serv&eacute;s &middot; H&eacute;berg&eacute; au Canada
          </p>
        </div>
      </div>
    </footer>
  );
}
