import json,re,subprocess,urllib.request,urllib.parse,html,os,hashlib,unicodedata,ssl
from concurrent.futures import ThreadPoolExecutor
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"
SOCIAL={'facebook.com','linkedin.com','instagram.com','twitter.com','x.com','wixsite.com','business.site','sites.google.com','youtube.com'}
rows=[c for c in json.load(open("joint.json")) if c["tels"]]

def nk(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]','',re.sub(r'\b(inc|ltee|sencrl|senc|avocat|avocats|avocate|avocates|cabinet|me|et|associes)\b',' ',s))
EXCL={'barreauduquebec','therriencouturejolicoeur','alepingauthier','juriseoavocats'}
seen={}
for c in rows:
    if nk(c["cabinet"]) in EXCL: continue
    k=c["tels"][0]
    p=seen.get(k)
    if p:
        p["domaines"]=sorted(set(p["domaines"])|set(c["domaines"]))
        p["avocats"]=sorted(set(p["avocats"])|set(c["avocats"]))
        p["villes"]=sorted(set(p["villes"])|set(c["villes"]))
        if len(c["cabinet"])>len(p["cabinet"]): p["cabinet"]=c["cabinet"]
    else: seen[k]=c
firms=list(seen.values()); print("apres dedup:",len(firms))

def dom(u):
    if not u: return ""
    try:
        d=urllib.parse.urlparse(u if "://" in u else "http://"+u).netloc.lower()
        return d[4:] if d.startswith("www.") else d
    except: return ""
os.makedirs("wcache",exist_ok=True); os.makedirs("scache",exist_ok=True)
def wy(d):
    if not d or any(s in d for s in SOCIAL): return None
    f="wcache/w_"+d+".txt"
    out=open(f,encoding="utf-8",errors="replace").read() if os.path.exists(f) else ""
    def p(o): 
        m=re.search(r'(?im)^\s*(?:Creation Date|Domain Registration Date|Created Date|Registered Date|created)\s*:\s*(\d{4})-(\d{2})',o); return int(m.group(1)) if m else None
    y=p(out)
    if y is None:
        try:
            host="whois.verisign-grs.com" if d.endswith((".com",".net")) else None
            cmd=["whois"]+(["-h",host,"="+d] if host else [d])
            o2=subprocess.run(cmd,capture_output=True,text=True,timeout=25).stdout
            y=p(o2); open(f,"w",encoding="utf-8").write(o2)
        except Exception: pass
    return y
ctx=ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
def scan(u):
    if not u: return {}
    f="scache/"+hashlib.md5(u.encode()).hexdigest()+".html"
    if os.path.exists(f): h=open(f,encoding="utf-8",errors="replace").read()
    else:
        h=""
        for cand in ([u] if "://" in u else ["https://"+u]):
            try:
                r=urllib.request.Request(cand,headers={"User-Agent":UA,"Accept-Language":"fr-CA,fr;q=0.9"})
                h=urllib.request.urlopen(r,timeout=18,context=ctx).read().decode("utf-8","replace"); break
            except Exception: pass
        open(f,"w",encoding="utf-8").write(h)
    if not h: return {}
    t=re.sub(r'(?is)<(script|style).*?</\1>',' ',h)
    t=re.sub(r'\s+',' ',html.unescape(re.sub(r'(?s)<[^>]+>',' ',t)))
    r={"site_ok":True}
    m=re.search(r'(?i)(?:depuis|fond[ée]e?\s+en|cr[ée][ée]e?\s+en|ouvert[e]?\s+en)\s+(19[89]\d|20[0-2]\d)',t)
    if m: r["fonde"]=int(m.group(1))
    y=[int(x) for x in re.findall(r'(?:©|Copyright)\s*(20[0-2]\d)',t)]
    if y: r["copy_min"]=min(y)
    noms=set(re.findall(r'\bMe\s+([A-ZÉÈÀÇ][a-zéèêàçûôîï\-]{2,15}\s+[A-ZÉÈÀÇ][a-zéèêàçûôîï\-]{2,20})',t))
    r["equipe_site"]=len(noms)
    r["mots_cles"]=[k for k in ["fidéicommis","fideicommis","compte en fiducie","adjointe","secrétaire juridique","technicien"] if k in t.lower()]
    return r
def work(c):
    d=dom(c.get("site","")); c["domaine_web"]=d
    c["reseau_social_seul"]= bool(d and any(s in d for s in SOCIAL))
    c["whois_annee"]=wy(d)
    c.update(scan(c.get("site","")))
    return c
with ThreadPoolExecutor(max_workers=12) as ex: firms=list(ex.map(work,firms))
json.dump(firms,open("enrichi.json","w"),ensure_ascii=False,indent=1)
from collections import Counter
print("annee domaine:",len([f for f in firms if f.get("whois_annee")]))
print(sorted(Counter(f["whois_annee"] for f in firms if f.get("whois_annee")).items()))
print("sans site du tout:",sum(1 for f in firms if not f.get("domaine_web")))
print("reseau social seul:",sum(1 for f in firms if f.get("reseau_social_seul")))
