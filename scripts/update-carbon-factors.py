"""
Met à jour src/lib/carbonFactors.json : facteurs d'émission des trains (g CO2e par voyageur-km) utilisés
par src/lib/carbon.ts pour l'empreinte carbone des trajets. À lancer une fois par an, en novembre :

    python scripts/update-carbon-factors.py

puis relire le résumé affiché (anciennes → nouvelles valeurs) et `git diff src/lib/carbonFactors.json`.

Principe : toujours le mix électrique du pays (pas l'électricité « verte » des contrats des opérateurs),
périmètre exploitation (énergie consommée par les trains), du plus précis au plus général :
  1. par type de train (trainTypes) : compagnies britanniques (ORR), catégories SNCF ;
  2. par pays et catégorie (countries) : France (SNCF), Allemagne (UBA), Royaume-Uni (ORR, moyenne) ;
  3. ailleurs, modèle : énergie consommée par voyageur-km × intensité carbone de l'électricité du pays (Ember).

Téléchargé automatiquement :
  - ORR, table 6103 : g CO2e / voyageur-km par compagnie britannique (publiée chaque année en octobre-novembre)
  - SNCF Voyageurs, open data « Émissions de CO2e - périmètre usage » (actualisé vers octobre-janvier)
  - Ember via Our World in Data : intensité carbone de l'électricité par pays (actualisée en avril)
Saisi à la main dans MANUAL ci-dessous (vérifier chaque année) :
  - Umweltbundesamt (UBA), émissions des trains en Allemagne : https://www.umweltbundesamt.de/themen/verkehr/emissionsdaten
  - Énergie de traction par voyageur-km (SBB, rapport de développement durable)
"""
import csv
import io
import json
import re
import statistics
import sys
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src/lib/carbonFactors.json"

ORR_PAGE = "https://dataportal.orr.gov.uk/statistics/infrastructure-and-environment/rail-environment/table-6103-estimates-of-normalised-passenger-carbon-dioxide-equivalent-co2e-emissions-by-operator/"
SNCF_API = "https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/emission-co2-perimetre-usage"
SNCF_PAGE = "https://ressources.data.sncf.com/explore/dataset/emission-co2-perimetre-usage/"
EMBER_CSV = "https://ourworldindata.org/grapher/carbon-intensity-electricity.csv?v=1&csvType=full&useColumnShortNames=true"
EMBER_PAGE = "https://ourworldindata.org/grapher/carbon-intensity-electricity"

# Valeurs relevées à la main : à revoir chaque année (date de la source dans "period")
MANUAL = {
    "uba": {
        "label": "Umweltbundesamt",
        "period": "2024",
        "url": "https://www.umweltbundesamt.de/themen/verkehr/emissionsdaten",
        # TREMOD, mix électrique allemand, production de l'énergie comprise : Fernverkehr / Nahverkehr
        "DE": {"highSpeed": 26, "longDistance": 26, "regional": 44},
    },
    "sbb": {
        "label": "SBB",
        "period": "2023",
        "url": "https://company.sbb.ch/content/dam/internet/corporate/downloads/de/unternehmen/ueber-uns/geschaeftsbericht/SBB-Nachhaltigkeitsbericht-2023.pdf.sbbdownload.pdf",
        # énergie de traction par voyageur-km : modèle des pays sans donnée (vérifié : Allemagne 25,7 g contre 26 publiés par l'UBA)
        "kwhPerPkm": 0.078,
    },
}

# Colonnes de la table ORR 6103a → types de train du réseau (Backend, Meta.Types)
ORR_TYPES = {
    "Avanti West Coast": ["Avanti West Coast"],
    "c2c": ["c2c"],
    "Caledonian Sleeper": ["Caledonian Sleeper"],
    "Chiltern Railways": ["Chiltern Railways"],
    "CrossCountry": ["CrossCountry"],
    "East Midlands Railway": ["East Midlands Railway"],
    "Elizabeth line": ["Elizabeth line"],
    "Govia Thameslink Railway": ["Thameslink", "Southern", "Great Northern", "Gatwick Express"],
    "Grand Central": ["Grand Central"],
    "Great Western Railway": ["Great Western Railway"],
    "Greater Anglia": ["Greater Anglia"],
    "Heathrow Express": ["Heathrow Express"],
    "Hull Trains": ["Hull Trains"],
    "London North Eastern Railway": ["LNER"],
    "London Overground": ["London Overground"],
    "Lumo": ["Lumo"],
    "Merseyrail": ["Merseyrail"],
    "Northern Trains": ["Northern"],
    "ScotRail": ["ScotRail"],
    "South Western Railway": ["South Western Railway", "Island Line"],
    "Southeastern": ["Southeastern"],
    "TfW Rail": ["Transport for Wales"],
    "TransPennine Express": ["TransPennine Express"],
    "West Midlands Trains": ["West Midlands Trains"],
    # « Eurostar » de l'ORR : partie britannique seulement → on prend la valeur SNCF de la ligne entière
}

# Catégories du jeu SNCF → types de train du réseau, et catégorie France correspondante
SNCF_TYPES = {
    "TGV": (["SNCF TGV INOUI", "SNCF OUIGO"], "highSpeed"),
    "Intercités": (["SNCF Intercités", "SNCF Intercités de nuit", "SNCF OUIGO Train Classique"], "longDistance"),
    "TER": (["SNCF TER", "SNCF Tram-train", "SNCF Navette"], "regional"),
}
# Liaisons internationales SNCF : gare de destination → types de train
SNCF_INTERNATIONAL = {
    r"London": ["Eurostar"],
    r"Geneve|Lausanne|Zuerich|Basel": ["SNCF TGV Lyria"],
    r"Frankfurt|Stuttgart|Muenchen|Mannheim|Karlsruhe": ["DB SNCF en coopération"],
}

# Pays du réseau pour le modèle (ISO 3166 alpha-2 → code Our World in Data)
EMBER_COUNTRIES = {
    "AT": "AUT", "BE": "BEL", "CH": "CHE", "CZ": "CZE", "DE": "DEU", "DK": "DNK", "ES": "ESP", "FR": "FRA",
    "GB": "GBR", "IT": "ITA", "LU": "LUX", "NL": "NLD", "PL": "POL", "PT": "PRT", "EU": "OWID_EU27",
}


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "TrainNomad (mise a jour des facteurs carbone)"})
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read()


def ods_rows(data: bytes, sheet: str) -> list[list[str]]:
    t = "{urn:oasis:names:tc:opendocument:xmlns:table:1.0}"
    p = "{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p"
    root = ET.fromstring(zipfile.ZipFile(io.BytesIO(data)).read("content.xml"))
    for table in root.iter(t + "table"):
        if table.get(t + "name") != sheet:
            continue
        rows = []
        for row in table.iter(t + "table-row"):
            cells = []
            for c in row:
                rep = min(int(c.get(t + "number-columns-repeated", "1")), 50)
                cells += [" ".join("".join(x.itertext()) for x in c.iter(p))] * rep
            rows.append(cells)
        return rows
    raise SystemExit(f"ORR : feuille {sheet} introuvable")


def orr():
    page = get(ORR_PAGE).decode("utf-8", "replace")
    m = re.search(r'href="([^"]+table-6103[^"]+\.ods[^"]*)"', page)
    if not m:
        raise SystemExit("ORR : lien vers le fichier .ods introuvable sur la page de la table 6103")
    rows = ods_rows(get(urllib.request.urljoin(ORR_PAGE, m.group(1).replace("&amp;", "&"))), "6103_Passenger_CO2_by_operator")
    # Table 6103a : en-tête « Time period | <compagnie> (grams per passenger kilometre) | … », puis une ligne par année
    start = next(i for i, r in enumerate(rows) if r and r[0] == "Time period")
    header = [re.sub(r"\s*(\[\w\]\s*)*\(grams per passenger kilometre\)", "", h).strip() for h in rows[start]]
    years = []
    for r in rows[start + 1:]:
        if not r or not r[0].startswith("Apr"):
            break
        years.append(r)
    last = years[-1]
    period = re.sub(r"Apr (\d{4}) to Mar (\d{4}).*", lambda y: f"{y.group(1)}-{y.group(2)[2:]}", last[0])
    values = {h: float(v.replace(",", "")) for h, v in zip(header[1:], last[1:]) if re.match(r"^[\d.,]+$", v)}
    unknown = set(values) - set(ORR_TYPES) - {"Total", "Eurostar"}
    if unknown:
        print(f"  ⚠ ORR : compagnies sans correspondance dans ORR_TYPES (ignorées) : {sorted(unknown)}")
    types = {t: {"g": values[op], "source": "orr"} for op, names in ORR_TYPES.items() if op in values for t in names}
    source = {"label": "Office of Rail and Road", "period": period, "url": ORR_PAGE}
    return source, types, values["Total"]


def sncf():
    rows, offset = [], 0
    while True:
        batch = json.loads(get(f"{SNCF_API}/records?limit=100&offset={offset}"))["results"]
        rows += batch
        offset += 100
        if len(batch) < 100:
            break
    meta = json.loads(get(SNCF_API))["metas"]["default"]

    def factor(subset):
        # g / voyageur-km = kg du trajet / distance entre les gares ; valeur la plus fréquente (une par catégorie)
        vals = [round(r["train_empreinte_carbone_kgco2e"] / r["distance_entre_les_gares"] * 1000, 2) for r in subset if r["distance_entre_les_gares"]]
        return statistics.mode(vals) if vals else None

    types, france = {}, {}
    for transporteur, (names, category) in SNCF_TYPES.items():
        g = factor([r for r in rows if r["transporteur"] == transporteur])
        if g is None:
            print(f"  ⚠ SNCF : catégorie {transporteur} absente du jeu de données")
            continue
        france[category] = g
        types.update({t: {"g": g, "source": "sncf"} for t in names})
    intl = [r for r in rows if r["transporteur"] == "International"]
    for pattern, names in SNCF_INTERNATIONAL.items():
        g = factor([r for r in intl if re.search(pattern, r["destination"])])
        if g is not None:
            types.update({t: {"g": g, "source": "sncf"} for t in names})
    # Comparaison, même source et même périmètre : voiture thermique (valeur SNCF à 2,2 personnes, ramenée au véhicule) et avion
    car = statistics.median(r["voiture_thermique_2_2_pers_empreinte_carbone_kgco2e"] / r["distance_routiere"] * 2.2 * 1000 for r in rows if r["distance_routiere"])
    plane = statistics.median(r["avion_empreinte_carbone_kgco2e"] / r["distance_aerienne"] * 1000 for r in rows if r["distance_aerienne"] and r["avion_empreinte_carbone_kgco2e"])
    coach = statistics.median(r["autocar_longue_distance_empreinte_carbone_kgco2e"] / r["distance_routiere"] * 1000 for r in rows if r["distance_routiere"])
    source = {"label": "SNCF Voyageurs", "period": meta.get("modified", "")[:10], "url": SNCF_PAGE}
    return source, types, france, {"car": round(car, 1), "plane": round(plane, 1), "coach": round(coach, 1)}


def ember():
    latest = {}
    for r in csv.DictReader(io.StringIO(get(EMBER_CSV).decode("utf-8"))):
        code, year = r["code"], int(r["year"])
        if code in EMBER_COUNTRIES.values() and r["co2_intensity__gco2_kwh"] and year >= latest.get(code, (0,))[0]:
            latest[code] = (year, float(r["co2_intensity__gco2_kwh"]))
    grid = {cc: round(latest[code][1], 1) for cc, code in EMBER_COUNTRIES.items() if code in latest}
    year = max(y for y, _ in latest.values())
    return {"label": "Ember (Our World in Data)", "period": str(year), "url": EMBER_PAGE}, grid


def flatten(d, prefix=""):
    out = {}
    for k, v in d.items():
        key = f"{prefix}{k}"
        if isinstance(v, dict):
            out.update(flatten(v, key + "."))
        elif isinstance(v, (int, float)):
            out[key] = v
    return out


def main():
    print("ORR (compagnies britanniques)…")
    orr_source, orr_types, gb_total = orr()
    print("SNCF Voyageurs…")
    sncf_source, sncf_types, france, comparison = sncf()
    print("Ember (électricité par pays)…")
    ember_source, grid = ember()

    data = {
        "_lisezmoi": "Généré par scripts/update-carbon-factors.py (une fois par an) : ne pas modifier à la main. "
        "g = grammes de CO2e par voyageur-km, mix électrique du pays, énergie consommée par les trains.",
        "updated": date.today().isoformat(),
        "sources": {
            "orr": orr_source,
            "sncf": sncf_source,
            "uba": {k: MANUAL["uba"][k] for k in ("label", "period", "url")},
            "ember": ember_source,
            "sbb": {k: MANUAL["sbb"][k] for k in ("label", "period", "url")},
        },
        "trainTypes": dict(sorted({**orr_types, **sncf_types}.items())),
        "countries": {
            "FR": {**france, "source": "sncf"},
            "DE": {**MANUAL["uba"]["DE"], "source": "uba"},
            "GB": {"highSpeed": gb_total, "longDistance": gb_total, "regional": gb_total, "source": "orr"},
        },
        "model": {"kwhPerPkm": MANUAL["sbb"]["kwhPerPkm"], "gridIntensity": grid, "source": "ember"},
        "coach": {"g": comparison["coach"], "source": "sncf"},
        "comparison": {"car": comparison["car"], "plane": comparison["plane"], "source": "sncf"},
    }

    old = flatten(json.loads(OUT.read_text(encoding="utf-8"))) if OUT.exists() else {}
    new = flatten(data)
    changes = [(k, old.get(k), v) for k, v in new.items() if old.get(k) != v]
    print(f"\n{len(changes)} valeur(s) modifiée(s) :" if old else f"\n{OUT.name} créé ({len(new)} valeurs).")
    if old:
        for k, a, b in changes:
            print(f"  {k} : {a} → {b}")
    for key in ("uba", "sbb"):
        # les sources publient avec environ un an de retard : alerte à partir de trois ans
        age = date.today().year - int(MANUAL[key]["period"][:4])
        if age >= 3:
            print(f"  ⚠ {MANUAL[key]['label']} ({MANUAL[key]['period']}) : valeur saisie à la main vieille de {age} ans, vérifier {MANUAL[key]['url']}")

    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n→ {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
