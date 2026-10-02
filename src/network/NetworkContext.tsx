import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { createApiClient } from '../services/api';
import type { ApiClient } from '../services/api';
import { NETWORKS } from './networks';
import type { NetworkConfig, NetworkId } from './networks';

interface NetworkValue {
  network: NetworkConfig;
  api: ApiClient;
}

const europeValue: NetworkValue = { network: NETWORKS.europe, api: createApiClient(NETWORKS.europe.apiUrl) };

// Par défaut (pages sans <NetworkScope>) : réseau Europe, comportement historique.
const NetworkContext = createContext<NetworkValue>(europeValue);

/** Réseau courant (config + client API) : Europe par défaut, TGVmax sous /tgvmax. */
export function useNetwork(): NetworkValue {
  return useContext(NetworkContext);
}

/**
 * Délimite une partie de l'application servie par un réseau : les composants qu'elle contient
 * interrogent son API et prennent ses couleurs (variables CSS --brand, --tone-*).
 */
export function NetworkScope({ network: id, children }: { network: NetworkId; children: ReactNode }) {
  const value = useMemo<NetworkValue>(
    () => (id === 'europe' ? europeValue : { network: NETWORKS[id], api: createApiClient(NETWORKS[id].apiUrl) }),
    [id],
  );
  return (
    <NetworkContext.Provider value={value}>
      {/* `contents` : pas de boîte supplémentaire, mais les variables CSS du thème sont héritées */}
      <div className={`${value.network.themeClass} contents`}>{children}</div>
    </NetworkContext.Provider>
  );
}
