import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

interface Operator {
  id: string;
  name: string;
}

const SAME_COMPANY: Record<string, string> = { DB_REGIO: 'DB' };

const OPERATOR_COUNTRIES: Record<string, string> = {
  SNCF: 'France',
  RENFE: 'Espagne',
  OUIGO_ES: 'Espagne',
  TRENITALIA: 'Italie',
  ITALO: 'Italie',
  SNCB: 'Belgique',
  SWISS: 'Suisse',
  CP: 'Portugal',
  NATIONAL_RAIL: 'Royaume-Uni',
  EUROSTAR: 'International',
  EUROPEAN_SLEEPER: 'International',
  FLIXTRAIN: 'International',
  NS: 'Pays-Bas',
  TRENORD: 'Italie',
  DB: 'Allemagne',
  OBB: 'Autriche',
  PKP: 'Pologne',
  CD: 'République Tchèque',
  MAV: 'Hongrie',
  DSB: 'Danemark',
  CFL: 'Luxembourg',
  ZSSK: 'Slovaquie',
  HZPP: 'Croatie',
};

export function DataSourcesSummary() {
  const [operatorsByCountry, setOperatorsByCountry] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/health`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.operators)) {
          setOperatorsByCountry({});
          return;
        }
        const seen = new Set<string>();
        const grouped: Record<string, string[]> = {};
        for (const op of data.operators as Operator[]) {
          const id = SAME_COMPANY[op.id] ?? op.id;
          if (!seen.has(id)) {
            seen.add(id);
            const country = OPERATOR_COUNTRIES[id] ?? 'Autre';
            if (!grouped[country]) grouped[country] = [];
            grouped[country].push(op.name);
          }
        }
        const sorted = Object.fromEntries(
          Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
        );
        setOperatorsByCountry(sorted);
      })
      .catch(() => {
        setOperatorsByCountry({});
      });
    return () => controller.abort();
  }, [API_BASE_URL]);

  if (Object.keys(operatorsByCountry).length === 0) return null;

  return (
    <div className="bg-white rounded-lg p-6 border border-slate-200 mt-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(operatorsByCountry).map(([country, operators]) => (
          <div key={country}>
            <h4 className="font-bold text-midnight mb-2 text-sm">{country}</h4>
            <ul className="text-sm text-slate-600 space-y-1 list-none pl-6">
              {operators.map((op) => (
                <li key={op} className="relative pl-4 before:content-['→'] before:absolute before:left-0 before:text-[#4ade80] before:font-bold">
                  {op}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
