import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

// Couleurs thémables : `brand` (couleur de la marque) et `tone-*` (échelle claire → foncée).
// Leurs valeurs viennent des variables CSS de src/styles/global.css : vert pour l'Europe,
// orange sous .theme-tgvmax. Ex. : bg-brand, hover:bg-brand-dark, bg-brand/10, text-tone-600.
const tone = (n) => `rgb(var(--tone-${n}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'rgb(var(--brand-rgb) / <alpha-value>)',
          dark: 'var(--brand-dark)',
          soft: 'var(--brand-soft)',
        },
        tone: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 900].map((n) => [n, tone(n)])),
      },
    },
  },
  plugins: [forms, containerQueries],
};
