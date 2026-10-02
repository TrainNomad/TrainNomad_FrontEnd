import { useRef, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
// Contours des terres (paquet world-atlas), copiés dans le build : plus d'appel à jsDelivr
import landUrl from 'world-atlas/land-50m.json?url';

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
  showLabels?: boolean;
  animationDuration?: number;
  loop?: boolean;
}

export function EuropeMap({ 
  dots = [], 
  lineColor = "#10b981",
  showLabels = true,
  animationDuration = 2,
  loop = true
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [landGeoJson, setLandGeoJson] = useState<any>(null);

  const projection = useMemo(() => {
    return geoMercator()
      .center([3, 49])
      .scale(800)
      .translate([400, 240]);
  }, []);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  useEffect(() => {
    fetch(landUrl)
      .then((res) => res.json())
      .then((data) => {
        const land = feature(data, data.objects.land);
        setLandGeoJson(land);
      })
      .catch((err) => console.error("Erreur de chargement de la carte :", err));
  }, []);

  const projectPoint = (lat: number, lng: number) => {
    const coords = projection([lng, lat]);
    return coords ? { x: coords[0], y: coords[1] } : { x: 0, y: 0 };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 25;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  const staggerDelay = 0.3;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 2;
  const fullCycleDuration = totalAnimationTime + pauseTime;

  const uniqueLocations = useMemo(() => {
    const locationsMap = new Map<string, { lat: number; lng: number; label?: string }>();
    dots.forEach((dot) => {
      const startKey = `${dot.start.lat}-${dot.start.lng}`;
      const endKey = `${dot.end.lat}-${dot.end.lng}`;
      if (!locationsMap.has(startKey)) locationsMap.set(startKey, dot.start);
      if (!locationsMap.has(endKey)) locationsMap.set(endKey, dot.end);
    });
    return Array.from(locationsMap.values());
  }, [dots]);

  return (
    <div className="w-full h-full relative font-sans overflow-hidden">
      <svg
        ref={svgRef}
        viewBox="0 0 800 500"
        className="w-full h-full absolute inset-0 pointer-events-auto select-none z-10"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="path-gradient-europe" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="50%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
          </linearGradient>

          <filter id="glow-europe">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Points de fond en blanc pur avec l'opacité souhaitée */}
          <pattern id="dot-texture" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#ffffff" opacity="0.4" />
          </pattern>
        </defs>

        {/* Tracé unique des continents (optimisé) */}
        {landGeoJson && (
          <path
            d={pathGenerator(landGeoJson) || ""}
            fill="url(#dot-texture)"
            stroke="#ffffff"
            strokeWidth="0.5"
            strokeOpacity="0.3"
          />
        )}

        {/* Lignes de trajet animées (le point mobile a été retiré ici) */}
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);

          const startTime = (i * staggerDelay) / fullCycleDuration;
          const endTime = (i * staggerDelay + animationDuration) / fullCycleDuration;
          const resetTime = totalAnimationTime / fullCycleDuration;

          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient-europe)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={loop ? { pathLength: [0, 0, 1, 1, 0] } : { pathLength: 1 }}
                transition={loop ? {
                  duration: fullCycleDuration,
                  times: [0, startTime, endTime, resetTime, 1],
                  ease: "easeInOut",
                  repeat: Infinity,
                } : {
                  duration: animationDuration,
                  delay: i * staggerDelay,
                  ease: "easeInOut",
                }}
              />
            </g>
          );
        })}

        {/* Points d'ancrage fixes et étiquettes */}
        {uniqueLocations.map((loc, i) => {
          const pt = projectPoint(loc.lat, loc.lng);

          return (
            <g key={`location-${i}`}>
              <motion.g
                onHoverStart={() => setHoveredLocation(loc.label || null)}
                onHoverEnd={() => setHoveredLocation(null)}
                className="cursor-pointer"
                whileHover={{ scale: 1.3 }}
              >
                <circle cx={pt.x} cy={pt.y} r="4.5" fill={lineColor} filter="url(#glow-europe)" />
              </motion.g>
              {showLabels && loc.label && (
                <foreignObject x={pt.x - 45} y={pt.y - 30} width="90" height="25" className="pointer-events-none">
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/95 text-emerald-300 border border-emerald-500/40 shadow-sm backdrop-blur-md">
                      {loc.label}
                    </span>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>

      <AnimatePresence>
        {hoveredLocation && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-3 left-3 bg-slate-900/90 text-emerald-400 px-3 py-1 rounded-md text-xs font-semibold backdrop-blur-sm border border-emerald-500/30 z-20"
          >
            {hoveredLocation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}