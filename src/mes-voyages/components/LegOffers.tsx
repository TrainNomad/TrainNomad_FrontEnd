// « Voir les prix » d'un trajet enregistré : les sites partenaires qui vendent chacun de ses billets (mêmes liens que
// la page Voyage, src/lib/affiliates.ts). Pratique pour relever un prix, puis le saisir dans le budget.
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Tag } from 'lucide-react';
import { ticketsOf } from '../../lib/tickets';
import { affiliatesFor } from '../../lib/affiliates';
import { track } from '../../lib/analytics';
import { formatTime } from '../../lib/format';
import type { NetworkId } from '../../network/networks';
import type { Journey } from '../../types/api';
import { cx } from '../ui';

export function LegOffers({ journey, network }: { journey: Journey; network: NetworkId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tickets = ticketsOf(journey)
    .map((ticket) => ({ ticket, offers: affiliatesFor(ticket, network) }))
    .filter((t) => t.offers.length > 0);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (tickets.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
      >
        <Tag className="w-3.5 h-3.5" aria-hidden />
        {network === 'tgvmax' ? 'Réserver' : 'Voir les prix'}
        <ChevronDown className={cx('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-20 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-2xl border border-slate-200 shadow-xl p-2">
          {tickets.map(({ ticket, offers }, i) => (
            <div key={i} className={cx(i > 0 && 'mt-1 pt-2 border-t border-slate-100')}>
              <p className="px-3 pt-1 text-[11px] font-semibold text-slate-500">
                {tickets.length > 1 && `Billet ${i + 1} · `}
                {ticket.from.name} → {ticket.to.name} · départ {formatTime(ticket.departure, 'h')}
              </p>
              {offers.map(({ affiliate, url }) => (
                <a
                  key={affiliate.id}
                  href={url}
                  target="_blank"
                  rel="sponsored noopener"
                  onClick={() => {
                    track('clic-partenaire', { partenaire: affiliate.id, source: 'mes-voyages', from: ticket.from.city, to: ticket.to.city });
                    setOpen(false);
                  }}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-800">{affiliate.name}</span>
                    <span className="block text-xs text-slate-500">{affiliate.description}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden />
                </a>
              ))}
            </div>
          ))}
          <p className="px-3 pt-1.5 pb-1 text-[10px] text-slate-400">
            Liens partenaires : TrainNomad peut toucher une commission, sans surcoût pour vous. Pensez à reporter le prix dans votre budget.
          </p>
        </div>
      )}
    </div>
  );
}
