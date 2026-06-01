/**
 * SAFE — En-tête de document centralisé (react-pdf).
 *
 * SOURCE UNIQUE de l'identité visuelle de cabinet en haut des documents PDF :
 *   - facture (`lib/invoice-template/InvoiceDocument.tsx`)
 *   - (à venir) mandat, lettre d'ouverture, et autres documents cabinet.
 *
 * Doctrine :
 *   - Aucune logique métier : reçoit un objet `cabinet` déjà présenté.
 *   - Respecte la RÈGLE DURE CEO (2026-05-12) : une seule couleur d'accent
 *     (vert de marque) + neutres. Aucun n° de Barreau ici (donnée confidentielle,
 *     jamais sur un document client de facturation).
 *   - Mise en page : colonne gauche = identité (logo + nom + coordonnées),
 *     emplacement droit optionnel (`right`) pour le contexte propre au document
 *     (n° de facture + dates, n° de mandat, etc.).
 */

import * as React from "react";
import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { colors, fontSize, font, spacing } from "@/lib/invoice-template/tokens";

export interface LetterheadCabinet {
  nom?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sectionGap,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.brand,
  },
  headerLeft: { flexDirection: "column", flex: 1 },
  logo: { width: 110, height: 50, objectFit: "contain", marginBottom: 6 },
  cabinetName: {
    fontSize: fontSize.blockTitle,
    fontFamily: font.bold,
    color: colors.brand,
    marginBottom: 2,
  },
  cabinetMeta: {
    fontSize: fontSize.bodySmall,
    color: colors.textMuted,
    lineHeight: 1.4,
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    paddingLeft: 16,
  },
});

interface LetterheadProps {
  cabinet: LetterheadCabinet | null | undefined;
  /** Contenu optionnel aligné à droite (n° de facture + dates, etc.). */
  right?: React.ReactNode;
  /** Répète l'en-tête en haut de chaque page (react-pdf `fixed`). */
  fixed?: boolean;
}

/**
 * En-tête identité du cabinet — bloc partagé entre documents PDF.
 *
 * Usage :
 *   <Letterhead cabinet={cabinet} right={<MonBlocDroit />} fixed />
 */
export function Letterhead({ cabinet, right, fixed }: LetterheadProps) {
  return (
    <View style={styles.header} fixed={fixed}>
      <View style={styles.headerLeft}>
        {cabinet?.logoUrl ? <Image style={styles.logo} src={cabinet.logoUrl} /> : null}
        <Text style={styles.cabinetName}>{cabinet?.nom ?? "—"}</Text>
        {cabinet?.adresse ? <Text style={styles.cabinetMeta}>{cabinet.adresse}</Text> : null}
        {cabinet?.telephone ? <Text style={styles.cabinetMeta}>{cabinet.telephone}</Text> : null}
        {cabinet?.email ? <Text style={styles.cabinetMeta}>{cabinet.email}</Text> : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}
