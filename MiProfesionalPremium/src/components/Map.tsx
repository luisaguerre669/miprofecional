import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Star, ShieldCheck, Zap, ExternalLink } from 'lucide-react';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const featuredPros = [
  { name: 'Ricardo G.', profession: 'Electricista Matriculado', rating: 4.9, premium: true },
  { name: 'Sandra L.', profession: 'Enfermera Profesional', rating: 5.0, premium: true },
  { name: 'Esteban M.', profession: 'Cerrajería 24hs', rating: 4.8, premium: true },
];

const Map = () => {
  return (
    <section id="map" className="py-24 bg-black relative">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12">
           
           {/* Sidebar: Featured & Ads (50%) */}
           <div className="w-full lg:w-1/2 space-y-8">
              <div className="max-w-md">
                 <p className="text-[11px] font-bold text-premium-accent uppercase tracking-[0.3em] mb-4">Profesionales Destacados</p>
                 <h2 className="text-3xl font-bold mb-6">Red local verificada</h2>
                 <p className="text-gray-500 mb-8">
                   Encontrá a los mejores profesionales en tu zona con validación de identidad y certificaciones vigentes.
                 </p>
              </div>

              <div className="space-y-4">
                 {featuredPros.map((pro, idx) => (
                    <div key={idx} className="group flex items-center justify-between p-5 glass-premium rounded-[24px] border border-white/5 hover:border-premium-accent/30 transition-all cursor-pointer">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-800 overflow-hidden">
                             <img src={`https://i.pravatar.cc/150?u=pro${idx}`} alt={pro.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold text-white">{pro.name}</h4>
                                {pro.premium && <ShieldCheck className="w-3.5 h-3.5 text-premium-accent" />}
                             </div>
                             <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{pro.profession}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="flex items-center gap-1 text-premium-accent mb-1 justify-end">
                             <Star className="w-3 h-3 fill-premium-accent" />
                             <span className="text-xs font-bold">{pro.rating}</span>
                          </div>
                          <p className="text-[9px] font-black text-emerald-500 uppercase">Disponible</p>
                       </div>
                    </div>
                 ))}
              </div>

              {/* Premium Ad Space */}
              <div className="p-8 rounded-[32px] bg-gradient-to-br from-premium-accent/10 to-transparent border border-premium-accent/20 relative overflow-hidden">
                 <div className="relative z-10">
                    <p className="text-[9px] font-black text-premium-accent uppercase tracking-widest mb-2">Espacio Patrocinado</p>
                    <h4 className="text-lg font-bold mb-4">Ferretería Central S.A.</h4>
                    <p className="text-xs text-gray-400 mb-6 max-w-[200px]">Todo en herramientas y materiales de construcción. Envíos en el día.</p>
                    <button className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-widest">
                      Visitar Tienda <ExternalLink className="w-3 h-3" />
                    </button>
                 </div>
                 <Zap className="absolute top-1/2 right-4 -translate-y-1/2 w-24 h-24 text-premium-accent/10 -rotate-12" />
              </div>
           </div>

           {/* Map: Minimalist Style (50%) */}
           <div className="w-full lg:w-1/2 h-[600px] rounded-[40px] overflow-hidden border border-white/5 relative group shadow-2xl">
              <div className="absolute inset-0 bg-black/20 pointer-events-none z-10 group-hover:bg-transparent transition-all" />
              
              <MapContainer 
                center={[-34.6037, -58.3816]} 
                zoom={14} 
                className="w-full h-full"
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[-34.6037, -58.3816]}>
                  <Popup>Tu ubicación</Popup>
                </Marker>
                <Marker position={[-34.6087, -58.3716]}>
                  <Popup>Electricista Disponible</Popup>
                </Marker>
              </MapContainer>
              
              {/* Search Overlay */}
              <div className="absolute top-6 left-6 right-6 z-[1000]">
                 <div className="relative">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                   <input 
                     type="text" 
                     placeholder="Buscar profesionales en esta zona..." 
                     className="w-full bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs focus:border-premium-accent outline-none"
                   />
                 </div>
              </div>

              <div className="absolute bottom-6 left-6 z-[1000] glass px-4 py-3 rounded-2xl flex items-center gap-3">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-bold text-white uppercase tracking-widest">1,248 Profesionales Activos</span>
              </div>
           </div>

        </div>
      </div>
    </section>
  );
};

export default Map;
