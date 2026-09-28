import { useState, useEffect, useCallback } from 'react';
import type { GuideDestination } from '../types';
import { GUIDES_API_URL } from '../config';

export interface EssentialItem {
  name: string;
  description: string;
}

export interface Essentials {
  to_see?: EssentialItem[];
  experiences?: EssentialItem[];
  mobility?: EssentialItem[];
}

export interface ItineraryStep {
  time: string;
  title: string;
  description: string;
  type: 'transport' | 'visit' | 'food' | 'leisure';
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  steps: ItineraryStep[];
}

export interface TrainStation {
  name: string;
  description: string;
  services?: string[];
  connections?: string[];
}

export interface TrainRoute {
  from: string;
  description: string;
  duration: string;
  operators?: string[];
}

export interface TrainTravel {
  intro?: string;
  stations?: TrainStation[];
  routes?: TrainRoute[];
}

export interface PracticalInfo {
  title: string;
  icon: string;
  content: string;
}

export interface JourneyPoint {
  name: string;
  code?: string;
  lat: number;
  lon: number;
}

export interface JourneyLeg {
  id: number;
  type: 'train' | 'transfer';
  operator?: string;
  trainType?: string;
  trainNumber?: string;
  from: JourneyPoint;
  to?: JourneyPoint;
  departure?: string;
  arrival?: string;
  durationMin: number;
  mode?: string;
  description?: string;
  overnight?: boolean;
  amenities?: string[];
}

export interface DefaultJourney {
  origin: JourneyPoint;
  destination: JourneyPoint;
  legs: JourneyLeg[];
}

export interface PhotoSpot {
  name: string;
  description: string;
  kmFromParis: number;
  lat: number;
  lon: number;
  bestSide: string;
  type: string;
}

export interface Section {
  id: string;
  title: string;
  icon: string;
  content: string;
}

export interface Fact {
  icon: string;
  label: string;
  value: string;
}

export interface GuideDetail extends GuideDestination {
  heroImage: string;
  sections: Section[];
  quickFacts: Fact[];
  introduction?: string;
  essentials?: Essentials;
  itinerary?: ItineraryDay[];
  trainTravel?: TrainTravel;
  practical?: PracticalInfo[];
  defaultJourney?: DefaultJourney;
  photoSpots?: PhotoSpot[];
}

interface GuidesListResponse {
  guides: GuideDestination[];
  total: number;
}

interface UseGuidesResult {
  guides: GuideDestination[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseGuideDetailResult {
  guide: GuideDetail | null;
  loading: boolean;
  error: string | null;
}

export function useGuides(options?: { country?: string; search?: string; featured?: boolean }): UseGuidesResult {
  const [guides, setGuides] = useState<GuideDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.country) params.set('country', options.country);
      if (options?.search) params.set('search', options.search);
      if (options?.featured) params.set('featured', 'true');

      const url = `${GUIDES_API_URL}/guides${params.toString() ? '?' + params : ''}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }

      const data: GuidesListResponse = await res.json();
      setGuides(data.guides);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setGuides([]);
    } finally {
      setLoading(false);
    }
  }, [options?.country, options?.search, options?.featured]);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  return { guides, loading, error, refetch: fetchGuides };
}

export function useGuideDetail(slug: string | undefined): UseGuideDetailResult {
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('Slug manquant');
      return;
    }

    const fetchGuide = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${GUIDES_API_URL}/guides/${slug}`);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Guide non trouve');
          }
          throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        // Mapper les noms de champs snake_case vers camelCase
        const mapped: GuideDetail = {
          slug: data.slug,
          name: data.name,
          country: data.country,
          countryCode: data.country_code,
          image: data.image,
          heroImage: data.hero_image,
          description: data.description,
          readingTime: data.reading_time,
          featured: data.featured,
          featuredTitle: data.featured_title,
          featuredSubtitle: data.featured_subtitle,
          sections: data.sections || [],
          quickFacts: data.quick_facts || [],
          tags: data.tags || [],
          introduction: data.introduction,
          essentials: data.essentials,
          itinerary: data.itinerary,
          trainTravel: data.train_travel,
          practical: data.practical,
          defaultJourney: data.default_journey ? {
            origin: data.default_journey.origin,
            destination: data.default_journey.destination,
            legs: data.default_journey.legs?.map((leg: Record<string, unknown>) => ({
              ...leg,
              trainType: leg.train_type,
              trainNumber: leg.train_number,
              durationMin: leg.duration_min,
            })) || [],
          } : undefined,
          photoSpots: data.photo_spots?.map((spot: Record<string, unknown>) => ({
            ...spot,
            kmFromParis: spot.km_from_paris,
            bestSide: spot.best_side,
          })) || [],
        };

        setGuide(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        setGuide(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [slug]);

  return { guide, loading, error };
}

export function useCountries() {
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${GUIDES_API_URL}/countries`)
      .then(res => res.json())
      .then(data => {
        setCountries(data.countries || []);
      })
      .catch(() => {
        setCountries([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { countries, loading };
}
