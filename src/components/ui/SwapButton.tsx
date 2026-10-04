interface Props {
  onClick: () => void;
  disabled?: boolean;
  /** Position et couleurs propres à chaque formulaire */
  className?: string;
}

/** Bouton rond qui inverse le départ et l'arrivée d'un formulaire de recherche. */
export function SwapButton({ onClick, disabled = false, className = '' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title="Inverser le départ et l'arrivée"
      aria-label="Inverser le départ et l'arrivée"
      className={`w-8 h-8 flex-shrink-0 rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm flex items-center justify-center transition-all hover:text-primary hover:border-primary active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-500 disabled:hover:border-slate-200 ${className}`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    </button>
  );
}
