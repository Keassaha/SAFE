"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { SafeLogo } from "@/components/branding/SafeLogo";

const navLinks = [
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Tarification", href: "/tarification" },
  { label: "Audit gratuit", href: "/audit-gratuit" },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 lg:px-8 pt-4">
      <nav
        className={`mx-auto max-w-6xl transition-all duration-500 rounded-safe-md ${
          scrolled
            ? "bg-[#051F20]/90 backdrop-blur-xl shadow-2xl shadow-black/20 border border-white/[0.06]"
            : "bg-[#051F20]/70 backdrop-blur-lg border border-white/[0.04]"
        }`}
      >
        <div className="flex items-center justify-between h-[60px] px-5 lg:px-6">
          {/* Logo */}
          <Link href="/" className="inline-block shrink-0 group transition-transform duration-300 hover:scale-[1.02]">
            <SafeLogo variant="dark" noPulse className="shrink-0" />
          </Link>

          {/* Desktop nav — centered */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative whitespace-nowrap px-3 py-2 text-sm text-[#8EB69B] hover:text-[#F8FDF9] transition-colors duration-300 group font-sans"
              >
                {link.label}
                <span className="absolute bottom-0.5 left-3 right-3 h-px bg-[#8EB69B] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <Link
              href="/connexion"
              className="whitespace-nowrap px-3 py-2 text-sm text-[#8EB69B] hover:text-[#F8FDF9] transition-colors duration-300 font-sans"
            >
              Connexion
            </Link>
            <Link
              href="/demo"
              className="whitespace-nowrap px-5 py-2 text-sm font-medium rounded-full bg-[#8EB69B] text-[#051F20] hover:bg-[#DAF1DE] transition-all duration-300 font-sans"
            >
              Réserver une démo
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-[#8EB69B] hover:text-[#F8FDF9] transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden mt-2 mx-auto max-w-6xl overflow-hidden bg-[#051F20]/95 backdrop-blur-xl rounded-safe-md border border-white/[0.06] shadow-2xl shadow-black/20"
          >
            <div className="px-6 py-5 space-y-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 text-lg text-[#8EB69B] hover:text-[#F8FDF9] transition-colors border-b border-white/5 font-sans"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <Link
                  href="/connexion"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-3 text-sm text-[#8EB69B] hover:text-[#F8FDF9] transition-colors font-sans"
                >
                  Connexion
                </Link>
                <Link
                  href="/demo"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-3 text-sm font-medium rounded-full bg-[#8EB69B] text-[#051F20] font-sans"
                >
                  Réserver une démo
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
