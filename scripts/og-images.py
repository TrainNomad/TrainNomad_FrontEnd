"""
Images d'aperçu des liens partagés (1200 x 630, balise og:image) : une par grande section du site et une par
guide, dans public/og/. Même mise en page que public/og-image.jpg (photo, pastille du logo en bas à gauche),
avec le titre de la page à côté du logo. Le build lit ces fichiers (scripts/prerender.mjs) : à relancer après
l'ajout d'un guide (sans image, le guide garde l'aperçu général du site).

    python scripts/og-images.py

Dépendances : Pillow et fontTools (police Plus Jakarta Sans de node_modules convertie à la volée).
"""
import io
import json
import os
import sys
import urllib.request

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
OUT = os.path.join(PUBLIC, "og")
FONTS = os.path.join(ROOT, "node_modules", "@fontsource", "plus-jakarta-sans", "files")
LOGO = os.path.join(PUBLIC, "assets", "Logo", "PNG", "Trainnomad_vert_png.png")
GUIDES_API = os.environ.get("VITE_GUIDES_API_URL", "https://guides-api.trainnomad.eu")

W, H = 1200, 630
BADGE, MARGIN = 120, 48  # pastille blanche du logo, comme dans og-image.jpg

# chemin de l'image -> (photo, titre) ; les autres pages gardent public/og-image.jpg
SECTIONS = {
    "trajets": ("assets/guides/paris-hero.webp", "Trajets en train en Europe"),
    "explorer": ("assets/guides/lyon-hero.webp", "Explorer l'Europe en train"),
    "tgvmax": ("assets/guides/marseille-hero.webp", "Places TGVmax disponibles"),
    "guides": ("assets/guides/barcelone-hero.webp", "Guides de voyage en train"),
}


def font(weight: int, size: int) -> ImageFont.FreeTypeFont:
    """Plus Jakarta Sans (fichier .woff de @fontsource) convertie en TrueType en mémoire."""
    f = TTFont(os.path.join(FONTS, f"plus-jakarta-sans-latin-{weight}-normal.woff"))
    f.flavor = None
    buf = io.BytesIO()
    f.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


def cover(path: str) -> Image.Image:
    """Photo recadrée au centre pour remplir 1200 x 630."""
    im = Image.open(path).convert("RGB")
    scale = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    left, top = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((left, top, left + W, top + H))


def fit(draw: ImageDraw.ImageDraw, text: str, weight: int, size: int, max_w: int) -> ImageFont.FreeTypeFont:
    """Police la plus grande (jusqu'à `size`) pour que le titre tienne sur une ligne."""
    while size > 28:
        f = font(weight, size)
        if draw.textlength(text, font=f) <= max_w:
            return f
        size -= 2
    return font(weight, size)


def render(photo: str, title: str, subtitle: str, dest: str):
    im = cover(photo)
    # dégradé sombre en bas : le texte blanc reste lisible sur toutes les photos
    shade = Image.new("L", (1, H))
    for y in range(H):
        t = max(0.0, (y - H * 0.4) / (H * 0.6))
        shade.putpixel((0, y), round(225 * t))
    im.paste(Image.new("RGB", (W, H), (15, 23, 42)), (0, 0), shade.resize((W, H)))

    draw = ImageDraw.Draw(im)
    top = H - MARGIN - BADGE
    draw.rectangle((MARGIN, top, MARGIN + BADGE, top + BADGE), fill="white")
    logo = Image.open(LOGO).convert("RGBA")
    size = BADGE - 24
    logo = logo.resize((size, size), Image.LANCZOS)
    im.paste(logo, (MARGIN + 12, top + 12), logo)

    x = MARGIN + BADGE + 32
    title_font = fit(draw, title, 800, 60, W - x - MARGIN)
    sub_font = font(700, 28)
    draw.text((x, top + BADGE - 44), subtitle, font=sub_font, fill=(255, 255, 255, 200), anchor="ls")
    draw.text((x, top + BADGE - 82), title, font=title_font, fill="white", anchor="ls")

    os.makedirs(os.path.dirname(dest), exist_ok=True)
    im.save(dest, "JPEG", quality=82, optimize=True, progressive=True)


def guide_photo(image: str) -> str | None:
    """Photo large du guide (« -hero », comme en tête de sa page), sinon sa couverture ; None si absente."""
    cover_path = os.path.join(PUBLIC, image.lstrip("/"))
    hero_path = cover_path.replace("-cover.", "-hero.")
    return next((p for p in (hero_path, cover_path) if os.path.isfile(p)), None)


def main():
    for key, (photo, title) in SECTIONS.items():
        render(os.path.join(PUBLIC, photo), title, "trainnomad.eu", os.path.join(OUT, f"{key}.jpg"))
    print(f"✅ {len(SECTIONS)} images de section")

    with urllib.request.urlopen(f"{GUIDES_API}/guides", timeout=60) as r:
        guides = json.load(r).get("guides", [])
    done, missing = 0, []
    for g in guides:
        photo = guide_photo(g.get("image") or "")
        if not photo:
            missing.append(g["slug"])
            continue
        subtitle = f"{g['country']} · trainnomad.eu" if g.get("country") else "trainnomad.eu"
        render(photo, f"Guide {g['name']}", subtitle, os.path.join(OUT, "guides", f"{g['slug']}.jpg"))
        done += 1
    print(f"✅ {done} images de guides" + (f" ; sans photo : {', '.join(missing)}" if missing else ""))


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
