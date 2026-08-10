import json,re,unicodedata,socket,urllib.request,ssl,os,subprocess,html
from concurrent.futures import ThreadPoolExecutor
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"
ctx=ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
F=json.load(open("final.json"))
def asc(s):
    return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
STOP={'inc','ltee','senc','sencrl','avocat','avocats','avocate','avocates','cabinet','me','maitre',
      'et','associes','associees','etude','societe','nominale','de','du','des','la','le','les','l','d','s','a'}
def cands(nom):
    toks=[t for t in re.split(r'[^A-Za-zÀ-ÿ0-9]+',nom) if t]
    core=[asc(t) for t in toks if asc(t) and asc(t) not in STOP]
    core=[c for c in core if len(c)>2]
    if not core: return []
    base=[]
    j=''.join(core)
    if len(j)<=28: base.append(j)
    if len(core)>=2: base.append(''.join(core[:2]))
    base.append(core[0] if len(core[0])>4 else ''.join(core[:2]))
    out=[]
    for b in dict.fromkeys([x for x in base if 4<=len(x)<=30]):
        for suf in ("avocat","avocats",""):
            for tld in (".ca",".com"):
                d=b+suf+tld
                if d not in out: out.append(d)
    return out[:10]
def resolves(d):
    try: socket.getaddrinfo(d,443,proto=socket.IPPROTO_TCP); return True
    except Exception: return False
def confirms(d,nom):
    for u in (f"https://{d}",f"http://{d}"):
        try:
            r=urllib.request.Request(u,headers={"User-Agent":UA})
            h=urllib.request.urlopen(r,timeout=12,context=ctx).read().decode("utf-8","replace")
        except Exception: continue
        t=asc(html.unescape(re.sub(r'(?s)<[^>]+>',' ',h)))
        toks=[asc(x) for x in re.split(r'[^A-Za-zÀ-ÿ]+',nom) if asc(x) and asc(x) not in STOP and len(asc(x))>3]
        if not toks: return None
        hits=sum(1 for x in toks if x in t)
        if hits>=min(2,len(toks)) and ('avocat' in t or 'juridique' in t or 'droit' in t): return u
    return None
def wy(d):
    f="wcache/w_"+d+".txt"
    def p(o):
        m=re.search(r'(?im)^\s*(?:Creation Date|Domain Registration Date|Created Date|Registered Date)\s*:\s*(\d{4})-(\d{2})',o)
        return int(m.group(1)) if m else None
    if os.path.exists(f):
        y=p(open(f,encoding="utf-8",errors="replace").read())
        if y: return y
    try:
        host="whois.verisign-grs.com" if d.endswith((".com",".net")) else None
        o=subprocess.run(["whois"]+(["-h",host,"="+d] if host else [d]),capture_output=True,text=True,timeout=25).stdout
        open(f,"w",encoding="utf-8").write(o); return p(o)
    except Exception: return None
todo=[c for c in F if not c.get("domaine_web")]
print("cabinets sans domaine connu:",len(todo))
def work(c):
    for d in cands(c["cabinet"]):
        if not resolves(d): continue
        u=confirms(d,c["cabinet"])
        if u:
            c["domaine_devine"]=d; c["annee_devinee"]=wy(d); return c
    return c
with ThreadPoolExecutor(max_workers=14) as ex: todo=list(ex.map(work,todo))
found=[c for c in todo if c.get("domaine_devine")]
print("domaines retrouves:",len(found),"| avec annee:",sum(1 for c in found if c.get("annee_devinee")))
for c in found[:25]: print(f"  {c['cabinet'][:34]:36s} -> {c['domaine_devine']:32s} {c.get('annee_devinee')}")
json.dump({c["tel"]:{"d":c["domaine_devine"],"y":c.get("annee_devinee")} for c in found},open("devines.json","w"))
