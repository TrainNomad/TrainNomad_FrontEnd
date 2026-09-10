interface Props {
  icon: React.ReactNode;
  label: string;
  value: string;
  /** Highlights the value in brand green when true (e.g. "Direct") */
  accent?: boolean;
}

/**
 * Small stat tile with an icon, a label and a value.
 * Used in a 2-column grid inside DestinationDetail.
 */
export function InfoCard({ icon, label, value, accent = false }: Props) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <div className="flex items-center gap-1.5 text-slate-400 mb-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p
        className="font-bold text-base"
        style={{ color: accent ? '#1d7a5a' : '#1A2B3C' }}
      >
        {value}
      </p>
    </div>
  );
}
