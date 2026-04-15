#!/usr/bin/env python3
"""Generate professional PDF sales report for Me Sarah Marchand."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import os

# --- Colors ---
SAFE_BLUE = HexColor("#1e3a5f")
SAFE_ACCENT = HexColor("#2563eb")
SAFE_LIGHT_BLUE = HexColor("#eff6ff")
SAFE_GREEN = HexColor("#16a34a")
SAFE_LIGHT_GREEN = HexColor("#f0fdf4")
SAFE_ORANGE = HexColor("#ea580c")
SAFE_LIGHT_ORANGE = HexColor("#fff7ed")
SAFE_GRAY = HexColor("#6b7280")
SAFE_LIGHT_GRAY = HexColor("#f9fafb")
SAFE_DARK = HexColor("#111827")
SAFE_BORDER = HexColor("#e5e7eb")
SAFE_RED = HexColor("#dc2626")
SAFE_LIGHT_RED = HexColor("#fef2f2")
SAFE_GOLD = HexColor("#d97706")

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "Proposition-SAFE-Me-Marchand.pdf")


def create_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='CoverTitle',
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=white,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        fontName='Helvetica',
        fontSize=14,
        leading=20,
        textColor=HexColor("#bfdbfe"),
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name='CoverMeta',
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        textColor=HexColor("#93c5fd"),
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=24,
        textColor=SAFE_BLUE,
        spaceBefore=20,
        spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        name='SubsectionTitle',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=18,
        textColor=SAFE_ACCENT,
        spaceBefore=14,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name='BodyText2',
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        textColor=SAFE_DARK,
        alignment=TA_JUSTIFY,
        spaceBefore=3,
        spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name='BodyBold',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=15,
        textColor=SAFE_DARK,
        spaceBefore=3,
        spaceAfter=3,
    ))
    styles.add(ParagraphStyle(
        name='BulletItem',
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        textColor=SAFE_DARK,
        leftIndent=20,
        bulletIndent=8,
        spaceBefore=2,
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        name='QuoteText',
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=15,
        textColor=SAFE_GRAY,
        leftIndent=15,
        borderPadding=8,
        spaceBefore=6,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name='TableHeader',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=white,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name='TableCell',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=SAFE_DARK,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name='TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=SAFE_DARK,
        alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        name='BigNumber',
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=28,
        textColor=SAFE_ACCENT,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name='BigNumberLabel',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=SAFE_GRAY,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name='FooterText',
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=SAFE_GRAY,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name='PlanTitle',
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=20,
        textColor=SAFE_BLUE,
        alignment=TA_CENTER,
        spaceBefore=6,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name='PlanPrice',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=26,
        textColor=SAFE_ACCENT,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name='PlanDetail',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=SAFE_DARK,
        alignment=TA_CENTER,
    ))
    return styles


class NumberedCanvas(canvas.Canvas):
    """Canvas that adds page numbers and footer."""
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        if self._pageNumber > 1:
            self.setFont("Helvetica", 8)
            self.setFillColor(SAFE_GRAY)
            self.drawCentredString(
                letter[0] / 2, 0.5 * inch,
                f"SAFE | Proposition pour Me Sarah Marchand — Page {self._pageNumber} / {page_count}"
            )
            # thin line
            self.setStrokeColor(SAFE_BORDER)
            self.setLineWidth(0.5)
            self.line(0.75 * inch, 0.65 * inch, letter[0] - 0.75 * inch, 0.65 * inch)


def make_table(headers, rows, col_widths, styles):
    """Create a styled table."""
    header_cells = [Paragraph(h, styles['TableHeader']) for h in headers]
    data = [header_cells]
    for row in rows:
        data.append([Paragraph(str(c), styles['TableCell']) for c in row])

    t = Table(data, colWidths=col_widths, repeatRows=1)

    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), SAFE_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, SAFE_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ]

    for i in range(1, len(data)):
        bg = white if i % 2 == 1 else SAFE_LIGHT_GRAY
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))

    t.setStyle(TableStyle(style_cmds))
    return t


def make_kv_table(rows, col_widths, styles):
    """Create a key-value style table (no header row, bold first col)."""
    data = []
    for row in rows:
        data.append([
            Paragraph(f"<b>{row[0]}</b>", styles['TableCell']),
            Paragraph(str(row[1]), styles['TableCell'])
        ])

    t = Table(data, colWidths=col_widths)
    style_cmds = [
        ('GRID', (0, 0), (-1, -1), 0.5, SAFE_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (0, -1), SAFE_LIGHT_BLUE),
    ]
    for i in range(len(data)):
        if i % 2 == 1:
            style_cmds.append(('BACKGROUND', (1, i), (1, i), SAFE_LIGHT_GRAY))
    t.setStyle(TableStyle(style_cmds))
    return t


def make_highlight_box(text, bg_color, text_color, styles):
    """Create a colored highlight box."""
    p = Paragraph(text, ParagraphStyle(
        'highlight', parent=styles['BodyBold'],
        textColor=text_color, fontSize=11, leading=16,
    ))
    t = Table([[p]], colWidths=[6.5 * inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_color),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    return t


def make_stat_cards(items, styles):
    """Create a row of stat cards."""
    cells = []
    for value, label in items:
        cell_content = [
            Paragraph(value, styles['BigNumber']),
            Paragraph(label, styles['BigNumberLabel']),
        ]
        cells.append(cell_content)

    # Build inner tables for each card
    card_tables = []
    for cell in cells:
        inner = Table([[cell[0]], [cell[1]]], colWidths=[1.8 * inch])
        inner.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (-1, -1), SAFE_LIGHT_BLUE),
            ('ROUNDEDCORNERS', [6, 6, 6, 6]),
            ('BOX', (0, 0), (-1, -1), 0.5, SAFE_ACCENT),
        ]))
        card_tables.append(inner)

    row_table = Table([card_tables], colWidths=[2.1 * inch] * len(card_tables))
    row_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    return row_table


def build_cover(story, styles):
    """Build the cover page."""
    # Blue cover block
    cover_data = [
        [Paragraph("", styles['CoverTitle'])],
        [Spacer(1, 40)],
        [Paragraph("SAFE", ParagraphStyle(
            'brand', fontName='Helvetica-Bold', fontSize=42, leading=50, textColor=white
        ))],
        [Spacer(1, 10)],
        [Paragraph("Proposition de services", styles['CoverTitle'])],
        [Spacer(1, 10)],
        [Paragraph(
            "Preparee pour Me Sarah Marchand<br/>"
            "Cabinet Droit Familial Solutions Inc.",
            styles['CoverSubtitle']
        )],
        [Spacer(1, 30)],
        [Paragraph(
            "Date : 14 avril 2026<br/>"
            "Preparee par : Jeremie Tiahou, Fondateur",
            styles['CoverMeta']
        )],
        [Spacer(1, 20)],
    ]
    cover_table = Table(cover_data, colWidths=[6.5 * inch])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SAFE_BLUE),
        ('LEFTPADDING', (0, 0), (-1, -1), 30),
        ('RIGHTPADDING', (0, 0), (-1, -1), 30),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    story.append(Spacer(1, 1.5 * inch))
    story.append(cover_table)
    story.append(Spacer(1, 40))

    # Key metrics preview
    story.append(make_stat_cards([
        ("27:1", "ROI projete"),
        ("6 501 $", "Gain net / mois"),
        ("249 $", "Investissement / mois"),
    ], styles))
    story.append(Spacer(1, 30))

    # Confidentiality notice
    story.append(Paragraph(
        "Document confidentiel - Ce document est destine exclusivement a "
        "Me Sarah Marchand et ne doit pas etre distribue sans autorisation.",
        styles['FooterText']
    ))
    story.append(PageBreak())


def build_executive_summary(story, styles):
    """Build the executive summary section."""
    story.append(Paragraph("1. Resume executif", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFE_ACCENT, spaceAfter=10))

    story.append(Paragraph(
        "Me Marchand, apres notre echange, une chose est claire : votre expertise en droit "
        "familial est solide - 12 ans de pratique, une clientele fidele, des resultats. "
        "Ce qui freine votre cabinet, ce n'est pas le droit. C'est l'administratif.",
        styles['BodyText2']
    ))
    story.append(Spacer(1, 8))

    story.append(make_highlight_box(
        "Vous perdez actuellement l'equivalent de 3 000 $/mois en temps d'assistant "
        "consacre a des taches qui pourraient etre automatisees.",
        SAFE_LIGHT_RED, SAFE_RED, styles
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "SAFE elimine ces inefficacites. Pour un investissement de <b>249 $/mois</b>, vous "
        "recuperez du temps facturable, vous securisez votre conformite au Barreau, et vous "
        "dormez mieux avant l'inspection.",
        styles['BodyText2']
    ))
    story.append(Spacer(1, 8))

    story.append(make_highlight_box(
        "Retour sur investissement : 12x votre mise. Chaque dollar investi dans SAFE "
        "vous en rapporte 12 en temps recupere et en revenus non perdus.",
        SAFE_LIGHT_GREEN, SAFE_GREEN, styles
    ))
    story.append(Spacer(1, 12))


def build_client_profile(story, styles):
    """Build the client profile section."""
    story.append(Paragraph("2. Votre cabinet aujourd'hui", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFE_ACCENT, spaceAfter=10))

    kv_data = [
        ("Nom legal", "Cabinet Droit Familial Solutions Inc."),
        ("Fondation", "2012 - 14 ans d'existence"),
        ("Localisation", "Montreal, QC"),
        ("Equipe", "1 avocate (vous) + 1 assistant juridique"),
        ("Structure", "Pratique solo (proprietaire)"),
        ("Taux horaires", "225 $/h (avocate) - 100 $/h (assistant)"),
    ]
    story.append(make_kv_table(kv_data, [1.8 * inch, 4.7 * inch], styles))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Repartition de votre pratique", styles['SubsectionTitle']))
    story.append(make_table(
        ["Domaine", "Part", "Volume estime"],
        [
            ["Divorce et separation", "60 %", "Majorite des dossiers"],
            ["Modification de pension alimentaire", "25 %", "Calculs recurrents"],
            ["Garde et droits d'acces", "15 %", "Souvent lies aux divorces"],
        ],
        [2.5 * inch, 1 * inch, 3 * inch],
        styles
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Vos outils actuels", styles['SubsectionTitle']))
    story.append(make_table(
        ["Fonction", "Outil actuel", "Risque identifie"],
        [
            ["Dossiers clients", "Papier + Word", "Pas d'historique, risque de perte"],
            ["Facturation", "Excel + Word", "Heures oubliees, pas de suivi"],
            ["Suivi du temps", "De memoire", "Sous-facturation chronique"],
            ["Fideicommis", "Cahier manuscrit", "Non-conformite potentielle B-1 r.5"],
            ["Paiements", "Virement, cheque", "Aucun suivi de relance"],
        ],
        [1.8 * inch, 1.8 * inch, 2.9 * inch],
        styles
    ))
    story.append(PageBreak())


def build_needs_analysis(story, styles):
    """Build the needs analysis section."""
    story.append(Paragraph("3. Analyse de vos besoins", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFE_ACCENT, spaceAfter=10))

    # Pain 1
    story.append(Paragraph(
        "Douleur 1 : Dossiers disperses, historique absent",
        styles['SubsectionTitle']
    ))
    story.append(Paragraph(
        '<i>"Les dossiers sont partout. Pas d\'historique client. J\'ai peur d\'oublier '
        'des details importants."</i>',
        styles['QuoteText']
    ))
    story.append(Paragraph(
        "<b>Impact reel :</b> En droit familial, un detail oublie dans un dossier de garde "
        "peut changer l'issue d'une audience. Quand les notes sont dispersees entre Word et "
        "le papier, le risque n'est pas hypothetique - il est quotidien.",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "<b>Cout estime :</b> ~5h/semaine en recherche dans les dossiers papier, "
        "risque de manquer un element cle lors d'une representation.",
        styles['BodyText2']
    ))
    story.append(Spacer(1, 8))

    # Pain 2
    story.append(Paragraph(
        "Douleur 2 : Facturation chaotique",
        styles['SubsectionTitle']
    ))
    story.append(Paragraph(
        '<i>"La facturation c\'est le chaos. J\'oublie des heures, les clients paient '
        'tard, pas de relances."</i>',
        styles['QuoteText']
    ))
    story.append(Paragraph(
        "<b>Impact reel :</b> Facturer de memoire en fin de mois signifie perdre des heures "
        "travaillees. Les avocats qui ne trackent pas leur temps en temps reel perdent entre "
        "10 % et 30 % de leurs heures facturables.",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "<b>Cout estime :</b> 2-4h/semaine x 225 $/h = <b>1 800 a 3 600 $/mois</b> en "
        "revenus perdus.",
        styles['BodyText2']
    ))
    story.append(Spacer(1, 8))

    # Pain 3
    story.append(Paragraph(
        "Douleur 3 : Fideicommis a risque",
        styles['SubsectionTitle']
    ))
    story.append(Paragraph(
        '<i>"Fideicommis : les depots pension je gere sur papier. L\'audit du Barreau '
        'me stresse."</i>',
        styles['QuoteText']
    ))
    story.append(Paragraph(
        "<b>Impact reel :</b> Le Reglement B-1 r.5 du Barreau du Quebec exige une tracabilite "
        "complete de chaque transaction en fideicommis. Un cahier manuscrit ne satisfait pas "
        "aux normes d'inspection.",
        styles['BodyText2']
    ))
    story.append(Paragraph(
        "<b>Cout estime :</b> 15-20h de preparation a chaque inspection, stress permanent, "
        "risque reel de sanctions.",
        styles['BodyText2']
    ))
    story.append(Spacer(1, 8))

    # Pain 4
    story.append(Paragraph(
        "Douleur 4 : Manque de temps pour s'organiser",
        styles['SubsectionTitle']
    ))
    story.append(Paragraph(
        '<i>"Besoin de mieux organiser ma pratique. Pas de temps."</i>',
        styles['QuoteText']
    ))
    story.append(Paragraph(
        "<b>Impact reel :</b> Cercle vicieux : pas le temps d'organiser -> desorganisation "
        "-> encore moins de temps. La seule sortie est un systeme qui s'organise pour vous.",
        styles['BodyText2']
    ))
    story.append(PageBreak())


def build_solution(story, styles):
    """Build the SAFE solution section."""
    story.append(Paragraph("4. La solution SAFE", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFE_ACCENT, spaceAfter=10))

    story.append(make_highlight_box(
        "SAFE est le seul logiciel de gestion concu specifiquement pour les avocats du Quebec. "
        "Chaque fonctionnalite repond aux exigences du Barreau - pas adaptee apres coup.",
        SAFE_LIGHT_BLUE, SAFE_BLUE, styles
    ))
    story.append(Spacer(1, 12))

    # Feature 1: Dossiers
    story.append(Paragraph("Dossiers clients centralises", styles['SubsectionTitle']))
    story.append(make_table(
        ["Aujourd'hui", "Avec SAFE"],
        [
            ["Notes dans Word, classeurs papier", "Dossier numerique unique par client"],
            ["Chercher dans les piles de papier", "Recherche instantanee par nom, dossier, date"],
            ["Pas de lien entre dossiers lies", "Liens automatiques (divorce -> pension -> garde)"],
        ],
        [3.25 * inch, 3.25 * inch],
        styles
    ))
    story.append(Spacer(1, 10))

    # Feature 2: Facturation
    story.append(Paragraph("Facturation automatisee", styles['SubsectionTitle']))
    story.append(make_table(
        ["Aujourd'hui", "Avec SAFE"],
        [
            ["Facturation de memoire", "Chronometre integre - une touche"],
            ["Factures Word manuelles", "Factures conformes B-1 r.5 en 2 clics"],
            ["Calcul manuel TPS/TVQ", "Calcul automatique, toujours exact"],
            ["Pas de suivi des impayes", "Tableau de bord en temps reel"],
        ],
        [3.25 * inch, 3.25 * inch],
        styles
    ))
    story.append(Spacer(1, 10))

    # Feature 3: Relances
    story.append(Paragraph("Relances de paiement automatiques", styles['SubsectionTitle']))
    story.append(make_table(
        ["Etape", "Declencheur", "Action SAFE"],
        [
            ["Rappel courtois", "7 jours apres echeance", "Courriel automatique personnalise"],
            ["2e rappel", "14 jours", "Courriel + notification tableau de bord"],
            ["Relance formelle", "30 jours", "Mise en demeure generee, prete a envoyer"],
            ["Alerte prioritaire", "60 jours", "Notification urgente - decision requise"],
        ],
        [1.5 * inch, 2.0 * inch, 3.0 * inch],
        styles
    ))
    story.append(Spacer(1, 10))

    # Feature 4: Fideicommis
    story.append(Paragraph("Fideicommis conforme - Zero stress", styles['SubsectionTitle']))
    story.append(make_table(
        ["Aujourd'hui", "Avec SAFE"],
        [
            ["Cahier manuscrit", "Registre numerique conforme B-1 r.5"],
            ["Reconciliation manuelle", "Reconciliation automatique du solde"],
            ["Preparation d'inspection en panique", "Rapport d'inspection pret en un clic"],
            ["Risque d'erreur humaine", "Validation obligatoire avant chaque retrait"],
        ],
        [3.25 * inch, 3.25 * inch],
        styles
    ))
    story.append(PageBreak())

    # Feature 5: Loi 25
    story.append(Paragraph("Conformite Loi 25 - Protection des renseignements", styles['SubsectionTitle']))
    story.append(Paragraph(
        "En droit familial, vous gerez des informations parmi les plus sensibles : "
        "revenus, patrimoine, garde d'enfants.",
        styles['BodyText2']
    ))
    bullets = [
        "Donnees hebergees 100 % au Canada (serveurs a Montreal)",
        "Consentement client documente et trace",
        "Chiffrement des donnees sensibles",
        "Politiques de conservation integrees",
    ]
    for b in bullets:
        story.append(Paragraph(f"&bull;  {b}", styles['BulletItem']))
    story.append(Spacer(1, 10))

    # Feature 6: AI
    story.append(Paragraph("Agents IA - Votre troisieme employe", styles['SubsectionTitle']))
    story.append(Paragraph(
        "&bull;  <b>Agent IA Finance</b> : verifie vos calculs de pension alimentaire, "
        "detecte les anomalies, genere des rapports financiers",
        styles['BulletItem']
    ))
    story.append(Paragraph(
        "&bull;  <b>Agent IA Assistant</b> : repond a vos questions sur la conformite, "
        "organise vos dossiers, prepare des resumes",
        styles['BulletItem']
    ))
    story.append(Paragraph(
        "&bull;  Entraines sur les regles du Barreau du Quebec - pas un chatbot generique",
        styles['BulletItem']
    ))
    story.append(Spacer(1, 12))


def build_pricing(story, styles):
    """Build the pricing section."""
    story.append(Paragraph("5. Plans et tarification", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFE_ACCENT, spaceAfter=10))

    story.append(Paragraph(
        "Chaque plan inclut un <b>essai gratuit de 14 jours</b>, sans carte de credit. "
        "Forfait annuel = <b>20 % de rabais</b>.",
        styles['BodyText2']
    ))
    story.append(Spacer(1, 12))

    # Plan Solo
    solo_data = [
        [Paragraph("<b>Plan Solo</b>", ParagraphStyle('ph', fontName='Helvetica-Bold', fontSize=12, textColor=SAFE_BLUE, alignment=TA_CENTER))],
        [Paragraph("99 $/mois<br/><font size=8>ou 79 $/mois en annuel</font>", ParagraphStyle('pp', fontName='Helvetica-Bold', fontSize=16, textColor=SAFE_ACCENT, alignment=TA_CENTER, leading=22))],
        [Paragraph(
            "&bull; 1 avocate + 1 assistant<br/>"
            "&bull; Dossiers illimites<br/>"
            "&bull; Facturation conforme B-1 r.5<br/>"
            "&bull; 1 compte fideicommis<br/>"
            "&bull; Agent Finance (50 req/mois)<br/>"
            "&bull; Support courriel (48h)",
            ParagraphStyle('pd', fontName='Helvetica', fontSize=9, leading=14, textColor=SAFE_DARK, alignment=TA_LEFT)
        )],
    ]
    solo_table = Table(solo_data, colWidths=[2.9 * inch])
    solo_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, SAFE_BORDER),
        ('BACKGROUND', (0, 0), (-1, 0), SAFE_LIGHT_GRAY),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))

    # Plan Cabinet (recommended)
    cab_data = [
        [Paragraph("<b>Plan Cabinet</b>  RECOMMANDE", ParagraphStyle('ph2', fontName='Helvetica-Bold', fontSize=12, textColor=white, alignment=TA_CENTER))],
        [Paragraph("249 $/mois<br/><font size=8>ou 199 $/mois en annuel</font>", ParagraphStyle('pp2', fontName='Helvetica-Bold', fontSize=16, textColor=SAFE_ACCENT, alignment=TA_CENTER, leading=22))],
        [Paragraph(
            "&bull; Jusqu'a 5 utilisateurs<br/>"
            "&bull; Dossiers illimites<br/>"
            "&bull; 3 comptes fideicommis<br/>"
            "&bull; Audit complet + alertes proactives<br/>"
            "&bull; Agent Finance (200) + Assistant (100)<br/>"
            "&bull; Relances automatiques<br/>"
            "&bull; Alertes echeanciers de cour<br/>"
            "&bull; Onboarding 1-on-1 (30 min)<br/>"
            "&bull; Support prioritaire (24h)",
            ParagraphStyle('pd2', fontName='Helvetica', fontSize=9, leading=14, textColor=SAFE_DARK, alignment=TA_LEFT)
        )],
    ]
    cab_table = Table(cab_data, colWidths=[3.3 * inch])
    cab_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 2, SAFE_ACCENT),
        ('BACKGROUND', (0, 0), (-1, 0), SAFE_ACCENT),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))

    # Side by side
    plans_row = Table([[solo_table, cab_table]], colWidths=[3.1 * inch, 3.5 * inch])
    plans_row.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(plans_row)
    story.append(Spacer(1, 14))

    # Recommendation box
    story.append(Paragraph("Notre recommandation", styles['SubsectionTitle']))
    story.append(make_highlight_box(
        "Le plan <b>Cabinet a 249 $/mois</b> est le meilleur choix pour votre situation. "
        "A 249 $/mois, vous etes bien dans votre budget de 400-500 $, "
        "avec de la marge pour d'autres outils si necessaire.",
        SAFE_LIGHT_GREEN, SAFE_GREEN, styles
    ))
    story.append(Spacer(1, 6))

    reasons = [
        "<b>Alertes de conformite proactives</b> - Vous n'avez pas le temps de verifier manuellement.",
        "<b>3 comptes fideicommis</b> - Separez pensions, provisions, et consignations.",
        "<b>Relances automatiques</b> - C'est exactement ce que vous avez demande.",
        "<b>Agent IA Assistant</b> - 100 requetes/mois pour organiser vos dossiers.",
        "<b>Alertes d'echeancier</b> - En matiere de garde, rater un delai = consequences graves.",
    ]
    for i, r in enumerate(reasons, 1):
        story.append(Paragraph(f"{i}. {r}", styles['BulletItem']))
    story.append(PageBreak())


def build_roi(story, styles):
    """Build the ROI analysis section."""
    story.append(Paragraph("6. Analyse du retour sur investissement (ROI)", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFE_ACCENT, spaceAfter=10))

    # Key metrics
    story.append(make_stat_cards([
        ("27:1", "ROI projete"),
        ("6 501 $", "Gain net / mois"),
        ("78 012 $", "Gain net / an"),
    ], styles))
    story.append(Spacer(1, 14))

    # Revenue recovery
    story.append(Paragraph("Revenus recuperes - Heures non facturees", styles['SubsectionTitle']))
    story.append(make_table(
        ["Scenario", "Heures/semaine", "Taux", "Gain mensuel"],
        [
            ["Conservateur", "2h", "225 $", "1 800 $"],
            ["Realiste", "3h", "225 $", "2 700 $"],
            ["Optimiste", "4h", "225 $", "3 600 $"],
        ],
        [1.8 * inch, 1.5 * inch, 1.2 * inch, 2.0 * inch],
        styles
    ))
    story.append(Spacer(1, 12))

    # Assistant time saved
    story.append(Paragraph("Temps d'assistant libere", styles['SubsectionTitle']))
    story.append(make_table(
        ["Tache automatisee", "Heures/mois actuelles", "Avec SAFE", "Economie"],
        [
            ["Creation de factures", "8h", "1h", "7h"],
            ["Relances de paiement", "6h", "0h (automatise)", "6h"],
            ["Suivi fideicommis", "5h", "1h", "4h"],
            ["Recherche dans les dossiers", "8h", "2h", "6h"],
            ["Preparation de rapports", "3h", "0.5h", "2.5h"],
            ["TOTAL", "30h", "4.5h", "25.5h"],
        ],
        [2.0 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch],
        styles
    ))
    story.append(Spacer(1, 6))
    story.append(make_highlight_box(
        "Economie sur l'assistant : 25.5h x 100 $/h = 2 550 $/mois",
        SAFE_LIGHT_GREEN, SAFE_GREEN, styles
    ))
    story.append(Spacer(1, 12))

    # Payment improvement
    story.append(Paragraph("Reduction des delais de paiement", styles['SubsectionTitle']))
    story.append(make_table(
        ["Metrique", "Aujourd'hui", "Avec SAFE"],
        [
            ["Delai moyen de paiement", "~45 jours", "~15 jours"],
            ["Taux de recouvrement", "~85 %", "~95 %"],
            ["Factures en souffrance > 90 jours", "~15 %", "< 3 %"],
        ],
        [2.5 * inch, 2.0 * inch, 2.0 * inch],
        styles
    ))
    story.append(Spacer(1, 12))

    # ROI summary
    story.append(Paragraph("Synthese ROI", styles['SubsectionTitle']))
    story.append(make_table(
        ["", "Mensuel", "Annuel"],
        [
            ["Investissement SAFE (Cabinet)", "249 $", "2 988 $"],
            ["Heures facturables recuperees", "+ 2 700 $", "+ 32 400 $"],
            ["Temps d'assistant libere", "+ 2 550 $", "+ 30 600 $"],
            ["Amelioration du recouvrement", "+ 1 500 $", "+ 18 000 $"],
            ["GAIN NET", "+ 6 501 $", "+ 78 012 $"],
        ],
        [2.8 * inch, 1.8 * inch, 1.9 * inch],
        styles
    ))
    story.append(Spacer(1, 8))
    story.append(make_highlight_box(
        "Meme dans le scenario le plus conservateur (heures recuperees seulement), le ROI est de 7:1.",
        SAFE_LIGHT_BLUE, SAFE_BLUE, styles
    ))
    story.append(PageBreak())


def build_risk_reduction(story, styles):
    """Build the risk reduction section."""
    story.append(Paragraph("7. Reduction des risques", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFE_ACCENT, spaceAfter=10))

    story.append(make_table(
        ["Risque", "Prob. actuelle", "Avec SAFE", "Consequence evitee"],
        [
            ["Erreur registre fideicommis", "Elevee", "Tres faible", "Sanctions du Barreau"],
            ["Facture non conforme B-1 r.5", "Moyenne", "Nulle", "Refus de paiement"],
            ["Non-conformite Loi 25", "Elevee", "Tres faible", "Amendes"],
            ["Perte de donnees client", "Moyenne", "Tres faible", "Resp. professionnelle"],
        ],
        [1.8 * inch, 1.2 * inch, 1.2 * inch, 2.3 * inch],
        styles
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Valeur de la tranquillite d'esprit", styles['SubsectionTitle']))
    story.append(Paragraph(
        "Vous avez dit que l'audit du Barreau vous stresse. Avec SAFE :",
        styles['BodyText2']
    ))
    bullets = [
        "Le rapport d'inspection est <b>toujours pret</b> - pas de preparation de derniere minute",
        "Chaque transaction fideicommis est <b>tracable et verifiable</b>",
        "Votre conformite est <b>prouvable</b>, pas presumee",
    ]
    for b in bullets:
        story.append(Paragraph(f"&bull;  {b}", styles['BulletItem']))
    story.append(Spacer(1, 16))


def build_onboarding(story, styles):
    """Build the onboarding section."""
    story.append(Paragraph("8. Processus d'integration", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFE_ACCENT, spaceAfter=10))

    story.append(make_highlight_box(
        "Vous etes operationnelle en 30 jours, sans perdre une seule journee facturable.",
        SAFE_LIGHT_BLUE, SAFE_BLUE, styles
    ))
    story.append(Spacer(1, 10))

    story.append(make_table(
        ["Etape", "Duree", "Ce qui se passe"],
        [
            ["Configuration", "Jour 1-3",
             "Configuration SAFE : taux (225 $/h, 100 $/h), taxes, modele droit familial, fideicommis"],
            ["Migration", "Jour 4-14",
             "Import de vos dossiers existants. Vous continuez de pratiquer normalement"],
            ["Formation", "Jour 15-20",
             "Formation pour vous et votre assistant - adaptee au droit familial"],
            ["Accompagnement", "Jour 21-30",
             "Support dedie pendant votre premier mois"],
        ],
        [1.5 * inch, 1.2 * inch, 3.8 * inch],
        styles
    ))
    story.append(Spacer(1, 16))


def build_guarantees(story, styles):
    """Build the guarantees section."""
    story.append(Paragraph("9. Garanties", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFE_ACCENT, spaceAfter=10))

    guarantees = [
        ("<b>Essai gratuit de 14 jours</b>", "Testez SAFE sans engagement, sans carte de credit"),
        ("<b>Satisfaite ou remboursee</b>", "30 jours pour changer d'avis, remboursement integral"),
        ("<b>Aucun engagement</b>", "Annulez en tout temps, en 2 clics"),
        ("<b>Vos donnees vous appartiennent</b>", "Exportables a tout moment en format standard"),
    ]

    g_data = []
    for title, desc in guarantees:
        g_data.append([
            Paragraph(title, styles['TableCell']),
            Paragraph(desc, styles['TableCell']),
        ])

    g_table = Table(g_data, colWidths=[2.5 * inch, 4.0 * inch])
    g_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, SAFE_BORDER),
        ('BACKGROUND', (0, 0), (0, -1), SAFE_LIGHT_GREEN),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(g_table)
    story.append(Spacer(1, 16))


def build_next_steps(story, styles):
    """Build the next steps + closing section."""
    story.append(Paragraph("10. Prochaines etapes", styles['SectionTitle']))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFE_ACCENT, spaceAfter=10))

    steps = [
        ("<b>Demarrer votre essai gratuit</b> - 14 jours, sans carte de credit, sur safecabinet.ca",),
        ("<b>Session de configuration</b> - Je configure personnellement votre cabinet dans SAFE "
         "en fonction de votre pratique en droit familial",),
        ("<b>Formation</b> - 30 minutes pour vous et votre assistant, adaptee a vos dossiers reels",),
    ]
    for i, (s,) in enumerate(steps, 1):
        story.append(Paragraph(f"<b>{i}.</b>  {s}", styles['BulletItem']))
    story.append(Spacer(1, 20))

    story.append(Paragraph(
        "Je reste disponible pour toute question. N'hesitez pas a me contacter directement.",
        styles['BodyText2']
    ))
    story.append(Spacer(1, 30))

    # Signature block
    sig_data = [
        [Paragraph("<b>Jeremie Tiahou</b>", styles['BodyBold'])],
        [Paragraph("Fondateur, SAFE", styles['BodyText2'])],
        [Paragraph("safecabinet.ca", styles['BodyText2'])],
        [Paragraph("bonjour@safe.quebec", styles['BodyText2'])],
    ]
    sig_table = Table(sig_data, colWidths=[3 * inch])
    sig_table.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(sig_table)


def main():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=letter,
        topMargin=0.75 * inch,
        bottomMargin=0.85 * inch,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        title="Proposition SAFE - Me Sarah Marchand",
        author="Jeremie Tiahou - SAFE",
        subject="Proposition de services SAFE pour Cabinet Droit Familial Solutions Inc.",
    )

    styles = create_styles()
    story = []

    build_cover(story, styles)
    build_executive_summary(story, styles)
    build_client_profile(story, styles)
    build_needs_analysis(story, styles)
    build_solution(story, styles)
    build_pricing(story, styles)
    build_roi(story, styles)
    build_risk_reduction(story, styles)
    build_onboarding(story, styles)
    build_guarantees(story, styles)
    build_next_steps(story, styles)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generated: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
