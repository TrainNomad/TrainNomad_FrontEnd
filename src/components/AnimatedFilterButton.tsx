interface AnimatedFilterButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

// Icône SVG + qui devient × quand tournée de 45°
function CrossIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg
      className={`w-3 h-3 ml-1 transition-transform duration-500 ease-in-out ${isActive ? 'rotate-45' : 'rotate-0'}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function AnimatedFilterButton({
  isActive,
  onClick,
  children,
  className = '',
}: AnimatedFilterButtonProps) {
  const baseColor = isActive ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600';

  return (
    <button
      onClick={onClick}
      className={`group flex cursor-pointer items-center gap-1 rounded-full border-none ${baseColor} px-3 py-1.5 text-xs font-bold transition-all duration-500 ease-in-out shadow-none ${isActive ? '' : 'hover:bg-slate-200'} ${className}`}
    >
      {children}
      <CrossIcon isActive={isActive} />
    </button>
  );
}
