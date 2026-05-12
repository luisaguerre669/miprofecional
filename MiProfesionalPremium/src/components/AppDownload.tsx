import { motion } from 'framer-motion';
import { Apple, PlayCircle, QrCode } from 'lucide-react';
import mobileMockup from '../assets/mobile-mockup.png';

const AppDownload = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-premium-dark to-black">
      <div className="container mx-auto px-6">
         <div className="glass-premium rounded-[60px] p-12 lg:p-24 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-premium-accent/10 blur-[120px] rounded-full -translate-y-1/2" />
            
            <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
               <div>
                  <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
                    Llevá MiProfesional <br />
                    en tu <span className="premium-gradient-text italic">bolsillo</span>
                  </h2>
                  <p className="text-gray-400 text-lg mb-12 max-w-md">
                    Descargá nuestra app y gestioná tus pedidos, chateá en tiempo real y seguí la ubicación de tus profesionales desde cualquier lugar.
                  </p>

                  <div className="flex flex-wrap gap-6 mb-12">
                     <button className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all">
                        <Apple className="w-6 h-6" />
                        <div className="text-left">
                           <p className="text-[10px] uppercase tracking-wider">Download on the</p>
                           <p className="text-lg leading-tight">App Store</p>
                        </div>
                     </button>
                     <button className="flex items-center gap-3 px-8 py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-bold hover:bg-white/20 transition-all">
                        <PlayCircle className="w-6 h-6" />
                        <div className="text-left">
                           <p className="text-[10px] uppercase tracking-wider">Get it on</p>
                           <p className="text-lg leading-tight">Google Play</p>
                        </div>
                     </button>
                  </div>

                  <div className="flex items-center gap-6 p-6 glass rounded-3xl w-fit">
                     <div className="w-24 h-24 bg-white p-2 rounded-2xl flex items-center justify-center">
                        <QrCode className="w-full h-full text-black" />
                     </div>
                     <div>
                        <p className="font-bold text-white mb-1">Escaneá para descargar</p>
                        <p className="text-xs text-gray-500">Disponible para iOS y Android</p>
                     </div>
                  </div>
               </div>

               <div className="relative hidden lg:block">
                  <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  >
                     <img 
                       src={mobileMockup} 
                       alt="App Mockup" 
                       className="w-full drop-shadow-[0_50px_50px_rgba(0,0,0,0.8)]"
                     />
                  </motion.div>
                  {/* Floating Elements */}
                  <div className="absolute top-1/4 -right-10 glass p-4 rounded-2xl shadow-2xl animate-bounce">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <p className="text-xs font-bold">Profesional en camino</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </section>
  );
};

export default AppDownload;
