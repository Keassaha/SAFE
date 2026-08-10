import re,html,json,glob,urllib.parse
def txt(x):
    x=re.sub(r'(?is)<(script|style|svg).*?</\1>',' ',x)
    return re.sub(r'\s+',' ',html.unescape(re.sub(r'(?s)<[^>]+>',' ',x))).strip()
L={}
for f in glob.glob("pjcache/*.html"):
    h=open(f,encoding="utf-8",errors="replace").read()
    for b in re.split(r'(?=<div class="listing__content__wrap)',h)[1:]:
        nm=re.search(r'(?s)class="listing__name[^"]*"[^>]*>(.*?)</(?:a|h3|div)>',b)
        if not nm: continue
        name=txt(nm.group(1))
        if not name or len(name)>90: continue
        tels=[]
        for x in re.findall(r'data-phone="([0-9\-]{10,14})"',b)+re.findall(r'<h4\s*>([0-9]{3}-[0-9]{3}-[0-9]{4})</h4>',b):
            if x not in tels: tels.append(x)
        def ip(p):
            m=re.search(r'itemprop="'+p+r'"\s*>(.*?)</span>',b,re.S)
            return txt(m.group(1)) if m else ""
        rue,ville,cp=ip("streetAddress"),ip("addressLocality"),ip("postalCode")
        w=re.search(r'/gourl/[^"?]+\?redirect=([^"&]+)',b)
        k=re.sub(r'[^a-z0-9]','',name.lower())
        rec={"nom":name,"tels":tels,"rue":rue,"ville":ville,"cp":cp,
             "site":urllib.parse.unquote(w.group(1)) if w else ""}
        if k and (k not in L or (not L[k]["ville"] and ville) or (not L[k]["site"] and rec["site"])):
            if k in L and L[k]["tels"] and not tels: rec["tels"]=L[k]["tels"]
            L[k]=rec
json.dump(L,open("pj_listings.json","w"),ensure_ascii=False,indent=1)
print("fiches:",len(L),"| avec ville:",sum(1 for v in L.values() if v["ville"]),
      "| avec site:",sum(1 for v in L.values() if v["site"]),
      "| avec tel:",sum(1 for v in L.values() if v["tels"]))
