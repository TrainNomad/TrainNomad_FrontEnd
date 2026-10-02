import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export default function NotFound() {
  usePageMeta('Page introuvable');
  return (
    <div className="min-h-[60vh] bg-white flex items-center justify-center px-6 py-24">
      <div className="text-center max-w-md">
        <div className="text-7xl font-extrabold text-slate-200 mb-6">404</div>
        <h1 className="text-3xl font-extrabold text-midnight mb-4">Page introuvable</h1>
        <p className="text-slate-500 mb-8">Cette page n'existe pas ou a été déplacée.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1d7a5a] hover:bg-[#155d44] text-white font-bold rounded-xl transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
