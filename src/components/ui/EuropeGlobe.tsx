import { useEffect, useMemo, useRef } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import landUrl from "world-atlas/land-50m.json?url";

interface City {
  lat: number;
  lng: number;
  /** Nom affiché en permanence (si la place le permet) */
  label?: string;
  /** Nom montré seulement au survol (ou au toucher) du point, pour une ville sans étiquette */
  name?: string;
  /** Côté du point où poser l'étiquette en priorité (au-dessus par défaut) */
  labelSide?: string;
}

interface GlobeProps {
  /** path : parcours réel sur les voies, en [lat, lng] du départ à l'arrivée ; sans lui, une courbe relie les deux villes */
  dots?: Array<{ start: City; end: City; path?: Array<[number, number]> }>;
  lineColor?: string;
  /** Rayon du globe par rapport au cadre : plus grand = plus zoomé, horizon moins visible */
  zoom?: number;
  /** Inclinaison en degrés : fait remonter l'Europe vers l'horizon du globe */
  tilt?: number;
  /** Amplitude du balancement est-ouest, en degrés */
  sway?: number;
  /** Rejoue le tracé des lignes en boucle (sinon une seule fois) */
  loop?: boolean;
  /** Le globe tourne au doigt ou à la souris (sinon il reste immobile) */
  draggable?: boolean;
  /** Zoom calculé pour que les lignes remplissent le cadre (`zoom` est alors ignoré) */
  fitRoutes?: boolean;
  /** Couleurs du globe (dégradé du centre au bord), de son halo et des terres, pour un autre fond que l'accueil */
  palette?: { body: [string, string]; glow: string; land: string };
  className?: string;
}

const DEFAULT_PALETTE = { body: ["#0b1324", "#13233b"] as [string, string], glow: "16,185,129", land: "rgba(255,255,255,0.4)" };

const DEG = Math.PI / 180;
const MAX_DRAG = 14; // degrés de rotation autorisés au doigt, de part et d'autre
// Positions possibles d'une étiquette autour de son point : [x, y] avec -1, 0 ou 1
const LABEL_SIDES = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const LABEL_SIDE_NAMES = ["top", "bottom", "right", "left"];
const LABEL_GAP = 9;
const HOVER_PX = 12; // distance au point en dessous de laquelle le pointeur « survole » une ville
const TAP_PX = 6; // au doigt, déplacement maximal pour un toucher (au-delà, le globe tourne)
const EDGE_FADE =
  "linear-gradient(to bottom, black 93%, transparent), linear-gradient(to right, transparent, black 5%, black 95%, transparent)";
// Animation des lignes, en secondes : décalage entre deux lignes, durée d'un tracé,
// temps d'affichage du réseau complet, puis fondu avant de recommencer
const LINE_STAGGER = 0.12;
const LINE_DURATION = 1.1;
const LINE_HOLD = 5;
const LINE_FADE = 0.8;

// Zone du monde couverte par les points de terre : tout l'hémisphère nord, visible près de l'horizon
const WEST = -180, EAST = 180, SOUTH = 15, NORTH = 88;
const MASK_PX = 6; // pixels par degré du masque terre/mer (au moins : plus fin quand les points se resserrent)
// Espacement visé entre deux points de terre à l'écran, en pixels (celui du globe de l'accueil) : plus le globe
// est zoomé, plus les points se resserrent sur la carte
const DOT_SPACING_PX = 9;

/** Cadre [sud, ouest, nord, est] en degrés où poser les points de terre */
type LandWindow = [number, number, number, number];
const WHOLE_HEMISPHERE: LandWindow = [SOUTH, WEST, NORTH, EAST];

const landDotsCache = new Map<string, Promise<Float32Array>>();
let landData: Promise<any> | null = null;

/** Points posés sur les terres, en triplets [sin(lat), cos(lat), lng en radians], espacés de `step` degrés. */
function loadLandDots(step = 0.5, [south, west, north, east]: LandWindow = WHOLE_HEMISPHERE): Promise<Float32Array> {
  const key = `${step}|${south}|${west}|${north}|${east}`;
  const cached = landDotsCache.get(key);
  if (cached) return cached;
  landData ??= fetch(landUrl).then((res) => res.json());
  const promise = landData.then((data) => {
    // On dessine les terres une fois sur un canvas caché, puis on lit ses pixels
    const px = Math.max(MASK_PX, 3 / step);
    const mask = document.createElement("canvas");
    mask.width = Math.ceil((east - west) * px);
    mask.height = Math.ceil((north - south) * px);
    const ctx = mask.getContext("2d", { willReadFrequently: true })!;
    const projection = geoEquirectangular()
      .scale((px * 180) / Math.PI)
      .translate([-west * px, north * px]);
    ctx.beginPath();
    geoPath(projection, ctx)(feature(data, data.objects.land) as any);
    ctx.fill();
    const pixels = ctx.getImageData(0, 0, mask.width, mask.height).data;

    const out: number[] = [];
    let row = 0;
    for (let lat = south + step / 2; lat < north; lat += step, row++) {
      const cos = Math.cos(lat * DEG);
      const lngStep = step / cos; // espacement constant à l'écran malgré la latitude
      const y = Math.floor((north - lat) * px);
      for (let lng = west + (row % 2 ? lngStep / 2 : 0); lng < east; lng += lngStep) {
        const x = Math.floor((lng - west) * px);
        if (pixels[(y * mask.width + x) * 4 + 3] > 128) {
          out.push(Math.sin(lat * DEG), cos, lng * DEG);
        }
      }
    }
    return new Float32Array(out);
  });
  landDotsCache.set(key, promise);
  return promise;
}

export function EuropeGlobe({
  dots = [],
  lineColor = "#10b981",
  zoom = 2.2,
  tilt = 38,
  sway = 5,
  loop = true,
  draggable = true,
  fitRoutes = false,
  palette = DEFAULT_PALETTE,
  className = "",
}: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const hoverRef = useRef<HTMLSpanElement>(null);

  const { cities, routes, center, extent } = useMemo(() => {
    const byKey = new Map<string, City & { index: number; links: number }>();
    const indexOf = (c: City) => {
      const key = `${c.lat}-${c.lng}`;
      if (!byKey.has(key)) byKey.set(key, { ...c, index: byKey.size, links: 0 });
      const city = byKey.get(key)!;
      city.links++;
      return city.index;
    };
    const routes = dots.map((d) => {
      const route = { from: indexOf(d.start), to: indexOf(d.end), geo: null as Float64Array | null, cum: null as Float64Array | null };
      if (d.path && d.path.length > 1) {
        // Points du parcours en triplets [sin(lat), cos(lat), lng], et part du chemin faite à chaque point
        const geo = new Float64Array(d.path.length * 3);
        const cum = new Float64Array(d.path.length);
        d.path.forEach(([lat, lng], k) => {
          geo.set([Math.sin(lat * DEG), Math.cos(lat * DEG), lng * DEG], k * 3);
          if (k) {
            const [pLat, pLng] = d.path![k - 1];
            cum[k] = cum[k - 1] + Math.hypot(lat - pLat, (lng - pLng) * Math.cos(lat * DEG));
          }
        });
        const total = cum[cum.length - 1] || 1;
        route.geo = geo;
        route.cum = cum.map((c) => c / total);
      }
      return route;
    });
    const cities = Array.from(byKey.values());
    const mid = (v: number[]) => (v.length ? (Math.min(...v) + Math.max(...v)) / 2 : 0);
    // Avec le zoom ajusté, les parcours comptent aussi (une ligne peut s'écarter du segment entre ses villes)
    const points = [...cities.map((c) => [c.lat, c.lng]), ...(fitRoutes ? dots.flatMap((d) => d.path ?? []) : [])];
    const lats = points.map((p) => p[0]);
    const lngs = points.map((p) => p[1]);
    const center = { lat: points.length ? mid(lats) : 47, lng: points.length ? mid(lngs) : 3 };
    const extent = points.length
      ? { lat: Math.max(...lats) - Math.min(...lats), lng: Math.max(...lngs) - Math.min(...lngs) }
      : { lat: 0, lng: 0 };
    return { cities, routes, center, extent };
  }, [dots, fitRoutes]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!container || !canvas || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cityGeo = cities.map((c) => [Math.sin(c.lat * DEG), Math.cos(c.lat * DEG), c.lng * DEG]);
    const screen = cities.map(() => ({ x: 0, y: 0 }));
    const point = { x: 0, y: 0 }; // point de parcours en cours de projection
    const labelSide = cities.map(() => -1); // index dans LABEL_SIDES, -1 = étiquette masquée
    // Le regard est centré plus au sud que le réseau : l'Europe remonte vers l'horizon
    const lat0 = (center.lat - tilt) * DEG;
    const sin0 = Math.sin(lat0);
    const cos0 = Math.cos(lat0);

    let land: Float32Array | null = null;
    let width = 0;
    let height = 0;
    let radius = 0;
    let cx = 0;
    let cy = 0;
    let frame = 0;
    let visible = false;
    let cancelled = false;
    let t = 0;
    let last = performance.now();
    let dragDeg = 0;
    let dragging: { x: number; from: number } | null = null;
    let revealStart = 0;
    let hovered = -1; // ville survolée (ou touchée), -1 = aucune

    const layout = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = width / 2;
      if (fitRoutes) {
        // Les lignes occupent environ 60 % de la largeur ou la moitié de la hauteur, centrées dans le cadre
        const spanLat = Math.max(extent.lat, 1) * DEG;
        const spanLng = Math.max(extent.lng, 1) * Math.cos(center.lat * DEG) * DEG;
        radius = Math.min((width * 0.6) / spanLng, (height * 0.5) / spanLat);
        cy = height * 0.5 + radius * Math.sin(tilt * DEG);
      } else {
        // Sur un cadre large (ordinateur), c'est la hauteur qui limite la taille du globe
        radius = zoom * Math.min(width, height * 0.75);
        // Le centre du réseau tombe un peu sous le milieu du cadre, l'horizon reste visible en haut
        cy = height * 0.66 + radius * Math.sin(tilt * DEG);
      }
      // Densité des points selon le zoom : environ DOT_SPACING_PX entre deux points à l'écran. Pas arrondi
      // (0,5 ; 0,35 ; 0,25 ; 0,18…) pour ne pas recalculer à chaque redimensionnement ; à 0,5° et plus,
      // tout l'hémisphère (globe de l'accueil), en dessous seulement la zone visible autour du réseau
      // (globe de l'accueil, zoom fixe : grille de 0,5° sur tout l'hémisphère, l'horizon reste couvert)
      const wanted = fitRoutes ? DOT_SPACING_PX / (radius * DEG) : 0.5;
      const step = wanted >= 0.5 ? 0.5 : Math.max(0.02, 0.5 * Math.SQRT1_2 ** Math.ceil(Math.log(0.5 / wanted) / Math.log(Math.SQRT2)));
      if (step >= 0.5) {
        loadLand(0.5, WHOLE_HEMISPHERE);
      } else {
        const halfLat = Math.ceil(height / (radius * DEG));
        const halfLng = Math.ceil(width / (radius * DEG * Math.cos(center.lat * DEG)));
        const lat = Math.round(center.lat);
        const lng = Math.round(center.lng);
        loadLand(step, [Math.max(-89, lat - halfLat), lng - halfLng, Math.min(89, lat + halfLat), lng + halfLng]);
      }
      pickLabels();
      if (!frame) draw();
    };

    const project = (sinLat: number, cosLat: number, lng: number, lng0: number, out: { x: number; y: number }) => {
      const d = lng - lng0;
      out.x = cx + radius * cosLat * Math.sin(d);
      out.y = cy - radius * (cos0 * sinLat - sin0 * cosLat * Math.cos(d));
    };

    // N'affiche que les étiquettes qui ne se chevauchent pas, les villes les plus reliées d'abord
    const pickLabels = () => {
      const points = cityGeo.map(([s, c, l]) => {
        const p = { x: 0, y: 0 };
        project(s, c, l, center.lng * DEG, p);
        return p;
      });
      // Les points des villes comptent comme des obstacles : une étiquette ne doit pas les couvrir
      const placed = points.map((p) => [p.x - 5, p.y - 5, p.x + 5, p.y + 5]);
      const order = [...cities].sort((a, b) => b.links - a.links);
      for (const city of order) {
        const el = labelRefs.current[city.index];
        if (!el) continue;
        const p = points[city.index];
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        // Essaie le côté demandé pour la ville, puis au-dessus, en dessous, à droite et à gauche du point
        const wanted = LABEL_SIDE_NAMES.indexOf(city.labelSide ?? "");
        const tries = wanted < 0 ? LABEL_SIDES.map((_, k) => k) : [wanted, ...LABEL_SIDES.map((_, k) => k).filter((k) => k !== wanted)];
        const side = tries.find((k) => {
          const [ax, ay] = LABEL_SIDES[k];
          const x = p.x + ax * LABEL_GAP + ((ax - 1) / 2) * w;
          const y = p.y + ay * LABEL_GAP + ((ay - 1) / 2) * h;
          const box = [x - 1, y - 1, x + w + 1, y + h + 1];
          if (box[0] < 0 || box[2] > width) return false;
          const free = placed.every((b) => box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]);
          if (free) placed.push(box);
          return free;
        });
        labelSide[city.index] = side ?? -1;
        el.style.opacity = side === undefined ? "0" : "1";
      }
    };

    const draw = () => {
      // Avance au temps réel (borné), pour la même vitesse sur un écran 60 Hz ou 120 Hz
      const now = performance.now();
      if (!dragging && !reducedMotion) t += Math.min(now - last, 100) * 0.0004;
      last = now;
      const lng0 = (center.lng + Math.sin(t) * sway - dragDeg) * DEG;
      ctx.clearRect(0, 0, width, height);

      // Le globe et son halo
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.985, cx, cy, radius * 1.05);
      glow.addColorStop(0, `rgba(${palette.glow},0.35)`);
      glow.addColorStop(1, `rgba(${palette.glow},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.05, 0, Math.PI * 2);
      ctx.fill();
      const body = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius);
      body.addColorStop(0, palette.body[0]);
      body.addColorStop(1, palette.body[1]);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Les terres en pointillés
      if (land) {
        ctx.fillStyle = palette.land;
        ctx.beginPath();
        for (let i = 0; i < land.length; i += 3) {
          const d = land[i + 2] - lng0;
          const cosD = Math.cos(d);
          if (sin0 * land[i] + cos0 * land[i + 1] * cosD < 0.02) continue; // face cachée
          const x = cx + radius * land[i + 1] * Math.sin(d);
          if (x < -2 || x > width + 2) continue;
          const y = cy - radius * (cos0 * land[i] - sin0 * land[i + 1] * cosD);
          if (y < -2 || y > height + 2) continue;
          ctx.moveTo(x + 1.1, y);
          ctx.arc(x, y, 1.1, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      cityGeo.forEach(([s, c, l], i) => project(s, c, l, lng0, screen[i]));

      // Les lignes se tracent une à une quand le globe est bien à l'écran, restent affichées
      // quelques secondes, s'estompent, puis le cycle reprend (comme sur la carte plate)
      const drawTime = routes.length * LINE_STAGGER + LINE_DURATION;
      const cycle = drawTime + LINE_HOLD + LINE_FADE;
      let elapsed = reducedMotion ? drawTime : revealStart ? (now - revealStart) / 1000 : 0;
      if (loop && !reducedMotion) elapsed %= cycle;
      // Fondu de fin de cycle seulement en boucle : tracées une fois, les lignes restent affichées
      ctx.globalAlpha = loop ? Math.max(0, Math.min(1, (cycle - elapsed) / LINE_FADE)) : 1;
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 5;
      routes.forEach(({ from, to, geo, cum }, i) => {
        const progress = Math.max(0, Math.min(1, (elapsed - i * LINE_STAGGER) / LINE_DURATION));
        if (!progress) return;
        if (geo && cum) {
          // Parcours réel sur les voies, tracé jusqu'à la part du chemin atteinte
          ctx.beginPath();
          let px = 0;
          let py = 0;
          for (let k = 0; k < cum.length; k++) {
            project(geo[k * 3], geo[k * 3 + 1], geo[k * 3 + 2], lng0, point);
            if (k === 0) {
              ctx.moveTo(point.x, point.y);
            } else if (cum[k] <= progress) {
              ctx.lineTo(point.x, point.y);
            } else {
              const f = (progress - cum[k - 1]) / (cum[k] - cum[k - 1]);
              ctx.lineTo(px + (point.x - px) * f, py + (point.y - py) * f);
              break;
            }
            px = point.x;
            py = point.y;
          }
          ctx.stroke();
          return;
        }
        const a = screen[from];
        const b = screen[to];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        // Pas de parcours connu : courbe bombée vers le haut de l'écran
        const up = dx > 0 ? 1 : -1;
        const qx = (a.x + b.x) / 2 + dy * 0.18 * up;
        const qy = (a.y + b.y) / 2 - dx * 0.18 * up;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        const steps = Math.ceil(24 * progress);
        for (let k = 1; k <= steps; k++) {
          const u = (k / steps) * progress;
          const v = 1 - u;
          ctx.lineTo(v * v * a.x + 2 * v * u * qx + u * u * b.x, v * v * a.y + 2 * v * u * qy + u * u * b.y);
        }
        ctx.stroke();
      });

      // Les villes et leurs étiquettes
      ctx.globalAlpha = 1;
      ctx.fillStyle = lineColor;
      ctx.beginPath();
      screen.forEach((p) => {
        ctx.moveTo(p.x + 3.5, p.y);
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      });
      ctx.fill();
      ctx.shadowBlur = 0;
      const hover = hoverRef.current;
      if (hovered >= 0) {
        // Anneau autour du point survolé, et son nom au-dessus quand il n'a pas déjà son étiquette
        const p = screen[hovered];
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.stroke();
        if (hover) hover.style.transform = `translate(${p.x}px, ${p.y - LABEL_GAP}px) translate(-50%, -100%)`;
      }
      screen.forEach((p, i) => {
        const el = labelRefs.current[i];
        const side = LABEL_SIDES[labelSide[i]];
        if (!el || !side) return;
        const [ax, ay] = side;
        el.style.transform = `translate(${p.x + ax * LABEL_GAP}px, ${p.y + ay * LABEL_GAP}px) translate(${(ax - 1) * 50}%, ${(ay - 1) * 50}%)`;
      });

      // Globe immobile dont les lignes sont tracées : plus rien ne change, l'animation s'arrête
      const settled = !loop && !sway && !dragging && elapsed >= drawTime;
      frame = visible && !settled && (!reducedMotion || dragging) ? requestAnimationFrame(draw) : 0;
    };

    let landKey = "";
    function loadLand(step: number, area: LandWindow) {
      const key = `${step}|${area.join()}`;
      if (key === landKey) return;
      landKey = key;
      loadLandDots(step, area)
        .then((points) => {
          if (cancelled || key !== landKey) return;
          land = points;
          if (!frame) draw();
        })
        .catch((err) => console.error("Erreur de chargement de la carte :", err));
    }

    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(container);

    // L'animation ne tourne que quand le globe est à l'écran
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      // Le tracé des lignes attend que la moitié du globe soit visible, sinon il se joue hors champ
      if (entry.intersectionRatio >= 0.5 && !revealStart) revealStart = performance.now();
      if (visible && !frame && width) draw();
    }, { threshold: [0, 0.5] });
    intersectionObserver.observe(container);

    // Ville la plus proche du pointeur, à moins de HOVER_PX ; son nom s'affiche au-dessus du point
    const setHovered = (index: number) => {
      if (index === hovered) return;
      hovered = index;
      const city = cities[index];
      const hover = hoverRef.current;
      // Une ville dont l'étiquette est déjà affichée garde la sienne : seul l'anneau apparaît
      const name = city && labelSide[index] < 0 ? city.label ?? city.name : undefined;
      if (hover) {
        hover.textContent = name ?? "";
        hover.style.opacity = name ? "1" : "0";
      }
      container.style.cursor = city ? "pointer" : "";
      if (!frame) draw();
    };
    const cityAt = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      let best = -1;
      let bestD = HOVER_PX;
      screen.forEach((p, i) => {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    };

    let downAt: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (draggable) dragging = { x: e.clientX, from: dragDeg };
      downAt = { x: e.clientX, y: e.clientY };
      if (!frame) draw();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) {
        // Survol à la souris (au doigt, pointermove n'arrive que pendant un glissé)
        if (e.pointerType === "mouse" && container.contains(e.target as Node)) setHovered(cityAt(e.clientX, e.clientY));
        return;
      }
      const next = dragging.from + (e.clientX - dragging.x) / (radius * DEG * 0.7);
      dragDeg = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, next));
    };
    const onUp = (e: PointerEvent) => {
      dragging = null;
      // Un toucher sans glisser montre la ville touchée (ou masque le nom affiché)
      if (downAt && e.pointerType !== "mouse" && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < TAP_PX) {
        setHovered(cityAt(e.clientX, e.clientY));
      }
      downAt = null;
    };
    const onLeave = () => setHovered(-1);
    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [cities, routes, center, extent, lineColor, zoom, tilt, sway, loop, draggable, fitRoutes, palette]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${draggable ? "cursor-grab active:cursor-grabbing" : ""} ${className}`}
      style={{
        // pan-y : le doigt fait tourner le globe à l'horizontale sans bloquer le défilement de la page
        touchAction: "pan-y",
        // Fondu sur le bas et les côtés : le globe se perd dans le fond au lieu d'être coupé net
        maskImage: EDGE_FADE,
        WebkitMaskImage: EDGE_FADE,
        maskComposite: "intersect",
        WebkitMaskComposite: "source-in",
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      {cities.map((city) =>
        city.label ? (
          <span
            key={city.index}
            ref={(el) => (labelRefs.current[city.index] = el)}
            className="absolute top-0 left-0 opacity-0 transition-opacity duration-500 pointer-events-none whitespace-nowrap text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/95 text-emerald-300 border border-emerald-500/40 shadow-sm"
          >
            {city.label}
          </span>
        ) : null
      )}
      {/* Nom de la ville survolée ou touchée */}
      <span
        ref={hoverRef}
        className="absolute top-0 left-0 opacity-0 transition-opacity duration-200 pointer-events-none whitespace-nowrap text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/95 text-white border border-emerald-400/70 shadow-sm"
      />
    </div>
  );
}
