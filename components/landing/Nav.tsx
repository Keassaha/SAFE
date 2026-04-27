import React from 'react';
import Link from 'next/link';
import { LogoMark } from '../brand/Logo';
import { Button } from './ui/Button';

export function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 h-[64px] px-[28px] bg-canvas border-b border-[0.5px] border-border flex items-center justify-between z-50">
      <div className="flex-shrink-0">
        <Link href="/">
          <LogoMark size={28} />
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-6 text-[13px] text-text-body font-sans">
        <Link href="#produit" className="hover:text-text-primary transition-colors">Produit</Link>
        <Link href="#tarification" className="hover:text-text-primary transition-colors">Tarification</Link>
        <Link href="/audit-gratuit" className="hover:text-text-primary transition-colors">Audit gratuit</Link>
        <Link href="#apropos" className="hover:text-text-primary transition-colors">À propos</Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-4 text-[13px] text-text-body font-sans">
          <Link href="/login" className="hover:text-text-primary transition-colors">Connexion</Link>
          <div className="w-[1px] h-4 bg-border-strong" />
        </div>
        <Button variant="primary" size="sm">
          Demander un accès
        </Button>
      </div>
    </nav>
  );
}
