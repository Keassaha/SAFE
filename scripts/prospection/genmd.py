import json,csv,os
F=json.load(open("final.json"))
D="/Users/Bookkeeping/SAAS - SAFE 02/docs/marketing/ventes"
os.makedirs(D,exist_ok=True)

jeunes=[c for c in F if c["s_jeune"]>0]
inconnus=[c for c in F if c["s_jeune"]==0]
etablis=[c for c in F if c["s_jeune"]<0]
rodage=[c for c in inconnus if c["score"]<=1][:5]
reste=[c for c in inconnus if c not in rodage]

def row(c,n=None):
    p=f"| {n} " if n else "| "
    av=(c["avocats"][0] if c["avocats"] else "")
    return (p+f"| **{c['cabinet']}** | {c['ville']} | `{c['tel']}` | {av} | "
            f"{', '.join(c['domaines'])} | {c['score']} | {c['label_age']} |")
HEAD="| # | Cabinet | Ville | Téléphone | Avocat au Tableau | Domaines | Score | Âge du cabinet |\n|---|---|---|---|---|---|---|---|"

# --- plan d'appels : 4 semaines x 5 jours x 5 appels
ordre = rodage + jeunes + [c for c in reste if c["score"]>=3] + [c for c in reste if c["score"]<3] + etablis
JOURS=["lundi","mardi","mercredi","jeudi","vendredi"]
plan=[]
for s in range(4):
    for j in range(5):
        i=(s*5+j)*5
        lot=ordre[i:i+5]
        if lot: plan.append((s+1,JOURS[j],lot))

L=[]
L.append(f"""# Liste de prospection · jeunes cabinets et petits cabinets du Québec

**Constituée le 2026-08-08 · {len(F)} cabinets appelables · Grand Montréal, Rive-Sud, Rive-Nord, Montérégie**

Fichier de travail : [liste_prospection.csv](liste_prospection.csv) (à ouvrir dans un tableur, une ligne par cabinet, colonnes de suivi déjà en place).
Profil de cible : [ICP_JEUNE_CABINET_QC.md](ICP_JEUNE_CABINET_QC.md) · Suivi quotidien : [SUIVI_QUOTIDIEN_5_APPELS.md](SUIVI_QUOTIDIEN_5_APPELS.md) · Script : [SCRIPT_APPEL_v3.md](SCRIPT_APPEL_v3.md)

---

## Ce que vous devez lire avant de composer le premier numéro

**1. D'où viennent ces cabinets, et d'où viennent ces numéros.**
Les cabinets et leurs domaines de droit viennent du **Tableau de l'Ordre du Barreau du Québec**, par
la recherche par critères, qui est publique et dont c'est l'usage prévu. Les **numéros de téléphone
ne viennent pas du Barreau**. Ils viennent des **Pages Jaunes**, c'est-à-dire de l'endroit où chaque
cabinet a lui-même publié son numéro pour qu'on l'appelle.

Cette séparation est volontaire. Le Barreau écrit explicitement que les coordonnées de son bottin
n'ont pas été fournies pour de la sollicitation commerciale et qu'un tel usage est abusif. Ses fiches
individuelles sont d'ailleurs protégées par un captcha. Vous vendez un produit de conformité à des
avocats : la manière dont votre liste a été bâtie doit pouvoir se raconter à voix haute. Elle le peut.

**2. Les numéros sont fiables, l'âge des cabinets ne l'est qu'en partie.**
Huit numéros pris au hasard ont été vérifiés à la main contre une source indépendante, sept étaient
exacts. En revanche, l'âge d'un cabinet n'est nulle part public au Québec. La colonne « Âge » repose
sur la **date de création du nom de domaine web**, qui est une bonne approximation quand elle existe :
**{len(jeunes)} cabinets sont confirmés récents**, {len(etablis)} sont confirmés établis et déprioritisés,
et **{len(inconnus)} restent à déterminer**. Pour ceux-là, l'âge se demande à l'appel. C'est même une
bonne question d'ouverture, voir l'ICP.

**3. Le nom du cabinet peut être une variante.**
Un même cabinet apparaît parfois sous deux graphies entre les deux sources. Le numéro reste bon.
Confirmez le nom quand on décroche, ce que le script fait déjà naturellement.

---

## Le plan des quatre premières semaines

Cinq appels par jour, du lundi au vendredi, soit 25 cabinets par semaine. À trois minutes par appel
plus la note de suivi, c'est **35 à 40 minutes par jour**, environ 3 h par semaine. Vous restez sous
le plafond de 4 h que vous vous êtes fixé, et il vous reste de la marge pour les relances.

**Les cinq appels du lundi de la semaine 1 sont des cabinets que vous ne cherchez pas à convertir.**
Score bas, volontairement. On brûle son trac sur eux. Cette règle vient du script v3 et elle est
gardée telle quelle.
""")
for s,j,lot in plan:
    t="rodage, on ne cherche rien" if (s==1 and j=="lundi") else ""
    L.append(f"\n### Semaine {s} · {j}" + (f" — _{t}_" if t else ""))
    L.append("")
    L.append(HEAD)
    for k,c in enumerate(lot,1): L.append(row(c,k))
L.append(f"""

---

## Liste complète, classée

Le classement combine trois axes seulement, ceux qui sont réellement mesurables :
la **structure** (un seul avocat au Tableau vaut 2, deux ou trois valent 1),
le **fidéicommis** (deux domaines fiduciaires valent 2, un seul vaut 1),
et l'**âge** (domaine web créé en 2020 ou après vaut 3, entre 2017 et 2019 vaut 2,
2012 ou avant retire 2 points). Maximum 7.

Un axe « sous-outillage » avait été calculé puis **retiré** : les Pages Jaunes ne listent pas
systématiquement le site d'un cabinet, si bien que « pas de site web » était faux une fois sur deux.
Il vous aurait fait appeler des cabinets établis depuis 1996 en croyant qu'ils démarraient.

### A · Cabinets récents confirmés ({len(jeunes)}) — à appeler en premier
""")
L.append(HEAD)
for k,c in enumerate(jeunes,1): L.append(row(c,k))
L.append(f"\n### B · Âge à confirmer à l'appel ({len(inconnus)})\n")
L.append(HEAD)
for k,c in enumerate(reste,1): L.append(row(c,k))
L.append(f"\n### C · Cabinets établis ({len(etablis)}) — réserve, à ne pas appeler en priorité\n")
L.append(HEAD)
for k,c in enumerate(etablis,1): L.append(row(c,k))
L.append("""

---

## Quand la liste descend sous 50 cabinets non contactés

La méthode est reproductible en une heure. Elle est scriptée et documentée dans le journal du jour.

1. **Tableau de l'Ordre**, recherche par critères : `barreau.qc.ca/fr/trouver-un-avocat/resultats/?sop=<domaine>&r=<région>`.
   Domaines à fidéicommis : `450` Famille, `155` Immobilier, `474` Successions, `465` Divorce, `250` Criminel.
   Régions non encore exploitées : `08` Québec, `05` Outaouais, `12` Mauricie, `10` Saint-François,
   `02` Arthabaska, `11` Saguenay, `03` Bas-Saint-Laurent, `01` Abitibi.
2. Garder les cabinets de 1 à 3 avocats, écarter les S.E.N.C.R.L., l'aide juridique et les contentieux d'entreprise.
3. Croiser sur les Pages Jaunes par ville pour obtenir le numéro publié par le cabinet.
4. Créer la date du nom de domaine par `whois` pour l'axe âge.

**Les régions de Québec et de l'Outaouais n'ont pas été récoltées.** Elles représentent à elles
seules de quoi doubler cette liste.
""")
open(D+"/LISTE_PROSPECTION_QC_2026-08-08.md","w",encoding="utf-8").write("\n".join(L))
with open(D+"/liste_prospection.csv","w",newline="",encoding="utf-8-sig") as fh:
    w=csv.writer(fh)
    w.writerow(["Rang","Score /7","Cabinet","Ville","Telephone","Avocat(s) au Tableau de l'Ordre","Domaines de droit",
      "Structure /2","Fideicommis /2","Age /3","Signal age","Annee domaine","Autres indices","Site","Adresse","Fiabilite numero",
      "ETAT","Date appel","Qui a repondu","Nb avocats confirme","Adjointe ?","Cabinet depuis quand ?","Leurs mots exacts","Prochaine action","Date relance"])
    for i,c in enumerate(F,1):
        w.writerow([i,c["score"],c["cabinet"],c["ville"],c["tel"]," | ".join(c["avocats"][:3]),", ".join(c["domaines"]),
          c["s_struct"],c["s_fid"],c["s_jeune"],c["label_age"],c.get("annee") or "",c.get("info",""),
          c.get("domaine_web",""),c.get("adresse",""),c["fiab"],"A_APPELER","","","","","","","",""])
print("ecrit:",len(F),"cabinets |",len(plan),"jours planifies")
print("A:",len(jeunes),"B:",len(reste),"C:",len(etablis),"rodage:",len(rodage))
