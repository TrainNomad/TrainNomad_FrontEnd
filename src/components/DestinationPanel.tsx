import { DestinationList } from './DestinationList';
import { DestinationDetail } from './DestinationDetail';
import type { Destination } from '../types/explorer';

interface Props {
  destinations: Destination[];
  selected: Destination | null;
  loading: boolean;
  searched: boolean;
  originName: string;
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
  originName,
  onSelect,
  onClose,
}: Props) {
  return (
    <aside className="w-full flex flex-col overflow-hidden bg-white z-10">
      {selected ? (
        <DestinationDetail dest={selected} origin={originName} onClose={onClose} />
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
