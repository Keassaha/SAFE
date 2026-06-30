import React from 'react';
import Link from 'next/link';
import { Logo } from '../brand/Logo';

export function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[0.5px] border-[#27272A] w-full pt-[80px] pb-[40px] px-6">
      <div className="max-w-6xl mx-auto flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="flex flex-col max-w-[280px]">
            <div className="flex items-center gap-2 mb-4">
              <Logo size={24} accentColor="#FFFFFF" />
              <span className="font-serif text-[17px] tracking-[-0.02em] text-surface">SAFE</span>
            </div>
            <p className="text-[13px] text-[#A1A1A1] font-sans leading-[1.6]">
              Votre conformité, votre tranquillité. SAFE garde vos registres, vos journaux et vos rapprochements fiduciaires à jour et prêts à présenter. Pensé pour les cabinets d&apos;avocats du Québec et de l&apos;Ontario.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="text-[13px] font-sans font-medium text-surface mb-2">Produit</h4>
            <Link href="#produit" className="text-[13px] text-[#A1A1A1] hover:text-surface transition-colors">Fonctionnalités</Link>
            <Link href="#tarification" className="text-[13px] text-[#A1A1A1] hover:text-surface transition-colors">Tarification</Link>
            <Link href="#audit" className="text-[13px] text-[#A1A1A1] hover:text-surface transition-colors">Audit d'efficacité</Link>
            <Link href="/login" className="text-[13px] text-[#A1A1A1] hover:text-surface transition-colors">Connexion au portail</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[13px] font-sans font-medium text-surface mb-2">Légal</h4>
            <Link href="/conditions" className="text-[13px] text-[#A1A1A1] hover:text-surface transition-colors">Conditions d&apos;utilisation</Link>
            <Link href="/confidentialite" className="text-[13px] text-[#A1A1A1] hover:text-surface transition-colors">Politique de confidentialité</Link>
            <Link href="/confidentialite#securite" className="text-[13px] text-[#A1A1A1] hover:text-surface transition-colors">Sécurité et Loi 25</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[13px] font-sans font-medium text-surface mb-2">Contact</h4>
            <Link href="mailto:jeremie@safecabinet.ca" className="text-[13px] text-[#A1A1A1] hover:text-surface transition-colors">jeremie@safecabinet.ca</Link>
            <span className="text-[13px] text-[#A1A1A1]">Ouvert du lundi au vendredi</span>
            <span className="text-[13px] text-[#A1A1A1]">Gatineau, QC</span>
          </div>
        </div>

        <div className="pt-8 border-t border-[0.5px] border-[#27272A] flex flex-col gap-4">
          <p className="text-[12px] font-sans text-[#52525B] leading-[1.6] max-w-3xl">
            SAFE est un outil de gestion. Il facilite le suivi de vos obligations professionnelles, il ne s&apos;y substitue pas. La responsabilité déontologique demeure celle du cabinet.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[12px] font-sans text-[#52525B]">© {new Date().getFullYear()} SafeCabinet Inc. Tous droits réservés.</span>
            <span className="text-[12px] font-sans text-[#52525B]">Hébergé au Canada · Conforme Loi 25</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
