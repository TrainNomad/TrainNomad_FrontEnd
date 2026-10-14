// Association ville -> guide : la liste des guides (API des guides) est chargée une seule fois, puis
// on cherche le guide dont le nom correspond à la ville d'arrivée d'un trajet ou d'une destination.
import { useEffect, useState } from 'react';
import { GUIDES_API_URL } from '../config';
import type { Place } from '../types/api';

export interface CityGuide {
  slug: string;
  name: string;
  image: string;
  description: string;
  readingTime: number;
}

/** "Saint-Malo" -> "saint malo", "Genève" -> "geneve" : comparaison sans accents, casse ni tirets. */
export function normalizeCity(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Ville d'un lieu : son nom pour une ville, sa ville de rattachement pour une gare. */
export function placeCity(place: Place): string {
  return place.type === 'city' ? place.name : place.city || place.name;
}

let guidesPromise: Promise<Map<string, CityGuide>> | null = null;

/** Guides indexés par nom de ville normalisé (une seule requête par visite). */
function loadGuides(): Promise<Map<string, CityGuide>> {
  if (!guidesPromise) {
    guidesPromise = fetch(`${GUIDES_API_URL}/guides`)
      .then((res) => (res.ok ? res.json() : { guides: [] }))
      .then((data) => {
        const byCity = new Map<string, CityGuide>();
        for (const g of data.guides || []) {
          byCity.set(normalizeCity(g.name), {
            slug: g.slug,
            name: g.name,
            image: g.image,
            description: g.description,
            readingTime: g.reading_time,
          });
        }
        return byCity;
      })
      .catch(() => {
        guidesPromise = null; // nouvel essai à la prochaine destination
        return new Map<string, CityGuide>();
      });
  }
  return guidesPromise;
}

/** Guide de la ville, ou null s'il n'y en a pas (ou pas encore chargé). */
export function useCityGuide(city: string | null | undefined): CityGuide | null {
  const [guide, setGuide] = useState<CityGuide | null>(null);
  useEffect(() => {
    setGuide(null);
    if (!city) return;
    let cancelled = false;
    loadGuides().then((byCity) => {
      if (!cancelled) setGuide(byCity.get(normalizeCity(city)) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [city]);
  return guide;
}
