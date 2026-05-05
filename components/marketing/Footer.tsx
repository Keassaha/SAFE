import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const footerLinks = {
  produit: [
    { label: "Fonctionnalités", href: "/fonctionnalites" },
    { label: "Prix après audit", href: "/tarification" },
    // Le CTA "Réserver un appel" pointe vers la page de contact.
    { label: "Réserver un appel", href: "/contact" },
    { label: "Audit gratuit", href: "/audit-gratuit" },
  ],
  legal: [
    { label: "Politique de confidentialité", href: "/confidentialite" },
    { label: "Conditions d'utilisation", href: "/conditions" },
    { label: "jeremie@safecabinet.ca", href: "mailto:jeremie@safecabinet.ca" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-white/5 pt-12 sm:pt-20 pb-8 sm:pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 mb-12 sm:mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-6 group transition-transform duration-300 hover:scale-[1.02]"
            >
              <Logo size={22} accentColor="#FFFFFF" />
              <span className="font-serif text-[17px] tracking-[-0.02em] text-white mt-0.5">Safe</span>
            </Link>
            <p className="text-sm text-[var(--safe-text-muted)] leading-relaxed max-w-xs font-sans">
              Facturation, fidéicommis et conformité au Barreau, automatisés.
              Le logiciel de gestion conçu pour les avocats au Canada.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--safe-white)] uppercase tracking-wider mb-6 font-sans">
              Produit
            </h4>
            <ul className="space-y-3.5">
              {footerLinks.produit.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("http") ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--safe-text-muted)] hover:text-[var(--safe-sage)] transition-colors duration-300 font-sans"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--safe-text-muted)] hover:text-[var(--safe-sage)] transition-colors duration-300 font-sans"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Légal & Contact */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--safe-white)] uppercase tracking-wider mb-6 font-sans">
              Légal & Contact
            </h4>
            <ul className="space-y-3.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("mailto:") ? (
                    <a
                      href={link.href}
                      className="text-sm text-[var(--safe-text-muted)] hover:text-[var(--safe-sage)] transition-colors duration-300 font-sans"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--safe-text-muted)] hover:text-[var(--safe-sage)] transition-colors duration-300 font-sans"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--safe-text-muted)] font-sans">
            © {new Date().getFullYear()} SAFE. Tous droits réservés.
          </p>
          <div className="flex items-center gap-3 text-xs text-[var(--safe-text-muted)] font-sans">
            <span>Hébergé au Canada</span>
            <span className="text-[var(--safe-sage)]/30">•</span>
            <span>Conforme à la Loi 25</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
