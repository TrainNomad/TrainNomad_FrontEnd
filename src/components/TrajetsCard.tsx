import { useState, useEffect } from 'react';

// Définition de l'interface pour TypeScript
interface Trajet {
  id: number;
  departure: string;
  arrival: string;
  date: string;
  price: string;
  type: string;
}

interface TrajetCardProps {
  trajet: Trajet;
}

// Sous-composant avec ses props typées
function TrajetCard({ trajet }: TrajetCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">
          {trajet.departure} ➔ {trajet.arrival}
        </h3>
        <p className="text-sm text-gray-500">Date : {trajet.date} | Type : {trajet.type}</p>
      </div>
      <div className="text-right">
        <span className="text-xl font-bold text-green-600">{trajet.price}</span>
        <div className="mt-1">
          <button className="px-4 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition">
            Voir détails
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant principal de la page Trajets
export default function Trajets() {
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const dummyTrajets: Trajet[] = [
      { id: 1, departure: 'Rennes', arrival: 'Vannes', date: '2026-09-01', price: '9.00 €', type: 'TER BreizhGo' },
      { id: 2, departure: 'Paris', arrival: 'Amsterdam', date: '2026-09-05', price: '35.00 €', type: 'TGV / Thalys' },
      { id: 3, departure: 'Lyon', arrival: 'Marseille', date: '2026-09-10', price: '19.50 €', type: 'TGV Inoui' },
    ];
    setTrajets(dummyTrajets);
  }, []);

  const filteredTrajets = trajets.filter(t => 
    t.departure.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.arrival.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-indigo-700">Gestion des Trajets - TrainNomad</h1>
      
      {/* Barre de recherche */}
      <div className="mb-6">
        <input 
          type="text"
          placeholder="Rechercher par ville de départ ou d'arrivée..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Liste des trajets */}
      <div className="grid gap-4">
        {filteredTrajets.length > 0 ? (
          filteredTrajets.map((trajet) => (
            <TrajetCard key={trajet.id} trajet={trajet} />
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">Aucun trajet trouvé.</p>
        )}
      </div>
    </div>
  );
}