import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Urgencias from './components/Urgencias';
import Categories from './components/Categories';
import Banners from './components/Banners';
import Map from './components/Map';
import Gallery from './components/Gallery';
import Pricing from './components/Pricing';
import Metrics from './components/Metrics';
import Security from './components/Security';
import Register from './components/Register';
import AdminPreview from './components/AdminPreview';
import Support from './components/Support';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-premium-accent/30 overflow-x-hidden">
      <Navbar />
      
      <main>
        <Hero />
        
        {/* Priority: Emergencies Section */}
        <div id="urgencies">
          <Urgencias />
        </div>
        
        {/* Real Metrics Section */}
        <Metrics />

        {/* Categories Section */}
        <div id="categories">
          <Categories />
        </div>
        
        {/* Sponsor Banners */}
        <Banners />
        
        {/* Professional Plans / Pricing */}
        <Pricing />

        {/* Map & Local Search */}
        <div id="map">
          <Map />
        </div>

        {/* Portfolio / Work Gallery */}
        <Gallery />

        {/* Security & Trust */}
        <Security />

        {/* Registration Section */}
        <div id="register">
          <Register />
        </div>

        {/* Admin Backoffice Preview */}
        <AdminPreview />

        {/* Support & FAQ */}
        <Support />
      </main>

      <Footer />
    </div>
  );
}

export default App;
