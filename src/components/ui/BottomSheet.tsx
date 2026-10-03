import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { animate, motion, useDragControls, useMotionValue } from 'framer-motion';

export type SheetSnap = 'peek' | 'half' | 'full';

/** Hauteur visible de la feuille à chaque cran, en pixels. */
export type SheetHeights = Record<SheetSnap, number>;

interface Props {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  heights: SheetHeights;
  children: ReactNode;
}

const SNAPS: SheetSnap[] = ['peek', 'half', 'full'];
const SPRING = { type: 'spring', stiffness: 420, damping: 42 } as const;

/**
 * Feuille qui monte du bas de l'écran (comme sur Airbnb ou Google Maps), à trois crans.
 * Elle n'est pas modale : ce qui se trouve derrière (la carte) reste utilisable.
 * Le parent doit être `position: relative`.
 *
 * Au cran plein, le contenu défile normalement et seule la poignée déplace la feuille ;
 * aux autres crans, tirer n'importe où sur la feuille la déplace.
 */
export function BottomSheet({ snap, onSnapChange, heights, children }: Props) {
  const controls = useDragControls();
  // Décalage vers le bas par rapport au cran plein
  const offsetOf = (s: SheetSnap) => heights.full - heights[s];
  const y = useMotionValue(offsetOf(snap));
  const dragged = useRef(false);
  const locked = snap !== 'full';

  useEffect(() => {
    const animation = animate(y, heights.full - heights[snap], SPRING);
    return () => animation.stop();
  }, [y, snap, heights]);

  const startDrag = (e: React.PointerEvent) => controls.start(e);

  const handleDragEnd = (_: unknown, info: { velocity: { y: number } }) => {
    // Un geste rapide emmène au cran suivant même si la feuille a peu bougé
    const projected = y.get() + info.velocity.y * 0.18;
    const nearest = SNAPS.reduce((best, s) =>
      Math.abs(offsetOf(s) - projected) < Math.abs(offsetOf(best) - projected) ? s : best,
    );
    if (nearest === snap) animate(y, offsetOf(snap), SPRING);
    else onSnapChange(nearest);
  };

  const cycle = () => {
    if (dragged.current) return;
    onSnapChange(snap === 'full' ? 'half' : snap === 'half' ? 'full' : 'half');
  };

  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col bg-white rounded-t-3xl border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(15,23,42,0.14)]"
      style={{ height: heights.full, y }}
      drag="y"
      dragControls={controls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: offsetOf('peek') }}
      dragElastic={0.05}
      dragMomentum={false}
      // `dragged` sert à ignorer le clic qui suit un glissement à la souris. Au doigt, un glissement
      // ne produit pas de clic : on repart donc de zéro à chaque nouvel appui.
      onPointerDownCapture={() => (dragged.current = false)}
      onDragStart={() => (dragged.current = true)}
      onDragEnd={handleDragEnd}
    >
      <button
        type="button"
        onPointerDown={startDrag}
        onClick={cycle}
        aria-label={snap === 'full' ? 'Réduire la liste' : 'Agrandir la liste'}
        className="flex-shrink-0 w-full h-7 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
      >
        <span className="w-10 h-1.5 rounded-full bg-slate-300" />
      </button>

      {/* Hors du cran plein, rien ne défile : le geste déplace la feuille. Au cran plein, seules
          les zones défilantes du contenu (classe `overflow-y-auto`) défilent, sans entraîner la
          page derrière ; tirer ailleurs (un titre, par exemple) déplace la feuille.
          Un glissement ne doit pas compter comme un clic sur l'élément relâché. */}
      <div
        className={`flex-1 min-h-0 flex touch-none ${
          locked
            ? '[&_*]:touch-none'
            : '[&_.overflow-y-auto]:touch-pan-y [&_.overflow-y-auto]:overscroll-contain'
        }`}
        onPointerDown={(e) => {
          if (locked || !(e.target as Element).closest('.overflow-y-auto')) startDrag(e);
        }}
        onClickCapture={(e) => {
          if (!dragged.current) return;
          e.preventDefault();
          e.stopPropagation();
          dragged.current = false;
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
