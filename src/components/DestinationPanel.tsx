import { DestinationList } from './DestinationList';
import { DestinationDetail } from './DestinationDetail';
import type { Destination } from '../types/explorer';
import type { Place } from '../types/api';

interface Props {
  /** Destinations dans la durée maximale choisie */
  destinations: Destination[];
  /** Nombre de destinations avant filtrage par durée */
  total: number;
  /** Durée maximale choisie (minutes) : fixe l'échelle de couleurs */
  scaleMax: number;
  selected: Destination | null;
  loading: boolean;
  searched: boolean;
  origin: Place | null;
  date: string;
  onSelect: (dest: Destination) => void;
  onClose: () => void;
}

/**
 * Right-side 340px panel.
 * Renders <DestinationDetail> when a destination is selected,
 * otherwise renders <DestinationList>.
 */
export function DestinationPanel({
  destinations,
  total,
  scaleMax,
  selected,
  loading,
  searched,
  origin,
  date,
  onSelect,
  onClose,
}: Props) {
  return (
    <aside className="w-full flex flex-col overflow-hidden bg-white z-10">
      {selected ? (
        <DestinationDetail dest={selected} origin={origin} date={date} scaleMax={scaleMax} onClose={onClose} />
      ) : (
        <DestinationList
          destinations={destinations}
          total={total}
          scaleMax={scaleMax}
          loading={loading}
          searched={searched}
          onSelect={onSelect}
        />
      )}
    </aside>
  );
}
