import urllib.request, urllib.parse, re, html, time, json, sys

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"
BASE = "https://www.barreau.qc.ca/fr/trouver-un-avocat/resultats/"

REGIONS = {"14":"Longueuil","15":"Laval","06":"Laurentides-Lanaudiere","09":"Richelieu","07":"Montreal"}
DOMAINES = {"450":"Famille","155":"Immobilier","474":"Successions"}

def fetch(params):
    url = BASE + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent":UA,"Accept-Language":"fr-CA,fr;q=0.9"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8","replace")

def parse(h):
    """rows: (nom, ville, cabinet)"""
    out=[]
    m = re.search(r'(?s)<table.*?</table>', h)
    if not m: return out, 0
    tbl = m.group(0)
    total = 0
    tm = re.search(r'([\d\s]+)\s*r[ée]sultats', h)
    if tm:
        try: total=int(re.sub(r'\D','',tm.group(1)))
        except: pass
    for tr in re.findall(r'(?s)<tr>(.*?)</tr>', tbl):
        if '<th' in tr: continue
        cells = re.findall(r'(?s)<td[^>]*>(.*?)</td>', tr)
        if len(cells) < 3: continue
        def clean(c):
            c = re.sub(r'(?is)<(script|style|svg).*?</\1>',' ',c)
            c = html.unescape(re.sub(r'(?s)<[^>]+>','\n',c))
            return [x.strip() for x in c.split('\n') if x.strip()]
        nom = clean(cells[0]); ville = clean(cells[1]); cab = clean(cells[2])
        out.append({
            "nom": nom[0] if nom else "",
            "ville": ville[0] if ville else "",
            "cabinet": cab[0] if cab else "",
        })
    return out, total

rows=[]
for rc, rn in REGIONS.items():
    for dc, dn in DOMAINES.items():
        p=1
        while p <= 12:
            try:
                h = fetch({"p":p,"sop":dc,"r":rc}) if p>1 else fetch({"sop":dc,"r":rc})
            except Exception as e:
                print("ERR", rn, dn, p, e, file=sys.stderr); break
            batch, total = parse(h)
            if not batch: break
            for b in batch:
                b["region"]=rn; b["domaine"]=dn
            rows += batch
            if p==1: print(f"{rn:24s} {dn:12s} total={total}", flush=True)
            if len(rows) and total and p*25 >= total: break
            p+=1
            time.sleep(0.5)
        time.sleep(0.4)

json.dump(rows, open("bottin_raw.json","w"), ensure_ascii=False, indent=1)
print("LIGNES BRUTES:", len(rows))
