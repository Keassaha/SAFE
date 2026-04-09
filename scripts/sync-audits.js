#!/usr/bin/env node

/**
 * sync-audits.js
 *
 * Synchronise les données d'audit depuis Supabase vers le bureau local en PDF.
 *
 *   ~/Desktop/Données Clients/
 *   └── Me Alexandra Dérisier/
 *       └── source - audit_gratuit/
 *           ├── rapport-audit.pdf
 *           ├── reponses.json
 *           └── config-safe.json
 *
 * Usage :
 *   node scripts/sync-audits.js
 *   node scripts/sync-audits.js --since 2026-04-01
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

// PDF generation (lightweight, no browser needed)
let PDFDocument;
try {
  PDFDocument = require("pdfkit");
} catch {
  // pdfkit not installed — will use text fallback
  PDFDocument = null;
}

const prisma = new PrismaClient();
const BASE_DIR = path.join(process.env.HOME, "Desktop", "Données Clients");

function sanitizeFileName(name) {
  return name.replace(/[<>:"/\\|?*]/g, "-").replace(/\s+/g, " ").trim();
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generatePDF(audit, outputPath) {
  const reponses = audit.reponses ? JSON.parse(audit.reponses) : {};
  const scores = audit.scores ? JSON.parse(audit.scores) : {};
  const rapport = audit.rapport ? JSON.parse(audit.rapport) : {};

  if (!PDFDocument) {
    // Fallback: generate markdown file
    const md = generateMarkdown(audit, reponses, scores, rapport);
    fs.writeFileSync(outputPath.replace(".pdf", ".md"), md);
    console.log("     (pdfkit non installe — markdown genere a la place)");
    return;
  }

  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    const DARK = "#051F20";
    const GREEN = "#235347";
    const SAGE = "#8EB69B";
    const LIGHT = "#F8FDF9";
    const MUTED = "#6B8F7B";

    // Header bar
    doc.rect(0, 0, 612, 6).fill(DARK);

    // Logo text
    doc.fontSize(28).fillColor(DARK).font("Helvetica-Bold").text("SAFE", 50, 30);
    doc.fontSize(10).fillColor(MUTED).font("Helvetica").text("Audit de cabinet", 50, 58);

    // Prospect info
    doc.moveDown(2);
    doc.fontSize(20).fillColor(DARK).font("Helvetica-Bold")
      .text(`Rapport d'audit - ${audit.prospectNom}`);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor(MUTED).font("Helvetica");
    if (audit.prospectCabinet) doc.text(`Cabinet : ${audit.prospectCabinet}`);
    if (audit.prospectEmail) doc.text(`Email : ${audit.prospectEmail}`);
    doc.text(`Date : ${new Date(audit.createdAt).toLocaleDateString("fr-CA")}`);
    doc.text(`Source : ${audit.source}`);

    // Score global
    if (audit.scoreGlobal != null) {
      doc.moveDown(1.5);
      doc.fontSize(14).fillColor(DARK).font("Helvetica-Bold").text("Score de conformite global");
      doc.moveDown(0.3);
      const score = audit.scoreGlobal;
      const color = score >= 70 ? "#16A34A" : score >= 40 ? "#EA580C" : "#DC2626";
      doc.fontSize(42).fillColor(color).font("Helvetica-Bold").text(`${score}/100`);
    }

    // Scores par pilier
    if (Object.keys(scores).length > 0) {
      doc.moveDown(1);
      doc.fontSize(14).fillColor(DARK).font("Helvetica-Bold").text("Scores par pilier");
      doc.moveDown(0.5);

      for (const [pilier, score] of Object.entries(scores)) {
        const s = Number(score);
        const barWidth = (s / 100) * 200;
        const y = doc.y;

        // Background bar
        doc.rect(200, y, 200, 12).fill("#E5E7EB");
        // Score bar
        const barColor = s >= 70 ? "#16A34A" : s >= 40 ? "#EA580C" : "#DC2626";
        doc.rect(200, y, barWidth, 12).fill(barColor);

        doc.fontSize(10).fillColor(DARK).font("Helvetica")
          .text(pilier, 50, y + 1, { width: 145 });
        doc.fillColor(MUTED).text(`${s}/100`, 410, y + 1);
        doc.moveDown(0.8);
      }
    }

    // Sections du rapport
    if (rapport.sections && Array.isArray(rapport.sections)) {
      for (const section of rapport.sections) {
        doc.moveDown(1);
        if (doc.y > 650) doc.addPage();

        const statusIcon = section.status === "critique" ? "!!" :
          section.status === "attention" ? "!" : "-";
        doc.fontSize(13).fillColor(GREEN).font("Helvetica-Bold")
          .text(`${statusIcon} ${section.title} (${section.score}/100)`);
        doc.moveDown(0.3);

        // Findings
        if (section.findings && section.findings.length > 0) {
          doc.fontSize(10).fillColor(DARK).font("Helvetica-Bold").text("Constats :");
          for (const f of section.findings) {
            doc.fontSize(9).fillColor(DARK).font("Helvetica").text(`  - ${f}`, { indent: 10 });
          }
        }

        // Recommendations
        if (section.recommendations && section.recommendations.length > 0) {
          doc.moveDown(0.3);
          doc.fontSize(10).fillColor(GREEN).font("Helvetica-Bold").text("Recommandations :");
          for (const r of section.recommendations) {
            doc.fontSize(9).fillColor(DARK).font("Helvetica").text(`  > ${r}`, { indent: 10 });
          }
        }
      }
    }

    // Recommandations prioritaires
    if (rapport.priority_recommendations && rapport.priority_recommendations.length > 0) {
      doc.moveDown(1.5);
      if (doc.y > 650) doc.addPage();
      doc.fontSize(14).fillColor(DARK).font("Helvetica-Bold").text("Recommandations prioritaires");
      doc.moveDown(0.5);
      for (let i = 0; i < rapport.priority_recommendations.length; i++) {
        doc.fontSize(10).fillColor(DARK).font("Helvetica")
          .text(`${i + 1}. ${rapport.priority_recommendations[i]}`);
        doc.moveDown(0.3);
      }
    }

    // Reponses brutes
    doc.addPage();
    doc.fontSize(14).fillColor(DARK).font("Helvetica-Bold").text("Reponses au questionnaire");
    doc.moveDown(0.5);

    for (const [key, value] of Object.entries(reponses)) {
      if (key.startsWith("contact_")) continue;
      if (doc.y > 680) doc.addPage();
      doc.fontSize(9).fillColor(GREEN).font("Helvetica-Bold").text(key.replace(/_/g, " "));
      doc.fontSize(9).fillColor(DARK).font("Helvetica")
        .text(typeof value === "object" ? JSON.stringify(value) : String(value));
      doc.moveDown(0.5);
    }

    // Footer
    doc.fontSize(8).fillColor(MUTED).font("Helvetica")
      .text("SAFE - safecabinet.ca | Confidentiel", 50, 740, { align: "center" });

    doc.end();
    stream.on("finish", resolve);
  });
}

function generateMarkdown(audit, reponses, scores, rapport) {
  let md = `# Rapport d'audit - ${audit.prospectNom}\n\n`;
  md += `**Cabinet :** ${audit.prospectCabinet || "Non specifie"}\n`;
  md += `**Email :** ${audit.prospectEmail || "Non specifie"}\n`;
  md += `**Date :** ${new Date(audit.createdAt).toLocaleDateString("fr-CA")}\n`;
  md += `**Source :** ${audit.source}\n`;

  if (audit.scoreGlobal != null) {
    md += `\n## Score global : ${audit.scoreGlobal}/100\n`;
  }

  if (Object.keys(scores).length > 0) {
    md += `\n## Scores par pilier\n\n`;
    for (const [pilier, score] of Object.entries(scores)) {
      md += `- **${pilier}** : ${score}/100\n`;
    }
  }

  if (rapport.sections) {
    md += `\n## Rapport detaille\n\n`;
    for (const s of rapport.sections) {
      md += `### ${s.title} (${s.score}/100 - ${s.status})\n`;
      if (s.findings) s.findings.forEach(f => md += `- ${f}\n`);
      if (s.recommendations) {
        md += `\n**Recommandations :**\n`;
        s.recommendations.forEach(r => md += `> ${r}\n`);
      }
      md += "\n";
    }
  }

  if (Object.keys(reponses).length > 0) {
    md += `\n## Reponses au questionnaire\n\n`;
    for (const [key, value] of Object.entries(reponses)) {
      if (key.startsWith("contact_")) continue;
      md += `**${key}** : ${typeof value === "object" ? JSON.stringify(value) : value}\n\n`;
    }
  }

  return md;
}

async function syncAudits(since) {
  console.log("Synchronisation des audits...\n");

  const where = since ? { createdAt: { gte: new Date(since) } } : {};
  const audits = await prisma.auditSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  console.log(`   ${audits.length} audit(s) trouve(s)\n`);
  ensureDir(BASE_DIR);

  for (const audit of audits) {
    const clientDir = path.join(BASE_DIR, sanitizeFileName(audit.prospectNom));
    const sourceDir = path.join(clientDir, `source - ${audit.source}`);
    ensureDir(sourceDir);

    // 1. Sauvegarder les reponses JSON
    fs.writeFileSync(
      path.join(sourceDir, "reponses.json"),
      JSON.stringify({
        id: audit.id,
        type: audit.type,
        source: audit.source,
        prospect: {
          nom: audit.prospectNom,
          email: audit.prospectEmail,
          telephone: audit.prospectTelephone,
          cabinet: audit.prospectCabinet,
        },
        reponses: audit.reponses ? JSON.parse(audit.reponses) : null,
        scoreGlobal: audit.scoreGlobal,
        scores: audit.scores ? JSON.parse(audit.scores) : null,
        status: audit.status,
        createdAt: audit.createdAt,
      }, null, 2)
    );

    // 2. Generer le PDF du rapport
    const pdfPath = path.join(sourceDir, "rapport-audit.pdf");
    await generatePDF(audit, pdfPath);

    // 3. Config SAFE si existante
    if (audit.configSafe) {
      fs.writeFileSync(
        path.join(sourceDir, "config-safe.json"),
        JSON.stringify(JSON.parse(audit.configSafe), null, 2)
      );
    }

    console.log(`   OK ${audit.prospectNom} -> ${sourceDir}`);
  }

  console.log(`\nDonnees sauvegardees dans : ${BASE_DIR}`);
}

const args = process.argv.slice(2);
const sinceIdx = args.indexOf("--since");
const since = sinceIdx >= 0 ? args[sinceIdx + 1] : null;

syncAudits(since)
  .catch((e) => console.error("Erreur:", e.message))
  .finally(() => prisma.$disconnect());
