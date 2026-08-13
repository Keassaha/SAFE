import { paletteDeclarations } from "@/lib/ds/palettes";

/**
 * Émet les variables CSS de la palette de l'application.
 *
 * `href` + `precedence` : React hisse la feuille dans le <head> et la
 * dédoublonne, sans passer par un <head> manuel (non supporté par l'App
 * Router). Les variables existent donc avant le premier peinturage.
 */
export function PaletteStyles() {
  return (
    <style
      href="safe-palette"
      precedence="high"
      dangerouslySetInnerHTML={{ __html: `:root{${paletteDeclarations()}}` }}
    />
  );
}
