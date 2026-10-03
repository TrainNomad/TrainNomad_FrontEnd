"""
Réduit la police Material Symbols (4 Mo) aux seules icônes utilisées par le site (quelques dizaines de Ko).

À relancer après avoir utilisé une nouvelle icône Material Symbols dans src/ :
    pip install fonttools brotli uharfbuzz
    python scripts/subset-icons.py

Toute chaîne en minuscules du code (src/**/*.ts, *.tsx) qui correspond à une icône de la police est conservée.
`pnpm build` vérifie ensuite que les icônes écrites dans le JSX font partie de la police (scripts/check-icons.mjs).
"""
import glob
import io
import re
from pathlib import Path

import uharfbuzz as hb
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "node_modules/material-symbols/material-symbols-outlined.woff2"
OUT_FONT = ROOT / "src/assets/fonts/material-symbols-subset.woff2"
OUT_LIST = ROOT / "src/assets/fonts/material-symbols-icons.txt"

# Mots candidats : tout identifiant en minuscules présent dans le code
words = set()
for f in glob.glob(str(ROOT / "src/**/*.ts*"), recursive=True):
    words |= set(re.findall(r"\b[a-z][a-z0-9_]{1,40}\b", Path(f).read_text(encoding="utf-8")))

# Un mot est une icône si la police le transforme en un seul glyphe (ligature).
# HarfBuzz ne lit pas le woff2 : la police est décompressée en TTF en mémoire.
ttf = TTFont(SOURCE)
raw = io.BytesIO()
ttf.flavor = None
ttf.save(raw)
font = hb.Font(hb.Face(hb.Blob(raw.getvalue())))
icons, icon_glyphs = [], set()
order = ttf.getGlyphOrder()
for w in sorted(words):
    buf = hb.Buffer()
    buf.add_str(w)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"liga": True})
    if len(buf.glyph_infos) == 1 and buf.glyph_infos[0].codepoint != 0:
        icons.append(w)
        icon_glyphs.add(order[buf.glyph_infos[0].codepoint])
ttf = TTFont(SOURCE)

opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["*"]
# Pas de fermeture : seules les ligatures dont le glyphe d'icône est conservé restent dans la police
opts.layout_closure = False
opts.notdef_outline = True
opts.name_IDs = ["*"]
sub = subset.Subsetter(opts)
sub.populate(glyphs=sorted(icon_glyphs), text="abcdefghijklmnopqrstuvwxyz0123456789_")
sub.subset(ttf)
ttf.flavor = "woff2"
ttf.save(OUT_FONT)
OUT_LIST.write_text("\n".join(icons) + "\n", encoding="utf-8", newline="\n")
# Contrôle : chaque icône doit encore donner un seul glyphe dans la police réduite
check = TTFont(OUT_FONT)
check.flavor = None
raw = io.BytesIO()
check.save(raw)
small = hb.Font(hb.Face(hb.Blob(raw.getvalue())))
for w in icons:
    buf = hb.Buffer()
    buf.add_str(w)
    buf.guess_segment_properties()
    hb.shape(small, buf, {"liga": True})
    if len(buf.glyph_infos) != 1 or buf.glyph_infos[0].codepoint == 0:
        raise SystemExit(f"icône perdue dans la police réduite : {w}")
print(f"{len(icons)} icônes, {OUT_FONT.stat().st_size // 1024} Ko -> {OUT_FONT.relative_to(ROOT)}")
