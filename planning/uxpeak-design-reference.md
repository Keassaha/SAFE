# UXPeak Design Reference — Animations, Cards & Icons

> Reference extraite de uxpeak.com pour appliquer au site SAFE Inc.
> Mise a jour avec valeurs EXACTES extraites du DOM live via Chrome DevTools.

---

## 0. VARIABLES CSS GLOBALES (valeurs exactes du site)

```css
:root {
  --p: #8B5CF6;                          /* Primary purple */
  --pl: #A78BFA;                         /* Primary light */
  --pd: #7C3AED;                         /* Primary dark */
  --pp: #C4B5FD;                         /* Primary pale (play button center) */
  --t1: #f2f2f7;                         /* Text primary (near-white) */
  --t2: rgba(255, 255, 255, 0.7);       /* Text secondary */
  --b: rgba(255, 255, 255, 0.06);       /* Border subtle */
  --bg: #07070d;                         /* Background base */
}
```

---

## 00. TOUS LES KEYFRAMES EXTRAITS (valeurs exactes)

```css
/* === VIDEO SECTION === */
@keyframes vfloat {
  0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
  50%      { transform: translate(-50%, -50%) translateY(-6px); }
}

@keyframes vpulse {
  0%   { transform: scale(0.85); opacity: 0.6; }
  100% { transform: scale(1.15); opacity: 0; }
}

@keyframes vshimmer {
  0%, 100% { transform: translateX(0px); }
  50%      { transform: translateX(350%); }
}

@keyframes vglow {
  0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
  50%      { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
}

/* === BORDERS === */
@keyframes borderSpin {
  100% { transform: rotate(360deg); }
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

@keyframes pzBorderSpin {
  /* pricing border spin - same pattern */
  100% { transform: rotate(360deg); }
}

/* === HERO / BANNER === */
@keyframes comet-fly {
  0%   { opacity: 0; transform: translate(0px, 0px) rotate(-20deg); }
  2%   { opacity: 1; }
  18%  { opacity: 1; }
  23%  { opacity: 0; transform: translate(1500px, -500px) rotate(-20deg); }
  100% { opacity: 0; transform: translate(1500px, -500px) rotate(-20deg); }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50%      { opacity: 1; transform: scale(1.3); }
}

@keyframes banner-shoot {
  0%   { opacity: 0; transform: translate(0px, 0px) rotate(-15deg); }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { opacity: 0; transform: translate(1400px, -400px) rotate(-15deg); }
}

@keyframes hero-glow-pulse {
  0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
  50%      { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
}

/* === CTA / BADGES === */
@keyframes cta-ring-pulse {
  0%   { inset: 0px; opacity: 0.8; }
  100% { inset: -16px; opacity: 0; }
}

@keyframes badge-pulse {
  0%, 100% { box-shadow: rgba(139,92,246,0.4) 0 0 20px, rgba(139,92,246,0) 0 0 0; }
  50%      { box-shadow: rgba(139,92,246,0.6) 0 0 28px, rgba(139,92,246,0.25) 0 0 50px; }
}

@keyframes badge-dot-pulse {
  0%   { box-shadow: rgba(167,139,250,0.5) 0 0 0 0; }
  70%  { box-shadow: rgba(167,139,250,0) 0 0 0 8px; }
  100% { box-shadow: rgba(167,139,250,0) 0 0 0 0; }
}

@keyframes livePulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 4px var(--p); }
  50%      { opacity: 0.4; box-shadow: 0 0 12px var(--p); }
}

/* === SHIELD / RISK-FREE === */
@keyframes shield-float {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-4px); }
}

/* === JOURNEY / TIMELINE === */
@keyframes jdotRing {
  0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
}

/* === CERTIFICATE === */
@keyframes certFloat {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-10px); }
}

@keyframes certShine {
  0%        { transform: translateX(-10%) rotate(12deg); }
  30%, 100% { transform: translateX(240%) rotate(12deg); }
}

@keyframes cstar {
  0%, 100% { opacity: 0.05; transform: scale(1); }
  50%      { opacity: 0.4; transform: scale(2.5); }
}

/* === FLOATING UI ELEMENTS === */
@keyframes ui-fade-in { to { opacity: 1; } }

@keyframes ui-float-a {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
  50%      { transform: translateY(-14px) translateX(10px) rotate(2deg); }
}

@keyframes ui-float-b {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
  50%      { transform: translateY(-12px) translateX(-12px) rotate(-1.5deg); }
}

@keyframes ui-float-c {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
  50%      { transform: translateY(14px) translateX(-10px) rotate(1deg); }
}

@keyframes ui-float-d {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
  50%      { transform: translateY(-10px) translateX(12px) rotate(-2deg); }
}

@keyframes ui-cursor-move {
  0%, 100% { transform: translateY(0) translateX(0); }
  50%      { transform: translateY(-20px) translateX(18px); }
}

/* === COSMIC / DECORATIF === */
@keyframes cosmicDrift {
  0%, 100% { transform: translate(0px, 0px); }
  33%      { transform: translate(30px, -20px); }
  66%      { transform: translate(-20px, 25px); }
}

@keyframes starTwinkle {
  0%, 100% { opacity: 0.15; transform: scale(0.8); }
  50%      { opacity: 1; transform: scale(1.1); }
}

@keyframes starDrift {
  0%   { transform: translateY(0px); }
  100% { transform: translateY(-30px); }
}
```

---

## 0B. SECTION VIDEO — DETAIL EXACT DES HOVER (extrait du DOM live)

### Etat NORMAL (sans hover)
```css
.video-outer {
  position: relative;
  border-radius: 20px;
  padding: 1.5px;
  background: linear-gradient(160deg,
    rgba(255,255,255,0.12),
    rgba(255,255,255,0.02) 40%,
    rgba(139,92,246,0.12) 80%,
    rgba(255,255,255,0.06)
  );
  transition: 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: visible;
  outline: 1px solid rgba(255,255,255,0.06);
  outline-offset: 5px;
  box-shadow: none;
}

/* Bordure tournante — invisible au repos */
.video-outer::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: conic-gradient(from 180deg,
    transparent 30%,
    rgba(139,92,246,0.4) 55%,
    rgba(167,139,250,0.25) 65%,
    transparent 80%
  );
  animation: borderSpin 8s linear infinite;
  opacity: 0.4;              /* <-- au repos */
  z-index: -1;
}

/* Play button flottant */
.video-play {
  width: 92px;
  height: 92px;
  animation: vfloat 5s ease-in-out infinite;   /* flotte doucement */
  transform: translate(-50%, -50%);
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 3;
}

/* Le vrai bouton rond a l'interieur */
.video-play-btn {
  width: 72px;     /* cercle interieur */
  height: 72px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 30%, var(--pp), var(--p) 60%);
  /* = radial-gradient(circle at 50% 30%, #C4B5FD, #8B5CF6 60%) */
  border: 1px solid rgba(167,139,250,0.4);
  box-shadow:
    rgba(139,92,246,0.35) 0px 8px 40px,
    rgba(167,139,250,0.2) 0px 0px 80px;
  backdrop-filter: blur(2px);
  transition: 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Glow derriere le play button */
.video-glow {
  width: 160px;
  height: 160px;
  background: radial-gradient(circle, rgba(139,92,246,0.35), transparent 65%);
  opacity: 0.7;
  filter: blur(20px);
  animation: vglow 4s ease-in-out infinite;
  /* vglow: scale(1) → scale(1.15) en boucle */
}

/* Anneaux pulsants */
.video-play-ring {
  /* 3 rings avec vpulse: scale(0.85) opacity 0.6 → scale(1.15) opacity 0 */
  animation: vpulse 3.5s ease-out infinite;
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: 50%;
}
/* Delays: ring-1: 0s, ring-2: 0.8s, ring-3: 1.6s */

/* Image video */
.video-frame img {
  border-radius: 20px;
  transition: 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  transform: scale(1);
  filter: brightness(1) saturate(1);
}

/* Overlay sombre sur l'image */
.video-overlay {
  background: linear-gradient(
    rgba(5,5,8,0) 0%,
    rgba(5,5,8,0.12) 35%,
    rgba(5,5,8,0.45) 100%
  );
  transition: 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Coins decoratifs */
.video-corner {
  opacity: 0.12;
  transition: 0.4s ease;
}

/* Label "WATCH PREVIEW" */
.video-label {
  color: rgba(255,255,255,0.45);
  letter-spacing: 1.5px;
  transition: 0.4s ease;
}
```

### Etat HOVER (curseur sur la video) — CHANGEMENTS EXACTS
```css
/* Container: monte de 6px + triple box-shadow purple + outline s'eclaircit */
.video-outer:hover {
  transform: translateY(-6px);
  box-shadow:
    rgba(139,92,246,0.16) 0px 30px 100px,   /* ombre profonde purple */
    rgba(139,92,246,0.15) 0px 0px 0px 1px,   /* ring purple 1px */
    rgba(139,92,246,0.06) 0px 0px 200px;      /* halo tres large */
  outline-color: rgba(255,255,255,0.1);       /* outline plus visible */
}

/* Bordure tournante: opacite 0.4 → 0.8 */
.video-outer:hover::before {
  opacity: 0.8;
}

/* Image: zoom 1.04x + brighter + more saturated */
.video-outer:hover .video-frame img {
  transform: scale(1.04);
  filter: brightness(1.15) saturate(1.1);
}

/* Overlay: s'eclaircit (moins sombre) */
.video-outer:hover .video-overlay {
  background: linear-gradient(
    rgba(5,5,8,0) 0%,
    rgba(5,5,8,0.06) 35%,     /* etait 0.12 → 0.06 */
    rgba(5,5,8,0.32) 100%     /* etait 0.45 → 0.32 */
  );
}

/* Coins: plus visibles */
.video-outer:hover .video-corner {
  opacity: 0.35;               /* etait 0.12 → 0.35 */
}

/* Play: ARRETE de flotter + scale up 1.08 */
.video-outer:hover .video-play {
  animation: none;             /* arrete vfloat */
  transform: translate(-50%, -50%) scale(1.08);
}

/* Bouton play: gradient change + bordure + ombre INTENSE */
.video-outer:hover .video-play-btn {
  background: radial-gradient(circle at 50% 30%,
    var(--pp),     /* #C4B5FD — centre encore plus clair */
    var(--pl) 60%, /* #A78BFA — milieu plus clair */
    var(--p)       /* #8B5CF6 — bord */
  );
  border-color: rgba(196,181,253,0.7);  /* etait 0.4 → 0.7 */
  box-shadow:
    rgba(139,92,246,0.6) 0px 14px 64px,        /* ombre profonde INTENSE */
    rgba(167,139,250,0.3) 0px 0px 120px,        /* halo tres large */
    rgba(255,255,255,0.4) 0px 1px 0px inset,    /* highlight interne haut */
    rgba(0,0,0,0.15) 0px -2px 4px inset;        /* ombre interne bas */
}

/* Icone play SVG: scale up */
.video-outer:hover .video-play-btn svg {
  transform: scale(1.12);
}

/* Glow: arrete d'animer + scale up 1.3 + full opacity */
.video-outer:hover .video-glow {
  opacity: 1;                  /* etait 0.7 → 1 */
  animation: none;             /* arrete vglow */
  transform: translate(-50%, -50%) scale(1.3);  /* etait 1 → 1.3 */
}

/* Label: texte plus visible + letter-spacing plus large */
.video-outer:hover .video-label {
  color: rgba(255,255,255,0.65);   /* etait 0.45 → 0.65 */
  letter-spacing: 2px;             /* etait 1.5px → 2px */
}

/* Reflet sous la video: apparait */
.video-wrap:hover .video-reflect {
  opacity: 1;                  /* etait 0 → 1 */
}
```

---

## 1. ANIMATIONS D'ENTREE (Entrance Animations)

### Fade-up staggered (elements qui apparaissent en cascade)
```css
/* Chaque element demarre invisible et decale vers le bas */
.animate-enter {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.5s cubic-bezier(.22, 1, .36, 1),
              transform 0.7s cubic-bezier(.22, 1, .36, 1);
}

.animate-enter.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Delais en cascade pour chaque enfant */
.animate-enter:nth-child(1) { transition-delay: 0.05s; }
.animate-enter:nth-child(2) { transition-delay: 0.10s; }
.animate-enter:nth-child(3) { transition-delay: 0.15s; }
.animate-enter:nth-child(4) { transition-delay: 0.20s; }
.animate-enter:nth-child(5) { transition-delay: 0.25s; }
```

### Equivalent Tailwind / Framer Motion
```tsx
// Framer Motion stagger container
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};
```

---

## 2. HOVER EFFECTS SUR CARTES

### Card lift + glow
```css
.card {
  transition: transform 0.5s cubic-bezier(.22, 1, .36, 1),
              box-shadow 0.5s cubic-bezier(.22, 1, .36, 1),
              border-color 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  border-color: rgba(139, 92, 246, 0.3);  /* purple glow border */
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(139, 92, 246, 0.2);      /* purple ambient glow */
}

/* Version intense au hover */
.card:hover {
  box-shadow:
    0 30px 100px rgba(139, 92, 246, 0.16),
    0 0 50px rgba(139, 92, 246, 0.4);
}
```

### Icon scale on card hover
```css
.card .icon {
  transition: transform 0.3s cubic-bezier(.22, 1, .36, 1),
              filter 0.3s ease;
}

.card:hover .icon {
  transform: scale(1.1);
  filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.15));
}
```

### Skill tags stagger on hover
```css
.card:hover .tag:nth-child(1) { transition-delay: 0.02s; }
.card:hover .tag:nth-child(2) { transition-delay: 0.04s; }
.card:hover .tag:nth-child(3) { transition-delay: 0.06s; }
/* ... jusqu'a 0.22s */
```

---

## 3. STYLE DES CARTES / CUBES (Glassmorphism)

### Structure de base
```css
.glass-card {
  border-radius: 16px;                        /* ou 20px, 24px */
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(20, 20, 30, 0.7);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  padding: 28px;                              /* ou 36px */
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* Hover state */
.glass-card:hover {
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 80px rgba(139, 92, 246, 0.08);
}
```

### Grilles responsives
```css
/* 3 colonnes → 2 → 1 */
.grid-outcomes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 900px) {
  .grid-outcomes { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .grid-outcomes { grid-template-columns: 1fr; }
}

/* 4 colonnes → 2 → 1 */
.grid-features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
```

### Spotlight/Radial glow qui suit la souris
```css
.card-spotlight {
  position: relative;
  overflow: hidden;
}

.card-spotlight::before {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 65%);
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
  /* Position mise a jour via JS avec mousemove */
  transform: translate(var(--mouse-x), var(--mouse-y));
}

.card-spotlight:hover::before {
  opacity: 1;
}
```

---

## 4. ANIMATIONS AVANCEES

### Animated border (rotation de gradient conique)
```css
.animated-border {
  position: relative;
}

.animated-border::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    rgba(139, 92, 246, 0.5) 25%,
    transparent 50%
  );
  animation: spin 5s linear infinite;
  z-index: -1;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Shimmer sweep sur boutons
```css
.btn-shimmer {
  position: relative;
  overflow: hidden;
}

.btn-shimmer::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.25),
    transparent
  );
  transition: left 0.6s ease;
}

.btn-shimmer:hover::after {
  left: 100%;
}
```

### Pulse ring (bouton play / CTA)
```css
.pulse-ring {
  position: relative;
}

.pulse-ring::before,
.pulse-ring::after {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1px solid rgba(139, 92, 246, 0.3);
  animation: pulse-out 2s ease-out infinite;
}

.pulse-ring::after {
  animation-delay: 0.5s;
}

@keyframes pulse-out {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.4); opacity: 0; }
}
```

### Parallax au mouvement de souris
```css
.parallax-layer {
  transition: transform 0.1s ease-out;
  /* Applique via JS: */
  transform: translate(
    calc(var(--pmx) * 0.03px),
    calc(var(--pmy) * 0.03px)
  );
}
```

```js
// JS pour mettre a jour les variables
document.addEventListener('mousemove', (e) => {
  const x = (e.clientX - window.innerWidth / 2);
  const y = (e.clientY - window.innerHeight / 2);
  document.documentElement.style.setProperty('--pmx', x);
  document.documentElement.style.setProperty('--pmy', y);
});
```

### Etoiles scintillantes (hero background)
```css
@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.star {
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  position: absolute;
  animation: twinkle 3.5s ease-in-out infinite;
}

.star:nth-child(odd) { animation-delay: 1.2s; }
.star:nth-child(even) { animation-delay: 0.6s; }
```

### Comete / shooting star
```css
@keyframes comet-fly {
  0% {
    transform: translateX(-100px) translateY(-100px);
    opacity: 0;
  }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% {
    transform: translateX(calc(100vw + 200px)) translateY(300px);
    opacity: 0;
  }
}

.comet {
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.8), transparent);
  position: absolute;
  animation: comet-fly 13s ease-out infinite;
  transform: rotate(-15deg);
}
```

### Elements flottants (rotation continue)
```css
@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(3deg);
  }
}

.floating-element {
  animation: float 8s ease-in-out infinite;
}

.floating-element:nth-child(2) {
  animation-duration: 11s;
  animation-delay: -2s;
}
```

---

## 5. SCROLL ANIMATIONS

### Progress bar on scroll
```css
.progress-fill {
  width: 0;
  height: 4px;
  background: linear-gradient(90deg, #8B5CF6, #ec4899);
  border-radius: 2px;
  transition: width 0.8s cubic-bezier(.22, 1, .36, 1);
}
```

### Timeline fill
```css
.timeline-line {
  width: 2px;
  background: rgba(255, 255, 255, 0.1);
  position: relative;
}

.timeline-fill {
  position: absolute;
  top: 0;
  width: 100%;
  height: 0;
  background: linear-gradient(180deg, #8B5CF6, #ec4899);
  transition: height 0.08s linear;
}
```

### Chart dots stagger
```css
.chart-dot {
  transition: transform 0.3s ease, filter 0.3s ease;
}

.chart-dot:nth-child(1) { transition-delay: 0.05s; }
.chart-dot:nth-child(2) { transition-delay: 0.10s; }
.chart-dot:nth-child(3) { transition-delay: 0.15s; }

.chart-dot.active {
  transform: scale(1.3);
  filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.4));
}
```

---

## 6. ICONES

### Style des icones
```css
.icon-container {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(139, 92, 246, 0.07);
  transition: transform 0.3s ease, filter 0.3s ease;
}

.icon-container svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 1.5;
  fill: none;
}

.icon-container:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.15));
}
```

### Icones recommandees (style outline/stroke)
- **Lucide React** ou **Phosphor Icons** — style outline fin (stroke-width: 1.5)
- Taille: 20-24px dans le body, 42px dans les cards header
- Couleurs par contexte:
  - Purple `#8B5CF6` — features principales
  - Pink `#ec4899` — design/creativite
  - Cyan/Teal — technique
  - Amber `#fbbf24` — alertes/pro
  - Green — succes/validation

### Checkmark / feature list icon
```css
.feature-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-check svg {
  width: 12px;
  height: 12px;
  stroke: #8B5CF6;
  stroke-width: 2;
}
```

---

## 7. BOUTONS

### CTA principal (gradient + shimmer)
```css
.btn-primary {
  background: linear-gradient(135deg, #8B5CF6, #6366f1);
  color: white;
  padding: 16px 48px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(139, 92, 246, 0.25);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.btn-primary:hover {
  box-shadow: 0 0 50px rgba(139, 92, 246, 0.4),
              0 0 100px rgba(139, 92, 246, 0.2);
  transform: translateY(-2px);
}
```

### Bouton secondaire (ghost/outline)
```css
.btn-secondary {
  background: rgba(139, 92, 246, 0.1);
  color: #A78BFA;
  padding: 12px 32px;
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.5);
}
```

---

## 8. PALETTE DE COULEURS

```css
:root {
  /* Couleurs principales */
  --primary: #8B5CF6;
  --primary-light: #A78BFA;
  --primary-dark: #7C3AED;
  --accent-pink: #ec4899;
  --accent-orange: #f97316;
  --accent-amber: #fbbf24;

  /* Texte */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.4);
  --text-disabled: rgba(255, 255, 255, 0.25);

  /* Backgrounds */
  --bg-base: #0a0a14;
  --bg-card: rgba(20, 20, 30, 0.7);
  --bg-card-hover: rgba(30, 30, 45, 0.8);

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(139, 92, 246, 0.3);

  /* Spacing */
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
}
```

### Gradients cles
```css
/* Texte hero gradient */
.gradient-text {
  background: linear-gradient(180deg, #fff 40%, rgba(255, 255, 255, 0.7));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Gradient de certificat/badge */
.gradient-badge {
  background: linear-gradient(135deg, #2d1a6b 0%, #7c3aed 50%);
}

/* Glow radial pour sections */
.section-glow {
  background: radial-gradient(
    ellipse at center,
    rgba(139, 92, 246, 0.08) 0%,
    transparent 70%
  );
}
```

---

## 9. TYPOGRAPHIE

```css
/* Fonts */
--font-primary: 'Inter Variable', 'Inter', system-ui, sans-serif;
--font-display: 'Outfit Variable', sans-serif;
--font-accent: 'DM Sans', sans-serif;

/* Tailles responsives */
--fs-hero: clamp(44px, 6vw, 76px);    /* Hero heading */
--fs-h2: clamp(32px, 5vw, 48px);       /* Section heading */
--fs-h3: clamp(24px, 3vw, 32px);       /* Card heading */
--fs-body: 16px;
--fs-small: 14px;
--fs-caption: 12px;

/* Poids */
--fw-display: 700;     /* Headers */
--fw-semibold: 600;     /* Badges, labels */
--fw-body: 400;         /* Corps de texte */

/* Letter-spacing */
--ls-tight: -0.04em;    /* Headers */
--ls-expanded: 0.1em;   /* Badges uppercase */

/* Line-heights */
--lh-tight: 1.0;        /* Headers */
--lh-normal: 1.5;       /* Body */
--lh-relaxed: 1.75;     /* Descriptions */
```

---

## 10. EASING CURVES CLES

```css
/* La courbe signature UXPeak — smooth deceleration */
--ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);

/* Usage: */
transition: all 0.5s var(--ease-smooth);

/* Autres easings utilises: */
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

---

## 11. VIDEO / YOUTUBE SECTION (hover complet)

### Play button flottant
```css
@keyframes vfloat {
  0%, 100% { transform: translate(-50%, -50%) translateY(0); }
  50% { transform: translate(-50%, -50%) translateY(-6px); }
}

.video-play {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 30%, var(--primary-light), var(--primary) 60%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: vfloat 5s ease-in-out infinite;
  cursor: pointer;
  z-index: 3;
}

/* Au hover du container, le play arrete de flotter et scale up */
.video-outer:hover .video-play {
  animation: none;
  transform: translate(-50%, -50%) scale(1.08);
}
```

### 3 anneaux pulsants autour du play
```css
@keyframes vpulse {
  0% { transform: scale(0.85); opacity: 0.6; }
  100% { transform: scale(1.15); opacity: 0; }
}

.video-play-ring {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 1px solid rgba(139, 92, 246, 0.4);
  animation: vpulse 3.5s ease-out infinite;
}

.video-play-ring:nth-child(1) { animation-delay: 0s; }
.video-play-ring:nth-child(2) { animation-delay: 0.8s; }
.video-play-ring:nth-child(3) { animation-delay: 1.6s; }
```

### Shimmer qui traverse le play button
```css
@keyframes vshimmer {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(350%); }
}

.video-play::after {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: vshimmer 4s ease-in-out infinite;
  border-radius: inherit;
}
```

### Bordure tournante sur le container video
```css
@keyframes borderSpin {
  to { transform: rotate(360deg); }
}

.video-outer {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}

.video-outer::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    rgba(139, 92, 246, 0.4) 25%,
    transparent 50%
  );
  animation: borderSpin 8s linear infinite;
  opacity: 0.4;
  transition: opacity 0.5s ease;
  z-index: 0;
}

.video-outer:hover::before {
  opacity: 0.8;
}
```

### Image video qui zoom + brighten au hover
```css
.video-image {
  width: 100%;
  border-radius: 20px;
  transition: transform 0.6s cubic-bezier(.22, 1, .36, 1),
              filter 0.6s ease;
}

.video-outer:hover .video-image {
  transform: scale(1.04);
  filter: brightness(1.15);
}
```

### Accents decoratifs dans les coins
```css
.video-corner-accent {
  position: absolute;
  width: 24px;
  height: 24px;
  opacity: 0.12;
  transition: opacity 0.4s ease;
}

.video-outer:hover .video-corner-accent {
  opacity: 0.35;
}

/* Positions: top-left, top-right, bottom-left, bottom-right */
.video-corner-accent.tl { top: 12px; left: 12px; }
.video-corner-accent.tr { top: 12px; right: 12px; }
.video-corner-accent.bl { bottom: 12px; left: 12px; }
.video-corner-accent.br { bottom: 12px; right: 12px; }
```

---

## 12. PRICING CARDS (interactions detaillees)

### Spotlight radial qui suit la souris
```css
.pricing-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.5s cubic-bezier(.22, 1, .36, 1),
              border-color 0.3s ease;
}

.pricing-card::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(
    500px circle at var(--mx, 50%) var(--my, 50%),
    rgba(167, 139, 250, 0.12),
    transparent 65%
  );
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.pricing-card:hover::before {
  opacity: 1;
}

.pricing-card:hover {
  transform: translateY(-6px);
  border-color: rgba(139, 92, 246, 0.2);
}
```

```js
// JS pour le tracking souris sur chaque card
document.querySelectorAll('.pricing-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
    card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
  });
});
```

### Badge "populaire" pulsant
```css
@keyframes badge-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.4),
                0 0 0 rgba(139, 92, 246, 0);
  }
  50% {
    box-shadow: 0 0 28px rgba(139, 92, 246, 0.6),
                0 0 50px rgba(139, 92, 246, 0.25);
  }
}

.pricing-badge-popular {
  animation: badge-pulse 2.5s ease-in-out infinite;
  background: linear-gradient(135deg, #8B5CF6, #6366f1);
  color: white;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

### Feature list reveal en cascade
```css
.pricing-feature {
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.5s cubic-bezier(.22, 1, .36, 1),
              transform 0.5s cubic-bezier(.22, 1, .36, 1);
}

.pricing-card.revealed .pricing-feature:nth-child(1) { transition-delay: 0.05s; }
.pricing-card.revealed .pricing-feature:nth-child(2) { transition-delay: 0.10s; }
.pricing-card.revealed .pricing-feature:nth-child(3) { transition-delay: 0.15s; }
.pricing-card.revealed .pricing-feature:nth-child(4) { transition-delay: 0.20s; }
.pricing-card.revealed .pricing-feature:nth-child(5) { transition-delay: 0.25s; }
.pricing-card.revealed .pricing-feature:nth-child(6) { transition-delay: 0.30s; }
.pricing-card.revealed .pricing-feature:nth-child(7) { transition-delay: 0.35s; }
.pricing-card.revealed .pricing-feature:nth-child(8) { transition-delay: 0.40s; }
.pricing-card.revealed .pricing-feature:nth-child(9) { transition-delay: 0.45s; }

.pricing-card.revealed .pricing-feature {
  opacity: 1;
  transform: translateY(0);
}
```

### Shine sweep sur le bouton CTA pricing
```css
.pricing-cta::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.7s cubic-bezier(.22, 1, .36, 1);
}

.pricing-cta:hover::after {
  left: 100%;
}
```

---

## 13. FAQ / ACCORDION (animations completes)

### Icone + qui tourne en x
```css
.faq-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s cubic-bezier(.22, 1, .36, 1),
              color 0.3s ease;
  color: rgba(255, 255, 255, 0.4);
}

.faq-item.is-open .faq-icon {
  transform: rotate(135deg);
  color: #8B5CF6;
}
```

### Contenu qui se revele (max-height + opacity)
```css
.faq-content {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(.22, 1, .36, 1),
              opacity 0.35s ease 0.05s;
}

.faq-item.is-open .faq-content {
  max-height: 400px;
  opacity: 1;
}
```

### Ligne d'accent verticale qui grandit
```css
.faq-accent-line {
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, #8B5CF6, transparent);
  transform: scaleY(0);
  transform-origin: top;
  transition: transform 0.5s cubic-bezier(.22, 1, .36, 1);
  border-radius: 2px;
}

.faq-item.is-open .faq-accent-line {
  transform: scaleY(1);
}
```

### Item header qui glisse a droite
```css
.faq-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  cursor: pointer;
  transition: transform 0.4s cubic-bezier(.22, 1, .36, 1),
              background 0.3s ease;
  border-radius: 12px;
}

.faq-header:hover,
.faq-item.is-open .faq-header {
  transform: translateX(8px);
  background: rgba(139, 92, 246, 0.035);
}
```

---

## 14. BANNER CTA (section finale avec effets cosmiques)

### Etoiles scintillantes ameliorees
```css
@keyframes twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.3); }
}

.banner-star {
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  position: absolute;
  animation: twinkle 3.5s ease-in-out infinite;
}
```

### Cometes avec trajectoire precise
```css
@keyframes comet-fly {
  0% { opacity: 0; transform: translate(0, 0) rotate(-20deg); }
  2% { opacity: 1; }
  18% { opacity: 1; }
  23% { opacity: 0; transform: translate(1500px, -500px) rotate(-20deg); }
  100% { opacity: 0; transform: translate(1500px, -500px) rotate(-20deg); }
}

.comet {
  position: absolute;
  width: 100px;
  height: 1px;
  background: linear-gradient(90deg, white 0%, rgba(139,92,246,0.5) 30%, transparent 100%);
}

.comet:nth-child(1) { animation: comet-fly 13s ease-out infinite; animation-delay: 0s; }
.comet:nth-child(2) { animation: comet-fly 15s ease-out infinite; animation-delay: 7s; }
.comet:nth-child(3) { animation: comet-fly 14s ease-out infinite; animation-delay: 5s; }
.comet:nth-child(4) { animation: comet-fly 13s ease-out infinite; animation-delay: 10s; }
```

### Shooting star au hover du banner
```css
.cta-banner:hover .shooting-star {
  opacity: 1;
  animation: shoot 1.6s ease-out;
}

@keyframes shoot {
  0% { transform: translateX(-200px) rotate(-15deg); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translateX(calc(100% + 200px)) rotate(-15deg); opacity: 0; }
}
```

### Glow radial qui suit le curseur dans le banner
```css
.banner-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(139,92,246,0.12), transparent 65%);
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.6s ease;
  left: var(--bmx);
  top: var(--bmy);
  transform: translate(-50%, -50%);
}

.cta-banner:hover .banner-glow {
  opacity: 1;
}
```

### CTA pulse ring
```css
@keyframes cta-ring-pulse {
  0% { inset: 0; opacity: 0.8; }
  100% { inset: -16px; opacity: 0; }
}

.cta-btn-ring {
  position: absolute;
  border-radius: inherit;
  border: 1px solid rgba(139, 92, 246, 0.4);
  animation: cta-ring-pulse 2.5s ease-out infinite;
  pointer-events: none;
}
```

### Hero glow pulse (fond)
```css
@keyframes hero-glow-pulse {
  0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
}

.hero-glow {
  position: absolute;
  width: 60%;
  height: 60%;
  top: 50%;
  left: 50%;
  background: radial-gradient(ellipse, rgba(139,92,246,0.15), transparent 70%);
  animation: hero-glow-pulse 6s ease-in-out infinite;
  pointer-events: none;
}
```

---

## 15. ELEMENTS FLOTTANTS UI (mockups autour du banner)

### 5 elements avec animations distinctes
```css
@keyframes ui-float-a {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
  50% { transform: translateY(-14px) translateX(10px) rotate(2deg); }
}
@keyframes ui-float-b {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
  50% { transform: translateY(-12px) translateX(-12px) rotate(-1.5deg); }
}
@keyframes ui-float-c {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
  50% { transform: translateY(14px) translateX(-10px) rotate(1deg); }
}
@keyframes ui-float-d {
  0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); }
  50% { transform: translateY(-10px) translateX(12px) rotate(-2deg); }
}
@keyframes ui-cursor-move {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-20px) translateX(18px); }
}

@keyframes ui-fade-in {
  to { opacity: 1; }
}

/* Chaque element arrive en fade puis flotte */
.ui-card-1 {
  opacity: 0;
  animation: ui-fade-in 0.6s ease forwards 0.5s,
             ui-float-a 10s ease-in-out infinite 0.5s;
}
.ui-palette-1 {
  opacity: 0;
  animation: ui-fade-in 0.6s ease forwards 0.7s,
             ui-float-b 11s ease-in-out infinite 0.7s;
}
.ui-typo-1 {
  opacity: 0;
  animation: ui-fade-in 0.6s ease forwards 0.9s,
             ui-float-c 9s ease-in-out infinite 0.9s;
}
.ui-select-1 {
  opacity: 0;
  animation: ui-fade-in 0.6s ease forwards 1.1s,
             ui-float-d 10s ease-in-out infinite 1.1s;
}
.ui-cursor {
  opacity: 0;
  animation: ui-fade-in 0.6s ease forwards 1.3s,
             ui-cursor-move 8s ease-in-out infinite 1.3s;
}
```

---

## 16. CERTIFICAT / BADGE 3D

### Flottement du certificat
```css
@keyframes certFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.certificate-card {
  animation: certFloat 6s ease-in-out infinite;
  perspective: 1200px;
}
```

### Tilt 3D au hover (perspective)
```css
.certificate-tilt {
  transition: transform 0.4s ease;
}

.certificate-tilt:hover {
  /* Valeurs mises a jour via JS selon position souris */
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
}
```

```js
// JS pour le tilt 3D
const card = document.querySelector('.certificate-tilt');
card.addEventListener('mousemove', (e) => {
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  card.style.setProperty('--rx', (y * -10) + 'deg');
  card.style.setProperty('--ry', (x * 10) + 'deg');
});
card.addEventListener('mouseleave', () => {
  card.style.setProperty('--rx', '0deg');
  card.style.setProperty('--ry', '0deg');
});
```

### Shine diagonal qui traverse
```css
@keyframes certShine {
  0% { transform: translateX(-10%) rotate(12deg); }
  30%, 100% { transform: translateX(240%) rotate(12deg); }
}

.certificate-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 60%;
  height: 200%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 45%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.08) 55%,
    transparent 100%
  );
  animation: certShine 8s cubic-bezier(.4, 0, .2, 1) infinite;
  pointer-events: none;
}
```

### Nebula glows derriere le certificat
```css
.cert-nebula-1,
.cert-nebula-2 {
  position: absolute;
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.4;
  transition: opacity 0.5s ease, filter 0.5s ease;
  pointer-events: none;
}

.cert-nebula-1 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(139,92,246,0.4), transparent);
  top: -40px;
  right: -40px;
}

.cert-nebula-2 {
  width: 160px;
  height: 160px;
  background: radial-gradient(circle, rgba(236,72,153,0.3), transparent);
  bottom: -30px;
  left: -30px;
}

.certificate-card:hover .cert-nebula-1,
.certificate-card:hover .cert-nebula-2 {
  opacity: 0.6;
  filter: blur(90px);
}
```

---

## 17. "FROM ZERO TO DESIGN HERO" — JOURNEY TIMELINE (valeurs exactes du DOM)

### Structure de la section
```
YOUR PATH (label)
From zero to design hero (titre)
Description (sous-titre)

  [01]------- Phase 1: Foundations & What UX/UI Actually Is
  |           MODULES 1-2
  |           [pill] [pill]
  |
  [02]------- Phase 2: Master Your Tools & Principles
  |           MODULES 3-4
  |           [pill] [pill]
  |
  *dot*       (glowing dot with cross flare + pulse ring)
  |
  [03]------- Phase 3: Real Projects, Real Skills
  |           MODULES 5-7
  |           [pill] [pill] [pill]
  |
  [04]------- Phase 4: Portfolio & Career Launch
              MODULES 8-9
              [pill] [pill]
```

### Section label "YOUR PATH"
```css
.section-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: #8B5CF6;
  margin-bottom: 16px;
}
```

### Titre "From zero to design hero"
```css
.journey-title {
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  color: #f2f2f7;
  letter-spacing: -0.04em;
  line-height: 1.0;
  margin-bottom: 16px;
}
```

---

### Ligne de progression verticale (gradient 4 couleurs)
```css
.j-line-fill {
  width: 3px;
  position: absolute;
  left: 25px;                      /* aligne avec le centre des cercles */
  top: 28px;
  height: 0;                       /* grandit au scroll via JS */
  background: linear-gradient(
    rgb(139, 92, 246) 0%,          /* purple */
    rgb(236, 72, 153) 40%,         /* pink */
    rgb(249, 115, 22) 75%,         /* orange */
    rgb(251, 191, 36) 100%         /* amber */
  );
  transition: height 0.08s linear; /* animation fluide au scroll */
}
```

### Dot lumineux (pointe de la ligne)
```css
.j-line-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: white;
  position: absolute;
  left: 22px;
  z-index: 1;
  /* Triple glow: blanc intense + halo blanc + halo purple */
  box-shadow:
    rgb(255,255,255) 0px 0px 6px,
    rgba(255,255,255,0.6) 0px 0px 16px,
    rgba(139,92,246,0.3) 0px 0px 40px;
}
```

### Cross lens flare sur le dot (croix lumineuse)
```css
/* Barre verticale */
.j-line-dot::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 28px;
  background: linear-gradient(
    transparent,
    rgba(255,255,255,0.5) 40%,
    white 50%,
    rgba(255,255,255,0.5) 60%,
    transparent
  );
}

/* Barre horizontale */
.j-line-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,0.4) 40%,
    rgba(255,255,255,0.8) 50%,
    rgba(255,255,255,0.4) 60%,
    transparent
  );
}
```

### Dot pulse ring
```css
.j-dot-ring {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: jdotRing 2.5s ease-out infinite;
  position: absolute;
}

@keyframes jdotRing {
  0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
}
```

---

### Phase card (chaque etape)

#### Etat initial (invisible, anime au scroll)
```css
.j-phase {
  position: relative;
  padding-bottom: 64px;
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 2;
}

.j-phase:last-child {
  padding-bottom: 0;
}

/* Apparait au scroll (JS ajoute .j-visible) */
.j-phase.j-visible {
  opacity: 1;
  transform: translateY(0);
}
```

#### Cercle numero (01, 02, 03, 04)
```css
.j-num {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  font-size: 18px;
  font-weight: 700;
  color: rgb(138, 135, 151);          /* gris au repos */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Fond sombre derriere pour couper la ligne */
.j-num::before {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: var(--bg);              /* #07070d */
  z-index: 0;
}

/* Anneau de bordure */
.j-num-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.08);  /* subtil au repos */
  transition: 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 2;
}

/* Fond interieur */
.j-num-bg {
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--bg);
  z-index: 1;
  transition: background 0.6s;
}

/* Le chiffre */
.j-num span {
  position: relative;
  z-index: 3;
  transition: color 0.6s;
}
```

#### Phase ACTIVE (atteinte par le scroll)
```css
/* Cercle scale up */
.j-phase.j-active .j-num {
  transform: scale(1.05);
}

/* Chiffre blanc */
.j-phase.j-active .j-num span {
  color: var(--t1);                    /* #f2f2f7 */
}

/* Anneau: bordure coloree + glow */
.j-phase.j-active .j-num-ring {
  border-color: var(--p);              /* #8B5CF6 par defaut */
  box-shadow: rgba(139, 92, 246, 0.2) 0px 0px 20px;
}

/* Fond interieur teinte */
.j-phase.j-active .j-num-bg {
  background: rgba(139, 92, 246, 0.08);
}

/* Titre blanc */
.j-phase.j-active .j-title {
  color: var(--t1);
  opacity: 1;
}

/* Label MODULES visible */
.j-phase.j-active .j-week {
  opacity: 1;
}

/* Description visible */
.j-phase.j-active .j-desc {
  opacity: 1;
}

/* Pills de modules visibles */
.j-phase.j-active .j-mod {
  opacity: 1;
  border-color: rgba(255, 255, 255, 0.09);
  color: var(--t2);
  background: rgba(255, 255, 255, 0.035);
}
```

#### Phase HOVER
```css
.j-phase:hover .j-num {
  transform: scale(1.1);              /* plus gros qu'active */
}

.j-phase:hover .j-num-ring {
  opacity: 1;
}
```

---

### Couleurs par phase (gradient progressif)

| Phase | Couleur | Label | Ring active | Fond active |
|-------|---------|-------|-------------|-------------|
| 01 (3e enfant CSS) | `rgb(139, 92, 246)` Purple | Purple | `border: purple, glow: purple 0.25` | `rgba(purple, 0.08)` |
| 02 (4e enfant CSS) | `rgb(236, 72, 153)` Pink | Pink | `border: pink, glow: pink 0.25` | `rgba(pink, 0.08)` |
| 03 (5e enfant CSS) | `rgb(249, 115, 22)` Orange | Orange | `border: orange, glow: orange 0.25` | `rgba(orange, 0.08)` |
| 04 (6e enfant CSS) | `rgb(251, 191, 36)` Amber | Amber | `border: amber, glow: amber 0.25` | `rgba(amber, 0.08)` |

```css
/* Phase 1 — Purple (defaut) */
.j-phase:nth-child(3) .j-week { color: rgb(139, 92, 246); }
.j-phase:nth-child(3).j-active .j-num-ring {
  border-color: rgb(139, 92, 246);
  box-shadow: rgba(139, 92, 246, 0.25) 0 0 20px;
}
.j-phase:nth-child(3).j-active .j-num-bg { background: rgba(139, 92, 246, 0.08); }

/* Phase 2 — Pink */
.j-phase:nth-child(4) .j-week { color: rgb(236, 72, 153); }
.j-phase:nth-child(4).j-active .j-num-ring {
  border-color: rgb(236, 72, 153);
  box-shadow: rgba(236, 72, 153, 0.25) 0 0 20px;
}
.j-phase:nth-child(4).j-active .j-num-bg { background: rgba(236, 72, 153, 0.08); }

/* Phase 3 — Orange */
.j-phase:nth-child(5) .j-week { color: rgb(249, 115, 22); }
.j-phase:nth-child(5).j-active .j-num-ring {
  border-color: rgb(249, 115, 22);
  box-shadow: rgba(249, 115, 22, 0.25) 0 0 20px;
}
.j-phase:nth-child(5).j-active .j-num-bg { background: rgba(249, 115, 22, 0.08); }

/* Phase 4 — Amber */
.j-phase:nth-child(6) .j-week { color: rgb(251, 191, 36); }
.j-phase:nth-child(6).j-active .j-num-ring {
  border-color: rgb(251, 191, 36);
  box-shadow: rgba(251, 191, 36, 0.25) 0 0 20px;
}
.j-phase:nth-child(6).j-active .j-num-bg { background: rgba(251, 191, 36, 0.08); }
```

---

### Label "MODULES X-Y"
```css
.j-week {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--p);                     /* colore par phase via nth-child */
  margin-bottom: 10px;
  opacity: 0.5;                        /* dim au repos */
  transition: opacity 0.6s;
}

.j-phase.j-active .j-week {
  opacity: 1;                          /* pleine opacite quand actif */
}
```

### Titre de phase
```css
.j-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--t2);                    /* rgba(255,255,255,0.7) au repos */
  margin-bottom: 10px;
  letter-spacing: -0.3px;
  opacity: 0.55;                       /* dim au repos */
  transition: color 0.6s, opacity 0.6s;
}

.j-phase.j-active .j-title {
  color: var(--t1);                    /* blanc quand actif */
  opacity: 1;
}
```

### Description
```css
.j-desc {
  font-size: 15px;
  color: var(--t2);
  line-height: 1.7;
  margin-bottom: 18px;
  opacity: 0.45;                       /* tres dim au repos */
  transition: opacity 0.6s;
}

.j-phase.j-active .j-desc {
  opacity: 1;
}
```

### Pills de modules
```css
.j-modules {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.j-mod {
  font-size: 12px;
  font-weight: 500;
  padding: 7px 16px;
  border-radius: 100px;               /* pill shape */
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.09);
  color: var(--t2);
  letter-spacing: 0.3px;
  opacity: 0.45;                       /* dim au repos */
  transition: background 0.4s, border-color 0.4s, opacity 0.6s;
}

.j-phase.j-active .j-mod {
  opacity: 1;
}

.j-mod:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.14);
}
```

---

### Comportement scroll (JS)
```
Au scroll:
1. Chaque .j-phase recoit .j-visible quand elle entre dans le viewport
   → opacity 0→1, translateY(32px)→0
   
2. La .j-line-fill grandit en height proportionnellement au scroll
   → transition: height 0.08s linear (tres fluide)
   
3. Le .j-line-dot suit le bas de la line-fill
   → glowing dot avec cross flare + pulse ring

4. Chaque phase recoit .j-active quand la line atteint son cercle
   → le cercle scale 1.05, bordure coloree + glow
   → texte passe de dim (0.45-0.55) a plein (1.0)
   → couleur du ring/label change selon la phase

5. Les phases non-actives restent dim mais visibles
   → cree un effet de "progression" tres satisfaisant
```

---

## 18. STATS HOVER (chiffres dans le hero)

```css
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 28px;
  transition: transform 0.3s cubic-bezier(.22, 1, .36, 1);
  cursor: default;
}

.stat-item:hover {
  transform: translateY(-4px);
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: white;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.stat-item:hover .stat-number {
  color: #A78BFA;
  text-shadow: 0 0 24px rgba(139, 92, 246, 0.25);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(180, 165, 210, 0.14);
  transition: background 0.3s ease;
}

.stat-item:hover + .stat-divider {
  background: rgba(139, 92, 246, 0.3);
}
```

---

## 19. VALEUR BARREE (prix / what you get)

### Animation strikethrough + fleche + nouveau prix
```css
/* Ancien prix barre */
.old-price {
  position: relative;
  opacity: 0.5;
}

.old-price::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 2px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s cubic-bezier(.22, 1, .36, 1) 0.15s;
}

.revealed .old-price::after {
  transform: scaleX(1);
}

/* Fleche entre les deux prix */
.price-arrow {
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity 0.3s ease 0.7s,
              transform 0.3s ease 0.7s;
}

.revealed .price-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* Nouveau prix qui apparait */
.new-price {
  opacity: 0;
  transform: scale(0.92);
  transition: opacity 0.4s ease 0.9s,
              transform 0.4s cubic-bezier(.22, 1, .36, 1) 0.9s;
  color: #8B5CF6;
  font-weight: 700;
}

.revealed .new-price {
  opacity: 1;
  transform: scale(1);
}
```

---

## 20. RISK-FREE CARD (garantie)

### Shield flottant
```css
@keyframes shield-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.shield-icon {
  animation: shield-float 4s ease-in-out infinite;
  transition: border-color 0.3s ease, background 0.3s ease, filter 0.3s ease;
}

.risk-card:hover .shield-icon {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.1);
  filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.3));
}
```

### Glow radial suivant le curseur
```css
.risk-card::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(
    circle at var(--rmx, 50%) var(--rmy, 50%),
    rgba(139, 92, 246, 0.1),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.risk-card:hover::before {
  opacity: 1;
}
```

---

## 21. DECORATIFS (grille, bruit, overlays)

### Grid dot overlay
```css
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
  opacity: 0.08;
  pointer-events: none;
}
```

### Section glow (fond de section)
```css
.section::before {
  content: '';
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 400px;
  background: radial-gradient(
    ellipse at center,
    rgba(139, 92, 246, 0.08) 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}
```

---

## RESUME COMPLET — Quoi appliquer sur SAFE

| Element | Priorite | Impact | Difficulte |
|---------|----------|--------|------------|
| Fade-up stagger entree | Haute | Premium feel | Facile |
| Cards glassmorphism + hover lift + glow | Haute | Look SaaS moderne | Facile |
| Shimmer sweep sur CTA | Haute | Attire le clic | Facile |
| Video play button flottant + pulse rings | Haute | Section video pro | Moyen |
| Spotlight souris sur pricing cards | Haute | Effet wow pricing | Moyen |
| FAQ accordion avec accent line + rotation | Haute | UX propre | Facile |
| Icones outline Lucide 20px | Haute | Coherence visuelle | Facile |
| Gradient text hero | Moyenne | Hero impactant | Facile |
| Badge populaire pulsant | Moyenne | Conversion pricing | Facile |
| Feature list reveal en cascade | Moyenne | Micro-delight | Facile |
| Stats hover avec glow chiffres | Moyenne | Polish | Facile |
| Prix barre animee + nouveau prix | Moyenne | Impact pricing | Moyen |
| Timeline/journey avec dot pulse | Moyenne | Storytelling | Moyen |
| Elements flottants UI mockups | Basse | Hero premium | Moyen |
| Cometes + etoiles background | Basse | Ambiance cosmique | Moyen |
| Certificat 3D tilt + shine | Basse | Credibilite | Difficile |
| Animated border conic gradient | Basse | Badge premium | Moyen |
| Grid dot overlay decoratif | Basse | Texture subtile | Facile |
| Easing cubic-bezier(.22,1,.36,1) | Haute | Fluidite sur tout | Facile |
| **Social cubes avec couleur par plateforme** | **Haute** | **Section contact premium** | **Moyen** |
| FAQ accordion contact style | Haute | UX propre | Facile |

---

## 22. PAGE CONTACT — ANALYSE COMPLETE

### Structure de la page
1. **Hero** — badge pill "Get in touch" + titre gradient + sous-titre + fusee animee
2. **Email** — adresse email cliquable + note de delai
3. **Separateur** — ligne horizontale subtile avec gradient
4. **Follow us** — grille de 7 cubes sociaux avec hover colore par plateforme
5. **Separateur**
6. **FAQ** — accordion "Common questions" avec 6 items
7. **Footer**

---

### 22A. BADGE PILL "Get in touch"
```css
.contact-pill {
  background: rgba(139, 92, 246, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 100px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  color: #A78BFA;            /* var(--pl) */
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

### 22B. TITRE HERO CONTACT
```css
.contact-title {
  font-size: clamp(44px, 6vw, 76px);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.0;
  /* Gradient text blanc vers blanc semi-transparent */
  background: linear-gradient(180deg, #fff 40%, rgba(255,255,255,0.7));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### 22C. EMAIL SECTION
```css
.contact-email {
  font-size: 16px;
  font-weight: 400;
  color: #f2f2f7;           /* var(--t1) */
  transition: color 0.3s ease;
}

.contact-email:hover {
  color: #8B5CF6;            /* var(--p) */
}

.contact-email-note {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
}
```

### 22D. SEPARATEUR / DIVIDER
```css
.contact-divider {
  width: 100%;
  max-width: 520px;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(180, 165, 210, 0.12) 50%,
    transparent
  );
  margin: 40px auto;
}
```

---

### 22E. CUBES SOCIAUX — SYSTEME COMPLET (valeurs exactes du DOM)

#### Couleurs par plateforme (variable CSS `--sl-c`)
```css
/* Chaque cube a sa propre couleur de marque */
.social-youtube  { --sl-c: #ff0033; }
.social-behance  { --sl-c: #1769ff; }
.social-instagram { --sl-c: #e1306c; }
.social-linkedin { --sl-c: #0a66c2; }
.social-x        { --sl-c: #e5e5e5; }
.social-dribbble { --sl-c: #ea4c89; }
.social-medium   { --sl-c: #a78bfa; }
```

#### Grille
```css
.social-grid {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}
```

#### Lien social (container du cube + label)
```css
.social-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  transition: opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1) 0.12s,
              transform 1s cubic-bezier(0.22, 1, 0.36, 1) 0.12s;
}
```

#### Cube (etat NORMAL)
```css
.social-box {
  width: 96px;
  height: 96px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(160deg,
    rgba(28, 24, 42, 0.7),
    rgba(12, 10, 20, 0.5)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition:
    border-color 0.55s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.6s cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1),
    background 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* Glow radial cache derriere l'icone */
.social-box::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, var(--sl-c), transparent 65%);
  opacity: 0;
  transition: opacity 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
  border-radius: inherit;
}
```

#### Icone SVG (etat NORMAL)
```css
.social-box svg {
  width: 28px;
  height: 28px;
  fill: rgba(255, 255, 255, 0.5);    /* gris clair */
  stroke: none;
  transition:
    fill 0.55s cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

#### Label (etat NORMAL)
```css
.social-name {
  font-size: 13px;
  font-weight: 500;
  color: rgb(87, 84, 104);          /* gris sombre */
  transition: color 0.55s cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

#### HOVER — Tout change avec la couleur de la plateforme

```css
/* Le cube monte de 5px + bordure coloree + glow colore */
.social-link:hover .social-box {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, var(--sl-c) 45%, transparent);
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--sl-c) 8%, transparent),
    color-mix(in srgb, var(--sl-c) 2%, transparent)
  );
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--sl-c) 35%, transparent),  /* ring colore */
    0 18px 44px -18px rgba(0, 0, 0, 0.6),                         /* ombre profonde */
    0 0 28px -8px color-mix(in srgb, var(--sl-c) 40%, transparent), /* halo colore */
    inset 0 1px 0 rgba(255, 255, 255, 0.06);                      /* highlight haut */
}

/* Glow radial visible */
.social-link:hover .social-box::before {
  opacity: 0.55;
}

/* Icone prend la couleur de la plateforme + scale + rotation legere */
.social-link:hover .social-box svg {
  fill: var(--sl-c);
  transform: scale(1.08) rotate(-3deg);
}

/* Label devient blanc */
.social-link:hover .social-name {
  color: rgb(255, 255, 255);
}
```

#### Resultat visuel par plateforme au hover
| Plateforme | Couleur | Effet |
|-----------|---------|-------|
| YouTube | `#ff0033` rouge | Bordure rouge, glow rouge, icone rouge |
| Behance | `#1769ff` bleu | Bordure bleue, glow bleu, icone bleue |
| Instagram | `#e1306c` rose | Bordure rose, glow rose, icone rose |
| LinkedIn | `#0a66c2` bleu fonce | Bordure bleue, glow bleu, icone bleue |
| X | `#e5e5e5` blanc | Bordure blanche, glow blanc, icone blanche |
| Dribbble | `#ea4c89` pink | Bordure pink, glow pink, icone pink |
| Medium | `#a78bfa` purple | Bordure purple, glow purple, icone purple |

#### Easing specifique des cubes sociaux
```css
/* Courbe differente du reste du site — plus rebondie */
--ease-social: cubic-bezier(0.2, 0.8, 0.2, 1);

/* vs la courbe standard du site: */
--ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
```

---

### 22F. FAQ ACCORDION CONTACT (valeurs exactes du DOM)

#### Item FAQ (etat NORMAL)
```css
.faq-item {
  border-radius: 16px;
  border: 1px solid transparent;
  padding: 0 24px;
  position: relative;
  background: transparent;
  transition:
    background 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s,
    border-color 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s,
    box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s;
}

/* Ligne d'accent verticale (cachee au repos) */
.faq-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20px;
  width: 2px;
  height: calc(100% - 40px);
  background: linear-gradient(rgb(139, 92, 246), rgba(139, 92, 246, 0.1));
  border-radius: 2px;
  transform: scaleY(0);
  opacity: 0;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.4s ease;
}
```

#### Icone +/x (etat NORMAL)
```css
.faq-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(180, 165, 210, 0.09);
  background: linear-gradient(
    rgba(22, 19, 32, 0.55),
    rgba(14, 12, 22, 0.3)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}
```

#### HOVER (curseur sur un item ferme)
```css
.faq-item:hover {
  background: rgba(139, 92, 246, 0.035);
}

/* Ligne d'accent apparait */
.faq-item:hover::before {
  transform: scaleY(1);
  opacity: 1;
}

/* Texte glisse a droite */
.faq-item:hover .faq-header {
  transform: translateX(8px);
}

/* Icone: fond + bordure + scale */
.faq-item:hover .faq-icon {
  background: linear-gradient(
    rgba(28, 24, 40, 0.7),
    rgba(18, 14, 26, 0.4)
  );
  border-color: rgba(180, 165, 210, 0.18);
  transform: scale(1.08);
}
```

#### ETAT OUVERT (is-open)
```css
.faq-item.is-open {
  background: linear-gradient(
    rgba(22, 19, 32, 0.55),
    rgba(14, 12, 22, 0.3)
  );
  border-color: rgba(180, 165, 210, 0.09);
  box-shadow: rgba(255, 255, 255, 0.04) 0px 1px 0px inset;
}

/* Texte header: blanc + glisse a droite */
.faq-item.is-open .faq-header {
  color: #f2f2f7;
  transform: translateX(8px);
}

/* Icone: fond PURPLE PLEIN + rotation 135deg (+ → x) */
.faq-item.is-open .faq-icon {
  background: #8B5CF6;
  border-color: #8B5CF6;
  transform: rotate(135deg);     /* + tourne en x */
  color: #f2f2f7;                /* icone blanche */
}

/* Ligne d'accent visible */
.faq-item.is-open::before {
  transform: scaleY(1);
  opacity: 1;
}

/* Contenu qui se revele */
.faq-body {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.22, 1, 0.36, 1),
              opacity 0.35s ease 0.05s;
  color: rgba(255, 255, 255, 0.55);
  font-size: 15px;
  line-height: 1.6;
  padding: 0 0 0 0;
}

.faq-item.is-open .faq-body {
  max-height: 400px;
  opacity: 1;
  padding: 0 0 20px 0;
}
```

---

### 22G. FUSEE ANIMEE (decoratif hero)
```css
/* Canvas avec fusee en position absolue en haut a droite */
.contact-rocket {
  position: absolute;
  top: -40px;
  right: 120px;
  width: 180px;
  /* L'image de la fusee avec flame et particules est en canvas/SVG */
  /* Animation: leger flottement vertical */
  animation: shield-float 4s ease-in-out infinite;
  /* Glow violet derriere */
  filter: drop-shadow(0 20px 40px rgba(139, 92, 246, 0.2));
}
```

---

### 22H. FOND ETOILE (identique au reste du site)
```css
/* Etoiles scintillantes sur toute la page */
.contact-stars {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

/* Chaque etoile */
.star {
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  position: absolute;
  animation: starTwinkle var(--dur, 3.5s) ease-in-out infinite;
}
```

---
---

## 23. THEME GLOBAL DU SITE — DESIGN SYSTEM COMPLET (valeurs exactes)

### Philosophie de design

Le site UXPeak utilise un **dark theme premium cosmique** avec ces principes :

1. **Noir profond** (`#050508`) avec des elements qui "emergent" par la lumiere
2. **Violet/purple** comme couleur primaire unique — pas de palette arc-en-ciel
3. **Glassmorphism subtil** — pas de vrais blur lourds, plutot des gradients semi-transparents
4. **Micro-animations partout** — rien n'est statique, tout reagit au scroll/hover
5. **Profondeur par les ombres et glows** — pas de flat design, couches de lumiere
6. **Typographie hierarchy stricte** — 1 font, poids et taille font tout le travail
7. **Etoiles + particules** en fond — ambiance spatiale/cosmique

---

### 23A. PALETTE DE COULEURS COMPLETE

```css
:root {
  /* === COULEURS PRIMAIRES === */
  --p: #8B5CF6;              /* Purple — couleur signature */
  --pl: #A78BFA;             /* Purple light — hover, accents */
  --pd: #7C3AED;             /* Purple dark — CTA pressed */
  --pp: #C4B5FD;             /* Purple pale — centres lumineux */
  --pink: #EC4899;           /* Accent secondaire — phase 2 */
  --cyan: #22D3EE;           /* Accent tertiaire — rare */

  /* === GLOWS === */
  --glow: rgba(139,92,246, 0.15);    /* Glow subtil */
  --glowS: rgba(139,92,246, 0.3);    /* Glow strong */

  /* === BACKGROUNDS === */
  --bg: #050508;             /* Fond principal — quasi-noir avec teinte bleue */

  /* === TEXTE (6 niveaux !) === */
  --t1: #f2f2f7;             /* Titres, texte principal — blanc chaud */
  --t2: #8a8797;             /* Paragraphes — gris moyen */
  --t-sub: #858094;          /* Sous-titres — gris violet */
  --t3: #575468;             /* Texte tertiaire — gris sombre */
  --t-muted: #686478;        /* Labels, captions muted */
  --t-bright: #b8b3c0;       /* Texte bright intermediaire */

  /* === CARTES === */
  --card-bg: linear-gradient(180deg,
    rgba(22,19,32, 0.55),    /* haut: violet tres sombre */
    rgba(14,12,22, 0.3)      /* bas: noir presque pur */
  );
  --card-border: rgba(180,165,210, 0.09);  /* bordure lavande subtile */
  --card-highlight: inset 0 1px 0 rgba(255,255,255, 0.04); /* ligne de lumiere en haut */

  /* === BORDURE GENERALE === */
  --b: rgba(255,255,255, 0.06);  /* bordure par defaut subtile */
}
```

#### Hierarchie de texte visuelle
```
#f2f2f7  ████████████████  --t1     Titres, prix, donnees cles
#b8b3c0  ████████████      --t-bright  Texte secondaire important
#8a8797  ██████████        --t2     Paragraphes, descriptions
#858094  █████████         --t-sub  Sous-titres
#686478  ████████          --t-muted  Captions, labels
#575468  ██████            --t3     Texte desactive, tres dim
```

---

### 23B. TYPOGRAPHIE

```css
/* FONT UNIQUE — Inter Variable */
body {
  font-family: "Inter Variable", Inter, system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;        /* 25.6px */
  color: #f2f2f7;
  background: #050508;
  -webkit-font-smoothing: antialiased;
}

/* Font secondaire (rare, pour badges/accents) */
/* GTStandard-M — utilise sur certains elements speciaux */
```

#### Echelle typographique (design tokens)
```css
:root {
  --fs-caption: 12px;       /* Labels, badges, tags */
  --fs-sm: 14px;            /* Petits textes, nav links */
  --fs-body: 15px;          /* Corps principal */
  --fs-md: 16px;            /* Corps secondaire */
  --fs-lg: 18px;            /* Descriptions hero */
  --fs-h3: 22px;            /* Titres de cards/phases */
  --fs-stat: 48px;          /* Chiffres statistiques */
  --fs-h2: clamp(34px, 4.2vw, 52px);  /* Titres de sections */
  --fs-h1: clamp(48px, 6.5vw, 78px);  /* Hero heading */
}
```

#### Headings (valeurs computed exactes)
```css
h1 {
  font-size: 76px;          /* max de clamp */
  font-weight: 700;
  line-height: 0.98;        /* 74.48px — tres serre */
  letter-spacing: -3.04px;  /* -0.04em tres tight */
  color: white;
  font-family: "Inter Variable";
}

h2 {
  font-size: 52px;
  font-weight: 700;
  line-height: 1.08;        /* 56.16px */
  letter-spacing: -1.56px;  /* -0.03em */
  color: #f2f2f7;
}

h3 {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.6;         /* 35.2px */
  color: #f2f2f7;
}

/* Paragraphe hero */
p.hero-sub {
  font-size: 18px;
  color: #8a8797;            /* --t2 */
  line-height: 1.7;
  max-width: 540px;
  margin: 0 auto;
}
```

---

### 23C. ESPACEMENT & LAYOUT

#### Radius (coins arrondis)
```css
:root {
  --radius-sm: 12px;         /* Boutons, inputs, petites cartes */
  --radius-md: 16px;         /* Cartes moyennes, FAQ items */
  --radius-lg: 20px;         /* Grandes cartes, video container */
  --radius-xl: 24px;         /* Sections, certificates */
}

/* Boutons CTA: border-radius: 100px (full pill) */
/* Nav bar: border-radius: 100px */
/* Module pills: border-radius: 100px */
```

#### Max-widths (containers)
```
420px  — pills/labels
520px  — descriptions centrees
540px  — paragraphe hero
620px  — cards moyennes
720px  — conteneurs moyens
880px  — grilles
900px  — sections principales
960px  — section video
1140px — navigation (max-width absolu)
```

#### Padding patterns
```css
/* Sections verticales */
section { padding: 120px 32px; }         /* desktop */
section { padding: 80px 20px; }          /* tablet */
section { padding: 60px 16px; }          /* mobile */

/* Cartes */
.card { padding: 24px; }                 /* standard */
.card-large { padding: 28px; }           /* grandes cartes */

/* Nav */
nav { padding: 0 8px 0 28px; }          /* asymetrique — plus a gauche */

/* Footer */
footer { padding: 100px 32px 32px; }     /* gros espace en haut */
```

---

### 23D. NAVIGATION (floating pill bar)

```css
nav {
  position: fixed;
  top: 16px;                              /* flotte en haut */
  left: 50%;
  transform: translateX(-50%);
  max-width: 1140px;
  width: calc(100% - 32px);
  z-index: 100;

  /* Glassmorphism */
  background: rgba(12, 12, 20, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  /* Pill shape */
  border-radius: 100px;
  border: 1px solid rgba(180, 165, 210, 0.14);

  /* Layout */
  padding: 0 8px 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: ~56px;
}

/* Liens nav */
nav a {
  font-size: 14px;
  font-weight: 500;
  color: #8a8797;                         /* --t2 */
  transition: color 0.3s ease;
}

nav a:hover {
  color: #f2f2f7;                         /* --t1 */
}

nav a.active {
  color: #f2f2f7;
  /* Underline via ::after */
}

/* CTA "Enroll now" */
.nav-cta {
  background: #8B5CF6;                    /* --p */
  border-radius: 100px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  border: none;
  height: 42px;
}
```

---

### 23E. CARTES / GLASS CARDS (pattern global)

```css
.card {
  /* Fond gradient sombre */
  background: linear-gradient(180deg,
    rgba(22, 19, 32, 0.55),
    rgba(14, 12, 22, 0.3)
  );

  /* Bordure lavande subtile */
  border: 1px solid rgba(180, 165, 210, 0.09);

  /* Coins arrondis */
  border-radius: 20px;

  /* Highlight: ligne blanche en haut interne */
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

  /* Padding */
  padding: 24px;

  /* Transition pour hover */
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Hover: lift + glow */
.card:hover {
  transform: translateY(-5px);
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(139, 92, 246, 0.15);
}
```

---

### 23F. SECTION LABELS (pattern repetitif)

Chaque section commence par un label uppercase au-dessus du titre :

```css
.section-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: #8B5CF6;            /* --p, toujours purple */
  margin-bottom: 16px;
}

/* Exemples: "YOUR PATH", "FAQ", "WHAT YOU GET", "OUTCOMES" */
```

---

### 23G. FOND ETOILE (canvas)

```css
/* Le fond est un <canvas> plein ecran avec des particules */
/* Taille: 1470 x 1251 (adapte au viewport) */
/* Position: fixed, derriere tout le contenu */
/* Les etoiles sont des points blancs 1-2px */
/* Animation via JS: twinkle (opacity pulse) + drift (leger mouvement) */

/* 6 elements .glow sont positionnes en absolute */
/* Ce sont des radial-gradient purple tres larges et diffus */
/* Ils creent la "brume cosmique" entre les sections */

.section-glow {
  position: absolute;
  width: 600-1000px;
  height: 400-800px;
  background: radial-gradient(
    ellipse at center,
    rgba(139, 92, 246, 0.06-0.12),
    transparent 70%
  );
  pointer-events: none;
  filter: blur(40-80px);
}
```

---

### 23H. EASING CURVES (systeme complet)

```css
/* Curve signature — utilise partout (80% des transitions) */
cubic-bezier(0.22, 1, 0.36, 1)
/* Deceleration forte: demarre vite, finit tres doucement */
/* Feeling: fluide, premium, "snappy" */

/* Pour les cubes sociaux — plus rebondie */
cubic-bezier(0.2, 0.8, 0.2, 1)
/* Plus de "spring" dans le mouvement */

/* Linear — uniquement pour la timeline fill */
linear  /* transition: height 0.08s linear */

/* ease-in-out — pour les boucles infinies */
ease-in-out  /* float, twinkle, glow pulse */

/* ease-out — pour les pulse rings */
ease-out  /* jdotRing, vpulse, cta-ring-pulse */
```

#### Durees par type d'animation
```
0.08s     — Timeline fill (scroll-driven, doit suivre exactement)
0.3-0.4s  — Hover color/opacity changes (rapide, reactif)
0.5-0.6s  — Hover transforms (lift, scale — medium)
0.7s      — Entrance animations (fade-up — delibere)
0.95-1.0s — Social cube entrance (slow reveal)
2.5-3.5s  — Pulse rings, dot rings (boucles lentes)
4-6s      — Float, glow pulse (boucles atmospheriques)
8-15s     — Cometes, border spin (boucles tres lentes)
```

---

### 23I. FOOTER

```css
footer {
  background: #050508;                    /* meme que body */
  padding: 100px 32px 32px;              /* gros espace en haut */
  border-top: 1px solid rgba(180, 165, 210, 0.09);  /* meme que card-border */
  color: #f2f2f7;
  font-size: 16px;
}

/* Le footer a un effet "scan line" anime */
@keyframes footerScan {
  0%, 100% { background-position: 100% 0; }
  50%      { background-position: -100% 0; }
}
```

---

### 23J. SEPARATEURS

```css
/* Deux types de separateurs */

/* 1. Ligne horizontale avec gradient (entre sections) */
.divider {
  width: 100%;
  max-width: 520px;
  height: 1px;
  margin: 0 auto;
  background: linear-gradient(90deg,
    transparent,
    rgba(180, 165, 210, 0.12) 50%,
    transparent
  );
}

/* 2. Bordure de footer/section */
border-top: 1px solid rgba(180, 165, 210, 0.09);
```

---

### 23K. RESUME DU THEME — REGLES DE DESIGN

| Regle | Valeur |
|-------|--------|
| **Fond** | `#050508` quasi-noir avec micro-teinte bleue |
| **Couleur primaire unique** | `#8B5CF6` purple — TOUT est purple |
| **Font unique** | Inter Variable — 1 font, hierarchy par weight/size |
| **Coins** | 12px (petits) → 16px → 20px → 24px (grands), 100px (pills/nav) |
| **Bordures** | `rgba(180,165,210,0.09)` lavande subtile — jamais de blanc dur |
| **Ombres** | Toujours purple-tinted, jamais de noir pur |
| **Highlight interne** | `inset 0 1px 0 rgba(255,255,255,0.04)` sur toutes les cartes |
| **Texte** | 6 niveaux de gris, du blanc `#f2f2f7` au sombre `#575468` |
| **Easing signature** | `cubic-bezier(0.22, 1, 0.36, 1)` |
| **Hover pattern** | lift (-4 a -6px) + border purple + glow purple + scale icones |
| **Scroll pattern** | fade-up (`translateY(32px)→0, opacity 0→1`) |
| **Fond ambient** | Canvas etoiles + glows radiaux purple diffus entre sections |
| **Sections** | Label uppercase purple → H2 → description → contenu |
| **Nav** | Pill flottante, glass blur(20px), fixed top |
| **Max-width global** | 1140px nav, 960px contenu, ~540px texte centre |
