import json,re,unicodedata
from difflib import SequenceMatcher
cands=json.load(open("candidats.json")); pj=json.load(open("pj_listings.json"))
STOP={'inc','ltee','ltd','sencrl','senc','sa','avocat','avocats','avocate','avocates','cabinet',
      'me','maitre','et','associes','associees','notaire','notaires','societe','nominale','legal',
      'law','group','groupe','services','juridique','juridiques','etude','les','le','la','de','du','des','d','l'}
def toks(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    return [t for t in re.split(r'[^a-z0-9]+',s) if t and t not in STOP and len(t)>1]
pjt=[(set(toks(v["nom"])),' '.join(toks(v["nom"])),v) for v in pj.values()]
out=[]
for c in cands:
    ct=set(toks(c["cabinet"])); cs=' '.join(toks(c["cabinet"]))
    if not ct: continue
    best=(0,None)
    for pt,ps,v in pjt:
        if not pt: continue
        inter=ct&pt
        if not inter: continue
        jac=len(inter)/len(ct|pt)
        ratio=SequenceMatcher(None,cs,ps).ratio()
        # bon match : tous les tokens du cabinet Barreau presents, OU forte similarite
        contain = (ct<=pt or pt<=ct) and min(len(ct),len(pt))>=2
        score=max(jac, ratio, 1.0 if contain else 0)
        if min(len(ct),len(pt))==1 and score<0.9: continue
        if score>best[0]: best=(score,v)
    c2=dict(c)
    if best[0]>=0.72 and best[1]:
        v=best[1]; c2.update({"tels":v["tels"],"adresse":(v["rue"]+", "+v["ville"]+" "+v["cp"]).strip(", "),"site":v["site"],
                              "pj_nom":v["nom"],"pj_ville":v["ville"],"match":round(best[0],2)})
    else:
        c2["tels"]=[]; c2["match"]=round(best[0],2)
    out.append(c2)
json.dump(out,open("joint.json","w"),ensure_ascii=False,indent=1)
print("candidats:",len(out),"| avec telephone:",sum(1 for c in out if c["tels"]))
