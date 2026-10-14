import SCENE from '../lib/mapNoticeScene.json';

// Petite scène animée de l'annonce de la carte (MapNotice) : un TGV Paris → Barcelone se dessine sur les
// vraies voies, les gares apparaissent au passage, puis la scène recommence. Tout est en CSS : pas de
// vidéo à télécharger. Les données (fond de carte simplifié, tracé) sont dans src/lib/mapNoticeScene.json.
const LOOP_S = 6.5; // durée d'une boucle
const DRAW = 0.6; // part de la boucle passée à dessiner le trajet
const FADE = 0.93; // début du fondu avant de recommencer
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

const STOP_RULES = SCENE.stops
  .map((stop, i) => {
    const at = stop.at * DRAW;
    const before = i === 0 ? '' : `0%,${pct(Math.max(0, at - 0.001))}{opacity:0;transform:scale(0)}`;
    return `@keyframes mns-stop-${i}{${before}${pct(at + 0.025)},${pct(FADE)}{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1)}}`;
  })
  .join('');

const CSS = `
@keyframes mns-line{0%{stroke-dashoffset:1;opacity:1}${pct(DRAW)},${pct(FADE)}{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
${STOP_RULES}
.mns-line{stroke-dasharray:1;animation:mns-line ${LOOP_S}s linear infinite}
.mns-stop{transform-box:fill-box;transform-origin:center}
@media (prefers-reduced-motion: reduce){.mns-line,.mns-stop{animation:none!important}}
`;

const END_LABELS: Record<number, { dx: number; dy: number }> = {
  0: { dx: 9, dy: 4 },
  [SCENE.stops.length - 1]: { dx: 9, dy: 5 },
};

export default function MapNoticeScene() {
  const last = SCENE.stops.length - 1;
  return (
    <svg
      viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
      className="block w-full h-auto"
      role="img"
      aria-label="Un train Paris – Barcelone dessiné sur les voies ferrées"
    >
      <style>{CSS}</style>
      <rect width={SCENE.width} height={SCENE.height} fill="#dcecf5" />
      <path d={SCENE.land} fill="#f7f4ec" stroke="#d9d3c3" strokeWidth="0.6" strokeLinejoin="round" />
      {/* liseré blanc, puis la ligne du train */}
      <path d={SCENE.route} pathLength={1} className="mns-line" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={SCENE.route} pathLength={1} className="mns-line" fill="none" stroke="#1d7a5a" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {SCENE.stops.map((stop, i) => {
        const end = i === 0 || i === last;
        const label = END_LABELS[i];
        return (
          <g key={stop.name} className="mns-stop" style={{ animation: `mns-stop-${i} ${LOOP_S}s linear infinite` }}>
            <circle cx={stop.x} cy={stop.y} r={end ? 4.2 : 2.4} fill="#ffffff" stroke="#1d7a5a" strokeWidth={end ? 2.2 : 1.4} />
            {label && (
              <text
                x={stop.x + label.dx}
                y={stop.y + label.dy}
                fontSize="11"
                fontWeight="700"
                fill="#0f172a"
                stroke="#ffffff"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {stop.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
