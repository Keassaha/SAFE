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

HERE = Path(__file__).resolve().parent
ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)

statuses = {
    "SOURCE_CONFIRMED": "Texte ou exigence confirme, non approuve pour le logiciel",
    "READY_FOR_PRO_REVIEW": "Modelisation prete pour revue professionnelle",
    "HUMAN_DECISION_ONLY": "Decision non automatisable",
    "EXTERNAL_VALUE_REQUIRED": "Valeur officielle ou experte exigee",
    "RESEARCH_INCOMPLETE": "Recherche supplementaire requise",
    "SOURCE_CONFLICT": "Contradiction non resolue",
    "BLOCKED_FOR_PRODUCTION": "Usage client interdit",
}

rules = [
    ("PF-001", "Composition PF", "PF", "414-415", "SOURCE_CONFIRMED"),
    ("PF-002", "Dettes qualifiees", "PF", "416-417", "READY_FOR_PRO_REVIEW"),
    ("PF-003", "Date et valeur marchande", "PF", "417", "READY_FOR_PRO_REVIEW"),
    ("PF-004", "Deduction bien au mariage", "PF", "418", "READY_FOR_PRO_REVIEW"),
    ("PF-005", "Apport donation/succession", "PF", "418", "READY_FOR_PRO_REVIEW"),
    ("PF-006", "Remploi", "PF", "418 al. 3", "READY_FOR_PRO_REVIEW"),
    ("PF-007", "Execution et attribution", "PF", "419-420", "HUMAN_DECISION_ONLY"),
    ("PF-008", "Alienation/diversion", "PF", "421", "HUMAN_DECISION_ONLY"),
    ("PF-009", "Partage inegal", "PF", "422", "HUMAN_DECISION_ONLY"),
    ("PF-010", "Renonciation", "PF", "423-424", "HUMAN_DECISION_ONLY"),
    ("PF-011", "Retraite et RRQ", "PF", "425-426", "EXTERNAL_VALUE_REQUIRED"),
    ("SA-001", "Classification propres/acquets", "SA", "448-460", "READY_FOR_PRO_REVIEW"),
    ("SA-002", "Recompenses et rapports", "SA", "461-480", "RESEARCH_INCOMPLETE"),
    ("SA-003", "Partage masse acquets", "SA", "481-484", "RESEARCH_INCOMPLETE"),
    ("ART-001", "Articulation PF vers SA", "ORCHESTRATION", "414-426; 448-484", "READY_FOR_PRO_REVIEW"),
    ("PUP-001", "Formation union parentale", "PUP", "521.20-521.28", "SOURCE_CONFIRMED"),
    ("PUP-002", "Composition PUP", "PUP", "521.29-521.30", "SOURCE_CONFIRMED"),
    ("PUP-003", "Modification et retrait", "PUP", "521.31-521.33", "HUMAN_DECISION_ONLY"),
    ("PUP-004", "Valeur nette", "PUP", "521.34-521.35", "READY_FOR_PRO_REVIEW"),
    ("PUP-005", "Deductions PUP", "PUP", "521.36", "READY_FOR_PRO_REVIEW"),
    ("PUP-006", "Execution et pouvoirs", "PUP", "521.37-521.42", "HUMAN_DECISION_ONLY"),
    ("TAX-001", "Transfert immobilisation", "TAX", "LIR 73", "READY_FOR_PRO_REVIEW"),
    ("TAX-002", "Transfert regime enregistre", "TAX", "LIR 146(16)", "READY_FOR_PRO_REVIEW"),
]

rule_rows = [{
    "rule_id": rid, "title": title, "engine": engine, "authority": authority,
    "research_status": status, "production_status": "BLOCKED_FOR_PRODUCTION",
    "human_review_required": True, "last_verified_at": "2026-08-12",
} for rid, title, engine, authority, status in rules]

conflicts = [
    {"id": "C-001", "topic": "JuriFamille coverage", "status": "SOURCE_CONFLICT", "canonical_position": "Public site confirms support calculations; third-party training suggests PF/SA/PUP; demo required."},
    {"id": "C-002", "topic": "Superior Court Excel", "status": "RESEARCH_INCOMPLETE", "canonical_position": "Existence reported; mandatory character not confirmed."},
    {"id": "C-003", "topic": "Negative values", "status": "RESEARCH_INCOMPLETE", "canonical_position": "No automatic zero floor or aggregation before professional review."},
    {"id": "C-004", "topic": "Corporate or trust-held residence", "status": "RESEARCH_INCOMPLETE", "canonical_position": "Analyze ownership and right of use; no categorical inclusion or exclusion."},
    {"id": "C-005", "topic": "Market gap", "status": "SOURCE_CONFLICT", "canonical_position": "Calculation market is occupied; audit/integration gap remains a hypothesis."},
]

formulas = [
    {"formula_id": "F-001", "name": "Net value", "expression": "sum(market_values) - sum(qualified_debts)", "status": "READY_FOR_PRO_REVIEW", "production_status": "BLOCKED_FOR_PRODUCTION"},
    {"formula_id": "F-002", "name": "Initial property appreciation deduction", "expression": "appreciation * initial_net_value / initial_market_value", "status": "READY_FOR_PRO_REVIEW", "guards": ["initial_market_value > 0", "same legal valuation basis", "qualified debts only"], "production_status": "BLOCKED_FOR_PRODUCTION"},
    {"formula_id": "F-003", "name": "Contribution appreciation deduction", "expression": "appreciation_since_contribution * admissible_contribution / market_value_at_contribution", "status": "READY_FOR_PRO_REVIEW", "guards": ["market_value_at_contribution > 0", "complete tracing"], "production_status": "BLOCKED_FOR_PRODUCTION"},
    {"formula_id": "F-004", "name": "Theoretical equalization claim", "expression": "(shareable_A - shareable_B) / 2", "status": "READY_FOR_PRO_REVIEW", "guards": ["no judicial override", "all inputs approved"], "production_status": "BLOCKED_FOR_PRODUCTION"},
]

uncertainties = [
    {"id": "U-001", "topic": "PF-SA non-duplication", "severity": "critical", "blocking": True},
    {"id": "U-002", "topic": "Mixed debts and refinancing", "severity": "critical", "blocking": True},
    {"id": "U-003", "topic": "Negative values", "severity": "critical", "blocking": True},
    {"id": "U-004", "topic": "Latent tax", "severity": "critical", "blocking": True},
    {"id": "U-005", "topic": "Trust/corporation rights of use", "severity": "high", "blocking": True},
    {"id": "U-006", "topic": "Complete SA formulas", "severity": "critical", "blocking": True},
    {"id": "U-007", "topic": "Competitor verification", "severity": "medium", "blocking": False},
]

tests = [{"test_case_id": f"TC-{i:03d}", "status": "PRO_REVIEW_REQUIRED", "production_status": "BLOCKED_FOR_PRODUCTION"} for i in range(1, 41)]

for name, payload in {
    "status-model-v2.json": statuses,
    "rules-v2.json": rule_rows,
    "conflicts-v2.json": conflicts,
    "formulas-v2.json": formulas,
    "uncertainties-v2.json": uncertainties,
    "test-cases-v2.json": tests,
}.items():
    (HERE / name).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="Cover", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=24, leading=29, alignment=TA_CENTER, textColor=colors.HexColor("#173042"), spaceAfter=18))
styles.add(ParagraphStyle(name="H1v2", parent=styles["Heading1"], fontSize=15.5, leading=19, textColor=colors.HexColor("#173042"), spaceBefore=14, spaceAfter=7))
styles.add(ParagraphStyle(name="H2v2", parent=styles["Heading2"], fontSize=11.5, leading=14, textColor=colors.HexColor("#78652A"), spaceBefore=9, spaceAfter=5))
styles.add(ParagraphStyle(name="Bodyv2", parent=styles["BodyText"], fontSize=8.8, leading=12.5, spaceAfter=5.5))
styles.add(ParagraphStyle(name="Smallv2", parent=styles["BodyText"], fontSize=7.1, leading=9.1))

def esc(value: str) -> str:
    value = value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    value = re.sub(r"`([^`]+)`", r"<font name='Courier'>\1</font>", value)
    value = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)
    return value

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#C6B66E"))
    canvas.line(0.65*inch, 0.52*inch, 7.85*inch, 0.52*inch)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(0.65*inch, 0.33*inch, "SAFE Inc. - KB canonique V2 - validation professionnelle requise")
    canvas.drawRightString(7.85*inch, 0.33*inch, f"Page {doc.page}")
    canvas.restoreState()

story = [Spacer(1, 1.0*inch), Paragraph("Knowledge base canonique V2", styles["Cover"]), Paragraph("Patrimoine familial, societe d'acquets et patrimoine d'union parentale", ParagraphStyle(name="SubV2", parent=styles["Heading2"], alignment=TA_CENTER, textColor=colors.HexColor("#78652A"))), Spacer(1, 0.35*inch), Paragraph("Synthese consolidee | 12 aout 2026", ParagraphStyle(name="MetaV2", parent=styles["BodyText"], alignment=TA_CENTER)), Spacer(1, 0.8*inch), Paragraph("USAGE CLIENT INTERDIT AVANT VALIDATION", ParagraphStyle(name="WarnV2", parent=styles["Heading2"], alignment=TA_CENTER, textColor=colors.HexColor("#9A3412"))), Paragraph("Cette version arbitre les contradictions de recherche et prepare la revue professionnelle. Elle ne constitue pas un avis et aucune regle n'est approuvee pour la production.", ParagraphStyle(name="WarnBodyV2", parent=styles["BodyText"], alignment=TA_CENTER, backColor=colors.HexColor("#FFF7ED"), borderPadding=10)), PageBreak()]

lines = (HERE / "RAPPORT_CANONIQUE_V2.md").read_text(encoding="utf-8").splitlines()[6:]
i = 0
while i < len(lines):
    line = lines[i].strip()
    if not line:
        story.append(Spacer(1, 2.5)); i += 1; continue
    if line.startswith("```"):
        block = []; i += 1
        while i < len(lines) and not lines[i].strip().startswith("```"):
            block.append(lines[i]); i += 1
        story.append(Paragraph("<font name='Courier'>" + "<br/>".join(esc(x) for x in block) + "</font>", styles["Smallv2"])); i += 1; continue
    if line.startswith("|"):
        raw = []
        while i < len(lines) and lines[i].strip().startswith("|"):
            raw.append(lines[i].strip()); i += 1
        rows = [[c.strip() for c in row.strip("|").split("|")] for row in raw]
        if len(rows) > 1 and all(set(c) <= {"-", ":"} for c in rows[1]): rows.pop(1)
        data = [[Paragraph(esc(c), styles["Smallv2"]) for c in row] for row in rows]
        widths = [(LETTER[0]-1.3*inch)/len(data[0])] * len(data[0])
        table = Table(data, colWidths=widths, repeatRows=1)
        table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#E8EEF1")),("GRID",(0,0),(-1,-1),0.25,colors.HexColor("#BBC8CF")),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),4),("RIGHTPADDING",(0,0),(-1,-1),4),("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4)]))
        story.extend([table, Spacer(1,5)]); continue
    if line.startswith("# "): i += 1; continue
    if line.startswith("## "): story.append(Paragraph(esc(line[3:]), styles["H1v2"]))
    elif line.startswith("### "): story.append(Paragraph(esc(line[4:]), styles["H2v2"]))
    else: story.append(Paragraph(esc(line), styles["Bodyv2"]))
    i += 1

pdf = OUT / "PFQ_SAFE_Knowledge_Base_Canonique_V2_2026-08-12.pdf"
SimpleDocTemplate(str(pdf), pagesize=LETTER, leftMargin=.65*inch, rightMargin=.65*inch, topMargin=.65*inch, bottomMargin=.7*inch, title="Knowledge base canonique V2 - patrimoines conjugaux au Quebec", author="SAFE Inc.").build(story, onFirstPage=footer, onLaterPages=footer)
print(pdf)
