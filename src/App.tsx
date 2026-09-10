import { Routes, Route } from 'react-router-dom';
import  Navbar from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { DestinationsSection } from './components/DestinationsSection';
import { GuidesSection } from './components/GuidesSection';
import { TGVMaxSection } from './components/TGVMaxSection';
import { EuropeSection } from './components/EuropeSection';
import Trajets from './pages/trajets';
import './styles/global.css';
import Explorer from './pages/explorer';

function HomePage() {
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

export default function App() {
  return (
    <div className="bg-white text-midnight font-display">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/trajets" element={<Trajets />} />
        <Route path="/explorer" element={<Explorer />} />
      </Routes>
      <Footer />
    </div>
  );
}