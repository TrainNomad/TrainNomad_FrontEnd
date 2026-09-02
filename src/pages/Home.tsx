// src/pages/Home.tsx
import { HeroSection } from '../components/HeroSection';
import { DestinationsSection } from '../components/DestinationsSection';
import { GuidesSection } from '../components/GuidesSection';
import { TGVMaxSection } from '../components/TGVMaxSection';
import { EuropeSection } from '../components/EuropeSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <DestinationsSection />
      <GuidesSection />
      <TGVMaxSection />
      <EuropeSection />
    </>
  );
}