import urllib.request,urllib.parse,re,html,time,json,sys,os,hashlib
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"
PROF=[16,10,10,6,6,14,6,6,6,6,8,6,6,8,8,4,4,4,6,6,4,8,4,6,3,3,3,4,3,3]
VILLES=["Montreal+QC","Laval+QC","Longueuil+QC","Brossard+QC","Saint-Hubert+QC","Montreal+QC",
        "Boucherville+QC","Saint-Lambert+QC","Repentigny+QC","Terrebonne+QC","Saint-Jerome+QC",
        "Blainville+QC","Saint-Eustache+QC","Joliette+QC","Saint-Jean-sur-Richelieu+QC",
        "Saint-Hyacinthe+QC","Beloeil+QC","Chambly+QC","La+Prairie+QC","Vaudreuil-Dorion+QC",
        "Salaberry-de-Valleyfield+QC","Sorel-Tracy+QC","Granby+QC","Mascouche+QC","Sainte-Therese+QC",
        "Mirabel+QC","Varennes+QC","Candiac+QC","Chateauguay+QC","Sainte-Julie+QC"]
os.makedirs("pjcache",exist_ok=True)
def get(u):
    f="pjcache/"+hashlib.md5(u.encode()).hexdigest()+".html"
    if os.path.exists(f): return open(f,encoding="utf-8").read()
    r=urllib.request.Request(u,headers={"User-Agent":UA,"Accept-Language":"fr-CA,fr;q=0.9"})
    h=urllib.request.urlopen(r,timeout=60).read().decode("utf-8","replace")
    open(f,"w",encoding="utf-8").write(h); time.sleep(0.5); return h
def txt(x):
    x=re.sub(r'(?is)<(script|style|svg).*?</\1>',' ',x)
    return re.sub(r'\s+',' ',html.unescape(re.sub(r'(?s)<[^>]+>',' ',x))).strip()
L=json.load(open("pj_listings.json"))
for v,maxp in zip(VILLES,PROF):
    for p in range(1,maxp+1):
        for cat in ("avocats",):
            try: h=get(f"https://www.pagesjaunes.ca/search/si/{p}/{cat}/{v}")
            except Exception as e: print("ERR",v,p,e,file=sys.stderr); break
            n0=len(L)
            for b in re.split(r'(?=<div class="listing__content__wrap)',h)[1:]:
                nm=re.search(r'(?s)class="listing__name[^"]*"[^>]*>(.*?)</(?:a|h3|div)>',b)
                if not nm: continue
                name=txt(nm.group(1))
                if not name or len(name)>90: continue
                tels=[]
                for x in re.findall(r'data-phone="([0-9\-]{10,14})"',b)+re.findall(r'<h4\s*>([0-9]{3}-[0-9]{3}-[0-9]{4})</h4>',b):
                    if x not in tels: tels.append(x)
                addr=re.search(r'(?s)class="listing__address--full[^"]*"[^>]*>(.*?)</span>',b)
                w=re.search(r'/gourl/[^"?]+\?redirect=([^"&]+)',b)
                k=re.sub(r'[^a-z0-9]','',name.lower())
                if k and k not in L:
                    L[k]={"nom":name,"tels":tels,"adresse":txt(addr.group(1)) if addr else "",
                          "ville":v.replace("+"," ").replace(" QC",""),
                          "site":urllib.parse.unquote(w.group(1)) if w else ""}
            if len(L)==n0 and p>1: break
    print(f"{v:30s} -> cumul {len(L)}",flush=True)
json.dump(L,open("pj_listings.json","w"),ensure_ascii=False,indent=1)
print("TOTAL:",len(L))
