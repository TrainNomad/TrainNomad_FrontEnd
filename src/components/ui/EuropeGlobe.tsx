import { useEffect, useMemo, useRef } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import landUrl from "world-atlas/land-50m.json?url";

interface City {
  lat: number;
  lng: number;
  label?: string;
}

interface GlobeProps {
  dots?: Array<{ start: City; end: City }>;
  lineColor?: string;
  /** Rayon du globe par rapport au cadre : plus grand = plus zoomé, horizon moins visible */
  zoom?: number;
  /** Inclinaison en degrés : fait remonter l'Europe vers l'horizon du globe */
  tilt?: number;
  /** Amplitude du balancement est-ouest, en degrés */
  sway?: number;
  /** Rejoue le tracé des lignes en boucle (sinon une seule fois) */
  loop?: boolean;
  className?: string;
}

const DEG = Math.PI / 180;
const MAX_DRAG = 14; // degrés de rotation autorisés au doigt, de part et d'autre
// Positions possibles d'une étiquette autour de son point : [x, y] avec -1, 0 ou 1
const LABEL_SIDES = [[0, -1], [0, 1], [1, 0], [-1, 0]];
const LABEL_GAP = 9;
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
const MASK_PX = 6; // pixels par degré du masque terre/mer

let landDotsPromise: Promise<Float32Array> | null = null;

/** Points posés sur les terres, en triplets [sin(lat), cos(lat), lng en radians]. */
function loadLandDots(step = 0.5): Promise<Float32Array> {
  landDotsPromise ??= fetch(landUrl)
    .then((res) => res.json())
    .then((data) => {
      // On dessine les terres une fois sur un canvas caché, puis on lit ses pixels
      const mask = document.createElement("canvas");
      mask.width = (EAST - WEST) * MASK_PX;
      mask.height = (NORTH - SOUTH) * MASK_PX;
      const ctx = mask.getContext("2d", { willReadFrequently: true })!;
      const projection = geoEquirectangular()
        .scale((MASK_PX * 180) / Math.PI)
        .translate([-WEST * MASK_PX, NORTH * MASK_PX]);
      ctx.beginPath();
      geoPath(projection, ctx)(feature(data, data.objects.land) as any);
      ctx.fill();
      const pixels = ctx.getImageData(0, 0, mask.width, mask.height).data;

      const out: number[] = [];
      let row = 0;
      for (let lat = SOUTH + step / 2; lat < NORTH; lat += step, row++) {
        const cos = Math.cos(lat * DEG);
        const lngStep = step / cos; // espacement constant à l'écran malgré la latitude
        const y = Math.floor((NORTH - lat) * MASK_PX);
        for (let lng = WEST + (row % 2 ? lngStep / 2 : 0); lng < EAST; lng += lngStep) {
          const x = Math.floor((lng - WEST) * MASK_PX);
          if (pixels[(y * mask.width + x) * 4 + 3] > 128) {
            out.push(Math.sin(lat * DEG), cos, lng * DEG);
          }
        }
      }
      return new Float32Array(out);
    });
  return landDotsPromise;
}

export function EuropeGlobe({
  dots = [],
  lineColor = "#10b981",
  zoom = 2.2,
  tilt = 38,
  sway = 5,
  loop = true,
  className = "",
}: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const { cities, routes, center } = useMemo(() => {
    const byKey = new Map<string, City & { index: number; links: number }>();
    const indexOf = (c: City) => {
      const key = `${c.lat}-${c.lng}`;
      if (!byKey.has(key)) byKey.set(key, { ...c, index: byKey.size, links: 0 });
      const city = byKey.get(key)!;
      city.links++;
      return city.index;
    };
    const routes = dots.map((d) => [indexOf(d.start), indexOf(d.end)] as const);
    const cities = Array.from(byKey.values());
    const mid = (v: number[]) => (v.length ? (Math.min(...v) + Math.max(...v)) / 2 : 0);
    const center = {
      lat: cities.length ? mid(cities.map((c) => c.lat)) : 47,
      lng: cities.length ? mid(cities.map((c) => c.lng)) : 3,
    };
    return { cities, routes, center };
  }, [dots]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!container || !canvas || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cityGeo = cities.map((c) => [Math.sin(c.lat * DEG), Math.cos(c.lat * DEG), c.lng * DEG]);
    const screen = cities.map(() => ({ x: 0, y: 0 }));
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

    const layout = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Sur un cadre large (ordinateur), c'est la hauteur qui limite la taille du globe
      radius = zoom * Math.min(width, height * 0.75);
      cx = width / 2;
      // Le centre du réseau tombe un peu sous le milieu du cadre, l'horizon reste visible en haut
      cy = height * 0.66 + radius * Math.sin(tilt * DEG);
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
        // Essaie au-dessus, puis en dessous, à droite et à gauche du point
        const side = LABEL_SIDES.findIndex(([ax, ay]) => {
          const x = p.x + ax * LABEL_GAP + ((ax - 1) / 2) * w;
          const y = p.y + ay * LABEL_GAP + ((ay - 1) / 2) * h;
          const box = [x - 1, y - 1, x + w + 1, y + h + 1];
          if (box[0] < 0 || box[2] > width) return false;
          const free = placed.every((b) => box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]);
          if (free) placed.push(box);
          return free;
        });
        labelSide[city.index] = side;
        el.style.opacity = side < 0 ? "0" : "1";
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
      glow.addColorStop(0, "rgba(16,185,129,0.35)");
      glow.addColorStop(1, "rgba(16,185,129,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.05, 0, Math.PI * 2);
      ctx.fill();
      const body = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius);
      body.addColorStop(0, "#0b1324");
      body.addColorStop(1, "#13233b");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Les terres en pointillés
      if (land) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
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
      ctx.globalAlpha = Math.max(0, Math.min(1, (cycle - elapsed) / LINE_FADE));
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.shadowColor = lineColor;
      ctx.shadowBlur = 5;
      routes.forEach(([from, to], i) => {
        const progress = Math.max(0, Math.min(1, (elapsed - i * LINE_STAGGER) / LINE_DURATION));
        if (!progress) return;
        const a = screen[from];
        const b = screen[to];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        // Courbe bombée vers le haut de l'écran
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
      screen.forEach((p, i) => {
        const el = labelRefs.current[i];
        const side = LABEL_SIDES[labelSide[i]];
        if (!el || !side) return;
        const [ax, ay] = side;
        el.style.transform = `translate(${p.x + ax * LABEL_GAP}px, ${p.y + ay * LABEL_GAP}px) translate(${(ax - 1) * 50}%, ${(ay - 1) * 50}%)`;
      });

      frame = visible && (!reducedMotion || dragging) ? requestAnimationFrame(draw) : 0;
    };

    loadLandDots()
      .then((points) => {
        if (cancelled) return;
        land = points;
        if (!frame) draw();
      })
      .catch((err) => console.error("Erreur de chargement de la carte :", err));

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

    const onDown = (e: PointerEvent) => {
      dragging = { x: e.clientX, from: dragDeg };
      if (!frame) draw();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const next = dragging.from + (e.clientX - dragging.x) / (radius * DEG * 0.7);
      dragDeg = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, next));
    };
    const onUp = () => {
      dragging = null;
    };
    container.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [cities, routes, center, lineColor, zoom, tilt, sway, loop]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none cursor-grab active:cursor-grabbing ${className}`}
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
    </div>
  );
}
