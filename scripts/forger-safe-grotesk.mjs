/**
 * Forge la fonte de SAFE à partir de Geist.
 *
 * ── Ce que ce script fait, et ce qu'il ne fait pas ───────────────────────────
 * Il FORK une fonte à licence ouverte, la resserre, et la renomme. Il ne dessine
 * aucune lettre. Les formes restent celles de Geist : ce sont son « a », son
 * « g », ses terminaisons. Ce qui devient à SAFE, c'est le fichier, son nom, et
 * son rythme horizontal.
 *
 * Appeler ça « notre fonte » est vrai au sens de la propriété et de la marque.
 * Ce serait faux au sens du dessin. Redessiner les ouvertures et les
 * terminaisons pour approcher un néo-grotesque est un travail de créateur de
 * caractères, qui se compte en semaines et se commande.
 *
 * ── Pourquoi Geist et pas les fichiers de Cursor ─────────────────────────────
 * CursorGothic est la fonte de marque de Cursor, sans licence publique. La
 * poser sur safecabinet.ca serait publier l'actif d'une autre entreprise.
 * Geist est sous SIL OFL 1.1, SANS nom réservé : la licence autorise
 * explicitement de modifier, de renommer et de redistribuer.
 *
 * Copyright (c) 2023 Vercel, in collaboration with basement.studio.
 * La licence d'origine part avec la fonte, c'est l'obligation de l'OFL.
 *
 * ── Le resserrement ──────────────────────────────────────────────────────────
 * La différence la plus visible entre Geist et un néo-grotesque n'est pas le
 * dessin, c'est l'espace. On enlève donc RESSERRE unités d'em de chaque côté de
 * chaque glyphe : la chasse baisse de deux fois cette valeur et le contour se
 * décale d'autant, pour que la lettre reste centrée dans sa nouvelle chasse.
 *
 * Conséquence à connaître : le resserrement vit désormais DANS la fonte. Le
 * `letter-spacing` du site doit baisser d'autant, sinon les deux s'additionnent.
 *
 *   node scripts/forger-safe-grotesk.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SOURCE = "node_modules/geist/dist/fonts/geist-sans";
const SORTIE = "public/fonts/safe-grotesk";
const NOM = "SAFE Grotesk";
/** Unités d'em retirées de chaque côté. 1000 unités = 1 em. */
const RESSERRE = 9;
/**
 * Allongement des descendantes, en proportion.
 *
 * Mesure du 2026-08-26 : Geist descend a 150 millièmes d'em, CursorGothic a
 * 179, soit près de 20 % de plus. C'est le SEUL écart franc entre les deux
 * dessins ; le reste tient dans un ou deux pour cent de chasse.
 *
 * Allonger une descendante est une transformation géométrique : on étire ce
 * qui est SOUS la ligne de base, et rien au-dessus. La hauteur d'oeil, les
 * capitales et les chasses ne bougent pas. C'est la limite de ce qu'on peut
 * faire sans redessiner.
 */
const CIBLES = {
  /* Millièmes d'em, mesurés sur le rendu. Ils sont au-dessus de CursorGothic
     (714, 535, 179) : la fonte de SAFE est un cheveu plus généreuse, ce qui la
     rend un peu plus lisible aux petits corps et la distingue de la leur. */
  capitale: 718,
  oeil: 540,
  jambage: 185,
};
/* Mesurés sur Geist avant toute retouche. Ils servent de dénominateur. */
const GEIST = { capitale: 710, oeil: 530, jambage: 150 };

const COUPES = [
  ["Geist-Regular.ttf", "SAFEGrotesk-Regular", "Regular", 400],
  ["Geist-Medium.ttf", "SAFEGrotesk-Medium", "Medium", 500],
  ["Geist-SemiBold.ttf", "SAFEGrotesk-SemiBold", "SemiBold", 600],
];

const PY = `
import sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.misc.transform import Transform

src, dst, famille, style, poids, resserre, s_cap, s_bdc, s_desc = sys.argv[1:10]
poids = int(poids); resserre = int(resserre)
s_cap = float(s_cap); s_bdc = float(s_bdc); s_desc = float(s_desc)
f = TTFont(src)
gs = f.getGlyphSet()
glyf, hmtx = f["glyf"], f["hmtx"]
upem = f["head"].unitsPerEm
r = round(resserre * upem / 1000)

# ── Les trois hauteurs ─────────────────────────────────────────────────────
# Trois cibles independantes, donc trois facteurs : les capitales, l'oeil du
# bas-de-casse, et le jambage descendant. On ne peut pas les atteindre par une
# seule mise a l'echelle verticale, qui conserverait leurs rapports.
#
# Au-dessus de la ligne de base, chaque glyphe est etire selon SA classe. En
# dessous, l'etirement est PROGRESSIF, nul a la ligne de base et maximal tout
# en bas : applique d'un coup, il laisserait un coude la ou une courbe traverse
# la ligne de base, et le « g » y gagnerait un angle.
from fontTools.pens.basePen import BasePen
import unicodedata

class Redresse(BasePen):
    def __init__(self, glyphSet, out, ymin, s_haut, s_bas):
        BasePen.__init__(self, glyphSet)
        self.out = out; self.ymin = ymin; self.sh = s_haut; self.sb = s_bas
    def _pt(self, p):
        x, y = p
        if y >= 0:
            return (x, y * self.sh)
        if self.ymin >= 0:
            return (x, y)
        t = min(1.0, y / self.ymin)
        return (x, y * (1 + (self.sb - 1) * t))
    def _moveTo(self, p): self.out.moveTo(self._pt(p))
    def _lineTo(self, p): self.out.lineTo(self._pt(p))
    def _curveToOne(self, p1, p2, p3): self.out.curveTo(self._pt(p1), self._pt(p2), self._pt(p3))
    def _qCurveToOne(self, p1, p2): self.out.qCurveTo(self._pt(p1), self._pt(p2))
    def _closePath(self): self.out.closePath()
    def _endPath(self): self.out.endPath()

# Classement par la table des caracteres. Un glyphe hors table suit les
# capitales : c'est le cas des variantes et des signes, qui s'alignent sur
# elles. Les lettres a descendante sont les seules a etre etirees vers le bas.
cmap = f.getBestCmap()
classe = {}
descendeuses = set()
for cp, nom in sorted(cmap.items()):
    ch = chr(cp)
    if nom in classe:
        continue
    cat = unicodedata.category(ch)
    classe[nom] = "bdc" if cat == "Ll" else "cap"
    d = unicodedata.normalize("NFD", ch)
    if d and d[0].lower() in set("gpqyj"):
        descendeuses.add(nom)

hauts = 0; allonges = 0
for nom in f.getGlyphOrder():
    g = glyf[nom]
    if g.numberOfContours <= 0:
        continue
    g.recalcBounds(glyf)
    s_haut = s_bdc if classe.get(nom) == "bdc" else s_cap
    s_bas = s_desc if nom in descendeuses else 1.0
    if s_haut == 1.0 and s_bas == 1.0:
        continue
    rec = RecordingPen()
    gs[nom].draw(rec)
    pen = TTGlyphPen(gs)
    rec.replay(Redresse(gs, pen, g.yMin, s_haut, s_bas))
    glyf[nom] = pen.glyph()
    hauts += 1
    if s_bas != 1.0:
        allonges += 1

# Les composites portent leurs accents par un DECALAGE, qui n'a pas ete touche
# par les pens : sans cette reprise, un « E » monte de huit unites et garde son
# accent a l'ancienne hauteur, donc collé.
for nom in f.getGlyphOrder():
    g = glyf[nom]
    if g.numberOfContours != -1:
        continue
    s_haut = s_bdc if classe.get(nom) == "bdc" else s_cap
    for c in g.components:
        if hasattr(c, "y") and c.y:
            c.y = round(c.y * s_haut)

# Les metriques verticales suivent, sinon la ligne de texte rogne les queues.
for nom in f.getGlyphOrder():
    if glyf[nom].numberOfContours != 0:
        glyf[nom].recalcBounds(glyf)
bas = min((glyf[n].yMin for n in f.getGlyphOrder()
           if glyf[n].numberOfContours != 0), default=0)
haut = max((glyf[n].yMax for n in f.getGlyphOrder()
            if glyf[n].numberOfContours != 0), default=0)
os2, hhea = f["OS/2"], f["hhea"]
os2.sTypoDescender = min(os2.sTypoDescender, bas)
os2.usWinDescent = max(os2.usWinDescent, -bas)
os2.usWinAscent = max(os2.usWinAscent, haut)
hhea.descent = min(hhea.descent, bas)
hhea.ascent = max(hhea.ascent, haut)
if hasattr(os2, "sCapHeight"):
    os2.sCapHeight = round(os2.sCapHeight * s_cap)
if hasattr(os2, "sxHeight"):
    os2.sxHeight = round(os2.sxHeight * s_bdc)

# ── Le resserrement ────────────────────────────────────────────────────────
# On ne touche ni l'espace ni les glyphes sans contour : retirer de la chasse
# d'une espace la ferait disparaitre, et decaler un glyphe vide n'a pas de sens.
touches = 0
for nom in f.getGlyphOrder():
    aw, lsb = hmtx.metrics[nom]
    if aw <= 2 * r + 1:
        continue
    g = glyf[nom]
    if g.numberOfContours == 0:
        # Glyphe vide, comme l'espace : on resserre la chasse, sans contour a
        # deplacer. On y va de moitie, une espace trop courte colle les mots.
        hmtx.metrics[nom] = (aw - r, lsb)
        touches += 1
        continue
    rec = RecordingPen()
    gs[nom].draw(rec)
    pen = TTGlyphPen(gs)
    rec.replay(TransformPen(pen, Transform().translate(-r, 0)))
    glyf[nom] = pen.glyph()
    hmtx.metrics[nom] = (aw - 2 * r, lsb - r)
    touches += 1

# ── L'identite ─────────────────────────────────────────────────────────────
plein = famille if style == "Regular" else f"{famille} {style}"
ps = dst
copyright = (
    "Copyright (c) 2026 SAFE Inc. "
    "Forge a partir de Geist, Copyright (c) 2023 Vercel, in collaboration with "
    "basement.studio, sous SIL Open Font License 1.1."
)
noms = {
    0: copyright,
    1: famille if style in ("Regular", "Bold", "Italic") else plein,
    2: style if style in ("Regular", "Bold", "Italic") else "Regular",
    3: f"SAFE Inc.: {plein}: 2026",
    4: plein,
    5: "Version 1.000",
    6: ps,
    16: famille,
    17: style,
}
name = f["name"]
name.names = [n for n in name.names if n.nameID not in (0,1,2,3,4,5,6,16,17,18,20,21,22)]
for nid, val in noms.items():
    name.setName(val, nid, 3, 1, 0x409)
    name.setName(val, nid, 1, 0, 0)

f["OS/2"].usWeightClass = poids
f["OS/2"].achVendID = "SAFE"
f.save(dst + ".ttf")

# WOFF : compression zlib, presente dans Python. Le WOFF2 demanderait brotli,
# qui n'est pas installe et qui serait une dependance de plus.
f.flavor = "woff"
f.save(dst + ".woff")
print(json.dumps({"glyphes": touches, "hauts": hauts, "allonges": allonges, "upem": upem, "resserre": r, "bas": bas}))
`;

fs.mkdirSync(SORTIE, { recursive: true });
fs.writeFileSync("/tmp/forger.py", PY);

const rapport = [];
for (const [fichier, base, style, poids] of COUPES) {
  const src = path.join(SOURCE, fichier);
  if (!fs.existsSync(src)) {
    console.error(`Source absente : ${src}`);
    process.exit(1);
  }
  const dst = path.join(SORTIE, base);
  const out = execFileSync("python3", [
    "/tmp/forger.py", src, dst, NOM, style, String(poids), String(RESSERRE),
    String(CIBLES.capitale / GEIST.capitale),
    String(CIBLES.oeil / GEIST.oeil),
    String(CIBLES.jambage / GEIST.jambage),
  ]);
  rapport.push({ style, ...JSON.parse(out.toString()) });
}

/* L'OFL part avec la fonte. C'est une obligation de la licence, pas une
   politesse : redistribuer une modification sans la licence d'origine la rend
   illicite. */
fs.copyFileSync("node_modules/geist/LICENSE.txt", path.join(SORTIE, "OFL.txt"));
fs.writeFileSync(
  path.join(SORTIE, "LISEZ-MOI.md"),
  `# ${NOM}\n\n` +
    `Fonte de SAFE Inc., forgee a partir de Geist (Vercel, basement.studio),\n` +
    `sous SIL Open Font License 1.1, sans nom reserve.\n\n` +
    `Les FORMES sont celles de Geist. Ce qui est propre a SAFE : le nom, le\n` +
    `fichier, et le resserrement de ${RESSERRE} unites d'em par cote.\n\n` +
    `Regeneration : \`node scripts/forger-safe-grotesk.mjs\`\n\n` +
    `Le resserrement vit dans la fonte. Le \`letter-spacing\` des feuilles doit\n` +
    `en tenir compte, sinon les deux s'additionnent.\n`,
);

console.log(`${NOM} forgee dans ${SORTIE}/`);
for (const r of rapport) {
  const f = path.join(SORTIE, `SAFEGrotesk-${r.style}.woff`);
  const ko = Math.round(fs.statSync(f).size / 1024);
  console.log(
    `  ${r.style.padEnd(9)} ${r.hauts} glyphes redresses, ${r.allonges} descendantes, ` +
      `${r.glyphes} resserres de ${r.resserre}/${r.upem} em  ·  ${ko} ko`,
  );
}
