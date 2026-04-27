'use client';

import Link from 'next/link';
import { useState } from 'react';

interface HeaderProps {
  variant?: 'marketing' | 'audit';
  subtitle?: string;
}

export function Header({ variant = 'marketing', subtitle }: HeaderProps) {
  const [locale, setLocale] = useState<'fr' | 'en'>('fr');

  return (
    <header className="bg-white border-b border-slate-200/60 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-md bg-forest-900 flex items-center justify-center">
            <span className="text-forest-50 text-[13px] font-medium">S</span>
          </div>
          <span className="text-[15px] font-medium text-forest-900">SAFE</span>
          {subtitle && (
            <>
              <span className="ml-2 pl-3 border-l border-slate-200 text-xs text-slate-500">
                {subtitle}
              </span>
            </>
          )}
        </Link>

        {variant === 'marketing' ? (
          <div className="flex items-center gap-5">
            <LocaleToggle locale={locale} onChange={setLocale} />
            <span className="text-[13px] text-slate-600 hidden sm:inline">
              Déjà client&nbsp;?
            </span>
            <Link
              href="/login"
              className="px-3.5 py-1.5 bg-forest-900 text-forest-50 text-[13px] font-medium rounded-md hover:bg-forest-700 transition"
            >
              Se connecter
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <ConfidentialBadge />
            <span className="text-xs text-slate-600">
              Sauvegardé · il y a 30s
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

function LocaleToggle({
  locale,
  onChange,
}: {
  locale: 'fr' | 'en';
  onChange: (l: 'fr' | 'en') => void;
}) {
  return (
    <div className="flex gap-1 p-[3px] bg-slate-100 rounded-md">
      <button
        onClick={() => onChange('fr')}
        className={`px-2.5 py-1 text-xs rounded transition ${
          locale === 'fr'
            ? 'bg-white text-forest-900 font-medium'
            : 'text-slate-600'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => onChange('en')}
        className={`px-2.5 py-1 text-xs rounded transition ${
          locale === 'en'
            ? 'bg-white text-forest-900 font-medium'
            : 'text-slate-600'
        }`}
      >
        EN
      </button>
    </div>
  );
}

function ConfidentialBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-forest-50 border border-forest-200 rounded-full">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        className="text-forest-900"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <span className="text-[11px] font-medium text-forest-900">
        Confidentiel · TLS 1.3
      </span>
    </div>
  );
}
