import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
// Polices et icônes servies par le site lui-même (pas de Google Fonts ni de CDN Font Awesome)
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import 'material-symbols/outlined.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './App';
import { API_BASE_URL, GUIDES_API_URL, TGVMAX_API_URL } from './config';

// Réveille les API Render dès l'ouverture du site (elles s'endorment après 15 min sans visite) :
// la première recherche n'attend ainsi pas tout le redémarrage.
for (const url of [API_BASE_URL, GUIDES_API_URL, TGVMAX_API_URL]) {
  fetch(`${url}/health`).catch(() => {});
}

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);