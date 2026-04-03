import Link from "next/link";
import { Shield } from "lucide-react";

const footerLinks = {
  produit: [
    { label: "Fonctionnalités", href: "/fonctionnalites" },
    { label: "Tarification", href: "/tarification" },
    { label: "Démo", href: "/demo" },
    { label: "Audit gratuit", href: "/audit-gratuit" },
  ],
  ressources: [
    { label: "Blogue juridique", href: "/blog" },
    { label: "Guide Loi 25", href: "/guide-loi-25" },
    { label: "Centre d'aide", href: "/aide" },
  ],
  legal: [
    { label: "Politique de confidentialité", href: "/confidentialite" },
    { label: "Conditions d'utilisation", href: "/conditions" },
    { label: "bonjour@safe.quebec", href: "mailto:bonjour@safe.quebec" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[var(--safe-dark)] border-t border-white/5 pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-6 group">
              <div className="w-9 h-9 rounded-xl bg-[var(--safe-accent)] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[var(--safe-lightest)]" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-[var(--safe-white)] font-jakarta">
                SAFE
              </span>
            </Link>
            <p className="text-sm text-[var(--safe-text-muted)] leading-relaxed max-w-xs font-jakarta">
              Le logiciel de gestion pensé pour simplifier et sécuriser la pratique des
              avocats en droit familial au Québec.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--safe-white)] uppercase tracking-wider mb-6 font-jakarta">
              Produit
            </h4>
            <ul className="space-y-3.5">
              {footerLinks.produit.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--safe-text-muted)] hover:text-[var(--safe-sage)] transition-colors duration-300 font-jakarta"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--safe-white)] uppercase tracking-wider mb-6 font-jakarta">
              Ressources
            </h4>
            <ul className="space-y-3.5">
              {footerLinks.ressources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--safe-text-muted)] hover:text-[var(--safe-sage)] transition-colors duration-300 font-jakarta"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal & Contact */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--safe-white)] uppercase tracking-wider mb-6 font-jakarta">
              Légal & Contact
            </h4>
            <ul className="space-y-3.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("mailto:") ? (
                    <a
                      href={link.href}
                      className="text-sm text-[var(--safe-text-muted)] hover:text-[var(--safe-sage)] transition-colors duration-300 font-jakarta"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--safe-text-muted)] hover:text-[var(--safe-sage)] transition-colors duration-300 font-jakarta"
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
          <p className="text-xs text-[var(--safe-text-muted)] font-jakarta">
            © {new Date().getFullYear()} SAFE. Tous droits réservés.
          </p>
          <div className="flex items-center gap-3 text-xs text-[var(--safe-text-muted)] font-jakarta">
            <span>Hébergé au Canada</span>
            <span className="text-[var(--safe-sage)]/30">•</span>
            <span>Conforme à la Loi 25</span>
            <span className="text-[var(--safe-sage)]/30">•</span>
            <span>WCAG 2.1 AA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
