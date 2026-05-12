import { motion } from 'framer-motion';
import { Search, MapPin } from 'lucide-react';
import heroBg from '../assets/hero-bg.png';

const Hero = () => {
  return (
    <section className="relative min-h-[700px] flex items-center pt-24 pb-16 overflow-hidden bg-black">
      {/* Background Image with Blur Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-black" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Title & Info */}
          <div className="lg:col-span-5 flex flex-col justify-center py-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl md:text-7xl font-black mb-4 leading-[1.1]">
                ENCUENTRA <br />
                TU <span className="text-premium-accent">PROFESIONAL</span> <br />
                HOY
              </h1>
              <p className="text-gray-400 text-lg mb-8 max-w-md font-medium">
                Conectamos personas con profesionales confiables en toda Argentina.
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white rounded-full" /> RÁPIDO</div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white rounded-full" /> CONFIABLE</div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-premium-accent rounded-full" /> CERCA TUYO</div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white rounded-full" /> 24/7</div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white rounded-full" /> SEGURO</div>
              </div>
            </motion.div>
          </div>

          {/* Middle Column: Search Form */}
          <div className="lg:col-span-4 flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl"
            >
               <h3 className="text-sm font-bold mb-6 text-gray-300">¿Qué servicio necesitás?</h3>
               <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        placeholder="Ej: Electricista, Plomero, Abogado..." 
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:border-premium-accent outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Tu ubicación</p>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input 
                        type="text" 
                        defaultValue="Buenos Aires, Argentina" 
                        className="w-full bg-white/5 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm focus:border-premium-accent outline-none"
                      />
                    </div>
                  </div>

                  <button className="w-full py-4 bg-premium-accent text-black rounded-xl font-black uppercase tracking-widest text-xs hover:bg-premium-accent/90 transition-all mt-4">
                    Buscar Profesional
                  </button>
               </div>
            </motion.div>
          </div>

          {/* Right Column: Sos Profesional Box */}
          <div className="lg:col-span-3 flex items-center">
             <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-full h-full max-h-[400px] bg-gradient-to-br from-[#0c0c0e] to-black border border-white/10 rounded-[32px] overflow-hidden relative flex flex-col justify-between"
             >
                <div className="p-8 relative z-10">
                   <h4 className="text-2xl font-black mb-4">¿SOS PROFESIONAL?</h4>
                   <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                     Potenciá tu negocio y conseguí más clientes.
                   </p>
                   <button className="px-6 py-2.5 border border-premium-accent/40 text-premium-accent rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-premium-accent/10 transition-all">
                     PUBLICÁ GRATIS
                   </button>
                </div>
                
                <div className="absolute right-0 bottom-0 w-3/4 h-3/4 opacity-80 pointer-events-none">
                   <img 
                     src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop" 
                     alt="Professional"
                     className="w-full h-full object-contain object-right-bottom grayscale"
                   />
                </div>
             </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
