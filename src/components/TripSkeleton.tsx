export default function CardLoad() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm animate-pulse flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 w-full">
      
      {/* Bloc Départ (Squelette) */}
      <div className="flex-1 min-w-[150px] space-y-2 px-2">
        <div className="h-3 w-12 bg-slate-200 rounded"></div>
        <div className="h-5 w-28 bg-slate-100 rounded"></div>
      </div>

      <div className="w-px bg-slate-100 my-2 hidden lg:block h-8"></div>

      {/* Bloc Arrivée (Squelette) */}
      <div className="flex-1 min-w-[150px] space-y-2 px-2">
        <div className="h-3 w-12 bg-slate-200 rounded"></div>
        <div className="h-5 w-28 bg-slate-100 rounded"></div>
      </div>

      <div className="w-px bg-slate-100 my-2 hidden lg:block h-8"></div>

      {/* Bloc Durée / Trajet (Squelette) */}
      <div className="w-full lg:w-44 space-y-2 px-2 flex flex-col items-center">
        <div className="h-3 w-16 bg-slate-200 rounded"></div>
        <div className="h-2 w-24 bg-slate-100 rounded-full"></div>
      </div>

      <div className="w-px bg-slate-100 my-2 hidden lg:block h-8"></div>

      {/* Bloc Prix (Squelette) */}
      <div className="w-full lg:w-32 space-y-2 px-2 text-right">
        <div className="h-3 w-10 bg-slate-200 rounded ml-auto"></div>
        <div className="h-5 w-16 bg-slate-100 rounded ml-auto"></div>
      </div>

      {/* Bouton de réservation (Squelette) */}
      <div className="w-full lg:w-auto p-1">
        <div className="h-11 w-full lg:w-32 bg-slate-200 rounded-xl"></div>
      </div>

    </div>
  );
}