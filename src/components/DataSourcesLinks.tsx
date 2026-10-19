import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

interface Operator {
  id: string;
  name: string;
}

interface DataSource {
  operatorName: string;
  url?: string;
  license?: string;
}

const SAME_COMPANY: Record<string, string> = { DB_REGIO: 'DB' };

const OPERATOR_SOURCES: Record<string, Omit<DataSource, 'operatorName'>> = {
  SNCF: {
    url: 'https://ressources.data.sncf.com',
    license: 'Open Database License (ODbL)',
  },
  RENFE: {
    url: 'https://data.renfe.com',
    license: 'Données ouvertes',
  },
  OUIGO_ES: {
    url: 'https://nap.transportes.gob.es',
    license: 'Données ouvertes',
  },
  TRENITALIA: {
    license: 'Données ouvertes',
  },
  ITALO: {
    license: 'Données ouvertes',
  },
  SNCB: {
    url: 'https://www.belgiantrain.be',
    license: 'Open Database License (ODbL)',
  },
  SWISS: {
    url: 'https://opentransportdata.swiss',
    license: 'Données ouvertes',
  },
  CP: {
    license: 'Données ouvertes',
  },
  NATIONAL_RAIL: {
    license: 'Données ouvertes',
  },
  EUROSTAR: {
    license: 'Données ouvertes',
  },
  EUROPEAN_SLEEPER: {
    license: 'Données ouvertes',
  },
  FLIXTRAIN: {
    url: 'https://gtfs.gis.flix.tech',
    license: 'Open Database License (ODbL)',
  },
  NS: {
    license: 'Données ouvertes',
  },
  TRENORD: {
    license: 'Données ouvertes',
  },
  DB: {
    license: 'Données ouvertes',
  },
  OBB: {
    license: 'Données ouvertes',
  },
  PKP: {
    license: 'Données ouvertes',
  },
  CD: {
    license: 'Données ouvertes',
  },
  MAV: {
    license: 'Données ouvertes',
  },
  DSB: {
    license: 'Données ouvertes',
  },
  CFL: {
    license: 'Données ouvertes',
  },
  ZSSK: {
    license: 'Données ouvertes',
  },
  HZPP: {
    license: 'Données ouvertes',
  },
};

const linkClass = 'text-[#1d7a5a] font-semibold underline';

export function DataSourcesLinks() {
  const [sources, setSources] = useState<(DataSource & { operatorId: string })[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/health`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.operators)) {
          setSources([]);
          return;
        }
        const seen = new Set<string>();
        const available: (DataSource & { operatorId: string })[] = [];
        for (const op of data.operators as Operator[]) {
          const id = SAME_COMPANY[op.id] ?? op.id;
          const sourceInfo = OPERATOR_SOURCES[id];
          if (sourceInfo && !seen.has(id)) {
            seen.add(id);
            available.push({
              operatorId: id,
              operatorName: op.name,
              ...sourceInfo,
            });
          }
        }
        available.sort((a, b) => a.operatorName.localeCompare(b.operatorName));
        setSources(available);
      })
      .catch(() => {
        setSources([]);
      });
    return () => controller.abort();
  }, [API_BASE_URL]);

  if (sources.length === 0) return null;

  return (
    <ul className="space-y-2">
      {sources.map((source) => (
        <li key={source.operatorId}>
          <strong className="text-midnight">{source.operatorName}</strong> — données ouvertes (GTFS)
          {source.url && (
            <>
              {' '}
              <a href={source.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {source.url.replace('https://', '').replace('http://', '')}
              </a>
            </>
          )}
          {source.license && <> — {source.license}</>}
        </li>
      ))}
    </ul>
  );
}
