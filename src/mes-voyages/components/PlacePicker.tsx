// Choix d'un départ et d'une arrivée avec l'autocomplétion des gares du site (composant existant, réutilisé tel quel).
import { AutocompleteInput } from '../../components/AutocompleteInput';
import type { Place } from '../../types/api';

export function PlacePicker({
  idPrefix,
  from,
  to,
  onFrom,
  onTo,
}: {
  idPrefix: string;
  from: Place | null;
  to: Place | null;
  onFrom: (p: Place | null) => void;
  onTo: (p: Place | null) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 rounded-2xl border border-slate-200 bg-white divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
      <AutocompleteInput
        id={`${idPrefix}-from`}
        label="Départ"
        placeholder="Ville ou gare"
        icon="trip_origin"
        compact
        initialValue={from?.name ?? ''}
        isSelected={!!from}
        onSelect={onFrom}
        onQueryChange={() => from && onFrom(null)}
      />
      <AutocompleteInput
        id={`${idPrefix}-to`}
        label="Arrivée"
        placeholder="Ville ou gare"
        icon="location_on"
        compact
        initialValue={to?.name ?? ''}
        isSelected={!!to}
        onSelect={onTo}
        onQueryChange={() => to && onTo(null)}
      />
    </div>
  );
}
