import { DestinationList } from './DestinationList';
import { DestinationDetail } from './DestinationDetail';
import type { Destination } from '../types/explorer';
import type { Place } from '../types/api';

interface Props {
  destinations: Destination[];
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
        <DestinationDetail dest={selected} origin={origin} date={date} onClose={onClose} />
      ) : (
        <DestinationList
          destinations={destinations}
          loading={loading}
          searched={searched}
          onSelect={onSelect}
        />
      )}
    </aside>
  );
}
