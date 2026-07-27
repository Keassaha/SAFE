"use client";

/**
 * À propos — version courte, centrée produit.
 * Thèse : le logiciel s'adapte au cabinet, pas l'inverse. Le fondateur arrive en fin
 * de page, comme garantie, jamais comme sujet.
 * Structure héritée du Prompt 03 du pack (la personne en élément central du hero,
 * typographie massive, révélations au scroll), avec la palette SAFE et un scroll libre.
 */

import React, { useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  INK, MUTED, FAINT, GREEN, VERIFIED, LINE, LINE_SOFT, SURFACE, BG, EASE, R,
  PageShell, scenePhase, easeOutCubic, easeInOutQuad, useScrollScrub,
} from "./shared";
import { MockupAppComplete, MockupFicheDeTemps } from "./mockups";

const PHOTO = "/images/fondateur/portrait.jpg";
/* Vraie capture du classeur Excel des débuts, fournie par le cabinet. */
const EXCEL_REEL = "/experience-assets/excel-avant.jpg";

/* ── Titre composé lettre par lettre ── */
function KineticTitle({ text }: { text: string }) {
  let index = 0;
  return (
    <h1
      className="font-serif text-[40px] font-normal leading-[1.02] sm:text-[58px] lg:text-[70px]"
      style={{ color: INK, letterSpacing: "-0.028em" }}
    >
      {text.split(" ").map((mot, m, arr) => (
        <span key={m} className="inline-block whitespace-nowrap">
          {Array.from(mot).map((lettre) => {
            const d = index++ * 0.026;
            return (
              <motion.span
                key={d}
                className="inline-block"
                initial={{ opacity: 0, y: "0.35em" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + d, duration: 0.6, ease: EASE }}
              >
                {lettre}
              </motion.span>
            );
          })}
          {m < arr.length - 1 ? <span>&nbsp;</span> : null}
        </span>
      ))}
    </h1>
  );
}

/* ── Le classeur Excel des débuts ──
   Utilise la vraie capture si elle est présente, sinon une reconstitution fidèle. */
function ClasseurExcel() {
  const [reel, setReel] = useState<boolean | null>(null);

  React.useEffect(() => {
    const probe = new Image();
    probe.onload = () => setReel(true);
    probe.onerror = () => setReel(false);
    probe.src = EXCEL_REEL;
  }, []);

  if (reel === true) {
    return (
      <figure>
        {/* Sur téléphone, une capture de tableur en pleine largeur devient illisible.
           On la laisse à une taille lisible dans un rail que l'on fait glisser. */}
        <div
          className="excel-rail overflow-x-auto overflow-y-hidden rounded-[12px] border"
          style={{ borderColor: LINE, WebkitOverflowScrolling: "touch" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- capture fournie par le cabinet */}
          <img
            src={EXCEL_REEL}
            alt="Le classeur Excel qui tenait la comptabilité du cabinet avant SAFE."
            className="excel-img h-auto w-full"
          />
        </div>
        <figcaption className="excel-hint mt-2 hidden items-center gap-2 font-sans text-[12px]" style={{ color: FAINT }}>
          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
            <path d="M 4.5,5.5 Q 3.5,3.5 5.5,4 L 12.5,4 Q 14.5,3.5 13.5,5.5 L 10,12.5 Q 9,14.5 8,12.5 Z" fill={GREEN} />
          </svg>
          Faites glisser pour parcourir le classeur.
        </figcaption>
        <style>{`
          @media (max-width: 860px) {
            .excel-img { width: 780px; max-width: none; }
            .excel-hint { display: flex; }
          }
        `}</style>
      </figure>
    );
  }

  const KPIS = [
    ["Heures facturables", "128,75 h"],
    ["Factures émises", "24 850 $"],
    ["Encaissé", "18 450 $"],
  ];
  const ONGLETS = ["Accueil", "Temps", "Facturation", "Paiements", "Fiducie", "Rapprochement"];

  return (
    <div
      className="overflow-hidden rounded-[12px] border bg-white"
      style={{ borderColor: LINE, boxShadow: "0 30px 60px -40px rgba(11,31,25,0.4)" }}
    >
      <div className="flex items-center gap-2 border-b px-4 py-2" style={{ borderColor: LINE, background: "#F4F6F3" }}>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>
          SAFE_VERSION_EXCEL.xlsx
        </span>
      </div>
      <div className="flex" style={{ minHeight: 190 }}>
        <div className="w-[27%] p-3" style={{ background: "#1B3728" }}>
          <p className="font-serif text-[15px] leading-none" style={{ color: "#F2F6F2" }}>SAFE</p>
          <p className="mt-1 font-sans text-[7px] leading-[1.35]" style={{ color: "rgba(242,246,242,0.6)" }}>
            Système de facturation
          </p>
          <div className="mt-3 space-y-1.5">
            {["Tableau de bord", "Temps", "Facturation", "Registres"].map((s, i) => (
              <p
                key={s}
                className="rounded-[3px] px-1.5 py-1 font-sans text-[7.5px]"
                style={{
                  color: i === 0 ? "#F2F6F2" : "rgba(242,246,242,0.55)",
                  background: i === 0 ? "rgba(255,255,255,0.1)" : "transparent",
                }}
              >
                {s}
              </p>
            ))}
          </div>
        </div>
        <div className="flex-1 p-3">
          <p className="font-sans text-[9px] font-semibold" style={{ color: INK }}>TABLEAU DE BORD</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {KPIS.map(([label, val], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                className="rounded-[3px] border px-1.5 py-1.5"
                style={{ borderColor: LINE_SOFT }}
              >
                <p className="font-sans text-[6px] uppercase tracking-[0.06em]" style={{ color: FAINT }}>{label}</p>
                <p className="mt-0.5 font-mono text-[9px]" style={{ color: INK }}>{val}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-2 rounded-[3px] border p-2" style={{ borderColor: LINE_SOFT }}>
            <svg viewBox="0 0 200 46" className="h-[46px] w-full" aria-hidden>
              <motion.polyline
                points="4,40 40,32 76,24 112,27 148,20 192,8"
                fill="none"
                stroke="#1B7A44"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: EASE }}
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex gap-0 overflow-hidden border-t" style={{ borderColor: LINE, background: "#F4F6F3" }}>
        {ONGLETS.map((o, i) => (
          <span
            key={o}
            className="whitespace-nowrap border-r px-2 py-1.5 font-sans text-[7.5px]"
            style={{
              borderColor: LINE_SOFT,
              color: i === 0 ? INK : FAINT,
              background: i === 0 ? "#fff" : "transparent",
            }}
          >
            {o}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Scène épinglée : le classeur Excel occupe l'écran, puis se retire pendant que
 * l'application prend sa place. Le scroll pilote la bascule, comme sur l'accueil.
 */
function SceneBascule() {
  const zone = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useScrollScrub(zone, (p) => {
    const root = stage.current;
    if (!root) return;

    const sortie = easeInOutQuad(scenePhase(p, 0.3, 0.6));   // le classeur se retire
    const entree = easeInOutQuad(scenePhase(p, 0.42, 0.75)); // le logiciel arrive

    const avant = root.querySelector<HTMLElement>("[data-avant]");
    if (avant) {
      avant.style.opacity = String(1 - sortie);
      avant.style.transform = `translateY(${-sortie * 8}vh) scale(${1 - sortie * 0.12})`;
      avant.style.filter = `blur(${sortie * 6}px)`;
    }

    const apres = root.querySelector<HTMLElement>("[data-apres]");
    if (apres) {
      apres.style.opacity = String(entree);
      apres.style.transform = `translateY(${(1 - entree) * 10}vh) scale(${0.94 + entree * 0.06})`;
      apres.style.pointerEvents = entree > 0.85 ? "auto" : "none";
    }

    const etiqAvant = root.querySelector<HTMLElement>("[data-etiq-avant]");
    if (etiqAvant) etiqAvant.style.opacity = String(1 - scenePhase(p, 0.28, 0.44));
    const etiqApres = root.querySelector<HTMLElement>("[data-etiq-apres]");
    if (etiqApres) etiqApres.style.opacity = String(scenePhase(p, 0.52, 0.68));

    const trait = root.querySelector<HTMLElement>("[data-trait]");
    if (trait) trait.style.transform = `scaleX(${easeOutCubic(scenePhase(p, 0.05, 0.9))})`;
  });

  return (
    <div ref={zone} className="relative" style={{ height: "320vh" }}>
      <div
        ref={stage}
        className="sticky top-0 flex min-h-screen flex-col justify-center overflow-hidden px-6 py-16"
        style={{ background: BG }}
      >
        <div className="mx-auto w-full max-w-[1000px]">
          {/* étiquettes de période */}
          <div className="relative h-6">
            <p
              data-etiq-avant
              className="absolute inset-x-0 font-mono text-[11px] uppercase tracking-[0.16em]"
              style={{ color: FAINT }}
            >
              Au début · un classeur Excel
            </p>
            <p
              data-etiq-apres
              className="absolute inset-x-0 font-mono text-[11px] uppercase tracking-[0.16em]"
              style={{ color: GREEN, opacity: 0 }}
            >
              Aujourd&apos;hui · un logiciel web
            </p>
          </div>

          {/* trait de progression */}
          <div className="mt-2 h-px w-full" style={{ background: "rgba(31,42,36,0.1)" }}>
            <span data-trait className="block h-full origin-left" style={{ background: GREEN, transform: "scaleX(0)" }} />
          </div>

          {/* les deux états superposés · moins de réserve sur téléphone */}
          <div className="bascule-scene relative mt-8">
            <div data-avant className="absolute inset-x-0 top-0 will-change-transform">
              <ClasseurExcel />
            </div>
            <div data-apres className="absolute inset-x-0 top-0 opacity-0 will-change-transform">
              <MockupAppComplete />
            </div>
          </div>
        </div>
        <style>{`
          .bascule-scene { min-height: 58vh; }
          @media (max-width: 860px) {
            .bascule-scene { min-height: 62vh; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function AProposPage() {
  const { scrollYProgress } = useScroll();
  const photoY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const [photoOk, setPhotoOk] = useState<boolean | null>(null);

  React.useEffect(() => {
    const probe = new Image();
    probe.onload = () => setPhotoOk(true);
    probe.onerror = () => setPhotoOk(false);
    probe.src = PHOTO;
  }, []);

  return (
    <PageShell>
      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden px-6 pb-24 pt-32 sm:pt-40" style={{ background: BG }}>
        <div className="mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="font-mono text-[11px] uppercase tracking-[0.16em]"
              style={{ color: GREEN }}
            >
              À propos
            </motion.p>

            <div className="mt-6 max-w-[600px]">
              <KineticTitle text="Le logiciel s'adapte au cabinet. Pas l'inverse." />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.7, ease: EASE }}
              className="mt-8 max-w-[46ch] font-sans text-[17px] leading-[1.65] sm:text-[18.5px]"
              style={{ color: MUTED }}
            >
              SAFE a été conçu dans un cabinet de droit de la famille, autour de sa façon
              de travailler. Pas dans un catalogue de fonctionnalités.
            </motion.p>
          </div>

          {photoOk === true ? (
            <motion.figure style={{ y: photoY }}>
              <motion.div
                initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
                animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
                transition={{ delay: 0.2, duration: 1.15, ease: EASE }}
                className="overflow-hidden rounded-[18px] border"
                style={{ borderColor: LINE, boxShadow: "0 50px 100px -50px rgba(11,31,25,0.5)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- transformée au scroll */}
                <img src={PHOTO} alt="Jérémie Tiahou, fondateur de SAFE." className="h-auto w-full" />
              </motion.div>
            </motion.figure>
          ) : (
            <div className="min-h-[300px]" aria-hidden />
          )}
        </div>
      </section>

      {/* ═══ Le problème ═══ */}
      <section className="px-6 py-24" style={{ background: SURFACE, borderTop: `1px solid ${LINE}` }}>
        <div className="mx-auto max-w-[1100px]">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="font-mono text-[11px] uppercase tracking-[0.14em]"
            style={{ color: GREEN }}
          >
            Le problème
          </motion.p>
          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EASE }}
              className="max-w-[16ch] font-serif text-[28px] font-normal leading-[1.14] sm:text-[38px]"
              style={{ color: INK, letterSpacing: "-0.018em" }}
            >
              Aucun outil du marché ne connaissait leur métier.
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.65, ease: EASE }}
              className="max-w-[52ch] space-y-4 font-sans text-[16.5px] leading-[1.68]"
              style={{ color: MUTED }}
            >
              <p>
                Un cabinet du Québec travaillait avec un système de facturation dépassé.
                Le travail se faisait deux fois, l&apos;information se perdait entre les
                étapes, et les heures passées là ne se facturaient à personne.
              </p>
              <p>
                Les logiciels comptables existaient. Aucun ne connaissait ni le dossier
                juridique, ni le fidéicommis, ni les tâches propres au droit de la
                famille. Les adopter voulait dire changer la façon de travailler du
                cabinet pour plaire au logiciel.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ Ce que SAFE a fait · avant / après ═══ */}
      <section className="px-6 py-24" style={{ background: BG, borderTop: `1px solid ${LINE}` }}>
        <div className="mx-auto max-w-[1100px]">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-mono text-[11px] uppercase tracking-[0.14em]"
            style={{ color: GREEN }}
          >
            Ce que SAFE a fait
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: EASE }}
            className="mt-6 max-w-[20ch] font-serif text-[28px] font-normal leading-[1.14] sm:text-[38px]"
            style={{ color: INK, letterSpacing: "-0.018em" }}
          >
            Bâti à partir de leurs tâches, pas d&apos;un modèle générique.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, duration: 0.65, ease: EASE }}
            className="mt-5 max-w-[58ch] font-sans text-[16.5px] leading-[1.68]"
            style={{ color: MUTED }}
          >
            Moins de temps administratif, moins d&apos;argent perdu en travail non
            facturé, et surtout une vision claire des finances du cabinet à tout moment.
            Avec une exigence que les outils génériques ignorent : soutenir la conformité
            aux règles du Barreau, du fidéicommis jusqu&apos;aux rapports.
          </motion.p>

        </div>
      </section>

      {/* ═══ La bascule : le classeur devient le logiciel ═══ */}
      <SceneBascule />

      {/* ═══ Ce que ça change aujourd'hui ═══ */}
      <section className="px-6 py-24" style={{ background: SURFACE, borderTop: `1px solid ${LINE}` }}>
        <div className="mx-auto grid max-w-[1100px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: EASE }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: GREEN }}>
              Ce que ça change
            </p>
            <h2
              className="mt-6 max-w-[18ch] font-serif text-[28px] font-normal leading-[1.14] sm:text-[38px]"
              style={{ color: INK, letterSpacing: "-0.018em" }}
            >
              SAFE n&apos;est pas devenu générique en grandissant.
            </h2>
            <div className="mt-5 max-w-[46ch] space-y-4 font-sans text-[16.5px] leading-[1.68]" style={{ color: MUTED }}>
              <p>
                Il se configure par domaine de pratique, parce qu&apos;un cabinet en droit
                de la famille, en immobilier ou en immigration ne suit pas les mêmes
                étapes.
              </p>
              <p style={{ color: INK }}>
                C&apos;est la même promesse qu&apos;au premier jour : le logiciel épouse
                votre façon de travailler, pas l&apos;inverse.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.1, duration: 0.7, ease: EASE }}
          >
            <MockupFicheDeTemps />
          </motion.div>
        </div>
      </section>

      {/* ═══ Le fondateur, en fin de page ═══ */}
      <section className="px-6 py-24" style={{ background: BG, borderTop: `1px solid ${LINE}` }}>
        <div className="mx-auto max-w-[640px]">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-mono text-[11px] uppercase tracking-[0.14em]"
            style={{ color: FAINT }}
          >
            Un mot sur le fondateur
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: EASE }}
            className="mt-6 font-sans text-[17px] leading-[1.7]"
            style={{ color: MUTED }}
          >
            Je ne suis pas développeur de formation. J&apos;ai une formation en
            administration et en comptabilité de petite entreprise, et j&apos;ai bâti SAFE
            en autodidacte, à partir du travail que je voyais tous les jours.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mt-8 border-t pt-6"
            style={{ borderColor: LINE }}
          >
            <p className="font-serif text-[21px] italic" style={{ color: INK }}>Jérémie Tiahou</p>
            <p className="mt-1 font-sans text-[13.5px]" style={{ color: FAINT }}>Fondateur de SAFE</p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mt-12 font-sans text-[15.5px] leading-[1.7]"
            style={{ color: MUTED }}
          >
            SAFE ne remplace ni votre jugement, ni la personne qui connaît le cabinet. Il
            prépare, il relie, il signale. La responsabilité professionnelle demeure celle
            du cabinet.
          </motion.p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link
              href={R.diagnostic}
              className="inline-flex h-11 items-center rounded-[7px] px-6 font-sans text-[14px] font-medium transition-transform duration-200 hover:-translate-y-0.5"
              style={{ background: GREEN, color: "#fff", boxShadow: "0 14px 28px -18px rgba(18,161,80,0.85)" }}
            >
              Faire le diagnostic
            </Link>
            <Link href={R.demo} className="font-sans text-[14px]" style={{ color: INK }}>
              Réserver une rencontre
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
