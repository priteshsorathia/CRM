
import Hero from './components/Hero';
import ValueProps from './components/ValueProps';
import ServicesCard from './components/ServicesCard';
import RetailersCard from './components/RetailersCard';
import RestaurantsCard from './components/RestaurantsCard';
import Analytics from './components/Analytics';
import HowItWorks from './components/HowItWorks';
// import Security from './components/Security';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
// import Modules from './components/Modules';
import Footer from '@/components/layout/Footer';


export default function Home() {
  return (
    <>
      <Hero />
      <ValueProps />
      {/* <HowItWorks /> */}
      <ServicesCard />
      <RetailersCard />
      <RestaurantsCard />
      <Analytics />
      {/* <Modules /> */}
      {/* <Security /> */}
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}
