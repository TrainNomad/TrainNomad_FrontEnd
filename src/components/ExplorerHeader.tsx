import { ExplorerSearchBar } from './ExplorerSearchBar';
import type { Station } from '../types';

interface Props {
  fromQuery: string;
  loading: boolean;
  resultCount: number;
  originName: string;
  onQueryChange: (v: string) => void;
  onSelect: (station: Station | null) => void;
  onSearch: () => void;
}

/**
 * Sticky top bar: TrainNomad logo on the left, ExplorerSearchBar on the right.
 */
export function ExplorerHeader(props: Props) {
  return (
    <header className="flex-shrink-0 bg-white border-b border-slate-100 shadow-sm z-10">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2 mr-4 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#1d7a5a] flex items-center justify-center">
            <span className="text-white text-xs font-black">TN</span>
          </div>
          <span className="font-black text-[#1A2B3C] text-base">
            TrainNomad<span className="text-[#1d7a5a]">.eu</span>
          </span>
        </a>

        <ExplorerSearchBar {...props} />
      </div>
    </header>
  );
}