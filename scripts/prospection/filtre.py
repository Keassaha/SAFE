import json, re, unicodedata
from collections import defaultdict

rows = json.load(open("bottin_raw.json"))

# regroupe par (cabinet, ville) -> avocats + domaines
firms = defaultdict(lambda: {"avocats":set(),"domaines":set(),"regions":set(),"villes":set()})
sans_cabinet = 0
for r in rows:
    cab = r["cabinet"].strip()
    if not cab:
        sans_cabinet += 1
        continue
    key = re.sub(r'\s+',' ', cab).lower()
    f = firms[key]
    f["nom_affiche"] = cab
    f["avocats"].add(r["nom"]); f["domaines"].add(r["domaine"])
    f["regions"].add(r["region"]); f["villes"].add(r["ville"])

print("lignes:", len(rows), "| sans cabinet declare:", sans_cabinet, "| cabinets distincts:", len(firms))

# exclusions dures : grands cabinets, aide juridique, gouvernement, syndicats, in-house
EXCL = re.compile(r'(?i)\b(s\.?e\.?n\.?c\.?r\.?l|llp|s\.e\.n\.c|centre communautaire juridique|aide juridique|commission|directeur des poursuites|dpcp|ministere|ministère|ville de|procureur general|procureure|gouvernement|université|universite|cegep|syndicat|union des|federation|fédération|banque|desjardins|hydro|sun life|industrielle|inc\. \(services juridiques\)|s\.a\.|societe quebecoise|curateur|tribunal|cour |soquij|revenu quebec|revenu québec|autorite des marches|caisse|assurance|mutuelle|croix bleue|bell |videotron|vidéotron|cn |cae |bombardier|pratt|air canada)\b')

# motif "petit cabinet" : nom de personne, "Me X", "X avocat(e)", "X & Y"
SOLO = re.compile(r'(?i)(^me\s|avocat|avocate|avocats|avocates|juridique|legal|law|cabinet|notaire|s\.a\.?$|inc\.?$)')

candidats = []
for key, f in firms.items():
    nom = f["nom_affiche"]
    if EXCL.search(nom): continue
    n_avocats = len(f["avocats"])
    if n_avocats > 4: continue          # trop gros
    candidats.append({
        "cabinet": nom,
        "n_avocats_listes": n_avocats,
        "avocats": sorted(f["avocats"]),
        "villes": sorted(f["villes"]),
        "regions": sorted(f["regions"]),
        "domaines": sorted(f["domaines"]),
    })

candidats.sort(key=lambda c: (-len(c["domaines"]), c["n_avocats_listes"], c["cabinet"]))
json.dump(candidats, open("candidats.json","w"), ensure_ascii=False, indent=1)

print("candidats apres exclusion:", len(candidats))
print()
print("== repartition par nb d'avocats listes ==")
d=defaultdict(int)
for c in candidats: d[c["n_avocats_listes"]]+=1
for k in sorted(d): print(f"  {k} avocat(s): {d[k]}")
print()
print("== 40 candidats les plus multi-domaines (fideicommis lourd) ==")
for c in candidats[:40]:
    print(f"  [{c['n_avocats_listes']}] {c['cabinet'][:52]:54s} {'/'.join(c['villes'])[:22]:24s} {','.join(c['domaines'])}")
