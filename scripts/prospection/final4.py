import json,re,csv
from collections import Counter
F=json.load(open("enrichi.json"))
SOCIAL=('facebook.com','linkedin.com','instagram.com','wixsite.com','business.site','sites.google.com')
EXCL=re.compile(r'(?i)(centre (juridique|communautaire)|aide juridique|clinique juridique|juriseo|curateur|commission des|protecteur|a[ée]roports|ville de|soci[ée]t[ée] de transport|hydro|desjardins|banque|universit[ée]|coll[èe]ge|h[ôo]pital|centre int[ée]gr[ée])')
out=[]
for c in F:
    if not c["tels"] or EXCL.search(c["cabinet"]): continue
    if c.get("match",0)<0.85: continue
    d=c.get("domaine_web","") or ""
    social=bool(d and any(s in d for s in SOCIAL))
    annee=c.get("fonde") or (None if social else c.get("whois_annee"))
    na=c["n_avocats_listes"]
    struct=2 if na==1 else (1 if na<=3 else 0)
    dom=set(c["domaines"])
    fid=2 if len(dom&{"Immobilier","Successions"})>=2 else (1 if dom&{"Immobilier","Successions"} else 0)
    if annee and annee>=2020: jc,jl=3,f"domaine web cree en {annee}"
    elif annee and annee>=2017: jc,jl=2,f"domaine web cree en {annee}"
    elif annee and annee<=2012: jc,jl=-2,f"en ligne depuis {annee}, cabinet etabli"
    elif annee: jc,jl=0,f"domaine web {annee}"
    else: jc,jl=0,"age inconnu, a demander a l'appel"
    info=[]
    if social: info.append("PJ ne liste qu'une page Facebook")
    elif not d: info.append("PJ ne liste aucun site")
    if c.get("copy_min"): info.append(f"site (c) {c['copy_min']}")
    out.append({**c,"tel":c["tels"][0],"ville":c.get("pj_ville") or "/".join(c["villes"]),
      "s_struct":struct,"s_fid":fid,"s_jeune":jc,"score":struct+fid+jc,
      "label_age":jl,"annee":annee,"info":"; ".join(info),
      "fiab":"haute" if c.get("match",0)>=0.85 else "a verifier"})
out.sort(key=lambda c:(-c["score"],-c["s_fid"],-c["s_struct"],c["cabinet"]))
json.dump(out,open("final.json","w"),ensure_ascii=False,indent=1)
print("APPELABLES:",len(out))
print("scores:",sorted(Counter(c["score"] for c in out).items(),reverse=True))
print("jeune confirme:",sum(1 for c in out if c["s_jeune"]>0),"| etabli:",sum(1 for c in out if c["s_jeune"]<0),"| inconnu:",sum(1 for c in out if c["s_jeune"]==0))
print("solos:",sum(1 for c in out if c["s_struct"]==2),"| 2-3 avocats:",sum(1 for c in out if c["s_struct"]==1))
print("fideicommis lourd (2 domaines+):",sum(1 for c in out if c["s_fid"]==2))
with open("liste_prospection.csv","w",newline="",encoding="utf-8-sig") as fh:
    w=csv.writer(fh)
    w.writerow(["Rang","Score /7","Cabinet","Ville","Telephone","Avocat(s) au Tableau de l'Ordre","Domaines de droit",
      "Structure /2","Fideicommis /2","Age /3","Signal age","Annee domaine","Autres indices","Site","Adresse","Fiabilite numero",
      "ETAT","Date appel","Qui a repondu","Nb avocats confirme","Adjointe ?","Cabinet depuis quand ?","Leurs mots exacts","Prochaine action","Date relance"])
    for i,c in enumerate(out,1):
        w.writerow([i,c["score"],c["cabinet"],c["ville"],c["tel"]," | ".join(c["avocats"][:3]),", ".join(c["domaines"]),
          c["s_struct"],c["s_fid"],c["s_jeune"],c["label_age"],c["annee"] or "",c["info"],
          c.get("domaine_web",""),c.get("adresse",""),c["fiab"],"A_APPELER","","","","","","","",""])
print()
for c in out[:14]:
    print(f"  {c['score']:2d} {c['cabinet'][:34]:36s} {c['ville'][:15]:17s} {c['tel']:14s} {c['label_age'][:34]}")
