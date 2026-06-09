import Navbar from '@/components/Navbar';
import AlphaHero from '@/components/AlphaHero';
import AlphaFeed from '@/components/AlphaFeed';
import CommunitySubmit from '@/components/CommunitySubmit';
import Hunters from '@/components/Hunters';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <AlphaHero />
      <AlphaFeed />
      <Hunters />
      <CommunitySubmit />
      <Footer />
    </>
  );
}
