from __future__ import annotations

import json
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)


sources = [
    {"source_id": "SRC-001", "title": "Code civil du Quebec", "authority": "Editeur officiel du Quebec", "level": 1, "jurisdiction": "QC", "url": "https://www.legisquebec.gouv.qc.ca/fr/pdf/lc/CCQ-1991.pdf", "last_verified_at": "2026-08-11", "supports": ["PF-001", "PF-002", "PF-003", "PF-004", "PF-005", "PF-006", "PF-007", "PF-008", "PF-009", "PF-010", "PUP-001", "PUP-002", "PUP-003", "PUP-004", "PUP-005", "PUP-006"]},
    {"source_id": "SRC-003", "title": "Patrimoine d'union parentale", "authority": "Gouvernement du Quebec", "level": 2, "jurisdiction": "QC", "url": "https://www.quebec.ca/famille-et-soutien-aux-personnes/mariage-union/effets-union-parentale/patrimoine-union-parentale", "last_verified_at": "2026-08-11", "supports": ["PUP-001", "PUP-002", "PUP-003"]},
    {"source_id": "SRC-004", "title": "Evaluation des droits", "authority": "Retraite Quebec", "level": 2, "jurisdiction": "QC", "url": "https://www.retraitequebec.gouv.qc.ca/fr/professionnels-et-employeurs/professionnels-concernes-regimes-retraite/partage-droits-rcr-et-rver/evaluation-droits", "last_verified_at": "2026-08-11", "supports": ["PF-010", "RET-001"]},
    {"source_id": "SRC-005", "title": "Partage des droits", "authority": "Retraite Quebec", "level": 2, "jurisdiction": "QC", "url": "https://www.retraitequebec.gouv.qc.ca/fr/professionnels-et-employeurs/professionnels-concernes-regimes-retraite/partage-droits-rcr-et-rver/partage-droits", "last_verified_at": "2026-08-11", "supports": ["PF-010", "RET-001"]},
    {"source_id": "SRC-007", "title": "Loi de l'impot sur le revenu, article 73", "authority": "Justice Canada", "level": 1, "jurisdiction": "CA", "url": "https://laws-lois.justice.gc.ca/fra/lois/I-3.3/section-73.html", "last_verified_at": "2026-08-11", "supports": ["TAX-001"]},
    {"source_id": "SRC-008", "title": "Transferts d'immobilisations", "authority": "Agence du revenu du Canada", "level": 2, "jurisdiction": "CA", "url": "https://www.canada.ca/fr/agence-revenu/services/impot/particuliers/sujets/tout-votre-declaration-revenus/declaration-revenus/remplir-declaration-revenus/revenu-personnel/ligne-12700-gains-capital/transferts-immobilisations.html", "last_verified_at": "2026-08-11", "supports": ["TAX-001"]},
    {"source_id": "SRC-009", "title": "Formulaire T2220", "authority": "Agence du revenu du Canada", "level": 2, "jurisdiction": "CA", "url": "https://www.canada.ca/fr/agence-revenu/services/formulaires-publications/formulaires/t2220.html", "last_verified_at": "2026-08-11", "supports": ["TAX-002"]},
    {"source_id": "SRC-010", "title": "Transfert REER, FERR ou RPAC/RVER", "authority": "Revenu Quebec", "level": 2, "jurisdiction": "QC", "url": "https://www.revenuquebec.ca/fr/citoyens/votre-situation/separation-ou-divorce/transfert-de-fonds-detenus-dans-un-reer-un-ferr-ou-un-rpacrver/", "last_verified_at": "2026-08-11", "supports": ["TAX-002"]},
    {"source_id": "SRC-013", "title": "Droit de la famille - 163076, 2016 QCCA 2040", "authority": "Cour d'appel du Quebec", "level": 1, "jurisdiction": "QC", "url": "https://www.canlii.org/w/canlii/2017CanLIIDocs4115.pdf", "last_verified_at": "2026-08-11", "supports": ["PF-005"]},
    {"source_id": "SRC-014", "title": "AliForm et PatriForm", "authority": "Juris Concept", "level": 5, "jurisdiction": "QC", "url": "https://jurisconcept.ca/fr/aliform/", "last_verified_at": "2026-08-11", "supports": []},
    {"source_id": "SRC-015", "title": "Acces a AliForm dans l'Espace CAIJ", "authority": "CAIJ", "level": 3, "jurisdiction": "QC", "url": "https://www.caij.qc.ca/nouvelles/acces-a-aliform-maintenant-offert-dans-lespace-caij/", "last_verified_at": "2026-08-11", "supports": []},
]

rule_specs = [
    ("PF-001", "Composition du patrimoine familial", "PF", ["SRC-001"], "REVIEW_REQUIRED", "Qualifier chaque bien selon sa nature, son usage, la propriete et la periode."),
    ("PF-002", "Dettes qualifiees", "PF", ["SRC-001"], "REVIEW_REQUIRED", "Soustraire seulement les dettes d'acquisition, amelioration, entretien ou conservation prouvees."),
    ("PF-003", "Date d'evaluation", "PF", ["SRC-001"], "HUMAN_REVIEW", "Utiliser la date legale applicable ou une date ordonnee par le tribunal."),
    ("PF-004", "Bien possede au mariage", "PF", ["SRC-001"], "REVIEW_REQUIRED", "Deduction de la valeur nette initiale et de la plus-value proportionnelle."),
    ("PF-005", "Apport donation ou succession", "PF", ["SRC-001", "SRC-013"], "REVIEW_REQUIRED", "Deduction de l'apport prouve et de la plus-value proportionnelle."),
    ("PF-006", "Remploi", "PF", ["SRC-001"], "REVIEW_REQUIRED", "Reporter la deduction sur un autre bien admissible avec chaine de tracabilite."),
    ("PF-007", "Alienation ou diversion", "PF", ["SRC-001"], "HUMAN_ONLY", "Signaler au juriste; aucune compensation automatique."),
    ("PF-008", "Partage inegal", "PF", ["SRC-001"], "HUMAN_ONLY", "Pouvoir judiciaire, jamais calcule automatiquement."),
    ("PF-009", "Renonciation", "PF", ["SRC-001"], "HUMAN_ONLY", "Exiger forme, moment et preuve d'inscription applicables."),
    ("PF-010", "Retraite", "PF", ["SRC-001", "SRC-004", "SRC-005"], "EXTERNAL_VALUE", "Importer un releve officiel et appliquer les regles de l'administrateur."),
    ("PUP-001", "Composition du patrimoine d'union parentale", "PUP", ["SRC-001", "SRC-003"], "REVIEW_REQUIRED", "Moteur distinct visant residences, meubles et vehicules familiaux."),
    ("PUP-002", "Modification ou exclusion", "PUP", ["SRC-001", "SRC-003"], "HUMAN_ONLY", "Exiger l'acte et sa date d'effet."),
    ("PUP-003", "Retrait", "PUP", ["SRC-001", "SRC-003"], "HUMAN_ONLY", "Controler commun accord, acte et delai de 90 jours."),
    ("PUP-004", "Valeur nette PUP", "PUP", ["SRC-001"], "REVIEW_REQUIRED", "Valeur marchande moins dettes qualifiees a l'ouverture du droit."),
    ("PUP-005", "Deductions PUP", "PUP", ["SRC-001"], "REVIEW_REQUIRED", "Appliquer les sources d'apports propres a l'art. 521.36."),
    ("PUP-006", "Partage inegal PUP", "PUP", ["SRC-001"], "HUMAN_ONLY", "Pouvoir judiciaire; produire seulement un signal."),
    ("TAX-001", "Transfert d'immobilisation", "TAX", ["SRC-007", "SRC-008"], "TAX_REVIEW", "Distinguer roulement, choix JVM, bien amortissable et attribution."),
    ("TAX-002", "Transfert direct regime enregistre", "TAX", ["SRC-009", "SRC-010"], "TAX_REVIEW", "Exiger transfert direct et ordonnance ou entente admissible."),
    ("RET-001", "Valeur officielle des droits", "RETIREMENT", ["SRC-004", "SRC-005"], "EXTERNAL_VALUE", "Bloquer le calcul si le releve requis manque."),
]

rules = [{"rule_id": rid, "title": title, "jurisdiction": "QC" if domain != "TAX" else "CA/QC", "domain": domain, "effective_from": "2025-06-30" if domain == "PUP" else None, "effective_to": None, "source_ids": sids, "logic": logic, "status": status, "confidence": "high" if status in {"EXTERNAL_VALUE", "HUMAN_ONLY"} else "medium", "human_review_required": True, "last_verified_at": "2026-08-11"} for rid, title, domain, sids, status, logic in rule_specs]

formulas = [
    {"formula_id": "F-001", "name": "Valeur nette d'un bien", "expression": "market_value - qualified_debt", "rule_ids": ["PF-002", "PUP-004"], "rounding": "currency_2", "production_status": "REVIEW_REQUIRED"},
    {"formula_id": "F-002", "name": "Plus-value deductible - bien initial", "expression": "appreciation * initial_net_value / initial_gross_value", "rule_ids": ["PF-004", "PUP-005"], "preconditions": ["initial_gross_value > 0", "dated valuation", "proof of ownership"], "rounding": "calculation_4_output_2", "production_status": "REVIEW_REQUIRED"},
    {"formula_id": "F-003", "name": "Plus-value deductible - apport", "expression": "appreciation_since_contribution * contribution / gross_value_at_contribution", "rule_ids": ["PF-005", "PUP-005"], "preconditions": ["gross_value_at_contribution > 0", "traceable contribution"], "rounding": "calculation_4_output_2", "production_status": "REVIEW_REQUIRED"},
    {"formula_id": "F-004", "name": "Valeur partageable par conjoint", "expression": "net_family_value - admissible_deductions", "rule_ids": ["PF-002", "PF-004", "PF-005", "PF-006"], "rounding": "currency_2", "production_status": "REVIEW_REQUIRED"},
    {"formula_id": "F-005", "name": "Creance theorique egalitaire", "expression": "(shareable_value_A - shareable_value_B) / 2", "rule_ids": ["PF-001", "PF-002"], "preconditions": ["no judicial unequal division", "all assets and debts validated"], "rounding": "currency_2", "production_status": "REVIEW_REQUIRED"},
]

scenario_names = [
    "Residence acquise apres mariage", "Residence possedee avant mariage sans dette", "Residence initiale avec dette et plus-value", "Donation comme mise de fonds", "Succession utilisee pour amelioration", "Remploi dans une seconde residence", "Remplois successifs", "Remploi avec preuve manquante", "Refinancement familial", "Refinancement mixte", "Dette garantie non reliee", "Copropriete inegale", "Chalet familial", "Immeuble locatif partiellement occupe", "Vehicule au nom d'une entreprise", "REER avant et pendant mariage", "Pension a cotisations determinees", "Pension a prestations determinees sans releve", "RRQ et renonciation", "Valeur nette negative", "Alienation dans l'annee", "Demande de partage inegal", "Deces et prestation survivant", "PUP automatique", "PUP volontaire", "PUP retrait dans 90 jours", "PUP bien exclu par acte", "Bien en fiducie", "Bien etranger", "Transfert direct REER versus retrait"
]

test_cases = []
for i, name in enumerate(scenario_names, 1):
    domain = "PUP" if 24 <= i <= 27 else "TAX" if i == 30 else "PF"
    test_cases.append({"test_case_id": f"TC-{i:03d}", "title": name, "domain": domain, "status": "DESIGN_COMPLETE_EXPECTED_RESULT_REVIEW_REQUIRED", "expected_controls": ["source_traceability", "dated_values", "human_review"], "expected_result": "manual professional baseline required before production"})

competitors = [
    {"competitor_id": "CMP-001", "name": "AliForm / PatriForm", "territory": "Quebec", "audience": "family-law professionals", "verified_features": ["family patrimony calculation", "support calculations", "annotated jurisprudence"], "unknowns": ["API", "machine-readable export", "PUP support", "hosting", "audit granularity"], "source_ids": ["SRC-014", "SRC-015"], "last_verified_at": "2026-08-11"},
    {"competitor_id": "CMP-002", "name": "Formulaires AFQ", "territory": "Quebec", "audience": "professionals", "verified_features": ["family patrimony worksheet", "partnership of acquests worksheet"], "unknowns": ["automation", "collaboration", "audit", "security"], "last_verified_at": "2026-08-11"},
    {"competitor_id": "CMP-003", "name": "Jurifamille", "territory": "Quebec", "audience": "authorized family-law professionals", "verified_features": ["support calculations", "tax scenarios", "annual updates"], "unknowns": ["family patrimony engine"], "last_verified_at": "2026-08-11"},
    {"competitor_id": "CMP-004", "name": "SimpleEquity", "territory": "Canada", "audience": "family-law professionals", "verified_features": ["financial disclosure", "property division scenarios", "collaboration"], "unknowns": ["Quebec PF rules", "PUP rules"], "last_verified_at": "2026-08-11"},
]

uncertainties = [
    {"uncertainty_id": "U-001", "topic": "Impot latent", "risk": "high", "blocking": True, "professional": "tax specialist and family lawyer"},
    {"uncertainty_id": "U-002", "topic": "Fiducie ou societe conferant l'usage", "risk": "high", "blocking": True, "professional": "family lawyer"},
    {"uncertainty_id": "U-003", "topic": "Dettes mixtes", "risk": "high", "blocking": True, "professional": "family lawyer and CPA"},
    {"uncertainty_id": "U-004", "topic": "Transposition de jurisprudence PF vers PUP", "risk": "high", "blocking": True, "professional": "family lawyer/notary"},
    {"uncertainty_id": "U-005", "topic": "Valeur actuarielle sans releve", "risk": "critical", "blocking": True, "professional": "actuary/plan administrator"},
]


def dump(name: str, value) -> None:
    (HERE / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


for filename, payload in [
    ("sources.json", sources), ("rules.json", rules), ("formulas.json", formulas),
    ("test-cases.json", test_cases), ("competitors.json", competitors),
    ("uncertainties.json", uncertainties),
]:
    dump(filename, payload)


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=24, leading=29, textColor=colors.HexColor("#132A3A"), alignment=TA_CENTER, spaceAfter=20))
styles.add(ParagraphStyle(name="H1x", parent=styles["Heading1"], fontSize=16, leading=20, textColor=colors.HexColor("#132A3A"), spaceBefore=14, spaceAfter=8))
styles.add(ParagraphStyle(name="H2x", parent=styles["Heading2"], fontSize=12, leading=15, textColor=colors.HexColor("#2D586E"), spaceBefore=10, spaceAfter=5))
styles.add(ParagraphStyle(name="Bodyx", parent=styles["BodyText"], fontSize=9, leading=13, spaceAfter=6))
styles.add(ParagraphStyle(name="Smallx", parent=styles["BodyText"], fontSize=7.2, leading=9.3, textColor=colors.HexColor("#334155")))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#CBD5E1"))
    canvas.line(0.65 * inch, 0.53 * inch, 7.85 * inch, 0.53 * inch)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(0.65 * inch, 0.34 * inch, "SAFE Inc. - Recherche preparatoire - Validation professionnelle requise")
    canvas.drawRightString(7.85 * inch, 0.34 * inch, f"Page {doc.page}")
    canvas.restoreState()


def inline(text: str) -> str:
    text = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = text.replace("&", "&amp;") if "<font" not in text and "<b>" not in text else text
    return text


md = (HERE / "RAPPORT_RECHERCHE_V01.md").read_text(encoding="utf-8")
story = [Spacer(1, 1.0 * inch), Paragraph("Calculateur professionnel de patrimoine familial au Quebec", styles["CoverTitle"]), Spacer(1, 0.25 * inch), Paragraph("Dossier fondateur juridique, fiscal, mathematique et concurrentiel", ParagraphStyle(name="Sub", parent=styles["Heading2"], alignment=TA_CENTER, textColor=colors.HexColor("#2D586E"))), Spacer(1, 0.45 * inch), Paragraph("Version 0.1 | 11 aout 2026", ParagraphStyle(name="Meta", parent=styles["BodyText"], alignment=TA_CENTER)), Spacer(1, 1.0 * inch), Paragraph("AVERTISSEMENT", ParagraphStyle(name="Warn", parent=styles["Heading2"], alignment=TA_CENTER, textColor=colors.HexColor("#9A3412"))), Paragraph("Recherche preparatoire seulement. Ce rapport ne constitue pas un avis juridique, fiscal, comptable, notarial ou actuariel. Aucune regle ne doit etre utilisee en production avant validation formelle.", ParagraphStyle(name="WarnBody", parent=styles["BodyText"], alignment=TA_CENTER, backColor=colors.HexColor("#FFF7ED"), borderPadding=10)), PageBreak()]

lines = md.splitlines()[8:]
i = 0
while i < len(lines):
    line = lines[i].strip()
    if not line:
        story.append(Spacer(1, 3))
        i += 1
        continue
    if line.startswith("| "):
        table_lines = []
        while i < len(lines) and lines[i].strip().startswith("|"):
            table_lines.append(lines[i].strip())
            i += 1
        rows = [[c.strip() for c in r.strip("|").split("|")] for r in table_lines]
        if len(rows) > 1 and all(set(c) <= {"-", ":"} for c in rows[1]):
            rows.pop(1)
        data = [[Paragraph(inline(c), styles["Smallx"]) for c in row] for row in rows]
        widths = [(LETTER[0] - 1.3 * inch) / max(len(data[0]), 1)] * len(data[0])
        tbl = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
        tbl.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8F0F4")), ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#132A3A")), ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
        story.extend([tbl, Spacer(1, 6)])
        continue
    if line.startswith("# "):
        i += 1
        continue
    if line.startswith("## "):
        story.append(Paragraph(inline(line[3:]), styles["H1x"]))
    elif line.startswith("### "):
        story.append(Paragraph(inline(line[4:]), styles["H2x"]))
    elif re.match(r"^\d+\. ", line) or line.startswith("- "):
        story.append(Paragraph(inline(line), styles["Bodyx"], bulletText=None))
    else:
        story.append(Paragraph(inline(line), styles["Bodyx"]))
    i += 1

pdf_path = OUT / "PFQ_SAFE_Recherche_Fondatrice_2026-08-11_v01.pdf"
doc = SimpleDocTemplate(str(pdf_path), pagesize=LETTER, rightMargin=0.65 * inch, leftMargin=0.65 * inch, topMargin=0.65 * inch, bottomMargin=0.7 * inch, title="Calculateur professionnel de patrimoine familial au Quebec", author="SAFE Inc.")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(pdf_path)
