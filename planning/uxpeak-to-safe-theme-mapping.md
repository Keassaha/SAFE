# UXPeak → SAFE — Mapping de theme

> Comment adapter le design UXPeak (purple/dark) au site SAFE (green/dark)

---

## 1. MAPPING DES COULEURS

### Purple → Green (remplacement direct)

| UXPeak (Purple) | SAFE (Green) | Usage |
|-----------------|-------------|-------|
| `--p: #8B5CF6` | `--p: #5A8F7B` (green-700) | Couleur primaire signature |
| `--pl: #A78BFA` | `--pl: #7DAA98` (green-600) | Hover, accents legers |
| `--pd: #7C3AED` | `--pd: #3D6B5A` (green-800) | CTA pressed, dark accent |
| `--pp: #C4B5FD` | `--pp: #8EB69B` (safe-sage) | Centres lumineux, pale |
| `--pink: #EC4899` | `--accent: #D4A574` (warm gold) | Accent secondaire |
| `--cyan: #22D3EE` | `--cyan: #22D3EE` (garder) | Accent tertiaire (rare) |

### Glows (remplacer rgb purple par rgb green)

| UXPeak | SAFE |
|--------|------|
| `rgba(139,92,246, 0.15)` | `rgba(90,143,123, 0.15)` |
| `rgba(139,92,246, 0.3)` | `rgba(90,143,123, 0.3)` |
| `rgba(139,92,246, 0.06)` | `rgba(90,143,123, 0.06)` |
| `rgba(167,139,250, 0.X)` | `rgba(125,170,152, 0.X)` |
| `rgba(196,181,253, 0.X)` | `rgba(142,182,155, 0.X)` |

### Texte (garder identique — fonctionne sur fond noir)

| Variable | UXPeak | SAFE | Note |
|----------|--------|------|------|
| `--t1` | `#f2f2f7` | `#f2f2f7` | Garder — blanc chaud |
| `--t2` | `#8a8797` | `#8a9790` | Legere teinte verte |
| `--t-sub` | `#858094` | `#85948e` | Legere teinte verte |
| `--t3` | `#575468` | `#576860` | Legere teinte verte |
| `--t-muted` | `#686478` | `#687870` | Legere teinte verte |
| `--t-bright` | `#b8b3c0` | `#b3c0b8` | Legere teinte verte |

### Backgrounds (garder quasi identique)

| Variable | UXPeak | SAFE | Note |
|----------|--------|------|------|
| `--bg` | `#050508` | `#050807` | Micro-teinte verte au lieu de bleue |
| Card bg haut | `rgba(22,19,32,0.55)` | `rgba(19,28,22,0.55)` | Teinte verte |
| Card bg bas | `rgba(14,12,22,0.3)` | `rgba(12,18,14,0.3)` | Teinte verte |

### Bordures (remplacer lavande par sage)

| UXPeak | SAFE |
|--------|------|
| `rgba(180,165,210, 0.09)` | `rgba(142,182,155, 0.09)` |
| `rgba(180,165,210, 0.14)` | `rgba(142,182,155, 0.14)` |
| `rgba(180,165,210, 0.18)` | `rgba(142,182,155, 0.18)` |

---

## 2. CSS VARIABLES SAFE — PRET A COPIER

```css
:root {
  /* === COULEURS PRIMAIRES (vert SAFE) === */
  --p: #5A8F7B;              /* Primary green */
  --pl: #7DAA98;             /* Primary light */
  --pd: #3D6B5A;             /* Primary dark */
  --pp: #8EB69B;             /* Primary pale */
  --accent: #D4A574;         /* Accent warm gold */

  /* === GLOWS === */
  --glow: rgba(90,143,123, 0.15);
  --glowS: rgba(90,143,123, 0.3);

  /* === BACKGROUND === */
  --bg: #050807;

  /* === TEXTE === */
  --t1: #f2f2f7;
  --t2: #8a9790;
  --t-sub: #85948e;
  --t3: #576860;
  --t-muted: #687870;
  --t-bright: #b3c0b8;

  /* === CARTES === */
  --card-bg: linear-gradient(180deg, rgba(19,28,22,0.55), rgba(12,18,14,0.3));
  --card-border: rgba(142,182,155, 0.09);
  --card-highlight: inset 0 1px 0 rgba(255,255,255, 0.04);

  /* === BORDURE === */
  --b: rgba(255,255,255, 0.06);

  /* === RADIUS (identique) === */
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;

  /* === TYPO (identique) === */
  --fs-caption: 12px;
  --fs-sm: 14px;
  --fs-body: 15px;
  --fs-md: 16px;
  --fs-lg: 18px;
  --fs-h3: 22px;
  --fs-stat: 48px;
  --fs-h2: clamp(34px, 4.2vw, 52px);
  --fs-h1: clamp(48px, 6.5vw, 78px);

  /* === EASING (identique) === */
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-bounce: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

---

## 3. EXEMPLES DE CONVERSION PAR COMPOSANT

### Nav bar
```css
/* UXPeak */
background: rgba(12, 12, 20, 0.55);
border: 1px solid rgba(180, 165, 210, 0.14);

/* SAFE */
background: rgba(12, 18, 14, 0.55);      /* teinte verte */
border: 1px solid rgba(142, 182, 155, 0.14);
```

### Bouton CTA
```css
/* UXPeak */
background: #8B5CF6;
box-shadow: 0 0 40px rgba(139, 92, 246, 0.25);

/* SAFE */
background: #5A8F7B;
box-shadow: 0 0 40px rgba(90, 143, 123, 0.25);
```

### Hover bouton
```css
/* UXPeak */
box-shadow: 0 0 50px rgba(139,92,246,0.4), 0 0 100px rgba(139,92,246,0.2);

/* SAFE */
box-shadow: 0 0 50px rgba(90,143,123,0.4), 0 0 100px rgba(90,143,123,0.2);
```

### Card hover
```css
/* UXPeak */
border-color: rgba(139, 92, 246, 0.3);
box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 20px rgba(139,92,246,0.15);

/* SAFE */
border-color: rgba(90, 143, 123, 0.3);
box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 20px rgba(90,143,123,0.15);
```

### Video play button
```css
/* UXPeak */
background: radial-gradient(circle at 50% 30%, #C4B5FD, #8B5CF6 60%);
box-shadow: rgba(139,92,246,0.35) 0 8px 40px, rgba(167,139,250,0.2) 0 0 80px;

/* SAFE */
background: radial-gradient(circle at 50% 30%, #8EB69B, #5A8F7B 60%);
box-shadow: rgba(90,143,123,0.35) 0 8px 40px, rgba(125,170,152,0.2) 0 0 80px;
```

### Border spin (conic gradient)
```css
/* UXPeak */
background: conic-gradient(from 180deg, transparent 30%, rgba(139,92,246,0.4) 55%, rgba(167,139,250,0.25) 65%, transparent 80%);

/* SAFE */
background: conic-gradient(from 180deg, transparent 30%, rgba(90,143,123,0.4) 55%, rgba(125,170,152,0.25) 65%, transparent 80%);
```

### Timeline gradient (4 phases)
```css
/* UXPeak: Purple → Pink → Orange → Amber */
background: linear-gradient(#8B5CF6 0%, #EC4899 40%, #f97316 75%, #fbbf24 100%);

/* SAFE: Deep green → Sage → Gold → Warm amber */
background: linear-gradient(#3D6B5A 0%, #5A8F7B 35%, #8EB69B 65%, #D4A574 100%);
```

### Phase colors (timeline)
```css
/* UXPeak */
Phase 1: rgb(139, 92, 246)  /* Purple */
Phase 2: rgb(236, 72, 153)  /* Pink */
Phase 3: rgb(249, 115, 22)  /* Orange */
Phase 4: rgb(251, 191, 36)  /* Amber */

/* SAFE */
Phase 1: rgb(61, 107, 90)   /* Deep green #3D6B5A */
Phase 2: rgb(90, 143, 123)  /* Green #5A8F7B */
Phase 3: rgb(142, 182, 155) /* Sage #8EB69B */
Phase 4: rgb(212, 165, 116) /* Gold #D4A574 */
```

### Section glow (fond entre sections)
```css
/* UXPeak */
background: radial-gradient(ellipse, rgba(139,92,246,0.08), transparent 70%);

/* SAFE */
background: radial-gradient(ellipse, rgba(90,143,123,0.08), transparent 70%);
```

### Stars background
```css
/* Garder identique — les etoiles blanches marchent sur n'importe quel dark theme */
/* Optionnel: teinter les plus grosses etoiles en vert pale */
```

---

## 4. REGLE SIMPLE DE CONVERSION

Pour convertir n'importe quel element UXPeak → SAFE:

```
Chercher/Remplacer dans les rgba():

  139, 92, 246  →  90, 143, 123    (--p primary)
  167, 139, 250 →  125, 170, 152   (--pl primary light)
  196, 181, 253 →  142, 182, 155   (--pp primary pale)
  180, 165, 210 →  142, 182, 155   (bordures)

Chercher/Remplacer dans les hex:

  #8B5CF6 → #5A8F7B
  #A78BFA → #7DAA98
  #7C3AED → #3D6B5A
  #C4B5FD → #8EB69B
  #EC4899 → #D4A574   (accent secondaire)
```

---

## 5. CE QUI NE CHANGE PAS

- Toutes les **animations/keyframes** (timing, easing, transforms)
- Les **radius** (12/16/20/24/100px)
- La **typographie** (Inter Variable, meme echelle)
- Les **opacites** (0.04, 0.06, 0.09, 0.14, etc.)
- Le **pattern de section** (label → titre → contenu)
- L'**easing** cubic-bezier(0.22, 1, 0.36, 1)
- Les **hover transforms** (translateY, scale)
- Le **fond d'etoiles** (canvas blanc)
